import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RuntimeEnv } from '../config/env'

// Server-only: this file may use SUPABASE_SERVICE_ROLE_KEY.
// Never import it from Vite/frontend code and never return the key in responses.
export function createSupabaseAdminClient(env: RuntimeEnv): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey || env.mockOnly) {
    return null
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
