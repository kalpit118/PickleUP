/**
 * Matches service — the core of the match engine.
 *
 * Match state machine:
 *   DRAFT → SUBMITTED → PENDING_CONFIRMATION → VERIFIED
 *                     ↘ DISPUTED
 *
 * Never update official statistics from anything other than VERIFIED matches.
 */
import { supabase } from '@/lib/supabase'
import type { Match, MatchPlayer, MatchStatus, UUID } from '@/types/domain'

export const matchesService = {
  /**
   * Create a new match in DRAFT state.
   */
  async createMatch(match: Omit<Match, 'id' | 'status' | 'verified_at' | 'created_at'>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert({ ...match, status: 'draft' as MatchStatus })
      .select()
      .single()

    if (error) throw error
    return data as Match
  },

  /**
   * Fetch a match by ID.
   */
  async getMatch(matchId: UUID): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (error) throw error
    return data as Match
  },

  /**
   * Fetch match players for a given match.
   */
  async getMatchPlayers(matchId: UUID): Promise<MatchPlayer[]> {
    const { data, error } = await supabase
      .from('match_players')
      .select('*')
      .eq('match_id', matchId)

    if (error) throw error
    return (data ?? []) as MatchPlayer[]
  },

  /**
   * Submit a score. Transitions match from DRAFT → SUBMITTED.
   */
  async submitScore(matchId: UUID, scoreTeamA: number, scoreTeamB: number, submittedBy: UUID): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({
        status: 'submitted' as MatchStatus,
        score_team_a: scoreTeamA,
        score_team_b: scoreTeamB,
        submitted_by: submittedBy,
      })
      .eq('id', matchId)
      .eq('status', 'draft') // Guard: only transition from DRAFT
      .select()
      .single()

    if (error) throw error
    return data as Match
  },

  /**
   * Confirm a submitted score. Transitions SUBMITTED → PENDING_CONFIRMATION.
   */
  async confirmScore(matchId: UUID): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({ status: 'pending_confirmation' as MatchStatus })
      .eq('id', matchId)
      .eq('status', 'submitted') // Guard: only transition from SUBMITTED
      .select()
      .single()

    if (error) throw error
    return data as Match
  },

  /**
   * Dispute a score. Transitions SUBMITTED or PENDING_CONFIRMATION → DISPUTED.
   */
  async disputeScore(matchId: UUID): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({ status: 'disputed' as MatchStatus })
      .eq('id', matchId)
      .in('status', ['submitted', 'pending_confirmation'])
      .select()
      .single()

    if (error) throw error
    return data as Match
  },

  /**
   * Fetch a player's match history (verified matches only by default).
   */
  async getPlayerMatchHistory(playerId: UUID, limit = 20): Promise<Match[]> {
    const { data, error } = await supabase
      .from('match_players')
      .select('matches(*)')
      .eq('player_id', playerId)
      .limit(limit)

    if (error) throw error
    return (data?.map((row: { matches: unknown }) => row.matches) ?? []) as Match[]
  },
}
