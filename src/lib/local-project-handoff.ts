import type {
  AspectRatio,
  AspectRatioSource,
  CleanupPreference,
  CreditPreference,
  EditPreferenceFieldKey,
  EditPreferencePersistenceSource,
  EditLevel,
  EditingCategory,
  FrameTemplateType,
  MoodStyle,
  SourceSequenceMode,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from '../types/reeditpro'
import type { SourceMediaMetadata } from '../types/upload'
import type { EditBriefState } from '../types/edit-brief-state'
import type {
  ApprovedEditExecutionAdapterGateActivityGroup,
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from './approved-edit-execution-package-client'
import type { PrivateEditDecisionManifestVerification } from './private-edit-decision-manifest-verification'
import { parseEditBriefStateForHandoff } from './edit-brief/edit-brief-persistence'
import {
  buildProjectPersistenceScopeStorageKey,
  createProjectPersistenceScopeFingerprint,
  isProjectPersistenceScopeActive,
  normalizeProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

export type LocalInternalEditPreferenceValues = {
  editLevel: EditLevel
  workflowType: VideoWorkflowType
  cleanupPreference: CleanupPreference
  visualPreference: VisualPreference
  moodStyle: MoodStyle
  creditPreference: CreditPreference
  targetPlatform: TargetPlatform
}

export type LocalInternalEditPreferenceBaseline = LocalInternalEditPreferenceValues & {
  snapshotId: string
  capturedAt: string
  persistenceSource: EditPreferencePersistenceSource
  provenance: 'saved_edit_preferences' | 'legacy_edit_snapshot'
}

export type LocalInternalEditSetupSnapshot = {
  customInstructions?: string
  userInstructionHistory?: string[]
  sourceSequenceMode?: SourceSequenceMode
  sourceOrderConfirmed?: boolean
  cleanupPreference?: CleanupPreference
  cleanupPreferenceConfirmed?: boolean
  aspectRatio?: AspectRatio
  aspectRatioConfirmed?: boolean
  aspectRatioSource?: AspectRatioSource
  editLevel?: EditLevel
  editLevelConfirmed?: boolean
  visualPreference?: VisualPreference
  visualPreferenceConfirmed?: boolean
  targetPlatform?: TargetPlatform
  frameTemplateType?: FrameTemplateType
  workflowType?: VideoWorkflowType
  moodStyle?: MoodStyle
  creditPreference?: CreditPreference
  preferenceDefaultsApplied?: boolean
  preferenceSnapshotId?: string
  preferenceSnapshotAppliedAt?: string
  preferencePersistenceSource?: EditPreferencePersistenceSource
  preferenceBaseline?: LocalInternalEditPreferenceBaseline
  preferenceOverrideKeys?: EditPreferenceFieldKey[]
  preferenceRevision?: number
  preferenceUpdatedAt?: string
  referenceAttached?: boolean
  referenceUrl?: string
  referenceSkipped?: boolean
  referenceFocusSelections?: string[]
}

export type LocalPrivateInternalQaSummary = {
  privateInternalQaReady: boolean
  editDecisionManifestReady: boolean
  editDecisionManifestArtifactReady: boolean
  audioPolishApplied: boolean
  visualPolishApplied: boolean
  sourceAudioQaAttached?: boolean
  sourceAudioQaSource?: 'private_uploaded_audio_execution' | 'none'
  sourceAudioQaReviewCount?: number
  sourceAudioQaGateCount?: number
  sourceAudioQaBlockingGateCount?: number
  sourceAudioQaWarningGateCount?: number
  sourceAudioQaBlocksPreview?: boolean
  sourceAudioQaBlocksFinalExport?: boolean
  sourceAudioQaFinalMuxAllowed?: false
  sourceAudioQaProductRuntimeExecuted?: false
  sourceAudioQaPublicArtifact?: false
  sourceAudioQaSignedUrl?: null
  approvedReviewOverlayCount: number
  approvedCaptionOverlayCount: number
  approvedTransitionPolishCount: number
  approvedVisualPolishCount: number
  approvedFinalTimingCount: number
  approvedFinalTimelineDurationSeconds?: number
  privateCaptionArtifactCount?: number
  privateCaptionFormats?: string[]
  visualPolishToolId?: string
}

export type LocalPrivateInternalReviewVideoMetadata = {
  playable: boolean
  durationSeconds: number
  width: number
  height: number
  verifiedAt: string
}

export type LocalPrivateInternalReviewVideoExpectation = {
  durationSeconds: number
  width: number
  height: number
}

export type LocalSourceSetFingerprint = string

export type LocalProductWorkflow = 'video_edit' | 'motion_studio.storytelling'

export type LocalInternalProjectHandoff = {
  id: string
  workspaceId: string
  projectId: string
  editSessionId: string
  projectName: string
  editName?: string
  category: EditingCategory
  productWorkflow?: LocalProductWorkflow
  editorPath: string
  stage:
    | 'created'
    | 'source_uploaded'
    | 'plan_approved'
    | 'private_review_ready'
    | 'private_review_verified'
    | 'private_review_accepted'
    | 'internal_edit_complete'
    | 'revision_requested'
    | 'revision_preview_ready'
  sourceFileCount: number
  setup?: LocalInternalEditSetupSnapshot
  editBriefState?: EditBriefState
  sourceMediaAssets?: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  sourceSetFingerprint?: LocalSourceSetFingerprint
  approvedSnapshotId?: string
  approvedCreditReservationId?: string
  revisionPlanContext?: {
    request: string
    sourceSetFingerprint?: LocalSourceSetFingerprint
    previousStage?: LocalInternalProjectHandoff['stage']
    previousReviewDecision?: 'accepted_for_internal_testing' | 'changes_requested'
    previousReviewVerified: boolean
    previousReviewNote?: string
    previousReviewArtifactId?: string
    previousApprovedSnapshotId?: string
    previousCreditReservationId?: string
    contextOnly: true
    freshPlanRequired: true
    freshPrivateReviewRequired: true
    updatedAt: string
  }
  privateReview?: {
    byteSize?: number
    manifestVerified: boolean
    sourceSetFingerprint?: LocalSourceSetFingerprint
    reviewDecision?: 'accepted_for_internal_testing' | 'changes_requested'
    renderPreviewAssemblyId?: string
    creditReservationId?: string
    privateInternalDownloadPath?: string
    privateInternalManifestPath?: string
    privateInternalDownloadDeliveryId?: string
    finalDeliveryQaReviewId?: string
    finalRenderExecutionId?: string
    finalRenderReadinessReviewId?: string
    finalRenderArtifactId?: string
    finalRenderSha256?: string
    expectedReviewVideoMetadata?: LocalPrivateInternalReviewVideoExpectation
    editDecisionManifestVerification?: PrivateEditDecisionManifestVerification
    reviewVideoMetadata?: LocalPrivateInternalReviewVideoMetadata
    professionalEditQaSummary?: LocalPrivateInternalQaSummary
    adapterGateSummary?: {
      status: string
      executionMode: string
      requestedActivityCount: number
      resolvedActivityCount: number
      readyActivityCount: number
      blockedActivityCount: number
      editActivityCount: number
      readinessCheckCount: number
      toolsExecutedCount: number
      fullToolExecutionReady: false
      privateFallbackReviewOnly: true
      privateRenderIntegrationStatus?: string
      privateRenderIntegrationReady?: boolean
      privateRenderIntegratedActivityCount?: number
      backendIntegrationCandidateCount?: number
      backendIntegrationPendingActivityCount?: number
      backendIntegrationBlockedActivityCount?: number
      backendIntegrationBlockers?: string[]
      clientReadinessHintsTrusted: false
      serverSourceTruthRequiredForFullExecution: true
      frontendExecutionAllowed: false
      productReady: false
      userFacingSummary: string
      userFacingReadinessSummary?: string
      activityGroups?: ApprovedEditExecutionAdapterGateActivityGroup[]
    }
    serverReviewId?: string
    serverReviewStatus?: string
    serverNextRequiredGate?: string
    reviewNote?: string
    revisionOperationId?: string
    revisionRequestId?: string
    revisionPreviewId?: string
    revisionPreviewVersion?: number
    revisionJobId?: string
    nextRequiredGate?: string
    updatedAt: string
  }
  createdAt: string
  updatedAt: string
  persistence: 'browser_local_internal_testing'
}

const LEGACY_MOTION_STORYTELLING_EDIT_PREFIX = 'storytelling-edit-'

/**
 * Editing category describes the content. Product workflow describes the
 * workspace that owns the edit. A normal video edit may legitimately use the
 * Storytelling editing category, so category must never select Motion Studio.
 */
export function resolveLocalProductWorkflow(
  handoff: Pick<LocalInternalProjectHandoff, 'editSessionId' | 'productWorkflow'>,
): LocalProductWorkflow {
  if (handoff.productWorkflow === 'motion_studio.storytelling') return 'motion_studio.storytelling'
  if (handoff.productWorkflow === 'video_edit') return 'video_edit'

  // Motion Studio V1 created this exact, namespaced identity before the
  // explicit workflow discriminator existed. Keep those retained records out
  // of normal Edit Videos without conflating every Storytelling category edit.
  return handoff.editSessionId.startsWith(LEGACY_MOTION_STORYTELLING_EDIT_PREFIX)
    ? 'motion_studio.storytelling'
    : 'video_edit'
}

export function isNormalVideoEditHandoff(
  handoff: Pick<LocalInternalProjectHandoff, 'editSessionId' | 'productWorkflow'>,
): boolean {
  return resolveLocalProductWorkflow(handoff) === 'video_edit'
}

export type InternalEditPersistenceStatusValue =
  | 'saving'
  | 'saved_local'
  | 'saved_backend'
  | 'needs_retry'

export type InternalEditPersistenceStatus = {
  status: InternalEditPersistenceStatusValue
  storage: 'browser_local' | 'private_backend'
  projectId: string
  editSessionId: string
  handoffUpdatedAt?: string
  attemptCount: number
  retryable: boolean
  message: string
  errorMessage?: string
}

type InternalEditPersistenceListener = (status: InternalEditPersistenceStatus) => void

type InternalEditBackendPersistenceResult = {
  ok: boolean
  persisted: boolean
  errorMessage?: string
}

type InternalEditBackendSyncState = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  pending?: LocalInternalProjectHandoff
  retryHandoff?: LocalInternalProjectHandoff
  inFlight?: LocalInternalProjectHandoff
  drain?: Promise<void>
  listeners: Set<InternalEditPersistenceListener>
  status: InternalEditPersistenceStatus
}

type ScopedLocalProjectHandoffEnvelope = {
  recordVersion: 2
  scope: {
    authMode: ProjectPersistenceScope['authMode']
    userId: string
    workspaceId: string
  }
  scopeFingerprint: string
  handoffs: LocalInternalProjectHandoff[]
  savedAt: string
}

export const LEGACY_UNSCOPED_LOCAL_PROJECT_HANDOFF_STORAGE_KEY = 'reeditpro.localProjectHandoffs.v1'
const SCOPED_STORAGE_PREFIX = 'reeditpro.localProjectHandoffs.v2'
const backendSyncStateByEdit = new Map<string, InternalEditBackendSyncState>()

export function createLocalInternalProjectHandoff(input: {
  editName?: string
  projectName: string
  category: EditingCategory
  workspaceId: string
  projectId?: string
  editSessionId?: string
  productWorkflow?: LocalProductWorkflow
  setup?: LocalInternalEditSetupSnapshot
  now?: Date
}): LocalInternalProjectHandoff {
  const now = input.now ?? new Date()
  const projectName = normalizeProjectName(input.projectName)
  const editName = normalizeEditName(input.editName ?? projectName)
  const projectSlug = createLocalProjectSlug(projectName)
  const projectId = normalizeProjectId(input.projectId) ?? `local-${input.category}-${projectSlug}`
  const editSessionId = normalizeProjectId(input.editSessionId) ?? `${projectId}-${createLocalProjectSlug(editName)}-${now.getTime()}`
  const productWorkflow = resolveLocalProductWorkflow({
    editSessionId,
    productWorkflow: input.productWorkflow,
  })

  return {
    id: editSessionId,
    workspaceId: normalizeWorkspaceId(input.workspaceId),
    projectId,
    editSessionId,
    projectName,
    editName,
    category: input.category,
    productWorkflow,
    editorPath: createProductWorkflowPath({
      category: input.category,
      editName,
      editSessionId,
      productWorkflow,
      projectId,
      projectName,
    }),
    stage: 'created',
    sourceFileCount: 0,
    setup: input.setup,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    persistence: 'browser_local_internal_testing',
  }
}

export function saveLocalInternalProjectHandoff(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
  options: { syncBackend?: boolean } = {},
): LocalInternalProjectHandoff {
  const normalizedScope = requireScope(scope)
  const existing = listLocalInternalProjectHandoffs(normalizedScope)
  let normalizedHandoff = normalizeHandoffForPersistence(handoff, normalizedScope.workspaceId)
  if (!isProjectPersistenceScopeActive(normalizedScope)) return normalizedHandoff
  const existingEdit = existing.find((item) => item.editSessionId === normalizedHandoff.editSessionId)
  if (
    existingEdit &&
    normalizedHandoff.updatedAt <= existingEdit.updatedAt &&
    JSON.stringify(normalizedHandoff) !== JSON.stringify(existingEdit)
  ) {
    normalizedHandoff = {
      ...normalizedHandoff,
      updatedAt: nextIsoTimestamp(existingEdit.updatedAt),
    }
  }
  const next = [
    normalizedHandoff,
    ...existing.filter((item) => item.editSessionId !== normalizedHandoff.editSessionId),
  ].slice(0, 12)
  writeHandoffs(normalizedScope, next)
  if (options.syncBackend !== false) {
    queueInternalEditStateBackendSync(normalizedScope, normalizedHandoff)
  }
  return normalizedHandoff
}

export function listLocalInternalProjectHandoffs(
  scope: ProjectPersistenceScope,
): LocalInternalProjectHandoff[] {
  const normalizedScope = normalizeProjectPersistenceScope(scope)
  if (!normalizedScope || !isProjectPersistenceScopeActive(normalizedScope) || !canUseLocalStorage()) return []

  try {
    const raw = window.localStorage.getItem(buildLocalProjectHandoffStorageKey(normalizedScope))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!isMatchingScopedHandoffEnvelope(parsed, normalizedScope)) return []

    return parsed.handoffs
      .map((handoff) => parseHandoff(handoff, normalizedScope.workspaceId))
      .filter((item): item is LocalInternalProjectHandoff => Boolean(item))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } catch {
    return []
  }
}

export function getLocalInternalProjectHandoff(
  scope: ProjectPersistenceScope,
  projectId: string,
): LocalInternalProjectHandoff | undefined {
  return listLocalInternalProjectHandoffs(scope).find((handoff) => handoff.projectId === projectId)
}

export function getLocalInternalEditHandoff(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): LocalInternalProjectHandoff | undefined {
  return listLocalInternalProjectHandoffs(scope).find((handoff) =>
    handoff.projectId === projectId && handoff.editSessionId === editSessionId,
  )
}

export function getInternalEditPersistenceStatus(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): InternalEditPersistenceStatus {
  const normalizedScope = requireScope(scope)
  return getOrCreateInternalEditBackendSyncState(
    normalizedScope,
    projectId,
    editSessionId,
  ).status
}

export function subscribeInternalEditPersistenceStatus(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
  listener: InternalEditPersistenceListener,
): () => void {
  const normalizedScope = requireScope(scope)
  const state = getOrCreateInternalEditBackendSyncState(
    normalizedScope,
    projectId,
    editSessionId,
  )
  state.listeners.add(listener)
  listener(state.status)

  return () => {
    state.listeners.delete(listener)
  }
}

/**
 * Replays exactly the latest failed handoff for one scoped edit.
 *
 * Each invocation schedules one backend attempt. Failures remain visible as
 * `needs_retry`; the queue never loops or silently discards the retained write.
 */
export function retryInternalEditPersistence(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): boolean {
  const normalizedScope = requireScope(scope)
  const key = internalEditPersistenceKey(normalizedScope, projectId, editSessionId)
  const state = backendSyncStateByEdit.get(key)
  if (!state || state.status.status !== 'needs_retry') return false

  const currentLocal = getLocalInternalEditHandoff(normalizedScope, projectId, editSessionId)
  const candidate = latestInternalEditHandoff(state.retryHandoff, currentLocal)
  if (!candidate) return false

  state.retryHandoff = undefined
  state.pending = candidate
  setInternalEditPersistenceStatus(state, createSavingPersistenceStatus(state, candidate))
  startInternalEditStateBackendSyncDrain(key, state)
  return true
}

/**
 * Keeps the shared persistence indicator accurate for exact writes that must
 * await the backend (for example a private-review decision) instead of using
 * the normal coalescing queue.
 */
export function recordInternalEditPersistenceResult(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
  result: InternalEditBackendPersistenceResult,
): void {
  const normalizedScope = requireScope(scope)
  const state = getOrCreateInternalEditBackendSyncState(
    normalizedScope,
    handoff.projectId,
    handoff.editSessionId,
  )
  const currentLocal = getLocalInternalEditHandoff(
    normalizedScope,
    handoff.projectId,
    handoff.editSessionId,
  )
  const latestTracked = latestInternalEditHandoff(
    state.pending,
    state.retryHandoff,
    state.inFlight,
    currentLocal,
  )

  // An older exact write can finish after a newer local change. It must never
  // claim that the newer state is recoverable.
  if (latestTracked && latestTracked.updatedAt > handoff.updatedAt) return

  if (result.ok && result.persisted) {
    state.pending = undefined
    state.retryHandoff = undefined
    setInternalEditPersistenceStatus(state, createSavedBackendPersistenceStatus(state, handoff))
    return
  }

  if (result.ok) {
    state.pending = undefined
    state.retryHandoff = undefined
    setInternalEditPersistenceStatus(state, createSavedLocalPersistenceStatus(
      handoff.projectId,
      handoff.editSessionId,
      handoff.updatedAt,
      state.status.attemptCount,
    ))
    return
  }

  state.pending = undefined
  state.retryHandoff = latestInternalEditHandoff(handoff, currentLocal)
  setInternalEditPersistenceStatus(
    state,
    createNeedsRetryPersistenceStatus(
      state,
      state.retryHandoff ?? handoff,
      result.errorMessage,
    ),
  )
}

export function listLocalInternalProjectEditHandoffs(
  scope: ProjectPersistenceScope,
  projectId: string,
): LocalInternalProjectHandoff[] {
  return listLocalInternalProjectHandoffs(scope).filter((handoff) => handoff.projectId === projectId)
}

export function updateLocalInternalProjectHandoff(
  scope: ProjectPersistenceScope,
  projectId: string,
  patch: Partial<Omit<LocalInternalProjectHandoff, 'id' | 'projectId' | 'createdAt' | 'persistence'>>,
  options: { syncBackend?: boolean } = {},
): LocalInternalProjectHandoff | undefined {
  const nextHandoff = createUpdatedLocalInternalProjectHandoff(scope, projectId, patch)
  if (!nextHandoff) return undefined
  return saveLocalInternalProjectHandoff(scope, nextHandoff, options)
}

export function updateLocalInternalEditHandoff(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
  patch: Partial<Omit<LocalInternalProjectHandoff, 'id' | 'projectId' | 'editSessionId' | 'createdAt' | 'persistence'>>,
  options: { syncBackend?: boolean } = {},
): LocalInternalProjectHandoff | undefined {
  const existing = getLocalInternalEditHandoff(scope, projectId, editSessionId)
  if (!existing) return undefined
  return saveLocalInternalProjectHandoff(scope, createUpdatedHandoffFromExisting(existing, patch), options)
}

export function createUpdatedLocalInternalProjectHandoff(
  scope: ProjectPersistenceScope,
  projectId: string,
  patch: Partial<Omit<LocalInternalProjectHandoff, 'id' | 'projectId' | 'createdAt' | 'persistence'>>,
): LocalInternalProjectHandoff | undefined {
  const existing = getLocalInternalProjectHandoff(scope, projectId)
  if (!existing) return undefined
  return createUpdatedHandoffFromExisting(existing, patch)
}

function createUpdatedHandoffFromExisting(
  existing: LocalInternalProjectHandoff,
  patch: Partial<Omit<LocalInternalProjectHandoff, 'id' | 'projectId' | 'createdAt' | 'persistence'>>,
): LocalInternalProjectHandoff {
  const clearsApprovedSnapshot = patch.stage === 'source_uploaded'
  const nextSourceMediaAssets = normalizeDurableSourceMediaAssets(patch.sourceMediaAssets ?? existing.sourceMediaAssets)
  const nextSourceSetFingerprint = createLocalSourceSetFingerprint(nextSourceMediaAssets)
  const replacesPrivateReview = patch.stage === 'plan_approved' || patch.stage === 'private_review_ready'
  const clearsRevisionPlanContext = patch.stage === 'plan_approved' || patch.stage === 'private_review_ready'
  const privateReviewBase = replacesPrivateReview ? undefined : existing.privateReview
  const nextPrivateReview = patch.privateReview
    ? {
        ...privateReviewBase,
        ...patch.privateReview,
        sourceSetFingerprint: patch.privateReview.sourceSetFingerprint ??
          privateReviewBase?.sourceSetFingerprint ??
          nextSourceSetFingerprint,
      }
    : patch.stage === 'source_uploaded' || patch.stage === 'plan_approved'
      ? undefined
      : existing.privateReview

  return normalizeHandoffForPersistence({
    ...existing,
    ...patch,
    sourceMediaAssets: nextSourceMediaAssets,
    sourceSetFingerprint: nextSourceSetFingerprint,
    approvedSnapshotId: clearsApprovedSnapshot
      ? undefined
      : patch.approvedSnapshotId ?? existing.approvedSnapshotId,
    approvedCreditReservationId: clearsApprovedSnapshot
      ? undefined
      : patch.approvedCreditReservationId ?? existing.approvedCreditReservationId,
    revisionPlanContext: patch.revisionPlanContext ??
      (clearsRevisionPlanContext ? undefined : existing.revisionPlanContext),
    privateReview: nextPrivateReview,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  })
}

export function buildLocalProjectHandoffStorageKey(scope: ProjectPersistenceScope) {
  return buildProjectPersistenceScopeStorageKey(SCOPED_STORAGE_PREFIX, requireScope(scope))
}

export function getLocalProjectHandoffStorageKey(scope: ProjectPersistenceScope) {
  return buildLocalProjectHandoffStorageKey(scope)
}

function parseHandoff(value: unknown, expectedWorkspaceId: string): LocalInternalProjectHandoff | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<LocalInternalProjectHandoff>
  const sourceMediaAssets = parseSourceMediaAssets(record.sourceMediaAssets)
  const sourceSetFingerprint = isLocalSourceSetFingerprint(record.sourceSetFingerprint)
    ? record.sourceSetFingerprint
    : createLocalSourceSetFingerprint(sourceMediaAssets)
  const parsedPrivateReview = parsePrivateReview(record.privateReview)
  const privateReview = normalizePrivateReviewForSourceTruth(parsedPrivateReview?.sourceSetFingerprint === sourceSetFingerprint
    ? parsedPrivateReview
    : undefined)
  const parsedRevisionPlanContext = parseRevisionPlanContext(record.revisionPlanContext)
  const revisionPlanContext = parsedRevisionPlanContext?.sourceSetFingerprint === sourceSetFingerprint
    ? parsedRevisionPlanContext
    : undefined
  const parsedStage = isLocalProjectStage(record.stage) ? record.stage : 'created'
  const approvedSnapshotId = sourceSetFingerprint && typeof record.approvedSnapshotId === 'string'
    ? record.approvedSnapshotId
    : undefined
  const approvedCreditReservationId = sourceSetFingerprint && typeof record.approvedCreditReservationId === 'string'
    ? record.approvedCreditReservationId
    : undefined
  const stage = normalizeStageForSourceTruth(parsedStage, {
    hasApprovedSnapshot: Boolean(approvedSnapshotId),
    hasSourceSet: Boolean(sourceSetFingerprint && sourceMediaAssets?.length),
    hasVerifiedPrivateReview: hasVerifiedPrivateReviewEvidence(privateReview),
    hasAcceptedPrivateReview: hasAcceptedPrivateReviewEvidence(privateReview),
    hasRevisionPrivateReview: hasRevisionPrivateReviewEvidence(privateReview),
    hasPrivateInternalCompletion: hasPrivateInternalCompletionEvidence(privateReview),
  })

  if (
    record.workspaceId !== expectedWorkspaceId ||
    typeof record.projectId !== 'string' ||
    typeof record.editSessionId !== 'string' ||
    typeof record.projectName !== 'string' ||
    typeof record.category !== 'string' ||
    typeof record.editorPath !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    return null
  }

  const editName = typeof record.editName === 'string'
    ? normalizeEditName(record.editName)
    : normalizeEditName(record.projectName)
  const productWorkflow = resolveLocalProductWorkflow({
    editSessionId: record.editSessionId,
    productWorkflow: record.productWorkflow,
  })

  return {
    id: record.editSessionId,
    workspaceId: expectedWorkspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    projectName: normalizeProjectName(record.projectName),
    editName,
    category: record.category as EditingCategory,
    productWorkflow,
    editorPath: createProductWorkflowPath({
      category: record.category as EditingCategory,
      editName,
      editSessionId: record.editSessionId,
      productWorkflow,
      projectId: record.projectId,
      projectName: normalizeProjectName(record.projectName),
    }),
    stage,
    sourceFileCount: sourceMediaAssets?.length ?? (typeof record.sourceFileCount === 'number' && Number.isFinite(record.sourceFileCount)
      ? Math.max(0, Math.floor(record.sourceFileCount))
      : 0),
    setup: parseEditSetup(record.setup),
    editBriefState: parseEditBriefStateForHandoff(record.editBriefState, record.projectId, expectedWorkspaceId),
    sourceMediaAssets,
    sourceSetFingerprint,
    approvedSnapshotId,
    approvedCreditReservationId,
    revisionPlanContext,
    privateReview,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    persistence: 'browser_local_internal_testing',
  }
}

