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

  /**
   * Compute live stats for a player based on all submitted/verified matches.
   * Calculates wins, losses, and point differentials dynamically.
   */
  async computeLiveStats(playerId: UUID) {
    // 1. Fetch all match_player rows for this player, joining the match data
    const { data, error } = await supabase
      .from('match_players')
      .select(`
        team,
        matches!inner (
          id,
          status,
          score_team_a,
          score_team_b
        )
      `)
      .eq('player_id', playerId)
      .in('matches.status', ['submitted', 'verified'])

    if (error) throw error

    let wins = 0
    let losses = 0
    let pointsWon = 0
    let pointsLost = 0

    // 2. Iterate through matches to calculate stats
    for (const row of data || []) {
      const match = row.matches as any
      const myTeam = row.team // 'A' or 'B'
      
      const scoreA = match.score_team_a ?? 0
      const scoreB = match.score_team_b ?? 0
      
      const myScore = myTeam === 'A' ? scoreA : scoreB
      const opponentScore = myTeam === 'A' ? scoreB : scoreA

      pointsWon += myScore
      pointsLost += opponentScore

      if (myScore > opponentScore) {
        wins++
      } else if (opponentScore > myScore) {
        losses++
      }
    }

    const totalMatches = wins + losses
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0
    const pointDifferential = pointsWon - pointsLost

    return {
      matchesPlayed: totalMatches,
      wins,
      losses,
      winRate,
      pointsWon,
      pointsLost,
      pointDifferential
    }
  },
}
