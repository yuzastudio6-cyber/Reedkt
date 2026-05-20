export const SUPABASE_PUBLIC_ENV_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const

export type SupabasePublicEnvKey = (typeof SUPABASE_PUBLIC_ENV_KEYS)[number]

export interface SupabasePublicConfig {
  configured: boolean
  url?: string
  anonKey?: string
  missingEnvKeys: SupabasePublicEnvKey[]
  message: string
}

function readPublicEnv(key: SupabasePublicEnvKey): string | undefined {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = readPublicEnv('VITE_SUPABASE_URL')
  const anonKey = readPublicEnv('VITE_SUPABASE_ANON_KEY')
  const missingEnvKeys = SUPABASE_PUBLIC_ENV_KEYS.filter((key) => !readPublicEnv(key))
  const configured = Boolean(url && anonKey)

  return {
    configured,
    url,
    anonKey,
    missingEnvKeys,
    message: configured
      ? 'Supabase public browser configuration is available.'
      : 'Supabase is not configured. Add the frontend-safe public URL and anon key to use live auth.',
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig().configured
}
