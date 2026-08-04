import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import {
  recordInternalEditPersistenceResult,
  type LocalInternalProjectHandoff,
} from './local-project-handoff'
import {
  isMotionStudioStorytellingHandoff,
  isRetainedLegacyMotionStudioStorytellingMigrationCandidate,
  motionStudioStorytellingWorkspaceRoute,
} from './motion-studio/contracts/storytelling-workflow'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  expectedProjectPersistenceBackendUserId,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

type InternalEditStateResponse = {
  internalEditState?: {
    userId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    handoff: LocalInternalProjectHandoff
    updatedAt: string
  }
}

type InternalEditStateListResponse = {
  internalEditStates?: unknown[]
}

type StorytellingWorkflowMigrationResponse = InternalEditStateResponse & {
  migrationReceipt?: {
    recordVersion: string
    sourceHandoffUpdatedAt: string
    migratedHandoffUpdatedAt: string
    productWorkflow: string
    editorPath: string
    productionId: string
    productionRecordVersion: number
    productionUpdatedAt: string
    productionAuthorityHash: string
    requestHash: string
    idempotencyKeyHash: string
    receiptDigest: string
    providerCalled: boolean
    generationStarted: boolean
    customerCommercialAuthorityGranted: boolean
    productionReady: boolean
  }
}

export type InternalEditStateBackendSyncResult = {
  ok: boolean
  persisted: boolean
  warnings: string[]
  errorMessage?: string
}

export type InternalEditStateBackendReadResult =
  | {
      status: 'found'
      handoff: LocalInternalProjectHandoff
      warnings: string[]
    }
  | {
      status: 'not_found' | 'access_denied' | 'unavailable' | 'invalid_response'
      backendConfigured?: boolean
      errorMessage: string
      retryable: boolean
      warnings: string[]
    }

export type InternalEditStateBackendListResult =
  | {
      status: 'ready'
      handoffs: LocalInternalProjectHandoff[]
      warnings: string[]
    }
  | {
      status: 'not_configured'
      errorMessage: string
      retryable: false
      warnings: string[]
    }
  | {
      status: 'access_denied' | 'unavailable' | 'invalid_response'
      backendConfigured: true
      errorMessage: string
      retryable: boolean
      warnings: string[]
    }

export async function syncLocalInternalProjectHandoffToBackend(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
): Promise<boolean> {
  const result = await persistLocalInternalProjectHandoffToBackend(scope, handoff)
  return result.ok
}

export async function persistLocalInternalProjectHandoffToBackend(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
  options: { reportStatus?: boolean } = {},
): Promise<InternalEditStateBackendSyncResult> {
  const result = await persistLocalInternalProjectHandoffRequest(scope, handoff)
  if (options.reportStatus !== false) {
    recordInternalEditPersistenceResult(scope, handoff, result)
  }
  return result
}

async function persistLocalInternalProjectHandoffRequest(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
): Promise<InternalEditStateBackendSyncResult> {
  if (handoff.workspaceId !== scope.workspaceId) {
    return {
      ok: false,
      persisted: false,
      warnings: [],
      errorMessage: 'Internal edit state does not belong to the active workspace.',
    }
  }
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      ok: true,
      persisted: false,
      warnings: [
        'Internal edit state backend persistence skipped because reviewed backend HTTP transport is not configured.',
        ...status.warnings,
      ],
    }
  }

  const response = await callReeditProApi<
    { workspaceId: string; editSessionId: string; handoff: LocalInternalProjectHandoff },
    InternalEditStateResponse
  >(
    'projects.internalEditState.save',
    {
      workspaceId: scope.workspaceId,
      editSessionId: handoff.editSessionId,
      handoff,
    },
    {
      params: { projectId: handoff.projectId },
      idempotencyKey: await createInternalEditStateIdempotencyKey(scope.workspaceId, handoff),
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }

  if (
    !response.ok ||
    !internalEditStateUserMatchesScope(scope, response.data?.internalEditState?.userId) ||
    response.data?.internalEditState?.workspaceId !== scope.workspaceId ||
    response.data.internalEditState.projectId !== handoff.projectId ||
    response.data.internalEditState.editSessionId !== handoff.editSessionId ||
    response.data.internalEditState.handoff?.workspaceId !== scope.workspaceId ||
    response.data.internalEditState.handoff?.projectId !== handoff.projectId ||
    response.data.internalEditState.handoff?.editSessionId !== handoff.editSessionId
  ) {
    return {
      ok: false,
      persisted: false,
      warnings: response.warnings,
      errorMessage: response.error?.message ?? 'Internal edit state backend persistence failed.',
    }
  }

  return {
    ok: true,
    persisted: true,
    warnings: response.warnings,
  }
}

