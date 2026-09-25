/**
 * RecordMatchPage — Enter a score for a new match.
 * Currently supports a simple flow where the user manually selects friends and enters the score.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { friendsService } from '@/services/friends'
import { matchesService } from '@/services/matches'
import { trustService } from '@/services/trust'
import { confirmationsService } from '@/services/confirmations'
import type { Profile } from '@/types/domain'

export default function RecordMatchPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // Mode selection — null means show the picker first
  const [mode, setMode] = useState<'past' | 'live' | null>(null)

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
      
      // Opponents who need to confirm (everyone except the submitter)
      const opponentIds: string[] = [opponent1Id]
      
      if (format === 'doubles') {
        matchPlayers.push({ match_id: match.id, player_id: partnerId, team: 'A' })
        matchPlayers.push({ match_id: match.id, player_id: opponent2Id, team: 'B' })
        opponentIds.push(opponent2Id)
        // Partner is on our team but still needs to confirm
        opponentIds.push(partnerId)
      }
      
      await matchesService.addMatchPlayers(matchPlayers as any)
      
      // 3. Submit score — transitions DRAFT → SUBMITTED
      await matchesService.submitScore(match.id, Number(scoreA), Number(scoreB), user.id)
      
      // 4. Check trust: which of the opponents trust the submitter?
      //    If ALL opponents trust the submitter, auto-verify immediately.
      const allConfirmingPlayers = opponentIds.filter(id => id !== user.id)
      const trustedOpponentIds = await trustService.getOpponentsTrustingSubmitter(
        allConfirmingPlayers,
        user.id
      )
      
      const allTrust = trustedOpponentIds.length === allConfirmingPlayers.length && allConfirmingPlayers.length > 0
      
      if (allTrust) {
        // Everyone trusts the submitter — auto-verify
        await matchesService.verifyMatch(match.id)
        navigate('/', { state: { toast: 'Match verified! Stats updated.' } })
      } else {
        // Create confirmation requests for opponents who don't have auto-trust
        const needsConfirmation = allConfirmingPlayers.filter(id => !trustedOpponentIds.includes(id))
        await confirmationsService.createConfirmations(match.id, needsConfirmation)
        navigate('/', { state: { toast: 'Score submitted! Waiting for opponents to confirm.' } })
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to record match.')
      setSubmitting(false)
    }
  }

  // ── Mode picker ─────────────────────────────────────────────────────────────
  if (mode === null) {
    return (
      <main style={styles.container}>
        <header style={styles.header}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', fontSize: 14, marginBottom: 8, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back
          </button>
          <h1 className="text-display-md">What would you like to do?</h1>
          <p className="text-body text-ink-muted" style={{ marginTop: 4 }}>Choose how you want to log this match.</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Option 1 — Submit Past Score */}
          <button
            id="mode-past-score"
            type="button"
            onClick={() => setMode('past')}
            style={styles.modeCard}
          >
            <div style={styles.modeIcon}>📋</div>
            <div style={styles.modeText}>
              <div style={styles.modeTitle}>Submit a Completed Score</div>
              <div style={styles.modeSub}>Already played? Enter the final score and who played. Your opponents will be asked to confirm.</div>
            </div>
            <div style={styles.modeChevron}>›</div>
          </button>

          {/* Option 2 — Live Match (Coming Soon) */}
          <button
            id="mode-live-match"
            type="button"
            onClick={() => setMode('live')}
            style={{ ...styles.modeCard, opacity: 0.7 }}
          >
            <div style={styles.modeIcon}>🎾</div>
            <div style={styles.modeText}>
              <div style={styles.modeTitle}>
                Track a Live Match
                <span style={styles.comingSoonBadge}>Coming Soon</span>
              </div>
              <div style={styles.modeSub}>Score rally by rally in real time. Works great courtside from your phone.</div>
            </div>
            <div style={styles.modeChevron}>›</div>
          </button>
        </div>
      </main>
    )
  }

  // ── Live Match — Coming Soon ─────────────────────────────────────────────────
  if (mode === 'live') {
    return (
      <main style={styles.container}>
        <header style={styles.header}>
          <button
            onClick={() => setMode(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', fontSize: 14, marginBottom: 8, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back
          </button>
          <h1 className="text-display-md">Track a Live Match</h1>
        </header>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Live Scoring Coming Soon</h2>
          <p className="text-body text-ink-muted">
            Real-time rally-by-rally scoring is on the roadmap. Check back soon — it's going to be great courtside!
          </p>
          <button
            onClick={() => setMode('past')}
            className="btn-primary"
            style={{ marginTop: 24 }}
          >
            Submit a Completed Score instead
          </button>
        </div>
      </main>
    )
  }

  // ── Submit Past Score form ────────────────────────────────────────────────────
  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <button
          onClick={() => setMode(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', fontSize: 14, marginBottom: 8, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back
        </button>
        <h1 className="text-display-md">Submit a Completed Score</h1>
        <p className="text-body text-ink-muted">Enter the final score and who played. Your opponents will confirm.</p>
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

  // ── Mode picker ──────────────────────────────────────────────────────────────
  modeCard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 20px',
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 16,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  } as React.CSSProperties,

  modeIcon: {
    fontSize: 36,
    lineHeight: 1,
    flexShrink: 0,
  } as React.CSSProperties,

  modeText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  } as React.CSSProperties,

  modeTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-ink)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  } as React.CSSProperties,

  modeSub: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--color-ink-muted)',
    lineHeight: 1.5,
  } as React.CSSProperties,

  modeChevron: {
    fontSize: 24,
    color: 'var(--color-ink-faint)',
    flexShrink: 0,
  } as React.CSSProperties,

  comingSoonBadge: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-orange)',
    background: 'var(--color-orange-soft)',
    padding: '2px 7px',
    borderRadius: 999,
    letterSpacing: 0.3,
  } as React.CSSProperties,
}
