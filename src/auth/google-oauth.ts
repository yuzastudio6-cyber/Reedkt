import { normalizeAppBasePath } from './app-base-path'
import { sanitizeInternalReturnTo } from './auth-navigation'

export interface GoogleOAuthCallbackInput {
  origin: string
  appBasePath: string | undefined
  returnTo: string | null | undefined
}

export interface GoogleProviderHandoffInput {
  callback: URL
  providerUrl: string
  supabaseUrl: string
}

export function buildGoogleOAuthCallbackUrl(input: GoogleOAuthCallbackInput): string {
  const origin = parseTrustedBrowserOrigin(input.origin)
  const appBasePath = normalizeAppBasePath(input.appBasePath)
  const callback = new URL(`${appBasePath}sign-in`, `${origin}/`)
  callback.searchParams.set('returnTo', sanitizeInternalReturnTo(input.returnTo))
  return callback.toString()
}

export function readGoogleOAuthCallbackError(
  search: string | undefined,
  hash: string | undefined,
): string {
  const query = new URLSearchParams(search?.replace(/^\?/, '') ?? '')
  const fragment = new URLSearchParams(hash?.replace(/^#/, '') ?? '')
  const error = query.get('error') ?? fragment.get('error')
  if (!error) return ''

  return error === 'access_denied'
    ? 'Google sign-in was cancelled. Try again when you are ready.'
    : 'Google sign-in could not be completed. Try again, or use email and password.'
}

export function validateGoogleProviderHandoffUrl(input: GoogleProviderHandoffInput): URL | undefined {
  try {
    const providerUrl = new URL(input.providerUrl)
    const supabaseUrl = new URL(input.supabaseUrl)
    const supabaseBasePath = supabaseUrl.pathname === '/' ? '' : supabaseUrl.pathname.replace(/\/+$/, '')
    const expectedAuthorizePath = `${supabaseBasePath}/auth/v1/authorize`
    if (
      !usesHttpsOrLoopbackHttp(providerUrl)
      || providerUrl.username
      || providerUrl.password
      || supabaseUrl.username
      || supabaseUrl.password
      || !usesHttpsOrLoopbackHttp(supabaseUrl)
      || providerUrl.origin !== supabaseUrl.origin
      || providerUrl.pathname !== expectedAuthorizePath
      || providerUrl.searchParams.get('provider') !== 'google'
      || providerUrl.searchParams.get('redirect_to') !== input.callback.toString()
    ) {
      return undefined
    }
    return providerUrl
  } catch {
    return undefined
  }
}

function parseTrustedBrowserOrigin(value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Google sign-in requires a valid browser origin.')
  }

  if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('Google sign-in requires a credential-free browser origin.')
  }

  if (!usesHttpsOrLoopbackHttp(parsed)) {
    throw new Error('Google sign-in requires HTTPS outside loopback development.')
  }

  return parsed.origin
}

function usesHttpsOrLoopbackHttp(value: URL): boolean {
  return value.protocol === 'https:'
    || (value.protocol === 'http:' && isExactLoopbackHostname(value.hostname))
}

function isExactLoopbackHostname(value: string): boolean {
  const normalized = value.toLowerCase()
  if (normalized === 'localhost' || normalized === '::1') return true
  const parts = normalized.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}
