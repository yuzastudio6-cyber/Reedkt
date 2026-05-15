export interface SupabaseClientPlaceholder {
  readonly configured: false
  readonly projectName: 'reeditpro'
}

export function getSupabaseClient(): SupabaseClientPlaceholder {
  throw new Error(
    'Supabase client is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY later for the reeditpro project.',
  )
}

export function isSupabaseConfigured(): boolean {
  return false
}
