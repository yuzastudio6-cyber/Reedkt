import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import {
  inspectInternalTesterGoogleIdentity,
  internalTesterEmailHash,
  normalizeExpectedEmailHash,
  normalizeStagingSupabaseUrl,
  privateIdentifierHash,
} from '../auth/internal-tester-google-identity'
import {
  INTERNAL_TESTER_WORKSPACE_MEMBERSHIP_SELECTS,
  resolveInternalTesterWorkspaceMembership,
  type InternalTesterWorkspaceMembershipRow,
  type ResolvedInternalTesterWorkspaceMembership,
} from '../auth/internal-tester-workspace-membership'

type ReadbackDecision =
  | 'internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test'
  | 'internal_tester_sign_in_auth_readback_blocked_missing_confirmation'
  | 'internal_tester_sign_in_auth_readback_blocked_missing_env'
  | 'internal_tester_sign_in_auth_readback_blocked_invalid_input'
  | 'internal_tester_sign_in_auth_readback_blocked_auth_user_missing'
  | 'internal_tester_sign_in_auth_readback_blocked_google_session_not_observed'
  | 'internal_tester_sign_in_auth_readback_blocked_profile_missing'
  | 'internal_tester_sign_in_auth_readback_blocked_workspace_membership_missing'
  | 'internal_tester_sign_in_auth_readback_blocked_supabase_error'

type ProfileIdentityColumn = 'user_id' | 'id'
type ProfileTableName = 'profiles' | 'user_profiles'
type WorkspaceIdentityContract = 'direct_auth_user' | 'legacy_user_profile'

