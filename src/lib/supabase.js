import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True when the user has wired up their own Supabase project.
// When false, the app falls back to built-in sample listings so the
// map and search still work as a demo.
export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes('your-project-ref')
)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null
