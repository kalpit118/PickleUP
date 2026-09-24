/**
 * Auth hook + context.
 *
 * Provides:
 *   user        — Supabase Auth user (null if unauthenticated)
 *   session     — current Supabase session
 *   profile     — the user's profile row (null if not yet created)
 *   loading     — true while session is being resolved
 *   profileLoading — true while profile is being fetched
 *
 * Auth state machine used by routing guards:
 *   loading=true           → show loading spinner
 *   user=null              → redirect to /login
 *   user≠null, profile=null → redirect to /profile/setup
 *   user≠null, profile≠null → allow through to app
 */
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'
import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  /** Call this after profile creation/update to refresh the cached profile. */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  profileLoading: false,
  refreshProfile: async () => {},
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // Fetch profile for a given user ID
  // ---------------------------------------------------------------------------

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        // Log the error but don't crash — profile may not exist yet (new user)
        console.warn('[PickleUP] Profile fetch error:', error.message)
        setProfile(null)
      } else {
        setProfile(data as Profile | null)
      }
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Public refresh — called by ProfileSetupPage after profile is created
  // ---------------------------------------------------------------------------

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  // ---------------------------------------------------------------------------
  // Auth state listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const authUser = session?.user ?? null
      setUser(authUser)
      setLoading(false)
      if (authUser) {
        void fetchProfile(authUser.id)
      }
    })

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      const authUser = session?.user ?? null
      setUser(authUser)
      setLoading(false)

      if (authUser) {
        void fetchProfile(authUser.id)
      } else {
        // Signed out — clear profile
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, profileLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
