import { getSupabasePublicConfig } from '../backend/supabase/supabase-config'

export type AuthRuntimeMode = 'local_test' | 'supabase' | 'unavailable'

export interface AuthRuntimeConfig {
  available: boolean
  mode: AuthRuntimeMode
  requestedMode?: string
  message: string
}

type RuntimeEnvRecord = Record<string, boolean | string | undefined>

function getRuntimeEnv(): RuntimeEnvRecord {
  return (import.meta as ImportMeta & { env?: RuntimeEnvRecord }).env ?? {}
}

export function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '')

  if (normalized === 'localhost' || normalized === '::1') return true

  const parts = normalized.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

function isDevelopmentRuntime(env: RuntimeEnvRecord): boolean {
  return env.DEV === true || env.DEV === 'true' || env.MODE === 'development'
}

export function getAuthRuntimeConfig(): AuthRuntimeConfig {
  const env = getRuntimeEnv()
  const requestedMode = typeof env.VITE_REEDITPRO_AUTH_MODE === 'string'
    ? env.VITE_REEDITPRO_AUTH_MODE.trim().toLowerCase()
    : ''

  if (requestedMode === 'local_test') {
    const hostname = typeof window === 'undefined' ? '' : window.location.hostname
    const allowed = isDevelopmentRuntime(env) && isLoopbackHostname(hostname)

    return {
      available: allowed,
      mode: allowed ? 'local_test' : 'unavailable',
      requestedMode,
      message: allowed
        ? 'Local test sign-in is available for this loopback development session.'
        : 'Local test sign-in is restricted to the Vite development server on a loopback address.',
    }
  }

  if (requestedMode === 'supabase') {
    const config = getSupabasePublicConfig()
    return {
      available: config.configured,
      mode: config.configured ? 'supabase' : 'unavailable',
      requestedMode,
      message: config.configured
        ? 'Secure workspace sign-in is available.'
        : 'Secure sign-in is selected, but its public browser configuration is incomplete.',
    }
  }

  return {
    available: false,
    mode: 'unavailable',
    requestedMode: requestedMode || undefined,
    message: requestedMode
      ? 'This authentication mode is not supported.'
      : 'Authentication is not configured for this environment.',
  }
}
