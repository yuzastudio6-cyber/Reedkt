import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_REQUEST_VERSION =
  'edit-reference-graphics-motion-study-request-v1' as const
export const EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION =
  'edit-reference-graphics-motion-study-result-v1' as const

export type EditReferenceGraphicsMotionFindingCategory =
  | 'titles'
  | 'cards'
  | 'lower_thirds'
  | 'icons'
  | 'spacing'
  | 'layout_hierarchy'
  | 'motion_intensity'
  | 'entry_exit_behavior'
  | 'overlay_placement'
  | 'ui_demonstration_patterns'
  | 'transition_motion'

export type EditReferenceGraphicsMotionTransferability =
  | 'transferable_principle'
  | 'context_only'
  | 'non_transferable'

export type EditReferenceGraphicsMotionEvidenceMode =
  | 'frames_and_technical_motion'
  | 'technical_motion_only'

export interface EditReferenceGraphicsMotionFrameEvidence {
  readonly role: 'representative' | 'graphic_detail' | 'motion_keyframe'
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

export interface EditReferenceGraphicsMotionEvidenceManifest {
  readonly mediaStructureEvidenceIds: readonly string[]
  readonly representativeFrameEvidenceIds: readonly string[]
  readonly keyframeEvidenceIds: readonly string[]
  readonly technicalMotionSignalEvidenceIds: readonly string[]
  readonly sceneBoundaryEvidenceIds: readonly string[]
  readonly visualCueTimingEvidenceIds: readonly string[]
  readonly studyChatGoalEvidenceIds: readonly string[]
  readonly visibleTextEvidenceIds: readonly string[]
  readonly rightsAndBrandEvidenceIds: readonly string[]
}

export interface EditReferenceGraphicsMotionTechnicalAuthority {
  readonly schemaVersion: 'edit-reference-technical-motion-signal-v1'
  readonly evidenceId: string
  readonly resultDigestSha256: string
  readonly runtimeSource: 'verified_local'
  readonly executionId: string
  readonly toolIds: readonly ['ffmpeg']
  readonly status: 'verified_local_bounded'
  readonly coverage: 'full' | 'partial'
  readonly sampleCount: number
  readonly scannedDurationSeconds: number
  readonly activityThreshold8Bit: number
  readonly highActivityThreshold8Bit: number
  readonly activeSampleRatio: number
  readonly highActivitySampleRatio: number
  readonly peakSampleCount: number
  readonly technicalFrameDifferenceAnalysisRan: true
  readonly semanticMotionAnalysisRan: false
  readonly cameraMotionInferenceRan: false
  readonly objectTrackingRan: false
  readonly transitionClassificationRan: false
  readonly graphicsEntryExitAnalysisRan: false
  readonly opticalFlowAnalysisRan: false
  readonly rawFramePixelsPersisted: false
  readonly rawDifferenceFramesPersisted: false
  readonly rawHistogramPersisted: false
  readonly rawProcessOutputPersisted: false
}

export interface EditReferenceGraphicsMotionStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly frameManifestDigestSha256: string
  readonly technicalMotionResultDigestSha256: string
  readonly privateArtifactAccessVerified: true
  readonly privateArtifactFinalized: true
  readonly mediaChecksumVerified: true
  readonly evidenceAuthorityVerified: true
  readonly frameAuthorityVerified: boolean
  readonly technicalMotionAuthorityVerified: true
  readonly evidenceMode: EditReferenceGraphicsMotionEvidenceMode
  readonly frameSamples: readonly EditReferenceGraphicsMotionFrameEvidence[]
  readonly evidence: EditReferenceGraphicsMotionEvidenceManifest
  readonly technicalMotionAuthority: EditReferenceGraphicsMotionTechnicalAuthority
  readonly sourceDurationSeconds: number
  readonly analysisWindowStartSeconds: number
  readonly analysisWindowEndSeconds: number
  readonly verifiedVisibleTextEvidenceAvailable: boolean
  readonly verifiedVisualCueTimingAvailable: boolean
  readonly sourceBrandOrUiIdentityPresent: boolean
  readonly maxFrameCount: number
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
  readonly rawFramePersistenceAllowed: false
  readonly rawDifferenceFramePersistenceAllowed: false
  readonly rawProviderPayloadPersistenceAllowed: false
  readonly technicalMotionMayEstablishSemanticGraphicsMotionIntent: false
  readonly exactGraphicAssetTransferAllowed: false
  readonly exactReferenceTextOrIconTransferAllowed: false
  readonly exactLayoutOrSpacingTransferAllowed: false
  readonly exactAnimationKeyframeOrCurveTransferAllowed: false
  readonly exactTransitionPathOrTimingTransferAllowed: false
  readonly exactBrandOrUiIdentityTransferAllowed: false
  readonly ownedTargetBrandAssetsHandledBySeparateTargetAssetWorkflow: true
  readonly referenceDerivedGraphicsOrMotionGenerationAllowed: false
  readonly executableTargetGraphicsMotionOperationAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceGraphicsMotionSourceRange {
  readonly rangeId: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly evidenceIds: readonly string[]
  readonly frameEvidenceIds: readonly string[]
  readonly sourceEvidenceOnly: true
  readonly targetLayoutOrMotionInstructionCreated: false
  readonly sourceGraphicAssetCopied: false
  readonly executableGraphicsMotionOperationCreated: false
}

export interface EditReferenceGraphicsMotionFinding {
  readonly findingId: string
  readonly category: EditReferenceGraphicsMotionFindingCategory
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly frameEvidenceIds: readonly string[]
  readonly sourceRanges: readonly EditReferenceGraphicsMotionSourceRange[]
  readonly confidence: number
  readonly transferability: EditReferenceGraphicsMotionTransferability
  readonly targetAdaptationRequired: true
  readonly requiresUserReview: boolean
  readonly visibleTextRelated: boolean
  readonly brandOrUiIdentityRelated: boolean
  readonly timingRelated: boolean
  readonly observedGraphicsMotionCharacterOnly: true
  readonly generalizedTargetAdaptablePrincipleOnly: true
  readonly technicalMotionContextOnly: true
  readonly exactGraphicAssetsRetained: false
  readonly exactReferenceTextOrIconIdentityRetained: false
  readonly exactLayoutOrSpacingValuesRetained: false
  readonly exactAnimationKeyframesOrCurvesRetained: false
  readonly exactTransitionPathOrTimingRetained: false
  readonly exactBrandOrUiIdentityRetained: false
  readonly sourceGraphicOrUiAssetCopied: false
  readonly executableTargetGraphicsMotionOperationCreated: false
}

export interface EditReferenceAnalyzedGraphicsMotionStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION
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
  readonly technicalMotionResultDigestSha256: string
  readonly consumedFrameEvidenceIds: readonly string[]
  readonly evidence: EditReferenceGraphicsMotionEvidenceManifest
  readonly technicalMotionAuthority: EditReferenceGraphicsMotionTechnicalAuthority
  readonly findings: readonly EditReferenceGraphicsMotionFinding[]
  readonly coverage: {
    readonly evidenceItemCount: number
    readonly frameCount: number
    readonly representativeFrameCount: number
    readonly motionKeyframeCount: number
    readonly technicalSampleCount: number
    readonly sourceDurationSeconds: number
    readonly analysisWindowStartSeconds: number
    readonly analysisWindowEndSeconds: number
    readonly analyzedDurationSeconds: number
    readonly evidenceMode: 'frames_and_technical_motion'
    readonly visibleTextEvidenceAvailable: boolean
    readonly visualCueTimingAvailable: boolean
    readonly partial: boolean
    readonly missingEvidenceKinds: readonly string[]
  }
  readonly summary: {
    readonly findingCount: number
    readonly categoryCount: number
    readonly transferablePrincipleCount: number
    readonly contextOnlyCount: number
    readonly nonTransferableCount: number
    readonly averageConfidence: number
  }
  readonly execution: {
    readonly boundedPrivateFramesRead: true
    readonly technicalMotionResultRead: true
    readonly semanticGraphicsMotionModelExecuted: true
    readonly rawFullMediaRead: false
    readonly rawDifferenceFrameRead: false
    readonly externalUrlFetched: false
    readonly providerCallMade: boolean
    readonly modelCallMade: true
    readonly workerJobCreated: boolean
    readonly temporaryFramesCleaned: true
    readonly remoteMutationMade: false
  }
  readonly analyzer: {
    readonly adapterId: string
    readonly adapterVersion: string
    readonly providerId: string | null
    readonly modelId: string
    readonly modelRevision: string
    readonly modelAggregateSha256: string
    readonly modelRoutingPolicyVersion: string
    readonly analysisInstructionDigestSha256: string
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
    readonly rawDifferenceFramesPersisted: false
    readonly rawProviderPayloadPersisted: false
    readonly signedUrlPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly temporaryFramesCleaned: true
  }
  readonly copySafety: {
    readonly exactGraphicAssetTransferInstructionCreated: false
    readonly exactReferenceTextOrIconTransferInstructionCreated: false
    readonly exactLayoutOrSpacingTransferInstructionCreated: false
    readonly exactAnimationKeyframeOrCurveTransferInstructionCreated: false
    readonly exactTransitionPathOrTimingTransferInstructionCreated: false
    readonly exactBrandOrUiIdentityTransferInstructionCreated: false
    readonly referenceDerivedGraphicsOrMotionGenerationInstructionCreated: false
    readonly sourceGraphicOrUiAssetCopied: false
  }
  readonly motionSafety: {
    readonly technicalMotionTreatedAsSemanticIntent: false
    readonly targetConfirmedOutputFrameRequired: true
    readonly targetFrameLayoutAndSafeZonesRequired: true
    readonly targetCaptionCollisionQaRequired: true
    readonly targetSpeakerSubjectAndHeroSafePlacementQaRequired: true
    readonly targetVisibleTextReadabilityQaRequired: boolean
    readonly targetBrandOrUiIdentityReviewRequired: boolean
    readonly targetFinalRenderMotionQaRequired: true
    readonly cameraOrSubjectMotionClaimedWithoutSemanticEvidence: false
    readonly cutOrTransitionClassifiedFromTechnicalDifferences: false
    readonly randomDecorativeMotionInstructionCreated: false
  }
  readonly transferBoundary: {
    readonly findingsMayBecomeTargetInstructionsWithoutApplication: false
    readonly targetEvidenceRequired: true
    readonly targetMediaGraphicsMotionAnalysisRequired: true
    readonly targetMeaningAndContentHierarchyReviewRequired: true
    readonly targetVisualCueAndTimingReviewRequired: true
    readonly confirmedOutputFrameAndLayoutRequired: true
    readonly masterTimingPlanRequired: true
    readonly frameLayoutPlanRequired: true
    readonly renderStrategyPlanRequired: true
    readonly timingValidationRequired: true
    readonly userApprovalRequired: true
    readonly ownedTargetBrandAssetsRequireSeparateTargetAssetApproval: true
    readonly exactReferenceGraphicsLayoutOrMotionTransferAllowed: false
    readonly remotionOrDeterministicRenderExecutionCreated: false
    readonly generatedAssetOrProviderPromptCreated: false
  }
}

