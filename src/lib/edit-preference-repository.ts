import type { ApiRouteDefinition } from '../backend/api/api-runtime-contracts'
import type { AuthIdentity, AuthSessionStatus } from '../auth/auth-session-types'
import {
  DEFAULT_LOCAL_EDIT_PREFERENCES,
  normalizeEditPreferenceDefaults,
  type EditPreferencePersistence,
  type LocalEditPreferenceDefaults,
} from './edit-preferences'

export const LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID = 'workspace-internal-testing'
export const LEGACY_UNSCOPED_EDIT_PREFERENCE_STORAGE_KEY = 'reeditpro.localEditPreferences.v1'
export const AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY =
  'authenticated_private_internal_backend' as const

const SCOPED_STORAGE_PREFIX = 'reeditpro.localEditPreferences.v2'
const RECORD_VERSION = 2

export type EditPreferenceScope = {
  authMode: 'local_test' | 'supabase'
  userId: string
  workspaceId: string
}

export type EditPreferenceScopeResolution =
  | { ok: true; scope: EditPreferenceScope; message: string }
  | { ok: false; message: string }

export type EditPreferencePersistenceCapability =
  | 'local_test_identity_workspace_scoped'
  | 'authenticated_backend_route'
  | typeof AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY
  | 'unavailable'

export type EditPreferenceRepositoryStatus =
  | 'default'
  | 'ready'
  | 'saved'
  | 'invalid_record'
  | 'storage_unavailable'
  | 'backend_unavailable'
  | 'backend_error'

export type EditableEditPreferenceValues = Pick<
  LocalEditPreferenceDefaults,
  | 'applyConfirmedDefaults'
  | 'cleanupPreference'
  | 'creditPreference'
  | 'editLevel'
  | 'moodStyle'
  | 'targetPlatform'
  | 'visualPreference'
  | 'workflowType'
>

export interface EditPreferenceRepositoryResult {
  ok: boolean
  canPersist: boolean
  capability: EditPreferencePersistenceCapability
  message: string
  persisted: boolean
  preferences: LocalEditPreferenceDefaults
  scopeFingerprint?: string
  status: EditPreferenceRepositoryStatus
}

export interface EditPreferenceRepository {
  capability: EditPreferencePersistenceCapability
  requiresAsyncLoad: boolean
  getInitialResult: () => EditPreferenceRepositoryResult
  load: () => Promise<EditPreferenceRepositoryResult>
  save: (input: Partial<EditableEditPreferenceValues>) => Promise<EditPreferenceRepositoryResult>
}

export interface EditPreferenceStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface EditPreferenceApiRecord {
  recordVersion: 1
  userId: string
  workspaceId: string
  scopeFingerprint: string
  preferences: LocalEditPreferenceDefaults
  createdAt: string
  updatedAt: string
}

export interface GetEditPreferencesApiResponse {
  persistenceCapability?: typeof AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY
  preferenceRecord?: EditPreferenceApiRecord
}

export interface UpsertEditPreferencesApiRequest {
  workspaceId: string
  expectedSnapshotId?: string
  preferences: EditableEditPreferenceValues
}

export interface UpsertEditPreferencesApiResponse {
  persistenceCapability?: typeof AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY
  preferenceRecord?: EditPreferenceApiRecord
}

export const EDIT_PREFERENCE_API_CONTRACT = {
  get: {
    method: 'GET',
    path: '/v1/workspaces/:workspaceId/edit-preferences/current',
    routeId: 'editPreferences.getCurrent',
  },
  upsert: {
    method: 'PUT',
    path: '/v1/workspaces/:workspaceId/edit-preferences/current',
    routeId: 'editPreferences.upsertCurrent',
  },
  securityLevels: ['workspace_member', 'workspace_editor', 'workspace_owner_admin'],
} as const

interface ScopedPreferenceStorageRecord {
  recordVersion: 2
  scope: {
    userId: string
    workspaceId: string
  }
  scopeFingerprint: string
  preferences: LocalEditPreferenceDefaults
  savedAt: string
}

interface RepositoryOptions {
  now?: () => Date
  storage?: EditPreferenceStorage
}

