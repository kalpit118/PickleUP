/**
 * Login page — Phase 1 auth entry point.
 * Full implementation in Phase 4 (auth feature).
 */
export default function LoginPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100svh',
        padding: 'var(--spacing-lg)',
        background: 'var(--color-canvas)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <h1 className="text-display-md" style={{ marginBottom: 'var(--spacing-sm)' }}>
          Sign in to PickleUP
        </h1>
        <p className="text-body" style={{ color: 'var(--color-ink-muted)', marginBottom: 'var(--spacing-xl)' }}>
          Play. Score. Compete. Improve.
        </p>
        <p className="text-caption" style={{ color: 'var(--color-ink-faint)' }}>
          Authentication coming in Phase 1 build.
        </p>
      </div>
    </main>
  )
}
