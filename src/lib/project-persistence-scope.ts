import type { AuthIdentity, AuthSessionStatus } from '../auth/auth-session-types'

export const LOCAL_TEST_PROJECT_WORKSPACE_ID = 'workspace-internal-testing'

export type ProjectPersistenceScope = {
  authMode: 'local_test' | 'supabase'
  userId: string
  workspaceId: string
  backendUserId?: string
}

export type ProjectPersistenceScopeResolution =
  | { ok: true; scope: ProjectPersistenceScope; message: string }
  | { ok: false; pending: boolean; message: string }

export const PROJECT_PERSISTENCE_SCOPE_REVALIDATE_EVENT = 'reeditpro:project-persistence-scope-revalidate'
const activeSupabaseScopeKeys = new Set<string>()

export function resolveProjectPersistenceScope(input: {
  authMode: 'local_test' | 'supabase' | 'unavailable'
  identity?: AuthIdentity
  status: AuthSessionStatus
  workspaceId?: string
  workspacePending?: boolean
}): ProjectPersistenceScopeResolution {
  if (input.status !== 'signed_in' || !input.identity) {
    return {
      ok: false,
      pending: input.status === 'loading',
      message: 'Sign in before loading project or edit state.',
    }
  }

  const userId = normalizeProjectScopeId(input.identity.id)
  if (!userId) {
    return { ok: false, pending: false, message: 'The signed-in identity is missing a valid user id.' }
  }

  if (input.authMode === 'local_test') {
    return {
      ok: true,
      scope: {
        authMode: 'local_test',
        userId,
        workspaceId: LOCAL_TEST_PROJECT_WORKSPACE_ID,
      },
      message: 'Project state is scoped to this local-test identity and workspace.',
    }
  }

  if (input.authMode === 'supabase') {
    const workspaceId = normalizeProjectScopeId(input.workspaceId)
    if (!workspaceId) {
      return {
        ok: false,
        pending: input.workspacePending === true,
        message: input.workspacePending
          ? 'Resolving the signed-in workspace before loading project state.'
          : 'A verified current workspace is required before project state can load.',
      }
    }

    return {
      ok: true,
      scope: { authMode: 'supabase', userId, workspaceId },
      message: 'Project state is scoped to the authenticated workspace.',
    }
  }

  return { ok: false, pending: false, message: 'Project persistence is unavailable for this authentication mode.' }
}

export function createProjectPersistenceScopeFingerprint(scope: ProjectPersistenceScope): string {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized) throw new Error('A valid project persistence scope is required.')
  return `project-scope-fnv1a-${fnv1a(`${normalized.authMode}\u0000${normalized.userId}\u0000${normalized.workspaceId}`)}`
}

export function buildProjectPersistenceScopeStorageKey(
  prefix: string,
  scope: ProjectPersistenceScope,
): string {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized) throw new Error('A valid project persistence scope is required.')
  return [
    prefix,
    encodeScopeKeySegment(normalized.authMode),
    encodeScopeKeySegment(normalized.userId),
    encodeScopeKeySegment(normalized.workspaceId),
  ].join('.')
}

export function activateProjectPersistenceScope(scope: ProjectPersistenceScope): void {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (normalized?.authMode === 'supabase') activeSupabaseScopeKeys.add(scopeIdentityKey(normalized))
}

export function deactivateProjectPersistenceScope(scope: ProjectPersistenceScope): void {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (normalized?.authMode === 'supabase') activeSupabaseScopeKeys.delete(scopeIdentityKey(normalized))
}

export function isProjectPersistenceScopeActive(scope: ProjectPersistenceScope): boolean {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized) return false
  return normalized.authMode === 'local_test' || activeSupabaseScopeKeys.has(scopeIdentityKey(normalized))
}

export function invalidateProjectPersistenceScope(scope: ProjectPersistenceScope): void {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized || normalized.authMode !== 'supabase') return
  deactivateProjectPersistenceScope(normalized)
  purgeProjectPersistenceScopeCaches(normalized)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROJECT_PERSISTENCE_SCOPE_REVALIDATE_EVENT))
  }
}

export function purgeProjectPersistenceScopeCaches(scope: ProjectPersistenceScope): void {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized || typeof window === 'undefined') return
  for (const prefix of ['reeditpro.localProjects.v2', 'reeditpro.localProjectHandoffs.v2']) {
    window.localStorage.removeItem(buildProjectPersistenceScopeStorageKey(prefix, normalized))
  }
}

export function apiResponseInvalidatesProjectPersistenceScope(response: {
  statusCode?: number
  error?: { code?: string }
}): boolean {
  return response.statusCode === 401 ||
    response.statusCode === 403 ||
    response.error?.code === 'AUTH_REQUIRED' ||
    response.error?.code === 'AUTH_INVALID' ||
    response.error?.code === 'WORKSPACE_ACCESS_DENIED'
}

export function normalizeProjectPersistenceScope(
  scope: ProjectPersistenceScope,
): ProjectPersistenceScope | undefined {
  const userId = normalizeProjectScopeId(scope.userId)
  const workspaceId = normalizeProjectScopeId(scope.workspaceId)
  if (!userId || !workspaceId || (scope.authMode !== 'local_test' && scope.authMode !== 'supabase')) {
    return undefined
  }
  const backendUserId = normalizeProjectScopeId(scope.backendUserId)
  return {
    authMode: scope.authMode,
    userId,
    workspaceId,
    ...(backendUserId ? { backendUserId } : {}),
  }
}

export function expectedProjectPersistenceBackendUserId(scope: ProjectPersistenceScope): string {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized) throw new Error('A valid project persistence scope is required.')
  return normalized.backendUserId ?? normalized.userId
}

export function normalizeProjectScopeId(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  if (
    !normalized ||
    normalized.length > 160 ||
    normalized.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized)
  ) {
    return undefined
  }
  return normalized
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function encodeScopeKeySegment(value: string): string {
  const encoded = encodeURIComponent(value)
  return `${encoded.length}:${encoded}`
}

function scopeIdentityKey(scope: ProjectPersistenceScope): string {
  return JSON.stringify([scope.authMode, scope.userId, scope.workspaceId])
}
