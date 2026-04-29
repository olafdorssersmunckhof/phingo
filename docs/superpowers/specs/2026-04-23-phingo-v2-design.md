# Phingo v2 — Design Spec

Date: 2026-04-23

## Overview

Rebuild of Phingo with proper host authentication, team-based play (multiple members per team), manual refresh, and game management (edit + delete). The photo-per-team-per-challenge model replaces the photo-per-player model.

---

## Database Schema

```sql
hosts (
  id             uuid PK default gen_random_uuid(),
  username       text UNIQUE NOT NULL,
  password_hash  text NOT NULL,
  created_at     timestamptz NOT NULL default now()
)

invite_codes (
  code       text PK,
  host_id    uuid REFERENCES hosts(id),   -- null = unused
  used_at    timestamptz                  -- null = unused
)

games (
  id          uuid PK default gen_random_uuid(),
  code        text UNIQUE NOT NULL,        -- 4-char room code (display only)
  name        text NOT NULL,
  host_id     uuid NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  status      text NOT NULL default 'lobby'
              CHECK (status IN ('lobby','active','closed')),
  created_at  timestamptz NOT NULL default now()
)
-- host_token removed; auth is session-based

teams (
  id         uuid PK default gen_random_uuid(),
  game_id    uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name       text NOT NULL,
  join_code  text UNIQUE NOT NULL,   -- 6-char alphanumeric, generated server-side
  created_at timestamptz NOT NULL default now()
)
-- replaces 'players' table

challenges (
  id               uuid PK default gen_random_uuid(),
  game_id          uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  "order"          integer NOT NULL default 0,
  winner_team_id   uuid REFERENCES teams(id),   -- replaces winner_player_id
  created_at       timestamptz NOT NULL default now()
)

submissions (
  id            uuid PK default gen_random_uuid(),
  challenge_id  uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  team_id       uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  photo_url     text NOT NULL,
  submitted_at  timestamptz NOT NULL default now(),
  UNIQUE(challenge_id, team_id)   -- one photo per team per challenge, upsert replaces
)
```

Invite codes are inserted manually by the admin via the Neon SQL editor:
```sql
INSERT INTO invite_codes (code) VALUES ('BETA01'), ('BETA02');
```

---

## Auth

**Library:** `iron-session` (encrypted cookie, no DB sessions table)
**Password hashing:** `bcryptjs`

### Registration (`/host/register`)
1. User submits username, password, invite code
2. Server checks: invite code exists + unused, username not taken
3. Password hashed with bcrypt (10 rounds)
4. Host inserted, invite code marked used (`host_id`, `used_at`)
5. Session created immediately → redirect to `/host/dashboard`

### Login (`/host/login`)
1. Username + password submitted
2. Hash compared with bcrypt
3. On success: iron-session cookie set with `{ hostId, username }`
4. Redirect to `/host/dashboard`

### Session protection
Next.js middleware protects all `/host/*` routes except `/host/login` and `/host/register`. Unauthenticated requests redirect to `/host/login`.

Logout: POST `/api/auth/logout` destroys cookie, redirects to `/`.

---

## API Routes

### Auth
```
POST /api/auth/register   body: { username, password, inviteCode }
POST /api/auth/login      body: { username, password }
POST /api/auth/logout
GET  /api/auth/me         → { hostId, username }
```

### Games
```
POST   /api/games                  body: { name, challenges[], teams[] }
GET    /api/games                  → all games for logged-in host
GET    /api/games/[gameId]         → game details
PATCH  /api/games/[gameId]         body: { name?, status?, challenges?, teams? }
DELETE /api/games/[gameId]         → cascade deletes all related data
```

### Teams
```
GET  /api/games/[gameId]/teams     → teams with join codes (host only)
POST /api/teams/join               body: { joinCode } → { teamId, gameId }
```

### Challenges & Judging
```
GET   /api/games/[gameId]/challenges
PATCH /api/games/[gameId]/challenges/[challengeId]
POST  /api/games/[gameId]/challenges/[challengeId]/judge   body: { teamId }
GET   /api/games/[gameId]/challenges/[challengeId]/submissions
```

### Submissions
```
POST /api/submissions              body: { challengeId, teamId, photoUrl } (upsert)
GET  /api/teams/[teamId]/submissions?gameId=
```

All host mutation routes validate session server-side (no host_token header).

---

## Pages & Navigation

### Smart resume
On app open (`/`):
- Active iron-session cookie → redirect to `/host/dashboard`
- `team_id` in localStorage → redirect to `/play/[gameId]`

### Page map

```
/                       Home: "Host" + "Join" buttons
/host/login             Login form
/host/register          Register with invite code
/host/dashboard         List of host's games (create, delete)
/host/[gameId]          Game detail — two tabs: Teams | Challenges
/host/[gameId]/edit     Edit game (name, challenges, team names)
/host/[gameId]/challenges/[challengeId]   Judge view: pick winning team

/join                   Enter 6-char team code (no name required)
/play/[gameId]          Team challenge list
/play/[gameId]/challenges/[challengeId]   Upload/replace photo
/play/[gameId]/scoreboard
/host/[gameId]/scoreboard
```

Every page has a "Home" link in the header.

### Host game detail — two views
- **Teams tab:** shows each team name, join code (copyable), and how many challenges they've submitted
- **Challenges tab:** shows each challenge, how many teams submitted, winner if judged; tap to judge

### Game management
- **Create:** name + challenges + team names → server generates 6-char join codes per team
- **Edit:** change game name, add/remove/rename challenges, rename teams (join codes unchanged)
- **Delete:** confirmation dialog → DELETE /api/games/[gameId] → redirect to dashboard

---

## Refresh Strategy

No `setInterval` polling. Each page has a manual refresh button (↻) that re-fetches all data for that view. Mutations (upload, judge, start game, close game) trigger an immediate re-fetch of the current page's data after the API call completes.

---

## Team Join Flow

1. Team receives their 6-char code from the host (e.g. displayed on a screen)
2. Any team member opens `/join`, enters the code
3. Server looks up team by join code, returns `{ teamId, gameId }`
4. `team_id` and `team_game_id` stored in localStorage
5. Redirect to `/play/[gameId]`
6. Members are anonymous within the team — no name required

Multiple members can join the same code on different devices. Any member can upload the team's photo; the last upload replaces the previous one (upsert).

---

## Dependencies to Add

```
iron-session   — encrypted cookie sessions
bcryptjs       — password hashing
@types/bcryptjs
```

---

## What Changes vs v1

| v1 | v2 |
|---|---|
| No auth — host_token in localStorage | iron-session cookie auth |
| Players (individual) | Teams (group with shared code) |
| Polling every 4s | Manual refresh button |
| No game editing | Edit game name, challenges, team names |
| No game deletion | Delete with cascade |
| Home screen has resume buttons | Smart redirect on open |
| No registration | Invite-only registration |
