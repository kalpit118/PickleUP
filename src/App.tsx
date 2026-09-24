/**
 * App — root router.
 *
 * Routing guards:
 *   RequireAuth    — redirects unauthenticated users to /login
 *   RequireProfile — redirects authenticated users without a profile to /profile/setup
 *
 * Route structure:
 *   /               → Home dashboard
 *   /login          → Auth (sign in / sign up)
 *   /profile/setup  → Onboarding — create profile (auth required, no profile yet)
 *   /games          → Games list (Phase 2)
 *   /games/:id      → Game detail (Phase 2)
 *   /tournaments    → Tournaments (Phase 4)
 *   /t/:slug        → Public tournament page — no auth required
 *   /friends        → Friends (Phase 3)
 *   /profile        → Own profile (Phase 2)
 *   /profile/:id    → Another player's profile (Phase 3)
 *   *               → 404
 */
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/layouts/AppLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Lazy-loaded pages (code-split per route)
const ProfileSetupPage = lazy(() => import('@/pages/ProfileSetupPage'))
const ProfilePage      = lazy(() => import('@/pages/ProfilePage'))
const FriendsPage      = lazy(() => import('@/pages/FriendsPage'))

// Minimal suspense fallback — full-page centering, matches canvas background
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60svh',
        background: 'var(--color-canvas)',
      }}
    >
      <span className="text-body" style={{ color: 'var(--color-ink-muted)' }}>
        Loading…
      </span>
    </div>
  )
}

// Placeholder for routes coming in Phase 3+
function ComingSoonPage({ title }: { title: string }) {
  return (
    <main style={{ padding: 'var(--spacing-lg)' }}>
      <h1 className="text-display-md" style={{ marginBottom: 'var(--spacing-sm)' }}>
        {title}
      </h1>
      <p className="text-body" style={{ color: 'var(--color-ink-muted)' }}>
        This section is coming in a future phase.
      </p>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Guard: require Supabase Auth session
// ---------------------------------------------------------------------------

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Guard: require profile to exist (after RequireAuth)
// Authenticated users without a profile → /profile/setup
// ---------------------------------------------------------------------------

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profile, profileLoading } = useAuth()

  if (profileLoading) return <PageLoader />
  if (profile === null) return <Navigate to="/profile/setup" replace />
  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ---------------------------------------------------------------- */}
        {/* Public routes — no auth needed                                   */}
        {/* ---------------------------------------------------------------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/t/:slug" element={<ComingSoonPage title="Tournament" />} />

        {/* ---------------------------------------------------------------- */}
        {/* Profile setup — auth required, no profile required yet           */}
        {/* ---------------------------------------------------------------- */}
        <Route
          path="/profile/setup"
          element={
            <RequireAuth>
              <ProfileSetupPage />
            </RequireAuth>
          }
        />

        {/* ---------------------------------------------------------------- */}
        {/* Protected app shell — auth + profile both required               */}
        {/* ---------------------------------------------------------------- */}
        <Route
          element={
            <RequireAuth>
              <RequireProfile>
                <AppLayout />
              </RequireProfile>
            </RequireAuth>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<ComingSoonPage title="Games" />} />
          <Route path="/games/:id" element={<ComingSoonPage title="Game" />} />
          <Route path="/tournaments" element={<ComingSoonPage title="Tournaments" />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
