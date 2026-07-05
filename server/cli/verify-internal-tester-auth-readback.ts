import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type ReadbackDecision =
  | 'internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test'
  | 'internal_tester_sign_in_auth_readback_blocked_missing_confirmation'
  | 'internal_tester_sign_in_auth_readback_blocked_missing_env'
  | 'internal_tester_sign_in_auth_readback_blocked_invalid_input'
  | 'internal_tester_sign_in_auth_readback_blocked_auth_user_missing'
  | 'internal_tester_sign_in_auth_readback_blocked_profile_missing'
  | 'internal_tester_sign_in_auth_readback_blocked_workspace_membership_missing'
  | 'internal_tester_sign_in_auth_readback_blocked_supabase_error'

type ProfileIdentityColumn = 'user_id' | 'id'
type ProfileTableName = 'profiles' | 'user_profiles'

interface ReadbackResult {
  ok: boolean
  decision: ReadbackDecision
  message: string
  emailHash?: string
  userId?: string
  authEmailConfirmed?: boolean
  authLastSignInAt?: string | null
  profileId?: string
  profileIdentityColumn?: ProfileIdentityColumn
  workspaceId?: string
  membershipId?: string
  membershipRole?: string | null
  warnings: string[]
  nextStep: string
}

interface ProfileRow {
  id?: string
  user_id?: string
  display_name?: string | null
  default_workspace_id?: string | null
  metadata_json?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

interface WorkspaceRow {
  id?: string
  owner_id?: string
  owner_user_id?: string
  name?: string | null
  plan_type?: string | null
  workspace_type?: string | null
}

interface WorkspaceMemberRow {
  id?: string
  workspace_id?: string
  user_id?: string
  role?: string | null
  workspaces?: WorkspaceRow | WorkspaceRow[] | null
}

const CONFIRM_VALUE = 'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK'

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function output(result: ReadbackResult): never {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
}

function emailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitizeForOutput(message: string, email?: string): string {
  let sanitized = message

  if (email) {
    sanitized = sanitized.replaceAll(email, '[internal-tester-email]')
  }

  return sanitized
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    .replace(/(service[_-]?role|apikey|api[_-]?key|token|secret)=\S+/gi, '$1=[redacted]')
    .replace(/(password|passwd|pwd)=\S+/gi, '$1=[redacted]')
}

function isMissingColumnError(error: { code?: string; message?: string }, columnName: string): boolean {
  const message = error.message?.toLowerCase() ?? ''
  const normalizedColumn = columnName.toLowerCase()

  return (
    error.code === '42703'
    || error.code === 'PGRST204'
    || (
      message.includes(normalizedColumn)
      && (
        message.includes('column')
        || message.includes('schema cache')
        || message.includes('does not exist')
        || message.includes('could not find')
      )
    )
  )
}

function isSchemaFallbackError(error: { code?: string; message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === '42703'
    || error.code === '42P01'
    || error.code === 'PGRST200'
    || error.code === 'PGRST204'
    || error.code === 'PGRST205'
    || message.includes('schema cache')
    || message.includes('could not find')
    || message.includes('does not exist')
    || message.includes('column')
    || message.includes('relationship')
    || message.includes('owner_user_id')
    || message.includes('owner_id')
  )
}

function profileId(profile: ProfileRow): string | undefined {
  return clean(profile.id) ?? clean(profile.user_id)
}

function workspaceFromMember(member: WorkspaceMemberRow): WorkspaceRow | undefined {
  return Array.isArray(member.workspaces) ? member.workspaces[0] : member.workspaces ?? undefined
}

function authEmailConfirmed(user: User): boolean {
  const authUser = user as User & {
    email_confirmed_at?: string | null
    confirmed_at?: string | null
  }
  return Boolean(authUser.email_confirmed_at ?? authUser.confirmed_at)
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

async function findProfile(client: SupabaseClient, userId: string): Promise<{
  profile?: ProfileRow
  identityColumn?: ProfileIdentityColumn
  tableName?: ProfileTableName
}> {
  for (const tableName of ['profiles', 'user_profiles'] satisfies ProfileTableName[]) {
    for (const column of ['user_id', 'id'] satisfies ProfileIdentityColumn[]) {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq(column, userId)
        .maybeSingle()

      if (!error) {
        if (data) {
          return {
            profile: data as ProfileRow,
            identityColumn: column,
            tableName,
          }
        }
        continue
      }

      if (!isSchemaFallbackError(error) && !isMissingColumnError(error, column)) throw error
    }
  }

  return {}
}

async function findWorkspaceMembership(client: SupabaseClient, userId: string): Promise<{
  workspace?: WorkspaceRow
  membership?: WorkspaceMemberRow
}> {
  const selects = [
    'id, workspace_id, user_id, role, workspaces(id, owner_id, name, plan_type)',
    'id, workspace_id, user_id, role, workspaces(id, owner_user_id, name, workspace_type)',
    'id, workspace_id, user_id, role',
  ]
  let data: unknown[] | null = null
  let error: { code?: string; message?: string } | null = null

  for (const select of selects) {
    const result = await client
      .from('workspace_members')
      .select(select)
      .eq('user_id', userId)
      .limit(1)

    data = result.data as unknown[] | null
    error = result.error

    if (!error) break
    if (isSchemaFallbackError(error)) continue
    break
  }

  if (error) throw error

  const membership = ((data ?? []) as WorkspaceMemberRow[])[0]
  return {
    workspace: membership ? workspaceFromMember(membership) : undefined,
    membership,
  }
}

async function main() {
  const confirm = clean(process.env.REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK)
  const supabaseUrl = clean(process.env.SUPABASE_URL)
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const rawEmail = clean(process.env.INTERNAL_TESTER_EMAIL)?.toLowerCase()

  if (confirm !== CONFIRM_VALUE) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_missing_confirmation',
      message: 'Auth readback requires explicit internal tester readback confirmation.',
      warnings: [],
      nextStep: 'set_required_readback_confirmation',
    })
  }

  if (!supabaseUrl || !serviceRoleKey) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_missing_env',
      message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in the backend-only readback workflow environment.',
      warnings: [],
      nextStep: 'configure_staging_supabase_secrets',
    })
  }

  if (!rawEmail || !validateEmail(rawEmail)) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_invalid_input',
      message: 'A valid INTERNAL_TESTER_EMAIL is required.',
      warnings: [],
      nextStep: 'provide_internal_tester_email',
    })
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const user = await findUserByEmail(client, rawEmail)

    if (!user) {
      output({
        ok: false,
        decision: 'internal_tester_sign_in_auth_readback_blocked_auth_user_missing',
        message: 'No Supabase Auth user exists for this tester email.',
        emailHash: emailHash(rawEmail),
        warnings: [],
        nextStep: 'run_internal_tester_profile_workspace_provisioning_or_create_auth_user',
      })
    }

    const { profile, identityColumn } = await findProfile(client, user.id)

    if (!profile || !identityColumn) {
      output({
        ok: false,
        decision: 'internal_tester_sign_in_auth_readback_blocked_profile_missing',
        message: 'The tester Auth user exists, but no compatible profile row was found.',
        emailHash: emailHash(rawEmail),
        userId: user.id,
        authEmailConfirmed: authEmailConfirmed(user),
        authLastSignInAt: user.last_sign_in_at ?? null,
        warnings: [],
        nextStep: 'run_internal_tester_profile_workspace_provisioning',
      })
    }

    const { workspace, membership } = await findWorkspaceMembership(client, user.id)

    if (!workspace?.id || !membership?.id) {
      output({
        ok: false,
        decision: 'internal_tester_sign_in_auth_readback_blocked_workspace_membership_missing',
        message: 'The tester profile exists, but no workspace membership was found.',
        emailHash: emailHash(rawEmail),
        userId: user.id,
        authEmailConfirmed: authEmailConfirmed(user),
        authLastSignInAt: user.last_sign_in_at ?? null,
        profileId: profileId(profile),
        profileIdentityColumn: identityColumn,
        warnings: [],
        nextStep: 'run_internal_tester_profile_workspace_provisioning',
      })
    }

    const warnings = authEmailConfirmed(user)
      ? []
      : ['Auth user exists and rows are ready, but email confirmation was not observed in admin readback. If the project requires confirmed email, accept the invite or confirm the account before browser sign-in.']

    output({
      ok: true,
      decision: 'internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test',
      message: 'Internal tester Auth user, profile, workspace, and membership are ready for browser sign-in readback testing.',
      emailHash: emailHash(rawEmail),
      userId: user.id,
      authEmailConfirmed: authEmailConfirmed(user),
      authLastSignInAt: user.last_sign_in_at ?? null,
      profileId: profileId(profile),
      profileIdentityColumn: identityColumn,
      workspaceId: workspace.id,
      membershipId: membership.id,
      membershipRole: membership.role ?? null,
      warnings,
      nextStep: 'open_github_pages_sign_in_and_verify_internal_testing_route',
    })
  } catch (error) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_supabase_error',
      message: error instanceof Error
        ? sanitizeForOutput(error.message, rawEmail)
        : 'Supabase auth readback failed.',
      emailHash: emailHash(rawEmail),
      warnings: ['The workflow does not print service-role secrets, passwords, or signed URLs.'],
      nextStep: 'inspect_staging_auth_profile_workspace_state',
    })
  }
}

void main()
