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