function normalizeHandoffForPersistence(
  handoff: LocalInternalProjectHandoff,
  expectedWorkspaceId = handoff.workspaceId,
): LocalInternalProjectHandoff {
  if (handoff.workspaceId !== expectedWorkspaceId) {
    throw new Error('Local project handoff does not belong to the active workspace.')
  }
  const sourceMediaAssets = normalizeDurableSourceMediaAssets(handoff.sourceMediaAssets)
  const sourceSetFingerprint = createLocalSourceSetFingerprint(sourceMediaAssets)
  const privateReview = normalizePrivateReviewForSourceTruth(sourceSetFingerprint && handoff.privateReview?.sourceSetFingerprint === sourceSetFingerprint
    ? handoff.privateReview
    : undefined)
  const revisionPlanContext = sourceSetFingerprint && handoff.revisionPlanContext?.sourceSetFingerprint === sourceSetFingerprint
    ? handoff.revisionPlanContext
    : undefined
  const approvedSnapshotId = sourceSetFingerprint ? handoff.approvedSnapshotId : undefined
  const approvedCreditReservationId = sourceSetFingerprint ? handoff.approvedCreditReservationId : undefined
  const stage = normalizeStageForSourceTruth(handoff.stage, {
    hasApprovedSnapshot: Boolean(approvedSnapshotId),
    hasSourceSet: Boolean(sourceSetFingerprint && sourceMediaAssets?.length),
    hasVerifiedPrivateReview: hasVerifiedPrivateReviewEvidence(privateReview),
    hasAcceptedPrivateReview: hasAcceptedPrivateReviewEvidence(privateReview),
    hasRevisionPrivateReview: hasRevisionPrivateReviewEvidence(privateReview),
    hasPrivateInternalCompletion: hasPrivateInternalCompletionEvidence(privateReview),
  })
  const editName = normalizeEditName(handoff.editName ?? handoff.projectName)
  const productWorkflow = resolveLocalProductWorkflow(handoff)

  return {
    ...handoff,
    workspaceId: expectedWorkspaceId,
    id: handoff.editSessionId,
    editName,
    productWorkflow,
    editorPath: createProductWorkflowPath({
      category: handoff.category,
      editName,
      editSessionId: handoff.editSessionId,
      productWorkflow,
      projectId: handoff.projectId,
      projectName: normalizeProjectName(handoff.projectName),
    }),
    stage,
    sourceFileCount: sourceMediaAssets?.length ?? 0,
    editBriefState: parseEditBriefStateForHandoff(
      handoff.editBriefState,
      handoff.projectId,
      expectedWorkspaceId,
    ),
    sourceMediaAssets,
    sourceSetFingerprint,
    approvedSnapshotId,
    approvedCreditReservationId,
    revisionPlanContext,
    privateReview,
  }
}

