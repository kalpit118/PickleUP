/**
 * Confirmations Service — match acceptance/rejection by opponents.
 *
 * When a match is submitted, one match_confirmation row is created per opponent.
 * If all opponents accept → match becomes VERIFIED.
 * If any reject → match becomes DISPUTED (but can be re-accepted later).
 */
import { supabase } from '@/lib/supabase'
import type { UUID } from '@/types/domain'

export const confirmationsService = {
  /**
   * Create pending confirmation rows for a list of opponent player IDs.
   */
  async createConfirmations(matchId: UUID, opponentIds: UUID[]): Promise<void> {
    if (opponentIds.length === 0) return

    const rows = opponentIds.map(playerId => ({
      match_id: matchId,
      player_id: playerId,
      status: 'pending',
    }))

    const { data: inserted, error } = await supabase
      .from('match_confirmations')
      .insert(rows)
      .select('id, player_id')

    if (error) throw error

    // Fetch the submitter's name (the current user)
    const { data: { user } } = await supabase.auth.getUser()
    const submitterName = user?.user_metadata?.name || 'A player'

    // Send push notifications to opponents
    if (inserted) {
      inserted.forEach((conf) => {
        supabase.functions.invoke('push-notifications', {
          body: {
            target_user_id: conf.player_id,
            title: 'Match Score Submitted',
            body: `${submitterName} recorded a match you played in. Tap to confirm the score!`,
            data: {
              url: '/analytics', // Currently match history is on Analytics/Profile
            }
          }
        }).catch(err => console.error('Failed to send match push:', err))
      })
    }
  },

  /**
   * Accept a match confirmation. If all confirmations for the match are
   * now accepted, transition the match to VERIFIED.
   * Returns whether the match is now fully verified.
   */
  async acceptConfirmation(confirmationId: UUID, matchId: UUID): Promise<boolean> {
    // 1. Mark this confirmation accepted
    const { error: updateError } = await supabase
      .from('match_confirmations')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', confirmationId)

    if (updateError) throw updateError

    // 2. Check if all confirmations for the match are accepted
    const { data: allConfirms, error: fetchError } = await supabase
      .from('match_confirmations')
      .select('status')
      .eq('match_id', matchId)

    if (fetchError) throw fetchError

    const allAccepted = (allConfirms ?? []).every((c: any) => c.status === 'accepted')

    if (allAccepted) {
      // 3. Transition match to VERIFIED
      const { error: verifyError } = await supabase
        .from('matches')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', matchId)
        .in('status', ['submitted', 'pending_confirmation', 'disputed'])

      if (verifyError) throw verifyError
      return true
    } else {
      // Move to pending_confirmation if it was just submitted/disputed
      const { error: pendingError } = await supabase
        .from('matches')
        .update({ status: 'pending_confirmation' })
        .eq('id', matchId)
        .in('status', ['submitted', 'disputed'])

      if (pendingError) throw pendingError
      return false
    }
  },

  /**
   * Reject a match confirmation. Transitions match to DISPUTED.
   * Opponent can still re-accept later (just call acceptConfirmation again).
   */
  async rejectConfirmation(confirmationId: UUID, matchId: UUID): Promise<void> {
    const { error: updateError } = await supabase
      .from('match_confirmations')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', confirmationId)

    if (updateError) throw updateError

    // Transition match to DISPUTED
    const { error: disputeError } = await supabase
      .from('matches')
      .update({ status: 'disputed' })
      .eq('id', matchId)
      .in('status', ['submitted', 'pending_confirmation'])

    if (disputeError) throw disputeError
  },

  /**
   * Fetch pending match confirmations for a player, joined with match data.
   */
  async getPendingForPlayer(playerId: UUID) {
    const { data, error } = await supabase
      .from('match_confirmations')
      .select(`
        id,
        match_id,
        status,
        created_at,
        matches (
          id,
          score_team_a,
          score_team_b,
          status,
          submitted_by,
          created_at,
          match_players (
            player_id,
            team,
            profiles (id, name)
          )
        )
      `)
      .eq('player_id', playerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Fetch all match confirmations for a player (any status), for a "match history" view.
   */
  async getAllForPlayer(playerId: UUID) {
    const { data, error } = await supabase
      .from('match_confirmations')
      .select(`
        id,
        match_id,
        status,
        created_at,
        responded_at,
        matches (
          id,
          score_team_a,
          score_team_b,
          status,
          submitted_by
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },
}
