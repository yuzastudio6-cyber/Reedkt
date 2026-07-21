import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_REQUEST_VERSION =
  'edit-reference-visual-language-study-request-v1' as const
export const EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION =
  'edit-reference-visual-language-study-result-v1' as const

export type EditReferenceVisualLanguageFindingCategory =
  | 'composition_hierarchy'
  | 'framing_and_shot_scale'
  | 'subject_placement'
  | 'camera_behavior'
  | 'scene_rhythm'
  | 'visual_density'
  | 'broll_pattern'
  | 'transition_language'
  | 'caption_visible_text_and_overlay'
  | 'graphic_overlay_language'
  | 'color_contrast_and_lighting'
  | 'visual_storytelling'

export type EditReferenceVisualLanguageTransferability =
  | 'transferable_principle'
  | 'context_only'
  | 'non_transferable'

export type EditReferenceVisibleTextEvidenceMode =
  | 'not_requested'
  | 'geometry_only'
  | 'ocr_backed'

export interface EditReferenceVisualFrameEvidence {
  readonly role: 'representative' | 'keyframe'
  readonly frameEvidenceId: string
  readonly privateFrameArtifactId: string
  readonly frameChecksumSha256: string
  readonly sourceTimeSeconds: number
  readonly width: number
  readonly height: number
  readonly privateAccessVerified: true
  readonly ephemeral: true
  readonly cleanupRequired: true
}

export interface EditReferenceVisualLanguageEvidenceManifest {
  readonly mediaStructureEvidenceIds: readonly string[]
  readonly technicalChangePointEvidenceIds: readonly string[]
  readonly technicalSourceConditionEvidenceIds: readonly string[]
  readonly technicalColorEvidenceIds: readonly string[]
  readonly captionGeometryEvidenceIds: readonly string[]
  readonly ocrEvidenceIds: readonly string[]
  readonly studyChatGoalEvidenceIds: readonly string[]
  readonly factSafetyEvidenceIds: readonly string[]
}

export interface EditReferenceVisualLanguageStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly frameManifestDigestSha256: string
  readonly privateArtifactAccessVerified: true
  readonly privateArtifactFinalized: true
  readonly mediaChecksumVerified: true
  readonly evidenceAuthorityVerified: true
  readonly frameAuthorityVerified: true
  readonly frameSamples: readonly EditReferenceVisualFrameEvidence[]
  readonly evidence: EditReferenceVisualLanguageEvidenceManifest
  readonly visibleTextEvidenceMode: EditReferenceVisibleTextEvidenceMode
  readonly realPersonOrClaimContextPresent: boolean
  readonly maxRepresentativeFrameCount: number
  readonly maxKeyframeCount: number
  readonly maxEvidenceItems: number
  readonly maxStructuredContextCharacters: number
  readonly maxScanDurationSeconds: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly boundedPrivateFrameInputAllowed: true
  readonly rawFullMediaInputAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly rawFramePersistenceAllowed: false
  readonly rawProviderPayloadPersistenceAllowed: false
  readonly exactReferenceLayoutTransferAllowed: false
  readonly exactReferenceVisibleTextTransferAllowed: false
  readonly exactReferenceCameraPathTransferAllowed: false
  readonly referenceIdentityTransferAllowed: false
  readonly copyrightedAssetTransferAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceVisualLanguageFinding {
  readonly findingId: string
  readonly category: EditReferenceVisualLanguageFindingCategory
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly confidence: number
  readonly transferability: EditReferenceVisualLanguageTransferability
  readonly targetAdaptationRequired: true
  readonly requiresUserReview: boolean
  readonly identityRelated: boolean
  readonly factSafetyStatus: 'not_applicable' | 'bounded_by_evidence' | 'requires_review'
  readonly visibleTextInterpretation: 'not_applicable' | 'geometry_only' | 'ocr_backed'
  readonly exactReferenceLayoutRetained: false
  readonly exactFrameCompositionInstructionCreated: false
  readonly exactVisibleTextRetained: false
  readonly exactTransitionOrCameraPathInstructionCreated: false
  readonly identityTransferInstructionCreated: false
  readonly copyrightedAssetTransferInstructionCreated: false
}

export interface EditReferenceAnalyzedVisualLanguageStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'analyzed'
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly frameManifestDigestSha256: string
  readonly consumedFrameEvidenceIds: readonly string[]
  readonly evidence: EditReferenceVisualLanguageEvidenceManifest
  readonly findings: readonly EditReferenceVisualLanguageFinding[]
  readonly coverage: {
    readonly evidenceItemCount: number
    readonly representativeFrameCount: number
    readonly keyframeCount: number
    readonly visibleTextEvidenceMode: EditReferenceVisibleTextEvidenceMode
    readonly realPersonOrClaimContextPresent: boolean
    readonly partial: boolean
    readonly missingEvidenceKinds: readonly string[]
  }
  readonly summary: {
    readonly findingCount: number
    readonly transferablePrincipleCount: number
    readonly contextOnlyCount: number
    readonly nonTransferableCount: number
    readonly averageConfidence: number
  }
  readonly execution: {
    readonly boundedPrivateFramesRead: true
    readonly semanticVisualModelExecuted: true
    readonly fullMediaRead: false
    readonly rawFramesPersisted: false
    readonly externalUrlFetched: false
    readonly providerCallMade: boolean
    readonly modelCallMade: true
    readonly workerJobCreated: boolean
    readonly temporaryFramesCleaned: true
    readonly remoteMutationMade: false
  }
  readonly model: {
    readonly adapterId: string
    readonly adapterVersion: string
      readonly providerId: string | null
      readonly modelId: string
      readonly modelRevision: string
      readonly modelAggregateSha256: string
      readonly modelRoutingPolicyVersion: string
    readonly visualInstructionDigestSha256: string
  }
  readonly provenance: {
    readonly executionId: string
    readonly startedAt: string
    readonly completedAt: string
  }
  readonly usage: {
    readonly mode: 'controlled_test_unmetered' | 'production_metered'
    readonly approvedUsageEstimateId: string | null
    readonly internalCostBudgetId: string | null
    readonly immutableRateCardSnapshotId: string | null
    readonly maximumAuthorizedInternalCostMicros: string | null
    readonly meteredInternalCostMicros: string
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly privacy: {
    readonly rawFullMediaPersisted: false
    readonly rawFramesPersisted: false
    readonly rawProviderPayloadPersisted: false
    readonly signedUrlPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly temporaryFramesCleaned: true
  }
  readonly copySafety: {
    readonly exactReferenceLayoutRetained: false
    readonly exactFrameCompositionCopyInstructionCreated: false
    readonly exactVisibleTextRetained: false
    readonly exactTransitionOrCameraPathCopyInstructionCreated: false
    readonly creatorIdentityTransferInstructionCreated: false
    readonly copyrightedAssetTransferInstructionCreated: false
  }
  readonly factSafety: {
    readonly evidenceRequired: boolean
    readonly evidenceIds: readonly string[]
    readonly unverifiedClaimPresentedAsFact: false
    readonly misleadingRealPersonDepictionInstructionCreated: false
    readonly guiltImplyingVisualInstructionCreated: false
  }
  readonly transferBoundary: {
    readonly technicalChangePointsTreatedAsSemanticScenes: false
    readonly technicalSignalsTreatedAsCreativeMeaning: false
    readonly findingsMayBecomeTargetInstructionsWithoutApplication: false
    readonly targetEvidenceRequired: true
    readonly userApprovalRequired: true
    readonly exactLayoutOrCameraPathTransferAllowed: false
    readonly visualIdentityTransferAllowed: false
    readonly visibleTextTransferAllowed: false
  }
}

export type EditReferenceVisualLanguageStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'frame_authority_unverified'
  | 'representative_frames_unavailable'
  | 'keyframes_unavailable'
  | 'evidence_authority_unverified'
  | 'ocr_evidence_required'
  | 'fact_safety_evidence_required'
  | 'cost_authority_unavailable'
  | 'model_routing_unavailable'
  | 'privacy_policy_denied'
  | 'runtime_response_invalid'
  | 'ephemeral_cleanup_failed'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedVisualLanguageStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceVisualLanguageStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly findings: readonly []
  readonly boundedPrivateFramesRead: boolean
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly workerJobCreated: boolean
  readonly temporaryFramesCleaned: boolean
  readonly internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export type EditReferenceVisualLanguageStudyResult =
  | EditReferenceAnalyzedVisualLanguageStudyResult
  | EditReferenceBlockedVisualLanguageStudyResult

export interface EditReferenceVisualLanguageStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  analyze(request: EditReferenceVisualLanguageStudyRequest): Promise<EditReferenceVisualLanguageStudyResult>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const MAX_REPRESENTATIVE_FRAME_COUNT = 4
const MAX_KEYFRAME_COUNT = 4
const MAX_EVIDENCE_ITEMS = 64
const MAX_STRUCTURED_CONTEXT_CHARACTERS = 32_000
const MAX_SCAN_DURATION_SECONDS = 120
const MAX_FINDINGS = 64
const FINDING_CATEGORIES = new Set<EditReferenceVisualLanguageFindingCategory>([
  'composition_hierarchy',
  'framing_and_shot_scale',
  'subject_placement',
  'camera_behavior',
  'scene_rhythm',
  'visual_density',
  'broll_pattern',
  'transition_language',
  'caption_visible_text_and_overlay',
  'graphic_overlay_language',
  'color_contrast_and_lighting',
  'visual_storytelling',
])
const TRANSFERABILITIES = new Set<EditReferenceVisualLanguageTransferability>([
  'transferable_principle',
  'context_only',
  'non_transferable',
])
const VISIBLE_TEXT_MODES = new Set<EditReferenceVisibleTextEvidenceMode>([
  'not_requested',
  'geometry_only',
  'ocr_backed',
])
const BLOCKER_CODES = new Set<EditReferenceVisualLanguageStudyBlockerCode>([
  'adapter_unavailable',
  'private_artifact_unavailable',
  'frame_authority_unverified',
  'representative_frames_unavailable',
  'keyframes_unavailable',
  'evidence_authority_unverified',
  'ocr_evidence_required',
  'fact_safety_evidence_required',
  'cost_authority_unavailable',
  'model_routing_unavailable',
  'privacy_policy_denied',
  'runtime_response_invalid',
  'ephemeral_cleanup_failed',
  'copy_safety_violation',
  'internal_cost_usage_unverified',
])
const FORBIDDEN_KEYS = new Set([
  'apiKey',
  'api_key',
  'authorization',
  'bytes',
  'chainOfThought',
  'chain_of_thought',
  'exactLayout',
  'exactVisibleText',
  'filePath',
  'file_path',
  'hiddenReasoning',
  'localPath',
  'local_path',
  'password',
  'payload',
  'prompt',
  'rawFrame',
  'rawFrames',
  'rawMedia',
  'rawPayload',
  'rawProviderPayload',
  'secret',
  'signedUrl',
  'signed_url',
  'token',
  'tokens',
  'url',
  'visibleText',
])
const UNSAFE_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

function stableRequestPayload(request: EditReferenceVisualLanguageStudyRequest): string {
  return JSON.stringify({
    schemaVersion: request.schemaVersion,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    frameManifestDigestSha256: request.frameManifestDigestSha256,
    privateArtifactAccessVerified: request.privateArtifactAccessVerified,
    privateArtifactFinalized: request.privateArtifactFinalized,
    mediaChecksumVerified: request.mediaChecksumVerified,
    evidenceAuthorityVerified: request.evidenceAuthorityVerified,
    frameAuthorityVerified: request.frameAuthorityVerified,
    frameSamples: request.frameSamples.map((sample) => ({
      role: sample.role,
      frameEvidenceId: sample.frameEvidenceId,
      privateFrameArtifactId: sample.privateFrameArtifactId,
      frameChecksumSha256: sample.frameChecksumSha256,
      sourceTimeSeconds: sample.sourceTimeSeconds,
      width: sample.width,
      height: sample.height,
      privateAccessVerified: sample.privateAccessVerified,
      ephemeral: sample.ephemeral,
      cleanupRequired: sample.cleanupRequired,
    })),
    evidence: copyEvidenceManifest(request.evidence),
    visibleTextEvidenceMode: request.visibleTextEvidenceMode,
    realPersonOrClaimContextPresent: request.realPersonOrClaimContextPresent,
    maxRepresentativeFrameCount: request.maxRepresentativeFrameCount,
    maxKeyframeCount: request.maxKeyframeCount,
    maxEvidenceItems: request.maxEvidenceItems,
    maxStructuredContextCharacters: request.maxStructuredContextCharacters,
    maxScanDurationSeconds: request.maxScanDurationSeconds,
    executionScope: request.executionScope,
    approvedUsageEstimateId: request.approvedUsageEstimateId,
    internalCostBudgetId: request.internalCostBudgetId,
    immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
    boundedPrivateFrameInputAllowed: request.boundedPrivateFrameInputAllowed,
    rawFullMediaInputAllowed: request.rawFullMediaInputAllowed,
    externalUrlFetchAllowed: request.externalUrlFetchAllowed,
    rawFramePersistenceAllowed: request.rawFramePersistenceAllowed,
    rawProviderPayloadPersistenceAllowed: request.rawProviderPayloadPersistenceAllowed,
    exactReferenceLayoutTransferAllowed: request.exactReferenceLayoutTransferAllowed,
    exactReferenceVisibleTextTransferAllowed: request.exactReferenceVisibleTextTransferAllowed,
    exactReferenceCameraPathTransferAllowed: request.exactReferenceCameraPathTransferAllowed,
    referenceIdentityTransferAllowed: request.referenceIdentityTransferAllowed,
    copyrightedAssetTransferAllowed: request.copyrightedAssetTransferAllowed,
    customerPriceCalculationAllowed: request.customerPriceCalculationAllowed,
    customerCreditMutationAllowed: request.customerCreditMutationAllowed,
    serviceFeeCalculationAllowed: request.serviceFeeCalculationAllowed,
  })
}

