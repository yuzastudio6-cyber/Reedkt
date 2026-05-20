export interface SupabasePublicConfig {
  url: string
  anonKey: string
  configured: boolean
}

export type SupabasePublicEnvVar = 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'

const SUPABASE_PUBLIC_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const satisfies readonly SupabasePublicEnvVar[]

function readPublicEnvVar(name: SupabasePublicEnvVar): string {
  return (import.meta.env[name] ?? '').trim()
}

export function getMissingSupabasePublicEnvVars(): SupabasePublicEnvVar[] {
  return SUPABASE_PUBLIC_ENV_VARS.filter((name) => readPublicEnvVar(name).length === 0)
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = readPublicEnvVar('VITE_SUPABASE_URL')
  const anonKey = readPublicEnvVar('VITE_SUPABASE_ANON_KEY')

  return {
    url,
    anonKey,
    configured: url.length > 0 && anonKey.length > 0,
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig().configured
}

export function assertSupabaseConfigured(): SupabasePublicConfig {
  const config = getSupabasePublicConfig()

  if (!config.configured) {
    throw new Error(
      `Supabase public config is missing: ${getMissingSupabasePublicEnvVars().join(', ')}`,
    )
  }

  return config
}
