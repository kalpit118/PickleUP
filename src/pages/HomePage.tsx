/**
 * Home / Dashboard page.
 * Shows player stats, recent matches, and quick actions.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { matchesService } from '@/services/matches'
import { analyticsService } from '@/services/analytics'
import type { Match } from '@/types/domain'

export default function HomePage() {
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState({ matchesPlayed: 0, winRate: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let mounted = true
    
    async function loadData() {
      try {
        // Fetch recent match history and live stats in parallel
        const [history, liveStats] = await Promise.all([
          matchesService.getPlayerMatchHistory(user!.id, 5),
          analyticsService.computeLiveStats(user!.id)
        ])
        if (mounted) {
          setMatches(history)
          setStats(liveStats)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    void loadData()
    return () => { mounted = false }
  }, [user])
  
  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 className="text-display-md">Hi, {profile?.name.split(' ')[0]} 👋</h1>
          <p className="text-body" style={{ color: 'var(--color-ink-muted)', marginTop: 4 }}>
            Ready for your next game?
          </p>
        </div>
      </header>

      {/* Quick Actions */}
      <section style={styles.actionGrid}>
        <Link to="/matches/new" style={styles.primaryActionCard}>
          <div style={styles.actionIcon}>+</div>
          <div>
            <h2 style={styles.actionTitle}>Record Match</h2>
            <p style={styles.actionSub}>Submit a score for verification</p>
          </div>
        </Link>
        <Link to="/games" style={styles.secondaryActionCard}>
          <div style={styles.actionIconDark}>📅</div>
          <div>
            <h2 style={styles.actionTitleDark}>My Games</h2>
            <p style={styles.actionSubDark}>View upcoming bookings</p>
          </div>
        </Link>
      </section>

      {/* Mini Stats */}
      <section style={styles.statsGrid}>
        <div className="card" style={styles.statBox}>
          <div style={styles.statValue}>{stats.matchesPlayed}</div>
          <div style={styles.statLabel}>Matches</div>
        </div>
        <div className="card" style={styles.statBox}>
          <div style={styles.statValue}>{stats.winRate}%</div>
          <div style={styles.statLabel}>Win Rate</div>
        </div>
        <div className="card" style={styles.statBox}>
          <div style={styles.statValue}>{profile?.skill_level || 'NR'}</div>
          <div style={styles.statLabel}>Skill Level</div>
        </div>
      </section>

      {/* Recent Matches */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 className="text-display-sm">Recent Matches</h2>
          <Link to="/profile" style={styles.viewAll}>View all</Link>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="loader"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="card" style={styles.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏓</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>No matches yet</h3>
            <p className="text-body text-ink-muted" style={{ margin: 0 }}>
              Hit the court and record your first match!
            </p>
          </div>
        ) : (
          <div style={styles.matchList}>
            {matches.map(match => (
              <div key={match.id} className="card" style={styles.matchCard}>
                <div style={styles.matchTeams}>
                  <div style={styles.team}>
                    <span style={styles.teamName}>Team A</span>
                    <span style={styles.teamScore}>{match.score_team_a ?? '-'}</span>
                  </div>
                  <div style={styles.teamDivider}>vs</div>
                  <div style={styles.team}>
                    <span style={styles.teamName}>Team B</span>
                    <span style={styles.teamScore}>{match.score_team_b ?? '-'}</span>
                  </div>
                </div>
                <div style={styles.matchFooter}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      ...styles.statusBadge,
                      background: match.status === 'verified' ? 'var(--color-primary-soft)' : 'var(--color-surface-dark)',
                      color: match.status === 'verified' ? 'var(--color-win)' : 'var(--color-ink-muted)'
                    }}>
                      {match.status}
                    </span>
                    {match.status !== 'verified' && (
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '2px 8px', fontSize: 11, minHeight: 'auto' }}
                        onClick={async () => {
                          try {
                            await matchesService.verifyMatch(match.id)
                            window.location.reload()
                          } catch (err) {
                            alert('Failed to verify match')
                          }
                        }}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                  <span style={styles.date}>
                    {new Date(match.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    padding: 'var(--spacing-lg)',
    maxWidth: 600,
    margin: '0 auto',
  } as React.CSSProperties,

  header: {
    marginBottom: 'var(--spacing-xl)',
  } as React.CSSProperties,

  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 'var(--spacing-xl)',
  } as React.CSSProperties,

  primaryActionCard: {
    background: 'var(--color-primary)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 110,
    transition: 'transform 0.15s ease',
  } as React.CSSProperties,

  secondaryActionCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 110,
    transition: 'transform 0.15s ease',
  } as React.CSSProperties,

  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-full)',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 400,
    marginBottom: 12,
  } as React.CSSProperties,

  actionIconDark: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-canvas)',
    color: 'var(--color-ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    marginBottom: 12,
  } as React.CSSProperties,

  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 2px',
    fontFamily: 'var(--font-display)',
  } as React.CSSProperties,

  actionTitleDark: {
    color: 'var(--color-ink)',
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 2px',
    fontFamily: 'var(--font-display)',
  } as React.CSSProperties,

  actionSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    margin: 0,
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties,

  actionSubDark: {
    color: 'var(--color-ink-muted)',
    fontSize: 12,
    margin: 0,
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties,

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 'var(--spacing-xl)',
  } as React.CSSProperties,

  statBox: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginBottom: 2,
  } as React.CSSProperties,

  statLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--color-ink-muted)',
  } as React.CSSProperties,

  section: {
    marginBottom: 40,
  } as React.CSSProperties,

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  } as React.CSSProperties,

  viewAll: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 500,
  } as React.CSSProperties,

  emptyState: {
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  } as React.CSSProperties,

  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  } as React.CSSProperties,

  matchCard: {
    padding: 16,
  } as React.CSSProperties,

  matchTeams: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  } as React.CSSProperties,

  team: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  } as React.CSSProperties,

  teamName: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--color-ink-muted)',
    marginBottom: 4,
  } as React.CSSProperties,

  teamScore: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 600,
    color: 'var(--color-ink)',
    lineHeight: 1,
  } as React.CSSProperties,

  teamDivider: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--color-border-strong)',
    fontWeight: 600,
    padding: '0 16px',
  } as React.CSSProperties,

  matchFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--color-border)',
    paddingTop: 12,
  } as React.CSSProperties,

  statusBadge: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
  } as React.CSSProperties,

  date: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--color-ink-faint)',
  } as React.CSSProperties,
}