export function hashEditReferenceVisualLanguageStudyRequest(
  request: EditReferenceVisualLanguageStudyRequest,
): string {
  validateEditReferenceVisualLanguageStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function validateEditReferenceVisualLanguageStudyRequest(
  value: unknown,
): asserts value is EditReferenceVisualLanguageStudyRequest {
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Visual Language study request must be an object.')
  assertExactKeys(value, [
    'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'frameManifestDigestSha256', 'privateArtifactAccessVerified', 'privateArtifactFinalized',
    'mediaChecksumVerified', 'evidenceAuthorityVerified', 'frameAuthorityVerified', 'frameSamples',
    'evidence', 'visibleTextEvidenceMode', 'realPersonOrClaimContextPresent',
    'maxRepresentativeFrameCount', 'maxKeyframeCount', 'maxEvidenceItems',
    'maxStructuredContextCharacters', 'maxScanDurationSeconds', 'executionScope',
    'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'boundedPrivateFrameInputAllowed',
    'rawFullMediaInputAllowed', 'externalUrlFetchAllowed', 'rawFramePersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed', 'exactReferenceLayoutTransferAllowed',
    'exactReferenceVisibleTextTransferAllowed', 'exactReferenceCameraPathTransferAllowed',
    'referenceIdentityTransferAllowed', 'copyrightedAssetTransferAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed', 'serviceFeeCalculationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_REQUEST_VERSION) {
    throw new Error('Visual Language study request version is unsupported.')
  }
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    assertId(value[key], `Visual Language study ${key} is invalid.`)
  }
  assertSha256(value.mediaChecksumSha256, 'Visual Language media checksum is invalid.')
  assertSha256(value.evidenceManifestDigestSha256, 'Visual Language evidence-manifest digest is invalid.')
  assertSha256(value.frameManifestDigestSha256, 'Visual Language frame-manifest digest is invalid.')
  if (
    value.privateArtifactAccessVerified !== true
    || value.privateArtifactFinalized !== true
    || value.mediaChecksumVerified !== true
    || value.evidenceAuthorityVerified !== true
    || value.frameAuthorityVerified !== true
  ) throw new Error('Visual Language private media, frame, or evidence authority is incomplete.')
  if (value.maxRepresentativeFrameCount !== MAX_REPRESENTATIVE_FRAME_COUNT) {
    throw new Error('Visual Language representative-frame bound is invalid.')
  }
  if (value.maxKeyframeCount !== MAX_KEYFRAME_COUNT) throw new Error('Visual Language keyframe bound is invalid.')
  if (value.maxEvidenceItems !== MAX_EVIDENCE_ITEMS) throw new Error('Visual Language evidence bound is invalid.')
  if (value.maxStructuredContextCharacters !== MAX_STRUCTURED_CONTEXT_CHARACTERS) {
    throw new Error('Visual Language structured-context bound is invalid.')
  }
  if (value.maxScanDurationSeconds !== MAX_SCAN_DURATION_SECONDS) {
    throw new Error('Visual Language scan-duration bound is invalid.')
  }
  if (!VISIBLE_TEXT_MODES.has(value.visibleTextEvidenceMode as EditReferenceVisibleTextEvidenceMode)) {
    throw new Error('Visual Language visible-text evidence mode is invalid.')
  }
  if (typeof value.realPersonOrClaimContextPresent !== 'boolean') {
    throw new Error('Visual Language real-person or claim-context flag is invalid.')
  }
  validateFrameSamples(value.frameSamples)
  validateEvidenceManifest(
    value.evidence,
    value.visibleTextEvidenceMode as EditReferenceVisibleTextEvidenceMode,
    value.realPersonOrClaimContextPresent,
    value.frameSamples as readonly EditReferenceVisualFrameEvidence[],
  )
  if (value.executionScope !== 'controlled_test' && value.executionScope !== 'production') {
    throw new Error('Visual Language execution scope is invalid.')
  }
  if (value.executionScope === 'controlled_test') {
    if (
      value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
    ) throw new Error('Controlled Visual Language tests cannot claim production cost authority.')
  } else {
    assertId(value.approvedUsageEstimateId, 'Production Visual Language study requires an approved usage estimate.')
    assertId(value.internalCostBudgetId, 'Production Visual Language study requires an internal cost budget.')
    assertId(value.immutableRateCardSnapshotId, 'Production Visual Language study requires an immutable rate-card snapshot.')
    assertPositiveMoneyMicros(
      value.maximumAuthorizedInternalCostMicros,
      'Production Visual Language study requires a positive maximum authorized internal cost.',
    )
  }
  if (value.boundedPrivateFrameInputAllowed !== true) {
    throw new Error('Visual Language requires bounded private-frame input authority.')
  }
  for (const key of [
    'rawFullMediaInputAllowed', 'externalUrlFetchAllowed', 'rawFramePersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed', 'exactReferenceLayoutTransferAllowed',
    'exactReferenceVisibleTextTransferAllowed', 'exactReferenceCameraPathTransferAllowed',
    'referenceIdentityTransferAllowed', 'copyrightedAssetTransferAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed', 'serviceFeeCalculationAllowed',
  ] as const) {
    if (value[key] !== false) throw new Error(`Visual Language safety boundary ${key} must remain false.`)
  }
}

export function validateEditReferenceVisualLanguageStudyResult(
  request: EditReferenceVisualLanguageStudyRequest,
  value: unknown,
): asserts value is EditReferenceVisualLanguageStudyResult {
  validateEditReferenceVisualLanguageStudyRequest(request)
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Visual Language study result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION) {
    throw new Error('Visual Language study result version is unsupported.')
  }
  if (value.requestDigestSha256 !== hashEditReferenceVisualLanguageStudyRequest(request)) {
    throw new Error('Visual Language study result does not match the exact request.')
  }
  if (value.status === 'blocked') {
    validateBlockedResult(request, value)
    return
  }
  if (value.status !== 'analyzed') throw new Error('Visual Language study result status is unsupported.')
  validateAnalyzedResult(request, value)
}

