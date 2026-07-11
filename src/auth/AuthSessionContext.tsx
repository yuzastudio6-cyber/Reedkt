import type { Session, User } from '@supabase/supabase-js'
import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { AuthSessionContext } from './auth-session-context'
import { getAuthRuntimeConfig, type AuthRuntimeConfig } from './auth-runtime-config'
import type { AuthActionResult, AuthIdentity, AuthSessionSnapshot } from './auth-session-types'

interface LocalTestSessionRecord {
  version: 1
  userId: string
  email: string
  displayName: string
  createdAt: string
}

const LOCAL_TEST_SESSION_KEY = 'reeditpro.auth.localTestSession.v1'
const LOCAL_TEST_IDENTITY: AuthIdentity = {
  id: 'local-test-user',
  email: 'tester@local.reeditpro',
  displayName: 'Local test user',
  provider: 'local_test',
}

const unavailableConfig: AuthRuntimeConfig = {
  available: false,
  mode: 'unavailable',
  message: 'Authentication is loading.',
}

const serverSnapshot: AuthSessionSnapshot = {
  config: unavailableConfig,
  mode: 'unavailable',
  status: 'loading',
  message: 'Checking the ReeditPro session.',
}

function readStringMetadata(user: User, key: string): string | undefined {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function identityFromSupabaseUser(user: User): AuthIdentity {
  const emailName = user.email?.split('@')[0]
  return {
    id: user.id,
    email: user.email,
    displayName:
      readStringMetadata(user, 'display_name')
      ?? readStringMetadata(user, 'full_name')
      ?? readStringMetadata(user, 'name')
      ?? emailName
      ?? 'ReeditPro user',
    provider: 'supabase',
  }
}

function readLocalTestSession(): LocalTestSessionRecord | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const raw = window.sessionStorage.getItem(LOCAL_TEST_SESSION_KEY)
    if (!raw) return undefined

    const value = JSON.parse(raw) as Partial<LocalTestSessionRecord>
    if (
      value.version !== 1
      || value.userId !== LOCAL_TEST_IDENTITY.id
      || value.email !== LOCAL_TEST_IDENTITY.email
      || value.displayName !== LOCAL_TEST_IDENTITY.displayName
      || typeof value.createdAt !== 'string'
    ) {
      window.sessionStorage.removeItem(LOCAL_TEST_SESSION_KEY)
      return undefined
    }

    return value as LocalTestSessionRecord
  } catch {
    try {
      window.sessionStorage.removeItem(LOCAL_TEST_SESSION_KEY)
    } catch {
      // A privacy-restricted browser can deny storage access entirely.
    }
    return undefined
  }
}

function writeLocalTestSession(): boolean {
  if (typeof window === 'undefined') return false

  const record: LocalTestSessionRecord = {
    version: 1,
    userId: LOCAL_TEST_IDENTITY.id,
    email: LOCAL_TEST_IDENTITY.email ?? 'tester@local.reeditpro',
    displayName: LOCAL_TEST_IDENTITY.displayName,
    createdAt: new Date().toISOString(),
  }
  try {
    window.sessionStorage.setItem(LOCAL_TEST_SESSION_KEY, JSON.stringify(record))
    return true
  } catch {
    return false
  }
}

function clearLocalTestSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(LOCAL_TEST_SESSION_KEY)
  } catch {
    // Sign-out still clears the in-memory identity when storage is unavailable.
  }
}

class AuthSessionStore {
  private listeners = new Set<() => void>()
  private runId = 0
  private snapshot: AuthSessionSnapshot = serverSnapshot
  private unsubscribeSupabase?: () => void

  getSnapshot = (): AuthSessionSnapshot => this.snapshot

  getServerSnapshot = (): AuthSessionSnapshot => serverSnapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private publish(next: AuthSessionSnapshot): void {
    this.snapshot = next
    this.listeners.forEach((listener) => listener())
  }

  private publishSupabaseSession(config: AuthRuntimeConfig, session: Session | null): void {
    if (session?.user) {
      this.publish({
        config,
        identity: identityFromSupabaseUser(session.user),
        mode: 'supabase',
        status: 'signed_in',
        message: 'Signed in with Supabase.',
      })
      return
    }

    this.publish({
      config,
      mode: 'supabase',
      status: 'signed_out',
      message: 'Sign in to open your ReeditPro workspace.',
    })
  }

