-- Drop v1 tables
drop table if exists submissions cascade;
drop table if exists challenges cascade;
drop table if exists players cascade;
drop table if exists games cascade;

-- v2 schema
create table hosts (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table invite_codes (
  code      text primary key,
  host_id   uuid references hosts(id),
  used_at   timestamptz
);

create table games (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name       text not null,
  host_id    uuid not null references hosts(id) on delete cascade,
  status     text not null default 'lobby'
             check (status in ('lobby', 'active', 'closed')),
  created_at timestamptz not null default now()
);

create table teams (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references games(id) on delete cascade,
  name       text not null,
  join_code  text unique not null,
  created_at timestamptz not null default now()
);

create table challenges (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references games(id) on delete cascade,
  title            text not null,
  description      text,
  "order"          integer not null default 0,
  winner_team_id   uuid references teams(id),
  created_at       timestamptz not null default now()
);

create table submissions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references challenges(id) on delete cascade,
  team_id       uuid not null references teams(id) on delete cascade,
  photo_url     text not null,
  submitted_at  timestamptz not null default now(),
  unique(challenge_id, team_id)
);
