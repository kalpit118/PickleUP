/**
 * App — root router.
 *
 * Route structure (per DEVELOPMENT_PLAN.md):
 *   /            → Home (dashboard)
 *   /login       → Login
 *   /games       → Games list (Phase 2)
 *   /games/:id   → Game detail (Phase 2)
 *   /tournaments → Tournaments (Phase 4)
 *   /friends     → Friends (Phase 3)
 *   /profile     → Player profile (Phase 1)
 *   /t/:slug     → Public tournament page (Phase 4, no auth required)
 *   *            → 404
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/layouts/AppLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Lazy placeholder pages (will be filled in per phase)
function PlaceholderPage({ title }: { title: string }) {
  return (
    <main style={{ padding: 'var(--spacing-lg)' }}>
      <h1 className="text-display-md" style={{ marginBottom: 'var(--spacing-sm)' }}>
        {title}
      </h1>
      <p className="text-body" style={{ color: 'var(--color-ink-muted)' }}>
        Coming soon — this section is part of a future phase.
      </p>
    </main>
  )
}

/**
 * Guard: redirects unauthenticated users to /login.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60svh',
        }}
      >
        <span className="text-body" style={{ color: 'var(--color-ink-muted)' }}>
          Loading…
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/t/:slug" element={<PlaceholderPage title="Tournament" />} />

      {/* Authenticated routes — wrapped in AppLayout shell */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/games" element={<PlaceholderPage title="Games" />} />
        <Route path="/games/:id" element={<PlaceholderPage title="Game" />} />
        <Route path="/tournaments" element={<PlaceholderPage title="Tournaments" />} />
        <Route path="/friends" element={<PlaceholderPage title="Friends" />} />
        <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