  start = (): (() => void) => {
    const currentRun = ++this.runId
    const config = getAuthRuntimeConfig()
    this.unsubscribeSupabase?.()
    this.unsubscribeSupabase = undefined

    if (!config.available) {
      this.publish({
        config,
        mode: 'unavailable',
        status: 'unavailable',
        message: config.message,
      })
    } else if (config.mode === 'local_test') {
      const signedIn = Boolean(readLocalTestSession())
      this.publish({
        config,
        identity: signedIn ? LOCAL_TEST_IDENTITY : undefined,
        mode: 'local_test',
        status: signedIn ? 'signed_in' : 'signed_out',
        message: signedIn
          ? 'Local test session is active.'
          : 'Start a local test session to open the workspace.',
      })
    } else {
      this.publish({
        config,
        mode: 'supabase',
        status: 'loading',
        message: 'Checking your Supabase session.',
      })
      void this.startSupabaseSession(currentRun, config)
    }

    return () => {
      if (this.runId !== currentRun) return
      this.runId += 1
      this.unsubscribeSupabase?.()
      this.unsubscribeSupabase = undefined
    }
  }

  private async startSupabaseSession(currentRun: number, config: AuthRuntimeConfig): Promise<void> {
    try {
      const authClient = await import('../backend/auth/auth-client-service')
      if (this.runId !== currentRun) return

      const subscription = authClient.onSupabaseAuthStateChange((event, session) => {
        if (this.runId !== currentRun) return
        if (event === 'SIGNED_OUT') {
          this.publishSupabaseSession(config, null)
          return
        }
        this.publishSupabaseSession(config, session)
      })
      this.unsubscribeSupabase = subscription.unsubscribe

      const result = await authClient.getCurrentSupabaseSession()
      if (this.runId !== currentRun) return

      if (result.status !== 'error') {
        this.publishSupabaseSession(config, result.session ?? null)
        return
      }

      this.publish({
        config,
        mode: 'supabase',
        status: 'signed_out',
        message: 'The saved session could not be verified. Sign in again.',
      })
    } catch {
      if (this.runId !== currentRun) return
      this.publish({
        config,
        mode: 'supabase',
        status: 'signed_out',
        message: 'The sign-in service could not be loaded. Try again.',
      })
    }
  }

  signInLocalTest = async (): Promise<AuthActionResult> => {
    const config = getAuthRuntimeConfig()
    if (!config.available || config.mode !== 'local_test') {
      return { ok: false, message: config.message }
    }

    if (!writeLocalTestSession()) {
      return { ok: false, message: 'This browser blocked tab-scoped session storage.' }
    }
    this.publish({
      config,
      identity: LOCAL_TEST_IDENTITY,
      mode: 'local_test',
      status: 'signed_in',
      message: 'Local test session started.',
    })
    return { ok: true, message: 'Local test session started.' }
  }

  signInWithPassword = async (email: string, password: string): Promise<AuthActionResult> => {
    const config = getAuthRuntimeConfig()
    if (!config.available || config.mode !== 'supabase') {
      return { ok: false, message: config.message }
    }

    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password) {
      return { ok: false, message: 'Enter your email and password.' }
    }

    try {
      const authClient = await import('../backend/auth/auth-client-service')
      const result = await authClient.signInWithEmailPassword(normalizedEmail, password)
      if (!result.ok || !result.session?.user) {
        return { ok: false, message: result.message || 'Sign-in failed.' }
      }

      this.publishSupabaseSession(config, result.session)
      return { ok: true, message: 'Signed in.' }
    } catch {
      return { ok: false, message: 'The sign-in service could not be loaded. Try again.' }
    }
  }

  signOut = async (): Promise<AuthActionResult> => {
    if (this.snapshot.mode === 'local_test') {
      clearLocalTestSession()
      const config = getAuthRuntimeConfig()
      this.publish({
        config,
        mode: config.mode,
        status: 'signed_out',
        message: 'Local test session ended.',
      })
      return { ok: true, message: 'Signed out.' }
    }

    if (this.snapshot.mode === 'supabase') {
      try {
        const authClient = await import('../backend/auth/auth-client-service')
        const result = await authClient.signOutSupabaseUser()
        if (!result.ok) return { ok: false, message: result.message }

        this.publishSupabaseSession(getAuthRuntimeConfig(), null)
        return { ok: true, message: 'Signed out.' }
      } catch {
        return { ok: false, message: 'Sign-out could not be completed. Try again.' }
      }
    }

    return { ok: false, message: 'No active session is available.' }
  }
}

const authSessionStore = new AuthSessionStore()

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    authSessionStore.subscribe,
    authSessionStore.getSnapshot,
    authSessionStore.getServerSnapshot,
  )

  useEffect(() => authSessionStore.start(), [])

  return (
    <AuthSessionContext.Provider
      value={{
        ...snapshot,
        signInLocalTest: authSessionStore.signInLocalTest,
        signInWithPassword: authSessionStore.signInWithPassword,
        signOut: authSessionStore.signOut,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  )
}
