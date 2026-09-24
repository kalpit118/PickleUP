/**
 * AppLayout — the persistent shell around all authenticated pages.
 *
 * Structure:
 *   <GlobalNav>   — top bar (44px, surface-dark)
 *   <main>        — page content
 *   <BottomNav>   — mobile bottom navigation
 *
 * Desktop: horizontal top nav
 * Mobile: top nav collapses, bottom nav appears
 */
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Nav items for authenticated users
const NAV_ITEMS = [
  { to: '/', label: 'Home', id: 'nav-home' },
  { to: '/games', label: 'Games', id: 'nav-games' },
  { to: '/tournaments', label: 'Tournaments', id: 'nav-tournaments' },
  { to: '/friends', label: 'Friends', id: 'nav-friends' },
  { to: '/profile', label: 'Profile', id: 'nav-profile' },
] as const

export default function AppLayout() {
  const { user } = useAuth()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      {/* ------------------------------------------------------------------ */}
      {/* Global Nav — surface-dark, 44px height                             */}
      {/* ------------------------------------------------------------------ */}
      <header
        role="banner"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--color-surface-dark)',
          height: 44,
          display: 'flex',
          alignItems: 'center',
          paddingInline: 'var(--spacing-lg)',
          gap: 'var(--spacing-xl)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Wordmark */}
        <Link
          to="/"
          id="nav-logo"
          style={{
            color: 'var(--color-on-dark)',
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.2px',
            flexShrink: 0,
          }}
        >
          PickleUP
        </Link>

        {/* Desktop nav links */}
        <nav
          role="navigation"
          aria-label="Main navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xl)',
            flex: 1,
          }}
          className="desktop-nav"
        >
          {NAV_ITEMS.map(({ to, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              end={to === '/'}
              className="text-nav"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-accent-strong)' : 'rgba(255,255,255,0.72)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right cluster: Sign in or user indicator */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {user ? (
            <Link
              to="/profile"
              id="nav-profile-avatar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                flexShrink: 0,
              }}
              aria-label="Your profile"
            >
              {user.email?.[0]?.toUpperCase() ?? 'P'}
            </Link>
          ) : (
            <Link
              to="/login"
              id="nav-sign-in"
              className="btn-utility"
              style={{ fontSize: 12, padding: '5px 12px', minHeight: 28 }}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Page content                                                        */}
      {/* ------------------------------------------------------------------ */}
      <main
        role="main"
        style={{ flex: 1, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Outlet />
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile bottom nav (hidden on desktop via CSS)                       */}
      {/* ------------------------------------------------------------------ */}
      <nav
        role="navigation"
        aria-label="Mobile navigation"
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'var(--color-surface-dark)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map(({ to, label, id }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            id={`mobile-${id}`}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px 10px',
              color: isActive ? 'var(--color-accent-strong)' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              gap: 2,
              transition: 'color 0.15s ease',
            })}
          >
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
              {navIcon(to)}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Inline responsive styles for nav visibility */}
      <style>{`
        .desktop-nav { display: flex; }
        .mobile-bottom-nav { display: none; }

        @media (max-width: 833px) {
          .desktop-nav { display: none; }
          .mobile-bottom-nav { display: flex; }
          main { padding-bottom: calc(60px + env(safe-area-inset-bottom)); }
        }
      `}</style>
    </div>
  )
}

function navIcon(to: string): string {
  switch (to) {
    case '/': return '🏠'
    case '/games': return '🏓'
    case '/tournaments': return '🏆'
    case '/friends': return '👥'
    case '/profile': return '👤'
    default: return '•'
  }
}