function parseRevisionPlanContext(value: unknown): LocalInternalProjectHandoff['revisionPlanContext'] {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<NonNullable<LocalInternalProjectHandoff['revisionPlanContext']>>
  if (
    typeof record.request !== 'string' ||
    typeof record.updatedAt !== 'string' ||
    record.contextOnly !== true ||
    record.freshPlanRequired !== true ||
    record.freshPrivateReviewRequired !== true
  ) {
    return undefined
  }

  return {
    request: record.request.trim().slice(0, 500),
    sourceSetFingerprint: isLocalSourceSetFingerprint(record.sourceSetFingerprint) ? record.sourceSetFingerprint : undefined,
    previousStage: isLocalProjectStage(record.previousStage) ? record.previousStage : undefined,
    previousReviewDecision: record.previousReviewDecision === 'accepted_for_internal_testing' || record.previousReviewDecision === 'changes_requested'
      ? record.previousReviewDecision
      : undefined,
    previousReviewVerified: record.previousReviewVerified === true,
    previousReviewNote: typeof record.previousReviewNote === 'string' ? record.previousReviewNote.trim().slice(0, 500) : undefined,
    previousReviewArtifactId: typeof record.previousReviewArtifactId === 'string' ? record.previousReviewArtifactId : undefined,
    previousApprovedSnapshotId: typeof record.previousApprovedSnapshotId === 'string'
      ? record.previousApprovedSnapshotId.trim().slice(0, 180)
      : undefined,
    previousCreditReservationId: typeof record.previousCreditReservationId === 'string'
      ? record.previousCreditReservationId.trim().slice(0, 180)
      : undefined,
    contextOnly: true,
    freshPlanRequired: true,
    freshPrivateReviewRequired: true,
    updatedAt: record.updatedAt,
  }
}

function normalizeStageForSourceTruth(
  stage: LocalInternalProjectHandoff['stage'],
  evidence: {
    hasApprovedSnapshot: boolean
    hasSourceSet: boolean
    hasVerifiedPrivateReview: boolean
    hasAcceptedPrivateReview: boolean
    hasRevisionPrivateReview: boolean
    hasPrivateInternalCompletion: boolean
  },
): LocalInternalProjectHandoff['stage'] {
  if (!evidence.hasSourceSet) return 'created'
  if (
    !evidence.hasApprovedSnapshot &&
    (
      stage === 'plan_approved' ||
      stage === 'private_review_ready' ||
      stage === 'private_review_verified' ||
      stage === 'private_review_accepted' ||
      stage === 'internal_edit_complete' ||
      stage === 'revision_requested' ||
      stage === 'revision_preview_ready'
    )
  ) {
    return 'source_uploaded'
  }

  const downgradeToVerifiedOrPlanApproved = () =>
    evidence.hasVerifiedPrivateReview ? 'private_review_verified' : 'plan_approved'

  if (
    stage === 'private_review_verified' &&
    !evidence.hasVerifiedPrivateReview
  ) {
    return 'plan_approved'
  }

  if (stage === 'private_review_accepted' && !evidence.hasAcceptedPrivateReview) {
    return downgradeToVerifiedOrPlanApproved()
  }

  if (stage === 'internal_edit_complete' && !evidence.hasPrivateInternalCompletion) {
    return evidence.hasAcceptedPrivateReview ? 'private_review_accepted' : downgradeToVerifiedOrPlanApproved()
  }

  if (
    (stage === 'revision_requested' || stage === 'revision_preview_ready') &&
    !evidence.hasRevisionPrivateReview
  ) {
    return evidence.hasAcceptedPrivateReview ? 'private_review_accepted' : downgradeToVerifiedOrPlanApproved()
  }

  return stage
}

function normalizePrivateReviewForSourceTruth(
  privateReview: LocalInternalProjectHandoff['privateReview'] | undefined,
): LocalInternalProjectHandoff['privateReview'] | undefined {
  if (!privateReview) return undefined
  const hasManifestDetails = hasPrivateReviewManifestDetails(privateReview)
  const manifestVerified = privateReview.manifestVerified === true && hasManifestDetails
  const hasPlayableVideo = manifestVerified && privateReview.reviewVideoMetadata?.playable === true

  return {
    ...privateReview,
    manifestVerified,
    editDecisionManifestVerification: hasManifestDetails
      ? privateReview.editDecisionManifestVerification
      : undefined,
    reviewVideoMetadata: hasPlayableVideo ? privateReview.reviewVideoMetadata : undefined,
    reviewDecision: hasPlayableVideo ? privateReview.reviewDecision : undefined,
    serverReviewId: hasPlayableVideo ? privateReview.serverReviewId : undefined,
    serverReviewStatus: hasPlayableVideo ? privateReview.serverReviewStatus : undefined,
    serverNextRequiredGate: hasPlayableVideo ? privateReview.serverNextRequiredGate : undefined,
    revisionOperationId: hasPlayableVideo ? privateReview.revisionOperationId : undefined,
    revisionRequestId: hasPlayableVideo ? privateReview.revisionRequestId : undefined,
    revisionPreviewId: hasPlayableVideo ? privateReview.revisionPreviewId : undefined,
    revisionPreviewVersion: hasPlayableVideo ? privateReview.revisionPreviewVersion : undefined,
    revisionJobId: hasPlayableVideo ? privateReview.revisionJobId : undefined,
  }
}

