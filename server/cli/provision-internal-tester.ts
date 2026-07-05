import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type ProvisionDecision =
  | 'internal_tester_backend_profile_workspace_provisioning_passed_ready_for_auth_readback'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_missing_confirmation'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_missing_env'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_invalid_input'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_auth_user_missing'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_supabase_error'

type ProfileIdentityColumn = 'user_id' | 'id'
type ProfileTableName = 'profiles' | 'user_profiles'

interface ProvisionResult {
  ok: boolean
  decision: ProvisionDecision
  message: string
  emailHash?: string
  userId?: string
  authUserCreatedOrInvited?: boolean
  profileId?: string
  profileIdentityColumn?: ProfileIdentityColumn
  workspaceId?: string
  membershipId?: string
  warnings: string[]
  nextStep: string
}

interface ProfileRow {
  id?: string
  user_id?: string
  display_name?: string | null
  avatar_url?: string | null
  email?: string | null
  metadata_json?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  default_workspace_id?: string | null
}

interface WorkspaceRow {
  id?: string
  owner_id?: string
  owner_user_id?: string
  name?: string
  plan_type?: string
  workspace_type?: string
  metadata_json?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

interface WorkspaceMemberRow {
  id?: string
  workspace_id?: string
  user_id?: string
  role?: string | null
  workspaces?: WorkspaceRow | WorkspaceRow[] | null
}

const CONFIRM_VALUE = 'PROVISION_REEDITPRO_INTERNAL_TESTER'
const SAFE_REDIRECT_ORIGINS = new Set([
  'https://yuzastudio6-cyber.github.io',
  'https://app.reeditpro.com',
])

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function output(result: ProvisionResult): never {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
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

function emailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateRedirect(url: string | undefined): string | undefined {
  if (!url) return undefined
  const parsed = new URL(url)
  if (!SAFE_REDIRECT_ORIGINS.has(parsed.origin)) {
    throw new Error('Redirect URL must target the GitHub Pages app or app.reeditpro.com.')
  }
  if (!parsed.pathname.endsWith('/sign-in')) {
    throw new Error('Redirect URL must end at the sign-in route.')
  }
  return parsed.toString()
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

function isConflictError(error: { code?: string; message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? ''
  return error.code === '23505' || message.includes('duplicate key') || message.includes('already exists')
}

function profileId(profile: ProfileRow): string | undefined {
  return clean(profile.id) ?? clean(profile.user_id)
}

function displayNameFor(email: string, explicit: string | undefined): string {
  return explicit ?? email.split('@')[0] ?? 'Internal Tester'
}

function workspaceNameFor(displayName: string, explicit: string | undefined): string {
  return explicit ?? `${displayName}'s ReEditPro Test Workspace`
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

async function inviteUserIfAllowed(
  client: SupabaseClient,
  email: string,
  displayName: string,
  redirectTo: string | undefined,
): Promise<User | undefined> {
  const options = {
    data: {
      display_name: displayName,
      provisioned_for: 'reeditpro_internal_testing',
    },
    redirectTo,
  }

  const { data, error } = await client.auth.admin.inviteUserByEmail(email, options)
  if (error) throw error
  return data.user ?? undefined
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

function profileInsertVariants(tableName: ProfileTableName, user: User, displayName: string): Array<Record<string, unknown>> {
  const base = {
    display_name: displayName,
    avatar_url: clean(user.user_metadata?.avatar_url as string | undefined) ?? clean(user.user_metadata?.picture as string | undefined),
  }
  const metadata = {
    bootstrap_source: 'backend_internal_testing_provisioning',
    email_hash: emailHash(user.email ?? user.id),
  }

  if (tableName === 'user_profiles') {
    return [
      { id: user.id, ...base, email: user.email, metadata },
      { id: user.id, ...base, email: user.email },
    ]
  }

  return [
    { user_id: user.id, ...base, metadata_json: metadata },
    { user_id: user.id, ...base },
    { id: user.id, ...base, metadata_json: metadata },
    { id: user.id, ...base },
  ]
}

async function ensureProfile(client: SupabaseClient, user: User, displayName: string): Promise<{
  profile: ProfileRow
  identityColumn: ProfileIdentityColumn
  tableName: ProfileTableName
}> {
  const existing = await findProfile(client, user.id)
  if (existing.profile && existing.identityColumn && existing.tableName) {
    return {
      profile: existing.profile,
      identityColumn: existing.identityColumn,
      tableName: existing.tableName,
    }
  }

  let lastError: { code?: string; message?: string } | undefined

  for (const tableName of ['profiles', 'user_profiles'] satisfies ProfileTableName[]) {
    for (const insert of profileInsertVariants(tableName, user, displayName)) {
      const { data, error } = await client
        .from(tableName)
        .insert(insert)
        .select('*')
        .single()

      if (!error && data) {
        const profile = data as ProfileRow
        return {
          profile,
          identityColumn: 'user_id' in insert ? 'user_id' : 'id',
          tableName,
        }
      }

      if (error) {
        lastError = error
        if (isConflictError(error)) {
          const refetched = await findProfile(client, user.id)
          if (refetched.profile && refetched.identityColumn && refetched.tableName) {
            return {
              profile: refetched.profile,
              identityColumn: refetched.identityColumn,
              tableName: refetched.tableName,
            }
          }
        }
        if (
          !isSchemaFallbackError(error)
          && !isMissingColumnError(error, 'user_id')
          && !isMissingColumnError(error, 'id')
          && !isMissingColumnError(error, 'metadata_json')
          && !isMissingColumnError(error, 'metadata')
          && !isMissingColumnError(error, 'email')
        ) {
          continue
        }
      }
    }
  }

  throw new Error(lastError?.message ?? 'Unable to create or read tester profile.')
}

function workspaceFromMember(member: WorkspaceMemberRow): WorkspaceRow | undefined {
  return Array.isArray(member.workspaces) ? member.workspaces[0] : member.workspaces ?? undefined
}

async function findExistingWorkspace(client: SupabaseClient, userId: string): Promise<{
  workspace?: WorkspaceRow
  membership?: WorkspaceMemberRow
}> {
  const selects = [
    'id, workspace_id, user_id, role, workspaces(id, owner_id, name, plan_type, metadata_json)',
    'id, workspace_id, user_id, role, workspaces(id, owner_user_id, name, workspace_type, metadata)',
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

function workspaceInsertVariants(ownerId: string, workspaceName: string): Array<Record<string, unknown>> {
  const metadata = {
    bootstrap_source: 'backend_internal_testing_provisioning',
  }

  return [
    { owner_id: ownerId, name: workspaceName, plan_type: 'internal_testing', metadata_json: metadata },
    { owner_id: ownerId, name: workspaceName, plan_type: 'internal_testing' },
    { owner_id: ownerId, name: workspaceName, plan_type: 'free', metadata_json: metadata },
    { owner_id: ownerId, name: workspaceName, plan_type: 'free' },
    { owner_user_id: ownerId, name: workspaceName, workspace_type: 'personal', metadata },
    { owner_user_id: ownerId, name: workspaceName, workspace_type: 'personal' },
  ]
}

async function ensureWorkspace(
  client: SupabaseClient,
  userId: string,
  workspaceName: string,
): Promise<{ workspace: WorkspaceRow; membership: WorkspaceMemberRow }> {
  const existing = await findExistingWorkspace(client, userId)
  if (existing.workspace && existing.membership) {
    return {
      workspace: existing.workspace,
      membership: existing.membership,
    }
  }

  const ownerId = userId
  let workspace: WorkspaceRow | undefined
  let lastError: { code?: string; message?: string } | undefined

  for (const insert of workspaceInsertVariants(ownerId, workspaceName)) {
    const select = 'owner_user_id' in insert
      ? 'id, owner_user_id, name, workspace_type, metadata'
      : 'id, owner_id, name, plan_type, metadata_json'
    const { data, error } = await client
      .from('workspaces')
      .insert(insert)
      .select(select)
      .single()

    if (!error && data) {
      workspace = data as WorkspaceRow
      break
    }

    if (error) {
      lastError = error
      if (
        !isSchemaFallbackError(error)
        && !isMissingColumnError(error, 'metadata_json')
        && !isMissingColumnError(error, 'metadata')
        && !isMissingColumnError(error, 'plan_type')
        && !isMissingColumnError(error, 'workspace_type')
      ) {
        continue
      }
    }
  }

  if (!workspace?.id) {
    throw new Error(lastError?.message ?? 'Unable to create tester workspace.')
  }

  const { data: membership, error: membershipError } = await client
    .from('workspace_members')
    .upsert(
      {
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
      },
      {
        onConflict: 'workspace_id,user_id',
      },
    )
    .select('id, workspace_id, user_id, role')
    .single()

  if (membershipError) throw membershipError

  return {
    workspace,
    membership: membership as WorkspaceMemberRow,
  }
}

async function main() {
  const confirm = clean(process.env.REEDITPRO_CONFIRM_INTERNAL_TESTER_PROVISIONING)
  const allowWrites = clean(process.env.REEDITPRO_CONFIRM_STAGING_SUPABASE_WRITES)
  const supabaseUrl = clean(process.env.SUPABASE_URL)
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const rawEmail = clean(process.env.INTERNAL_TESTER_EMAIL)?.toLowerCase()
  const createAuthUserIfMissing = clean(process.env.INTERNAL_TESTER_INVITE_IF_MISSING) === 'true'
  const displayName = rawEmail ? displayNameFor(rawEmail, clean(process.env.INTERNAL_TESTER_DISPLAY_NAME)) : undefined
  const workspaceName = displayName ? workspaceNameFor(displayName, clean(process.env.INTERNAL_TESTER_WORKSPACE_NAME)) : undefined

  if (confirm !== CONFIRM_VALUE || allowWrites !== 'true') {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_missing_confirmation',
      message: 'Provisioning requires explicit internal tester and staging write confirmations.',
      warnings: [],
      nextStep: 'set_required_confirmations',
    })
  }

  if (!supabaseUrl || !serviceRoleKey) {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_missing_env',
      message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in the backend-only workflow environment.',
      warnings: [],
      nextStep: 'configure_staging_supabase_secrets',
    })
  }

  if (!rawEmail || !validateEmail(rawEmail) || !displayName || !workspaceName) {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_invalid_input',
      message: 'A valid INTERNAL_TESTER_EMAIL is required.',
      warnings: [],
      nextStep: 'provide_internal_tester_email',
    })
  }

  let redirectTo: string | undefined
  try {
    redirectTo = validateRedirect(clean(process.env.INTERNAL_TESTER_REDIRECT_TO))
  } catch (error) {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_invalid_input',
      message: error instanceof Error ? error.message : 'Invalid redirect URL.',
      emailHash: emailHash(rawEmail),
      warnings: [],
      nextStep: 'use_safe_sign_in_redirect',
    })
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    let user = await findUserByEmail(client, rawEmail)
    let authUserCreatedOrInvited = false

    if (!user && createAuthUserIfMissing) {
      user = await inviteUserIfAllowed(client, rawEmail, displayName, redirectTo)
      authUserCreatedOrInvited = Boolean(user)
    }

    if (!user) {
      output({
        ok: false,
        decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_auth_user_missing',
        message: 'No Supabase Auth user exists for this tester email. Create the account from the sign-in page first or rerun with invite-if-missing enabled.',
        emailHash: emailHash(rawEmail),
        warnings: [],
        nextStep: 'create_or_invite_internal_tester_auth_user',
      })
    }

    const { profile, identityColumn } = await ensureProfile(client, user, displayName)
    const { workspace, membership } = await ensureWorkspace(client, user.id, workspaceName)

    output({
      ok: true,
      decision: 'internal_tester_backend_profile_workspace_provisioning_passed_ready_for_auth_readback',
      message: 'Internal tester profile, workspace, and owner membership are ready for browser auth readback.',
      emailHash: emailHash(rawEmail),
      userId: user.id,
      authUserCreatedOrInvited,
      profileId: profileId(profile),
      profileIdentityColumn: identityColumn,
      workspaceId: workspace.id,
      membershipId: membership.id,
      warnings: [],
      nextStep: 'sign_in_and_verify_workspace_ready',
    })
  } catch (error) {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_supabase_error',
      message: error instanceof Error
        ? sanitizeForOutput(error.message, rawEmail)
        : 'Supabase provisioning failed.',
      emailHash: emailHash(rawEmail),
      warnings: ['The workflow does not print service-role secrets, passwords, or signed URLs.'],
      nextStep: 'inspect_staging_schema_or_auth_user_state',
    })
  }
}

void main()
