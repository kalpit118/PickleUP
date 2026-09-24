/**
 * RecordMatchPage — Enter a score for a new match.
 * Currently supports a simple flow where the user manually selects friends and enters the score.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { friendsService } from '@/services/friends'
import { matchesService } from '@/services/matches'
import type { Profile } from '@/types/domain'

export default function RecordMatchPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [friends, setFriends] = useState<Profile[]>([])
  
  // Form State
  const [format, setFormat] = useState<'singles' | 'doubles'>('doubles')
  const [partnerId, setPartnerId] = useState<string>('')
  const [opponent1Id, setOpponent1Id] = useState<string>('')
  const [opponent2Id, setOpponent2Id] = useState<string>('')
  
  const [scoreA, setScoreA] = useState<number | ''>('')
  const [scoreB, setScoreB] = useState<number | ''>('')
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load friends for the dropdowns
  useEffect(() => {
    if (!user) return
    let mounted = true
    async function load() {
      try {
        const data = await friendsService.getFriends(user!.id)
        if (mounted) {
          // Extract the friend profiles from the friendship records
          const friendProfiles = data.map((f: any) => 
            f.requester_id === user!.id ? f.receiver : f.requester
          ).filter(Boolean) as Profile[]
          setFriends(friendProfiles)
        }
      } catch (err) {
        console.error('Failed to load friends:', err)
      }
    }
    void load()
    return () => { mounted = false }
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    
    // Validation
    if (format === 'doubles' && (!partnerId || !opponent1Id || !opponent2Id)) {
      setError('Please select all players for doubles.')
      return
    }
    if (format === 'singles' && !opponent1Id) {
      setError('Please select an opponent.')
      return
    }
    if (scoreA === '' || scoreB === '') {
      setError('Please enter the final score.')
      return
    }
    
    // Check for duplicate players
    const selectedIds = format === 'doubles' 
      ? [user.id, partnerId, opponent1Id, opponent2Id]
      : [user.id, opponent1Id]
      
    if (new Set(selectedIds).size !== selectedIds.length) {
      setError('A player cannot be selected more than once.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      // 1. Create the DRAFT match
      const match = await matchesService.createMatch({})
      
      // 2. Add players
      const matchPlayers = [
        { match_id: match.id, player_id: user.id, team: 'A' },
        { match_id: match.id, player_id: opponent1Id, team: 'B' }
      ]
      
      if (format === 'doubles') {
        matchPlayers.push({ match_id: match.id, player_id: partnerId, team: 'A' })
        matchPlayers.push({ match_id: match.id, player_id: opponent2Id, team: 'B' })
      }
      
      await matchesService.addMatchPlayers(matchPlayers as any)
      
      // 3. Submit score
      await matchesService.submitScore(match.id, Number(scoreA), Number(scoreB), user.id)
      
      // Success!
      navigate('/')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to record match.')
      setSubmitting(false)
    }
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 className="text-display-md">Record Match</h1>
        <p className="text-body text-ink-muted">Enter the score and select the players.</p>
      </header>

      {error && (
        <div role="alert" style={styles.errorBanner}>{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card" style={styles.form}>
        
        {/* Format Selection */}
        <div style={styles.formatToggle}>
          <button 
            type="button"
            style={{ ...styles.formatBtn, ...(format === 'singles' ? styles.formatActive : {}) }}
            onClick={() => setFormat('singles')}
          >
            Singles
          </button>
          <button 
            type="button"
            style={{ ...styles.formatBtn, ...(format === 'doubles' ? styles.formatActive : {}) }}
            onClick={() => setFormat('doubles')}
          >
            Doubles
          </button>
        </div>

        <div style={styles.teamSection}>
          <h2 style={styles.teamLabel}>Team A</h2>
          <div style={styles.playerRow}>
            <div style={styles.youIndicator}>{profile?.name} (You)</div>
          </div>
          {format === 'doubles' && (
            <div style={styles.playerRow}>
              <select 
                value={partnerId} 
                onChange={e => setPartnerId(e.target.value)} 
                style={styles.select}
              >
                <option value="">Select Partner...</option>
                {friends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={styles.vsDivider}>VS</div>

        <div style={styles.teamSection}>
          <h2 style={styles.teamLabel}>Team B</h2>
          <div style={styles.playerRow}>
            <select 
              value={opponent1Id} 
              onChange={e => setOpponent1Id(e.target.value)} 
              style={styles.select}
            >
              <option value="">Select Opponent 1...</option>
              {friends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          {format === 'doubles' && (
            <div style={styles.playerRow}>
              <select 
                value={opponent2Id} 
                onChange={e => setOpponent2Id(e.target.value)} 
                style={styles.select}
              >
                <option value="">Select Opponent 2...</option>
                {friends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={styles.scoreSection}>
          <div style={styles.scoreInputGroup}>
            <label style={styles.scoreLabel}>Team A Score</label>
            <input 
              type="number" 
              min="0" 
              max="99" 
              value={scoreA}
              onChange={e => setScoreA(e.target.value ? Number(e.target.value) : '')}
              style={styles.scoreInput} 
              required
            />
          </div>
          <div style={styles.scoreInputGroup}>
            <label style={styles.scoreLabel}>Team B Score</label>
            <input 
              type="number" 
              min="0" 
              max="99" 
              value={scoreB}
              onChange={e => setScoreB(e.target.value ? Number(e.target.value) : '')}
              style={styles.scoreInput} 
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={submitting}
          style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: 16 }}
        >
          {submitting ? 'Submitting...' : 'Submit Score'}
        </button>

      </form>
    </main>
  )
}

const styles = {
  container: {
    padding: 'var(--spacing-lg)',
    maxWidth: 500,
    margin: '0 auto',
  } as React.CSSProperties,

  header: {
    marginBottom: 'var(--spacing-xl)',
    textAlign: 'center',
  } as React.CSSProperties,

  errorBanner: {
    background: 'var(--color-red-soft)',
    color: 'var(--color-loss)',
    padding: 12,
    borderRadius: 'var(--radius-sm)',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  } as React.CSSProperties,

  form: {
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  } as React.CSSProperties,

  formatToggle: {
    display: 'flex',
    background: 'var(--color-canvas)',
    borderRadius: 'var(--radius-sm)',
    padding: 4,
  } as React.CSSProperties,

  formatBtn: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-ink-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,

  formatActive: {
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    fontWeight: 600,
  } as React.CSSProperties,

  teamSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as React.CSSProperties,

  teamLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--color-ink-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as React.CSSProperties,

  playerRow: {
    display: 'flex',
  } as React.CSSProperties,

  youIndicator: {
    width: '100%',
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary-dark)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    fontWeight: 600,
  } as React.CSSProperties,

  select: {
    width: '100%',
    height: 48,
    padding: '0 12px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--color-ink)',
  } as React.CSSProperties,

  vsDivider: {
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-ink-muted)',
  } as React.CSSProperties,

  scoreSection: {
    display: 'flex',
    gap: 16,
    marginTop: 8,
    paddingTop: 24,
    borderTop: '1px solid var(--color-border)',
  } as React.CSSProperties,

  scoreInputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,

  scoreLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-ink-secondary)',
  } as React.CSSProperties,

  scoreInput: {
    width: 80,
    height: 80,
    textAlign: 'center',
    fontSize: 40,
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--color-ink)',
    background: 'var(--color-canvas)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-lg)',
  } as React.CSSProperties,
}