export function resolveEditPreferenceScope(input: {
  authMode: 'local_test' | 'supabase' | 'unavailable'
  identity?: AuthIdentity
  status: AuthSessionStatus
  workspaceId?: string
}): EditPreferenceScopeResolution {
  if (input.status !== 'signed_in' || !input.identity) {
    return { ok: false, message: 'Sign in before loading or saving edit preferences.' }
  }

  const userId = normalizeScopeId(input.identity.id)
  if (!userId) return { ok: false, message: 'The signed-in identity is missing a valid user id.' }

  if (input.authMode === 'local_test') {
    return {
      ok: true,
      scope: {
        authMode: 'local_test',
        userId,
        workspaceId: LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
      },
      message: 'Edit Preferences are scoped to this local-test identity and workspace.',
    }
  }

  if (input.authMode === 'supabase') {
    const workspaceId = normalizeScopeId(input.workspaceId)
    if (!workspaceId) {
      return {
        ok: false,
        message: 'A verified current workspace is required before Edit Preferences can load.',
      }
    }

    return {
      ok: true,
      scope: { authMode: 'supabase', userId, workspaceId },
      message: 'Edit Preferences require an authenticated workspace-member backend route.',
    }
  }

  return { ok: false, message: 'Preference persistence is unavailable for this authentication mode.' }
}

export function createEditPreferenceRepository(
  resolution: EditPreferenceScopeResolution,
  options: RepositoryOptions = {},
): EditPreferenceRepository {
  if (!resolution.ok) return createUnavailableRepository(resolution.message)
  if (resolution.scope.authMode === 'local_test') {
    return createLocalTestEditPreferenceRepository(resolution.scope, options)
  }
  return createAuthenticatedBackendEditPreferenceRepository(resolution.scope)
}

export function createLocalTestEditPreferenceRepository(
  scope: EditPreferenceScope,
  options: RepositoryOptions = {},
): EditPreferenceRepository {
  const normalizedScope = normalizeScope(scope)
  if (!normalizedScope || normalizedScope.authMode !== 'local_test') {
    return createUnavailableRepository('A valid local-test identity and workspace scope is required.')
  }

  const storage = options.storage ?? getBrowserLocalStorage()
  if (!storage) {
    return createUnavailableRepository(
      'This browser does not expose local storage for scoped edit preferences.',
      'storage_unavailable',
    )
  }

  const now = options.now ?? (() => new Date())
  const scopeFingerprint = createEditPreferenceScopeFingerprint(normalizedScope)
  const storageKey = buildLocalEditPreferenceStorageKey(normalizedScope)

  const read = (): EditPreferenceRepositoryResult => {
    try {
      const raw = storage.getItem(storageKey)
      if (!raw) {
        return localResult({
          message: 'Using the default Edit Preferences for this signed-in test workspace.',
          preferences: cloneDefaultPreferences(),
          scopeFingerprint,
          status: 'default',
        })
      }

      const parsed = JSON.parse(raw) as unknown
      if (!isMatchingScopedStorageRecord(parsed, normalizedScope, scopeFingerprint)) {
        return localResult({
          message: 'The scoped preference record was invalid, so safe defaults are being used.',
          ok: false,
          preferences: cloneDefaultPreferences(),
          scopeFingerprint,
          status: 'invalid_record',
        })
      }

      return localResult({
        message: 'Loaded Edit Preferences for this signed-in test workspace.',
        persisted: true,
        preferences: normalizeEditPreferenceDefaults(parsed.preferences),
        scopeFingerprint,
        status: 'ready',
      })
    } catch {
      return localResult({
        message: 'The scoped preference record could not be read, so safe defaults are being used.',
        ok: false,
        preferences: cloneDefaultPreferences(),
        scopeFingerprint,
        status: 'invalid_record',
      })
    }
  }

  return {
    capability: 'local_test_identity_workspace_scoped',
    requiresAsyncLoad: false,
    getInitialResult: read,
    load: async () => read(),
    save: async (input) => {
      const savedAt = now().toISOString()
      const current = read().preferences
      const editableValues = normalizeEditableValues({ ...current, ...input })
      const preferences = normalizeEditPreferenceDefaults({
        ...current,
        ...editableValues,
        persistence: 'browser_local_edit_preferences',
        snapshotId: createScopedSnapshotId(normalizedScope, editableValues, savedAt),
        updatedAt: savedAt,
      })
      const record: ScopedPreferenceStorageRecord = {
        recordVersion: RECORD_VERSION,
        scope: {
          userId: normalizedScope.userId,
          workspaceId: normalizedScope.workspaceId,
        },
        scopeFingerprint,
        preferences,
        savedAt,
      }

      try {
        storage.setItem(storageKey, JSON.stringify(record))
        return localResult({
          message: 'Edit Preferences saved for this signed-in test workspace.',
          persisted: true,
          preferences,
          scopeFingerprint,
          status: 'saved',
        })
      } catch {
        return localResult({
          message: 'This browser blocked the scoped preference save.',
          ok: false,
          preferences: current,
          scopeFingerprint,
          status: 'storage_unavailable',
        })
      }
    },
  }
}

