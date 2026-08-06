import type { AuthRuntimeConfig, AuthRuntimeMode } from './auth-runtime-config'

export type AuthSessionStatus = 'loading' | 'signed_in' | 'signed_out' | 'unavailable'

export interface AuthIdentity {
  id: string
  email?: string
  displayName: string
  provider: 'google' | 'local_test' | 'supabase'
}

export interface AuthSessionSnapshot {
  config: AuthRuntimeConfig
  identity?: AuthIdentity
  mode: AuthRuntimeMode
  status: AuthSessionStatus
  message: string
}

export interface AuthActionResult {
  ok: boolean
  message: string
}

export interface AuthSessionContextValue extends AuthSessionSnapshot {
  signInLocalTest: () => Promise<AuthActionResult>
  signInWithGoogle: (returnTo: string) => Promise<AuthActionResult>
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>
  signOut: () => Promise<AuthActionResult>
}
