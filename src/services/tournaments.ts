/**
 * Tournaments service — tournament management.
 * Phase 4: round robin and single elimination.
 */
import { supabase } from '@/lib/supabase'
import type { Tournament, TournamentPlayer, UUID } from '@/types/domain'

export const tournamentsService = {
  /**
   * Create a tournament.
   */
  async createTournament(
    tournament: Omit<Tournament, 'id' | 'status' | 'created_at'>
  ): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({ ...tournament, status: 'draft' })
      .select()
      .single()

    if (error) throw error
    return data as Tournament
  },

  /**
   * Get tournament by ID.
   */
  async getTournament(tournamentId: UUID): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (error) throw error
    return data as Tournament
  },

  /**
   * List tournaments (public — no auth required for read).
   */
  async listTournaments(limit = 20): Promise<Tournament[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .neq('status', 'cancelled')
      .order('start_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Tournament[]
  },

  /**
   * Register a player for a tournament.
   */
  async registerPlayer(tournamentId: UUID, playerId: UUID): Promise<TournamentPlayer> {
    const { data, error } = await supabase
      .from('tournament_players')
      .insert({ tournament_id: tournamentId, player_id: playerId, status: 'registered' })
      .select()
      .single()

    if (error) throw error
    return data as TournamentPlayer
  },
}