export function buildLocalEditPreferenceStorageKey(scope: EditPreferenceScope): string {
  const normalizedScope = normalizeScope(scope)
  if (!normalizedScope) throw new Error('A valid edit preference scope is required.')
  return `${SCOPED_STORAGE_PREFIX}.${encodeURIComponent(normalizedScope.userId)}.${encodeURIComponent(normalizedScope.workspaceId)}`
}

export function createEditPreferenceScopeFingerprint(scope: EditPreferenceScope): string {
  const normalizedScope = normalizeScope(scope)
  if (!normalizedScope) throw new Error('A valid edit preference scope is required.')
  return `preference-scope-fnv1a-${fnv1a(`${normalizedScope.userId}\u0000${normalizedScope.workspaceId}`)}`
}

function createAuthenticatedBackendEditPreferenceRepository(
  scope: EditPreferenceScope,
): EditPreferenceRepository {
  const normalizedScope = normalizeScope(scope)
  if (!normalizedScope || normalizedScope.authMode !== 'supabase') {
    return createUnavailableRepository('A valid Supabase identity and workspace scope is required.')
  }

  const initial = backendUnavailableResult(
    'Checking for reviewed authenticated edit-preference routes.',
    normalizedScope,
  )
  let currentPreferences = cloneDefaultPreferences()
  let currentSnapshotId: string | undefined

  return {
    capability: 'authenticated_backend_route',
    requiresAsyncLoad: true,
    getInitialResult: () => initial,
    load: async () => {
      const routes = await resolveAuthenticatedPreferenceRoutes()
      if (!routes.get) {
        return backendUnavailableResult(
          'No reviewed authenticated backend route currently supports reading workspace preferences.',
          normalizedScope,
        )
      }

      const { callReeditProApi } = await import('../backend/api/frontend-api-client')
      const response = await callReeditProApi<undefined, GetEditPreferencesApiResponse>(
        EDIT_PREFERENCE_API_CONTRACT.get.routeId,
        undefined,
        {
          context: { userId: normalizedScope.userId, workspaceId: normalizedScope.workspaceId },
          params: { workspaceId: normalizedScope.workspaceId },
        },
      )
      const result = preferenceResultFromBackendResponse(response, normalizedScope, 'ready')
      if (result.ok) {
        currentPreferences = result.preferences
        currentSnapshotId = result.persisted ? result.preferences.snapshotId : undefined
      }
      return result
    },
    save: async (input) => {
      const routes = await resolveAuthenticatedPreferenceRoutes()
      if (!routes.upsert) {
        return backendUnavailableResult(
          'No reviewed authenticated backend route currently supports saving workspace preferences.',
          normalizedScope,
        )
      }

      const { callReeditProApi } = await import('../backend/api/frontend-api-client')
      const preferences = normalizeEditableValues({ ...currentPreferences, ...input })
      const body: UpsertEditPreferencesApiRequest = {
        workspaceId: normalizedScope.workspaceId,
        ...(currentSnapshotId ? { expectedSnapshotId: currentSnapshotId } : {}),
        preferences,
      }
      const response = await callReeditProApi<
        UpsertEditPreferencesApiRequest,
        UpsertEditPreferencesApiResponse
      >(
        EDIT_PREFERENCE_API_CONTRACT.upsert.routeId,
        body,
        {
          context: { userId: normalizedScope.userId, workspaceId: normalizedScope.workspaceId },
          idempotencyKey: [
            'edit-preferences',
            createEditPreferenceScopeFingerprint(normalizedScope),
            currentSnapshotId ?? 'new',
            fnv1a(JSON.stringify(preferences)),
          ].join(':'),
          params: { workspaceId: normalizedScope.workspaceId },
        },
      )
      const result = preferenceResultFromBackendResponse(response, normalizedScope, 'saved')
      if (result.ok) {
        currentPreferences = result.preferences
        currentSnapshotId = result.preferences.snapshotId
      }
      return result
    },
  }
}

