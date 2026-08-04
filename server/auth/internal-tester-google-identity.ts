import { createHash } from 'node:crypto'
import type { User } from '@supabase/supabase-js'

export interface InternalTesterGoogleIdentityEvidence {
  googleIdentityObserved: boolean
  authEmailConfirmed: boolean
  priorAuthSignInObserved: boolean
  readyForProfileWorkspaceProvisioning: boolean
}

function normalizedProvider(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().toLowerCase()
    : undefined
}

function validPastTimestamp(value: unknown, nowMs: number): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= nowMs + 5 * 60 * 1000
}

export function inspectInternalTesterGoogleIdentity(
  user: User,
  nowMs = Date.now(),
): InternalTesterGoogleIdentityEvidence {
  const providers = new Set<string>()
  const primaryProvider = normalizedProvider(user.app_metadata?.provider)
  if (primaryProvider) providers.add(primaryProvider)

  const declaredProviders = user.app_metadata?.providers
  if (Array.isArray(declaredProviders)) {
    for (const provider of declaredProviders) {
      const normalized = normalizedProvider(provider)
      if (normalized) providers.add(normalized)
    }
  }

  for (const identity of user.identities ?? []) {
    const normalized = normalizedProvider(identity.provider)
    if (normalized) providers.add(normalized)
  }

  const authUser = user as User & {
    confirmed_at?: string | null
    email_confirmed_at?: string | null
  }
  const googleIdentityObserved = providers.has('google')
  const authEmailConfirmed = validPastTimestamp(
    authUser.email_confirmed_at ?? authUser.confirmed_at,
    nowMs,
  )
  const priorAuthSignInObserved = validPastTimestamp(user.last_sign_in_at, nowMs)

  return {
    googleIdentityObserved,
    authEmailConfirmed,
    priorAuthSignInObserved,
    readyForProfileWorkspaceProvisioning:
      googleIdentityObserved && authEmailConfirmed && priorAuthSignInObserved,
  }
}

export function internalTesterEmailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 16)
}

export function privateIdentifierHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export function normalizeExpectedEmailHash(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized && /^[a-f0-9]{16}$/.test(normalized) ? normalized : undefined
}

export function normalizeStagingSupabaseUrl(value: string | undefined): string | undefined {
  try {
    const parsed = new URL(value?.trim() ?? '')
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || parsed.port
      || parsed.pathname !== '/'
      || parsed.search
      || parsed.hash
      || !/^[a-z0-9]+[.]supabase[.]co$/.test(parsed.hostname)
    ) return undefined
    return parsed.origin
  } catch {
    return undefined
  }
}
