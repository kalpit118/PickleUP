/**
 * Analytics service — player statistics and performance data.
 *
 * IMPORTANT: Only reads from VERIFIED matches.
 * See AGENTS.md §9 for analytics rules.
 */
import { supabase } from '@/lib/supabase'
import type { PlayerStats, UUID } from '@/types/domain'

export const analyticsService = {
  /**
   * Get cached player stats snapshot.
   * These are derived from verified matches. Call recalculate() to refresh.
   */
  async getPlayerStats(playerId: UUID): Promise<PlayerStats | null> {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle()

    if (error) throw error
    return data as PlayerStats | null
  },

  /**
   * Head-to-head record between two players (verified matches only).
   */
  async getHeadToHead(playerAId: UUID, playerBId: UUID) {
    // Both players must appear in the same match
    const { data, error } = await supabase
      .from('match_players')
      .select('match_id, team, matches!inner(status, score_team_a, score_team_b)')
      .in('player_id', [playerAId, playerBId])
      .eq('matches.status', 'verified')

    if (error) throw error
    return data ?? []
  },
}
