// created: 2026-11-23T11:59:00-08:00
// updated: 2026-11-24T08:58:00-08:00 — don't crash the whole app if env is missing
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''

export const supabaseConfigError =
  !url || !key
    ? 'App is missing Supabase settings. Ask Diyaan to check GitHub Pages secrets.'
    : null

export const supabase: SupabaseClient = createClient(
  url || 'https://example.supabase.co',
  key || 'public-anon-key',
)