async function resolveAuthenticatedPreferenceRoutes(): Promise<{
  get?: ApiRouteDefinition
  upsert?: ApiRouteDefinition
}> {
  const { getApiRouteById } = await import('../backend/api/api-route-registry')
  const get = getApiRouteById(EDIT_PREFERENCE_API_CONTRACT.get.routeId)
  const upsert = getApiRouteById(EDIT_PREFERENCE_API_CONTRACT.upsert.routeId)

  return {
    get: isReviewedPreferenceRoute(get, EDIT_PREFERENCE_API_CONTRACT.get) ? get : undefined,
    upsert: isReviewedPreferenceRoute(upsert, EDIT_PREFERENCE_API_CONTRACT.upsert) ? upsert : undefined,
  }
}

function isReviewedPreferenceRoute(
  route: ApiRouteDefinition | undefined,
  expected: { method: 'GET' | 'PUT'; path: string },
): route is ApiRouteDefinition {
  return Boolean(
    route
    && route.method === expected.method
    && route.path === expected.path
    && route.runtimeMode === 'frontend_safe'
    && route.status === 'frontend_safe_ready'
    && EDIT_PREFERENCE_API_CONTRACT.securityLevels.some((level) => level === route.securityLevel)
    && !route.requiresServiceRole
    && !route.requiresProviderSecret
    && !route.requiresStripeSecret,
  )
}

function preferenceResultFromBackendResponse(
  response: {
    ok: boolean
    mockOnly: boolean
    data?: GetEditPreferencesApiResponse | UpsertEditPreferencesApiResponse
    error?: { message: string }
  },
  scope: EditPreferenceScope,
  successStatus: 'ready' | 'saved',
): EditPreferenceRepositoryResult {
  const persistenceCapability = response.data?.persistenceCapability
  const record = response.data?.preferenceRecord
  const isReviewedPrivateInternalResponse = response.ok
    && response.mockOnly
    && persistenceCapability === AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY

  if (!isReviewedPrivateInternalResponse) {
    return {
      ...backendUnavailableResult(
        response.error?.message ?? 'The authenticated preference route did not return a reviewed private-internal record.',
        scope,
      ),
      status: response.ok ? 'backend_unavailable' : 'backend_error',
    }
  }

  if (!record) {
    return {
      ok: true,
      canPersist: true,
      capability: AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
      message: 'No private-internal preference record exists yet; safe defaults are ready to save.',
      persisted: false,
      preferences: cloneDefaultPreferences(AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY),
      scopeFingerprint: createEditPreferenceScopeFingerprint(scope),
      status: 'default',
    }
  }

  if (
    record.recordVersion !== 1
    || record.userId !== scope.userId
    || record.workspaceId !== scope.workspaceId
    || record.scopeFingerprint !== createEditPreferenceScopeFingerprint(scope)
    || record.preferences.persistence !== AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY
  ) {
    return {
      ...backendUnavailableResult(
        'The backend preference record did not match the signed-in identity and workspace.',
        scope,
      ),
      status: 'backend_error',
    }
  }

  return {
    ok: true,
    canPersist: true,
    capability: AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
    message: successStatus === 'saved'
      ? 'Edit Preferences saved to private-internal storage for the authenticated workspace.'
      : 'Loaded private-internal Edit Preferences for the authenticated workspace.',
    persisted: true,
    preferences: normalizeEditPreferenceDefaults(
      record.preferences,
      AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
    ),
    scopeFingerprint: createEditPreferenceScopeFingerprint(scope),
    status: successStatus,
  }
}

