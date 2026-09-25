/**
 * ActivityFeedPage — Phase 6 Growth Feature.
 * Shows a global feed of recent matches across the platform.
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ActivityFeedPage() {
  const [feed, setFeed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    async function fetchFeed() {
      try {
        // Fetch recent matches that are verified or submitted
        const { data, error } = await supabase
          .from('matches')
          .select(`
            id,
            status,
            score_team_a,
            score_team_b,
            created_at,
            match_players (
              team,
              profiles ( id, name )
            )
          `)
          .in('status', ['submitted', 'verified'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        
        if (mounted) {
          setFeed(data ?? [])
        }
      } catch (err) {
        console.error('Failed to load activity feed:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    void fetchFeed()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <main style={{ ...styles.container, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="loader"></div>
      </main>
    )
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 className="text-display-md">Activity Feed</h1>
        <p className="text-body text-ink-muted">See what's happening on the courts</p>
      </header>

      {feed.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="text-body text-ink-muted">No recent activity. Go play a match!</p>
        </div>
      ) : (
        <div style={styles.feedList}>
          {feed.map(match => {
            // Organize players by team
            const teamA = match.match_players.filter((mp: any) => mp.team === 'A').map((mp: any) => mp.profiles.name)
            const teamB = match.match_players.filter((mp: any) => mp.team === 'B').map((mp: any) => mp.profiles.name)
            
            // Determine winner
            const scoreA = match.score_team_a ?? 0
            const scoreB = match.score_team_b ?? 0
            const teamAWon = scoreA > scoreB
            const teamBWon = scoreB > scoreA

            return (
              <div key={match.id} className="card" style={styles.feedItem}>
                <div style={styles.feedHeader}>
                  <span style={styles.timeAgo}>
                    {new Date(match.created_at).toLocaleDateString()}
                  </span>
                  <span style={{
                    ...styles.statusBadge,
                    background: match.status === 'verified' ? 'var(--color-primary-soft)' : 'var(--color-surface-dark)',
                    color: match.status === 'verified' ? 'var(--color-win)' : 'var(--color-ink-muted)'
                  }}>
                    {match.status}
                  </span>
                </div>
                
                <div style={styles.matchup}>
                  <div style={{ ...styles.teamBox, opacity: teamAWon ? 1 : 0.6 }}>
                    <div style={styles.teamNames}>
                      {teamA.length > 0 ? teamA.join(' & ') : 'Unknown A'}
                    </div>
                    <div style={{ ...styles.score, color: teamAWon ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                      {scoreA}
                    </div>
                  </div>
                  
                  <div style={styles.vs}>vs</div>
                  
                  <div style={{ ...styles.teamBox, opacity: teamBWon ? 1 : 0.6 }}>
                    <div style={styles.teamNames}>
                      {teamB.length > 0 ? teamB.join(' & ') : 'Unknown B'}
                    </div>
                    <div style={{ ...styles.score, color: teamBWon ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                      {scoreB}
                    </div>
                  </div>
                </div>
                
              </div>
            )
          })}
        </div>
      )}
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

  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  } as React.CSSProperties,

  feedItem: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  } as React.CSSProperties,

  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: 12,
  } as React.CSSProperties,

  timeAgo: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--color-ink-muted)',
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

  matchup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as React.CSSProperties,

  teamBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,

  teamNames: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-ink)',
  } as React.CSSProperties,

  score: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 700,
  } as React.CSSProperties,

  vs: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--color-ink-faint)',
    textAlign: 'center',
  } as React.CSSProperties,
}