function hasPrivateReviewManifestDetails(
  privateReview: LocalInternalProjectHandoff['privateReview'] | undefined,
): privateReview is NonNullable<LocalInternalProjectHandoff['privateReview']> {
  return Boolean(
    privateReview?.editDecisionManifestVerification &&
    privateReview.privateInternalDownloadPath &&
    privateReview.privateInternalManifestPath &&
    privateReview.finalRenderArtifactId &&
    privateReview.sourceSetFingerprint,
  )
}

function hasVerifiedPrivateReviewEvidence(
  privateReview: LocalInternalProjectHandoff['privateReview'] | undefined,
): boolean {
  return privateReview?.manifestVerified === true && hasPrivateReviewManifestDetails(privateReview)
}

function hasPlayablePrivateReviewEvidence(
  privateReview: LocalInternalProjectHandoff['privateReview'] | undefined,
): boolean {
  return hasVerifiedPrivateReviewEvidence(privateReview) &&
    privateReview?.reviewVideoMetadata?.playable === true
}

function hasAcceptedPrivateReviewEvidence(
  privateReview: LocalInternalProjectHandoff['privateReview'] | undefined,
): boolean {
  return hasPlayablePrivateReviewEvidence(privateReview) &&
    privateReview?.reviewDecision === 'accepted_for_internal_testing'
}

function hasRevisionPrivateReviewEvidence(
  privateReview: LocalInternalProjectHandoff['privateReview'] | undefined,
): boolean {
  return hasPlayablePrivateReviewEvidence(privateReview) &&
    privateReview?.reviewDecision === 'changes_requested'
}

function hasPrivateInternalCompletionEvidence(
  privateReview: LocalInternalProjectHandoff['privateReview'] | undefined,
): boolean {
  return hasAcceptedPrivateReviewEvidence(privateReview) &&
    privateReview?.professionalEditQaSummary?.privateInternalQaReady === true &&
    privateReview.professionalEditQaSummary.editDecisionManifestReady === true &&
    privateReview.professionalEditQaSummary.editDecisionManifestArtifactReady === true
}

function parseEditSetup(value: unknown): LocalInternalEditSetupSnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<LocalInternalEditSetupSnapshot>
  const setup: LocalInternalEditSetupSnapshot = {}

  if (typeof record.customInstructions === 'string') setup.customInstructions = record.customInstructions.trim().slice(0, 4000)
  if (Array.isArray(record.userInstructionHistory)) {
    setup.userInstructionHistory = record.userInstructionHistory
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().replace(/\s+/g, ' ').slice(0, 4000))
      .filter(Boolean)
      .slice(-64)
  }
  if (isSourceSequenceMode(record.sourceSequenceMode)) setup.sourceSequenceMode = record.sourceSequenceMode
  if (typeof record.sourceOrderConfirmed === 'boolean') setup.sourceOrderConfirmed = record.sourceOrderConfirmed
  if (isCleanupPreference(record.cleanupPreference)) setup.cleanupPreference = record.cleanupPreference
  if (typeof record.cleanupPreferenceConfirmed === 'boolean') setup.cleanupPreferenceConfirmed = record.cleanupPreferenceConfirmed
  if (isAspectRatio(record.aspectRatio)) setup.aspectRatio = record.aspectRatio
  if (typeof record.aspectRatioConfirmed === 'boolean') setup.aspectRatioConfirmed = record.aspectRatioConfirmed
  if (isAspectRatioSource(record.aspectRatioSource)) setup.aspectRatioSource = record.aspectRatioSource
  if (isEditLevel(record.editLevel)) setup.editLevel = record.editLevel
  if (typeof record.editLevelConfirmed === 'boolean') setup.editLevelConfirmed = record.editLevelConfirmed
  if (isVisualPreference(record.visualPreference)) setup.visualPreference = record.visualPreference
  if (typeof record.visualPreferenceConfirmed === 'boolean') setup.visualPreferenceConfirmed = record.visualPreferenceConfirmed
  if (isTargetPlatform(record.targetPlatform)) setup.targetPlatform = record.targetPlatform
  if (isFrameTemplateType(record.frameTemplateType)) setup.frameTemplateType = record.frameTemplateType
  if (isVideoWorkflowType(record.workflowType)) setup.workflowType = record.workflowType
  if (isMoodStyle(record.moodStyle)) setup.moodStyle = record.moodStyle
  if (isCreditPreference(record.creditPreference)) setup.creditPreference = record.creditPreference
  if (typeof record.preferenceDefaultsApplied === 'boolean') setup.preferenceDefaultsApplied = record.preferenceDefaultsApplied
  if (typeof record.preferenceSnapshotId === 'string') setup.preferenceSnapshotId = record.preferenceSnapshotId.trim().slice(0, 120)
  if (typeof record.preferenceSnapshotAppliedAt === 'string') setup.preferenceSnapshotAppliedAt = record.preferenceSnapshotAppliedAt.trim().slice(0, 80)
  if (isEditPreferencePersistenceSource(record.preferencePersistenceSource)) {
    setup.preferencePersistenceSource = record.preferencePersistenceSource
  }
  const preferenceBaseline = parseEditPreferenceBaseline(record.preferenceBaseline)
  if (preferenceBaseline) setup.preferenceBaseline = preferenceBaseline
  if (Array.isArray(record.preferenceOverrideKeys)) {
    setup.preferenceOverrideKeys = Array.from(new Set(
      record.preferenceOverrideKeys.filter(isEditPreferenceFieldKey),
    ))
  }
  if (typeof record.preferenceRevision === 'number' && Number.isFinite(record.preferenceRevision)) {
    setup.preferenceRevision = Math.max(0, Math.floor(record.preferenceRevision))
  }
  if (typeof record.preferenceUpdatedAt === 'string') {
    setup.preferenceUpdatedAt = record.preferenceUpdatedAt.trim().slice(0, 80)
  }
  if (typeof record.referenceAttached === 'boolean') setup.referenceAttached = record.referenceAttached
  if (typeof record.referenceUrl === 'string') setup.referenceUrl = record.referenceUrl.trim().slice(0, 1000)
  if (typeof record.referenceSkipped === 'boolean') setup.referenceSkipped = record.referenceSkipped
  if (Array.isArray(record.referenceFocusSelections)) {
    const referenceFocusSelections = Array.from(new Set(
      record.referenceFocusSelections
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 8),
    ))
    setup.referenceFocusSelections = referenceFocusSelections
  }

  return Object.keys(setup).length > 0 ? setup : undefined
}

function parseEditPreferenceBaseline(value: unknown): LocalInternalEditPreferenceBaseline | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<LocalInternalEditPreferenceBaseline>
  if (
    !isEditLevel(record.editLevel) ||
    !isVideoWorkflowType(record.workflowType) ||
    !isCleanupPreference(record.cleanupPreference) ||
    !isVisualPreference(record.visualPreference) ||
    !isMoodStyle(record.moodStyle) ||
    !isCreditPreference(record.creditPreference) ||
    !isTargetPlatform(record.targetPlatform) ||
    typeof record.snapshotId !== 'string' ||
    typeof record.capturedAt !== 'string' ||
    !isEditPreferencePersistenceSource(record.persistenceSource) ||
    (record.provenance !== 'saved_edit_preferences' && record.provenance !== 'legacy_edit_snapshot')
  ) {
    return undefined
  }

  return {
    editLevel: record.editLevel,
    workflowType: record.workflowType,
    cleanupPreference: record.cleanupPreference,
    visualPreference: record.visualPreference,
    moodStyle: record.moodStyle,
    creditPreference: record.creditPreference,
    targetPlatform: record.targetPlatform,
    snapshotId: record.snapshotId.trim().slice(0, 120),
    capturedAt: record.capturedAt.trim().slice(0, 80),
    persistenceSource: record.persistenceSource,
    provenance: record.provenance,
  }
}

