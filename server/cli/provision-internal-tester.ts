import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import {
  inspectInternalTesterGoogleIdentity,
  internalTesterEmailHash,
  normalizeExpectedEmailHash,
  normalizeStagingSupabaseUrl,
  privateIdentifierHash,
} from '../auth/internal-tester-google-identity'

type ProvisionDecision =
  | 'internal_tester_backend_profile_workspace_provisioning_passed_ready_for_auth_readback'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_missing_confirmation'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_missing_env'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_invalid_input'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_auth_user_missing'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_google_session_not_observed'
  | 'internal_tester_backend_profile_workspace_provisioning_blocked_supabase_error'

type ProfileIdentityColumn = 'user_id' | 'id'
type ProfileTableName = 'profiles' | 'user_profiles'
type WorkspaceIdentityContract = 'direct_auth_user' | 'legacy_user_profile'

interface ProvisionResult {
  ok: boolean
  decision: ProvisionDecision
  message: string
  emailHash?: string
  userIdHash?: string
  googleIdentityObserved?: boolean
  authEmailConfirmed?: boolean
  priorAuthSignInObserved?: boolean
  readyForProfileWorkspaceProvisioning?: boolean
  profileIdHash?: string
  profileIdentityColumn?: ProfileIdentityColumn
  profileTableName?: ProfileTableName
  workspaceIdentityContract?: WorkspaceIdentityContract
  workspaceIdHash?: string
  membershipIdHash?: string
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
}

const CONFIRM_VALUE = 'PROVISION_REEDITPRO_INTERNAL_TESTER'

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function output(result: ProvisionResult): never {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
}

