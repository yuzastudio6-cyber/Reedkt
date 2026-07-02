import type { User } from '@supabase/supabase-js'
import type { WorkspaceBootstrapResult, WorkspaceBootstrapRole } from '../../types/auth-bootstrap'
import { getCurrentSupabaseUser } from './auth-client-service'
import { getSupabaseClient } from '../supabase/supabase-client'
import { TABLE_NAMES } from '../supabase/table-names'

interface WorkspaceRow {
  id?: string
  owner_id?: string
  name?: string
  plan_type?: string
  metadata_json?: Record<string, unknown> | null
}

interface WorkspaceMemberRow {
  id?: string
  workspace_id?: string
  user_id?: string
  role?: string | null
  workspaces?: WorkspaceRow | WorkspaceRow[] | null
}

export interface UserWorkspaceSummary {
  workspaceId: string
  membershipId?: string
  role: WorkspaceBootstrapRole
  name?: string
  ownerId?: string
  isCurrent: boolean
}

export interface UserWorkspacesResult {
  ok: boolean
  mode: 'mock' | 'supabase_frontend' | 'backend_required'
  workspaces: UserWorkspaceSummary[]
  message: string
  warnings: string[]
}

const CURRENT_WORKSPACE_STORAGE_PREFIX = 'reeditpro.currentWorkspaceId'

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function asWorkspaceRole(value: unknown): WorkspaceBootstrapRole {
  if (
    value === 'owner'
    || value === 'admin'
    || value === 'editor'
    || value === 'viewer'
    || value === 'client_reviewer'
  ) {
    return value
  }

  return 'owner'
}

function workspaceFromMember(member: WorkspaceMemberRow): WorkspaceRow | undefined {
  return Array.isArray(member.workspaces) ? member.workspaces[0] : member.workspaces ?? undefined
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

function currentWorkspaceStorageKey(userId: string): string {
  return `${CURRENT_WORKSPACE_STORAGE_PREFIX}.${userId}`
}

function readStoredCurrentWorkspaceId(userId: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  return stringValue(window.localStorage.getItem(currentWorkspaceStorageKey(userId)))
}

function writeStoredCurrentWorkspaceId(userId: string, workspaceId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(currentWorkspaceStorageKey(userId), workspaceId)
}

function notConfiguredWorkspaceResult(): WorkspaceBootstrapResult {
  return {
    ok: false,
    mode: 'mock',
    message: 'Supabase is not configured, so workspace bootstrap is inactive.',
    warnings: ['Add frontend-safe Supabase public env values before using live workspace bootstrap.'],
  }
}

function signedOutWorkspaceResult(): WorkspaceBootstrapResult {
  return {
    ok: false,
    mode: 'supabase_frontend',
    message: 'Sign in before creating or loading a workspace.',
    warnings: [],
  }
}

function defaultWorkspaceName(user: User): string {
  const profileName = stringValue(user.user_metadata?.display_name)
    ?? stringValue(user.user_metadata?.full_name)
    ?? stringValue(user.user_metadata?.name)
    ?? user.email?.split('@')[0]

  return profileName ? `${profileName}'s Workspace` : 'My Workspace'
}

async function resolveCurrentUser(user?: User | null): Promise<User | null> {
  if (user) return user
  const result = await getCurrentSupabaseUser()
  return result.user ?? null
}

export async function getUserWorkspaces(user?: User | null): Promise<UserWorkspacesResult> {
  const client = getSupabaseClient()

  if (!client) {
    return {
      ok: false,
      mode: 'mock',
      workspaces: [],
      message: 'Supabase is not configured, so workspaces are unavailable.',
      warnings: ['Workspace lookup is in safe not-configured mode.'],
    }
  }

  const currentUser = await resolveCurrentUser(user)
  if (!currentUser) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      workspaces: [],
      message: 'Sign in before loading workspaces.',
      warnings: [],
    }
  }

  const { data, error } = await client
    .from(TABLE_NAMES.workspaceMembers)
    .select('id, workspace_id, user_id, role, workspaces(id, owner_id, name, plan_type, metadata_json)')
    .eq('user_id', currentUser.id)

  if (error) {
    return {
      ok: false,
      mode: isBackendRequiredError(error) ? 'backend_required' : 'supabase_frontend',
      workspaces: [],
      message: error.message,
      warnings: isBackendRequiredError(error)
        ? ['RLS blocked workspace membership lookup; backend-mediated bootstrap may be required.']
        : ['Workspace lookup failed.'],
    }
  }

  const storedCurrentWorkspaceId = readStoredCurrentWorkspaceId(currentUser.id)
  const workspaces = ((data ?? []) as WorkspaceMemberRow[])
    .flatMap((member) => {
      const workspace = workspaceFromMember(member)
      const workspaceId = stringValue(member.workspace_id) ?? stringValue(workspace?.id)

      if (!workspaceId) return []

      const summary: UserWorkspaceSummary = {
        workspaceId,
        role: asWorkspaceRole(member.role),
        isCurrent: workspaceId === storedCurrentWorkspaceId,
      }

      if (member.id) summary.membershipId = member.id
      if (workspace?.name) summary.name = workspace.name
      if (workspace?.owner_id) summary.ownerId = workspace.owner_id

      return [summary]
    })

  return {
    ok: true,
    mode: 'supabase_frontend',
    workspaces,
    message: workspaces.length > 0
      ? 'Loaded workspaces for the signed-in user.'
      : 'No workspaces exist for the signed-in user yet.',
    warnings: [],
  }
}