export function createBlockedEditReferenceVisualLanguageStudyResult(input: {
  readonly request: EditReferenceVisualLanguageStudyRequest
  readonly blockerCode: EditReferenceVisualLanguageStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly execution?: {
    readonly boundedPrivateFramesRead?: boolean
    readonly providerCallMade?: boolean
    readonly modelCallMade?: boolean
    readonly workerJobCreated?: boolean
    readonly temporaryFramesCleaned?: boolean
  }
  readonly usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}): EditReferenceBlockedVisualLanguageStudyResult {
  const boundedPrivateFramesRead = input.execution?.boundedPrivateFramesRead ?? false
  const providerCallMade = input.execution?.providerCallMade ?? false
  const modelCallMade = input.execution?.modelCallMade ?? false
  const workerJobCreated = input.execution?.workerJobCreated ?? false
  const temporaryFramesCleaned = input.execution?.temporaryFramesCleaned ?? true
  const result: EditReferenceBlockedVisualLanguageStudyResult = {
    schemaVersion: EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceVisualLanguageStudyRequest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    retryReason: input.retryAvailable ? (input.retryReason ?? null) : null,
    findings: [],
    boundedPrivateFramesRead,
    providerCallMade,
    modelCallMade,
    workerJobCreated,
    temporaryFramesCleaned,
    internalCostStatus: input.usage?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: input.usage ? input.usage.meteredInternalCostMicros : '0',
    usageEventIds: [...(input.usage?.usageEventIds ?? [])],
    internalCostRecordIds: [...(input.usage?.internalCostRecordIds ?? [])],
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  validateEditReferenceVisualLanguageStudyResult(input.request, result)
  return result
}

function validateFrameSamples(value: unknown): asserts value is readonly EditReferenceVisualFrameEvidence[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_REPRESENTATIVE_FRAME_COUNT + MAX_KEYFRAME_COUNT) {
    throw new Error('Visual Language frame manifest is outside the approved bound.')
  }
  const frameEvidenceIds = new Set<string>()
  const privateArtifactIds = new Set<string>()
  let representativeCount = 0
  let keyframeCount = 0
  let previousTime = -1
  for (const sample of value) {
    if (!isRecord(sample)) throw new Error('Visual Language frame sample is invalid.')
    assertExactKeys(sample, [
      'role', 'frameEvidenceId', 'privateFrameArtifactId', 'frameChecksumSha256', 'sourceTimeSeconds',
      'width', 'height', 'privateAccessVerified', 'ephemeral', 'cleanupRequired',
    ], 'frame sample')
    if (sample.role !== 'representative' && sample.role !== 'keyframe') {
      throw new Error('Visual Language frame role is invalid.')
    }
    if (sample.role === 'representative') representativeCount += 1
    else keyframeCount += 1
    assertId(sample.frameEvidenceId, 'Visual Language frame evidence ID is invalid.')
    assertId(sample.privateFrameArtifactId, 'Visual Language private frame artifact ID is invalid.')
    assertSha256(sample.frameChecksumSha256, 'Visual Language frame checksum is invalid.')
    if (frameEvidenceIds.has(sample.frameEvidenceId as string) || privateArtifactIds.has(sample.privateFrameArtifactId as string)) {
      throw new Error('Visual Language frame identities must be unique.')
    }
    frameEvidenceIds.add(sample.frameEvidenceId as string)
    privateArtifactIds.add(sample.privateFrameArtifactId as string)
    if (
      typeof sample.sourceTimeSeconds !== 'number'
      || !Number.isFinite(sample.sourceTimeSeconds)
      || sample.sourceTimeSeconds < 0
      || sample.sourceTimeSeconds > MAX_SCAN_DURATION_SECONDS
      || sample.sourceTimeSeconds < previousTime
    ) throw new Error('Visual Language frame time is invalid or not ascending.')
    previousTime = sample.sourceTimeSeconds
    for (const key of ['width', 'height'] as const) {
      if (!Number.isInteger(sample[key]) || (sample[key] as number) < 1 || (sample[key] as number) > 16_384) {
        throw new Error('Visual Language frame dimensions are invalid.')
      }
    }
    if (sample.privateAccessVerified !== true || sample.ephemeral !== true || sample.cleanupRequired !== true) {
      throw new Error('Visual Language frame privacy or cleanup authority is incomplete.')
    }
  }
  if (
    representativeCount < 1 || representativeCount > MAX_REPRESENTATIVE_FRAME_COUNT
    || keyframeCount < 1 || keyframeCount > MAX_KEYFRAME_COUNT
  ) throw new Error('Visual Language requires bounded representative-frame and keyframe evidence.')
}

function validateEvidenceManifest(
  value: unknown,
  visibleTextEvidenceMode: EditReferenceVisibleTextEvidenceMode,
  realPersonOrClaimContextPresent: boolean,
  frameSamples: readonly EditReferenceVisualFrameEvidence[],
): asserts value is EditReferenceVisualLanguageEvidenceManifest {
  if (!isRecord(value)) throw new Error('Visual Language evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds', 'technicalChangePointEvidenceIds', 'technicalSourceConditionEvidenceIds',
    'technicalColorEvidenceIds', 'captionGeometryEvidenceIds', 'ocrEvidenceIds',
    'studyChatGoalEvidenceIds', 'factSafetyEvidenceIds',
  ] as const
  assertExactKeys(value, keys, 'evidence manifest')
  for (const key of keys) assertIdArray(value[key], MAX_EVIDENCE_ITEMS, true, `Visual Language ${key} is invalid.`)
  for (const key of ['mediaStructureEvidenceIds', 'studyChatGoalEvidenceIds'] as const) {
    if ((value[key] as string[]).length < 1) throw new Error(`Visual Language ${key} requires approved evidence.`)
  }
  const captionIds = value.captionGeometryEvidenceIds as string[]
  const ocrIds = value.ocrEvidenceIds as string[]
  if (visibleTextEvidenceMode === 'not_requested' && (captionIds.length > 0 || ocrIds.length > 0)) {
    throw new Error('Visual Language text evidence cannot be supplied when visible-text interpretation is not requested.')
  }
  if (visibleTextEvidenceMode === 'geometry_only' && (captionIds.length < 1 || ocrIds.length > 0)) {
    throw new Error('Geometry-only Visual Language text evidence requires geometry and forbids OCR claims.')
  }
  if (visibleTextEvidenceMode === 'ocr_backed' && ocrIds.length < 1) {
    throw new Error('OCR-backed Visual Language text interpretation requires approved OCR evidence.')
  }
  if (realPersonOrClaimContextPresent && (value.factSafetyEvidenceIds as string[]).length < 1) {
    throw new Error('Visual Language real-person or claim context requires fact-safety evidence.')
  }
  const allIds = [...frameSamples.map((sample) => sample.frameEvidenceId), ...evidenceIds(value as unknown as EditReferenceVisualLanguageEvidenceManifest)]
  if (allIds.length > MAX_EVIDENCE_ITEMS || new Set(allIds).size !== allIds.length) {
    throw new Error('Visual Language evidence exceeds its bound or repeats evidence IDs.')
  }
}

