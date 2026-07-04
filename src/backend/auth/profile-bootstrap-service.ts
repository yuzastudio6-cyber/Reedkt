import type { User } from '@supabase/supabase-js'
import type {
  AuthenticatedUserContext,
  AuthBootstrapStatus,
  UserProfileBootstrapResult,
} from '../../types/auth-bootstrap'
import { getCurrentSupabaseUser } from './auth-client-service'
import { getSupabaseClient } from '../supabase/supabase-client'
import { TABLE_NAMES } from '../supabase/table-names'

interface ProfileRow {
  id?: string
  user_id?: string
  display_name?: string | null
  avatar_url?: string | null
  metadata_json?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  default_workspace_id?: string | null
}

type ProfileIdentityColumn = 'user_id' | 'id'

const PROFILE_IDENTITY_COLUMNS: ProfileIdentityColumn[] = ['user_id', 'id']

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function isBackendRequiredError(error: { code?: string; message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === '42501'
    || message.includes('row-level security')
    || message.includes('permission denied')
    || message.includes('policy')
  )
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

function displayNameFromUser(user: User): string | undefined {
  const metadata = asRecord(user.user_metadata)
  return (
    stringValue(metadata.display_name)
    ?? stringValue(metadata.full_name)
    ?? stringValue(metadata.name)
    ?? user.email?.split('@')[0]
  )
}

function avatarUrlFromUser(user: User): string | undefined {
  const metadata = asRecord(user.user_metadata)
  return stringValue(metadata.avatar_url) ?? stringValue(metadata.picture)
}

function currentWorkspaceIdFromProfile(profile?: ProfileRow | null): string | undefined {
  if (!profile) return undefined

  const metadata = profile.metadata_json ?? profile.metadata ?? {}
  return (
    stringValue(metadata.current_workspace_id)
    ?? stringValue(metadata.currentWorkspaceId)
    ?? stringValue(profile.default_workspace_id)
  )
}

function profileIdFromProfile(profile: ProfileRow): string | undefined {
  return stringValue(profile.id) ?? stringValue(profile.user_id)
}

function createUserContext(
  user: User,
  profile: ProfileRow | null,
  status: AuthBootstrapStatus,
): AuthenticatedUserContext {
  return {
    userId: user.id,
    email: user.email,
    displayName: profile?.display_name ?? displayNameFromUser(user),
    avatarUrl: profile?.avatar_url ?? avatarUrlFromUser(user),
    currentWorkspaceId: currentWorkspaceIdFromProfile(profile),
    roles: [],
    bootstrapStatus: status,
  }
}

async function findProfileByIdentityColumn(
  column: ProfileIdentityColumn,
  userId: string,
): Promise<{ data: ProfileRow | null; error: { code?: string; message?: string } | null }> {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: { message: 'Supabase is not configured.' } }

  const { data, error } = await client
    .from(TABLE_NAMES.profiles)
    .select('*')
    .eq(column, userId)
    .maybeSingle()

  return {
    data: data as ProfileRow | null,
    error,
  }
}

function profileInsertVariants(user: User): Array<Record<string, unknown>> {
  const baseProfile = {
    display_name: displayNameFromUser(user),
    avatar_url: avatarUrlFromUser(user),
  }
  const metadata = {
    bootstrap_source: 'supabase_frontend',
    email: user.email,
  }

  return [
    {
      user_id: user.id,
      ...baseProfile,
      metadata_json: metadata,
    },
    {
      user_id: user.id,
      ...baseProfile,
    },
    {
      id: user.id,
      ...baseProfile,
      metadata_json: metadata,
    },
    {
      id: user.id,
      ...baseProfile,
    },
  ]
}

function notConfiguredProfileResult(): UserProfileBootstrapResult {
  return {
    ok: false,
    status: 'not_configured',
    mode: 'mock',
    message: 'Supabase is not configured, so profile bootstrap is inactive.',
    warnings: ['Add frontend-safe Supabase public env values before using live auth bootstrap.'],
  }
}

function signedOutProfileResult(): UserProfileBootstrapResult {
  return {
    ok: false,
    status: 'signed_out',
    mode: 'supabase_frontend',
    message: 'Sign in before creating or loading a ReeditPro profile.',
    warnings: [],
  }
}

export async function getCurrentUserProfile(user?: User | null): Promise<UserProfileBootstrapResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredProfileResult()

  const userResult = user ? undefined : await getCurrentSupabaseUser()
  const currentUser = user ?? userResult?.user ?? null

  if (!currentUser) return signedOutProfileResult()

  let profile: ProfileRow | null = null
  let lastError: { code?: string; message?: string } | null = null

  for (const column of PROFILE_IDENTITY_COLUMNS) {
    const result = await findProfileByIdentityColumn(column, currentUser.id)
    profile = result.data
    lastError = result.error

    if (!lastError || profile) break
    if (isBackendRequiredError(lastError)) break
    if (!isMissingColumnError(lastError, column)) break
  }

  if (lastError) {
    return {
      ok: false,
      status: 'error',
      mode: isBackendRequiredError(lastError) ? 'backend_required' : 'supabase_frontend',
      message: lastError.message ?? 'Profile lookup failed.',
      warnings: isBackendRequiredError(lastError)
        ? ['RLS blocked profile lookup; backend-mediated profile bootstrap may be required.']
        : ['Profile lookup failed.'],
    }
  }

  if (!profile) {
    return {
      ok: false,
      status: 'profile_missing',
      mode: 'supabase_frontend',
      userContext: createUserContext(currentUser, null, 'profile_missing'),
      message: 'No ReeditPro profile exists for the signed-in user yet.',
      warnings: [],
    }
  }

  return {
    ok: true,
    status: 'ready',
    mode: 'supabase_frontend',
    userContext: createUserContext(currentUser, profile, 'ready'),
    profileId: profileIdFromProfile(profile),
    workspaceId: currentWorkspaceIdFromProfile(profile),
    message: 'ReeditPro profile is ready.',
    warnings: [],
  }
}

