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
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { friendsService } from '@/services/friends'

// Nav items for authenticated users
const NAV_ITEMS = [
  { to: '/', label: 'Home', id: 'nav-home' },
  { to: '/feed', label: 'Feed', id: 'nav-feed' },
  { to: '/analytics', label: 'Analytics', id: 'nav-analytics' },
  { to: '/friends', label: 'Friends', id: 'nav-friends' },
  { to: '/profile', label: 'Profile', id: 'nav-profile' },
] as const

/** Format a timestamp into a human-readable time-ago string. */
function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h ago`
  return `${hours}h ${mins}m ago`
}

export default function AppLayout() {
  const { user, profile } = useAuth()
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  const hasUnread = pendingRequests.length > 0

  const loadNotifications = () => {
    if (!user) return
    friendsService.getPendingRequests(user.id)
      .then(reqs => setPendingRequests(reqs))
      .catch(console.error)
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30_000)
    return () => clearInterval(interval)
  }, [user])

  // Close panel when clicking outside
  useEffect(() => {
    if (!panelOpen) return
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [panelOpen])

  const handleAccept = async (id: string) => {
    setActionLoading(id)
    try {
      await friendsService.acceptRequest(id)
      setPendingRequests(r => r.filter(req => req.id !== id))
    } catch { /* noop */ }
    setActionLoading(null)
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    try {
      await friendsService.rejectRequest(id)
      setPendingRequests(r => r.filter(req => req.id !== id))
    } catch { /* noop */ }
    setActionLoading(null)
  }

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
          zIndex: 200,
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
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', flex: 1 }}
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

        {/* Right cluster: notifications + avatar */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              {/* ── Notification Bell + Dropdown Panel ────────────────── */}
              <div ref={bellRef} style={{ position: 'relative' }}>
                <button
                  id="nav-notifications-bell"
                  type="button"
                  onClick={() => setPanelOpen(o => !o)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    padding: 8,
                    background: panelOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease',
                  }}
                  aria-label="Notifications"
                  aria-expanded={panelOpen}
                >
                  {/* Bell SVG */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    style={{ width: 22, height: 22 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>

                  {/* Pulsing red dot — only when unread */}
                  {hasUnread && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor: '#EF4444',
                        border: '2px solid var(--color-surface-dark)',
                        animation: 'ping-dot 1.5s ease-in-out infinite',
                      }}
                    />
                  )}
                </button>

                {/* ── Notification Panel Dropdown ─────────────────────── */}
                {panelOpen && (
                  <div
                    id="notification-panel"
                    role="dialog"
                    aria-label="Notifications"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: 340,
                      maxHeight: 480,
                      overflowY: 'auto',
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 16,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12)',
                      border: '1px solid var(--color-border)',
                      zIndex: 300,
                    }}
                  >
                    {/* Panel header */}
                    <div
                      style={{
                        padding: '16px 20px 12px',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>
                        Notifications
                      </span>
                      {hasUnread && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'white', background: '#EF4444', borderRadius: 999, padding: '2px 7px' }}>
                          {pendingRequests.length} new
                        </span>
                      )}
                    </div>

                    {/* Empty state */}
                    {pendingRequests.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-ink-muted)', margin: 0 }}>
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {pendingRequests.map(req => {
                          const sender = req.requester
                          const isLoading = actionLoading === req.id
                          return (
                            <li
                              key={req.id}
                              style={{
                                padding: '14px 20px',
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                background: 'var(--color-surface-soft)',
                              }}
                            >
                              {/* Avatar + message + time */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{
                                  width: 38, height: 38, borderRadius: '50%',
                                  backgroundColor: 'var(--color-primary-soft)',
                                  color: 'var(--color-primary)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                                }}>
                                  {sender?.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.4 }}>
                                    <strong>{sender?.name ?? 'Someone'}</strong> sent you a friend request
                                  </p>
                                  <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
                                    {timeAgo(req.created_at)}
                                  </p>
                                </div>
                              </div>

                              {/* Accept / Reject */}
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => handleAccept(req.id)}
                                  disabled={isLoading}
                                  style={{
                                    flex: 1, padding: '7px 0', borderRadius: 999, border: 'none',
                                    background: 'var(--color-primary)', color: 'white',
                                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                                    cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.6 : 1,
                                  }}
                                >
                                  {isLoading ? '…' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => handleReject(req.id)}
                                  disabled={isLoading}
                                  style={{
                                    flex: 1, padding: '7px 0', borderRadius: 999,
                                    border: '1.5px solid var(--color-border-strong)',
                                    background: 'var(--color-surface)', color: 'var(--color-ink-secondary)',
                                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                                    cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.6 : 1,
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Profile avatar */}
              <Link
                to="/profile"
                id="nav-profile-avatar"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
                }}
                aria-label="Your profile"
              >
                {profile?.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'P'}
              </Link>
            </>
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
      <main role="main" style={{ flex: 1, paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
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
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 4px 10px',
              color: isActive ? 'var(--color-accent-strong)' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none', fontSize: 10, fontWeight: isActive ? 600 : 400,
              gap: 2, transition: 'color 0.15s ease',
            })}
          >
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
              {navIcon(to)}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Inline responsive styles + ping animation */}
      <style>{`
        .desktop-nav { display: flex; }
        .mobile-bottom-nav { display: none; }

        @media (max-width: 833px) {
          .desktop-nav { display: none; }
          .mobile-bottom-nav { display: flex; }
          main { padding-bottom: calc(60px + env(safe-area-inset-bottom)); }
        }

        @keyframes ping-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.45); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

function navIcon(to: string): string {
  switch (to) {
    case '/': return '🏠'
    case '/feed': return '⚡'
    case '/analytics': return '📈'
    case '/friends': return '👥'
    case '/profile': return '👤'
    default: return '•'
  }
}
