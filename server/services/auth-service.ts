import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type { EnsureProfileInput, EnsureWorkspaceInput } from '../validation/auth-workspace-schemas'
import { getRequiredAuthUserId, mockWarning, nowIso, sanitizeJson, throwOnSupabaseError } from './service-helpers'

type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'client_reviewer'

interface ProfileRow {
  id?: string
  user_id?: string
  display_name?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

interface WorkspaceRow {
  id?: string
  owner_id?: string
  name?: string
  plan_type?: string | null
  metadata_json?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

interface WorkspaceMemberRow {
  id?: string
  workspace_id?: string
  user_id?: string
  role?: string | null
  created_at?: string
  workspaces?: WorkspaceRow | WorkspaceRow[] | null
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function asWorkspaceRole(value: unknown): WorkspaceRole {
  if (
    value === 'owner'
    || value === 'admin'
    || value === 'editor'
    || value === 'viewer'
    || value === 'client_reviewer'
  ) {
    return value
  }

  return 'viewer'
}

function relatedWorkspace(member: WorkspaceMemberRow): WorkspaceRow | undefined {
  return Array.isArray(member.workspaces) ? member.workspaces[0] : member.workspaces ?? undefined
}

function displayNameFromAuth(context: ServiceContext): string | undefined {
  const userMetadata = context.auth?.user?.user_metadata
  if (userMetadata && typeof userMetadata === 'object' && !Array.isArray(userMetadata)) {
    const metadata = userMetadata as Record<string, unknown>
    return (
      stringValue(metadata.display_name)
      ?? stringValue(metadata.full_name)
      ?? stringValue(metadata.name)
      ?? context.auth?.email?.split('@')[0]
    )
  }

  return context.auth?.email?.split('@')[0]
}

function avatarUrlFromAuth(context: ServiceContext): string | undefined {
  const userMetadata = context.auth?.user?.user_metadata
  if (!userMetadata || typeof userMetadata !== 'object' || Array.isArray(userMetadata)) return undefined

  const metadata = userMetadata as Record<string, unknown>
  return stringValue(metadata.avatar_url) ?? stringValue(metadata.picture)
}

function defaultWorkspaceName(context: ServiceContext): string {
  const profileName = displayNameFromAuth(context)
  return profileName ? `${profileName}'s Workspace` : 'My Workspace'
}

function profileSummary(profile: ProfileRow) {
  return {
    id: stringValue(profile.id),
    userId: stringValue(profile.user_id),
    displayName: stringValue(profile.display_name),
    avatarUrl: stringValue(profile.avatar_url),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

function workspaceSummary(workspace: WorkspaceRow) {
  return {
    id: stringValue(workspace.id),
    ownerId: stringValue(workspace.owner_id),
    name: stringValue(workspace.name),
    planType: stringValue(workspace.plan_type) ?? 'free',
    metadata: sanitizeJson(workspace.metadata_json),
    createdAt: workspace.created_at,
    updatedAt: workspace.updated_at,
  }
}

function membershipSummary(member: WorkspaceMemberRow) {
  return {
    id: stringValue(member.id),
    workspaceId: stringValue(member.workspace_id),
    userId: stringValue(member.user_id),
    role: asWorkspaceRole(member.role),
    createdAt: member.created_at,
  }
}

function safeUserSummary(context: ServiceContext) {
  return {
    userId: context.auth?.userId,
    email: context.auth?.email,
    isMockUser: Boolean(context.auth?.isMockUser),
  }
}

function backendUnavailable(scope: string) {
  return {
    status: 'backend_required' as const,
    available: false,
    warnings: [mockWarning(scope)],
  }
}

function assertCanonicalId(value: string | undefined, label: string): string {
  if (value) return value
  throw new ApiError('INTERNAL_ERROR', `${label} did not include a canonical id.`, 500)
}

export function createAuthService(context: ServiceContext) {
  // Server-only boundary: Prompt 3A keeps service-role access limited to auth/profile/workspace/project tables.
  async function listWorkspaceMemberships(userId: string) {
    const admin = context.clients.admin
    if (!admin || context.env.mockOnly) return []

    const { data, error } = await admin
      .from('workspace_members')
      .select('id, workspace_id, user_id, role, created_at, workspaces(id, owner_id, name, plan_type, metadata_json, created_at, updated_at)')
      .eq('user_id', userId)

    throwOnSupabaseError(error)
    return (data ?? []) as WorkspaceMemberRow[]
  }

  return {
    getBootstrapStatus() {
      const unavailable = backendUnavailable('Auth/profile/workspace/project bootstrap')

      return {
        status: context.env.mockOnly ? unavailable.status : 'available',
        available: Boolean(context.clients.admin && !context.env.mockOnly),
        canonicalTables: ['auth.users', 'profiles', 'workspaces', 'workspace_members', 'projects'],
        auditEventsEnabled: false,
        serviceRoleConfigured: context.env.hasSupabaseAdmin,
        publicAuthConfigured: context.env.hasSupabasePublic,
        mockOnly: context.env.mockOnly,
        warnings: context.env.mockOnly ? unavailable.warnings : context.env.warnings,
      }
    },

    getCurrentUserSummary() {
      return safeUserSummary(context)
    },

    async ensureProfile(input: EnsureProfileInput = {}) {
      const userId = getRequiredAuthUserId(context)
      const admin = context.clients.admin

      if (!admin || context.env.mockOnly) {
        return {
          ...backendUnavailable('Profile bootstrap'),
          profile: null,
          user: safeUserSummary(context),
        }
      }

      const { data: existingProfile, error: existingError } = await admin
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle()

      throwOnSupabaseError(existingError)

      if (existingProfile) {
        const update: Record<string, string> = {}
        if (input.displayName) update.display_name = input.displayName
        if (input.avatarUrl) update.avatar_url = input.avatarUrl

        if (Object.keys(update).length === 0) {
          return {
            status: 'ready' as const,
            available: true,
            profile: profileSummary(existingProfile as ProfileRow),
            user: safeUserSummary(context),
            warnings: [],
          }
        }

        const { data: updatedProfile, error: updateError } = await admin
          .from('profiles')
          .update(update)
          .eq('user_id', userId)
          .select('id, user_id, display_name, avatar_url, created_at, updated_at')
          .single()

        throwOnSupabaseError(updateError)
        return {
          status: 'ready' as const,
          available: true,
          profile: profileSummary(updatedProfile as ProfileRow),
          user: safeUserSummary(context),
          warnings: [],
        }
      }

      const { data: insertedProfile, error: insertError } = await admin
        .from('profiles')
        .insert({
          user_id: userId,
          display_name: input.displayName ?? displayNameFromAuth(context) ?? null,
          avatar_url: input.avatarUrl ?? avatarUrlFromAuth(context) ?? null,
          metadata_json: {
            bootstrap_source: 'prompt_3_backend_auth_workspace',
            request_id: context.requestId,
            created_at: nowIso(),
          },
        })
        .select('id, user_id, display_name, avatar_url, created_at, updated_at')
        .single()

      throwOnSupabaseError(insertError)
      return {
        status: 'ready' as const,
        available: true,
        profile: profileSummary(insertedProfile as ProfileRow),
        user: safeUserSummary(context),
        warnings: [],
      }
    },

    async ensureWorkspace(input: EnsureWorkspaceInput = {}) {
      const userId = getRequiredAuthUserId(context)
      const admin = context.clients.admin

      if (!admin || context.env.mockOnly) {
        return {
          ...backendUnavailable('Workspace bootstrap'),
          workspace: null,
          membership: null,
        }
      }

      const existingMembership = (await listWorkspaceMemberships(userId))[0]
      if (existingMembership) {
        const workspace = relatedWorkspace(existingMembership)
        return {
          status: 'ready' as const,
          available: true,
          workspace: workspace ? workspaceSummary(workspace) : null,
          membership: membershipSummary(existingMembership),
          warnings: [],
        }
      }

      const { data: insertedWorkspace, error: workspaceError } = await admin
        .from('workspaces')
        .insert({
          owner_id: userId,
          name: input.workspaceName ?? defaultWorkspaceName(context),
          plan_type: 'free',
          metadata_json: {
            bootstrap_source: 'prompt_3_backend_auth_workspace',
            request_id: context.requestId,
            created_at: nowIso(),
          },
        })
        .select('id, owner_id, name, plan_type, metadata_json, created_at, updated_at')
        .single()

      throwOnSupabaseError(workspaceError)

      const workspaceId = assertCanonicalId((insertedWorkspace as WorkspaceRow).id, 'Workspace')
      const { data: insertedMembership, error: membershipError } = await admin
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role: 'owner',
        })
        .select('id, workspace_id, user_id, role, created_at')
        .single()

      throwOnSupabaseError(membershipError)

      return {
        status: 'ready' as const,
        available: true,
        workspace: workspaceSummary(insertedWorkspace as WorkspaceRow),
        membership: membershipSummary(insertedMembership as WorkspaceMemberRow),
        warnings: [],
      }
    },

    async getCurrentWorkspace() {
      const userId = getRequiredAuthUserId(context)
      const admin = context.clients.admin

      if (!admin || context.env.mockOnly) {
        return {
          ...backendUnavailable('Current workspace lookup'),
          workspace: null,
          membership: null,
        }
      }

      const currentMembership = (await listWorkspaceMemberships(userId))[0]
      if (!currentMembership) {
        return {
          status: 'workspace_missing' as const,
          available: true,
          workspace: null,
          membership: null,
          warnings: ['No workspace membership exists for the authenticated user.'],
        }
      }

      const workspace = relatedWorkspace(currentMembership)
      return {
        status: 'ready' as const,
        available: true,
        workspace: workspace ? workspaceSummary(workspace) : null,
        membership: membershipSummary(currentMembership),
        warnings: [],
      }
    },

    async checkWorkspaceMembership(workspaceId: string) {
      const userId = getRequiredAuthUserId(context)
      const admin = context.clients.admin

      if (!admin || context.env.mockOnly) {
        return {
          ...backendUnavailable('Workspace membership check'),
          hasAccess: false,
          membership: null,
          workspace: null,
        }
      }

      const { data, error } = await admin
        .from('workspace_members')
        .select('id, workspace_id, user_id, role, created_at, workspaces(id, owner_id, name, plan_type, metadata_json, created_at, updated_at)')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()

      throwOnSupabaseError(error)
      if (!data) {
        return {
          status: 'access_denied' as const,
          available: true,
          hasAccess: false,
          membership: null,
          workspace: null,
          warnings: [],
        }
      }

      const member = data as WorkspaceMemberRow
      const workspace = relatedWorkspace(member)
      return {
        status: 'ready' as const,
        available: true,
        hasAccess: true,
        membership: membershipSummary(member),
        workspace: workspace ? workspaceSummary(workspace) : null,
        warnings: [],
      }
    },
  }
}