export interface EditReferenceGraphicsMotionNeedsMoreEvidenceResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'needs_more_evidence'
  readonly evidenceMode: 'technical_motion_only'
  readonly missingEvidenceKinds: readonly ['bounded_semantic_graphics_motion_frame_evidence']
  readonly findings: readonly []
  readonly retryAvailable: true
  readonly retryReason: string
  readonly technicalMotionTreatedAsSemanticIntent: false
  readonly providerCallMade: false
  readonly modelCallMade: false
  readonly workerJobCreated: false
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

export type EditReferenceGraphicsMotionStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'frame_authority_unverified'
  | 'graphics_motion_frames_unavailable'
  | 'technical_motion_result_unavailable'
  | 'technical_motion_authority_unverified'
  | 'evidence_authority_unverified'
  | 'visible_text_evidence_required'
  | 'rights_brand_or_ui_evidence_required'
  | 'cost_authority_unavailable'
  | 'model_routing_unavailable'
  | 'privacy_policy_denied'
  | 'runtime_response_invalid'
  | 'ephemeral_cleanup_failed'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedGraphicsMotionStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceGraphicsMotionStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly findings: readonly []
  readonly boundedPrivateFramesRead: boolean
  readonly technicalMotionResultRead: boolean
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

export type EditReferenceGraphicsMotionStudyResult =
  | EditReferenceAnalyzedGraphicsMotionStudyResult
  | EditReferenceGraphicsMotionNeedsMoreEvidenceResult
  | EditReferenceBlockedGraphicsMotionStudyResult

export interface EditReferenceGraphicsMotionStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  analyze(request: EditReferenceGraphicsMotionStudyRequest): Promise<EditReferenceGraphicsMotionStudyResult>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const MAX_FRAME_COUNT = 8
const MAX_EVIDENCE_ITEMS = 64
const MAX_STRUCTURED_CONTEXT_CHARACTERS = 32_000
const MAX_SCAN_DURATION_SECONDS = 120
const MAX_FINDINGS = 64
const MAX_SOURCE_RANGES_PER_FINDING = 8

const FINDING_CATEGORIES = new Set<EditReferenceGraphicsMotionFindingCategory>([
  'titles', 'cards', 'lower_thirds',
  'icons', 'spacing', 'layout_hierarchy', 'motion_intensity',
  'entry_exit_behavior', 'overlay_placement', 'ui_demonstration_patterns', 'transition_motion',
])
const TRANSFERABILITIES = new Set<EditReferenceGraphicsMotionTransferability>([
  'transferable_principle', 'context_only', 'non_transferable',
])
const EVIDENCE_MODES = new Set<EditReferenceGraphicsMotionEvidenceMode>([
  'frames_and_technical_motion', 'technical_motion_only',
])
const BLOCKER_CODES = new Set<EditReferenceGraphicsMotionStudyBlockerCode>([
  'adapter_unavailable', 'private_artifact_unavailable', 'frame_authority_unverified',
  'graphics_motion_frames_unavailable', 'technical_motion_result_unavailable',
  'technical_motion_authority_unverified', 'evidence_authority_unverified',
  'visible_text_evidence_required', 'rights_brand_or_ui_evidence_required',
  'cost_authority_unavailable', 'model_routing_unavailable', 'privacy_policy_denied',
  'runtime_response_invalid', 'ephemeral_cleanup_failed', 'copy_safety_violation',
  'internal_cost_usage_unverified',
])
const VISIBLE_TEXT_CATEGORIES = new Set<EditReferenceGraphicsMotionFindingCategory>([
  'titles', 'cards', 'lower_thirds', 'ui_demonstration_patterns',
])
const TIMING_CATEGORIES = new Set<EditReferenceGraphicsMotionFindingCategory>([
  'motion_intensity', 'entry_exit_behavior', 'transition_motion',
])
const FORBIDDEN_KEYS = new Set([
  'apiKey', 'api_key', 'authorization', 'bytes', 'chainOfThought', 'chain_of_thought',
  'exactAnimationCurve', 'exactGraphicAsset', 'exactIconAsset', 'exactKeyframes',
  'exactLayout', 'exactSpacing', 'exactTransitionPath', 'filePath', 'file_path',
  'hiddenReasoning', 'localPath', 'local_path', 'password', 'payload', 'prompt',
  'rawDifferenceFrame', 'rawDifferenceFrames', 'rawFrame', 'rawFrames', 'rawHistogram',
  'rawMedia', 'rawPayload', 'rawProviderPayload', 'secret', 'signedUrl', 'signed_url',
  'sourceBrandAsset', 'sourceGraphicAsset', 'sourceUiAsset', 'token', 'tokens', 'url',
])
const UNSAFE_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

