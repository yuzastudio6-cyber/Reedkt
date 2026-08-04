export const DEFAULT_AUTH_RETURN_TO = '/dashboard'

export function sanitizeInternalReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_RETURN_TO,
): string {
  if (!value) return fallback

  const candidate = value.trim()
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback
  }

  try {
    const base = new URL('https://reeditpro.internal')
    const parsed = new URL(candidate, base)

    if (parsed.origin !== base.origin || parsed.pathname === '/sign-in') return fallback

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function buildSignInPath(returnTo: string): string {
  const safeReturnTo = sanitizeInternalReturnTo(returnTo)
  return `/sign-in?returnTo=${encodeURIComponent(safeReturnTo)}`
}
