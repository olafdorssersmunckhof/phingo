-- Players before challenges so FK can reference it
create table games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  host_token uuid not null default gen_random_uuid(),
  status text not null default 'lobby'
    check (status in ('lobby', 'active', 'closed')),
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  title text not null,
  description text,
  "order" integer not null default 0,
  winner_player_id uuid references players(id),
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  photo_url text not null,
  submitted_at timestamptz not null default now(),
  unique(challenge_id, player_id)
);

-- Enable RLS
alter table games enable row level security;
alter table challenges enable row level security;
alter table players enable row level security;
alter table submissions enable row level security;

-- Read policies: all public (mutations controlled in API routes via host_token)
create policy "games_select" on games for select using (true);
create policy "challenges_select" on challenges for select using (true);
create policy "players_select" on players for select using (true);
create policy "players_insert" on players for insert with check (true);
create policy "submissions_select" on submissions for select using (true);
create policy "submissions_insert" on submissions for insert with check (true);
create policy "submissions_update" on submissions for update using (true);

-- Enable Realtime
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table challenges;
alter publication supabase_realtime add table submissions;
