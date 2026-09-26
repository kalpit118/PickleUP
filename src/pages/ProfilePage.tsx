/**
 * ProfilePage — View and edit the player's profile.
 *
 * Supports viewing the current user's profile (/profile) or another user's (/profile/:id).
 * Currently only implements the current user view/edit.
 */
import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { authService } from '@/services/auth'
import { playersService } from '@/services/players'
import type { SkillLevel } from '@/types/domain'

export default function ProfilePage() {
  const { id } = useParams()
  const { user, profile, refreshProfile, session } = useAuth()
  const pushNotify = usePushNotifications(session)
  
  // If viewing own profile, id param is undefined
  const isOwnProfile = !id || id === user?.id

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.name ?? '')
  const [editCity, setEditCity] = useState(profile?.city ?? '')
  const [editSkill, setEditSkill] = useState<SkillLevel | ''>(profile?.skill_level ?? '')
  const [editHand, setEditHand] = useState<'left' | 'right' | ''>(profile?.preferred_hand ?? '')
  const [submitting, setSubmitting] = useState(false)

  // Wait for profile to load (handled by RequireProfile for own profile, but good to be safe)
  if (isOwnProfile && !profile) {
    return null 
  }

  // TODO Phase 3: Fetch other user's profile if !isOwnProfile
  if (!isOwnProfile) {
    return (
      <main style={styles.container}>
        <h1 className="text-display-md">Public Profiles</h1>
        <p className="text-body text-ink-muted">Viewing other profiles is coming in Phase 3.</p>
      </main>
    )
  }

  // Handle save edit
  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await playersService.upsertProfile({
        id: user.id,
        name: editName.trim(),
        city: editCity.trim() || null,
        skill_level: editSkill || null,
        preferred_hand: editHand || null,
      })
      await refreshProfile()
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      alert('Failed to save profile.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle sign out
  async function handleSignOut() {
    try {
      await authService.signOut()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 className="text-display-md">Profile</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ minHeight: 36, padding: '6px 16px', fontSize: 14 }}>
            Edit
          </button>
        )}
      </header>

      {isEditing ? (
        <form onSubmit={handleSave} className="card" style={styles.editForm}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={styles.input} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>City</label>
            <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Skill Level</label>
            <select value={editSkill} onChange={e => setEditSkill(e.target.value as SkillLevel | '')} style={styles.select}>
              <option value="">Unrated</option>
              <option value="1.0">1.0</option>
              <option value="2.0">2.0</option>
              <option value="2.5">2.5</option>
              <option value="3.0">3.0</option>
              <option value="3.5">3.5</option>
              <option value="4.0">4.0</option>
              <option value="4.5">4.5</option>
              <option value="5.0">5.0</option>
              <option value="5.5+">5.5+</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Preferred Hand</label>
            <select value={editHand} onChange={e => setEditHand(e.target.value as 'left' | 'right' | '')} style={styles.select}>
              <option value="">Not specified</option>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={styles.viewCard}>
          <div style={styles.avatarLarge}>
            {profile?.name.charAt(0).toUpperCase()}
          </div>
          <h2 style={styles.viewName}>{profile?.name}</h2>
          <p style={styles.viewMeta}>
            {profile?.city || 'No city specified'} • {profile?.skill_level ? `${profile.skill_level} Skill` : 'Unrated'}
          </p>
          
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statValue}>-</div>
              <div style={styles.statLabel}>Matches</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>-</div>
              <div style={styles.statLabel}>Win Rate</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>-</div>
              <div style={styles.statLabel}>Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Settings / Actions */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Account Settings</h3>
        
        {pushNotify.isSupported && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--color-ink)' }}>Push Notifications</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-ink-muted)' }}>Get alerts for friend requests & match invites</div>
            </div>
            <button 
              type="button"
              onClick={() => pushNotify.isSubscribed ? pushNotify.unsubscribe() : pushNotify.subscribe()}
              className={pushNotify.isSubscribed ? "btn-secondary" : "btn-primary"}
              style={{ padding: '8px 16px', fontSize: 14, minHeight: 'auto', minWidth: 80 }}
            >
              {pushNotify.isSubscribed ? 'Disable' : 'Enable'}
            </button>
          </div>
        )}

        <button onClick={handleSignOut} style={styles.dangerButton}>
          Sign out
        </button>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--spacing-lg)',
  } as React.CSSProperties,

  viewCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '32px 24px',
  } as React.CSSProperties,

  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    fontSize: 32,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  } as React.CSSProperties,

  viewName: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 600,
    margin: '0 0 4px',
  } as React.CSSProperties,

  viewMeta: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--color-ink-muted)',
    margin: '0 0 24px',
  } as React.CSSProperties,

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    width: '100%',
    paddingTop: 24,
    borderTop: '1px solid var(--color-border)',
  } as React.CSSProperties,

  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as React.CSSProperties,

  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--color-ink)',
    lineHeight: 1.2,
  } as React.CSSProperties,

  statLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--color-ink-muted)',
  } as React.CSSProperties,

  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  } as React.CSSProperties,

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  } as React.CSSProperties,

  label: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-ink-secondary)',
  } as React.CSSProperties,

  input: {
    width: '100%',
    height: 44,
    padding: '0 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    color: 'var(--color-ink)',
  } as React.CSSProperties,

  select: {
    width: '100%',
    height: 44,
    padding: '0 10px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--color-ink)',
  } as React.CSSProperties,

  section: {
    marginTop: 40,
  } as React.CSSProperties,

  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 16px',
  } as React.CSSProperties,

  dangerButton: {
    width: '100%',
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-red-soft)',
    color: 'var(--color-loss)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
}
