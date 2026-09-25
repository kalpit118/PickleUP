/**
 * Trust Service — manage bidirectional player trust grants.
 *
 * Trust is one-directional: "I (truster) trust you (trustee) to submit accurate scores."
 * If A trusts B and B submits a match involving A → auto-verified.
 */
import { supabase } from '@/lib/supabase'
import type { UUID } from '@/types/domain'

export const trustService = {
  /**
   * Grant trust to a player.
   */
  async grantTrust(trusterId: UUID, trusteeId: UUID): Promise<void> {
    const { error } = await supabase
      .from('trusted_players')
      .insert({ truster_id: trusterId, trustee_id: trusteeId })

    if (error) throw error
  },

  /**
   * Revoke trust from a player.
   */
  async revokeTrust(trusterId: UUID, trusteeId: UUID): Promise<void> {
    const { error } = await supabase
      .from('trusted_players')
      .delete()
      .eq('truster_id', trusterId)
      .eq('trustee_id', trusteeId)

    if (error) throw error
  },

  /**
   * Get all player IDs that a user trusts.
   */
  async getTrustedIds(trusterId: UUID): Promise<UUID[]> {
    const { data, error } = await supabase
      .from('trusted_players')
      .select('trustee_id')
      .eq('truster_id', trusterId)

    if (error) throw error
    return (data ?? []).map((r: any) => r.trustee_id)
  },

  /**
   * Check if truster trusts trustee.
   */
  async isTrusted(trusterId: UUID, trusteeId: UUID): Promise<boolean> {
    const { data, error } = await supabase
      .from('trusted_players')
      .select('truster_id')
      .eq('truster_id', trusterId)
      .eq('trustee_id', trusteeId)
      .maybeSingle()

    if (error) throw error
    return data !== null
  },

  /**
   * For a set of opponent IDs, check which ones trust the submitter.
   * Returns the IDs of opponents who trust the submitter (their matches can be auto-verified).
   */
  async getOpponentsTrustingSubmitter(opponentIds: UUID[], submitterId: UUID): Promise<UUID[]> {
    if (opponentIds.length === 0) return []

    const { data, error } = await supabase
      .from('trusted_players')
      .select('truster_id')
      .in('truster_id', opponentIds)
      .eq('trustee_id', submitterId)

    if (error) throw error
    return (data ?? []).map((r: any) => r.truster_id)
  },
}
