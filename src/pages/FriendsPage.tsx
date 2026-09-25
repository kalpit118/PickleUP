/**
 * FriendsPage — Phase 3 Social hub.
 * Search players, manage friend requests, view friends list, and manage trust.
 */
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { friendsService } from '@/services/friends'
import { playersService } from '@/services/players'
import { trustService } from '@/services/trust'
import type { Profile } from '@/types/domain'

export default function FriendsPage() {
  const { user } = useAuth()
  
  // State
  const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [trustedIds, setTrustedIds] = useState<string[]>([])
  
  const [loading, setLoading] = useState(true)

  // 3-dot menu open state: friendshipId -> boolean
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [trustLoading, setTrustLoading] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch initial data
  useEffect(() => {
    if (!user) return
    let mounted = true

    async function load() {
      try {
        const [friendsData, requestsData, trustedData] = await Promise.all([
          friendsService.getFriends(user!.id),
          friendsService.getPendingRequests(user!.id),
          trustService.getTrustedIds(user!.id),
        ])
        if (mounted) {
          setFriends(friendsData)
          setRequests(requestsData)
          setTrustedIds(trustedData)
        }
      } catch (err) {
        console.error('Failed to load friends:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    void load()
    return () => { mounted = false }
  }, [user])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([])
      return
    }
    
    const delay = setTimeout(async () => {
      try {
        const results = await playersService.searchProfiles(searchQuery)
        setSearchResults(results.filter(p => p.id !== user.id))
      } catch (err) {
        console.error('Search failed:', err)
      }
    }, 300)
    
    return () => clearTimeout(delay)
  }, [searchQuery, user])

  // Actions
  async function handleSendRequest(receiverId: string) {
    if (!user) return
    try {
      await friendsService.sendRequest(user.id, receiverId)
      alert('Friend request sent!')
      setSearchQuery('')
    } catch (err: any) {
      alert(err.message || 'Failed to send request')
    }
  }

  async function handleAccept(id: string) {
    try {
      await friendsService.acceptRequest(id)
      setRequests(r => r.filter(req => req.id !== id))
      if (user) {
        const updatedFriends = await friendsService.getFriends(user.id)
        setFriends(updatedFriends)
      }
    } catch (err) {
      alert('Failed to accept')
    }
  }

  async function handleReject(id: string) {
    try {
      await friendsService.rejectRequest(id)
      setRequests(r => r.filter(req => req.id !== id))
    } catch (err) {
      alert('Failed to reject')
    }
  }

  async function handleGrantTrust(friendProfileId: string) {
    if (!user) return
    setTrustLoading(friendProfileId)
    setMenuOpen(null)
    try {
      await trustService.grantTrust(user.id, friendProfileId)
      setTrustedIds(ids => [...ids, friendProfileId])
    } catch (err: any) {
      alert(err.message || 'Failed to grant trust')
    }
    setTrustLoading(null)
  }

  async function handleRevokeTrust(friendProfileId: string) {
    if (!user) return
    setTrustLoading(friendProfileId)
    setMenuOpen(null)
    try {
      await trustService.revokeTrust(user.id, friendProfileId)
      setTrustedIds(ids => ids.filter(id => id !== friendProfileId))
    } catch (err: any) {
      alert(err.message || 'Failed to revoke trust')
    }
    setTrustLoading(null)
  }

  if (loading) {
    return (
      <main style={{ ...styles.container, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="loader"></div>
      </main>
    )
  }

  return (
    <main style={styles.container}>
      <h1 className="text-display-md" style={{ marginBottom: 'var(--spacing-xl)' }}>Friends</h1>

      {/* Add Friend Section */}
      <section style={styles.section}>
        <h2 className="text-display-sm" style={{ marginBottom: 12 }}>Add Friends</h2>
        <input 
          type="text" 
          placeholder="Search players by name..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        
        {searchResults.length > 0 && (
          <ul style={styles.list}>
            {searchResults.map(p => (
              <li key={p.id} className="card" style={styles.listItem}>
                <div style={styles.avatarSmall}>{p.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.playerName}>{p.name}</div>
                  <div style={styles.playerMeta}>{p.skill_level ? `${p.skill_level} Skill` : 'Unrated'}</div>
                </div>
                <button className="btn-secondary" style={styles.smallBtn} onClick={() => handleSendRequest(p.id)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Friend Requests */}
      {requests.length > 0 && (
        <section style={styles.section}>
          <h2 className="text-display-sm" style={{ marginBottom: 12 }}>Requests</h2>
          <ul style={styles.list}>
            {requests.map(req => {
              const sender = req.requester
              if (!sender) return null
              
              return (
                <li key={req.id} className="card" style={styles.listItem}>
                  <div style={styles.avatarSmall}>{sender.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.playerName}>{sender.name}</div>
                    <div style={styles.playerMeta}>wants to be friends</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={styles.smallBtn} onClick={() => handleReject(req.id)}>Decline</button>
                    <button className="btn-primary" style={styles.smallBtn} onClick={() => handleAccept(req.id)}>Accept</button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* My Friends */}
      <section style={styles.section}>
        <h2 className="text-display-sm" style={{ marginBottom: 12 }}>My Friends</h2>
        {friends.length === 0 ? (
          <p className="text-body text-ink-muted card" style={{ padding: 24, textAlign: 'center' }}>
            You haven't added any friends yet. Use the search above to find players!
          </p>
        ) : (
          <ul style={styles.list}>
            {friends.map(f => {
              const friendProfile = f.requester_id === user?.id ? f.receiver : f.requester
              if (!friendProfile) return null
              
              const isTrusted = trustedIds.includes(friendProfile.id)
              const isLoading = trustLoading === friendProfile.id
              const isMenuOpen = menuOpen === f.id

              return (
                <li key={f.id} className="card" style={styles.listItem}>
                  <div style={styles.avatarSmall}>{friendProfile.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={styles.playerName}>{friendProfile.name}</div>
                      {isTrusted && (
                        <span style={styles.trustedBadge}>✓ Trusted</span>
                      )}
                    </div>
                    <div style={styles.playerMeta}>{friendProfile.city || 'No city'}</div>
                  </div>

                  {/* 3-dot menu */}
                  <div style={{ position: 'relative' }} ref={isMenuOpen ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(isMenuOpen ? null : f.id)}
                      disabled={isLoading}
                      style={styles.dotsBtn}
                      aria-label="Friend options"
                    >
                      {isLoading ? '…' : '⋮'}
                    </button>

                    {isMenuOpen && (
                      <div style={styles.dropdownMenu}>
                        {isTrusted ? (
                          <button
                            type="button"
                            style={styles.dropdownItem}
                            onClick={() => handleRevokeTrust(friendProfile.id)}
                          >
                            🔒 Revoke Score Trust
                          </button>
                        ) : (
                          <button
                            type="button"
                            style={styles.dropdownItem}
                            onClick={() => handleGrantTrust(friendProfile.id)}
                          >
                            🤝 Trust Their Scores
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

const styles = {
  container: {
    padding: 'var(--spacing-lg)',
    maxWidth: 600,
    margin: '0 auto',
  } as React.CSSProperties,

  section: {
    marginBottom: 40,
  } as React.CSSProperties,

  searchInput: {
    width: '100%',
    height: 48,
    padding: '0 16px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    color: 'var(--color-ink)',
    marginBottom: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  } as React.CSSProperties,

  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  } as React.CSSProperties,

  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    gap: 16,
    position: 'relative',
  } as React.CSSProperties,

  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 600,
  } as React.CSSProperties,

  playerName: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginBottom: 2,
  } as React.CSSProperties,

  playerMeta: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--color-ink-muted)',
  } as React.CSSProperties,

  smallBtn: {
    padding: '6px 12px',
    minHeight: 32,
    fontSize: 13,
  } as React.CSSProperties,

  trustedBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-primary)',
    background: 'var(--color-primary-soft)',
    borderRadius: 999,
    padding: '2px 7px',
  } as React.CSSProperties,

  dotsBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 20,
    color: 'var(--color-ink-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  } as React.CSSProperties,

  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    zIndex: 200,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    minWidth: 200,
    overflow: 'hidden',
  } as React.CSSProperties,

  dropdownItem: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--color-ink)',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
}
