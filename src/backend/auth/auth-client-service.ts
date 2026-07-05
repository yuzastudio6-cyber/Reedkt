import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import type { AuthBootstrapMode, AuthBootstrapStatus } from '../../types/auth-bootstrap'
import { getSupabaseClient, getSupabaseClientStatus } from '../supabase/supabase-client'

const INTERNAL_TESTING_AUTH_SESSION_KEY = 'reeditpro:internal-testing-auth-session:v1'

interface InternalTestingAuthSession {
  email: string
  displayName?: string
  signedInAt: string
}

export interface AuthClientStatus {
  configured: boolean
  mode: AuthBootstrapMode
  status: AuthBootstrapStatus
  missingEnvKeys: string[]
  message: string
  warnings: string[]
}

export interface SupabaseSessionResult {
  ok: boolean
  mode: AuthBootstrapMode
  status: AuthBootstrapStatus
  session?: Session | null
  message: string
  warnings: string[]
}

export interface SupabaseUserResult {
  ok: boolean
  mode: AuthBootstrapMode
  status: AuthBootstrapStatus
  user?: User | null
  message: string
  warnings: string[]
}

export interface SupabaseAuthActionResult {
  ok: boolean
  mode: AuthBootstrapMode
  status: AuthBootstrapStatus
  user?: User | null
  session?: Session | null
  emailConfirmationRequired?: boolean
  message: string
  warnings: string[]
}

export type SupabaseAuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void

function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function isInternalTestingMockAuthEnabled(): boolean {
  return import.meta.env.VITE_REEDITPRO_INTERNAL_TEST_AUTH === 'true'
}

export function getInternalTestingMockAuthSession(): InternalTestingAuthSession | null {
  if (!isInternalTestingMockAuthEnabled() || !isBrowserRuntime()) return null

  try {
    const rawSession = window.localStorage.getItem(INTERNAL_TESTING_AUTH_SESSION_KEY)
    if (!rawSession) return null

    const parsed = JSON.parse(rawSession) as Partial<InternalTestingAuthSession>
    if (typeof parsed.email !== 'string' || parsed.email.trim().length === 0) return null
    if (typeof parsed.signedInAt !== 'string' || parsed.signedInAt.trim().length === 0) return null

    return {
      email: parsed.email.trim(),
      displayName: typeof parsed.displayName === 'string' && parsed.displayName.trim().length > 0
        ? parsed.displayName.trim()
        : undefined,
      signedInAt: parsed.signedInAt,
    }
  } catch {
    return null
  }
}

function writeInternalTestingMockAuthSession(email: string, displayName?: string): InternalTestingAuthSession | null {
  if (!isInternalTestingMockAuthEnabled() || !isBrowserRuntime()) return null

  const session: InternalTestingAuthSession = {
    email,
    displayName,
    signedInAt: new Date().toISOString(),
  }

  window.localStorage.setItem(INTERNAL_TESTING_AUTH_SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new CustomEvent('reeditpro-internal-testing-auth-change'))
  return session
}

function clearInternalTestingMockAuthSession(): void {
  if (!isBrowserRuntime()) return
  window.localStorage.removeItem(INTERNAL_TESTING_AUTH_SESSION_KEY)
  window.dispatchEvent(new CustomEvent('reeditpro-internal-testing-auth-change'))
}

function notConfiguredStatus(): AuthClientStatus {
  const status = getSupabaseClientStatus()

  if (isInternalTestingMockAuthEnabled()) {
    const session = getInternalTestingMockAuthSession()
    return {
      configured: true,
      mode: 'mock',
      status: session ? 'ready' : 'signed_out',
      missingEnvKeys: status.missingEnvKeys,
      message: session
        ? 'Internal testing mock auth session is active.'
        : 'Internal testing mock auth is enabled. Supabase is not configured, so sign-in stays browser-local.',
      warnings: [
        'Internal testing mock auth is local-only and does not create Supabase records.',
        'Use real Supabase public env values for hosted auth verification.',
      ],
    }
  }

  return {
    configured: false,
    mode: 'mock',
    status: 'not_configured',
    missingEnvKeys: status.missingEnvKeys,
    message: status.message,
    warnings: ['Supabase public env values are missing; auth stays in safe not-configured mode.'],
  }
}

export function getAuthClientStatus(): AuthClientStatus {
  const status = getSupabaseClientStatus()

  if (!status.configured) {
    return notConfiguredStatus()
  }

  return {
    configured: true,
    mode: 'supabase_frontend',
    status: 'signed_out',
    missingEnvKeys: [],
    message: 'Supabase auth client is ready for browser session checks.',
    warnings: [],
  }
}

export async function getCurrentSupabaseSession(): Promise<SupabaseSessionResult> {
  const client = getSupabaseClient()

  if (!client) {
    const status = notConfiguredStatus()
    return {
      ok: false,
      mode: status.mode,
      status: status.status,
      session: null,
      message: status.message,
      warnings: status.warnings,
    }
  }

  const { data, error } = await client.auth.getSession()

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'error',
      session: null,
      message: error.message,
      warnings: ['Supabase session lookup failed.'],
    }
  }

  return {
    ok: Boolean(data.session),
    mode: 'supabase_frontend',
    status: data.session ? 'ready' : 'signed_out',
    session: data.session,
    message: data.session ? 'Supabase session is active.' : 'No Supabase session is active.',
    warnings: [],
  }
}

