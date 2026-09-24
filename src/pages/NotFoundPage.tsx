/**
 * 404 Not Found page.
 */
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60svh',
        padding: 'var(--spacing-lg)',
        textAlign: 'center',
      }}
    >
      <p className="text-tagline" style={{ color: 'var(--color-ink-faint)', marginBottom: 'var(--spacing-xs)' }}>
        404
      </p>
      <h1 className="text-display-md" style={{ marginBottom: 'var(--spacing-sm)' }}>
        Page not found
      </h1>
      <p className="text-body" style={{ color: 'var(--color-ink-muted)', marginBottom: 'var(--spacing-xl)' }}>
        This page doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary" id="not-found-home-link">
        Go home
      </Link>
    </main>
  )
}
