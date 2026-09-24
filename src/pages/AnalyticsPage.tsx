/**
 * AnalyticsPage — Performance Dashboard (Phase 5).
 * Shows detailed player stats and trends.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { analyticsService } from '@/services/analytics'

export default function AnalyticsPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let mounted = true
    
    async function loadData() {
      try {
        const liveStats = await analyticsService.computeLiveStats(user!.id)
        if (mounted) {
          setStats(liveStats)
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    void loadData()
    return () => { mounted = false }
  }, [user])

  if (loading) {
    return (
      <main style={{ ...styles.container, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="loader"></div>
      </main>
    )
  }

  if (!stats) {
    return (
      <main style={styles.container}>
        <p className="text-body text-ink-muted">Failed to load analytics.</p>
      </main>
    )
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 className="text-display-md">Performance Dashboard</h1>
        <p className="text-body text-ink-muted">
          Analytics for {profile?.name} • Based on verified match history
        </p>
      </header>

      {/* Main KPI */}
      <section style={styles.mainKpiSection}>
        <div className="card" style={{ ...styles.kpiCard, background: 'var(--color-primary)', color: 'white' }}>
          <div style={{ ...styles.kpiValue, color: 'white' }}>{stats.winRate}%</div>
          <div style={{ ...styles.kpiLabel, color: 'rgba(255,255,255,0.8)' }}>Win Rate</div>
        </div>
      </section>

      {/* Secondary KPIs */}
      <section style={styles.grid}>
        <div className="card" style={styles.kpiCard}>
          <div style={styles.kpiValue}>{stats.wins}</div>
          <div style={styles.kpiLabel}>Total Wins</div>
        </div>
        <div className="card" style={styles.kpiCard}>
          <div style={styles.kpiValue}>{stats.losses}</div>
          <div style={styles.kpiLabel}>Total Losses</div>
        </div>
        <div className="card" style={styles.kpiCard}>
          <div style={styles.kpiValue}>{stats.matchesPlayed}</div>
          <div style={styles.kpiLabel}>Matches Played</div>
        </div>
        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: stats.pointDifferential >= 0 ? 'var(--color-win)' : 'var(--color-loss)' }}>
            {stats.pointDifferential > 0 ? '+' : ''}{stats.pointDifferential}
          </div>
          <div style={styles.kpiLabel}>Point Diff</div>
        </div>
      </section>

      {/* Breakdown Section */}
      <section style={styles.section}>
        <h2 className="text-display-sm" style={{ marginBottom: 16 }}>Point Breakdown</h2>
        <div className="card" style={styles.breakdownCard}>
          <div style={styles.breakdownRow}>
            <span style={styles.breakdownLabel}>Points Won</span>
            <span style={styles.breakdownValue}>{stats.pointsWon}</span>
          </div>
          <div style={styles.breakdownRow}>
            <span style={styles.breakdownLabel}>Points Lost</span>
            <span style={styles.breakdownValue}>{stats.pointsLost}</span>
          </div>
          <div style={styles.progressContainer}>
            <div 
              style={{
                ...styles.progressBar, 
                width: `${stats.pointsWon + stats.pointsLost > 0 ? (stats.pointsWon / (stats.pointsWon + stats.pointsLost)) * 100 : 50}%`
              }} 
            />
          </div>
        </div>
      </section>

      {/* Head to Head Placeholder */}
      <section style={styles.section}>
        <h2 className="text-display-sm" style={{ marginBottom: 16 }}>Head-to-Head</h2>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p className="text-body text-ink-muted">
            Play against your friends to see how you match up! Head-to-head stats will appear here once you play verified matches against them.
          </p>
        </div>
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

  header: {
    marginBottom: 'var(--spacing-xl)',
  } as React.CSSProperties,

  mainKpiSection: {
    marginBottom: 16,
  } as React.CSSProperties,

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 'var(--spacing-xl)',
  } as React.CSSProperties,

  kpiCard: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  kpiValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 32,
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginBottom: 4,
    lineHeight: 1,
  } as React.CSSProperties,

  kpiLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--color-ink-muted)',
  } as React.CSSProperties,

  section: {
    marginBottom: 40,
  } as React.CSSProperties,

  breakdownCard: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  } as React.CSSProperties,

  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,

  breakdownLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--color-ink-secondary)',
  } as React.CSSProperties,

  breakdownValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--color-ink)',
  } as React.CSSProperties,

  progressContainer: {
    width: '100%',
    height: 8,
    background: 'var(--color-loss)', // The rest is loss (red)
    borderRadius: 'var(--radius-pill)',
    marginTop: 8,
    overflow: 'hidden',
  } as React.CSSProperties,

  progressBar: {
    height: '100%',
    background: 'var(--color-win)', // The filled part is win (green)
    borderRadius: 'var(--radius-pill)',
  } as React.CSSProperties,
}