function isLocalProjectStage(value: unknown): value is LocalInternalProjectHandoff['stage'] {
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

function parsePrivateReview(value: unknown): LocalInternalProjectHandoff['privateReview'] {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<NonNullable<LocalInternalProjectHandoff['privateReview']>>
  if (typeof record.updatedAt !== 'string') return undefined

  return {
    byteSize: typeof record.byteSize === 'number' && Number.isFinite(record.byteSize) ? record.byteSize : undefined,
    manifestVerified: record.manifestVerified === true,
    sourceSetFingerprint: isLocalSourceSetFingerprint(record.sourceSetFingerprint) ? record.sourceSetFingerprint : undefined,
    reviewDecision: record.reviewDecision === 'accepted_for_internal_testing' || record.reviewDecision === 'changes_requested'
      ? record.reviewDecision
      : undefined,
    renderPreviewAssemblyId: typeof record.renderPreviewAssemblyId === 'string' ? record.renderPreviewAssemblyId : undefined,
    creditReservationId: typeof record.creditReservationId === 'string' ? record.creditReservationId : undefined,
    privateInternalDownloadPath: isPrivateInternalDownloadPath(record.privateInternalDownloadPath)
      ? record.privateInternalDownloadPath
      : undefined,
    privateInternalManifestPath: isPrivateInternalManifestPath(record.privateInternalManifestPath)
      ? record.privateInternalManifestPath
      : undefined,
    privateInternalDownloadDeliveryId: typeof record.privateInternalDownloadDeliveryId === 'string' ? record.privateInternalDownloadDeliveryId : undefined,
    finalDeliveryQaReviewId: typeof record.finalDeliveryQaReviewId === 'string' ? record.finalDeliveryQaReviewId : undefined,
    finalRenderExecutionId: typeof record.finalRenderExecutionId === 'string' ? record.finalRenderExecutionId : undefined,
    finalRenderReadinessReviewId: typeof record.finalRenderReadinessReviewId === 'string' ? record.finalRenderReadinessReviewId : undefined,
    finalRenderArtifactId: typeof record.finalRenderArtifactId === 'string' ? record.finalRenderArtifactId : undefined,
    finalRenderSha256: isSha256(record.finalRenderSha256) ? record.finalRenderSha256 : undefined,
    expectedReviewVideoMetadata: parseReviewVideoExpectation(record.expectedReviewVideoMetadata),
    editDecisionManifestVerification: parseEditDecisionManifestVerification(record.editDecisionManifestVerification),
    reviewVideoMetadata: parseReviewVideoMetadata(record.reviewVideoMetadata),
    professionalEditQaSummary: parseProfessionalEditQaSummary(record.professionalEditQaSummary),
    adapterGateSummary: parseAdapterGateSummary(record.adapterGateSummary),
    serverReviewId: typeof record.serverReviewId === 'string' ? record.serverReviewId : undefined,
    serverReviewStatus: typeof record.serverReviewStatus === 'string' ? record.serverReviewStatus : undefined,
    serverNextRequiredGate: typeof record.serverNextRequiredGate === 'string' ? record.serverNextRequiredGate : undefined,
    reviewNote: typeof record.reviewNote === 'string' ? record.reviewNote.trim().slice(0, 500) : undefined,
    revisionOperationId: typeof record.revisionOperationId === 'string' ? record.revisionOperationId : undefined,
    revisionRequestId: typeof record.revisionRequestId === 'string' ? record.revisionRequestId : undefined,
    revisionPreviewId: typeof record.revisionPreviewId === 'string' ? record.revisionPreviewId : undefined,
    revisionPreviewVersion: typeof record.revisionPreviewVersion === 'number' && Number.isFinite(record.revisionPreviewVersion)
      ? Math.max(1, Math.floor(record.revisionPreviewVersion))
      : undefined,
    revisionJobId: typeof record.revisionJobId === 'string' ? record.revisionJobId : undefined,
    nextRequiredGate: typeof record.nextRequiredGate === 'string' ? record.nextRequiredGate : undefined,
    updatedAt: record.updatedAt,
  }
}

function parseAdapterGateSummary(value: unknown): NonNullable<LocalInternalProjectHandoff['privateReview']>['adapterGateSummary'] {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<NonNullable<NonNullable<LocalInternalProjectHandoff['privateReview']>['adapterGateSummary']>>
  if (typeof record.status !== 'string' || typeof record.userFacingSummary !== 'string') return undefined
  const numericKeys = [
    'requestedActivityCount',
    'resolvedActivityCount',
    'readyActivityCount',
    'blockedActivityCount',
    'editActivityCount',
    'readinessCheckCount',
  ] as const
  if (!numericKeys.every((key) => typeof record[key] === 'number' && Number.isFinite(record[key]) && record[key] >= 0)) {
    return undefined
  }

  return {
    status: record.status,
    executionMode: typeof record.executionMode === 'string'
      ? record.executionMode.trim().slice(0, 120)
      : 'private_internal_dry_run_and_local_fallback',
    requestedActivityCount: Math.floor(record.requestedActivityCount ?? 0),
    resolvedActivityCount: Math.floor(record.resolvedActivityCount ?? 0),
    readyActivityCount: Math.floor(record.readyActivityCount ?? 0),
    blockedActivityCount: Math.floor(record.blockedActivityCount ?? 0),
    editActivityCount: Math.floor(record.editActivityCount ?? 0),
    readinessCheckCount: Math.floor(record.readinessCheckCount ?? 0),
    toolsExecutedCount: typeof record.toolsExecutedCount === 'number' && Number.isFinite(record.toolsExecutedCount) && record.toolsExecutedCount >= 0
      ? Math.floor(record.toolsExecutedCount)
      : 0,
    fullToolExecutionReady: false,
    privateFallbackReviewOnly: true,
    privateRenderIntegrationStatus: typeof record.privateRenderIntegrationStatus === 'string'
      ? record.privateRenderIntegrationStatus.trim().slice(0, 160)
      : undefined,
    privateRenderIntegrationReady: record.privateRenderIntegrationReady === true,
    privateRenderIntegratedActivityCount: safeOptionalCount(record.privateRenderIntegratedActivityCount),
    backendIntegrationCandidateCount: safeOptionalCount(record.backendIntegrationCandidateCount),
    backendIntegrationPendingActivityCount: safeOptionalCount(record.backendIntegrationPendingActivityCount),
    backendIntegrationBlockedActivityCount: safeOptionalCount(record.backendIntegrationBlockedActivityCount),
    backendIntegrationBlockers: Array.isArray(record.backendIntegrationBlockers)
      ? record.backendIntegrationBlockers
        .filter((blocker): blocker is string => typeof blocker === 'string')
        .map((blocker) => blocker.trim().replace(/\s+/g, ' ').slice(0, 240))
        .filter(Boolean)
        .slice(0, 6)
      : undefined,
    clientReadinessHintsTrusted: false,
    serverSourceTruthRequiredForFullExecution: true,
    frontendExecutionAllowed: false,
    productReady: false,
    userFacingSummary: record.userFacingSummary.trim().slice(0, 500),
    userFacingReadinessSummary: typeof record.userFacingReadinessSummary === 'string'
      ? record.userFacingReadinessSummary.trim().replace(/\s+/g, ' ').slice(0, 500)
      : undefined,
    activityGroups: parseAdapterGateActivityGroups(record.activityGroups),
  }
}

function parseAdapterGateActivityGroups(value: unknown): ApprovedEditExecutionAdapterGateActivityGroup[] | undefined {
  if (!Array.isArray(value)) return undefined
  const groups = value.flatMap((item): ApprovedEditExecutionAdapterGateActivityGroup[] => {
    if (!item || typeof item !== 'object') return []
    const record = item as Partial<ApprovedEditExecutionAdapterGateActivityGroup>
    const status = record.status
    if (
      typeof record.id !== 'string' ||
      typeof record.label !== 'string' ||
      typeof record.userFacingSummary !== 'string' ||
      !['ready', 'partial', 'pending', 'blocked'].includes(status ?? '') ||
      typeof record.resolvedActivityCount !== 'number' ||
      typeof record.integratedActivityCount !== 'number' ||
      typeof record.pendingActivityCount !== 'number' ||
      !Number.isFinite(record.resolvedActivityCount) ||
      !Number.isFinite(record.integratedActivityCount) ||
      !Number.isFinite(record.pendingActivityCount) ||
      record.resolvedActivityCount < 0 ||
      record.integratedActivityCount < 0 ||
      record.pendingActivityCount < 0
    ) {
      return []
    }

    return [{
      id: record.id.trim().slice(0, 80),
      label: record.label.trim().replace(/\s+/g, ' ').slice(0, 80),
      resolvedActivityCount: Math.floor(record.resolvedActivityCount),
      integratedActivityCount: Math.floor(record.integratedActivityCount),
      pendingActivityCount: Math.floor(record.pendingActivityCount),
      status: status as ApprovedEditExecutionAdapterGateActivityGroup['status'],
      userFacingSummary: record.userFacingSummary.trim().replace(/\s+/g, ' ').slice(0, 240),
    }]
  }).slice(0, 12)

  return groups.length ? groups : undefined
}

function safeOptionalCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined
}

export function createLocalSourceSetFingerprint(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] | undefined,
): LocalSourceSetFingerprint | undefined {
  if (!sourceMediaAssets?.length) return undefined
  if (!sourceMediaAssets.every(isDurableUploadedPrivateSourceAsset)) return undefined

  return [...sourceMediaAssets]
    .sort((left, right) =>
      left.uploadedOrder - right.uploadedOrder ||
      left.mediaAssetId.localeCompare(right.mediaAssetId),
    )
    .map((asset) => [
      asset.uploadedOrder,
      asset.mediaAssetId,
      asset.sourceSequenceItemId ?? '',
      asset.uploadedClipId ?? '',
      asset.storageProvider,
      asset.storageBucket ?? '',
      asset.storagePath,
      asset.fileName,
      asset.mimeType,
      asset.byteSize,
      asset.checksumSha256 ?? '',
    ].map(encodeSourceFingerprintPart).join(':'))
    .join('|')
}

export function privateReviewMatchesCurrentSourceSet(handoff: LocalInternalProjectHandoff | undefined): boolean {
  if (!handoff?.privateReview) return false

  const currentFingerprint = createLocalSourceSetFingerprint(handoff.sourceMediaAssets)
  return Boolean(currentFingerprint) &&
    handoff.privateReview.sourceSetFingerprint === currentFingerprint &&
    handoff.sourceSetFingerprint === currentFingerprint
}

function encodeSourceFingerprintPart(value: string | number): string {
  return encodeURIComponent(String(value))
}

function isLocalSourceSetFingerprint(value: unknown): value is LocalSourceSetFingerprint {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 8000
}

function parseEditDecisionManifestVerification(value: unknown): PrivateEditDecisionManifestVerification | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<PrivateEditDecisionManifestVerification>
  const layerCounts = record.professionalLayerCounts
  const approvedEditContext = record.approvedEditContext

  if (
    record.manifestVersion !== 'private-internal-edit-decision-manifest-v1' ||
    typeof record.approvedPlanSnapshotId !== 'string' ||
    typeof record.renderPreviewAssemblyId !== 'string' ||
    typeof record.creditReservationId !== 'string' ||
    typeof record.finalRenderArtifactId !== 'string' ||
    typeof record.verifiedAt !== 'string' ||
    record.approvedEditContextReady !== true ||
    !approvedEditContext ||
    typeof approvedEditContext !== 'object' ||
    typeof approvedEditContext.projectId !== 'string' ||
    typeof approvedEditContext.editSessionId !== 'string' ||
    typeof approvedEditContext.goalSummary !== 'string' ||
    record.processedPrivateArtifactTraceComplete !== true ||
    !Array.isArray(record.processedArtifactIds) ||
    !layerCounts ||
    typeof layerCounts !== 'object'
  ) {
    return undefined
  }

  return {
    manifestVersion: 'private-internal-edit-decision-manifest-v1',
    approvedPlanSnapshotId: record.approvedPlanSnapshotId,
    renderPreviewAssemblyId: record.renderPreviewAssemblyId,
    creditReservationId: record.creditReservationId,
    finalRenderArtifactId: record.finalRenderArtifactId,
    approvedEditContextReady: true,
    approvedEditContext: {
      projectId: approvedEditContext.projectId,
      editSessionId: approvedEditContext.editSessionId,
      goalSummary: approvedEditContext.goalSummary,
      editLevel: typeof approvedEditContext.editLevel === 'string' ? approvedEditContext.editLevel : null,
      editingCategory: typeof approvedEditContext.editingCategory === 'string' ? approvedEditContext.editingCategory : null,
      aspectRatio: typeof approvedEditContext.aspectRatio === 'string' ? approvedEditContext.aspectRatio : null,
      creditEstimateTotalCredits: parseNonNegativeInteger(approvedEditContext.creditEstimateTotalCredits),
      segmentCount: parseNonNegativeInteger(approvedEditContext.segmentCount),
      operationCount: parseNonNegativeInteger(approvedEditContext.operationCount),
      professionalSkillTrace: parseProfessionalSkillTrace(approvedEditContext.professionalSkillTrace),
      planningContextTrace: parsePlanningContextTrace(approvedEditContext.planningContextTrace),
    },
    sourceMediaAssetCount: parseNonNegativeInteger(record.sourceMediaAssetCount),
    clipDecisionCount: parseNonNegativeInteger(record.clipDecisionCount),
    sourceOrderPreserved: record.sourceOrderPreserved === true,
    uploadedOrderMonotonic: record.uploadedOrderMonotonic === true,
    sourceMediaCoverageComplete: record.sourceMediaCoverageComplete === true,
    sourceChecksumCoverageComplete: record.sourceChecksumCoverageComplete === true,
    sourceStorageIdentityCoverageComplete: record.sourceStorageIdentityCoverageComplete === true,
    processedPrivateArtifactTraceComplete: record.processedPrivateArtifactTraceComplete === true,
    processedArtifactCount: parseNonNegativeInteger(record.processedArtifactCount),
    processedArtifactIds: parseStringArray(record.processedArtifactIds),
    firstAppearanceSourceMediaAssetIds: parseStringArray(record.firstAppearanceSourceMediaAssetIds),
    firstAppearanceUploadedOrders: parsePositiveIntegerArray(record.firstAppearanceUploadedOrders),
    privateCaptionPackageAttached: record.privateCaptionPackageAttached === true,
    professionalLayerCounts: {
      reviewOverlays: parseNonNegativeInteger(layerCounts.reviewOverlays),
      captionOverlays: parseNonNegativeInteger(layerCounts.captionOverlays),
      transitionPolish: parseNonNegativeInteger(layerCounts.transitionPolish),
      visualPolish: parseNonNegativeInteger(layerCounts.visualPolish),
      finalTiming: parseNonNegativeInteger(layerCounts.finalTiming),
      audioPolish: parseNonNegativeInteger(layerCounts.audioPolish),
    },
    verifiedAt: record.verifiedAt,
  }
}

