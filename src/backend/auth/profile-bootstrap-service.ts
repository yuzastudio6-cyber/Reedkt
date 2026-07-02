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

  const { data, error } = await client
    .from(TABLE_NAMES.profiles)
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle()

  if (error) {
    return {
      ok: false,
      status: 'error',
      mode: isBackendRequiredError(error) ? 'backend_required' : 'supabase_frontend',
      message: error.message,
      warnings: isBackendRequiredError(error)
        ? ['RLS blocked profile lookup; backend-mediated profile bootstrap may be required.']
        : ['Profile lookup failed.'],
    }
  }

  const profile = data as ProfileRow | null

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
    profileId: profile.id,
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

  const profileInsert = {
    user_id: currentUser.id,
    display_name: displayNameFromUser(currentUser),
    avatar_url: avatarUrlFromUser(currentUser),
    metadata_json: {
      bootstrap_source: 'supabase_frontend',
      email: currentUser.email,
    },
  }

  const { data, error } = await client
    .from(TABLE_NAMES.profiles)
    .insert(profileInsert)
    .select('*')
    .single()

  if (error) {
    const backendRequired = isBackendRequiredError(error)
    return {
      ok: false,
      status: 'profile_missing',
      mode: backendRequired ? 'backend_required' : 'supabase_frontend',
      userContext: createUserContext(currentUser, null, 'profile_missing'),
      message: backendRequired
        ? 'Profile creation is blocked by RLS and needs a backend runtime.'
        : error.message,
      warnings: backendRequired
        ? ['Backend profile creation is required under the current RLS policy.']
        : ['Profile creation failed.'],
    }
  }

  const profile = data as ProfileRow
  return {
    ok: true,
    status: 'ready',
    mode: 'supabase_frontend',
    userContext: createUserContext(currentUser, profile, 'ready'),
    profileId: profile.id,
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

  const { data, error } = await client
    .from(TABLE_NAMES.profiles)
    .update({ display_name: displayName })
    .eq('user_id', currentUser.id)
    .select('*')
    .single()

  if (error) {
    return {
      ok: false,
      status: 'error',
      mode: isBackendRequiredError(error) ? 'backend_required' : 'supabase_frontend',
      message: error.message,
      warnings: isBackendRequiredError(error)
        ? ['RLS blocked profile update; backend-mediated profile writes may be required.']
        : ['Profile display name update failed.'],
    }
  }

  const profile = data as ProfileRow
  return {
    ok: true,
    status: 'ready',
    mode: 'supabase_frontend',
    userContext: createUserContext(currentUser, profile, 'ready'),
    profileId: profile.id,
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
