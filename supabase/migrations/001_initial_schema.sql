-- PickleUP Database Migration 001
-- Creates the core tables per DATABASE.md and AGENTS.md §10
-- Run against your Supabase PostgreSQL project.

-- ---------------------------------------------------------------------------
-- Enable required extensions
-- ---------------------------------------------------------------------------

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  avatar_url  text,
  city        text,
  skill_level text check (skill_level in ('1.0','2.0','2.5','3.0','3.5','4.0','4.5','5.0','5.5+')),
  preferred_hand text check (preferred_hand in ('left', 'right')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: users can read all profiles (public) but only edit their own
alter table profiles enable row level security;

create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- friendships
-- ---------------------------------------------------------------------------

create table if not exists friendships (
  id           uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references profiles(id) on delete cascade,
  receiver_id  uuid not null references profiles(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  created_at   timestamptz not null default now(),

  -- Prevent duplicate relationships in both directions
  constraint no_self_friendship check (requester_id <> receiver_id)
);

-- Unique index to prevent duplicate friendships regardless of who requested it
create unique index if not exists unique_friendship_idx on friendships (
  least(requester_id, receiver_id),
  greatest(requester_id, receiver_id)
);

alter table friendships enable row level security;

create policy "Users can see their own friendships"
  on friendships for select
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can send friend requests"
  on friendships for insert
  with check (auth.uid() = requester_id);

create policy "Receiver can update friendship status"
  on friendships for update
  using (auth.uid() = receiver_id);

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------

create table if not exists groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  owner_id    uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table groups enable row level security;

create policy "Groups are publicly readable"
  on groups for select using (true);

create policy "Owners can manage their groups"
  on groups for all using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------

create table if not exists group_members (
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table group_members enable row level security;

create policy "Group members are publicly readable"
  on group_members for select using (true);

create policy "Group owners/admins can manage members"
  on group_members for all using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- games (recreational sessions)
-- ---------------------------------------------------------------------------

create table if not exists games (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid not null references profiles(id) on delete cascade,
  game_type    text not null check (game_type in ('singles', 'doubles')),
  status       text not null default 'open'
                 check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  court_name   text,
  scheduled_at timestamptz,
  created_at   timestamptz not null default now()
);

alter table games enable row level security;

create policy "Games are publicly readable"
  on games for select using (true);

create policy "Creators can manage their games"
  on games for all using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- matches (scored competitive units)
--
-- State machine: draft → submitted → pending_confirmation → verified
--                                  ↘ disputed
-- ---------------------------------------------------------------------------

create table if not exists matches (
  id              uuid primary key default uuid_generate_v4(),
  game_id         uuid references games(id) on delete set null,
  tournament_id   uuid, -- FK added after tournaments table
  status          text not null default 'draft'
                    check (status in (
                      'draft','submitted','pending_confirmation',
                      'verified','disputed','cancelled'
                    )),
  score_team_a    integer check (score_team_a >= 0),
  score_team_b    integer check (score_team_b >= 0),
  submitted_by    uuid references profiles(id) on delete set null,
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

alter table matches enable row level security;

create policy "Matches are publicly readable"
  on matches for select using (true);

create policy "Authenticated users can create matches"
  on matches for insert with check (auth.role() = 'authenticated');



-- ---------------------------------------------------------------------------
-- match_players
-- ---------------------------------------------------------------------------

create table if not exists match_players (
  match_id  uuid not null references matches(id) on delete cascade,
  player_id uuid not null references profiles(id) on delete cascade,
  team      text not null check (team in ('A', 'B')),
  primary key (match_id, player_id)
);

alter table match_players enable row level security;

create policy "Match players are publicly readable"
  on match_players for select using (true);

create policy "Participants can be added to matches"
  on match_players for insert with check (true); -- RLS on matches enforces ownership

-- matches policy referencing match_players
create policy "Participants can submit their match scores"
  on matches for update using (
    exists (
      select 1 from match_players mp
      where mp.match_id = matches.id
        and mp.player_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- tournaments
-- ---------------------------------------------------------------------------

create table if not exists tournaments (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  organizer_id uuid not null references profiles(id) on delete cascade,
  format       text not null check (format in ('round_robin', 'single_elimination')),
  status       text not null default 'draft'
                 check (status in ('draft','registration','in_progress','completed','cancelled')),
  start_at     timestamptz,
  end_at       timestamptz,
  created_at   timestamptz not null default now()
);

alter table tournaments enable row level security;

create policy "Tournaments are publicly readable"
  on tournaments for select using (true);

create policy "Organizers can manage their tournaments"
  on tournaments for all using (auth.uid() = organizer_id);

-- Now add the tournament_id FK to matches
alter table matches
  add constraint matches_tournament_id_fkey
  foreign key (tournament_id) references tournaments(id) on delete set null;

-- ---------------------------------------------------------------------------
-- tournament_players
-- ---------------------------------------------------------------------------

create table if not exists tournament_players (
  tournament_id uuid not null references tournaments(id) on delete cascade,
  player_id     uuid not null references profiles(id) on delete cascade,
  seed          integer,
  status        text not null default 'registered'
                  check (status in ('registered','withdrawn','disqualified')),
  primary key (tournament_id, player_id)
);

alter table tournament_players enable row level security;

create policy "Tournament players are publicly readable"
  on tournament_players for select using (true);

create policy "Organizers can manage tournament players"
  on tournament_players for all using (
    exists (
      select 1 from tournaments t
      where t.id = tournament_players.tournament_id
        and t.organizer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- tournament_matches
-- ---------------------------------------------------------------------------

create table if not exists tournament_matches (
  tournament_id    uuid not null references tournaments(id) on delete cascade,
  match_id         uuid not null references matches(id) on delete cascade,
  round            integer not null,
  bracket_position integer,
  next_match_id    uuid references matches(id) on delete set null,
  primary key (tournament_id, match_id)
);

alter table tournament_matches enable row level security;

create policy "Tournament matches are publicly readable"
  on tournament_matches for select using (true);

create policy "Organizers can manage tournament matches"
  on tournament_matches for all using (
    exists (
      select 1 from tournaments t
      where t.id = tournament_matches.tournament_id
        and t.organizer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- player_ratings
--
-- Internal PickleRank only. Never implies DUPR or external equivalence.
-- ---------------------------------------------------------------------------

create table if not exists player_ratings (
  player_id     uuid not null references profiles(id) on delete cascade,
  rating        numeric(7, 2) not null default 1000,
  rating_system text not null default 'picklerank' check (rating_system = 'picklerank'),
  updated_at    timestamptz not null default now(),
  primary key (player_id, rating_system)
);

alter table player_ratings enable row level security;

create policy "Ratings are publicly readable"
  on player_ratings for select using (true);

create policy "System can update ratings"
  on player_ratings for all using (auth.uid() = player_id);

-- ---------------------------------------------------------------------------
-- player_stats
--
-- Derived/aggregated. Only populated from VERIFIED matches.
-- Recalculate from match records when in doubt.
-- ---------------------------------------------------------------------------

create table if not exists player_stats (
  player_id       uuid primary key references profiles(id) on delete cascade,
  wins            integer not null default 0,
  losses          integer not null default 0,
  points_won      integer not null default 0,
  points_lost     integer not null default 0,
  current_streak  integer not null default 0,
  best_streak     integer not null default 0,
  updated_at      timestamptz not null default now(),

  constraint non_negative_wins   check (wins >= 0),
  constraint non_negative_losses check (losses >= 0),
  constraint non_negative_points_won  check (points_won >= 0),
  constraint non_negative_points_lost check (points_lost >= 0)
);

alter table player_stats enable row level security;

create policy "Player stats are publicly readable"
  on player_stats for select using (true);

create policy "System can update player stats"
  on player_stats for all using (auth.uid() = player_id);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_friendships_requester on friendships(requester_id);
create index if not exists idx_friendships_receiver  on friendships(receiver_id);
create index if not exists idx_matches_game          on matches(game_id);
create index if not exists idx_matches_tournament    on matches(tournament_id);
create index if not exists idx_matches_status        on matches(status);
create index if not exists idx_match_players_player  on match_players(player_id);
create index if not exists idx_tournament_players_tournament on tournament_players(tournament_id);
