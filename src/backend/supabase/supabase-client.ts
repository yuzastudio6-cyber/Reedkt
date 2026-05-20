import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'
import {
  getMissingSupabasePublicEnvVars,
  getSupabasePublicConfig,
  isSupabaseConfigured as isPublicSupabaseConfigured,
  type SupabasePublicEnvVar,
} from './supabase-config'

export type ReeditProSupabaseClient = SupabaseClient<Database>

export interface SupabaseConnectionStatus {
  configured: boolean
  mode: 'supabase' | 'mock_local'
  projectName: 'reeditpro'
  missingEnvVars: SupabasePublicEnvVar[]
}

let cachedClient: ReeditProSupabaseClient | null | undefined

export function createSupabaseBrowserClient(): ReeditProSupabaseClient | null {
  const config = getSupabasePublicConfig()

  if (!config.configured) {
    return null
  }

  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  })
}

export function getSupabaseClient(): ReeditProSupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient
  }

  cachedClient = createSupabaseBrowserClient()
  return cachedClient
}

export function getSupabaseConnectionStatus(): SupabaseConnectionStatus {
  const configured = isPublicSupabaseConfigured()

  return {
    configured,
    mode: configured ? 'supabase' : 'mock_local',
    projectName: 'reeditpro',
    missingEnvVars: getMissingSupabasePublicEnvVars(),
  }
}

export const isSupabaseConfigured = isPublicSupabaseConfigured