function sanitizeForOutput(message: string, sensitiveValues: Array<string | undefined>): string {
  let sanitized = message

  for (const value of sensitiveValues) {
    if (value) sanitized = sanitized.replaceAll(value, '[redacted-sensitive-value]')
  }

  return sanitized
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[redacted-identifier]')
    .replace(/(service[_-]?role|apikey|api[_-]?key|token|secret)=\S+/gi, '$1=[redacted]')
    .replace(/(password|passwd|pwd)=\S+/gi, '$1=[redacted]')
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

async function resolveWorkspaceIdentityContract(client: SupabaseClient): Promise<WorkspaceIdentityContract> {
  // The legacy table can also contain a backfilled owner_id column, while its
  // owner_user_id column remains required. Prefer that contract when present.
  for (const candidate of [
    { contract: 'legacy_user_profile' as const, select: 'id, owner_user_id' },
    { contract: 'direct_auth_user' as const, select: 'id, owner_id' },
  ]) {
    const { error } = await client
      .from('workspaces')
      .select(candidate.select)
      .limit(0)

    if (!error) return candidate.contract
    if (isSchemaFallbackError(error)) continue
    throw error
  }

  throw new Error('No compatible staging workspace identity contract was found.')
}

function profileId(profile: ProfileRow): string | undefined {
  return clean(profile.id) ?? clean(profile.user_id)
}

function displayNameFor(explicit: string | undefined): string {
  return explicit ?? 'Internal Tester'
}

function workspaceNameFor(displayName: string, explicit: string | undefined): string {
  return explicit ?? `${displayName}'s ReEditPro Test Workspace`
}

function validLabel(value: string, maxLength: number): boolean {
  return value.length > 0
    && value.length <= maxLength
    && [...value].every((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint >= 32 && codePoint !== 127
    })
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

async function findProfile(
  client: SupabaseClient,
  userId: string,
  workspaceIdentityContract: WorkspaceIdentityContract,
): Promise<{
  profile?: ProfileRow
  identityColumn?: ProfileIdentityColumn
  tableName?: ProfileTableName
}> {
  const candidates = workspaceIdentityContract === 'direct_auth_user'
    ? [
      { tableName: 'profiles' as const, column: 'user_id' as const },
      { tableName: 'profiles' as const, column: 'id' as const },
    ]
    : [{ tableName: 'user_profiles' as const, column: 'id' as const }]

  for (const { tableName, column } of candidates) {
    const { data, error } = await client
      .from(tableName)
      .select(column === 'user_id' ? 'id, user_id' : 'id')
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

  return {}
}

function profileInsertVariants(tableName: ProfileTableName, user: User, displayName: string): Array<Record<string, unknown>> {
  const base = {
    display_name: displayName,
    avatar_url: clean(user.user_metadata?.avatar_url) ?? clean(user.user_metadata?.picture),
  }
  const metadata = {
    bootstrap_source: 'backend_internal_testing_provisioning',
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

async function ensureProfile(
  client: SupabaseClient,
  user: User,
  displayName: string,
  workspaceIdentityContract: WorkspaceIdentityContract,
): Promise<{
  profile: ProfileRow
  identityColumn: ProfileIdentityColumn
  tableName: ProfileTableName
}> {
  const existing = await findProfile(client, user.id, workspaceIdentityContract)
  if (existing.profile && existing.identityColumn && existing.tableName) {
    return {
      profile: existing.profile,
      identityColumn: existing.identityColumn,
      tableName: existing.tableName,
    }
  }

  let lastError: { code?: string; message?: string } | undefined

  const tableNames: ProfileTableName[] = workspaceIdentityContract === 'direct_auth_user'
    ? ['profiles']
    : ['user_profiles']

  for (const tableName of tableNames) {
    for (const insert of profileInsertVariants(tableName, user, displayName)) {
      const { data, error } = await client
        .from(tableName)
        .insert(insert)
        .select('user_id' in insert ? 'id, user_id' : 'id')
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
          const refetched = await findProfile(client, user.id, workspaceIdentityContract)
          if (refetched.profile && refetched.identityColumn && refetched.tableName) {
            return {
              profile: refetched.profile,
              identityColumn: refetched.identityColumn,
              tableName: refetched.tableName,
            }
          }
        }
        const compatibleSchemaError = isSchemaFallbackError(error)
          || isMissingColumnError(error, 'user_id')
          || isMissingColumnError(error, 'id')
          || isMissingColumnError(error, 'metadata_json')
          || isMissingColumnError(error, 'metadata')
          || isMissingColumnError(error, 'email')
        if (compatibleSchemaError) continue
        throw error
      }
    }
  }

  throw new Error(lastError?.message ?? 'Unable to create or read tester profile.')
}

async function findOwnedWorkspace(
  client: SupabaseClient,
  userId: string,
  workspaceIdentityContract: WorkspaceIdentityContract,
): Promise<WorkspaceRow | undefined> {
  const ownerColumn = workspaceIdentityContract === 'direct_auth_user'
    ? 'owner_id'
    : 'owner_user_id'
  const select = workspaceIdentityContract === 'direct_auth_user'
    ? 'id, owner_id, name, plan_type, metadata_json'
    : 'id, owner_user_id, name, workspace_type, metadata'
  const { data, error } = await client
    .from('workspaces')
    .select(select)
    .eq(ownerColumn, userId)
    .limit(1)

  if (error) throw error
  return (data as WorkspaceRow[] | null)?.[0]
}

async function findExistingWorkspace(
  client: SupabaseClient,
  userId: string,
  workspaceIdentityContract: WorkspaceIdentityContract,
): Promise<{
  workspace?: WorkspaceRow
  membership?: WorkspaceMemberRow
}> {
  const workspace = await findOwnedWorkspace(client, userId, workspaceIdentityContract)
  if (!workspace?.id) return {}

  const { data, error } = await client
    .from('workspace_members')
    .select('id, workspace_id, user_id, role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', userId)
    .limit(1)

  if (error) throw error
  const membership = (data as WorkspaceMemberRow[] | null)?.[0]

  return {
    workspace,
    membership,
  }
}

function workspaceInsertVariants(
  ownerId: string,
  workspaceName: string,
  workspaceIdentityContract: WorkspaceIdentityContract,
): Array<Record<string, unknown>> {
  const metadata = {
    bootstrap_source: 'backend_internal_testing_provisioning',
  }

  return workspaceIdentityContract === 'direct_auth_user'
    ? [
      { owner_id: ownerId, name: workspaceName, plan_type: 'free', metadata_json: metadata },
      { owner_id: ownerId, name: workspaceName, plan_type: 'free' },
    ]
    : [
      { owner_user_id: ownerId, name: workspaceName, workspace_type: 'personal', metadata },
      { owner_user_id: ownerId, name: workspaceName, workspace_type: 'personal' },
    ]
}

async function ensureWorkspace(
  client: SupabaseClient,
  userId: string,
  workspaceName: string,
  workspaceIdentityContract: WorkspaceIdentityContract,
): Promise<{ workspace: WorkspaceRow; membership: WorkspaceMemberRow }> {
  const existing = await findExistingWorkspace(client, userId, workspaceIdentityContract)
  if (existing.workspace && existing.membership?.role === 'owner') {
    return {
      workspace: existing.workspace,
      membership: existing.membership,
    }
  }

  const ownerId = userId
  let workspace: WorkspaceRow | undefined = existing.workspace
  let lastError: { code?: string; message?: string } | undefined

  if (!workspace) {
    for (const insert of workspaceInsertVariants(ownerId, workspaceName, workspaceIdentityContract)) {
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
        const compatibleSchemaError = isSchemaFallbackError(error)
          || isMissingColumnError(error, 'metadata_json')
          || isMissingColumnError(error, 'metadata')
          || isMissingColumnError(error, 'plan_type')
          || isMissingColumnError(error, 'workspace_type')
        if (compatibleSchemaError) continue
        throw error
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
  const rawSupabaseUrl = clean(process.env.SUPABASE_URL)
  const supabaseUrl = normalizeStagingSupabaseUrl(rawSupabaseUrl)
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const rawEmail = clean(process.env.INTERNAL_TESTER_EMAIL)?.toLowerCase()
  const expectedEmailHash = normalizeExpectedEmailHash(process.env.INTERNAL_TESTER_EXPECTED_EMAIL_HASH)
  const actualEmailHash = rawEmail ? internalTesterEmailHash(rawEmail) : undefined
  const displayName = rawEmail ? displayNameFor(clean(process.env.INTERNAL_TESTER_DISPLAY_NAME)) : undefined
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

  if (!rawSupabaseUrl || !serviceRoleKey || !rawEmail) {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_missing_env',
      message: 'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and INTERNAL_TESTER_EMAIL are required in the protected backend-only workflow environment.',
      warnings: [],
      nextStep: 'configure_staging_supabase_secrets',
    })
  }

  if (
    !supabaseUrl
    || !validateEmail(rawEmail)
    || !expectedEmailHash
    || actualEmailHash !== expectedEmailHash
    || !displayName
    || !validLabel(displayName, 80)
    || !workspaceName
    || !validLabel(workspaceName, 120)
  ) {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_invalid_input',
      message: 'Provisioning requires the exact staging Supabase origin, a valid protected tester email, its matching 16-character evidence hash, and bounded display/workspace names.',
      emailHash: actualEmailHash,
      warnings: [],
      nextStep: 'fix_exact_staging_origin_email_hash_or_bounded_names',
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
        decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_auth_user_missing',
        message: 'No Supabase Auth user exists for the protected tester identity. Complete the real Google sign-in once before any profile/workspace write.',
        emailHash: actualEmailHash,
        warnings: [],
        nextStep: 'complete_owner_controlled_google_sign_in_then_rerun_provisioning',
      })
    }

    const googleEvidence = inspectInternalTesterGoogleIdentity(user)
    if (!googleEvidence.readyForProfileWorkspaceProvisioning) {
      output({
        ok: false,
        decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_google_session_not_observed',
        message: 'The Auth user exists, but the required Google identity, confirmed email, and prior Auth sign-in evidence were not all observed. No profile/workspace write was attempted.',
        emailHash: actualEmailHash,
        userIdHash: privateIdentifierHash(user.id),
        ...googleEvidence,
        warnings: [],
        nextStep: 'complete_owner_controlled_google_sign_in_then_rerun_provisioning',
      })
    }

    const workspaceIdentityContract = await resolveWorkspaceIdentityContract(client)
    const { profile, identityColumn, tableName } = await ensureProfile(
      client,
      user,
      displayName,
      workspaceIdentityContract,
    )
    const { workspace, membership } = await ensureWorkspace(
      client,
      user.id,
      workspaceName,
      workspaceIdentityContract,
    )
    const persistedProfileId = profileId(profile)

    output({
      ok: true,
      decision: 'internal_tester_backend_profile_workspace_provisioning_passed_ready_for_auth_readback',
      message: 'The previously signed-in Google tester now has a reusable profile, workspace, and owner membership ready for backend readback.',
      emailHash: actualEmailHash,
      userIdHash: privateIdentifierHash(user.id),
      ...googleEvidence,
      profileIdHash: persistedProfileId ? privateIdentifierHash(persistedProfileId) : undefined,
      profileIdentityColumn: identityColumn,
      profileTableName: tableName,
      workspaceIdentityContract,
      workspaceIdHash: workspace.id ? privateIdentifierHash(workspace.id) : undefined,
      membershipIdHash: membership.id ? privateIdentifierHash(membership.id) : undefined,
      warnings: [
        'This guarded staging compatibility bootstrap does not make the raw Supabase migration chain reproducible or production-ready.',
      ],
      nextStep: 'run_same_sha_google_tester_auth_readback',
    })
  } catch (error) {
    output({
      ok: false,
      decision: 'internal_tester_backend_profile_workspace_provisioning_blocked_supabase_error',
      message: error instanceof Error
        ? sanitizeForOutput(error.message, [rawEmail, rawSupabaseUrl, serviceRoleKey])
        : 'Supabase provisioning failed.',
      emailHash: actualEmailHash,
      warnings: ['The workflow does not print service-role secrets, passwords, or signed URLs.'],
      nextStep: 'inspect_staging_schema_or_auth_user_state',
    })
  }
}

void main()
