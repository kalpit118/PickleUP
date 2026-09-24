/**
 * Core domain types for PickleUP.
 *
 * IMPORTANT: Do not use these terms interchangeably.
 *   Game   → a recreational session/booking
 *   Match  → a scored competitive unit within a game or tournament
 *   Team   → one side in a match (1 player for singles, 2 for doubles)
 *   Player → a registered user with a profile
 *
 * See AGENTS.md §6 for the canonical domain model.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type UUID = string

export type Timestamp = string // ISO 8601

// ---------------------------------------------------------------------------
// Player / Profile
// ---------------------------------------------------------------------------

export interface Profile {
  id: UUID
  name: string
  avatar_url: string | null
  city: string | null
  skill_level: SkillLevel | null
  preferred_hand: 'left' | 'right' | null
  created_at: Timestamp
  updated_at: Timestamp
}

export type SkillLevel = '1.0' | '2.0' | '2.5' | '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | '5.5+'

// ---------------------------------------------------------------------------
// Friendship
// ---------------------------------------------------------------------------

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'

export interface Friendship {
  id: UUID
  requester_id: UUID
  receiver_id: UUID
  status: FriendshipStatus
  created_at: Timestamp
}

// ---------------------------------------------------------------------------
// Game (recreational session)
// ---------------------------------------------------------------------------

export type GameType = 'singles' | 'doubles'

export type GameStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface Game {
  id: UUID
  created_by: UUID
  game_type: GameType
  status: GameStatus
  court_name: string | null
  scheduled_at: Timestamp | null
  created_at: Timestamp
}

// ---------------------------------------------------------------------------
// Match (scored competitive unit)
// ---------------------------------------------------------------------------

/**
 * Score verification state machine:
 *
 *   DRAFT → SUBMITTED → PENDING_CONFIRMATION → VERIFIED
 *                     ↘ DISPUTED
 *
 * Exception: organizer-entered tournament scores go directly to VERIFIED.
 * Never silently modify a VERIFIED historical score — use an audit trail.
 */
export type MatchStatus =
  | 'draft'
  | 'submitted'
  | 'pending_confirmation'
  | 'verified'
  | 'disputed'
  | 'cancelled'

export interface Match {
  id: UUID
  game_id: UUID | null
  tournament_id: UUID | null
  status: MatchStatus
  score_team_a: number | null
  score_team_b: number | null
  submitted_by: UUID | null
  verified_at: Timestamp | null
  created_at: Timestamp
}

export interface MatchPlayer {
  match_id: UUID
  player_id: UUID
  team: 'A' | 'B'
}

// ---------------------------------------------------------------------------
// Tournament
// ---------------------------------------------------------------------------

export type TournamentFormat = 'round_robin' | 'single_elimination'
// Future: 'double_elimination' | 'pool_knockout'

export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'

export interface Tournament {
  id: UUID
  name: string
  organizer_id: UUID
  format: TournamentFormat
  status: TournamentStatus
  start_at: Timestamp | null
  end_at: Timestamp | null
  created_at: Timestamp
}

export interface TournamentPlayer {
  tournament_id: UUID
  player_id: UUID
  seed: number | null
  status: 'registered' | 'withdrawn' | 'disqualified'
}

export interface TournamentMatch {
  tournament_id: UUID
  match_id: UUID
  round: number
  bracket_position: number | null
  next_match_id: UUID | null
}

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

/**
 * Internal platform rating only.
 * Label as "PickleRank" in UI — never imply equivalence to DUPR or external systems.
 * See AGENTS.md §8.
 */
export type RatingSystem = 'picklerank'

export interface PlayerRating {
  player_id: UUID
  rating: number
  rating_system: RatingSystem
  updated_at: Timestamp
}

// ---------------------------------------------------------------------------
// Player Stats
// ---------------------------------------------------------------------------

/**
 * Derived/aggregated stats.
 * Only updated from VERIFIED matches.
 * Prefer recalculating from match records rather than treating this as sole truth.
 */
export interface PlayerStats {
  player_id: UUID
  wins: number
  losses: number
  points_won: number
  points_lost: number
  current_streak: number
  best_streak: number
  updated_at: Timestamp
}
