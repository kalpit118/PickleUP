import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * True if the Supabase env vars are configured.
 * Use this to conditionally enable features that require a live backend.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Warn in console — do NOT throw, as that crashes the entire app.
  console.warn(
    '[PickleUP] Supabase env vars are not set.\n' +
    'Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'Get these values from your Supabase project → Settings → API.'
  )
}

/**
 * Public Supabase client — uses the anon key only.
 * Never use the service-role key in frontend code.
 *
 * Falls back to placeholder strings so the module loads even without env vars.
 * API calls will fail gracefully with network errors rather than crashing the app.
 */
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key'
)
