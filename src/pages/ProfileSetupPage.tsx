/**
 * ProfileSetupPage — Onboarding step after first sign-up.
 *
 * Users are forced here if they have a session but no profile record.
 * Follows the same design language as the login card.
 */
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playersService } from '@/services/players'
import type { SkillLevel } from '@/types/domain'

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.user_metadata?.full_name ?? '')
  const [city, setCity] = useState('')
  const [skillLevel, setSkillLevel] = useState<SkillLevel | ''>('')
  const [preferredHand, setPreferredHand] = useState<'left' | 'right' | ''>('')
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSubmitting(true)

    try {
      await playersService.upsertProfile({
        id: user.id,
        name: name.trim(),
        city: city.trim() || null,
        skill_level: skillLevel || null,
        preferred_hand: preferredHand || null,
      })
      
      // Update the auth context so the RequireProfile guard lets them through
      await refreshProfile()
      
      // Send them to the dashboard
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
      setError('Could not save your profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome to PickleUP</h1>
        <p style={styles.subtext}>
          Let's set up your player profile so others can find you and match your skill level.
        </p>

        {error && (
          <div role="alert" style={styles.errorBanner}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div style={styles.fieldGroup}>
            <label htmlFor="setup-name" style={styles.label}>
              Full Name <span style={styles.required}>*</span>
            </label>
            <input
              id="setup-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ravi Kumar"
              required
              style={styles.input}
            />
          </div>

          {/* City */}
          <div style={styles.fieldGroup}>
            <label htmlFor="setup-city" style={styles.label}>
              City (Optional)
            </label>
            <input
              id="setup-city"
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Mumbai"
              style={styles.input}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* Skill Level */}
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label htmlFor="setup-skill" style={styles.label}>
                Skill Level (Optional)
              </label>
              <select
                id="setup-skill"
                value={skillLevel}
                onChange={e => setSkillLevel(e.target.value as SkillLevel | '')}
                style={styles.select}
              >
                <option value="">Unrated</option>
                <option value="1.0">1.0 - Beginner</option>
                <option value="2.0">2.0 - Novice</option>
                <option value="2.5">2.5</option>
                <option value="3.0">3.0 - Intermediate</option>
                <option value="3.5">3.5</option>
                <option value="4.0">4.0 - Advanced</option>
                <option value="4.5">4.5</option>
                <option value="5.0">5.0 - Expert</option>
                <option value="5.5+">5.5+ - Pro</option>
              </select>
            </div>

            {/* Hand */}
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label htmlFor="setup-hand" style={styles.label}>
                Hand (Optional)
              </label>
              <select
                id="setup-hand"
                value={preferredHand}
                onChange={e => setPreferredHand(e.target.value as 'left' | 'right' | '')}
                style={styles.select}
              >
                <option value="">Prefer not to say</option>
                <option value="right">Right-handed</option>
                <option value="left">Left-handed</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !name.trim()}
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Saving…' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: {
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-canvas)',
    padding: '24px 16px',
  } as React.CSSProperties,

  card: {
    width: '100%',
    maxWidth: 440,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  } as React.CSSProperties,

  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: '-0.4px',
    color: 'var(--color-ink)',
    margin: '0 0 8px',
  } as React.CSSProperties,

  subtext: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    lineHeight: 1.5,
    color: 'var(--color-ink-secondary)',
    margin: '0 0 24px',
  } as React.CSSProperties,

  errorBanner: {
    background: 'var(--color-red-soft)',
    color: 'var(--color-loss)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 16,
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
    letterSpacing: '-0.1px',
  } as React.CSSProperties,
  
  required: {
    color: 'var(--color-loss)',
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
    outline: 'none',
    boxSizing: 'border-box',
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
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  } as React.CSSProperties,
}
