import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig, isSupabaseConfigured } from './supabase-config'

export type ReeditProSupabaseClient = SupabaseClient

export interface SupabaseClientStatus {
  configured: boolean
  projectName: 'reeditpro'
  missingEnvKeys: string[]
  message: string
}

let browserClient: ReeditProSupabaseClient | null = null

export function getSupabaseClientStatus(): SupabaseClientStatus {
  const config = getSupabasePublicConfig()

  return {
    configured: config.configured,
    projectName: 'reeditpro',
    missingEnvKeys: [...config.missingEnvKeys],
    message: config.message,
  }
}

export function getSupabaseClient(): ReeditProSupabaseClient | null {
  const config = getSupabasePublicConfig()

  if (!config.configured || !config.url || !config.anonKey) {
    return null
  }

  browserClient ??= createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  })

  return browserClient
}

export { isSupabaseConfigured }