function createUnavailableRepository(
  message: string,
  status: EditPreferenceRepositoryStatus = 'backend_unavailable',
): EditPreferenceRepository {
  const result: EditPreferenceRepositoryResult = {
    ok: false,
    canPersist: false,
    capability: 'unavailable',
    message,
    persisted: false,
    preferences: cloneDefaultPreferences(),
    status,
  }
  return {
    capability: 'unavailable',
    requiresAsyncLoad: false,
    getInitialResult: () => result,
    load: async () => result,
    save: async () => result,
  }
}

function backendUnavailableResult(
  message: string,
  scope: EditPreferenceScope,
): EditPreferenceRepositoryResult {
  return {
    ok: false,
    canPersist: false,
    capability: 'authenticated_backend_route',
    message,
    persisted: false,
    preferences: cloneDefaultPreferences(),
    scopeFingerprint: createEditPreferenceScopeFingerprint(scope),
    status: 'backend_unavailable',
  }
}

function localResult(input: {
  message: string
  ok?: boolean
  persisted?: boolean
  preferences: LocalEditPreferenceDefaults
  scopeFingerprint: string
  status: EditPreferenceRepositoryStatus
}): EditPreferenceRepositoryResult {
  return {
    ok: input.ok ?? true,
    canPersist: true,
    capability: 'local_test_identity_workspace_scoped',
    message: input.message,
    persisted: input.persisted ?? false,
    preferences: input.preferences,
    scopeFingerprint: input.scopeFingerprint,
    status: input.status,
  }
}

function isMatchingScopedStorageRecord(
  value: unknown,
  scope: EditPreferenceScope,
  scopeFingerprint: string,
): value is ScopedPreferenceStorageRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<ScopedPreferenceStorageRecord>
  return record.recordVersion === RECORD_VERSION
    && record.scope?.userId === scope.userId
    && record.scope?.workspaceId === scope.workspaceId
    && record.scopeFingerprint === scopeFingerprint
    && typeof record.savedAt === 'string'
    && Boolean(record.preferences && typeof record.preferences === 'object')
}

function normalizeEditableValues(value: Partial<LocalEditPreferenceDefaults>): EditableEditPreferenceValues {
  const normalized = normalizeEditPreferenceDefaults(value)
  return {
    applyConfirmedDefaults: normalized.applyConfirmedDefaults,
    cleanupPreference: normalized.cleanupPreference,
    creditPreference: normalized.creditPreference,
    editLevel: normalized.editLevel,
    moodStyle: normalized.moodStyle,
    targetPlatform: normalized.targetPlatform,
    visualPreference: normalized.visualPreference,
    workflowType: normalized.workflowType,
  }
}

function createScopedSnapshotId(
  scope: EditPreferenceScope,
  preferences: EditableEditPreferenceValues,
  savedAt: string,
): string {
  const scopeHash = createEditPreferenceScopeFingerprint(scope).replace('preference-scope-fnv1a-', '')
  const valueHash = fnv1a(JSON.stringify(preferences))
  const timestamp = new Date(savedAt).getTime().toString(36)
  return `local-edit-preferences-v2-${scopeHash}-${timestamp}-${valueHash}`.slice(0, 120)
}

function normalizeScope(scope: EditPreferenceScope): EditPreferenceScope | undefined {
  const userId = normalizeScopeId(scope.userId)
  const workspaceId = normalizeScopeId(scope.workspaceId)
  if (!userId || !workspaceId) return undefined
  if (scope.authMode !== 'local_test' && scope.authMode !== 'supabase') return undefined
  return { authMode: scope.authMode, userId, workspaceId }
}

function normalizeScopeId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized || normalized.length > 160 || containsControlCharacter(normalized)) return undefined
  return normalized
}

function containsControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code <= 31 || code === 127) return true
  }
  return false
}

function cloneDefaultPreferences(
  persistence: EditPreferencePersistence = 'browser_local_edit_preferences',
): LocalEditPreferenceDefaults {
  return { ...DEFAULT_LOCAL_EDIT_PREFERENCES, persistence }
}

function getBrowserLocalStorage(): EditPreferenceStorage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function fnv1a(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
