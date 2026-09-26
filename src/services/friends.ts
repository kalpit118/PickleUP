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

    // Fetch requester profile for the notification title/body
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', requesterId).single()
    const requesterName = profile?.name || 'Someone'

    // Trigger push notification via Edge Function (fire and forget)
    supabase.functions.invoke('push-notifications', {
      body: {
        target_user_id: receiverId,
        title: 'New Friend Request',
        body: `${requesterName} sent you a friend request!`,
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'reject', title: 'Reject' }
        ],
        data: {
          url: '/friends', // clicking body opens friends page
          actionUrl: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/friendships?id=eq.${data.id}`,
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          },
          actionBodyMap: {
            accept: { status: 'accepted' },
            reject: { status: 'rejected' }
          }
        }
      }
    }).catch(err => console.error('Failed to trigger push notification:', err))

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
   * Get all friendships for a user (accepted only) including profile data.
   */
  async getFriends(userId: UUID) {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (error) throw error
    return data ?? []
  },

  /**
   * Get pending incoming requests for a user including profile data.
   */
  async getPendingRequests(userId: UUID) {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)')
      .eq('receiver_id', userId)
      .eq('status', 'pending')

    if (error) throw error
    return data ?? []
  },
}