export async function getCurrentWorkspace(user?: User | null): Promise<WorkspaceBootstrapResult> {
  const currentUser = await resolveCurrentUser(user)
  if (!currentUser) return signedOutWorkspaceResult()

  const workspacesResult = await getUserWorkspaces(currentUser)

  if (!workspacesResult.ok) {
    return {
      ok: false,
      mode: workspacesResult.mode,
      message: workspacesResult.message,
      warnings: workspacesResult.warnings,
    }
  }

  const storedCurrentWorkspaceId = readStoredCurrentWorkspaceId(currentUser.id)
  const currentWorkspace = workspacesResult.workspaces.find((workspace) => workspace.workspaceId === storedCurrentWorkspaceId)
    ?? workspacesResult.workspaces[0]

  if (!currentWorkspace) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      message: 'No current workspace is available.',
      warnings: [],
    }
  }

  writeStoredCurrentWorkspaceId(currentUser.id, currentWorkspace.workspaceId)

  return {
    ok: true,
    mode: 'supabase_frontend',
    workspaceId: currentWorkspace.workspaceId,
    membershipId: currentWorkspace.membershipId,
    role: currentWorkspace.role,
    message: 'Current workspace is ready.',
    warnings: [],
  }
}

export async function createDefaultWorkspaceIfMissing(user?: User | null): Promise<WorkspaceBootstrapResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredWorkspaceResult()

  const currentUser = await resolveCurrentUser(user)
  if (!currentUser) return signedOutWorkspaceResult()

  const existing = await getCurrentWorkspace(currentUser)
  if (existing.ok) return existing

  const { data, error } = await client
    .from(TABLE_NAMES.workspaces)
    .insert({
      owner_id: currentUser.id,
      name: defaultWorkspaceName(currentUser),
      plan_type: 'free',
      metadata_json: {
        bootstrap_source: 'supabase_frontend',
      },
    })
    .select('id, owner_id, name, plan_type, metadata_json')
    .single()

  if (error) {
    const backendRequired = isBackendRequiredError(error)
    return {
      ok: false,
      mode: backendRequired ? 'backend_required' : 'supabase_frontend',
      message: backendRequired
        ? 'Workspace creation is blocked by RLS and needs a backend runtime.'
        : error.message,
      warnings: backendRequired
        ? ['Backend workspace creation is required under the current RLS policy.']
        : ['Default workspace creation failed.'],
    }
  }

  const workspace = data as WorkspaceRow
  const workspaceId = workspace.id

  if (!workspaceId) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      message: 'Workspace creation did not return an id.',
      warnings: ['The workspace row exists only if Supabase completed the insert; refresh before retrying.'],
    }
  }

  return ensureWorkspaceMembership(workspaceId, 'owner', currentUser)
}

export async function ensureDefaultWorkspace(user?: User | null): Promise<WorkspaceBootstrapResult> {
  const currentWorkspace = await getCurrentWorkspace(user)
  if (currentWorkspace.ok) return currentWorkspace

  if (currentWorkspace.mode === 'mock' || currentWorkspace.mode === 'backend_required') {
    return currentWorkspace
  }

  return createDefaultWorkspaceIfMissing(user)
}