function validateBlockedResult(
  request: EditReferenceVisualLanguageStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'blockerCode', 'blockerMessage', 'retryAvailable',
    'retryReason', 'findings', 'boundedPrivateFramesRead', 'providerCallMade', 'modelCallMade',
    'workerJobCreated', 'temporaryFramesCleaned', 'internalCostStatus', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds',
    'remoteMutationMade', 'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceVisualLanguageStudyBlockerCode)) {
    throw new Error('Visual Language blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 600, 'Visual Language blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Visual Language retry flag is invalid.')
  if (value.retryAvailable) assertSafeText(value.retryReason, 600, 'Retryable Visual Language blockers require a safe reason.')
  else if (value.retryReason !== null) throw new Error('Non-retryable Visual Language blockers cannot include a retry reason.')
  if (!Array.isArray(value.findings) || value.findings.length !== 0) {
    throw new Error('Blocked Visual Language results cannot contain findings.')
  }
  for (const key of ['boundedPrivateFramesRead', 'providerCallMade', 'modelCallMade', 'workerJobCreated', 'temporaryFramesCleaned'] as const) {
    if (typeof value[key] !== 'boolean') throw new Error('Blocked Visual Language execution evidence is invalid.')
  }
  if (
    value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) {
    throw new Error('Blocked Visual Language results crossed a remote-mutation or customer-charging boundary.')
  }
  if (!['not_incurred', 'metered', 'unverified'].includes(value.internalCostStatus as string)) {
    throw new Error('Blocked Visual Language internal-cost status is invalid.')
  }
  if (value.meteredInternalCostMicros !== null) {
    assertMoneyMicros(value.meteredInternalCostMicros, 'Blocked Visual Language internal cost is invalid.')
  }
  assertIdArray(value.usageEventIds, 64, true, 'Blocked Visual Language usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Blocked Visual Language internal-cost record IDs are invalid.')
  if (value.providerCallMade === true && value.modelCallMade !== true && value.blockerCode === 'runtime_response_invalid') {
    throw new Error('Invalid Visual Language model responses must record that the model call completed.')
  }
  if (request.executionScope === 'controlled_test') {
    if (
      value.providerCallMade !== false
      || value.workerJobCreated !== false
      || value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Visual Language blockers cannot claim paid provider, worker, or cost execution.')
  } else if (value.providerCallMade === true || value.modelCallMade === true || value.workerJobCreated === true) {
    if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
      throw new Error('Blocked production Visual Language execution requires usage and internal-cost records.')
    }
    if (value.internalCostStatus === 'not_incurred') {
      throw new Error('Blocked paid Visual Language execution cannot claim that no internal cost was incurred.')
    }
    if (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null) {
      throw new Error('Unverified blocked Visual Language cost must remain null rather than looking metered.')
    }
    if (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null) {
      throw new Error('Metered blocked Visual Language execution requires a cost amount.')
    }
    if (
      value.internalCostStatus === 'metered'
      && BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    ) {
      throw new Error('Blocked production Visual Language cost exceeds the authorized maximum.')
    }
  } else if (
    value.internalCostStatus !== 'not_incurred'
    || value.meteredInternalCostMicros !== '0'
    || (value.usageEventIds as string[]).length > 0
    || (value.internalCostRecordIds as string[]).length > 0
  ) {
    throw new Error('Unstarted Visual Language blockers cannot claim internal-cost usage.')
  }
}

function validateAnalyzedResult(
  request: EditReferenceVisualLanguageStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'runtimeSource', 'workspaceId', 'editReferenceId',
    'studySessionId', 'orchestrationId', 'privateMediaArtifactId', 'mediaChecksumSha256',
    'evidenceManifestDigestSha256', 'frameManifestDigestSha256', 'consumedFrameEvidenceIds',
    'evidence', 'findings', 'coverage', 'summary', 'execution', 'model', 'provenance', 'usage',
    'privacy', 'copySafety', 'factSafety', 'transferBoundary',
  ], 'analyzed result')
  if (value.runtimeSource !== 'verified_local' && value.runtimeSource !== 'verified_live') {
    throw new Error('Visual Language analyzed runtime source is invalid.')
  }
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    if (value[key] !== request[key]) throw new Error('Visual Language analyzed identity does not match the request.')
  }
  if (
    value.mediaChecksumSha256 !== request.mediaChecksumSha256
    || value.evidenceManifestDigestSha256 !== request.evidenceManifestDigestSha256
    || value.frameManifestDigestSha256 !== request.frameManifestDigestSha256
  ) throw new Error('Visual Language analyzed lineage does not match the request.')
  assertMatchingIdArray(
    value.consumedFrameEvidenceIds,
    request.frameSamples.map((sample) => sample.frameEvidenceId),
    'Visual Language consumed-frame evidence does not match the request.',
  )
  validateMatchingEvidenceManifest(request.evidence, value.evidence)
  const findings = validateFindings(request, value.findings)
  validateCoverage(request, value.coverage)
  validateSummary(findings, value.summary)
  validateExecution(value.runtimeSource, value.execution)
  validateModel(value.runtimeSource, value.model)
  validateProvenance(value.provenance)
  validateUsage(request, value.usage)
  validatePrivacy(value.privacy)
  validateAllFalseObject(value.copySafety, [
    'exactReferenceLayoutRetained', 'exactFrameCompositionCopyInstructionCreated',
    'exactVisibleTextRetained', 'exactTransitionOrCameraPathCopyInstructionCreated',
    'creatorIdentityTransferInstructionCreated', 'copyrightedAssetTransferInstructionCreated',
  ], 'Visual Language copy-safety boundary is invalid.')
  validateFactSafety(request, value.factSafety)
  validateTransferBoundary(value.transferBoundary)
}

