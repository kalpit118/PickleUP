/**
 * Auth feature — shared types and helpers.
 */

export interface AuthFormState {
  email: string
  password: string
  name?: string
}

export interface AuthError {
  message: string
}

/**
 * Maps Supabase auth error messages to user-friendly strings.
 * Never expose raw database or auth internals to the UI.
 */
export function friendlyAuthError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)

  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in.'
  if (msg.includes('User already registered')) return 'An account with this email already exists.'
  if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.'
  if (msg.includes('Unable to validate email')) return 'Please enter a valid email address.'
  if (msg.includes('signup is disabled')) return 'Sign-ups are currently disabled. Contact the organizer.'
  if (msg.includes('Email rate limit')) return 'Too many attempts. Please wait a few minutes.'
  if (msg.includes('fetch')) return 'Network error. Check your connection and try again.'

  return 'Something went wrong. Please try again.'
}
