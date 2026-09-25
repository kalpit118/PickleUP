-- PickleUP Migration 002
-- Adds trusted_players, match_confirmations, and notifications tables.
-- Apply in Supabase SQL Editor after 001_initial_schema.sql

-- ---------------------------------------------------------------------------
-- trusted_players
-- A one-directional trust grant: "I trust this player to submit accurate scores."
-- If A trusts B, then B's submitted matches involving A are auto-verified.
-- ---------------------------------------------------------------------------

create table if not exists trusted_players (
  truster_id  uuid not null references profiles(id) on delete cascade,
  trustee_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (truster_id, trustee_id),
  constraint no_self_trust check (truster_id <> trustee_id)
);

alter table trusted_players enable row level security;

create policy "Users can see their own trust records"
  on trusted_players for select
  using (auth.uid() = truster_id or auth.uid() = trustee_id);

create policy "Users can grant trust"
  on trusted_players for insert
  with check (auth.uid() = truster_id);

create policy "Users can revoke their own trust"
  on trusted_players for delete
  using (auth.uid() = truster_id);

-- ---------------------------------------------------------------------------
-- match_confirmations
-- Per-player confirmation status for a submitted match.
-- Created when a match is submitted; one row per opponent (non-submitter).
-- ---------------------------------------------------------------------------

create table if not exists match_confirmations (
  id          uuid primary key default uuid_generate_v4(),
  match_id    uuid not null references matches(id) on delete cascade,
  player_id   uuid not null references profiles(id) on delete cascade,
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'rejected')),
  responded_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (match_id, player_id)
);

alter table match_confirmations enable row level security;

create policy "Match confirmations are publicly readable"
  on match_confirmations for select using (true);

create policy "Anyone can create confirmations"
  on match_confirmations for insert with check (auth.role() = 'authenticated');

create policy "Players can update their own confirmation"
  on match_confirmations for update
  using (auth.uid() = player_id);

create index if not exists idx_match_confirmations_player on match_confirmations(player_id);
create index if not exists idx_match_confirmations_match  on match_confirmations(match_id);
create index if not exists idx_match_confirmations_status on match_confirmations(status);

-- ---------------------------------------------------------------------------
-- Allow matches to also be updated by the submitter (for status transitions
-- like disputed→pending_confirmation when opponent re-accepts)
-- ---------------------------------------------------------------------------

create policy "Submitter can update their own match"
  on matches for update
  using (auth.uid() = submitted_by);