function parseReviewVideoMetadata(value: unknown): LocalPrivateInternalReviewVideoMetadata | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<LocalPrivateInternalReviewVideoMetadata>
  const durationSeconds = parsePositiveNumber(record.durationSeconds)
  const width = parseNonNegativeInteger(record.width)
  const height = parseNonNegativeInteger(record.height)

  if (
    record.playable !== true ||
    !durationSeconds ||
    width < 1 ||
    height < 1 ||
    typeof record.verifiedAt !== 'string'
  ) {
    return undefined
  }

  return {
    playable: true,
    durationSeconds,
    width,
    height,
    verifiedAt: record.verifiedAt,
  }
}

function parseReviewVideoExpectation(value: unknown): LocalPrivateInternalReviewVideoExpectation | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<LocalPrivateInternalReviewVideoExpectation>
  const durationSeconds = parsePositiveNumber(record.durationSeconds)
  const width = parseNonNegativeInteger(record.width)
  const height = parseNonNegativeInteger(record.height)

  if (!durationSeconds || width < 1 || height < 1) {
    return undefined
  }

  return { durationSeconds, width, height }
}

function parsePlanningContextTrace(
  value: unknown,
): PrivateEditDecisionManifestVerification['approvedEditContext']['planningContextTrace'] {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['planningContextTrace']>>
  if (
    record.source !== 'planning_context' ||
    typeof record.planningContextId !== 'string' ||
    typeof record.status !== 'string'
  ) {
    return null
  }

  return {
    source: 'planning_context',
    planningContextId: record.planningContextId,
    status: record.status,
    editBriefReady: record.editBriefReady === true,
    editBriefDirectionCount: parseNonNegativeInteger(record.editBriefDirectionCount),
    cueUsageCount: parseNonNegativeInteger(record.cueUsageCount),
    readyCueUsageCount: parseNonNegativeInteger(record.readyCueUsageCount),
    blockedCueUsageCount: parseNonNegativeInteger(record.blockedCueUsageCount),
    unresolvedConflictCount: parseNonNegativeInteger(record.unresolvedConflictCount),
    sourceAssetCount: parseNonNegativeInteger(record.sourceAssetCount),
    mustUseAssetCount: parseNonNegativeInteger(record.mustUseAssetCount),
    avoidAssetCount: parseNonNegativeInteger(record.avoidAssetCount),
  }
}

function parseProfessionalSkillTrace(
  value: unknown,
): PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace'] {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>>
  if (
    record.source !== 'professional_skill_plan' ||
    typeof record.status !== 'string' ||
    record.noUserVisibleToolNames !== true
  ) {
    return null
  }

  return {
    source: 'professional_skill_plan',
    status: record.status,
    selectedSkillCount: parseNonNegativeInteger(record.selectedSkillCount),
    selectedFamilies: parseStringArray(record.selectedFamilies),
    activityGroups: parseProfessionalSkillActivityGroups(record.activityGroups),
    selectionEvidence: parseProfessionalSkillSelectionEvidence(record.selectionEvidence),
    backendIntentCount: parseNonNegativeInteger(record.backendIntentCount),
    backendIntentKinds: parseStringArray(record.backendIntentKinds),
    backendIntents: parseProfessionalSkillBackendIntents(record.backendIntents),
    modelRoleTrace: parseProfessionalSkillModelRoleTrace(record.modelRoleTrace),
    qaGateCount: parseNonNegativeInteger(record.qaGateCount),
    userFacingActivities: parseStringArray(record.userFacingActivities),
    warnings: parseStringArray(record.warnings),
    blockers: parseStringArray(record.blockers),
    editBriefOptional: true,
    promptFirstPlanning: true,
    noUserVisibleToolNames: true,
  }
}

function parseProfessionalSkillModelRoleTrace(
  value: unknown,
): NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['modelRoleTrace'] | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['modelRoleTrace']>>
  if (
    record.source !== 'reeditpro_model_role_contract' ||
    typeof record.contractVersion !== 'string' ||
    typeof record.ok !== 'boolean' ||
    typeof record.blocked !== 'boolean' ||
    record.mockOnly !== true
  ) {
    return undefined
  }

  return {
    source: 'reeditpro_model_role_contract',
    contractVersion: record.contractVersion.trim().slice(0, 120),
    ok: record.ok,
    blocked: record.blocked,
    checkedContractCount: parseNonNegativeInteger(record.checkedContractCount),
    modelRoleIntentCount: parseNonNegativeInteger(record.modelRoleIntentCount),
    roles: Array.isArray(record.roles)
      ? record.roles.flatMap((role) => {
          if (!role || typeof role !== 'object') return []
          const roleRecord = role as Record<string, unknown>
          if (
            typeof roleRecord.modelRoleId !== 'string' ||
            typeof roleRecord.providerBoundary !== 'string' ||
            typeof roleRecord.canonicalProviderModel !== 'string' ||
            !isReasoningRouteRole(roleRecord.reasoningRouteRole) ||
            !isReasoningRoutePriority(roleRecord.reasoningRoutePriority) ||
            typeof roleRecord.fallbackOnly !== 'boolean' ||
            typeof roleRecord.userReasoningAllowed !== 'boolean' ||
            typeof roleRecord.editPlanningAllowed !== 'boolean' ||
            typeof roleRecord.creativeStrategyAllowed !== 'boolean' ||
            typeof roleRecord.editQaReasoningAllowed !== 'boolean' ||
            typeof roleRecord.visualUnderstandingAllowed !== 'boolean' ||
            typeof roleRecord.toolCodeAllowed !== 'boolean' ||
            typeof roleRecord.remotionDraftAllowed !== 'boolean'
          ) {
            return []
          }

          return [{
            modelRoleId: roleRecord.modelRoleId.trim().slice(0, 120),
            providerBoundary: roleRecord.providerBoundary.trim().slice(0, 160),
            canonicalProviderModel: roleRecord.canonicalProviderModel.trim().slice(0, 160),
            requestedUses: parseStringArray(roleRecord.requestedUses),
            intentIds: parseStringArray(roleRecord.intentIds),
            reasoningRouteRole: roleRecord.reasoningRouteRole,
            reasoningRoutePriority: roleRecord.reasoningRoutePriority,
            fallbackOnly: roleRecord.fallbackOnly,
            userReasoningAllowed: roleRecord.userReasoningAllowed,
            editPlanningAllowed: roleRecord.editPlanningAllowed,
            creativeStrategyAllowed: roleRecord.creativeStrategyAllowed,
            editQaReasoningAllowed: roleRecord.editQaReasoningAllowed,
            visualUnderstandingAllowed: roleRecord.visualUnderstandingAllowed,
            toolCodeAllowed: roleRecord.toolCodeAllowed,
            remotionDraftAllowed: roleRecord.remotionDraftAllowed,
          }]
        }).slice(0, 8)
      : [],
    errors: parseStringArray(record.errors),
    mockOnly: true,
  }
}

function isReasoningRouteRole(value: unknown): value is 'primary' | 'fallback' | 'specialist' {
  return value === 'primary' || value === 'fallback' || value === 'specialist'
}

function isReasoningRoutePriority(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value > 0)
}

function parseProfessionalSkillSelectionEvidence(
  value: unknown,
): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['selectionEvidence']> {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['selectionEvidence']> => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (
      typeof record.skillId !== 'string' ||
      typeof record.userFacingActivity !== 'string' ||
      !Array.isArray(record.sources)
    ) {
      return []
    }

    return [{
      skillId: record.skillId.trim().slice(0, 120),
      userFacingActivity: record.userFacingActivity.trim().replace(/\s+/g, ' ').slice(0, 180),
      sources: parseStringArray(record.sources).slice(0, 8),
      summaries: parseStringArray(record.summaries).map((summary) => summary.slice(0, 240)).slice(0, 4),
    }]
  }).slice(0, 12)
}

function parseProfessionalSkillActivityGroups(
  value: unknown,
): NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['activityGroups'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['activityGroups'] => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (
      typeof record.id !== 'string' ||
      typeof record.label !== 'string' ||
      typeof record.status !== 'string' ||
      typeof record.userFacingSummary !== 'string'
    ) {
      return []
    }

    return [{
      id: record.id.trim().slice(0, 80),
      label: record.label.trim().replace(/\s+/g, ' ').slice(0, 80),
      selectedActivityCount: parseNonNegativeInteger(record.selectedActivityCount),
      readyActivityCount: parseNonNegativeInteger(record.readyActivityCount),
      reviewActivityCount: parseNonNegativeInteger(record.reviewActivityCount),
      blockedActivityCount: parseNonNegativeInteger(record.blockedActivityCount),
      status: record.status.trim().replace(/\s+/g, ' ').slice(0, 80),
      userFacingSummary: record.userFacingSummary.trim().replace(/\s+/g, ' ').slice(0, 240),
    }]
  }).slice(0, 12)
}

function parseProfessionalSkillBackendIntents(
  value: unknown,
): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['backendIntents']> {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['backendIntents']> => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (
      typeof record.intentId !== 'string' ||
      typeof record.intentKind !== 'string' ||
      typeof record.executionBoundary !== 'string'
    ) {
      return []
    }

    const optionalString = (field: unknown) => typeof field === 'string' && field.trim()
      ? field.trim()
      : undefined

    return [{
      intentId: record.intentId.trim().slice(0, 120),
      intentKind: record.intentKind.trim().slice(0, 80),
      executionBoundary: record.executionBoundary.trim().slice(0, 80),
      providerRoute: optionalString(record.providerRoute),
      providerModel: optionalString(record.providerModel),
      modelRoleId: optionalString(record.modelRoleId),
      requestedModelUse: optionalString(record.requestedModelUse),
      generationType: optionalString(record.generationType),
      outputAssetType: optionalString(record.outputAssetType),
      hiddenAdapterToolCount: parseNonNegativeInteger(record.hiddenAdapterToolCount),
      requiredApprovalGates: parseStringArray(record.requiredApprovalGates),
    }]
  }).slice(0, 64)
}