export function computeEditReferenceGraphicsMotionStudyRequestDigest(
  request: EditReferenceGraphicsMotionStudyRequest,
): string {
  assertEditReferenceGraphicsMotionStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function assertEditReferenceGraphicsMotionStudyRequest(
  value: unknown,
): asserts value is EditReferenceGraphicsMotionStudyRequest {
  assertNoForbiddenContent(value, 'request')
  if (!isRecord(value)) throw new Error('Graphics/Motion request must be an object.')
  assertExactKeys(value, [
    'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'frameManifestDigestSha256', 'technicalMotionResultDigestSha256',
    'privateArtifactAccessVerified', 'privateArtifactFinalized', 'mediaChecksumVerified',
    'evidenceAuthorityVerified', 'frameAuthorityVerified', 'technicalMotionAuthorityVerified',
    'evidenceMode', 'frameSamples', 'evidence', 'technicalMotionAuthority',
    'sourceDurationSeconds', 'analysisWindowStartSeconds', 'analysisWindowEndSeconds',
    'verifiedVisibleTextEvidenceAvailable', 'verifiedVisualCueTimingAvailable',
    'sourceBrandOrUiIdentityPresent', 'maxFrameCount',
    'maxEvidenceItems', 'maxStructuredContextCharacters', 'maxScanDurationSeconds',
    'executionScope', 'approvedUsageEstimateId', 'internalCostBudgetId',
    'immutableRateCardSnapshotId', 'maximumAuthorizedInternalCostMicros',
    'boundedPrivateFrameInputAllowed', 'rawFullMediaInputAllowed',
    'rawFramePersistenceAllowed', 'rawDifferenceFramePersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed',
    'technicalMotionMayEstablishSemanticGraphicsMotionIntent',
    'exactGraphicAssetTransferAllowed', 'exactReferenceTextOrIconTransferAllowed',
    'exactLayoutOrSpacingTransferAllowed', 'exactAnimationKeyframeOrCurveTransferAllowed',
    'exactTransitionPathOrTimingTransferAllowed', 'exactBrandOrUiIdentityTransferAllowed',
    'ownedTargetBrandAssetsHandledBySeparateTargetAssetWorkflow', 'referenceDerivedGraphicsOrMotionGenerationAllowed',
    'executableTargetGraphicsMotionOperationAllowed', 'externalUrlFetchAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_REQUEST_VERSION) {
    throw new Error('Graphics/Motion request version is unsupported.')
  }
  for (const key of [
    'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId',
  ] as const) assertId(value[key], `Graphics/Motion ${key} is invalid.`)
  for (const key of [
    'mediaChecksumSha256', 'evidenceManifestDigestSha256', 'frameManifestDigestSha256',
    'technicalMotionResultDigestSha256',
  ] as const) assertSha256(value[key], `Graphics/Motion ${key} is invalid.`)
  if (
    value.privateArtifactAccessVerified !== true
    || value.privateArtifactFinalized !== true
    || value.mediaChecksumVerified !== true
    || value.evidenceAuthorityVerified !== true
    || value.technicalMotionAuthorityVerified !== true
  ) throw new Error('Graphics/Motion private artifact and evidence authority must be verified.')
  if (!EVIDENCE_MODES.has(value.evidenceMode as EditReferenceGraphicsMotionEvidenceMode)) {
    throw new Error('Graphics/Motion evidence mode is invalid.')
  }
  validateFrames(value)
  validateEvidenceManifest(value.evidence, value)
  validateTechnicalAuthority(value.technicalMotionAuthority, value)
  validateWindowAndBounds(value)
  validateRequestCostAuthority(value)
  validateRequestSafetyFlags(value)
}

export function assertEditReferenceGraphicsMotionStudyResult(
  request: EditReferenceGraphicsMotionStudyRequest,
  value: unknown,
): asserts value is EditReferenceGraphicsMotionStudyResult {
  assertEditReferenceGraphicsMotionStudyRequest(request)
  assertNoForbiddenContent(value, 'result')
  if (!isRecord(value)) throw new Error('Graphics/Motion result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION) {
    throw new Error('Graphics/Motion result version is unsupported.')
  }
  const digest = computeEditReferenceGraphicsMotionStudyRequestDigest(request)
  if (value.requestDigestSha256 !== digest) throw new Error('Graphics/Motion result request digest does not match.')
  if (value.status === 'blocked') return validateBlockedResult(request, value)
  if (value.status === 'needs_more_evidence') return validateNeedsMoreEvidenceResult(request, value)
  if (value.status !== 'analyzed') throw new Error('Graphics/Motion result status is invalid.')
  validateAnalyzedResult(request, value)
}

export function createBlockedEditReferenceGraphicsMotionStudyResult(input: {
  request: EditReferenceGraphicsMotionStudyRequest
  blockerCode: EditReferenceGraphicsMotionStudyBlockerCode
  blockerMessage: string
  retryAvailable: boolean
  retryReason?: string
  execution?: {
    readonly boundedPrivateFramesRead?: boolean
    readonly technicalMotionResultRead?: boolean
    readonly providerCallMade?: boolean
    readonly modelCallMade?: boolean
    readonly workerJobCreated?: boolean
    readonly temporaryFramesCleaned?: boolean
  }
  usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}): EditReferenceBlockedGraphicsMotionStudyResult {
  assertEditReferenceGraphicsMotionStudyRequest(input.request)
  if (!BLOCKER_CODES.has(input.blockerCode)) throw new Error('Graphics/Motion blocker code is invalid.')
  assertSafeText(input.blockerMessage, 500, 'Graphics/Motion blocker message is invalid.')
  if (input.retryReason !== undefined) assertSafeText(input.retryReason, 500, 'Graphics/Motion retry reason is invalid.')
  if (input.retryAvailable !== (input.retryReason !== undefined)) {
    throw new Error('Graphics/Motion retry reason must match retry availability.')
  }
  const result: EditReferenceBlockedGraphicsMotionStudyResult = {
    schemaVersion: EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceGraphicsMotionStudyRequestDigest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    retryReason: input.retryReason ?? null,
    findings: [],
    boundedPrivateFramesRead: input.execution?.boundedPrivateFramesRead ?? false,
    technicalMotionResultRead: input.execution?.technicalMotionResultRead ?? false,
    providerCallMade: input.execution?.providerCallMade ?? false,
    modelCallMade: input.execution?.modelCallMade ?? false,
    workerJobCreated: input.execution?.workerJobCreated ?? false,
    temporaryFramesCleaned: input.execution?.temporaryFramesCleaned ?? true,
    internalCostStatus: input.usage?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: input.usage ? input.usage.meteredInternalCostMicros : '0',
    usageEventIds: [...(input.usage?.usageEventIds ?? [])],
    internalCostRecordIds: [...(input.usage?.internalCostRecordIds ?? [])],
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  assertEditReferenceGraphicsMotionStudyResult(input.request, result)
  return result
}

export function createNeedsMoreEvidenceGraphicsMotionStudyResult(
  request: EditReferenceGraphicsMotionStudyRequest,
  retryReason: string,
): EditReferenceGraphicsMotionNeedsMoreEvidenceResult {
  assertEditReferenceGraphicsMotionStudyRequest(request)
  if (request.evidenceMode !== 'technical_motion_only') {
    throw new Error('Only technical-motion-only Graphics/Motion requests use the partial-evidence result.')
  }
  assertSafeText(retryReason, 500, 'Graphics/Motion retry reason is invalid.')
  return {
    schemaVersion: EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceGraphicsMotionStudyRequestDigest(request),
    status: 'needs_more_evidence',
    evidenceMode: 'technical_motion_only',
    missingEvidenceKinds: ['bounded_semantic_graphics_motion_frame_evidence'],
    findings: [],
    retryAvailable: true,
    retryReason,
    technicalMotionTreatedAsSemanticIntent: false,
    providerCallMade: false,
    modelCallMade: false,
    workerJobCreated: false,
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

function stableRequestPayload(request: EditReferenceGraphicsMotionStudyRequest): string {
  return JSON.stringify({
    ...request,
    frameSamples: [...request.frameSamples]
      .sort((left, right) => left.frameEvidenceId.localeCompare(right.frameEvidenceId)),
    evidence: normalizedEvidenceManifest(request.evidence),
    technicalMotionAuthority: {
      ...request.technicalMotionAuthority,
      toolIds: [...request.technicalMotionAuthority.toolIds].sort(),
    },
  })
}

function validateFrames(request: Record<string, unknown>): void {
  if (!Array.isArray(request.frameSamples)) throw new Error('Graphics/Motion frames are invalid.')
  const frames = request.frameSamples as unknown[]
  if (request.evidenceMode === 'frames_and_technical_motion') {
    if (request.frameAuthorityVerified !== true || frames.length < 1 || frames.length > MAX_FRAME_COUNT) {
      throw new Error('Graphics/Motion semantic analysis requires bounded verified frame authority.')
    }
  } else if (request.frameAuthorityVerified !== false || frames.length !== 0) {
    throw new Error('Technical-signal-only Graphics/Motion requests cannot claim frame authority.')
  }
  const frameIds = new Set<string>()
  const artifactIds = new Set<string>()
  for (const frame of frames) {
    if (!isRecord(frame)) throw new Error('Graphics/Motion frame evidence is invalid.')
    assertExactKeys(frame, [
      'role', 'frameEvidenceId', 'privateFrameArtifactId', 'frameChecksumSha256',
      'sourceTimeSeconds', 'width', 'height', 'privateAccessVerified', 'ephemeral',
      'cleanupRequired',
    ], 'frame evidence')
    if (!['representative', 'graphic_detail', 'motion_keyframe'].includes(String(frame.role))) {
      throw new Error('Graphics/Motion frame role is invalid.')
    }
    assertId(frame.frameEvidenceId, 'Graphics/Motion frame evidence ID is invalid.')
    assertId(frame.privateFrameArtifactId, 'Graphics/Motion private frame artifact ID is invalid.')
    assertSha256(frame.frameChecksumSha256, 'Graphics/Motion frame checksum is invalid.')
    if (frameIds.has(frame.frameEvidenceId) || artifactIds.has(frame.privateFrameArtifactId)) {
      throw new Error('Graphics/Motion frame identities must be unique.')
    }
    frameIds.add(frame.frameEvidenceId)
    artifactIds.add(frame.privateFrameArtifactId)
    if (
      typeof frame.sourceTimeSeconds !== 'number'
      || !Number.isFinite(frame.sourceTimeSeconds)
      || frame.sourceTimeSeconds < 0
      || typeof frame.width !== 'number'
      || !Number.isSafeInteger(frame.width)
      || frame.width < 16
      || frame.width > 16_384
      || typeof frame.height !== 'number'
      || !Number.isSafeInteger(frame.height)
      || frame.height < 16
      || frame.height > 16_384
      || frame.privateAccessVerified !== true
      || frame.ephemeral !== true
      || frame.cleanupRequired !== true
    ) throw new Error('Graphics/Motion frame evidence is outside the approved boundary.')
  }
  if (
    request.evidenceMode === 'frames_and_technical_motion'
    && (
      !(frames as Array<Record<string, unknown>>).some((frame) => frame.role === 'representative')
      || (frames as Array<Record<string, unknown>>).filter((frame) => frame.role === 'motion_keyframe').length < 2
    )
  ) throw new Error('Graphics/Motion analysis requires a representative frame and two motion keyframes.')
}

function validateEvidenceManifest(value: unknown, request: Record<string, unknown>): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds', 'representativeFrameEvidenceIds',
    'keyframeEvidenceIds', 'technicalMotionSignalEvidenceIds', 'sceneBoundaryEvidenceIds',
    'visualCueTimingEvidenceIds',
    'studyChatGoalEvidenceIds', 'visibleTextEvidenceIds', 'rightsAndBrandEvidenceIds',
  ] as const
  assertExactKeys(value, [...keys], 'evidence manifest')
  for (const key of keys) assertIdArray(value[key], MAX_EVIDENCE_ITEMS, true, `Graphics/Motion ${key} are invalid.`)
  const evidence = value as unknown as EditReferenceGraphicsMotionEvidenceManifest
  if (
    evidence.mediaStructureEvidenceIds.length < 1
    || evidence.technicalMotionSignalEvidenceIds.length < 1
    || evidence.sceneBoundaryEvidenceIds.length < 1
    || evidence.studyChatGoalEvidenceIds.length < 1
  ) {
    throw new Error('Graphics/Motion requires media, technical-motion, scene, and goal evidence.')
  }
  const frames = request.frameSamples as EditReferenceGraphicsMotionFrameEvidence[]
  const representativeFrames = frames
    .filter((frame) => frame.role !== 'motion_keyframe')
    .map((frame) => frame.frameEvidenceId)
  const keyframes = frames
    .filter((frame) => frame.role === 'motion_keyframe')
    .map((frame) => frame.frameEvidenceId)
  if (
    !sameStringSet(evidence.representativeFrameEvidenceIds, representativeFrames)
    || !sameStringSet(evidence.keyframeEvidenceIds, keyframes)
  ) {
    throw new Error('Graphics/Motion representative-frame and keyframe evidence do not match their frame authority.')
  }
  if (request.verifiedVisibleTextEvidenceAvailable === true && evidence.visibleTextEvidenceIds.length < 1) {
    throw new Error('Graphics/Motion visible-text context requires visible-text evidence.')
  }
  if (request.verifiedVisibleTextEvidenceAvailable === false && evidence.visibleTextEvidenceIds.length > 0) {
    throw new Error('Graphics/Motion visible-text evidence contradicts the request.')
  }
  if (request.verifiedVisualCueTimingAvailable === true && evidence.visualCueTimingEvidenceIds.length < 1) {
    throw new Error('Graphics/Motion visual-cue timing requires verified visual-cue evidence.')
  }
  if (request.verifiedVisualCueTimingAvailable === false && evidence.visualCueTimingEvidenceIds.length > 0) {
    throw new Error('Graphics/Motion visual-cue evidence contradicts the request.')
  }
  if (request.sourceBrandOrUiIdentityPresent === true && evidence.rightsAndBrandEvidenceIds.length < 1) {
    throw new Error('Graphics/Motion brand or UI identity context requires rights evidence.')
  }
  const all = allEvidence(evidence)
  if (all.length < 4 || all.length > MAX_EVIDENCE_ITEMS || new Set(all).size !== all.length) {
    throw new Error('Graphics/Motion evidence IDs must be unique and bounded.')
  }
}

function validateTechnicalAuthority(value: unknown, request: Record<string, unknown>): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion technical authority is invalid.')
  assertExactKeys(value, [
    'schemaVersion', 'evidenceId', 'resultDigestSha256', 'runtimeSource', 'executionId',
    'toolIds', 'status', 'coverage', 'sampleCount', 'scannedDurationSeconds',
    'activityThreshold8Bit', 'highActivityThreshold8Bit', 'activeSampleRatio',
    'highActivitySampleRatio', 'peakSampleCount', 'technicalFrameDifferenceAnalysisRan',
    'semanticMotionAnalysisRan', 'cameraMotionInferenceRan',
    'objectTrackingRan', 'transitionClassificationRan', 'graphicsEntryExitAnalysisRan',
    'opticalFlowAnalysisRan', 'rawFramePixelsPersisted', 'rawDifferenceFramesPersisted',
    'rawHistogramPersisted', 'rawProcessOutputPersisted',
  ], 'technical authority')
  assertId(value.evidenceId, 'Graphics/Motion technical evidence ID is invalid.')
  assertId(value.executionId, 'Graphics/Motion technical execution ID is invalid.')
  assertSha256(value.resultDigestSha256, 'Graphics/Motion technical result digest is invalid.')
  const evidence = (request.evidence as EditReferenceGraphicsMotionEvidenceManifest).technicalMotionSignalEvidenceIds
  if (
    value.schemaVersion !== 'edit-reference-technical-motion-signal-v1'
    || value.resultDigestSha256 !== request.technicalMotionResultDigestSha256
    || !evidence.includes(value.evidenceId as string)
    || value.runtimeSource !== 'verified_local'
    || value.status !== 'verified_local_bounded'
    || !['full', 'partial'].includes(String(value.coverage))
    || !Array.isArray(value.toolIds)
    || value.toolIds.length !== 1
    || !sameStringSet(value.toolIds as string[], ['ffmpeg'])
    || value.technicalFrameDifferenceAnalysisRan !== true
  ) throw new Error('Graphics/Motion technical authority is not exact or verified.')
  assertPositiveSafeInteger(value.sampleCount, 24, 'Graphics/Motion technical sample count is invalid.')
  assertPositiveFinite(value.scannedDurationSeconds, MAX_SCAN_DURATION_SECONDS, 'Graphics/Motion technical duration is invalid.')
  assertUnitInterval(value.activeSampleRatio, 'Graphics/Motion active-sample ratio is invalid.')
  assertUnitInterval(value.highActivitySampleRatio, 'Graphics/Motion high-activity ratio is invalid.')
  if (
    typeof value.activityThreshold8Bit !== 'number'
    || !Number.isFinite(value.activityThreshold8Bit)
    || value.activityThreshold8Bit < 0.1
    || value.activityThreshold8Bit > 255
    || typeof value.highActivityThreshold8Bit !== 'number'
    || !Number.isFinite(value.highActivityThreshold8Bit)
    || value.highActivityThreshold8Bit < value.activityThreshold8Bit
    || value.highActivityThreshold8Bit > 255
    || typeof value.peakSampleCount !== 'number'
    || !Number.isSafeInteger(value.peakSampleCount)
    || value.peakSampleCount < 0
    || value.peakSampleCount > 6
    || value.peakSampleCount > value.sampleCount
    || value.highActivitySampleRatio > value.activeSampleRatio
  ) throw new Error('Graphics/Motion technical motion summaries are invalid.')
  for (const key of [
    'semanticMotionAnalysisRan', 'cameraMotionInferenceRan',
    'objectTrackingRan', 'transitionClassificationRan', 'graphicsEntryExitAnalysisRan',
    'opticalFlowAnalysisRan', 'rawFramePixelsPersisted', 'rawDifferenceFramesPersisted',
    'rawHistogramPersisted', 'rawProcessOutputPersisted',
  ] as const) if (value[key] !== false) throw new Error('Graphics/Motion technical authority overclaims semantic or retained data.')
}

function validateWindowAndBounds(value: Record<string, unknown>): void {
  assertPositiveFinite(value.sourceDurationSeconds, 86_400, 'Graphics/Motion source duration is invalid.')
  if (
    typeof value.analysisWindowStartSeconds !== 'number'
    || !Number.isFinite(value.analysisWindowStartSeconds)
    || value.analysisWindowStartSeconds < 0
    || typeof value.analysisWindowEndSeconds !== 'number'
    || !Number.isFinite(value.analysisWindowEndSeconds)
    || value.analysisWindowEndSeconds <= value.analysisWindowStartSeconds
    || value.analysisWindowEndSeconds > (value.sourceDurationSeconds as number)
    || value.analysisWindowEndSeconds - value.analysisWindowStartSeconds > MAX_SCAN_DURATION_SECONDS
  ) throw new Error('Graphics/Motion analysis window is invalid.')
  if (
    value.maxFrameCount !== MAX_FRAME_COUNT
    || value.maxEvidenceItems !== MAX_EVIDENCE_ITEMS
    || value.maxStructuredContextCharacters !== MAX_STRUCTURED_CONTEXT_CHARACTERS
    || value.maxScanDurationSeconds !== MAX_SCAN_DURATION_SECONDS
    || typeof value.verifiedVisibleTextEvidenceAvailable !== 'boolean'
    || typeof value.verifiedVisualCueTimingAvailable !== 'boolean'
    || typeof value.sourceBrandOrUiIdentityPresent !== 'boolean'
  ) throw new Error('Graphics/Motion bounds or context flags are invalid.')
  const frames = value.frameSamples as EditReferenceGraphicsMotionFrameEvidence[]
  if (frames.some((frame) => frame.sourceTimeSeconds < (value.analysisWindowStartSeconds as number)
    || frame.sourceTimeSeconds > (value.analysisWindowEndSeconds as number))) {
    throw new Error('Graphics/Motion frame is outside the approved analysis window.')
  }
}

function validateRequestCostAuthority(value: Record<string, unknown>): void {
  if (value.executionScope === 'controlled_test') {
    if (
      value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
    ) throw new Error('Controlled Graphics/Motion requests cannot claim production cost authority.')
    return
  }
  if (value.executionScope !== 'production') throw new Error('Graphics/Motion execution scope is invalid.')
  for (const key of ['approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId'] as const) {
    assertId(value[key], `Graphics/Motion ${key} is invalid.`)
  }
  assertPositiveMoneyMicros(value.maximumAuthorizedInternalCostMicros, 'Graphics/Motion maximum cost is invalid.')
}

function validateRequestSafetyFlags(value: Record<string, unknown>): void {
  if (
    value.boundedPrivateFrameInputAllowed !== true
    || value.ownedTargetBrandAssetsHandledBySeparateTargetAssetWorkflow !== true
  ) throw new Error('Graphics/Motion required safety flags are invalid.')
  for (const key of [
    'rawFullMediaInputAllowed', 'rawFramePersistenceAllowed', 'rawDifferenceFramePersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed',
    'technicalMotionMayEstablishSemanticGraphicsMotionIntent',
    'exactGraphicAssetTransferAllowed', 'exactReferenceTextOrIconTransferAllowed',
    'exactLayoutOrSpacingTransferAllowed', 'exactAnimationKeyframeOrCurveTransferAllowed',
    'exactTransitionPathOrTimingTransferAllowed', 'exactBrandOrUiIdentityTransferAllowed',
    'referenceDerivedGraphicsOrMotionGenerationAllowed', 'executableTargetGraphicsMotionOperationAllowed', 'externalUrlFetchAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ] as const) if (value[key] !== false) throw new Error('Graphics/Motion request crossed a safety boundary.')
}

function validateBlockedResult(
  request: EditReferenceGraphicsMotionStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'blockerCode', 'blockerMessage',
    'retryAvailable', 'retryReason', 'findings', 'boundedPrivateFramesRead',
    'technicalMotionResultRead', 'providerCallMade', 'modelCallMade', 'workerJobCreated',
    'temporaryFramesCleaned', 'internalCostStatus', 'meteredInternalCostMicros',
    'usageEventIds', 'internalCostRecordIds', 'remoteMutationMade',
    'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceGraphicsMotionStudyBlockerCode)) {
    throw new Error('Graphics/Motion blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 500, 'Graphics/Motion blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Graphics/Motion retry availability is invalid.')
  if (value.retryReason !== null) assertSafeText(value.retryReason, 500, 'Graphics/Motion retry reason is invalid.')
  if (value.retryAvailable !== (value.retryReason !== null)) throw new Error('Graphics/Motion retry state is inconsistent.')
  if (!Array.isArray(value.findings) || value.findings.length !== 0) {
    throw new Error('Blocked Graphics/Motion results cannot contain findings.')
  }
  for (const key of [
    'boundedPrivateFramesRead', 'technicalMotionResultRead', 'providerCallMade',
    'modelCallMade', 'workerJobCreated', 'temporaryFramesCleaned',
  ] as const) if (typeof value[key] !== 'boolean') {
    throw new Error('Blocked Graphics/Motion execution evidence is invalid.')
  }
  if (
    value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Blocked Graphics/Motion result crossed a remote or customer-charging boundary.')
  if (!['not_incurred', 'metered', 'unverified'].includes(String(value.internalCostStatus))) {
    throw new Error('Blocked Graphics/Motion internal-cost status is invalid.')
  }
  if (value.meteredInternalCostMicros !== null) {
    assertMoneyMicros(value.meteredInternalCostMicros, 'Blocked Graphics/Motion internal cost is invalid.')
  }
  assertIdArray(value.usageEventIds, 64, true, 'Blocked Graphics/Motion usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Blocked Graphics/Motion internal-cost IDs are invalid.')
  if (request.executionScope === 'controlled_test') {
    if (
      value.providerCallMade !== false
      || value.modelCallMade !== false
      || value.workerJobCreated !== false
      || value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Graphics/Motion blockers cannot claim paid execution or cost.')
  } else if (value.providerCallMade === true || value.modelCallMade === true || value.workerJobCreated === true) {
    if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
      throw new Error('Blocked production Graphics/Motion execution requires attempt cost records.')
    }
    if (value.internalCostStatus === 'not_incurred') {
      throw new Error('Blocked paid Graphics/Motion execution cannot claim no cost was incurred.')
    }
    if (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null) {
      throw new Error('Unverified blocked Graphics/Motion cost must remain null.')
    }
    if (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null) {
      throw new Error('Metered blocked Graphics/Motion execution requires an amount.')
    }
    if (
      value.internalCostStatus === 'metered'
      && BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    ) throw new Error('Blocked Graphics/Motion execution exceeded its authorized maximum.')
  } else if (
    value.internalCostStatus !== 'not_incurred'
    || value.meteredInternalCostMicros !== '0'
    || (value.usageEventIds as string[]).length > 0
    || (value.internalCostRecordIds as string[]).length > 0
  ) throw new Error('Unstarted Graphics/Motion blockers cannot claim internal-cost usage.')
}

function validateNeedsMoreEvidenceResult(
  request: EditReferenceGraphicsMotionStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'evidenceMode', 'missingEvidenceKinds',
    'findings', 'retryAvailable', 'retryReason', 'technicalMotionTreatedAsSemanticIntent',
    'providerCallMade', 'modelCallMade', 'workerJobCreated', 'remoteMutationMade',
    'customerPriceCalculated', 'customerCreditsMutated',
  ], 'needs-more-evidence result')
  if (
    request.evidenceMode !== 'technical_motion_only'
    || value.evidenceMode !== 'technical_motion_only'
    || !Array.isArray(value.missingEvidenceKinds)
    || !sameStringSet(value.missingEvidenceKinds as string[], ['bounded_semantic_graphics_motion_frame_evidence'])
    || value.retryAvailable !== true
    || value.technicalMotionTreatedAsSemanticIntent !== false
  ) throw new Error('Graphics/Motion partial-evidence result is invalid.')
  assertSafeText(value.retryReason, 500, 'Graphics/Motion retry reason is invalid.')
  assertNoEffectResult(value)
}

function assertNoEffectResult(value: Record<string, unknown>): void {
  if (
    !Array.isArray(value.findings)
    || value.findings.length !== 0
    || value.providerCallMade !== false
    || value.modelCallMade !== false
    || value.workerJobCreated !== false
    || value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
  ) throw new Error('Graphics/Motion blocked or partial result cannot claim effects or findings.')
}

function validateAnalyzedResult(
  request: EditReferenceGraphicsMotionStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'runtimeSource', 'workspaceId',
    'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId',
    'mediaChecksumSha256', 'evidenceManifestDigestSha256', 'frameManifestDigestSha256',
    'technicalMotionResultDigestSha256', 'consumedFrameEvidenceIds', 'evidence',
    'technicalMotionAuthority', 'findings', 'coverage', 'summary', 'execution', 'analyzer',
    'provenance', 'usage', 'privacy', 'copySafety', 'motionSafety', 'transferBoundary',
  ], 'analyzed result')
  if (request.evidenceMode !== 'frames_and_technical_motion') {
    throw new Error('Technical signals alone cannot create analyzed Graphics/Motion findings.')
  }
  if (!['verified_local', 'verified_live'].includes(String(value.runtimeSource))) {
    throw new Error('Graphics/Motion runtime source is invalid.')
  }
  for (const key of [
    'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'frameManifestDigestSha256', 'technicalMotionResultDigestSha256',
  ] as const) if (value[key] !== request[key]) throw new Error(`Graphics/Motion ${key} does not match the request.`)
  assertMatchingIdSet(
    value.consumedFrameEvidenceIds,
    request.frameSamples.map((frame) => frame.frameEvidenceId),
    'Graphics/Motion consumed frame IDs do not match.',
  )
  validateMatchingEvidenceManifest(value.evidence, request.evidence)
  if (JSON.stringify(value.technicalMotionAuthority) !== JSON.stringify(request.technicalMotionAuthority)) {
    throw new Error('Graphics/Motion technical authority does not match the request.')
  }
  const findings = validateFindings(request, value.findings)
  validateCoverage(request, value.coverage)
  validateSummary(findings, value.summary)
  validateExecution(request, value.runtimeSource, value.execution)
  validateAnalyzer(value.runtimeSource, value.analyzer)
  validateProvenance(value.provenance)
  validateUsage(request, value.usage)
  validatePrivacy(value.privacy)
  validateCopySafety(value.copySafety)
  validateMotionSafety(request, value.motionSafety)
  validateTransferBoundary(value.transferBoundary)
}

function validateFindings(
  request: EditReferenceGraphicsMotionStudyRequest,
  value: unknown,
): EditReferenceGraphicsMotionFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FINDINGS) {
    throw new Error('Graphics/Motion findings are outside the approved bound.')
  }
  const findings = value as EditReferenceGraphicsMotionFinding[]
  const findingIds = new Set<string>()
  const rangeIds = new Set<string>()
  const allowedEvidence = new Set(allEvidence(request.evidence))
  const allowedFrames = new Set(request.frameSamples.map((frame) => frame.frameEvidenceId))
  for (const finding of findings) {
    if (!isRecord(finding)) throw new Error('Graphics/Motion finding is invalid.')
    assertExactKeys(finding, [
      'findingId', 'category', 'summary', 'evidenceIds', 'frameEvidenceIds', 'sourceRanges',
      'confidence', 'transferability', 'targetAdaptationRequired', 'requiresUserReview',
      'visibleTextRelated', 'brandOrUiIdentityRelated', 'timingRelated',
      'observedGraphicsMotionCharacterOnly', 'generalizedTargetAdaptablePrincipleOnly',
      'technicalMotionContextOnly', 'exactGraphicAssetsRetained', 'exactReferenceTextOrIconIdentityRetained',
      'exactLayoutOrSpacingValuesRetained', 'exactAnimationKeyframesOrCurvesRetained',
      'exactTransitionPathOrTimingRetained', 'exactBrandOrUiIdentityRetained',
      'sourceGraphicOrUiAssetCopied', 'executableTargetGraphicsMotionOperationCreated',
    ], 'finding')
    assertId(finding.findingId, 'Graphics/Motion finding ID is invalid.')
    if (findingIds.has(finding.findingId)) throw new Error('Graphics/Motion finding IDs must be unique.')
    findingIds.add(finding.findingId)
    if (!FINDING_CATEGORIES.has(finding.category as EditReferenceGraphicsMotionFindingCategory)) {
      throw new Error('Graphics/Motion finding category is invalid.')
    }
    assertSafeText(finding.summary, 1_000, 'Graphics/Motion finding summary is invalid.')
    assertIdArray(finding.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Graphics/Motion finding evidence is invalid.')
    assertIdArray(finding.frameEvidenceIds, MAX_FRAME_COUNT, false, 'Graphics/Motion finding frames are invalid.')
    if ((finding.evidenceIds as string[]).some((id) => !allowedEvidence.has(id))) {
      throw new Error('Graphics/Motion finding cites unapproved evidence.')
    }
    if ((finding.frameEvidenceIds as string[]).some((id) => !allowedFrames.has(id))) {
      throw new Error('Graphics/Motion finding cites an unapproved frame.')
    }
    if ((finding.frameEvidenceIds as string[]).some((id) => !finding.evidenceIds.includes(id))) {
      throw new Error('Graphics/Motion finding frame authority must also be cited as evidence.')
    }
    assertUnitInterval(finding.confidence, 'Graphics/Motion finding confidence is invalid.')
    if (!TRANSFERABILITIES.has(finding.transferability as EditReferenceGraphicsMotionTransferability)) {
      throw new Error('Graphics/Motion transferability is invalid.')
    }
    if (
      typeof finding.requiresUserReview !== 'boolean'
      || typeof finding.visibleTextRelated !== 'boolean'
      || typeof finding.brandOrUiIdentityRelated !== 'boolean'
      || typeof finding.timingRelated !== 'boolean'
      || finding.targetAdaptationRequired !== true
      || finding.observedGraphicsMotionCharacterOnly !== true
      || finding.generalizedTargetAdaptablePrincipleOnly !== true
      || finding.technicalMotionContextOnly !== true
    ) throw new Error('Graphics/Motion finding safety metadata is invalid.')
    for (const key of [
      'exactGraphicAssetsRetained', 'exactReferenceTextOrIconIdentityRetained',
      'exactLayoutOrSpacingValuesRetained', 'exactAnimationKeyframesOrCurvesRetained',
      'exactTransitionPathOrTimingRetained', 'exactBrandOrUiIdentityRetained',
      'sourceGraphicOrUiAssetCopied', 'executableTargetGraphicsMotionOperationCreated',
    ] as const) if (finding[key] !== false) throw new Error('Graphics/Motion finding retained exact or executable graphics/motion data.')
    const visibleTextCategory = VISIBLE_TEXT_CATEGORIES.has(finding.category)
    if (finding.visibleTextRelated !== visibleTextCategory) {
      throw new Error('Graphics/Motion visible-text metadata does not match its category.')
    }
    if (visibleTextCategory) {
      if (!request.verifiedVisibleTextEvidenceAvailable || !finding.requiresUserReview) {
        throw new Error('Visible-text Graphics/Motion findings require verified evidence and user review.')
      }
      if (!(finding.evidenceIds as string[]).some((id) => request.evidence.visibleTextEvidenceIds.includes(id))) {
        throw new Error('Visible-text Graphics/Motion finding lacks visible-text evidence.')
      }
    }
    const timingCategory = TIMING_CATEGORIES.has(finding.category)
    if (finding.timingRelated !== timingCategory) {
      throw new Error('Graphics/Motion timing metadata does not match its category.')
    }
    if (timingCategory) {
      if (!request.verifiedVisualCueTimingAvailable || !finding.requiresUserReview) {
        throw new Error('Timing-related Graphics/Motion findings require verified visual-cue timing and user review.')
      }
      if (!(finding.evidenceIds as string[]).some((id) => request.evidence.visualCueTimingEvidenceIds.includes(id))) {
        throw new Error('Timing-related Graphics/Motion finding lacks verified visual-cue evidence.')
      }
    }
    if (finding.brandOrUiIdentityRelated) {
      if (
        !request.sourceBrandOrUiIdentityPresent
        || !finding.requiresUserReview
        || finding.transferability !== 'non_transferable'
      ) {
        throw new Error('Brand/UI-identity Graphics/Motion findings require non-transferable review authority.')
      }
      if (!(finding.evidenceIds as string[]).some((id) => request.evidence.rightsAndBrandEvidenceIds.includes(id))) {
        throw new Error('Brand/UI-identity Graphics/Motion finding lacks rights evidence.')
      }
    }
    validateSourceRanges(request, finding, rangeIds)
  }
  return findings
}

function validateSourceRanges(
  request: EditReferenceGraphicsMotionStudyRequest,
  finding: EditReferenceGraphicsMotionFinding,
  rangeIds: Set<string>,
): void {
  if (!Array.isArray(finding.sourceRanges) || finding.sourceRanges.length < 1 || finding.sourceRanges.length > MAX_SOURCE_RANGES_PER_FINDING) {
    throw new Error('Graphics/Motion source ranges are outside the approved bound.')
  }
  for (const range of finding.sourceRanges) {
    if (!isRecord(range)) throw new Error('Graphics/Motion source range is invalid.')
    assertExactKeys(range, [
      'rangeId', 'startSeconds', 'endSeconds', 'evidenceIds', 'frameEvidenceIds',
      'sourceEvidenceOnly', 'targetLayoutOrMotionInstructionCreated',
      'sourceGraphicAssetCopied', 'executableGraphicsMotionOperationCreated',
    ], 'source range')
    assertId(range.rangeId, 'Graphics/Motion source range ID is invalid.')
    if (rangeIds.has(range.rangeId)) throw new Error('Graphics/Motion source-range IDs must be unique.')
    rangeIds.add(range.rangeId)
    if (
      typeof range.startSeconds !== 'number'
      || !Number.isFinite(range.startSeconds)
      || typeof range.endSeconds !== 'number'
      || !Number.isFinite(range.endSeconds)
      || range.startSeconds < request.analysisWindowStartSeconds
      || range.endSeconds <= range.startSeconds
      || range.endSeconds > request.analysisWindowEndSeconds
    ) throw new Error('Graphics/Motion source range is outside the approved window.')
    assertIdArray(range.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Graphics/Motion source-range evidence is invalid.')
    assertIdArray(range.frameEvidenceIds, MAX_FRAME_COUNT, false, 'Graphics/Motion source-range frames are invalid.')
    if ((range.evidenceIds as string[]).some((id) => !finding.evidenceIds.includes(id))
      || (range.frameEvidenceIds as string[]).some((id) => !finding.frameEvidenceIds.includes(id))) {
      throw new Error('Graphics/Motion source range cites data outside its finding.')
    }
    if (
      range.sourceEvidenceOnly !== true
      || range.targetLayoutOrMotionInstructionCreated !== false
      || range.sourceGraphicAssetCopied !== false
      || range.executableGraphicsMotionOperationCreated !== false
    ) throw new Error('Graphics/Motion source ranges cannot copy assets or create target operations.')
  }
}

function validateCoverage(request: EditReferenceGraphicsMotionStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion coverage is invalid.')
  assertExactKeys(value, [
    'evidenceItemCount', 'frameCount', 'representativeFrameCount', 'motionKeyframeCount',
    'technicalSampleCount', 'sourceDurationSeconds', 'analysisWindowStartSeconds',
    'analysisWindowEndSeconds', 'analyzedDurationSeconds', 'evidenceMode', 'partial',
    'visibleTextEvidenceAvailable', 'visualCueTimingAvailable', 'missingEvidenceKinds',
  ], 'coverage')
  if (
    value.evidenceItemCount !== allEvidence(request.evidence).length
    || value.frameCount !== request.frameSamples.length
    || value.representativeFrameCount !== request.frameSamples.filter((frame) => frame.role === 'representative').length
    || value.motionKeyframeCount !== request.frameSamples.filter((frame) => frame.role === 'motion_keyframe').length
    || value.technicalSampleCount !== request.technicalMotionAuthority.sampleCount
    || value.sourceDurationSeconds !== request.sourceDurationSeconds
    || value.analysisWindowStartSeconds !== request.analysisWindowStartSeconds
    || value.analysisWindowEndSeconds !== request.analysisWindowEndSeconds
    || value.analyzedDurationSeconds !== request.analysisWindowEndSeconds - request.analysisWindowStartSeconds
    || value.evidenceMode !== 'frames_and_technical_motion'
    || value.visibleTextEvidenceAvailable !== request.verifiedVisibleTextEvidenceAvailable
    || value.visualCueTimingAvailable !== request.verifiedVisualCueTimingAvailable
    || value.partial !== (request.technicalMotionAuthority.coverage === 'partial')
  ) throw new Error('Graphics/Motion coverage does not match the request.')
  assertSafeStringArray(value.missingEvidenceKinds, 16, true, 100, 'Graphics/Motion missing-evidence kinds are invalid.')
  const expected = request.technicalMotionAuthority.coverage === 'partial' ? ['technical_signal_partial_coverage'] : []
  if (!sameStringSet(value.missingEvidenceKinds as string[], expected)) {
    throw new Error('Graphics/Motion missing-evidence kinds do not match coverage.')
  }
}

function validateSummary(findings: readonly EditReferenceGraphicsMotionFinding[], value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion summary is invalid.')
  assertExactKeys(value, [
    'findingCount', 'categoryCount', 'transferablePrincipleCount', 'contextOnlyCount',
    'nonTransferableCount', 'averageConfidence',
  ], 'summary')
  const average = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  if (
    value.findingCount !== findings.length
    || value.categoryCount !== new Set(findings.map((finding) => finding.category)).size
    || value.transferablePrincipleCount !== findings.filter((finding) => finding.transferability === 'transferable_principle').length
    || value.contextOnlyCount !== findings.filter((finding) => finding.transferability === 'context_only').length
    || value.nonTransferableCount !== findings.filter((finding) => finding.transferability === 'non_transferable').length
    || typeof value.averageConfidence !== 'number'
    || !Number.isFinite(value.averageConfidence)
    || Math.abs(value.averageConfidence - average) > 0.000_001
  ) throw new Error('Graphics/Motion summary does not match its findings.')
}

function validateExecution(
  request: EditReferenceGraphicsMotionStudyRequest,
  runtimeSource: unknown,
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion execution proof is invalid.')
  assertExactKeys(value, [
    'boundedPrivateFramesRead', 'technicalMotionResultRead', 'semanticGraphicsMotionModelExecuted',
    'rawFullMediaRead', 'rawDifferenceFrameRead', 'externalUrlFetched', 'providerCallMade',
    'modelCallMade', 'workerJobCreated', 'temporaryFramesCleaned', 'remoteMutationMade',
  ], 'execution proof')
  if (
    value.boundedPrivateFramesRead !== true
    || value.technicalMotionResultRead !== true
    || value.semanticGraphicsMotionModelExecuted !== true
    || value.rawFullMediaRead !== false
    || value.rawDifferenceFrameRead !== false
    || value.externalUrlFetched !== false
    || value.modelCallMade !== true
    || typeof value.workerJobCreated !== 'boolean'
    || value.temporaryFramesCleaned !== true
    || value.remoteMutationMade !== false
    || request.frameSamples.length < 1
  ) throw new Error('Graphics/Motion analyzed result lacks bounded execution proof.')
  if (runtimeSource === 'verified_local' && value.providerCallMade !== false) {
    throw new Error('Local Graphics/Motion execution cannot claim a provider call.')
  }
  if (runtimeSource === 'verified_live' && value.providerCallMade !== true) {
    throw new Error('Live Graphics/Motion execution requires provider-call proof.')
  }
}

function validateAnalyzer(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion analyzer provenance is invalid.')
  assertExactKeys(value, [
    'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRevision',
    'modelAggregateSha256', 'modelRoutingPolicyVersion', 'analysisInstructionDigestSha256',
  ], 'analyzer provenance')
  for (const key of ['adapterId', 'adapterVersion', 'modelId', 'modelRevision', 'modelRoutingPolicyVersion'] as const) {
    assertId(value[key], 'Graphics/Motion analyzer provenance ID is invalid.')
  }
  assertSha256(value.modelAggregateSha256, 'Graphics/Motion model aggregate checksum is invalid.')
  assertSha256(value.analysisInstructionDigestSha256, 'Graphics/Motion instruction digest is invalid.')
  if (runtimeSource === 'verified_local') {
    if (value.providerId !== null) throw new Error('Local Graphics/Motion analyzer cannot claim a provider.')
  } else assertId(value.providerId, 'Live Graphics/Motion analyzer requires a provider ID.')
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion provenance is invalid.')
  assertExactKeys(value, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  assertId(value.executionId, 'Graphics/Motion execution ID is invalid.')
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.completedAt)
    || Date.parse(value.completedAt as string) < Date.parse(value.startedAt as string)) {
    throw new Error('Graphics/Motion provenance timestamps are invalid.')
  }
}

function validateUsage(request: EditReferenceGraphicsMotionStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion usage evidence is invalid.')
  assertExactKeys(value, [
    'mode', 'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'usage evidence')
  assertMoneyMicros(value.meteredInternalCostMicros, 'Graphics/Motion metered internal cost is invalid.')
  assertIdArray(value.usageEventIds, 32, true, 'Graphics/Motion usage event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 32, true, 'Graphics/Motion internal-cost record IDs are invalid.')
  if (request.executionScope === 'controlled_test') {
    if (
      value.mode !== 'controlled_test_unmetered'
      || value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as unknown[]).length !== 0
      || (value.internalCostRecordIds as unknown[]).length !== 0
    ) throw new Error('Controlled Graphics/Motion tests cannot claim production cost records.')
  } else {
    if (
      value.mode !== 'production_metered'
      || value.approvedUsageEstimateId !== request.approvedUsageEstimateId
      || value.internalCostBudgetId !== request.internalCostBudgetId
      || value.immutableRateCardSnapshotId !== request.immutableRateCardSnapshotId
      || value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
      || (value.usageEventIds as unknown[]).length < 1
      || (value.internalCostRecordIds as unknown[]).length < 1
    ) throw new Error('Production Graphics/Motion execution requires exact internal-cost authority.')
    if (BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
      throw new Error('Graphics/Motion execution exceeded its maximum authorized internal cost.')
    }
  }
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Graphics/Motion usage crossed the customer-pricing boundary.')
}

function validatePrivacy(value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion privacy evidence is invalid.')
  assertExactKeys(value, [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawDifferenceFramesPersisted',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
    'temporaryFramesCleaned',
  ], 'privacy evidence')
  for (const key of [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawDifferenceFramesPersisted',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
  ] as const) if (value[key] !== false) throw new Error('Graphics/Motion privacy boundary is invalid.')
  if (value.temporaryFramesCleaned !== true) throw new Error('Graphics/Motion temporary frames must be cleaned.')
}

function validateCopySafety(value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion copy-safety evidence is invalid.')
  assertExactKeys(value, [
    'exactGraphicAssetTransferInstructionCreated', 'exactReferenceTextOrIconTransferInstructionCreated',
    'exactLayoutOrSpacingTransferInstructionCreated', 'exactAnimationKeyframeOrCurveTransferInstructionCreated',
    'exactTransitionPathOrTimingTransferInstructionCreated', 'exactBrandOrUiIdentityTransferInstructionCreated',
    'referenceDerivedGraphicsOrMotionGenerationInstructionCreated', 'sourceGraphicOrUiAssetCopied',
  ], 'copy-safety evidence')
  if (Object.values(value).some((entry) => entry !== false)) {
    throw new Error('Graphics/Motion copy-safety boundary is invalid.')
  }
}

function validateMotionSafety(request: EditReferenceGraphicsMotionStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion safety evidence is invalid.')
  assertExactKeys(value, [
    'technicalMotionTreatedAsSemanticIntent', 'targetConfirmedOutputFrameRequired',
    'targetFrameLayoutAndSafeZonesRequired', 'targetCaptionCollisionQaRequired',
    'targetSpeakerSubjectAndHeroSafePlacementQaRequired', 'targetVisibleTextReadabilityQaRequired',
    'targetBrandOrUiIdentityReviewRequired', 'targetFinalRenderMotionQaRequired',
    'cameraOrSubjectMotionClaimedWithoutSemanticEvidence',
    'cutOrTransitionClassifiedFromTechnicalDifferences',
    'randomDecorativeMotionInstructionCreated',
  ], 'motion safety')
  if (
    value.technicalMotionTreatedAsSemanticIntent !== false
    || value.targetConfirmedOutputFrameRequired !== true
    || value.targetFrameLayoutAndSafeZonesRequired !== true
    || value.targetCaptionCollisionQaRequired !== true
    || value.targetSpeakerSubjectAndHeroSafePlacementQaRequired !== true
    || value.targetVisibleTextReadabilityQaRequired !== request.verifiedVisibleTextEvidenceAvailable
    || value.targetBrandOrUiIdentityReviewRequired !== request.sourceBrandOrUiIdentityPresent
    || value.targetFinalRenderMotionQaRequired !== true
    || value.cameraOrSubjectMotionClaimedWithoutSemanticEvidence !== false
    || value.cutOrTransitionClassifiedFromTechnicalDifferences !== false
    || value.randomDecorativeMotionInstructionCreated !== false
  ) throw new Error('Graphics/Motion safety evidence does not match the request.')
}

function validateTransferBoundary(value: unknown): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion transfer boundary is invalid.')
  assertExactKeys(value, [
    'findingsMayBecomeTargetInstructionsWithoutApplication', 'targetEvidenceRequired',
    'targetMediaGraphicsMotionAnalysisRequired', 'targetMeaningAndContentHierarchyReviewRequired',
    'targetVisualCueAndTimingReviewRequired', 'confirmedOutputFrameAndLayoutRequired',
    'masterTimingPlanRequired', 'frameLayoutPlanRequired', 'renderStrategyPlanRequired',
    'timingValidationRequired', 'userApprovalRequired',
    'ownedTargetBrandAssetsRequireSeparateTargetAssetApproval',
    'exactReferenceGraphicsLayoutOrMotionTransferAllowed',
    'remotionOrDeterministicRenderExecutionCreated', 'generatedAssetOrProviderPromptCreated',
  ], 'transfer boundary')
  if (
    value.findingsMayBecomeTargetInstructionsWithoutApplication !== false
    || value.targetEvidenceRequired !== true
    || value.targetMediaGraphicsMotionAnalysisRequired !== true
    || value.targetMeaningAndContentHierarchyReviewRequired !== true
    || value.targetVisualCueAndTimingReviewRequired !== true
    || value.confirmedOutputFrameAndLayoutRequired !== true
    || value.masterTimingPlanRequired !== true
    || value.frameLayoutPlanRequired !== true
    || value.renderStrategyPlanRequired !== true
    || value.timingValidationRequired !== true
    || value.userApprovalRequired !== true
    || value.ownedTargetBrandAssetsRequireSeparateTargetAssetApproval !== true
    || value.exactReferenceGraphicsLayoutOrMotionTransferAllowed !== false
    || value.remotionOrDeterministicRenderExecutionCreated !== false
    || value.generatedAssetOrProviderPromptCreated !== false
  ) throw new Error('Graphics/Motion transfer boundary is invalid.')
}

function normalizedEvidenceManifest(
  evidence: EditReferenceGraphicsMotionEvidenceManifest,
): EditReferenceGraphicsMotionEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...evidence.mediaStructureEvidenceIds].sort(),
    representativeFrameEvidenceIds: [...evidence.representativeFrameEvidenceIds].sort(),
    keyframeEvidenceIds: [...evidence.keyframeEvidenceIds].sort(),
    technicalMotionSignalEvidenceIds: [...evidence.technicalMotionSignalEvidenceIds].sort(),
    sceneBoundaryEvidenceIds: [...evidence.sceneBoundaryEvidenceIds].sort(),
    visualCueTimingEvidenceIds: [...evidence.visualCueTimingEvidenceIds].sort(),
    studyChatGoalEvidenceIds: [...evidence.studyChatGoalEvidenceIds].sort(),
    visibleTextEvidenceIds: [...evidence.visibleTextEvidenceIds].sort(),
    rightsAndBrandEvidenceIds: [...evidence.rightsAndBrandEvidenceIds].sort(),
  }
}