export async function ensureWorkspaceMembership(
  workspaceId: string,
  role: WorkspaceBootstrapRole = 'owner',
  user?: User | null,
): Promise<WorkspaceBootstrapResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredWorkspaceResult()

  const currentUser = await resolveCurrentUser(user)
  if (!currentUser) return signedOutWorkspaceResult()

  const { data: existingMembership, error: lookupError } = await client
    .from(TABLE_NAMES.workspaceMembers)
    .select('id, workspace_id, user_id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', currentUser.id)
    .maybeSingle()

  if (lookupError) {
    return {
      ok: false,
      mode: isBackendRequiredError(lookupError) ? 'backend_required' : 'supabase_frontend',
      message: lookupError.message,
      warnings: isBackendRequiredError(lookupError)
        ? ['RLS blocked membership lookup; backend-mediated workspace bootstrap may be required.']
        : ['Workspace membership lookup failed.'],
    }
  }

  if (existingMembership) {
    const membership = existingMembership as WorkspaceMemberRow
    await setCurrentWorkspaceContext(workspaceId, currentUser)
    return {
      ok: true,
      mode: 'supabase_frontend',
      workspaceId,
      membershipId: membership.id,
      role: asWorkspaceRole(membership.role),
      message: 'Workspace membership is ready.',
      warnings: [],
    }
  }

  const { data, error } = await client
    .from(TABLE_NAMES.workspaceMembers)
    .insert({
      workspace_id: workspaceId,
      user_id: currentUser.id,
      role,
    })
    .select('id, workspace_id, user_id, role')
    .single()

  if (error) {
    const backendRequired = isBackendRequiredError(error)
    return {
      ok: false,
      mode: backendRequired ? 'backend_required' : 'supabase_frontend',
      workspaceId,
      message: backendRequired
        ? 'Workspace membership creation is blocked by RLS and needs a backend runtime.'
        : error.message,
      warnings: backendRequired
        ? ['Backend workspace membership creation is required under the current RLS policy.']
        : ['Workspace membership creation failed.'],
    }
  }

  const membership = data as WorkspaceMemberRow
  await setCurrentWorkspaceContext(workspaceId, currentUser)

  return {
    ok: true,
    mode: 'supabase_frontend',
    workspaceId,
    membershipId: membership.id,
    role: asWorkspaceRole(membership.role),
    message: 'Created workspace membership for the signed-in user.',
    warnings: [],
  }
}

export async function setCurrentWorkspaceContext(
  workspaceId: string,
  user?: User | null,
): Promise<WorkspaceBootstrapResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredWorkspaceResult()

  const currentUser = await resolveCurrentUser(user)
  if (!currentUser) return signedOutWorkspaceResult()

  writeStoredCurrentWorkspaceId(currentUser.id, workspaceId)

  const { data: profileData, error: profileLookupError } = await client
    .from(TABLE_NAMES.profiles)
    .select('metadata_json')
    .eq('user_id', currentUser.id)
    .maybeSingle()

  const profileMetadata = profileLookupError
    ? {}
    : ((profileData as { metadata_json?: Record<string, unknown> | null } | null)?.metadata_json ?? {})

  const { error } = await client
    .from(TABLE_NAMES.profiles)
    .update({
      metadata_json: {
        ...profileMetadata,
        current_workspace_id: workspaceId,
      },
    })
    .eq('user_id', currentUser.id)

  if (error) {
    return {
      ok: true,
      mode: isBackendRequiredError(error) ? 'backend_required' : 'supabase_frontend',
      workspaceId,
      message: 'Stored current workspace in browser fallback; profile metadata update did not complete.',
      warnings: isBackendRequiredError(error)
        ? ['RLS blocked profile metadata update; backend can persist current workspace later.']
        : ['Profile metadata update failed; browser fallback was updated.'],
    }
  }

  return {
    ok: true,
    mode: 'supabase_frontend',
    workspaceId,
    message: 'Current workspace context is stored.',
    warnings: [],
  }
}

export function createWorkspaceBootstrapSummary(result: WorkspaceBootstrapResult): string {
  if (result.mode === 'mock') return 'Supabase is not configured; workspace bootstrap is inactive.'
  if (result.mode === 'backend_required') return 'Workspace bootstrap needs backend support under the current RLS policy.'
  if (result.ok) return 'Workspace bootstrap is ready.'
  return result.message
}
