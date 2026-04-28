@AGENTS.md

# Phingo — Photo Bingo

PWA (Android/iOS) where a host creates a game with photo challenges and players compete by uploading photos. The host judges each challenge by picking the best photo; the player with the most wins is the overall winner.

## Stack

- **Next.js 16** (App Router, Turbopack) — `params` is `Promise<{...}>`, always `await params` or `use(params)` in client components
- **Neon** (serverless PostgreSQL) via `@neondatabase/serverless` — use tagged template literal `sql` from `lib/db.ts`
- **UploadThing v7** — server router in `app/api/uploadthing/core.ts`, client uploader via `genUploader` in `lib/uploadthing.ts`
- **Tailwind CSS v4** with amber color scheme
- **Vitest** for unit tests

## Environment variables

```
DATABASE_URL=   # Neon connection string (pooled)
UPLOADTHING_TOKEN=  # UploadThing app token
```

## Auth model

No auth system. Identity is stored in `localStorage`:
- Host: `host_token_<gameId>` (UUID, validated server-side on every mutation)
- Host game: `host_game_id` (for resume on home screen)
- Player: `player_id`, `player_name`, `player_game_id` (for resume on home screen)

## Database schema

4 tables in `supabase/migrations/001_initial.sql`:

```
games        (id, code, name, host_token, status, created_at)
players      (id, game_id, name, created_at)
challenges   (id, game_id, title, description, order, winner_player_id, created_at)
submissions  (id, challenge_id, player_id, photo_url, submitted_at)
             unique(challenge_id, player_id)
```

Game status values: `lobby` → `active` → `closed`

## API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/games` | Create game + challenges; returns `{id, code, host_token}` |
| GET | `/api/games/[gameId]` | Get game details |
| PATCH | `/api/games/[gameId]/status` | Update status (host_token required) |
| GET | `/api/games/[gameId]/challenges` | List challenges |
| GET | `/api/games/[gameId]/players` | List players |
| GET | `/api/games/[gameId]/submissions/counts` | Submission count per challenge |
| POST | `/api/players` | Join game by code; returns `{player_id, game_id}` |
| POST | `/api/submissions` | Save photo URL after upload (upserts) |
| GET | `/api/games/[gameId]/challenges/[challengeId]/submissions` | All submissions for judging |
| POST | `/api/games/[gameId]/challenges/[challengeId]/judge` | Pick winner (host_token required) |
| GET | `/api/players/[playerId]/submissions?gameId=` | Player's own submissions |
| POST/GET | `/api/uploadthing` | UploadThing file router |

## Realtime strategy

Polling every 4 seconds everywhere (no websockets/Supabase Realtime). Pattern:

```typescript
useEffect(() => {
  fetchData()
  const id = setInterval(fetchData, 4000)
  return () => clearInterval(id)
}, [])
```

## Key pages

```
/                           Home (resume buttons if active game in localStorage)
/host/new                   Create game form
/host/[gameId]              Host dashboard — room code, player list, challenge list
/host/[gameId]/challenges/[challengeId]   Judge view — pick winner
/host/[gameId]/scoreboard   Scoreboard
/join                       Join by room code
/play/[gameId]              Player challenge list
/play/[gameId]/challenges/[challengeId]   Upload photo
/play/[gameId]/scoreboard   Scoreboard
```

## PWA

- `public/manifest.json` — standalone display, amber theme, icons at `/icon-192.png` and `/icon-512.png`
- `app/layout.tsx` — `appleWebApp` metadata for iOS install
- **No next-pwa** (incompatible with Turbopack in Next.js 16)

## Known gotchas

- `vi.mock` factories are hoisted; mocks referenced inside them must use `vi.hoisted(() => vi.fn())` not `const mockX = vi.fn()`
- UploadThing imports from `uploadthing/next` (subpath), not a separate `@uploadthing/next` package
- Neon `sql` returns `Record<string, any>[]` — don't annotate forEach callback types explicitly
- `next.config.ts` uses `turbopack: {}` to avoid webpack/Turbopack conflict warning

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm test          # Vitest watch
npm run test:run  # Vitest single run
```

## Deployment

- Hosted on **Vercel** (auto-deploys from `master` branch of GitHub repo `olafdorssersmunckhof/phingo`)
- Root directory in Vercel: `phingo`
- Database: **Neon** (eu-central-1)
- File storage: **UploadThing** (sea1 region) — add Vercel domain to allowed origins in UploadThing dashboard after deploy
