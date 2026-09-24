# Development Plan

## Step 1 — Repository Setup

Create:

```text
pickleball-platform/
  src/
  public/
  supabase/
  docs/
  tests/
  .env.example
  README.md
  package.json
```

## Step 2 — Frontend Foundation

Implement:

- Routing
- Layout
- Responsive navigation
- Authentication screens
- PWA manifest
- Loading/error states

## Step 3 — Database

Create migrations for:

- profiles
- friendships
- groups
- group_members
- games
- matches
- match_players
- tournaments
- tournament_players
- tournament_matches
- player_ratings
- player_stats

## Step 4 — Authentication and Profiles

Complete signup/login/profile creation before building social features.

## Step 5 — Match Engine

Build and test the full flow:

```text
Create Game
→ Add Players
→ Play
→ Submit Score
→ Confirm
→ Verify
→ Update History
→ Update Stats
```

## Step 6 — Social Features

Implement friends, groups, invitations, and basic notifications.

## Step 7 — Tournament Engine

Start with round robin and single elimination. Test bracket generation extensively before adding more formats.

## Step 8 — Analytics

Build statistics from verified match data. Add derived analytics after the underlying data is reliable.

## Step 9 — Deployment

Deploy frontend to Cloudflare Pages and configure production Supabase.

## Step 10 — Backup and Recovery Test

Before calling the MVP complete:

1. Export database.
2. Create a fresh test project.
3. Restore the backup.
4. Verify users/matches/tournaments.
5. Redeploy against the restored database.

A backup that has never been restored is not a fully tested backup strategy.
