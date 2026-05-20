import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import type { AuthBootstrapMode, AuthBootstrapStatus } from '../../types/auth-bootstrap'
import { getSupabaseClient, getSupabaseClientStatus } from '../supabase/supabase-client'

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
  message: string
  warnings: string[]
}

export type SupabaseAuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void

function notConfiguredStatus(): AuthClientStatus {
  const status = getSupabaseClientStatus()

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
): Promise<SupabaseAuthActionResult> {
  const client = getSupabaseClient()

  if (!client) {
    const status = notConfiguredStatus()
    return {
      ok: false,
      mode: status.mode,
      status: status.status,
      message: status.message,
      warnings: status.warnings,
    }
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: displayName
      ? {
          data: {
            display_name: displayName,
          },
        }
      : undefined,
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
    status: data.user ? 'ready' : 'signed_out',
    user: data.user,
    session: data.session,
    message: data.session
      ? 'Signed up and received a Supabase session.'
      : 'Sign-up created a user; email confirmation may be required before a session is active.',
    warnings: data.session ? [] : ['Supabase may require email confirmation before bootstrap can continue.'],
  }
}

export async function signOutSupabaseUser(): Promise<SupabaseAuthActionResult> {
  const client = getSupabaseClient()

  if (!client) {
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
    return { unsubscribe: () => undefined }
  }

  const { data } = client.auth.onAuthStateChange(callback)
  return {
    unsubscribe: () => data.subscription.unsubscribe(),
  }
}
