/**
 * Friends service — friendship requests and management.
 */
import { supabase } from '@/lib/supabase'
import type { Friendship, FriendshipStatus, UUID } from '@/types/domain'

export const friendsService = {
  /**
   * Send a friend request.
   */
  async sendRequest(requesterId: UUID, receiverId: UUID): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .insert({ requester_id: requesterId, receiver_id: receiverId, status: 'pending' as FriendshipStatus })
      .select()
      .single()

    if (error) throw error
    return data as Friendship
  },

  /**
   * Accept a friend request.
   */
  async acceptRequest(friendshipId: UUID): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' as FriendshipStatus })
      .eq('id', friendshipId)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    return data as Friendship
  },

  /**
   * Reject a friend request.
   */
  async rejectRequest(friendshipId: UUID): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' as FriendshipStatus })
      .eq('id', friendshipId)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    return data as Friendship
  },

  /**
   * Get all friendships for a user (accepted only).
   */
  async getFriends(userId: UUID): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (error) throw error
    return (data ?? []) as Friendship[]
  },

  /**
   * Get pending incoming requests for a user.
   */
  async getPendingRequests(userId: UUID): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')

    if (error) throw error
    return (data ?? []) as Friendship[]
  },
}
