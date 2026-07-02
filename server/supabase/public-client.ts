import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RuntimeEnv } from '../config/env'

// Server-only anon client for token/user validation. Service-role keys never belong here.
export function createSupabasePublicClient(env: RuntimeEnv): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey || env.mode === 'disabled') {
    return null
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