function validateFindings(
  request: EditReferenceVisualLanguageStudyRequest,
  value: unknown,
): readonly EditReferenceVisualLanguageFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FINDINGS) {
    throw new Error('Visual Language findings are outside the approved bound.')
  }
  const frameEvidenceIds = new Set(request.frameSamples.map((sample) => sample.frameEvidenceId))
  const factEvidenceIds = new Set(request.evidence.factSafetyEvidenceIds)
  const allowedEvidenceIds = new Set([...frameEvidenceIds, ...evidenceIds(request.evidence)])
  const findingIds = new Set<string>()
  for (const finding of value) {
    if (!isRecord(finding)) throw new Error('Visual Language finding is invalid.')
    assertExactKeys(finding, [
      'findingId', 'category', 'summary', 'evidenceIds', 'confidence', 'transferability',
      'targetAdaptationRequired', 'requiresUserReview', 'identityRelated', 'factSafetyStatus',
      'visibleTextInterpretation', 'exactReferenceLayoutRetained',
      'exactFrameCompositionInstructionCreated', 'exactVisibleTextRetained',
      'exactTransitionOrCameraPathInstructionCreated', 'identityTransferInstructionCreated',
      'copyrightedAssetTransferInstructionCreated',
    ], 'finding')
    assertId(finding.findingId, 'Visual Language finding ID is invalid.')
    if (findingIds.has(finding.findingId as string)) throw new Error('Visual Language finding IDs must be unique.')
    findingIds.add(finding.findingId as string)
    if (!FINDING_CATEGORIES.has(finding.category as EditReferenceVisualLanguageFindingCategory)) {
      throw new Error('Visual Language finding category is invalid.')
    }
    assertSafeText(finding.summary, 1_000, 'Visual Language finding summary is invalid.')
    assertIdArray(finding.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Visual Language finding evidence IDs are invalid.')
    if (!(finding.evidenceIds as string[]).every((id) => allowedEvidenceIds.has(id))) {
      throw new Error('Visual Language finding references evidence outside the exact request.')
    }
    if (!(finding.evidenceIds as string[]).some((id) => frameEvidenceIds.has(id))) {
      throw new Error('Visual Language findings require bounded frame evidence, not technical summaries alone.')
    }
    assertUnitInterval(finding.confidence, 'Visual Language finding confidence is invalid.', true)
    if (!TRANSFERABILITIES.has(finding.transferability as EditReferenceVisualLanguageTransferability)) {
      throw new Error('Visual Language finding transferability is invalid.')
    }
    if (
      finding.targetAdaptationRequired !== true
      || typeof finding.requiresUserReview !== 'boolean'
      || typeof finding.identityRelated !== 'boolean'
    ) throw new Error('Visual Language target-adaptation or review boundary is invalid.')
    if (finding.transferability === 'non_transferable' && finding.requiresUserReview !== true) {
      throw new Error('Non-transferable Visual Language findings require user review.')
    }
    if (!['not_applicable', 'bounded_by_evidence', 'requires_review'].includes(String(finding.factSafetyStatus))) {
      throw new Error('Visual Language finding fact-safety status is invalid.')
    }
    if (!['not_applicable', 'geometry_only', 'ocr_backed'].includes(String(finding.visibleTextInterpretation))) {
      throw new Error('Visual Language finding visible-text interpretation is invalid.')
    }
    if (finding.category === 'caption_visible_text_and_overlay') {
      const expected = request.visibleTextEvidenceMode === 'not_requested' ? null : request.visibleTextEvidenceMode
      if (expected === null || finding.visibleTextInterpretation !== expected) {
        throw new Error('Visual Language caption/visible-text finding lacks approved text evidence.')
      }
      const relevantIds = request.visibleTextEvidenceMode === 'ocr_backed'
        ? new Set(request.evidence.ocrEvidenceIds)
        : new Set(request.evidence.captionGeometryEvidenceIds)
      if (!(finding.evidenceIds as string[]).some((id) => relevantIds.has(id))) {
        throw new Error('Visual Language caption/visible-text finding must cite the exact text evidence mode.')
      }
    } else if (finding.visibleTextInterpretation !== 'not_applicable') {
      throw new Error('Non-caption Visual Language findings cannot claim visible-text interpretation.')
    }
    if (finding.identityRelated) {
      if (!request.realPersonOrClaimContextPresent || finding.factSafetyStatus === 'not_applicable') {
        throw new Error('Visual Language identity findings require declared context and fact-safety review.')
      }
      if (!(finding.evidenceIds as string[]).some((id) => factEvidenceIds.has(id))) {
        throw new Error('Visual Language identity findings require exact fact-safety evidence.')
      }
    } else if (finding.factSafetyStatus !== 'not_applicable') {
      throw new Error('Visual Language non-identity findings must use not-applicable fact safety.')
    }
    for (const key of [
      'exactReferenceLayoutRetained', 'exactFrameCompositionInstructionCreated', 'exactVisibleTextRetained',
      'exactTransitionOrCameraPathInstructionCreated', 'identityTransferInstructionCreated',
      'copyrightedAssetTransferInstructionCreated',
    ] as const) {
      if (finding[key] !== false) throw new Error('Visual Language finding violates the no-copy boundary.')
    }
  }
  return value as EditReferenceVisualLanguageFinding[]
}

function validateCoverage(request: EditReferenceVisualLanguageStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language coverage is invalid.')
  assertExactKeys(value, [
    'evidenceItemCount', 'representativeFrameCount', 'keyframeCount', 'visibleTextEvidenceMode',
    'realPersonOrClaimContextPresent', 'partial', 'missingEvidenceKinds',
  ], 'coverage')
  const representativeFrameCount = request.frameSamples.filter((sample) => sample.role === 'representative').length
  const keyframeCount = request.frameSamples.filter((sample) => sample.role === 'keyframe').length
  if (
    value.evidenceItemCount !== allEvidenceIds(request).length
    || value.representativeFrameCount !== representativeFrameCount
    || value.keyframeCount !== keyframeCount
    || value.visibleTextEvidenceMode !== request.visibleTextEvidenceMode
    || value.realPersonOrClaimContextPresent !== request.realPersonOrClaimContextPresent
  ) throw new Error('Visual Language coverage does not match the request.')
  if (typeof value.partial !== 'boolean') throw new Error('Visual Language partial-coverage flag is invalid.')
  assertIdArray(value.missingEvidenceKinds, 16, true, 'Visual Language missing-evidence kinds are invalid.')
  if (value.partial !== ((value.missingEvidenceKinds as string[]).length > 0)) {
    throw new Error('Visual Language partial coverage and missing-evidence list are inconsistent.')
  }
}

