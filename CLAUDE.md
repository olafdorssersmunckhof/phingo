@AGENTS.md

# Phingo — Photo Bingo (v2)

PWA (Android/iOS) where a host creates a game with photo challenges. Teams compete by uploading one photo per challenge. The host judges each challenge by picking the best team photo; the team with the most wins is the overall winner.

## Stack

- **Next.js 16** (App Router, Turbopack) — `params` is `Promise<{...}>`, always `await params` or `use(params)` in client components
- **Neon** (serverless PostgreSQL) via `@neondatabase/serverless` — use tagged template literal `sql` from `lib/db.ts`
- **UploadThing v7** — server router in `app/api/uploadthing/core.ts`, client uploader via `genUploader` in `lib/uploadthing.ts`
- **iron-session v8** — encrypted cookie sessions for host auth
- **bcryptjs** — password hashing (10 rounds)
- **Tailwind CSS v4** with amber color scheme

## Environment variables

```
DATABASE_URL=       # Neon connection string (pooled)
UPLOADTHING_TOKEN=  # UploadThing app token
SESSION_SECRET=     # 32+ char random string for iron-session
```

`SESSION_SECRET` must also be set in Vercel project settings.

## Auth model

**Hosts:** iron-session encrypted cookie (`phingo-session`). Session contains `{ hostId, username }`. Set via `getIronSession` from `iron-session` with `await cookies()` from `next/headers`.

**Middleware** (`middleware.ts`) protects all `/host/*` routes except `/host/login` and `/host/register`. Redirects to `/host/login` if no valid session.

**Teams (players):** No auth. Identity stored in `localStorage`:
- `team_id` — UUID of the team
- `team_game_id` — UUID of the game (for smart resume)
- `team_name` — display name

**Invite codes** for host registration are inserted manually in Neon:
```sql
INSERT INTO invite_codes (code) VALUES ('BETA01'), ('BETA02');
```

## Database schema (v2)

Run `supabase/migrations/002_v2.sql` on a fresh Neon database.

```
hosts           (id, username, password_hash, created_at)
invite_codes    (code PK, host_id FK nullable, used_at nullable)

games           (id, code, name, host_id FK→hosts, status, created_at)
                status: 'lobby' | 'active' | 'closed'

teams           (id, game_id FK, name, join_code UNIQUE 6-char, created_at)

challenges      (id, game_id FK, title, description, order,
                 winner_team_id FK→teams nullable, created_at)

submissions     (id, challenge_id FK, team_id FK, photo_url, submitted_at)
                UNIQUE(challenge_id, team_id) — upsert replaces existing photo
```

Delete a game cascades to all teams, challenges, submissions.

## API routes

### Auth
```
POST /api/auth/register   body: { username, password, inviteCode }
POST /api/auth/login      body: { username, password }
POST /api/auth/logout
GET  /api/auth/me         → { hostId, username }
```

### Games (host session required for mutations)
```
GET    /api/games                    → host's games
POST   /api/games                    body: { name, challenges[], teams[] }
GET    /api/games/[gameId]
PATCH  /api/games/[gameId]           body: { name?, status?, challenges?, teamNames? }
DELETE /api/games/[gameId]           cascade delete
```

### Teams & challenges
```
GET  /api/games/[gameId]/teams
GET  /api/games/[gameId]/challenges
GET  /api/games/[gameId]/submissions/counts   → { [challengeId]: count }
POST /api/teams/join                          body: { joinCode } → { teamId, gameId, teamName }
GET  /api/teams/[teamId]/submissions?gameId=
POST /api/games/[gameId]/challenges/[challengeId]/judge  body: { winner_team_id }
GET  /api/games/[gameId]/challenges/[challengeId]/submissions
```

### Uploads
```
POST /api/submissions   body: { challenge_id, team_id, photo_url } (upsert)
POST/GET /api/uploadthing
```

## Pages

```
/                        Home: "Host" + "Join" — smart resume on load
/host/login              Login
/host/register           Register with invite code
/host/dashboard          Game list (create, delete)
/host/new                Create game (name + teams + challenges)
/host/[gameId]           Game detail — Teams tab | Challenges tab
/host/[gameId]/edit      Edit name, team names, challenges
/host/[gameId]/challenges/[challengeId]   Judge: pick winning team
/host/[gameId]/scoreboard
/join                    Enter 6-char team code
/play/[gameId]           Team challenge list
/play/[gameId]/challenges/[challengeId]   Upload/replace photo
/play/[gameId]/scoreboard
```

Every page has a "← Home" link and a "↻ Refresh" button. No polling.

## Smart resume (home screen)

On load, `app/page.tsx`:
1. Calls `GET /api/auth/me` — if successful → redirect to `/host/dashboard`
2. Checks `localStorage.team_game_id` — if present → redirect to `/play/[gameId]`

## Refresh strategy

No `setInterval`. Each page has a manual ↻ Refresh button calling `fetchData()`. Mutations (upload, judge, start/close game, edit) call `fetchData()` immediately after completing.

## Key gotchas

- iron-session in route handlers: `getIronSession<SessionData>(await cookies(), sessionOptions)` — note the `await` on `cookies()`
- Middleware uses `getIronSession(request, response, sessionOptions)` — different signature from route handlers
- UploadThing imports from `uploadthing/next` (subpath), not `@uploadthing/next`
- Neon `sql` returns `Record<string, any>[]` — don't annotate forEach callback types
- `next.config.ts` uses `turbopack: {}` to avoid Turbopack/webpack conflict warning
- No next-pwa (incompatible with Turbopack in Next.js 16); PWA works via plain `manifest.json`
- PhotoUpload component uses `teamId` prop (not `playerId`)

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm test          # Vitest watch
npm run test:run  # Vitest single run
```

## Deployment

- Hosted on **Vercel** (auto-deploys from `master` branch: `olafdorssersmunckhof/phingo`)
- Root directory in Vercel: `phingo`
- Database: **Neon** (eu-central-1)
- File storage: **UploadThing** (sea1 region)
- Add `SESSION_SECRET` env var in Vercel project settings
