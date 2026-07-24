import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { getRequiredAuthUserId } from './service-helpers'

const EDITOR_ROLES = new Set(['owner', 'admin', 'editor'])
const MAX_MEMBERSHIP_RESPONSE_BYTES = 8 * 1024
const MAX_MEMBERSHIP_LIST_RESPONSE_BYTES = 32 * 1024
const MAX_MEMBERSHIP_LIST_ROWS = 64
const MEMBERSHIP_READ_TIMEOUT_MS = 10_000

export interface AuthenticatedWorkspaceMembership {
  workspaceId: string
  userId: string
  role: string
}

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

  const membership = shouldReadLegacyInjectedMembershipFixture(context)
    ? await readLegacyInjectedMembershipFixture(context, workspaceId, userId)
    : await readAuthenticatedWorkspaceMembership(context, workspaceId, userId)
  if (!membership) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The authenticated user is not a verified member of this workspace.', 403)
  }
  const role = typeof membership.role === 'string' ? membership.role : ''
  if (membership.workspace_id !== workspaceId || membership.user_id !== userId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace membership evidence did not match the request scope.', 403)
  }
  if (operation === 'write' && !EDITOR_ROLES.has(role)) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace editor access is required for this operation.', 403)
  }

  return { userId, workspaceId, role }
}

/**
 * Server-only discovery used by request-scoped local repositories that must
 * resolve an exact saved resource before its workspace ID is known. The
 * bearer token remains in-memory and the fixed RLS query returns only bounded
 * membership identity. Callers must still re-authorize and re-read the target
 * domain record before using a matched workspace.
 */
export async function listAuthenticatedWorkspaceMemberships(
  context: ServiceContext,
): Promise<AuthenticatedWorkspaceMembership[]> {
  const userId = normalizeWorkspaceScopeId(
    getRequiredAuthUserId(context),
    'authenticated user id',
  )
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError(
      'AUTH_INVALID',
      'Workspace discovery requires a verified bearer-authenticated user.',
      401,
    )
  }

  const endpointOrigin = context.env.supabaseUrl
  const anonKey = context.env.supabaseAnonKey
  const accessToken = context.auth.accessToken
  if (!endpointOrigin || !anonKey) return []

  let endpoint: URL
  try {
    endpoint = new URL('/rest/v1/workspace_members', endpointOrigin)
  } catch {
    return []
  }
  endpoint.searchParams.set('select', 'workspace_id,user_id,role')
  endpoint.searchParams.set('user_id', `eq.${userId}`)
  endpoint.searchParams.set('order', 'workspace_id.asc')
  endpoint.searchParams.set('limit', String(MAX_MEMBERSHIP_LIST_ROWS + 1))

  const payload = await readMembershipPayload({
    endpoint,
    anonKey,
    accessToken,
    maximumBytes: MAX_MEMBERSHIP_LIST_RESPONSE_BYTES,
  })
  if (!payload || payload.length > MAX_MEMBERSHIP_LIST_ROWS) return []

  const memberships: AuthenticatedWorkspaceMembership[] = []
  const seenWorkspaceIds = new Set<string>()
  for (const value of payload) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return []
    const row = value as {
      workspace_id?: unknown
      user_id?: unknown
      role?: unknown
    }
    if (
      typeof row.workspace_id !== 'string'
      || row.user_id !== userId
      || typeof row.role !== 'string'
      || !['owner', 'admin', 'editor', 'viewer'].includes(row.role)
    ) return []
    const workspaceId = normalizeWorkspaceScopeId(
      row.workspace_id,
      'workspace id',
    )
    if (seenWorkspaceIds.has(workspaceId)) return []
    seenWorkspaceIds.add(workspaceId)
    memberships.push({
      workspaceId,
      userId,
      role: row.role,
    })
  }

  return memberships
}

function shouldReadLegacyInjectedMembershipFixture(context: ServiceContext): boolean {
  return context.env.nodeEnv !== 'production'
    && Boolean(context.clients.admin)
    && (
      context.env.mockOnly
      || context.env.allowInternalTestExecutionWithSupabase
    )
}

async function readLegacyInjectedMembershipFixture(
  context: ServiceContext,
  workspaceId: string,
  userId: string,
): Promise<{ workspace_id?: unknown; user_id?: unknown; role?: unknown } | undefined> {
  const adminClient = context.clients.admin
  if (!adminClient) return undefined
  const { data, error } = await adminClient
    .from('workspace_members')
    .select('workspace_id, user_id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return undefined
  return data as { workspace_id?: unknown; user_id?: unknown; role?: unknown }
}

async function readAuthenticatedWorkspaceMembership(
  context: ServiceContext,
  workspaceId: string,
  userId: string,
): Promise<{ workspace_id?: unknown; user_id?: unknown; role?: unknown } | undefined> {
  const endpointOrigin = context.env.supabaseUrl
  const anonKey = context.env.supabaseAnonKey
  const accessToken = context.auth?.accessToken
  if (!endpointOrigin || !anonKey || !accessToken) return undefined

  let endpoint: URL
  try {
    endpoint = new URL('/rest/v1/workspace_members', endpointOrigin)
  } catch {
    return undefined
  }
  endpoint.searchParams.set('select', 'workspace_id,user_id,role')
  endpoint.searchParams.set('workspace_id', `eq.${workspaceId}`)
  endpoint.searchParams.set('user_id', `eq.${userId}`)
  endpoint.searchParams.set('limit', '2')

  const payload = await readMembershipPayload({
    endpoint,
    anonKey,
    accessToken,
    maximumBytes: MAX_MEMBERSHIP_RESPONSE_BYTES,
  })
  if (!Array.isArray(payload) || payload.length !== 1) return undefined
  const membership = payload[0]
  if (!membership || typeof membership !== 'object' || Array.isArray(membership)) {
    return undefined
  }
  return membership as { workspace_id?: unknown; user_id?: unknown; role?: unknown }
}

async function readMembershipPayload(input: {
  endpoint: URL
  anonKey: string
  accessToken: string
  maximumBytes: number
}): Promise<unknown[] | undefined> {
  let response: Response
  try {
    response = await fetch(input.endpoint, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        apikey: input.anonKey,
        authorization: `Bearer ${input.accessToken}`,
      },
      signal: AbortSignal.timeout(MEMBERSHIP_READ_TIMEOUT_MS),
    })
  } catch {
    return undefined
  }
  if (!response.ok) return undefined
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (
    Number.isFinite(contentLength)
    && contentLength > input.maximumBytes
  ) return undefined
  const body = await response.text()
  if (Buffer.byteLength(body, 'utf8') > input.maximumBytes) return undefined
  try {
    const parsed = JSON.parse(body) as unknown
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
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