function validateSummary(findings: readonly EditReferenceVisualLanguageFinding[], value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language summary is invalid.')
  assertExactKeys(value, [
    'findingCount', 'transferablePrincipleCount', 'contextOnlyCount', 'nonTransferableCount', 'averageConfidence',
  ], 'summary')
  const counts = {
    transferable_principle: findings.filter((finding) => finding.transferability === 'transferable_principle').length,
    context_only: findings.filter((finding) => finding.transferability === 'context_only').length,
    non_transferable: findings.filter((finding) => finding.transferability === 'non_transferable').length,
  }
  if (
    value.findingCount !== findings.length
    || value.transferablePrincipleCount !== counts.transferable_principle
    || value.contextOnlyCount !== counts.context_only
    || value.nonTransferableCount !== counts.non_transferable
  ) throw new Error('Visual Language summary counts do not match findings.')
  const average = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  if (typeof value.averageConfidence !== 'number' || Math.abs(value.averageConfidence - average) > 0.000_001) {
    throw new Error('Visual Language average confidence does not match findings.')
  }
}

function validateExecution(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language execution evidence is invalid.')
  assertExactKeys(value, [
    'boundedPrivateFramesRead', 'semanticVisualModelExecuted', 'fullMediaRead', 'rawFramesPersisted',
    'externalUrlFetched', 'providerCallMade', 'modelCallMade', 'workerJobCreated',
    'temporaryFramesCleaned', 'remoteMutationMade',
  ], 'execution')
  if (
    value.boundedPrivateFramesRead !== true
    || value.semanticVisualModelExecuted !== true
    || value.modelCallMade !== true
    || value.temporaryFramesCleaned !== true
  ) throw new Error('Visual Language analyzed result lacks bounded visual execution and cleanup proof.')
  for (const key of ['fullMediaRead', 'rawFramesPersisted', 'externalUrlFetched', 'remoteMutationMade'] as const) {
    if (value[key] !== false) throw new Error('Visual Language execution crossed a privacy or remote-mutation boundary.')
  }
  if (typeof value.providerCallMade !== 'boolean' || typeof value.workerJobCreated !== 'boolean') {
    throw new Error('Visual Language execution flags are invalid.')
  }
  if ((runtimeSource === 'verified_live') !== value.providerCallMade) {
    throw new Error('Visual Language provider execution does not match the runtime source.')
  }
}