export async function fetchLocalInternalProjectHandoffFromBackend(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId?: string,
): Promise<LocalInternalProjectHandoff | undefined> {
  const result = await readLocalInternalProjectHandoffFromBackend(scope, projectId, editSessionId)
  return result.status === 'found' ? result.handoff : undefined
}

export async function readLocalInternalProjectHandoffFromBackend(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId?: string,
): Promise<InternalEditStateBackendReadResult> {
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      status: 'unavailable',
      backendConfigured: false,
      errorMessage: 'Private edit recovery requires a configured reviewed backend connection.',
      retryable: true,
      warnings: status.warnings,
    }
  }

  const response = await callReeditProApi<undefined, InternalEditStateResponse>(
    'projects.internalEditState.get',
    undefined,
    {
      params: { projectId },
      query: {
        workspaceId: scope.workspaceId,
        ...(editSessionId ? { editSessionId } : {}),
      },
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }

  const responseCode = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    responseCode === 'AUTH_REQUIRED' ||
    responseCode === 'AUTH_INVALID' ||
    responseCode === 'WORKSPACE_ACCESS_DENIED'
  ) {
    return {
      status: 'access_denied',
      errorMessage: 'This edit is not available to the signed-in workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (response.statusCode === 404 || responseCode === 'PROJECT_NOT_FOUND' || responseCode === 'CHAT_SESSION_NOT_FOUND') {
    return {
      status: 'not_found',
      errorMessage: 'This named edit could not be found.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (isInvalidBackendResponseCode(responseCode)) {
    return {
      status: 'invalid_response',
      errorMessage: 'The edit response could not be safely matched to this signed-in workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (!response.ok) {
    return {
      status: 'unavailable',
      backendConfigured: true,
      errorMessage: 'Private edit state could not be loaded from the backend.',
      retryable: true,
      warnings: response.warnings,
    }
  }

  const handoff = response.data?.internalEditState?.handoff
  if (
    !handoff ||
    !internalEditStateUserMatchesScope(scope, response.data?.internalEditState?.userId) ||
    response.data?.internalEditState?.workspaceId !== scope.workspaceId ||
    response.data.internalEditState.projectId !== projectId ||
    response.data.internalEditState.editSessionId !== handoff?.editSessionId ||
    handoff?.workspaceId !== scope.workspaceId ||
    handoff.projectId !== projectId ||
    (editSessionId && handoff.editSessionId !== editSessionId)
  ) {
    return {
      status: 'invalid_response',
      errorMessage: 'The recovered edit did not match the signed-in user, workspace, project, and edit route.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  return {
    status: 'found',
    handoff,
    warnings: response.warnings,
  }
}

export async function migrateRetainedStorytellingWorkflowFromBackend(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
): Promise<InternalEditStateBackendReadResult> {
  if (
    scope.authMode !== 'supabase' ||
    handoff.workspaceId !== scope.workspaceId ||
    !isRetainedLegacyMotionStudioStorytellingMigrationCandidate(handoff)
  ) {
    return {
      status: 'invalid_response',
      errorMessage: 'This edit is not eligible for the signed-in production-verified Storytelling migration.',
      retryable: false,
      warnings: [],
    }
  }
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      status: 'unavailable',
      backendConfigured: false,
      errorMessage: 'Storytelling migration requires the reviewed signed-in backend connection.',
      retryable: true,
      warnings: status.warnings,
    }
  }

  const response = await callReeditProApi<{
    workspaceId: string
    editSessionId: string
    expectedHandoffUpdatedAt: string
  }, StorytellingWorkflowMigrationResponse>(
    'projects.internalEditState.migrateMotionStudioStorytelling',
    {
      workspaceId: scope.workspaceId,
      editSessionId: handoff.editSessionId,
      expectedHandoffUpdatedAt: handoff.updatedAt,
    },
    {
      params: { projectId: handoff.projectId },
      idempotencyKey: await createStorytellingWorkflowMigrationIdempotencyKey(scope, handoff),
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }
  const responseCode = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    responseCode === 'AUTH_REQUIRED' ||
    responseCode === 'AUTH_INVALID' ||
    responseCode === 'WORKSPACE_ACCESS_DENIED'
  ) {
    return {
      status: 'access_denied',
      errorMessage: 'This Storytelling edit is not available to the signed-in workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }
  if (response.statusCode === 404 || responseCode === 'PROJECT_NOT_FOUND') {
    return {
      status: 'not_found',
      errorMessage: 'The retained Storytelling edit or its exact production could not be found.',
      retryable: false,
      warnings: response.warnings,
    }
  }
  if (!response.ok) {
    return {
      status: response.statusCode === 409 || isInvalidBackendResponseCode(responseCode)
        ? 'invalid_response'
        : 'unavailable',
      ...(response.statusCode >= 500 ? { backendConfigured: true } : {}),
      errorMessage: response.error?.message ?? 'The retained Storytelling edit could not be migrated.',
      retryable: response.statusCode >= 500 || responseCode === 'http_transport_failed',
      warnings: response.warnings,
    }
  }

  const migratedHandoff = response.data?.internalEditState?.handoff
  const receipt = response.data?.migrationReceipt
  if (!isValidStorytellingMigrationProjection(scope, handoff, migratedHandoff, receipt)) {
    return {
      status: 'invalid_response',
      errorMessage: 'The Storytelling migration response did not match the exact saved edit and production-bound receipt.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  const reread = await readLocalInternalProjectHandoffFromBackend(
    scope,
    handoff.projectId,
    handoff.editSessionId,
  )
  if (
    reread.status !== 'found' ||
    reread.handoff.updatedAt !== receipt.migratedHandoffUpdatedAt ||
    !isMotionStudioStorytellingHandoff(reread.handoff) ||
    reread.handoff.editorPath !== receipt.editorPath
  ) {
    return reread.status === 'access_denied'
      ? reread
      : {
          status: 'invalid_response',
          errorMessage: 'The migrated Storytelling workflow could not be re-read exactly, so the Director remained closed.',
          retryable: false,
          warnings: [...response.warnings, ...reread.warnings],
        }
  }
  return {
    status: 'found',
    handoff: reread.handoff,
    warnings: [...response.warnings, ...reread.warnings],
  }
}

export async function listLocalInternalProjectHandoffsFromBackend(
  scope: ProjectPersistenceScope,
): Promise<LocalInternalProjectHandoff[]> {
  const result = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  return result.status === 'ready' ? result.handoffs : []
}

export async function listLocalInternalProjectHandoffsFromBackendResult(
  scope: ProjectPersistenceScope,
): Promise<InternalEditStateBackendListResult> {
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      status: 'not_configured',
      errorMessage: 'Account edit recovery is not configured for this browser session.',
      retryable: false,
      warnings: status.warnings,
    }
  }

  const response = await callReeditProApi<undefined, InternalEditStateListResponse>(
    'projects.internalEditState.list',
    undefined,
    { query: { workspaceId: scope.workspaceId } },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }

  const responseCode = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    responseCode === 'AUTH_REQUIRED' ||
    responseCode === 'AUTH_INVALID' ||
    responseCode === 'WORKSPACE_ACCESS_DENIED'
  ) {
    return {
      status: 'access_denied',
      backendConfigured: true,
      errorMessage: 'Saved edits are not available to the signed-in workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (isInvalidBackendResponseCode(responseCode)) {
    return {
      status: 'invalid_response',
      backendConfigured: true,
      errorMessage: 'The saved-edit response could not be safely matched to this signed-in workspace.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  if (!response.ok) {
    return {
      status: 'unavailable',
      backendConfigured: true,
      errorMessage: 'Saved edits could not be recovered from the account connection.',
      retryable: response.statusCode >= 500 || responseCode === 'http_transport_failed',
      warnings: response.warnings,
    }
  }

  if (!Array.isArray(response.data?.internalEditStates)) {
    return {
      status: 'invalid_response',
      backendConfigured: true,
      errorMessage: 'The saved-edit response was incomplete.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  const parsed = response.data.internalEditStates.map((state) =>
    internalEditStateListHandoffForScope(scope, state),
  )
  if (parsed.some((handoff) => !handoff)) {
    return {
      status: 'invalid_response',
      backendConfigured: true,
      errorMessage: 'The saved-edit response contained data for a different user, workspace, project, or edit.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  const handoffs = parsed as LocalInternalProjectHandoff[]
  const uniqueEditKeys = new Set(handoffs.map(internalProjectEditKey))
  if (uniqueEditKeys.size !== handoffs.length) {
    return {
      status: 'invalid_response',
      backendConfigured: true,
      errorMessage: 'The saved-edit response contained duplicate edit identities.',
      retryable: false,
      warnings: response.warnings,
    }
  }

  return {
    status: 'ready',
    handoffs: [...handoffs].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    warnings: response.warnings,
  }
}

function internalEditStateUserMatchesScope(scope: ProjectPersistenceScope, userId: string | undefined): boolean {
  if (!userId?.trim()) return false
  return userId === expectedProjectPersistenceBackendUserId(scope)
}

export async function recoverLocalInternalProjectEditHandoffsFromBackend(
  scope: ProjectPersistenceScope,
  projectId: string,
): Promise<LocalInternalProjectHandoff[]> {
  const listedHandoffs = await listLocalInternalProjectHandoffsFromBackendWithRetry(scope)
  const matchingListedHandoffs = listedHandoffs.filter((handoff) => handoff.projectId === projectId)
  if (matchingListedHandoffs.length > 0) return matchingListedHandoffs

  const directHandoff = await fetchLocalInternalProjectHandoffFromBackend(scope, projectId)
  return directHandoff ? [directHandoff] : []
}

export async function listLocalInternalProjectHandoffsFromBackendWithRetry(
  scope: ProjectPersistenceScope,
): Promise<LocalInternalProjectHandoff[]> {
  const result = await listLocalInternalProjectHandoffsFromBackendWithRetryResult(scope)
  return result.status === 'ready' ? result.handoffs : []
}

export async function listLocalInternalProjectHandoffsFromBackendWithRetryResult(
  scope: ProjectPersistenceScope,
): Promise<InternalEditStateBackendListResult> {
  const firstRead = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  if (
    typeof window === 'undefined' ||
    firstRead.status === 'not_configured' ||
    firstRead.status === 'access_denied' ||
    firstRead.status === 'invalid_response' ||
    (firstRead.status === 'unavailable' && !firstRead.retryable)
  ) {
    return firstRead
  }

  await new Promise((resolve) => window.setTimeout(resolve, 250))
  const secondRead = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  if (secondRead.status === 'access_denied') return secondRead
  if (firstRead.status === 'ready' && secondRead.status === 'ready') {
    return {
      status: 'ready',
      handoffs: mergeInternalProjectHandoffs(firstRead.handoffs, secondRead.handoffs),
      warnings: uniqueWarnings(firstRead.warnings, secondRead.warnings),
    }
  }
  if (secondRead.status === 'ready') return secondRead
  if (firstRead.status === 'ready') {
    return {
      ...firstRead,
      warnings: uniqueWarnings(firstRead.warnings, secondRead.warnings),
    }
  }
  return secondRead
}

async function createInternalEditStateIdempotencyKey(
  workspaceId: string,
  handoff: LocalInternalProjectHandoff,
): Promise<string> {
  const source = JSON.stringify([
    workspaceId,
    handoff.projectId,
    handoff.editSessionId,
    handoff.updatedAt,
  ])
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `internal-edit-state:${hex}`
}

async function createStorytellingWorkflowMigrationIdempotencyKey(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
): Promise<string> {
  const source = JSON.stringify([
    scope.workspaceId,
    handoff.projectId,
    handoff.editSessionId,
    handoff.updatedAt,
    'motion_studio.storytelling',
  ])
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `storytelling-workflow-migration:${hex}`
}

function isValidStorytellingMigrationProjection(
  scope: ProjectPersistenceScope,
  source: LocalInternalProjectHandoff,
  migrated: LocalInternalProjectHandoff | undefined,
  receipt: StorytellingWorkflowMigrationResponse['migrationReceipt'],
): receipt is NonNullable<StorytellingWorkflowMigrationResponse['migrationReceipt']> {
  if (!migrated || !receipt) return false
  const canonicalPath = motionStudioStorytellingWorkspaceRoute(source.projectId, source.editSessionId)
  return migrated.workspaceId === scope.workspaceId &&
    migrated.projectId === source.projectId &&
    migrated.editSessionId === source.editSessionId &&
    migrated.productWorkflow === 'motion_studio.storytelling' &&
    migrated.editorPath === canonicalPath &&
    receipt.recordVersion === 'internal-edit-state-storytelling-workflow-migration-v1' &&
    receipt.sourceHandoffUpdatedAt === source.updatedAt &&
    receipt.migratedHandoffUpdatedAt === migrated.updatedAt &&
    receipt.productWorkflow === 'motion_studio.storytelling' &&
    receipt.editorPath === canonicalPath &&
    typeof receipt.productionId === 'string' &&
    Boolean(receipt.productionId.trim()) &&
    Number.isSafeInteger(receipt.productionRecordVersion) &&
    receipt.productionRecordVersion > 0 &&
    Number.isFinite(Date.parse(receipt.productionUpdatedAt)) &&
    /^[a-f0-9]{64}$/u.test(receipt.productionAuthorityHash) &&
    /^[a-f0-9]{64}$/u.test(receipt.requestHash) &&
    /^[a-f0-9]{64}$/u.test(receipt.idempotencyKeyHash) &&
    /^[a-f0-9]{64}$/u.test(receipt.receiptDigest) &&
    receipt.providerCalled === false &&
    receipt.generationStarted === false &&
    receipt.customerCommercialAuthorityGranted === false &&
    receipt.productionReady === false
}

function mergeInternalProjectHandoffs(
  firstRead: LocalInternalProjectHandoff[],
  secondRead: LocalInternalProjectHandoff[],
): LocalInternalProjectHandoff[] {
  const byEditSession = new Map<string, LocalInternalProjectHandoff>()
  for (const handoff of [...firstRead, ...secondRead]) {
    const key = internalProjectEditKey(handoff)
    const current = byEditSession.get(key)
    if (!current || handoff.updatedAt.localeCompare(current.updatedAt) >= 0) {
      byEditSession.set(key, handoff)
    }
  }

  return [...byEditSession.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function internalEditStateListHandoffForScope(
  scope: ProjectPersistenceScope,
  value: unknown,
): LocalInternalProjectHandoff | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const state = value as {
    userId?: unknown
    workspaceId?: unknown
    projectId?: unknown
    editSessionId?: unknown
    handoff?: unknown
    updatedAt?: unknown
  }
  if (
    typeof state.userId !== 'string' ||
    !internalEditStateUserMatchesScope(scope, state.userId) ||
    state.workspaceId !== scope.workspaceId ||
    typeof state.projectId !== 'string' ||
    typeof state.editSessionId !== 'string' ||
    typeof state.updatedAt !== 'string' ||
    !isEligibleInternalProjectHandoff(state.handoff, scope.workspaceId, state.projectId, state.editSessionId)
  ) {
    return undefined
  }
  return state.handoff
}

function isEligibleInternalProjectHandoff(
  value: unknown,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
): value is LocalInternalProjectHandoff {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const handoff = value as Partial<LocalInternalProjectHandoff>
  return handoff.id === editSessionId &&
    handoff.workspaceId === workspaceId &&
    handoff.projectId === projectId &&
    handoff.editSessionId === editSessionId &&
    typeof handoff.projectName === 'string' &&
    Boolean(handoff.projectName.trim()) &&
    typeof handoff.editorPath === 'string' &&
    handoff.editorPath.startsWith('/') &&
    isInternalEditCategory(handoff.category) &&
    isInternalProductWorkflow(handoff.productWorkflow) &&
    isInternalEditStage(handoff.stage) &&
    typeof handoff.sourceFileCount === 'number' &&
    Number.isFinite(handoff.sourceFileCount) &&
    handoff.sourceFileCount >= 0 &&
    typeof handoff.createdAt === 'string' &&
    Number.isFinite(Date.parse(handoff.createdAt)) &&
    typeof handoff.updatedAt === 'string' &&
    Number.isFinite(Date.parse(handoff.updatedAt)) &&
    handoff.persistence === 'browser_local_internal_testing'
}

function isInternalProductWorkflow(value: unknown): boolean {
  return value === undefined || value === 'video_edit' || value === 'motion_studio.storytelling'
}

function isInternalEditCategory(value: unknown): value is LocalInternalProjectHandoff['category'] {
  return value === 'storytelling' ||
    value === 'lifestyle' ||
    value === 'business_brand' ||
    value === 'education_explainer' ||
    value === 'documentary_case_study'
}

function isInternalEditStage(value: unknown): value is LocalInternalProjectHandoff['stage'] {
  return value === 'created' ||
    value === 'source_uploaded' ||
    value === 'plan_approved' ||
    value === 'private_review_ready' ||
    value === 'private_review_verified' ||
    value === 'private_review_accepted' ||
    value === 'internal_edit_complete' ||
    value === 'revision_requested' ||
    value === 'revision_preview_ready'
}

function isInvalidBackendResponseCode(value: string | undefined): boolean {
  return value === 'VALIDATION_FAILED' ||
    value === 'invalid_json_response' ||
    value === 'invalid_backend_response'
}

function internalProjectEditKey(handoff: LocalInternalProjectHandoff): string {
  return JSON.stringify([handoff.projectId, handoff.editSessionId])
}

function uniqueWarnings(...groups: string[][]): string[] {
  return [...new Set(groups.flat())]
}
