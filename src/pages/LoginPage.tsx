/**
 * LoginPage — Sign in / Sign up screen.
 *
 * Design: Apple-inspired, green primary, canvas background, mobile-first.
 * - Single page with two tabs: Sign In and Sign Up
 * - Email/password for both
 * - Google OAuth button
 * - After sign-up: Supabase sends confirmation email; user sees a
 *   "check your email" state.
 * - After sign-in: AuthProvider detects session → RequireAuth redirects to /
 *
 * Error messages: routed through friendlyAuthError() — never raw Supabase strings.
 */
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { friendlyAuthError } from '@/features/auth/auth.types'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth'

type Tab = 'signin' | 'signup'

export default function LoginPage() {
  const { user, loading } = useAuth()

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupDone, setSignupDone] = useState(false)

  // Already authenticated → redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  // ---------------------------------------------------------------------------
  // Submit handlers
  // ---------------------------------------------------------------------------

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await authService.signIn(email.trim(), password)
      // AuthProvider will pick up the session change → RequireAuth redirects
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    setSubmitting(true)
    try {
      await authService.signUp(email.trim(), password)
      setSignupDone(true)
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    try {
      await authService.signInWithGoogle()
    } catch (err) {
      setError(friendlyAuthError(err))
    }
  }

  // ---------------------------------------------------------------------------
  // Render: sign-up success state
  // ---------------------------------------------------------------------------

  if (signupDone) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logoMark} aria-hidden="true">🏓</div>
          <h1 style={styles.heading}>Check your email</h1>
          <p style={styles.subtext}>
            We sent a confirmation link to <strong>{email}</strong>.
            <br />Open it to activate your account, then come back to sign in.
          </p>
          <button
            id="back-to-signin"
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => { setSignupDone(false); setTab('signin') }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: main auth form
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo mark + wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={styles.logoMark} aria-hidden="true">🏓</div>
          <h1 style={styles.wordmark}>PickleUP</h1>
          <p style={styles.tagline}>Play. Score. Compete. Improve.</p>
        </div>

        {/* Tab switcher */}
        <div style={styles.tabs} role="tablist" aria-label="Authentication mode">
          <button
            id="tab-signin"
            role="tab"
            aria-selected={tab === 'signin'}
            style={{ ...styles.tab, ...(tab === 'signin' ? styles.tabActive : {}) }}
            onClick={() => { setTab('signin'); setError(null) }}
          >
            Sign in
          </button>
          <button
            id="tab-signup"
            role="tab"
            aria-selected={tab === 'signup'}
            style={{ ...styles.tab, ...(tab === 'signup' ? styles.tabActive : {}) }}
            onClick={() => { setTab('signup'); setError(null) }}
          >
            Sign up
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            style={styles.errorBanner}
            id="auth-error"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={tab === 'signin' ? handleSignIn : handleSignUp}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Name — sign-up only */}
          {tab === 'signup' && (
            <div style={styles.fieldGroup}>
              <label htmlFor="auth-name" style={styles.label}>
                Your name
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                placeholder="Ravi Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          )}

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label htmlFor="auth-email" style={styles.label}>
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete={tab === 'signin' ? 'email' : 'email'}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label htmlFor="auth-password" style={styles.label}>
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          {/* Submit */}
          <button
            id="auth-submit"
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting
              ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
              : (tab === 'signin' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Google OAuth */}
        <button
          id="auth-google"
          type="button"
          onClick={handleGoogle}
          style={styles.googleBtn}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer fine print */}
        <p style={styles.finePrint}>
          By continuing you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles — inline for isolation; uses design tokens via CSS vars
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
    maxWidth: 400,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 32px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  } as React.CSSProperties,

  logoMark: {
    fontSize: 40,
    display: 'block',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 1,
  } as React.CSSProperties,

  wordmark: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: 'var(--color-ink)',
    margin: '0 0 4px',
    lineHeight: 1,
  } as React.CSSProperties,

  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.3px',
    color: 'var(--color-ink)',
    margin: '0 0 12px',
    textAlign: 'center',
  } as React.CSSProperties,

  tagline: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 400,
    color: 'var(--color-ink-muted)',
    margin: 0,
  } as React.CSSProperties,

  subtext: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--color-ink-secondary)',
    textAlign: 'center',
    marginBottom: 24,
  } as React.CSSProperties,

  tabs: {
    display: 'flex',
    background: 'var(--color-canvas)',
    borderRadius: 'var(--radius-sm)',
    padding: 3,
    marginBottom: 20,
    gap: 2,
  } as React.CSSProperties,

  tab: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--color-ink-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,

  tabActive: {
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  } as React.CSSProperties,

  errorBanner: {
    background: 'var(--color-red-soft)',
    color: 'var(--color-loss)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 4,
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

  input: {
    width: '100%',
    height: 44,
    padding: '0 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 16, // 16px prevents iOS auto-zoom
    color: 'var(--color-ink)',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxSizing: 'border-box',
  } as React.CSSProperties,

  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '20px 0',
  } as React.CSSProperties,

  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--color-border)',
    display: 'block',
  } as React.CSSProperties,

  dividerText: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--color-ink-faint)',
    flexShrink: 0,
  } as React.CSSProperties,

  googleBtn: {
    width: '100%',
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--color-ink)',
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  } as React.CSSProperties,

  finePrint: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    color: 'var(--color-ink-faint)',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 0,
    lineHeight: 1.5,
  } as React.CSSProperties,
}