interface ReadbackResult {
  ok: boolean
  decision: ReadbackDecision
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
  membershipIdentityHash?: string
  membershipIdentityContract?:
    | 'surrogate_id'
    | 'workspace_user_composite'
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

const CONFIRM_VALUE = 'VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK'

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function output(result: ReadbackResult): never {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

async function findOwnedWorkspaceMembership(
  client: SupabaseClient,
  userId: string,
  workspaceIdentityContract: WorkspaceIdentityContract,
): Promise<{
  workspace?: WorkspaceRow
  membership?: ResolvedInternalTesterWorkspaceMembership
}> {
  const ownerColumn = workspaceIdentityContract === 'direct_auth_user'
    ? 'owner_id'
    : 'owner_user_id'
  const workspaceSelect = workspaceIdentityContract === 'direct_auth_user'
    ? 'id, owner_id, name, plan_type'
    : 'id, owner_user_id, name, workspace_type'
  const { data: workspaceRows, error: workspaceError } = await client
    .from('workspaces')
    .select(workspaceSelect)
    .eq(ownerColumn, userId)
    .limit(1)

  if (workspaceError) throw workspaceError
  const workspace = (workspaceRows as WorkspaceRow[] | null)?.[0]
  if (!workspace?.id) return {}

  let membershipRows: InternalTesterWorkspaceMembershipRow[] | null = null
  for (const select of INTERNAL_TESTER_WORKSPACE_MEMBERSHIP_SELECTS) {
    const result = await client
      .from('workspace_members')
      .select(select)
      .eq('workspace_id', workspace.id)
      .eq('user_id', userId)
      .eq('role', 'owner')
      .limit(1)

    if (!result.error) {
      membershipRows = result.data as InternalTesterWorkspaceMembershipRow[] | null
      break
    }
    if (select.startsWith('id,') && isMissingColumnError(result.error, 'id')) {
      continue
    }
    throw result.error
  }

  const membership = resolveInternalTesterWorkspaceMembership({
    row: membershipRows?.[0],
    expectedWorkspaceId: workspace.id,
    expectedUserId: userId,
  })
  return {
    workspace,
    membership,
  }
}

async function main() {
  const confirm = clean(process.env.REEDITPRO_CONFIRM_INTERNAL_TESTER_AUTH_READBACK)
  const rawSupabaseUrl = clean(process.env.SUPABASE_URL)
  const supabaseUrl = normalizeStagingSupabaseUrl(rawSupabaseUrl)
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const rawEmail = clean(process.env.INTERNAL_TESTER_EMAIL)?.toLowerCase()
  const expectedEmailHash = normalizeExpectedEmailHash(process.env.INTERNAL_TESTER_EXPECTED_EMAIL_HASH)
  const actualEmailHash = rawEmail ? internalTesterEmailHash(rawEmail) : undefined

  if (confirm !== CONFIRM_VALUE) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_missing_confirmation',
      message: 'Auth readback requires explicit internal tester readback confirmation.',
      warnings: [],
      nextStep: 'set_required_readback_confirmation',
    })
  }

  if (!rawSupabaseUrl || !serviceRoleKey || !rawEmail) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_missing_env',
      message: 'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and INTERNAL_TESTER_EMAIL are required in the protected backend-only readback environment.',
      warnings: [],
      nextStep: 'configure_staging_supabase_secrets',
    })
  }

  if (
    !supabaseUrl
    || !validateEmail(rawEmail)
    || !expectedEmailHash
    || actualEmailHash !== expectedEmailHash
  ) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_invalid_input',
      message: 'Auth readback requires the exact staging Supabase origin and a protected tester email matching the 16-character interactive evidence hash.',
      emailHash: actualEmailHash,
      warnings: [],
      nextStep: 'fix_exact_staging_origin_or_tester_email_hash',
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
        message: 'No Supabase Auth user exists for the protected tester identity.',
        emailHash: actualEmailHash,
        warnings: [],
        nextStep: 'complete_owner_controlled_google_sign_in',
      })
    }

    const googleEvidence = inspectInternalTesterGoogleIdentity(user)
    if (!googleEvidence.readyForProfileWorkspaceProvisioning) {
      output({
        ok: false,
        decision: 'internal_tester_sign_in_auth_readback_blocked_google_session_not_observed',
        message: 'The Auth user exists, but the required Google identity, confirmed email, and prior Auth sign-in evidence were not all observed.',
        emailHash: actualEmailHash,
        userIdHash: privateIdentifierHash(user.id),
        ...googleEvidence,
        warnings: [],
        nextStep: 'complete_owner_controlled_google_sign_in',
      })
    }

    const workspaceIdentityContract = await resolveWorkspaceIdentityContract(client)
    const { profile, identityColumn, tableName } = await findProfile(
      client,
      user.id,
      workspaceIdentityContract,
    )

    if (!profile || !identityColumn) {
      output({
        ok: false,
        decision: 'internal_tester_sign_in_auth_readback_blocked_profile_missing',
        message: 'The tester Auth user exists, but no compatible profile row was found.',
        emailHash: actualEmailHash,
        userIdHash: privateIdentifierHash(user.id),
        ...googleEvidence,
        workspaceIdentityContract,
        warnings: [],
        nextStep: 'run_internal_tester_profile_workspace_provisioning',
      })
    }

    const persistedProfileId = profileId(profile)
    const { workspace, membership } = await findOwnedWorkspaceMembership(
      client,
      user.id,
      workspaceIdentityContract,
    )

    if (!workspace?.id || !membership) {
      output({
        ok: false,
        decision: 'internal_tester_sign_in_auth_readback_blocked_workspace_membership_missing',
        message: 'The tester profile exists, but no tester-owned workspace with an owner membership was found.',
        emailHash: actualEmailHash,
        userIdHash: privateIdentifierHash(user.id),
        ...googleEvidence,
        profileIdHash: persistedProfileId ? privateIdentifierHash(persistedProfileId) : undefined,
        profileIdentityColumn: identityColumn,
        profileTableName: tableName,
        workspaceIdentityContract,
        warnings: [],
        nextStep: 'run_internal_tester_profile_workspace_provisioning',
      })
    }

    output({
      ok: true,
      decision: 'internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test',
      message: 'The Google-linked tester identity, prior Auth sign-in, profile, owned workspace, and owner membership are ready for the owner-interactive Google gateway test.',
      emailHash: actualEmailHash,
      userIdHash: privateIdentifierHash(user.id),
      ...googleEvidence,
      profileIdHash: persistedProfileId ? privateIdentifierHash(persistedProfileId) : undefined,
      profileIdentityColumn: identityColumn,
      profileTableName: tableName,
      workspaceIdentityContract,
      workspaceIdHash: privateIdentifierHash(workspace.id),
      membershipIdHash: membership.surrogateIdHash,
      membershipIdentityHash: membership.identityHash,
      membershipIdentityContract: membership.identityContract,
      membershipRole: membership.row.role ?? null,
      warnings: [
        'This readback proves only the guarded staging identity/workspace seam; it does not certify the raw migration chain or production RLS.',
      ],
      nextStep: 'rerun_owner_interactive_google_session_and_require_gateway_projects_readback',
    })
  } catch (error) {
    output({
      ok: false,
      decision: 'internal_tester_sign_in_auth_readback_blocked_supabase_error',
      message: error instanceof Error
        ? sanitizeForOutput(error.message, [rawEmail, rawSupabaseUrl, serviceRoleKey])
        : 'Supabase auth readback failed.',
      emailHash: actualEmailHash,
      warnings: ['The workflow does not print service-role secrets, passwords, or signed URLs.'],
      nextStep: 'inspect_staging_auth_profile_workspace_state',
    })
  }
}

void main()