function validateMatchingEvidenceManifest(
  value: unknown,
  expected: EditReferenceGraphicsMotionEvidenceManifest,
): void {
  if (!isRecord(value)) throw new Error('Graphics/Motion result evidence manifest is invalid.')
  const normalized = normalizedEvidenceManifest(value as unknown as EditReferenceGraphicsMotionEvidenceManifest)
  if (JSON.stringify(normalized) !== JSON.stringify(normalizedEvidenceManifest(expected))) {
    throw new Error('Graphics/Motion result evidence manifest does not match the request.')
  }
}

function allEvidence(evidence: EditReferenceGraphicsMotionEvidenceManifest): string[] {
  return Object.values(normalizedEvidenceManifest(evidence)).flat()
}

function assertNoForbiddenContent(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenContent(entry, `${path}[${index}]`))
    return
  }
  if (!isRecord(value)) {
    if (typeof value === 'string' && UNSAFE_STRING_PATTERN.test(value)) {
      throw new Error(`Graphics/Motion ${path} contains unsafe content.`)
    }
    return
  }
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Graphics/Motion ${path}.${key} is forbidden.`)
    assertNoForbiddenContent(entry, `${path}.${key}`)
  }
}

function assertExactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`Graphics/Motion ${label} fields are invalid.`)
  }
}

function assertId(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error(message)
}

function assertSha256(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) throw new Error(message)
}

function assertMoneyMicros(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !MONEY_MICROS_PATTERN.test(value)) throw new Error(message)
}

function assertPositiveMoneyMicros(value: unknown, message: string): asserts value is string {
  assertMoneyMicros(value, message)
  if (value === '0') throw new Error(message)
}

function assertIdArray(
  value: unknown,
  maxLength: number,
  allowEmpty: boolean,
  message: string,
): asserts value is string[] {
  if (
    !Array.isArray(value)
    || (!allowEmpty && value.length < 1)
    || value.length > maxLength
    || new Set(value).size !== value.length
    || value.some((entry) => typeof entry !== 'string' || !ID_PATTERN.test(entry))
  ) throw new Error(message)
}

function assertMatchingIdSet(value: unknown, expected: readonly string[], message: string): void {
  assertIdArray(value, MAX_EVIDENCE_ITEMS, expected.length === 0, message)
  if (!sameStringSet(value, expected)) throw new Error(message)
}

function assertSafeText(value: unknown, maxLength: number, message: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength || UNSAFE_STRING_PATTERN.test(value)) {
    throw new Error(message)
  }
}

function assertSafeStringArray(
  value: unknown,
  maxLength: number,
  allowEmpty: boolean,
  maxItemLength: number,
  message: string,
): asserts value is string[] {
  if (
    !Array.isArray(value)
    || (!allowEmpty && value.length < 1)
    || value.length > maxLength
    || new Set(value).size !== value.length
    || value.some((entry) => typeof entry !== 'string' || !entry.trim()
      || entry.length > maxItemLength || UNSAFE_STRING_PATTERN.test(entry))
  ) throw new Error(message)
}

function assertUnitInterval(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(message)
}

function assertPositiveFinite(value: unknown, max: number, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max) throw new Error(message)
}

function assertPositiveSafeInteger(value: unknown, max: number, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > max) throw new Error(message)
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.length === sortedRight.length
    && sortedLeft.every((entry, index) => entry === sortedRight[index])
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