function writeHandoffs(
  scope: ProjectPersistenceScope,
  handoffs: LocalInternalProjectHandoff[],
) {
  if (!canUseLocalStorage()) return
  const envelope: ScopedLocalProjectHandoffEnvelope = {
    recordVersion: 2,
    scope: {
      authMode: scope.authMode,
      userId: scope.userId,
      workspaceId: scope.workspaceId,
    },
    scopeFingerprint: createProjectPersistenceScopeFingerprint(scope),
    handoffs,
    savedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(buildLocalProjectHandoffStorageKey(scope), JSON.stringify(envelope))
}

function queueInternalEditStateBackendSync(
  scope: ProjectPersistenceScope,
  handoff: LocalInternalProjectHandoff,
) {
  if (!canUseLocalStorage()) return
  const normalizedScope = requireScope(scope)
  const key = internalEditPersistenceKey(
    normalizedScope,
    handoff.projectId,
    handoff.editSessionId,
  )
  const state = getOrCreateInternalEditBackendSyncState(
    normalizedScope,
    handoff.projectId,
    handoff.editSessionId,
  )

  if (state.status.status === 'needs_retry') {
    // Preserve the failed write but let a newer local handoff supersede it.
    // A user-visible retry is required before another backend attempt.
    state.retryHandoff = latestInternalEditHandoff(state.retryHandoff, state.pending, handoff)
    state.pending = undefined
    setInternalEditPersistenceStatus(
      state,
      createNeedsRetryPersistenceStatus(
        state,
        state.retryHandoff ?? handoff,
        state.status.errorMessage,
      ),
    )
    return
  }

  state.pending = latestInternalEditHandoff(state.pending, handoff)
  setInternalEditPersistenceStatus(
    state,
    createSavingPersistenceStatus(state, state.pending ?? handoff),
  )
  startInternalEditStateBackendSyncDrain(key, state)
}

async function drainInternalEditStateBackendSync(
  state: InternalEditBackendSyncState,
): Promise<void> {
  const { persistLocalInternalProjectHandoffToBackend } = await import('./internal-edit-state-backend-sync')
  while (state.pending) {
    const candidate = state.pending
    state.pending = undefined
    state.inFlight = candidate
    state.status = {
      ...createSavingPersistenceStatus(state, candidate),
      attemptCount: state.status.attemptCount + 1,
    }
    notifyInternalEditPersistenceStatus(state)

    const latestBeforeWrite = getLocalInternalEditHandoff(
      state.scope,
      candidate.projectId,
      candidate.editSessionId,
    )
    if (latestBeforeWrite && latestBeforeWrite.updatedAt > candidate.updatedAt) {
      state.inFlight = undefined
      setInternalEditPersistenceStatus(
        state,
        createSavedLocalPersistenceStatus(
          candidate.projectId,
          candidate.editSessionId,
          latestBeforeWrite.updatedAt,
          state.status.attemptCount,
        ),
      )
      return
    }

    let result: InternalEditBackendPersistenceResult
    try {
      result = await persistLocalInternalProjectHandoffToBackend(
        state.scope,
        candidate,
        { reportStatus: false },
      )
    } catch (error) {
      result = {
        ok: false,
        persisted: false,
        errorMessage: error instanceof Error
          ? error.message
          : 'Private edit recovery could not save the latest browser state.',
      }
    }
    state.inFlight = undefined

    if (result.ok && result.persisted) {
      if (state.pending) continue
      const latestLocal = getLocalInternalEditHandoff(
        state.scope,
        candidate.projectId,
        candidate.editSessionId,
      )
      if (latestLocal && latestLocal.updatedAt > candidate.updatedAt) {
        // A separately awaited critical write owns the newer result. Never let
        // this older queued completion overwrite its status claim.
        if (state.status.handoffUpdatedAt === latestLocal.updatedAt) return
        setInternalEditPersistenceStatus(
          state,
          createSavedLocalPersistenceStatus(
            candidate.projectId,
            candidate.editSessionId,
            latestLocal.updatedAt,
            state.status.attemptCount,
          ),
        )
        return
      }
      setInternalEditPersistenceStatus(state, createSavedBackendPersistenceStatus(state, candidate))
      return
    }

    if (result.ok) {
      const latestLocal = getLocalInternalEditHandoff(
        state.scope,
        candidate.projectId,
        candidate.editSessionId,
      )
      const latestBrowserHandoff = latestInternalEditHandoff(candidate, state.pending, latestLocal) ?? candidate
      state.pending = undefined
      state.retryHandoff = undefined
      setInternalEditPersistenceStatus(
        state,
        createSavedLocalPersistenceStatus(
          candidate.projectId,
          candidate.editSessionId,
          latestBrowserHandoff.updatedAt,
          state.status.attemptCount,
        ),
      )
      return
    }

    const latestLocal = getLocalInternalEditHandoff(
      state.scope,
      candidate.projectId,
      candidate.editSessionId,
    )
    state.retryHandoff = latestInternalEditHandoff(
      candidate,
      state.pending,
      state.retryHandoff,
      latestLocal,
    )
    state.pending = undefined
    setInternalEditPersistenceStatus(
      state,
      createNeedsRetryPersistenceStatus(
        state,
        state.retryHandoff ?? candidate,
        result.errorMessage,
      ),
    )
    return
  }
}

function startInternalEditStateBackendSyncDrain(
  key: string,
  state: InternalEditBackendSyncState,
): void {
  if (state.drain || !state.pending) return

  state.drain = drainInternalEditStateBackendSync(state)
    .catch((error) => {
      const latestLocal = getLocalInternalEditHandoff(
        state.scope,
        state.projectId,
        state.editSessionId,
      )
      const retained = latestInternalEditHandoff(
        state.inFlight,
        state.pending,
        state.retryHandoff,
        latestLocal,
      )
      state.inFlight = undefined
      state.pending = undefined
      state.retryHandoff = retained
      if (retained) {
        setInternalEditPersistenceStatus(
          state,
          createNeedsRetryPersistenceStatus(
            state,
            retained,
            error instanceof Error ? error.message : undefined,
          ),
        )
      }
    })
    .finally(() => {
      state.drain = undefined
      if (
        backendSyncStateByEdit.get(key) === state &&
        state.pending &&
        state.status.status === 'saving'
      ) {
        startInternalEditStateBackendSyncDrain(key, state)
      }
    })
}

function getOrCreateInternalEditBackendSyncState(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): InternalEditBackendSyncState {
  const key = internalEditPersistenceKey(scope, projectId, editSessionId)
  const existing = backendSyncStateByEdit.get(key)
  if (existing) return existing

  const localHandoff = getLocalInternalEditHandoff(scope, projectId, editSessionId)
  const state: InternalEditBackendSyncState = {
    scope,
    projectId,
    editSessionId,
    listeners: new Set(),
    status: createSavedLocalPersistenceStatus(
      projectId,
      editSessionId,
      localHandoff?.updatedAt,
    ),
  }
  backendSyncStateByEdit.set(key, state)
  return state
}

function internalEditPersistenceKey(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): string {
  return JSON.stringify([
    scope.authMode,
    scope.userId,
    scope.workspaceId,
    projectId,
    editSessionId,
  ])
}

function latestInternalEditHandoff(
  ...handoffs: Array<LocalInternalProjectHandoff | undefined>
): LocalInternalProjectHandoff | undefined {
  return handoffs.reduce<LocalInternalProjectHandoff | undefined>((latest, candidate) => {
    if (!candidate) return latest
    if (!latest || candidate.updatedAt >= latest.updatedAt) return candidate
    return latest
  }, undefined)
}

function createSavingPersistenceStatus(
  state: InternalEditBackendSyncState,
  handoff: LocalInternalProjectHandoff,
): InternalEditPersistenceStatus {
  return {
    status: 'saving',
    storage: 'browser_local',
    projectId: state.projectId,
    editSessionId: state.editSessionId,
    handoffUpdatedAt: handoff.updatedAt,
    attemptCount: state.status.attemptCount,
    retryable: false,
    message: 'Saved in this browser. Checking private workspace recovery.',
  }
}

function createSavedLocalPersistenceStatus(
  projectId: string,
  editSessionId: string,
  handoffUpdatedAt?: string,
  attemptCount = 0,
): InternalEditPersistenceStatus {
  return {
    status: 'saved_local',
    storage: 'browser_local',
    projectId,
    editSessionId,
    handoffUpdatedAt,
    attemptCount,
    retryable: false,
    message: 'Saved in this browser for this signed-in local session.',
  }
}

function createSavedBackendPersistenceStatus(
  state: InternalEditBackendSyncState,
  handoff: LocalInternalProjectHandoff,
): InternalEditPersistenceStatus {
  return {
    status: 'saved_backend',
    storage: 'private_backend',
    projectId: state.projectId,
    editSessionId: state.editSessionId,
    handoffUpdatedAt: handoff.updatedAt,
    attemptCount: state.status.attemptCount,
    retryable: false,
    message: 'Saved to the private workspace recovery service.',
  }
}

function createNeedsRetryPersistenceStatus(
  state: InternalEditBackendSyncState,
  handoff: LocalInternalProjectHandoff,
  errorMessage?: string,
): InternalEditPersistenceStatus {
  return {
    status: 'needs_retry',
    storage: 'browser_local',
    projectId: state.projectId,
    editSessionId: state.editSessionId,
    handoffUpdatedAt: handoff.updatedAt,
    attemptCount: state.status.attemptCount,
    retryable: true,
    message: 'Saved in this browser, but private workspace recovery needs a retry.',
    errorMessage: errorMessage || 'Private workspace recovery did not save the latest browser state.',
  }
}

function setInternalEditPersistenceStatus(
  state: InternalEditBackendSyncState,
  status: InternalEditPersistenceStatus,
): void {
  state.status = status
  notifyInternalEditPersistenceStatus(state)
}

function notifyInternalEditPersistenceStatus(state: InternalEditBackendSyncState): void {
  for (const listener of state.listeners) listener(state.status)
}

function nextIsoTimestamp(previous: string): string {
  const previousTime = Date.parse(previous)
  return new Date(Math.max(Date.now(), Number.isFinite(previousTime) ? previousTime + 1 : Date.now())).toISOString()
}

function isMatchingScopedHandoffEnvelope(
  value: unknown,
  scope: ProjectPersistenceScope,
): value is ScopedLocalProjectHandoffEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Partial<ScopedLocalProjectHandoffEnvelope>
  return record.recordVersion === 2 &&
    record.scope?.authMode === scope.authMode &&
    record.scope?.userId === scope.userId &&
    record.scope?.workspaceId === scope.workspaceId &&
    record.scopeFingerprint === createProjectPersistenceScopeFingerprint(scope) &&
    Array.isArray(record.handoffs) &&
    typeof record.savedAt === 'string'
}

function requireScope(scope: ProjectPersistenceScope): ProjectPersistenceScope {
  const normalized = normalizeProjectPersistenceScope(scope)
  if (!normalized) throw new Error('A valid signed-in project persistence scope is required.')
  return normalized
}

function normalizeWorkspaceId(value: string): string {
  const normalized = value.trim().slice(0, 160)
  if (!normalized) throw new Error('A workspace id is required for local edit persistence.')
  return normalized
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function isPrivateInternalDownloadPath(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/file$/.test(value)
}

function isPrivateInternalManifestPath(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/manifest$/.test(value)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value)
}

function parseNonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

function parsePositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 48)
    : []
}

function parsePositiveIntegerArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is number => typeof item === 'number' && Number.isFinite(item) && item > 0)
        .map((item) => Math.floor(item))
        .slice(0, 48)
    : []
}

