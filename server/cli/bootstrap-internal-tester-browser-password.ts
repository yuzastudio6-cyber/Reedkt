import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type BootstrapDecision =
  | 'internal_tester_browser_password_bootstrap_passed_ready_for_profile_workspace_provisioning'
  | 'internal_tester_browser_password_bootstrap_blocked_missing_confirmation'
  | 'internal_tester_browser_password_bootstrap_blocked_missing_env'
  | 'internal_tester_browser_password_bootstrap_blocked_invalid_input'
  | 'internal_tester_browser_password_bootstrap_blocked_supabase_error'

interface BootstrapResult {
  ok: boolean
  decision: BootstrapDecision
  message: string
  emailHash?: string
  userId?: string
  authUserCreated?: boolean
  passwordConfigured?: boolean
  emailConfirmedRequested?: boolean
  serviceRoleUsed: boolean
  passwordPrinted: false
  tokenPrinted: false
  warnings: string[]
  nextStep: string
}

const CONFIRM_VALUE = 'BOOTSTRAP_REEDITPRO_INTERNAL_TESTER_BROWSER_PASSWORD'
const MIN_PASSWORD_LENGTH = 12

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function output(result: BootstrapResult): never {
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
    .replace(/(service[_-]?role|apikey|api[_-]?key|token|secret)=\S+/gi, '$1=[redacted]')
    .replace(/(password|passwd|pwd)=\S+/gi, '$1=[redacted]')
}

async function findUserByEmail(client: SupabaseClient, email: string): Promise<User | undefined> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 1000) return undefined
  }

  return undefined
}

function createUserMetadata(email: string, displayName: string | undefined, existing?: User): Record<string, unknown> {
  return {
    ...(existing?.user_metadata ?? {}),
    display_name: displayName ?? existing?.user_metadata?.display_name ?? email.split('@')[0],
    provisioned_for: 'reeditpro_internal_testing',
    browser_password_bootstrap: true,
  }
}

async function main() {
  const confirm = clean(process.env.REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_PASSWORD_BOOTSTRAP)
  const allowWrites = clean(process.env.REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES)
  const supabaseUrl = clean(process.env.SUPABASE_URL)
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const rawEmail = clean(process.env.INTERNAL_TESTER_EMAIL)?.toLowerCase()
  const password = clean(process.env.INTERNAL_TESTER_PASSWORD)
  const displayName = clean(process.env.INTERNAL_TESTER_DISPLAY_NAME)

  if (confirm !== CONFIRM_VALUE || allowWrites !== 'true') {
    output({
      ok: false,
      decision: 'internal_tester_browser_password_bootstrap_blocked_missing_confirmation',
      message: 'Password bootstrap requires explicit internal tester and staging write confirmations.',
      serviceRoleUsed: false,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: [],
      nextStep: 'set_required_confirmations',
    })
  }

  if (!supabaseUrl || !serviceRoleKey || !password) {
    output({
      ok: false,
      decision: 'internal_tester_browser_password_bootstrap_blocked_missing_env',
      message: 'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and INTERNAL_TESTER_PASSWORD are required in the backend-only workflow environment.',
      emailHash: rawEmail ? emailHash(rawEmail) : undefined,
      serviceRoleUsed: Boolean(serviceRoleKey),
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: [],
      nextStep: 'configure_staging_supabase_and_password_secrets',
    })
  }

  if (!rawEmail || !validateEmail(rawEmail) || password.length < MIN_PASSWORD_LENGTH) {
    output({
      ok: false,
      decision: 'internal_tester_browser_password_bootstrap_blocked_invalid_input',
      message: `A valid INTERNAL_TESTER_EMAIL and INTERNAL_TESTER_PASSWORD with at least ${MIN_PASSWORD_LENGTH} characters are required.`,
      emailHash: rawEmail ? emailHash(rawEmail) : undefined,
      serviceRoleUsed: true,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: [],
      nextStep: 'provide_valid_internal_tester_email_and_password_secret',
    })
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const existing = await findUserByEmail(client, rawEmail)
    const metadata = createUserMetadata(rawEmail, displayName, existing)
    const { data, error } = existing
      ? await client.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: metadata,
      })
      : await client.auth.admin.createUser({
        email: rawEmail,
        password,
        email_confirm: true,
        user_metadata: metadata,
      })

    if (error) throw error

    const user = data.user ?? existing
    if (!user) throw new Error('Supabase did not return an internal tester Auth user.')

    output({
      ok: true,
      decision: 'internal_tester_browser_password_bootstrap_passed_ready_for_profile_workspace_provisioning',
      message: 'Internal tester Auth password is configured for browser-safe sign-in verification.',
      emailHash: emailHash(rawEmail),
      userId: user.id,
      authUserCreated: !existing,
      passwordConfigured: true,
      emailConfirmedRequested: true,
      serviceRoleUsed: true,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: ['No password, token, invite link, signed URL, or service-role key was printed.'],
      nextStep: 'run_internal_tester_profile_workspace_provisioning_then_browser_sign_in_verification',
    })
  } catch (error) {
    output({
      ok: false,
      decision: 'internal_tester_browser_password_bootstrap_blocked_supabase_error',
      message: error instanceof Error
        ? sanitizeForOutput(error.message, rawEmail, password)
        : 'Supabase Auth password bootstrap failed.',
      emailHash: emailHash(rawEmail),
      serviceRoleUsed: true,
      passwordPrinted: false,
      tokenPrinted: false,
      warnings: ['The workflow does not print service-role secrets, passwords, tokens, invite links, or signed URLs.'],
      nextStep: 'inspect_staging_auth_user_state',
    })
  }
}

void main()
