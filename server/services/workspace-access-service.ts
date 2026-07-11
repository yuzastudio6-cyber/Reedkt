import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { getRequiredAuthUserId } from './service-helpers'

const EDITOR_ROLES = new Set(['owner', 'admin', 'editor'])

export async function authorizeWorkspaceAccess(
  context: ServiceContext,
  workspaceIdInput: string,
  operation: 'read' | 'write',
): Promise<{ userId: string; workspaceId: string; role: string }> {
  const userId = normalizeWorkspaceScopeId(getRequiredAuthUserId(context), 'authenticated user id')
  const workspaceId = normalizeWorkspaceScopeId(workspaceIdInput, 'workspace id')

  if (context.auth?.isMockUser) {
    if (
      context.env.nodeEnv === 'production' ||
      (context.env.mode !== 'local' && context.env.mode !== 'mock')
    ) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Mock workspace access is unavailable outside local testing.', 403)
    }
    return { userId, workspaceId, role: 'owner' }
  }

  if (!context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Workspace access requires a verified bearer-authenticated user.', 401)
  }

  const adminClient = context.clients.admin
  if (!adminClient) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace membership could not be verified.', 403)
  }

  const { data, error } = await adminClient
    .from('workspace_members')
    .select('workspace_id, user_id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The authenticated user is not a verified member of this workspace.', 403)
  }

  const membership = data as { workspace_id?: unknown; user_id?: unknown; role?: unknown }
  const role = typeof membership.role === 'string' ? membership.role : ''
  if (membership.workspace_id !== workspaceId || membership.user_id !== userId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace membership evidence did not match the request scope.', 403)
  }
  if (operation === 'write' && !EDITOR_ROLES.has(role)) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace editor access is required for this operation.', 403)
  }

  return { userId, workspaceId, role }
}

export function normalizeWorkspaceScopeId(value: string, label: string): string {
  const normalized = value.trim()
  if (
    !normalized ||
    normalized.length > 160 ||
    normalized.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized)
  ) {
    throw new ApiError('VALIDATION_FAILED', `A safe ${label} is required.`, 400)
  }
  return normalized
}
