import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

type BrowserSignInDecision =
  | 'internal_tester_browser_sign_in_verification_passed_ready_for_internal_testing_route'
  | 'internal_tester_browser_sign_in_verification_blocked_missing_confirmation'
  | 'internal_tester_browser_sign_in_verification_blocked_missing_env'
  | 'internal_tester_browser_sign_in_verification_blocked_invalid_input'
  | 'internal_tester_browser_sign_in_verification_blocked_email_not_confirmed'
  | 'internal_tester_browser_sign_in_verification_blocked_sign_in_failed'
  | 'internal_tester_browser_sign_in_verification_blocked_session_missing'
  | 'internal_tester_browser_sign_in_verification_blocked_supabase_error'

interface BrowserSignInResult {
  ok: boolean
  decision: BrowserSignInDecision
  message: string
  emailHash?: string
  userId?: string
  sessionReturned?: boolean
  emailConfirmed?: boolean
  expiresAt?: number
  authMode: 'supabase_anon_browser_equivalent'
  serviceRoleUsed: false
  passwordPrinted: false
  tokenPrinted: false
  warnings: string[]
  nextStep: string
}

const CONFIRM_VALUE = 'VERIFY_REEDITPRO_INTERNAL_TESTER_BROWSER_SIGN_IN'

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = clean(process.env[key])
    if (value) return value
  }
  return undefined
}

function output(result: BrowserSignInResult): never {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
}

function emailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitizeForOutput(message: string, email?: string, password?: string): string {
  let sanitized = message

  if (email) sanitized = sanitized.replaceAll(email, '[internal-tester-email]')
  if (password) sanitized = sanitized.replaceAll(password, '[internal-tester-password]')

  return sanitized
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    .replace(/(access_token|refresh_token|token|apikey|api[_-]?key|secret)=\S+/gi, '$1=[redacted]')
    .replace(/(password|passwd|pwd)=\S+/gi, '$1=[redacted]')
}

function isEmailConfirmationFailure(message: string): boolean {
  return /email.*not.*confirm|confirm.*email|email.*confirm/i.test(message)
}

function emailConfirmed(user: { email_confirmed_at?: string | null; confirmed_at?: string | null }): boolean {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at)
}

async function main() {
  const confirm = clean(process.env.REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_SIGN_IN)
  const supabaseUrl = readEnv('VITE_SUPABASE_URL', 'SUPABASE_URL')
  const anonKey = readEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')
  const rawEmail = clean(process.env.INTERNAL_TESTER_EMAIL)?.toLowerCase()
  const password = clean(process.env.INTERNAL_TESTER_PASSWORD)

  if (confirm !== CONFIRM_VALUE) {
    output({
      ok: false,
      decision: 'internal_tester_browser_sign_in_verification_blocked_missing_confirmation',
      message: 'Browser sign-in verification requires explicit internal tester sign-in confirmation.',
      authMode: 'supabase_anon_browser_equivalent',
      serviceRoleUsed: false,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: [],
      nextStep: 'set_required_browser_sign_in_confirmation',
    })
  }

  if (!supabaseUrl || !anonKey) {
    output({
      ok: false,
      decision: 'internal_tester_browser_sign_in_verification_blocked_missing_env',
      message: 'VITE_SUPABASE_URL/SUPABASE_URL and VITE_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY are required.',
      authMode: 'supabase_anon_browser_equivalent',
      serviceRoleUsed: false,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: ['This verifier uses only frontend-safe public Supabase configuration.'],
      nextStep: 'configure_public_supabase_auth_env',
    })
  }

  if (!rawEmail || !validateEmail(rawEmail) || !password || password.length < 8) {
    output({
      ok: false,
      decision: 'internal_tester_browser_sign_in_verification_blocked_invalid_input',
      message: 'A valid INTERNAL_TESTER_EMAIL and INTERNAL_TESTER_PASSWORD with at least 8 characters are required.',
      emailHash: rawEmail && validateEmail(rawEmail) ? emailHash(rawEmail) : undefined,
      authMode: 'supabase_anon_browser_equivalent',
      serviceRoleUsed: false,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: ['Credentials are read from environment and are never printed.'],
      nextStep: 'provide_internal_tester_email_and_password',
    })
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: rawEmail,
      password,
    })

    if (error) {
      const message = sanitizeForOutput(error.message, rawEmail, password)
      output({
        ok: false,
        decision: isEmailConfirmationFailure(error.message)
          ? 'internal_tester_browser_sign_in_verification_blocked_email_not_confirmed'
          : 'internal_tester_browser_sign_in_verification_blocked_sign_in_failed',
        message,
        emailHash: emailHash(rawEmail),
        authMode: 'supabase_anon_browser_equivalent',
        serviceRoleUsed: false,
        passwordPrinted: false,
        tokenPrinted: false,
        warnings: ['No token, password, service-role secret, invite link, or signed URL was printed.'],
        nextStep: isEmailConfirmationFailure(error.message)
          ? 'confirm_or_backend_provision_internal_tester_before_browser_sign_in'
          : 'check_internal_tester_email_password_and_public_auth_settings',
      })
    }

    if (!data.session?.access_token || !data.user?.id) {
      output({
        ok: false,
        decision: 'internal_tester_browser_sign_in_verification_blocked_session_missing',
        message: 'Supabase sign-in returned without a usable browser session.',
        emailHash: emailHash(rawEmail),
        userId: data.user?.id,
        sessionReturned: Boolean(data.session),
        emailConfirmed: data.user ? emailConfirmed(data.user) : undefined,
        authMode: 'supabase_anon_browser_equivalent',
        serviceRoleUsed: false,
        passwordPrinted: false,
        tokenPrinted: false,
        warnings: ['No token, password, service-role secret, invite link, or signed URL was printed.'],
        nextStep: 'inspect_public_auth_settings_and_tester_confirmation_state',
      })
    }

    await client.auth.signOut().catch(() => undefined)

    output({
      ok: true,
      decision: 'internal_tester_browser_sign_in_verification_passed_ready_for_internal_testing_route',
      message: 'Internal tester email/password sign-in returned a browser-safe Supabase session.',
      emailHash: emailHash(rawEmail),
      userId: data.user.id,
      sessionReturned: true,
      emailConfirmed: emailConfirmed(data.user),
      expiresAt: data.session.expires_at,
      authMode: 'supabase_anon_browser_equivalent',
      serviceRoleUsed: false,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: [
        'Verifier used only the public anon Supabase path equivalent to browser sign-in.',
        'No service-role secret, token value, password, invite link, signed URL, provider call, worker dispatch, media processing, render, credit action, or production unlock occurred.',
      ],
      nextStep: 'open_deployed_sign_in_route_and_continue_to_internal_testing',
    })
  } catch (error) {
    output({
      ok: false,
      decision: 'internal_tester_browser_sign_in_verification_blocked_supabase_error',
      message: error instanceof Error
        ? sanitizeForOutput(error.message, rawEmail, password)
        : 'Supabase browser sign-in verification failed.',
      emailHash: rawEmail ? emailHash(rawEmail) : undefined,
      authMode: 'supabase_anon_browser_equivalent',
      serviceRoleUsed: false,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: ['No token, password, service-role secret, invite link, or signed URL was printed.'],
      nextStep: 'inspect_public_auth_and_network_state',
    })
  }
}

void main()
