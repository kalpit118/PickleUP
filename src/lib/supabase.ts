import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in your values.'
  )
}

/**
 * Public Supabase client — uses the anon key only.
 * Never use the service-role key in frontend code.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