export async function getCurrentSupabaseUser(): Promise<SupabaseUserResult> {
  const client = getSupabaseClient()

  if (!client) {
    const status = notConfiguredStatus()
    return {
      ok: false,
      mode: status.mode,
      status: status.status,
      user: null,
      message: status.message,
      warnings: status.warnings,
    }
  }

  const { data, error } = await client.auth.getUser()

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'signed_out',
      user: null,
      message: error.message,
      warnings: ['Supabase user lookup failed or no valid session is available.'],
    }
  }

  return {
    ok: Boolean(data.user),
    mode: 'supabase_frontend',
    status: data.user ? 'ready' : 'signed_out',
    user: data.user,
    message: data.user ? 'Supabase user is signed in.' : 'No Supabase user is signed in.',
    warnings: [],
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<SupabaseAuthActionResult> {
  const client = getSupabaseClient()

  if (!client) {
    if (isInternalTestingMockAuthEnabled()) {
      const session = writeInternalTestingMockAuthSession(email)
      return {
        ok: Boolean(session),
        mode: 'mock',
        status: session ? 'ready' : 'error',
        message: session
          ? 'Signed in with browser-local internal testing auth.'
          : 'Internal testing mock auth could not create a browser-local session.',
        warnings: [
          'No Supabase request was made.',
          'No service-role secret, provider call, worker dispatch, upload, media processing, or credit action was started.',
          `Password accepted only as a local testing form gate (${password.length} characters); it was not sent to a backend.`,
        ],
      }
    }

    const status = notConfiguredStatus()
    return {
      ok: false,
      mode: status.mode,
      status: status.status,
      message: status.message,
      warnings: status.warnings,
    }
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'error',
      message: error.message,
      warnings: ['Sign-in failed.'],
    }
  }

  return {
    ok: true,
    mode: 'supabase_frontend',
    status: data.user ? 'ready' : 'signed_out',
    user: data.user,
    session: data.session,
    message: data.user ? 'Signed in with Supabase Auth.' : 'Sign-in completed without an active user session.',
    warnings: [],
  }
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  displayName?: string,
  emailRedirectTo?: string,
): Promise<SupabaseAuthActionResult> {
  const client = getSupabaseClient()

  if (!client) {
    if (isInternalTestingMockAuthEnabled()) {
      const session = writeInternalTestingMockAuthSession(email, displayName)
      return {
        ok: Boolean(session),
        mode: 'mock',
        status: session ? 'ready' : 'error',
        emailConfirmationRequired: false,
        message: session
          ? 'Created a browser-local internal testing account session.'
          : 'Internal testing mock auth could not create a browser-local session.',
        warnings: [
          'No Supabase sign-up request was made.',
          'No email confirmation, service-role action, provider call, worker dispatch, upload, media processing, or credit action was started.',
          `Password accepted only as a local testing form gate (${password.length} characters); it was not sent to a backend.`,
        ],
      }
    }

    const status = notConfiguredStatus()
    return {
      ok: false,
      mode: status.mode,
      status: status.status,
      message: status.message,
      warnings: status.warnings,
    }
  }

  const options: {
    data?: {
      display_name: string
    }
    emailRedirectTo?: string
  } = {}

  if (displayName) {
    options.data = {
      display_name: displayName,
    }
  }

  if (emailRedirectTo) {
    options.emailRedirectTo = emailRedirectTo
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: Object.keys(options).length > 0 ? options : undefined,
  })

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'error',
      message: error.message,
      warnings: ['Sign-up failed.'],
    }
  }

  return {
    ok: true,
    mode: 'supabase_frontend',
    status: data.session ? 'ready' : 'signed_out',
    user: data.user,
    session: data.session,
    emailConfirmationRequired: !data.session,
    message: data.session
      ? 'Signed up and received a Supabase session.'
      : 'Sign-up created a user but did not return an active Supabase session. Internal testing should use backend-provisioned confirmed tester accounts instead of relying on email confirmation delivery.',
    warnings: data.session
      ? []
      : ['Internal tester access requires owner/backend provisioning before browser sign-in can continue.'],
  }
}

export async function signOutSupabaseUser(): Promise<SupabaseAuthActionResult> {
  const client = getSupabaseClient()

  if (!client) {
    if (isInternalTestingMockAuthEnabled()) {
      clearInternalTestingMockAuthSession()
      return {
        ok: true,
        mode: 'mock',
        status: 'signed_out',
        message: 'Signed out of browser-local internal testing auth.',
        warnings: ['No Supabase sign-out request was made.'],
      }
    }

    const status = notConfiguredStatus()
    return {
      ok: false,
      mode: status.mode,
      status: status.status,
      message: status.message,
      warnings: status.warnings,
    }
  }

  const { error } = await client.auth.signOut()

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'error',
      message: error.message,
      warnings: ['Sign-out failed.'],
    }
  }

  return {
    ok: true,
    mode: 'supabase_frontend',
    status: 'signed_out',
    message: 'Signed out of Supabase Auth.',
    warnings: [],
  }
}

export function onSupabaseAuthStateChange(callback: SupabaseAuthStateChangeCallback): {
  unsubscribe: () => void
} {
  const client = getSupabaseClient()

  if (!client) {
    if (isInternalTestingMockAuthEnabled() && isBrowserRuntime()) {
      const listener = () => callback('INITIAL_SESSION', null)
      window.addEventListener('reeditpro-internal-testing-auth-change', listener)
      return { unsubscribe: () => window.removeEventListener('reeditpro-internal-testing-auth-change', listener) }
    }

    return { unsubscribe: () => undefined }
  }

  const { data } = client.auth.onAuthStateChange(callback)
  return {
    unsubscribe: () => data.subscription.unsubscribe(),
  }
}
