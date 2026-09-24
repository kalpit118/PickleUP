# Database Design

## Database

PostgreSQL through Supabase.

## Core Tables

### users / profiles

- id
- name
- email reference where appropriate
- avatar_url
- city
- skill_level
- preferred_hand
- created_at
- updated_at

### friendships

- id
- requester_id
- receiver_id
- status
- created_at

### groups

- id
- name
- description
- owner_id
- created_at

### group_members

- group_id
- user_id
- role
- joined_at

### games

Represents a recreational game/session.

- id
- created_by
- game_type
- status
- court_name/location
- scheduled_at
- created_at

### matches

Represents a scored competitive match.

- id
- game_id nullable
- tournament_id nullable
- status
- score_team_a
- score_team_b
- submitted_by
- verified_at
- created_at

### match_players

- match_id
- player_id
- team

### tournaments

- id
- name
- organizer_id
- format
- status
- start_at
- end_at
- created_at

### tournament_players

- tournament_id
- player_id
- seed
- status

### tournament_matches

- tournament_id
- match_id
- round
- bracket_position
- next_match_id nullable

### player_ratings

- player_id
- rating
- rating_system
- updated_at

### player_stats

Derived/aggregated statistics. Prefer recalculating from verified matches where practical rather than treating this table as the only source of truth.

- player_id
- wins
- losses
- points_won
- points_lost
- current_streak
- best_streak
- updated_at

## Important Rule

A match should not affect official statistics/rating until it is verified or otherwise marked trusted by the product's result-validation rules.

## Data Integrity

Use foreign keys, unique constraints, check constraints, indexes, and Row Level Security (RLS).