function validateModel(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language model provenance is invalid.')
  assertExactKeys(value, [
    'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRevision', 'modelAggregateSha256', 'modelRoutingPolicyVersion',
    'visualInstructionDigestSha256',
  ], 'model provenance')
  for (const key of ['adapterId', 'adapterVersion', 'modelId', 'modelRevision', 'modelRoutingPolicyVersion'] as const) {
    assertId(value[key], `Visual Language ${key} is invalid.`)
  }
  assertSha256(value.modelAggregateSha256, 'Visual Language model aggregate checksum is invalid.')
  assertSha256(value.visualInstructionDigestSha256, 'Visual Language instruction digest is invalid.')
  if (runtimeSource === 'verified_live') assertId(value.providerId, 'Live Visual Language results require provider identity.')
  else if (value.providerId !== null) throw new Error('Local Visual Language results cannot claim provider identity.')
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language provenance is invalid.')
  assertExactKeys(value, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  assertId(value.executionId, 'Visual Language execution ID is invalid.')
  assertTimestamp(value.startedAt, 'Visual Language start timestamp is invalid.')
  assertTimestamp(value.completedAt, 'Visual Language completion timestamp is invalid.')
  if (Date.parse(value.completedAt as string) < Date.parse(value.startedAt as string)) {
    throw new Error('Visual Language completion precedes its start.')
  }
}

function validateUsage(request: EditReferenceVisualLanguageStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language usage is invalid.')
  assertExactKeys(value, [
    'mode', 'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'usage')
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Visual Language usage must not calculate customer price, credits, or service fees.')
  assertMoneyMicros(value.meteredInternalCostMicros, 'Visual Language metered internal cost is invalid.')
  assertIdArray(value.usageEventIds, 64, true, 'Visual Language usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Visual Language internal-cost record IDs are invalid.')
  if (request.executionScope === 'controlled_test') {
    if (
      value.mode !== 'controlled_test_unmetered'
      || value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Visual Language usage cannot claim production metering.')
    return
  }
  if (value.mode !== 'production_metered') throw new Error('Production Visual Language usage must be metered.')
  for (const key of ['approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId'] as const) {
    if (value[key] !== request[key]) throw new Error('Visual Language production cost authority does not match the request.')
  }
  if (value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros) {
    throw new Error('Visual Language maximum authorized internal cost does not match the request.')
  }
  assertPositiveMoneyMicros(value.meteredInternalCostMicros, 'Production Visual Language study requires positive metered internal cost.')
  if (BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
    throw new Error('Visual Language metered internal cost exceeds the authorized maximum.')
  }
  if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
    throw new Error('Production Visual Language usage requires usage and internal-cost records.')
  }
}

function validatePrivacy(value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language privacy boundary is invalid.')
  assertExactKeys(value, [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawProviderPayloadPersisted', 'signedUrlPersisted',
    'hiddenChainOfThoughtPersisted', 'temporaryFramesCleaned',
  ], 'privacy')
  for (const key of [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawProviderPayloadPersisted',
    'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
  ] as const) {
    if (value[key] !== false) throw new Error('Visual Language privacy boundary permits raw or private persistence.')
  }
  if (value.temporaryFramesCleaned !== true) throw new Error('Visual Language temporary-frame cleanup is required.')
}

function validateFactSafety(request: EditReferenceVisualLanguageStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language fact-safety result is invalid.')
  assertExactKeys(value, [
    'evidenceRequired', 'evidenceIds', 'unverifiedClaimPresentedAsFact',
    'misleadingRealPersonDepictionInstructionCreated', 'guiltImplyingVisualInstructionCreated',
  ], 'fact safety')
  if (value.evidenceRequired !== request.realPersonOrClaimContextPresent) {
    throw new Error('Visual Language fact-safety requirement does not match the request.')
  }
  assertMatchingIdArray(
    value.evidenceIds,
    request.evidence.factSafetyEvidenceIds,
    'Visual Language fact-safety evidence does not match the request.',
  )
  for (const key of [
    'unverifiedClaimPresentedAsFact', 'misleadingRealPersonDepictionInstructionCreated',
    'guiltImplyingVisualInstructionCreated',
  ] as const) {
    if (value[key] !== false) throw new Error('Visual Language fact-safety result is unsafe.')
  }
}

function validateTransferBoundary(value: unknown): void {
  if (!isRecord(value)) throw new Error('Visual Language transfer boundary is invalid.')
  assertExactKeys(value, [
    'technicalChangePointsTreatedAsSemanticScenes', 'technicalSignalsTreatedAsCreativeMeaning',
    'findingsMayBecomeTargetInstructionsWithoutApplication', 'targetEvidenceRequired',
    'userApprovalRequired', 'exactLayoutOrCameraPathTransferAllowed',
    'visualIdentityTransferAllowed', 'visibleTextTransferAllowed',
  ], 'transfer boundary')
  for (const key of [
    'technicalChangePointsTreatedAsSemanticScenes', 'technicalSignalsTreatedAsCreativeMeaning',
    'findingsMayBecomeTargetInstructionsWithoutApplication', 'exactLayoutOrCameraPathTransferAllowed',
    'visualIdentityTransferAllowed', 'visibleTextTransferAllowed',
  ] as const) {
    if (value[key] !== false) throw new Error('Visual Language transfer boundary permits unsafe inference or copying.')
  }
  if (value.targetEvidenceRequired !== true || value.userApprovalRequired !== true) {
    throw new Error('Visual Language target evidence and user approval are required.')
  }
}

function validateMatchingEvidenceManifest(
  expected: EditReferenceVisualLanguageEvidenceManifest,
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Visual Language result evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds', 'technicalChangePointEvidenceIds', 'technicalSourceConditionEvidenceIds',
    'technicalColorEvidenceIds', 'captionGeometryEvidenceIds', 'ocrEvidenceIds',
    'studyChatGoalEvidenceIds', 'factSafetyEvidenceIds',
  ] as const
  assertExactKeys(value, keys, 'result evidence manifest')
  for (const key of keys) {
    assertMatchingIdArray(value[key], expected[key], `Visual Language ${key} does not match the request.`)
  }
}

function allEvidenceIds(request: EditReferenceVisualLanguageStudyRequest): string[] {
  return [...request.frameSamples.map((sample) => sample.frameEvidenceId), ...evidenceIds(request.evidence)]
}

function evidenceIds(manifest: EditReferenceVisualLanguageEvidenceManifest): string[] {
  return [
    ...manifest.mediaStructureEvidenceIds,
    ...manifest.technicalChangePointEvidenceIds,
    ...manifest.technicalSourceConditionEvidenceIds,
    ...manifest.technicalColorEvidenceIds,
    ...manifest.captionGeometryEvidenceIds,
    ...manifest.ocrEvidenceIds,
    ...manifest.studyChatGoalEvidenceIds,
    ...manifest.factSafetyEvidenceIds,
  ]
}

function copyEvidenceManifest(
  manifest: EditReferenceVisualLanguageEvidenceManifest,
): EditReferenceVisualLanguageEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...manifest.mediaStructureEvidenceIds],
    technicalChangePointEvidenceIds: [...manifest.technicalChangePointEvidenceIds],
    technicalSourceConditionEvidenceIds: [...manifest.technicalSourceConditionEvidenceIds],
    technicalColorEvidenceIds: [...manifest.technicalColorEvidenceIds],
    captionGeometryEvidenceIds: [...manifest.captionGeometryEvidenceIds],
    ocrEvidenceIds: [...manifest.ocrEvidenceIds],
    studyChatGoalEvidenceIds: [...manifest.studyChatGoalEvidenceIds],
    factSafetyEvidenceIds: [...manifest.factSafetyEvidenceIds],
  }
}

function assertNoUnsafeContent(value: unknown, path = 'root'): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoUnsafeContent(entry, `${path}[${index}]`))
    return
  }
  if (!isRecord(value)) {
    if (typeof value === 'string' && UNSAFE_STRING_PATTERN.test(value)) {
      throw new Error(`Visual Language contract contains unsafe content at ${path}.`)
    }
    return
  }
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Visual Language contract contains forbidden field ${key}.`)
    assertNoUnsafeContent(entry, `${path}.${key}`)
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const approved = [...expected].sort()
  if (actual.length !== approved.length || actual.some((key, index) => key !== approved[index])) {
    throw new Error(`Visual Language ${label} fields do not match the approved contract.`)
  }
}

function assertId(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error(message)
}

function assertIdArray(value: unknown, maxLength: number, allowEmpty: boolean, message: string): asserts value is string[] {
  if (
    !Array.isArray(value)
    || (!allowEmpty && value.length < 1)
    || value.length > maxLength
    || value.some((entry) => typeof entry !== 'string' || !ID_PATTERN.test(entry))
    || new Set(value).size !== value.length
  ) throw new Error(message)
}

function assertMatchingIdArray(value: unknown, expected: readonly string[], message: string): void {
  assertIdArray(value, MAX_EVIDENCE_ITEMS, true, message)
  if (value.length !== expected.length || value.some((entry, index) => entry !== expected[index])) throw new Error(message)
}

function assertSha256(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) throw new Error(message)
}

function assertMoneyMicros(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !MONEY_MICROS_PATTERN.test(value)) throw new Error(message)
}

function assertPositiveMoneyMicros(value: unknown, message: string): asserts value is string {
  assertMoneyMicros(value, message)
  if (BigInt(value) <= 0n) throw new Error(message)
}

function assertUnitInterval(value: unknown, message: string, positive = false): asserts value is number {
  if (
    typeof value !== 'number'
    || !Number.isFinite(value)
    || value < (positive ? Number.EPSILON : 0)
    || value > 1
  ) throw new Error(message)
}

function assertSafeText(value: unknown, maxLength: number, message: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength || UNSAFE_STRING_PATTERN.test(value)) {
    throw new Error(message)
  }
}

function assertTimestamp(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error(message)
}

function validateAllFalseObject(value: unknown, keys: readonly string[], message: string): void {
  if (!isRecord(value)) throw new Error(message)
  assertExactKeys(value, keys, 'safety boundary')
  for (const key of keys) if (value[key] !== false) throw new Error(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