function parseProfessionalEditQaSummary(value: unknown): LocalPrivateInternalQaSummary | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<LocalPrivateInternalQaSummary>

	  return {
	    privateInternalQaReady: record.privateInternalQaReady === true,
	    editDecisionManifestReady: record.editDecisionManifestReady === true,
	    editDecisionManifestArtifactReady: record.editDecisionManifestArtifactReady === true,
	    audioPolishApplied: record.audioPolishApplied === true,
	    visualPolishApplied: record.visualPolishApplied === true,
	    sourceAudioQaAttached: record.sourceAudioQaAttached === true,
	    sourceAudioQaSource: record.sourceAudioQaSource === 'private_uploaded_audio_execution' || record.sourceAudioQaSource === 'none'
	      ? record.sourceAudioQaSource
	      : undefined,
	    sourceAudioQaReviewCount: parseNonNegativeInteger(record.sourceAudioQaReviewCount),
	    sourceAudioQaGateCount: parseNonNegativeInteger(record.sourceAudioQaGateCount),
	    sourceAudioQaBlockingGateCount: parseNonNegativeInteger(record.sourceAudioQaBlockingGateCount),
	    sourceAudioQaWarningGateCount: parseNonNegativeInteger(record.sourceAudioQaWarningGateCount),
	    sourceAudioQaBlocksPreview: record.sourceAudioQaBlocksPreview === true,
	    sourceAudioQaBlocksFinalExport: record.sourceAudioQaBlocksFinalExport === true,
	    sourceAudioQaFinalMuxAllowed: false,
	    sourceAudioQaProductRuntimeExecuted: false,
	    sourceAudioQaPublicArtifact: false,
	    sourceAudioQaSignedUrl: null,
	    approvedReviewOverlayCount: parseNonNegativeInteger(record.approvedReviewOverlayCount),
    approvedCaptionOverlayCount: parseNonNegativeInteger(record.approvedCaptionOverlayCount),
    approvedTransitionPolishCount: parseNonNegativeInteger(record.approvedTransitionPolishCount),
    approvedVisualPolishCount: parseNonNegativeInteger(record.approvedVisualPolishCount),
    approvedFinalTimingCount: parseNonNegativeInteger(record.approvedFinalTimingCount),
    approvedFinalTimelineDurationSeconds: parsePositiveNumber(record.approvedFinalTimelineDurationSeconds),
    privateCaptionArtifactCount: parseNonNegativeInteger(record.privateCaptionArtifactCount),
    privateCaptionFormats: Array.isArray(record.privateCaptionFormats)
      ? record.privateCaptionFormats.filter((format): format is string => typeof format === 'string').slice(0, 6)
      : undefined,
    visualPolishToolId: typeof record.visualPolishToolId === 'string' ? record.visualPolishToolId : undefined,
  }
}

function parseSourceMediaAssets(value: unknown): ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] | undefined {
  if (!Array.isArray(value)) return undefined

  const assets = value
    .map(parseSourceMediaAsset)
    .filter((asset): asset is ApprovedEditExecutionUploadedMediaSourceAssetClientInput => Boolean(asset))

  return assets.length > 0 && assets.length === value.length ? assets.slice(0, 24) : undefined
}

function parseSourceMediaAsset(value: unknown): ApprovedEditExecutionUploadedMediaSourceAssetClientInput | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<ApprovedEditExecutionUploadedMediaSourceAssetClientInput>

  if (
    typeof record.mediaAssetId !== 'string' ||
    typeof record.uploadedClipId !== 'string' ||
    typeof record.storagePath !== 'string' ||
    typeof record.fileName !== 'string' ||
    typeof record.mimeType !== 'string' ||
    typeof record.uploadedOrder !== 'number' ||
    typeof record.byteSize !== 'number' ||
    !Number.isFinite(record.uploadedOrder) ||
    !Number.isFinite(record.byteSize) ||
    !isDurablePrivateSourceStorageProvider(record.storageProvider) ||
    record.byteSize < 1 ||
    !isSha256(record.checksumSha256) ||
    record.privateArtifact !== true ||
    record.publicUrl != null ||
    record.signedUrl != null ||
    (typeof record.storageBucket === 'string' && /^https?:\/\//i.test(record.storageBucket)) ||
    /^https?:\/\//i.test(record.storagePath)
  ) {
    return null
  }

  return {
    mediaAssetId: record.mediaAssetId.trim(),
    storageObjectRecordId: optionalBoundedString(record.storageObjectRecordId, 200),
    sourceSequenceItemId: typeof record.sourceSequenceItemId === 'string' ? record.sourceSequenceItemId : undefined,
    uploadedClipId: record.uploadedClipId.trim(),
    uploadedOrder: Math.max(1, Math.floor(record.uploadedOrder)),
    storageProvider: record.storageProvider,
    storageBucket: typeof record.storageBucket === 'string' ? record.storageBucket.trim() : undefined,
    storagePath: record.storagePath.trim(),
    fileName: record.fileName.slice(0, 200),
    mimeType: record.mimeType.slice(0, 120),
    byteSize: Math.max(1, Math.floor(record.byteSize)),
    checksumSha256: record.checksumSha256.toLowerCase(),
    sourceMetadata: parseSourceMediaMetadata(record.sourceMetadata),
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }
}

function parseSourceMediaMetadata(value: unknown): SourceMediaMetadata | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<SourceMediaMetadata>
  const probeStatus = record.probeStatus
  const source = record.source

  if (
    (probeStatus !== 'probed' && probeStatus !== 'unavailable') ||
    (source !== 'local_ffprobe' && source !== 'gcs_ffprobe') ||
    typeof record.hasVideo !== 'boolean' ||
    typeof record.hasAudio !== 'boolean'
  ) {
    return undefined
  }

  return {
    probeStatus,
    source,
    durationSeconds: optionalPositiveNumber(record.durationSeconds),
    width: optionalPositiveInteger(record.width),
    height: optionalPositiveInteger(record.height),
    videoCodec: optionalBoundedString(record.videoCodec, 80),
    audioCodec: optionalBoundedString(record.audioCodec, 80),
    formatName: optionalBoundedString(record.formatName, 120),
    streamCount: optionalPositiveInteger(record.streamCount),
    hasVideo: record.hasVideo,
    hasAudio: record.hasAudio,
    unavailableReason: optionalBoundedString(record.unavailableReason, 160),
  }
}

function optionalPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function optionalPositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined
}

function optionalBoundedString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : undefined
}

function normalizeDurableSourceMediaAssets(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] | undefined,
): ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] | undefined {
  if (!sourceMediaAssets?.length) return undefined
  return sourceMediaAssets.every(isDurableUploadedPrivateSourceAsset)
    ? sourceMediaAssets.slice(0, 24)
    : undefined
}

function isDurableUploadedPrivateSourceAsset(
  asset: ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
): boolean {
  return Boolean(
    asset.mediaAssetId.trim() &&
    asset.uploadedClipId?.trim() &&
    Number.isInteger(asset.uploadedOrder) &&
    asset.uploadedOrder > 0 &&
    isDurablePrivateSourceStorageProvider(asset.storageProvider) &&
    (asset.storageBucket == null || !/^https?:\/\//i.test(asset.storageBucket)) &&
    asset.storagePath.trim() &&
    !/^https?:\/\//i.test(asset.storagePath) &&
    asset.fileName.trim() &&
    asset.mimeType.trim() &&
    Number.isFinite(asset.byteSize) &&
    asset.byteSize > 0 &&
    isSha256(asset.checksumSha256) &&
    asset.privateArtifact === true &&
    asset.publicUrl == null &&
    asset.signedUrl == null,
  )
}

function isDurablePrivateSourceStorageProvider(value: unknown): value is ApprovedEditExecutionUploadedMediaSourceAssetClientInput['storageProvider'] {
  return value === 'local_private' || value === 'google_cloud_storage' || value === 'supabase_storage'
}

function isOneOf<const Value extends string>(value: unknown, allowed: readonly Value[]): value is Value {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

function isSourceSequenceMode(value: unknown): value is SourceSequenceMode {
  return isOneOf(value, ['single_complete_video', 'multi_clip_story_order', 'unordered_clips_needs_ai_help', 'b_roll_plus_main_clip', 'mixed_assets'])
}

function isCleanupPreference(value: unknown): value is CleanupPreference {
  return isOneOf(value, ['preserve_natural', 'light_cleanup', 'balanced_cleanup', 'tight_retention_cleanup', 'aggressive_cleanup', 'documentary_faithful', 'tutorial_complete', 'custom'])
}

function isAspectRatio(value: unknown): value is AspectRatio {
  return isOneOf(value, ['9:16', '16:9', '1:1', '4:5', '4:3', 'let_ai_decide'])
}

function isAspectRatioSource(value: unknown): value is AspectRatioSource {
  return isOneOf(value, ['user_selected', 'platform_recommended', 'demo_scenario', 'reference_video', 'custom', 'unknown'])
}

function isEditLevel(value: unknown): value is EditLevel {
  return isOneOf(value, ['basic', 'pro', 'premium'])
}

function isVisualPreference(value: unknown): value is VisualPreference {
  return isOneOf(value, ['let_ai_decide', 'keep_visuals_minimal', 'balanced_visual_mix', 'more_stroke_motion', 'more_graphic_design', 'real_motion_if_useful', 'no_extra_visuals'])
}

function isTargetPlatform(value: unknown): value is TargetPlatform {
  return isOneOf(value, ['tiktok_reels_shorts', 'youtube', 'website', 'course_training', 'client_review', 'custom'])
}

function isFrameTemplateType(value: unknown): value is FrameTemplateType {
  return isOneOf(value, ['vertical_talking_head_lower_panel', 'vertical_full_panel', 'youtube_side_panel', 'youtube_lower_panel', 'square_center_panel', 'portrait_feed_lower_panel', 'classic_documentary_center_panel', 'let_ai_decide'])
}

function isVideoWorkflowType(value: unknown): value is VideoWorkflowType {
  return isOneOf(value, ['simple_clean_edit', 'social_short_viral_clip', 'talking_head_personal_brand', 'podcast_clip', 'vlog_lifestyle', 'product_demo', 'real_estate_property_tour', 'education_explainer', 'marketing_ad', 'testimonial_case_study', 'custom_let_ai_decide'])
}

function isMoodStyle(value: unknown): value is MoodStyle {
  return isOneOf(value, ['clean', 'premium', 'cinematic', 'energetic', 'emotional', 'educational', 'luxury', 'funny_playful', 'corporate', 'viral_fast_paced', 'let_ai_decide'])
}

function isCreditPreference(value: unknown): value is CreditPreference {
  return isOneOf(value, ['low_credit_cost', 'balanced', 'premium_best_result', 'let_ai_estimate'])
}

function isEditPreferenceFieldKey(value: unknown): value is EditPreferenceFieldKey {
  return isOneOf(value, [
    'editLevel',
    'workflowType',
    'cleanupPreference',
    'visualPreference',
    'moodStyle',
    'creditPreference',
    'targetPlatform',
  ])
}

function isEditPreferencePersistenceSource(value: unknown): value is EditPreferencePersistenceSource {
  return isOneOf(value, [
    'browser_local_edit_preferences',
    'authenticated_private_internal_backend',
  ])
}

function normalizeProjectName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80) || 'Untitled ReEditPro edit'
}

function normalizeEditName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80) || 'Untitled edit'
}

function normalizeProjectId(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized.slice(0, 180) : undefined
}

function createProductWorkflowPath(input: {
  category: EditingCategory
  editName: string
  editSessionId: string
  productWorkflow: LocalProductWorkflow
  projectId: string
  projectName: string
}) {
  if (input.productWorkflow === 'motion_studio.storytelling') {
    return `/motion-studio/storytelling/projects/${encodeURIComponent(input.projectId)}/edits/${encodeURIComponent(input.editSessionId)}`
  }

  const params = new URLSearchParams({
    category: input.category,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    projectName: input.projectName,
    editName: input.editName,
  })
  return `/projects/${encodeURIComponent(input.projectId)}/edits/${encodeURIComponent(input.editSessionId)}?${params.toString()}`
}

function createLocalProjectSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'untitled-edit'
}