export async function createUserProfileIfMissing(user?: User | null): Promise<UserProfileBootstrapResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredProfileResult()

  const userResult = user ? undefined : await getCurrentSupabaseUser()
  const currentUser = user ?? userResult?.user ?? null

  if (!currentUser) return signedOutProfileResult()

  const existing = await getCurrentUserProfile(currentUser)
  if (existing.ok || existing.status !== 'profile_missing') return existing

  let profile: ProfileRow | null = null
  let lastError: { code?: string; message?: string } | null = null

  for (const profileInsert of profileInsertVariants(currentUser)) {
    const { data, error } = await client
      .from(TABLE_NAMES.profiles)
      .insert(profileInsert)
      .select('*')
      .single()

    profile = data as ProfileRow | null
    lastError = error

    if (!lastError && profile) break
    if (lastError && isBackendRequiredError(lastError)) break
    if (
      lastError
      && !isMissingColumnError(lastError, 'user_id')
      && !isMissingColumnError(lastError, 'id')
      && !isMissingColumnError(lastError, 'metadata_json')
    ) {
      break
    }
  }

  if (lastError || !profile) {
    const backendRequired = lastError ? isBackendRequiredError(lastError) : false
    return {
      ok: false,
      status: 'profile_missing',
      mode: backendRequired ? 'backend_required' : 'supabase_frontend',
      userContext: createUserContext(currentUser, null, 'profile_missing'),
      message: backendRequired
        ? 'Profile creation is blocked by RLS and needs a backend runtime.'
        : lastError?.message ?? 'Profile creation did not return a profile row.',
      warnings: backendRequired
        ? ['Backend profile creation is required under the current RLS policy.']
        : ['Profile creation failed.'],
    }
  }

  return {
    ok: true,
    status: 'ready',
    mode: 'supabase_frontend',
    userContext: createUserContext(currentUser, profile, 'ready'),
    profileId: profileIdFromProfile(profile),
    message: 'Created ReeditPro profile for the signed-in user.',
    warnings: [],
  }
}

export async function ensureCurrentUserProfile(user?: User | null): Promise<UserProfileBootstrapResult> {
  const result = await getCurrentUserProfile(user)

  if (result.ok || result.status !== 'profile_missing') {
    return result
  }

  return createUserProfileIfMissing(user)
}

export async function updateUserProfileDisplayName(displayName: string): Promise<UserProfileBootstrapResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredProfileResult()

  const userResult = await getCurrentSupabaseUser()
  const currentUser = userResult.user

  if (!currentUser) return signedOutProfileResult()

  let profile: ProfileRow | null = null
  let lastError: { code?: string; message?: string } | null = null

  for (const column of PROFILE_IDENTITY_COLUMNS) {
    const { data, error } = await client
      .from(TABLE_NAMES.profiles)
      .update({ display_name: displayName })
      .eq(column, currentUser.id)
      .select('*')
      .single()

    profile = data as ProfileRow | null
    lastError = error

    if (!lastError && profile) break
    if (lastError && isBackendRequiredError(lastError)) break
    if (lastError && !isMissingColumnError(lastError, column)) break
  }

  if (lastError || !profile) {
    return {
      ok: false,
      status: 'error',
      mode: lastError && isBackendRequiredError(lastError) ? 'backend_required' : 'supabase_frontend',
      message: lastError?.message ?? 'Profile display name update did not return a profile row.',
      warnings: lastError && isBackendRequiredError(lastError)
        ? ['RLS blocked profile update; backend-mediated profile writes may be required.']
        : ['Profile display name update failed.'],
    }
  }

  return {
    ok: true,
    status: 'ready',
    mode: 'supabase_frontend',
    userContext: createUserContext(currentUser, profile, 'ready'),
    profileId: profileIdFromProfile(profile),
    workspaceId: currentWorkspaceIdFromProfile(profile),
    message: 'Updated profile display name.',
    warnings: [],
  }
}

export function createProfileBootstrapSummary(result: UserProfileBootstrapResult): string {
  if (result.status === 'not_configured') return 'Supabase is not configured; profile bootstrap is inactive.'
  if (result.status === 'signed_out') return 'Sign in before ReeditPro can load a profile.'
  if (result.mode === 'backend_required') return 'Profile bootstrap needs backend support under the current RLS policy.'
  if (result.ok) return 'Profile bootstrap is ready.'
  return result.message
}
