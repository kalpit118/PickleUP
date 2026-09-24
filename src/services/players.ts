/**
 * Players service — profile read/write.
 * All database access for player profiles lives here.
 */
import { supabase } from '@/lib/supabase'
import type { Profile, UUID } from '@/types/domain'

export const playersService = {
  /**
   * Fetch a player profile by ID.
   */
  async getProfile(playerId: UUID): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .single()

    if (error) throw error
    return data as Profile
  },

  /**
   * Upsert the current user's profile.
   */
  async upsertProfile(profile: Partial<Profile> & { id: UUID }): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ ...profile, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  /**
   * Search profiles by name (case-insensitive partial match).
   */
  async searchProfiles(query: string, limit = 20): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Profile[]
  },
}
