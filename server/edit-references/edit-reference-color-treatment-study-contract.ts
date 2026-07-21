import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_COLOR_TREATMENT_STUDY_REQUEST_VERSION =
  'edit-reference-color-treatment-study-request-v1' as const
export const EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION =
  'edit-reference-color-treatment-study-result-v1' as const

export type EditReferenceColorTreatmentFindingCategory =
  | 'palette_relationship'
  | 'temperature_character'
  | 'white_balance_character'
  | 'contrast_structure'
  | 'saturation_vibrance'
  | 'luma_distribution'
  | 'highlight_rolloff'
  | 'shadow_treatment'
  | 'skin_tone_protection'
  | 'scene_consistency'
  | 'overall_color_character'

export type EditReferenceColorTreatmentTransferability =
  | 'transferable_principle'
  | 'context_only'
  | 'non_transferable'

export type EditReferenceColorTreatmentEvidenceMode =
  | 'frames_and_technical_signal'
  | 'technical_signal_only'

export interface EditReferenceColorTreatmentFrameEvidence {
  readonly role: 'representative' | 'color_detail' | 'scene_match'
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

export interface EditReferenceColorTreatmentEvidenceManifest {
  readonly mediaStructureEvidenceIds: readonly string[]
  readonly representativeFrameEvidenceIds: readonly string[]
  readonly technicalColorSignalEvidenceIds: readonly string[]
  readonly visualLanguageEvidenceIds: readonly string[]
  readonly studyChatGoalEvidenceIds: readonly string[]
  readonly personPresenceEvidenceIds: readonly string[]
  readonly rightsAndBrandEvidenceIds: readonly string[]
}

export interface EditReferenceColorTreatmentTechnicalAuthority {
  readonly schemaVersion: 'edit-reference-technical-color-signal-v2'
  readonly evidenceId: string
  readonly resultDigestSha256: string
  readonly runtimeSource: 'verified_local'
  readonly executionId: string
  readonly toolIds: readonly ['ffprobe', 'ffmpeg']
  readonly status: 'verified_local_bounded'
  readonly coverage: 'full' | 'partial'
  readonly sampleCount: number
  readonly scannedDurationSeconds: number
  readonly technicalDistributionAnalysisRan: true
  readonly colorRangeViolationScanRan: boolean
  readonly semanticColorAnalysisRan: false
  readonly whiteBalanceInferenceRan: false
  readonly temperatureInferenceRan: false
  readonly skinToneAnalysisRan: false
  readonly shotMatchAnalysisRan: false
  readonly lutReconstructionRan: false
  readonly rawFramePixelsPersisted: false
  readonly rawHistogramPersisted: false
  readonly rawProcessOutputPersisted: false
}

export interface EditReferenceColorTreatmentStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_COLOR_TREATMENT_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly frameManifestDigestSha256: string
  readonly technicalColorResultDigestSha256: string
  readonly privateArtifactAccessVerified: true
  readonly privateArtifactFinalized: true
  readonly mediaChecksumVerified: true
  readonly evidenceAuthorityVerified: true
  readonly frameAuthorityVerified: boolean
  readonly technicalColorAuthorityVerified: true
  readonly evidenceMode: EditReferenceColorTreatmentEvidenceMode
  readonly frameSamples: readonly EditReferenceColorTreatmentFrameEvidence[]
  readonly evidence: EditReferenceColorTreatmentEvidenceManifest
  readonly technicalColorAuthority: EditReferenceColorTreatmentTechnicalAuthority
  readonly sourceDurationSeconds: number
  readonly analysisWindowStartSeconds: number
  readonly analysisWindowEndSeconds: number
  readonly sourcePeoplePresent: boolean
  readonly sourceBrandColorContextPresent: boolean
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
  readonly rawHistogramPersistenceAllowed: false
  readonly rawProviderPayloadPersistenceAllowed: false
  readonly technicalSignalsMayEstablishSemanticColorIntent: false
  readonly exactPaletteSwatchTransferAllowed: false
  readonly exactColorValueTransferAllowed: false
  readonly exactCurveOrControlPointTransferAllowed: false
  readonly exactGradeSettingTransferAllowed: false
  readonly exactReferenceLutReconstructionAllowed: false
  readonly unownedReferenceLutTransferAllowed: false
  readonly ownedLutPassthroughHandledBySeparateTargetAssetWorkflow: true
  readonly exactLookTransformTransferAllowed: false
  readonly executableTargetGradeAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceColorTreatmentSourceRange {
  readonly rangeId: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly evidenceIds: readonly string[]
  readonly frameEvidenceIds: readonly string[]
  readonly sourceEvidenceOnly: true
  readonly targetGradeInstructionCreated: false
  readonly executableColorOperationCreated: false
}

export interface EditReferenceColorTreatmentFinding {
  readonly findingId: string
  readonly category: EditReferenceColorTreatmentFindingCategory
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly frameEvidenceIds: readonly string[]
  readonly sourceRanges: readonly EditReferenceColorTreatmentSourceRange[]
  readonly confidence: number
  readonly transferability: EditReferenceColorTreatmentTransferability
  readonly targetAdaptationRequired: true
  readonly requiresUserReview: boolean
  readonly skinToneRelated: boolean
  readonly brandColorRelated: boolean
  readonly hdrOrColorManagementRelated: boolean
  readonly observedColorCharacterOnly: true
  readonly generalizedTonalPrincipleOnly: true
  readonly technicalSignalContextOnly: true
  readonly exactPaletteSwatchesRetained: false
  readonly exactColorValuesRetained: false
  readonly exactCurveOrControlPointsRetained: false
  readonly exactGradeSettingsRetained: false
  readonly exactLutIdentityOrDataRetained: false
  readonly exactLookTransformRetained: false
  readonly sourceBrandColorAssetCopied: false
  readonly executableTargetGradeCreated: false
}

export interface EditReferenceAnalyzedColorTreatmentStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION
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
  readonly technicalColorResultDigestSha256: string
  readonly consumedFrameEvidenceIds: readonly string[]
  readonly evidence: EditReferenceColorTreatmentEvidenceManifest
  readonly technicalColorAuthority: EditReferenceColorTreatmentTechnicalAuthority
  readonly findings: readonly EditReferenceColorTreatmentFinding[]
  readonly coverage: {
    readonly evidenceItemCount: number
    readonly frameCount: number
    readonly representativeFrameCount: number
    readonly sceneMatchFrameCount: number
    readonly technicalSampleCount: number
    readonly sourceDurationSeconds: number
    readonly analysisWindowStartSeconds: number
    readonly analysisWindowEndSeconds: number
    readonly analyzedDurationSeconds: number
    readonly evidenceMode: 'frames_and_technical_signal'
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
    readonly technicalColorResultRead: true
    readonly semanticColorTreatmentModelExecuted: true
    readonly rawFullMediaRead: false
    readonly rawHistogramRead: false
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
    readonly rawHistogramsPersisted: false
    readonly rawProviderPayloadPersisted: false
    readonly signedUrlPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly temporaryFramesCleaned: true
  }
  readonly copySafety: {
    readonly exactPaletteSwatchTransferInstructionCreated: false
    readonly exactColorValueTransferInstructionCreated: false
    readonly exactCurveOrControlPointTransferInstructionCreated: false
    readonly exactGradeSettingTransferInstructionCreated: false
    readonly exactReferenceLutReconstructed: false
    readonly unownedReferenceLutTransferInstructionCreated: false
    readonly exactLookTransformTransferInstructionCreated: false
    readonly sourceBrandColorAssetCopied: false
  }
  readonly colorSafety: {
    readonly technicalSignalTreatedAsSemanticIntent: false
    readonly targetColorSpaceReviewRequired: true
    readonly targetHdrSdrTransformReviewRequired: true
    readonly targetShotMatchQaRequired: true
    readonly targetGeneratedAssetMatchQaRequired: true
    readonly targetSkinToneReviewRequired: boolean
    readonly targetBrandColorReviewRequired: boolean
    readonly finalRenderColorQaRequired: true
    readonly clippingOrCrushedDetailInstructionCreated: false
  }
  readonly transferBoundary: {
    readonly findingsMayBecomeTargetInstructionsWithoutApplication: false
    readonly targetEvidenceRequired: true
    readonly targetMediaColorAnalysisRequired: true
    readonly targetInputWorkingOutputColorSpaceReviewRequired: true
    readonly targetSceneAndShotMatchingRequired: true
    readonly userApprovalRequired: true
    readonly ownedLutPassthroughRequiresSeparateTargetAssetApproval: true
    readonly exactReferenceGradeOrUnownedLutTransferAllowed: false
  }
}

export interface EditReferenceColorTreatmentNeedsMoreEvidenceResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'needs_more_evidence'
  readonly evidenceMode: 'technical_signal_only'
  readonly missingEvidenceKinds: readonly ['bounded_semantic_frame_evidence']
  readonly findings: readonly []
  readonly retryAvailable: true
  readonly retryReason: string
  readonly technicalSignalTreatedAsSemanticIntent: false
  readonly providerCallMade: false
  readonly modelCallMade: false
  readonly workerJobCreated: false
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

export type EditReferenceColorTreatmentStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'frame_authority_unverified'
  | 'representative_frames_unavailable'
  | 'technical_color_result_unavailable'
  | 'technical_color_authority_unverified'
  | 'evidence_authority_unverified'
  | 'person_presence_evidence_required'
  | 'rights_or_brand_evidence_required'
  | 'cost_authority_unavailable'
  | 'model_routing_unavailable'
  | 'privacy_policy_denied'
  | 'runtime_response_invalid'
  | 'ephemeral_cleanup_failed'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedColorTreatmentStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceColorTreatmentStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly findings: readonly []
  readonly boundedPrivateFramesRead: boolean
  readonly technicalColorResultRead: boolean
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

export type EditReferenceColorTreatmentStudyResult =
  | EditReferenceAnalyzedColorTreatmentStudyResult
  | EditReferenceColorTreatmentNeedsMoreEvidenceResult
  | EditReferenceBlockedColorTreatmentStudyResult

export interface EditReferenceColorTreatmentStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  analyze(request: EditReferenceColorTreatmentStudyRequest): Promise<EditReferenceColorTreatmentStudyResult>
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

const FINDING_CATEGORIES = new Set<EditReferenceColorTreatmentFindingCategory>([
  'palette_relationship', 'temperature_character', 'white_balance_character',
  'contrast_structure', 'saturation_vibrance', 'luma_distribution', 'highlight_rolloff',
  'shadow_treatment', 'skin_tone_protection', 'scene_consistency', 'overall_color_character',
])
const TRANSFERABILITIES = new Set<EditReferenceColorTreatmentTransferability>([
  'transferable_principle', 'context_only', 'non_transferable',
])
const EVIDENCE_MODES = new Set<EditReferenceColorTreatmentEvidenceMode>([
  'frames_and_technical_signal', 'technical_signal_only',
])
const BLOCKER_CODES = new Set<EditReferenceColorTreatmentStudyBlockerCode>([
  'adapter_unavailable', 'private_artifact_unavailable', 'frame_authority_unverified',
  'representative_frames_unavailable', 'technical_color_result_unavailable',
  'technical_color_authority_unverified', 'evidence_authority_unverified',
  'person_presence_evidence_required', 'rights_or_brand_evidence_required',
  'cost_authority_unavailable', 'model_routing_unavailable', 'privacy_policy_denied',
  'runtime_response_invalid', 'ephemeral_cleanup_failed', 'copy_safety_violation',
  'internal_cost_usage_unverified',
])
const FORBIDDEN_KEYS = new Set([
  'apiKey', 'api_key', 'authorization', 'bytes', 'chainOfThought', 'chain_of_thought',
  'exactColorHex', 'exactColorValue', 'exactCurve', 'exactGradeSettings', 'exactLutData',
  'exactLutName', 'exactPalette', 'filePath', 'file_path', 'hiddenReasoning', 'localPath',
  'local_path', 'lutPath', 'password', 'payload', 'prompt', 'rawFrame', 'rawFrames',
  'rawHistogram', 'rawMedia', 'rawPayload', 'rawProviderPayload', 'secret', 'signedUrl',
  'signed_url', 'token', 'tokens', 'url',
])
const UNSAFE_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

export function computeEditReferenceColorTreatmentStudyRequestDigest(
  request: EditReferenceColorTreatmentStudyRequest,
): string {
  assertEditReferenceColorTreatmentStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function assertEditReferenceColorTreatmentStudyRequest(
  value: unknown,
): asserts value is EditReferenceColorTreatmentStudyRequest {
  assertNoForbiddenContent(value, 'request')
  if (!isRecord(value)) throw new Error('Color Treatment request must be an object.')
  assertExactKeys(value, [
    'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'frameManifestDigestSha256', 'technicalColorResultDigestSha256',
    'privateArtifactAccessVerified', 'privateArtifactFinalized', 'mediaChecksumVerified',
    'evidenceAuthorityVerified', 'frameAuthorityVerified', 'technicalColorAuthorityVerified',
    'evidenceMode', 'frameSamples', 'evidence', 'technicalColorAuthority',
    'sourceDurationSeconds', 'analysisWindowStartSeconds', 'analysisWindowEndSeconds',
    'sourcePeoplePresent', 'sourceBrandColorContextPresent', 'maxFrameCount',
    'maxEvidenceItems', 'maxStructuredContextCharacters', 'maxScanDurationSeconds',
    'executionScope', 'approvedUsageEstimateId', 'internalCostBudgetId',
    'immutableRateCardSnapshotId', 'maximumAuthorizedInternalCostMicros',
    'boundedPrivateFrameInputAllowed', 'rawFullMediaInputAllowed',
    'rawFramePersistenceAllowed', 'rawHistogramPersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed', 'technicalSignalsMayEstablishSemanticColorIntent',
    'exactPaletteSwatchTransferAllowed', 'exactColorValueTransferAllowed',
    'exactCurveOrControlPointTransferAllowed', 'exactGradeSettingTransferAllowed',
    'exactReferenceLutReconstructionAllowed', 'unownedReferenceLutTransferAllowed',
    'ownedLutPassthroughHandledBySeparateTargetAssetWorkflow', 'exactLookTransformTransferAllowed',
    'executableTargetGradeAllowed', 'externalUrlFetchAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_COLOR_TREATMENT_STUDY_REQUEST_VERSION) {
    throw new Error('Color Treatment request version is unsupported.')
  }
  for (const key of [
    'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId',
  ] as const) assertId(value[key], `Color Treatment ${key} is invalid.`)
  for (const key of [
    'mediaChecksumSha256', 'evidenceManifestDigestSha256', 'frameManifestDigestSha256',
    'technicalColorResultDigestSha256',
  ] as const) assertSha256(value[key], `Color Treatment ${key} is invalid.`)
  if (
    value.privateArtifactAccessVerified !== true
    || value.privateArtifactFinalized !== true
    || value.mediaChecksumVerified !== true
    || value.evidenceAuthorityVerified !== true
    || value.technicalColorAuthorityVerified !== true
  ) throw new Error('Color Treatment private artifact and evidence authority must be verified.')
  if (!EVIDENCE_MODES.has(value.evidenceMode as EditReferenceColorTreatmentEvidenceMode)) {
    throw new Error('Color Treatment evidence mode is invalid.')
  }
  validateFrames(value)
  validateEvidenceManifest(value.evidence, value)
  validateTechnicalAuthority(value.technicalColorAuthority, value)
  validateWindowAndBounds(value)
  validateRequestCostAuthority(value)
  validateRequestSafetyFlags(value)
}

export function assertEditReferenceColorTreatmentStudyResult(
  request: EditReferenceColorTreatmentStudyRequest,
  value: unknown,
): asserts value is EditReferenceColorTreatmentStudyResult {
  assertEditReferenceColorTreatmentStudyRequest(request)
  assertNoForbiddenContent(value, 'result')
  if (!isRecord(value)) throw new Error('Color Treatment result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION) {
    throw new Error('Color Treatment result version is unsupported.')
  }
  const digest = computeEditReferenceColorTreatmentStudyRequestDigest(request)
  if (value.requestDigestSha256 !== digest) throw new Error('Color Treatment result request digest does not match.')
  if (value.status === 'blocked') return validateBlockedResult(request, value)
  if (value.status === 'needs_more_evidence') return validateNeedsMoreEvidenceResult(request, value)
  if (value.status !== 'analyzed') throw new Error('Color Treatment result status is invalid.')
  validateAnalyzedResult(request, value)
}

export function createBlockedEditReferenceColorTreatmentStudyResult(input: {
  request: EditReferenceColorTreatmentStudyRequest
  blockerCode: EditReferenceColorTreatmentStudyBlockerCode
  blockerMessage: string
  retryAvailable: boolean
  retryReason?: string
  execution?: {
    readonly boundedPrivateFramesRead?: boolean
    readonly technicalColorResultRead?: boolean
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
}): EditReferenceBlockedColorTreatmentStudyResult {
  assertEditReferenceColorTreatmentStudyRequest(input.request)
  if (!BLOCKER_CODES.has(input.blockerCode)) throw new Error('Color Treatment blocker code is invalid.')
  assertSafeText(input.blockerMessage, 500, 'Color Treatment blocker message is invalid.')
  if (input.retryReason !== undefined) assertSafeText(input.retryReason, 500, 'Color Treatment retry reason is invalid.')
  if (input.retryAvailable !== (input.retryReason !== undefined)) {
    throw new Error('Color Treatment retry reason must match retry availability.')
  }
  const result: EditReferenceBlockedColorTreatmentStudyResult = {
    schemaVersion: EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceColorTreatmentStudyRequestDigest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    retryReason: input.retryReason ?? null,
    findings: [],
    boundedPrivateFramesRead: input.execution?.boundedPrivateFramesRead ?? false,
    technicalColorResultRead: input.execution?.technicalColorResultRead ?? false,
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
  assertEditReferenceColorTreatmentStudyResult(input.request, result)
  return result
}

export function createNeedsMoreEvidenceColorTreatmentStudyResult(
  request: EditReferenceColorTreatmentStudyRequest,
  retryReason: string,
): EditReferenceColorTreatmentNeedsMoreEvidenceResult {
  assertEditReferenceColorTreatmentStudyRequest(request)
  if (request.evidenceMode !== 'technical_signal_only') {
    throw new Error('Only technical-signal-only Color Treatment requests use the partial-evidence result.')
  }
  assertSafeText(retryReason, 500, 'Color Treatment retry reason is invalid.')
  return {
    schemaVersion: EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceColorTreatmentStudyRequestDigest(request),
    status: 'needs_more_evidence',
    evidenceMode: 'technical_signal_only',
    missingEvidenceKinds: ['bounded_semantic_frame_evidence'],
    findings: [],
    retryAvailable: true,
    retryReason,
    technicalSignalTreatedAsSemanticIntent: false,
    providerCallMade: false,
    modelCallMade: false,
    workerJobCreated: false,
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

function stableRequestPayload(request: EditReferenceColorTreatmentStudyRequest): string {
  return JSON.stringify({
    ...request,
    frameSamples: [...request.frameSamples]
      .sort((left, right) => left.frameEvidenceId.localeCompare(right.frameEvidenceId)),
    evidence: normalizedEvidenceManifest(request.evidence),
    technicalColorAuthority: {
      ...request.technicalColorAuthority,
      toolIds: [...request.technicalColorAuthority.toolIds].sort(),
    },
  })
}

function validateFrames(request: Record<string, unknown>): void {
  if (!Array.isArray(request.frameSamples)) throw new Error('Color Treatment frames are invalid.')
  const frames = request.frameSamples as unknown[]
  if (request.evidenceMode === 'frames_and_technical_signal') {
    if (request.frameAuthorityVerified !== true || frames.length < 1 || frames.length > MAX_FRAME_COUNT) {
      throw new Error('Color Treatment semantic analysis requires bounded verified frame authority.')
    }
  } else if (request.frameAuthorityVerified !== false || frames.length !== 0) {
    throw new Error('Technical-signal-only Color Treatment requests cannot claim frame authority.')
  }
  const frameIds = new Set<string>()
  const artifactIds = new Set<string>()
  for (const frame of frames) {
    if (!isRecord(frame)) throw new Error('Color Treatment frame evidence is invalid.')
    assertExactKeys(frame, [
      'role', 'frameEvidenceId', 'privateFrameArtifactId', 'frameChecksumSha256',
      'sourceTimeSeconds', 'width', 'height', 'privateAccessVerified', 'ephemeral',
      'cleanupRequired',
    ], 'frame evidence')
    if (!['representative', 'color_detail', 'scene_match'].includes(String(frame.role))) {
      throw new Error('Color Treatment frame role is invalid.')
    }
    assertId(frame.frameEvidenceId, 'Color Treatment frame evidence ID is invalid.')
    assertId(frame.privateFrameArtifactId, 'Color Treatment private frame artifact ID is invalid.')
    assertSha256(frame.frameChecksumSha256, 'Color Treatment frame checksum is invalid.')
    if (frameIds.has(frame.frameEvidenceId) || artifactIds.has(frame.privateFrameArtifactId)) {
      throw new Error('Color Treatment frame identities must be unique.')
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
    ) throw new Error('Color Treatment frame evidence is outside the approved boundary.')
  }
  if (
    request.evidenceMode === 'frames_and_technical_signal'
    && !(frames as Array<Record<string, unknown>>).some((frame) => frame.role === 'representative')
  ) throw new Error('Color Treatment analysis requires a representative frame.')
}

function validateEvidenceManifest(value: unknown, request: Record<string, unknown>): void {
  if (!isRecord(value)) throw new Error('Color Treatment evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds', 'representativeFrameEvidenceIds',
    'technicalColorSignalEvidenceIds', 'visualLanguageEvidenceIds',
    'studyChatGoalEvidenceIds', 'personPresenceEvidenceIds', 'rightsAndBrandEvidenceIds',
  ] as const
  assertExactKeys(value, [...keys], 'evidence manifest')
  for (const key of keys) assertIdArray(value[key], MAX_EVIDENCE_ITEMS, true, `Color Treatment ${key} are invalid.`)
  const evidence = value as unknown as EditReferenceColorTreatmentEvidenceManifest
  if (evidence.mediaStructureEvidenceIds.length < 1 || evidence.technicalColorSignalEvidenceIds.length < 1) {
    throw new Error('Color Treatment requires media-structure and technical-color evidence.')
  }
  const frames = request.frameSamples as EditReferenceColorTreatmentFrameEvidence[]
  if (!sameStringSet(evidence.representativeFrameEvidenceIds, frames.map((frame) => frame.frameEvidenceId))) {
    throw new Error('Color Treatment frame evidence does not match the request frames.')
  }
  if (request.sourcePeoplePresent === true && evidence.personPresenceEvidenceIds.length < 1) {
    throw new Error('Color Treatment people context requires person-presence evidence.')
  }
  if (request.sourcePeoplePresent === false && evidence.personPresenceEvidenceIds.length > 0) {
    throw new Error('Color Treatment person-presence evidence contradicts the request.')
  }
  if (request.sourceBrandColorContextPresent === true && evidence.rightsAndBrandEvidenceIds.length < 1) {
    throw new Error('Color Treatment brand-color context requires rights evidence.')
  }
  const all = allEvidence(evidence)
  if (all.length < 2 || all.length > MAX_EVIDENCE_ITEMS || new Set(all).size !== all.length) {
    throw new Error('Color Treatment evidence IDs must be unique and bounded.')
  }
}

function validateTechnicalAuthority(value: unknown, request: Record<string, unknown>): void {
  if (!isRecord(value)) throw new Error('Color Treatment technical authority is invalid.')
  assertExactKeys(value, [
    'schemaVersion', 'evidenceId', 'resultDigestSha256', 'runtimeSource', 'executionId',
    'toolIds', 'status', 'coverage', 'sampleCount', 'scannedDurationSeconds',
    'technicalDistributionAnalysisRan', 'colorRangeViolationScanRan',
    'semanticColorAnalysisRan', 'whiteBalanceInferenceRan', 'temperatureInferenceRan',
    'skinToneAnalysisRan', 'shotMatchAnalysisRan', 'lutReconstructionRan',
    'rawFramePixelsPersisted', 'rawHistogramPersisted', 'rawProcessOutputPersisted',
  ], 'technical authority')
  assertId(value.evidenceId, 'Color Treatment technical evidence ID is invalid.')
  assertId(value.executionId, 'Color Treatment technical execution ID is invalid.')
  assertSha256(value.resultDigestSha256, 'Color Treatment technical result digest is invalid.')
  const evidence = (request.evidence as EditReferenceColorTreatmentEvidenceManifest).technicalColorSignalEvidenceIds
  if (
    value.schemaVersion !== 'edit-reference-technical-color-signal-v2'
    || value.resultDigestSha256 !== request.technicalColorResultDigestSha256
    || !evidence.includes(value.evidenceId as string)
    || value.runtimeSource !== 'verified_local'
    || value.status !== 'verified_local_bounded'
    || !['full', 'partial'].includes(String(value.coverage))
    || !Array.isArray(value.toolIds)
    || value.toolIds.length !== 2
    || !sameStringSet(value.toolIds as string[], ['ffprobe', 'ffmpeg'])
    || value.technicalDistributionAnalysisRan !== true
    || typeof value.colorRangeViolationScanRan !== 'boolean'
  ) throw new Error('Color Treatment technical authority is not exact or verified.')
  assertPositiveSafeInteger(value.sampleCount, 24, 'Color Treatment technical sample count is invalid.')
  assertPositiveFinite(value.scannedDurationSeconds, 600, 'Color Treatment technical duration is invalid.')
  for (const key of [
    'semanticColorAnalysisRan', 'whiteBalanceInferenceRan', 'temperatureInferenceRan',
    'skinToneAnalysisRan', 'shotMatchAnalysisRan', 'lutReconstructionRan',
    'rawFramePixelsPersisted', 'rawHistogramPersisted', 'rawProcessOutputPersisted',
  ] as const) if (value[key] !== false) throw new Error('Color Treatment technical authority overclaims semantic or retained data.')
}

function validateWindowAndBounds(value: Record<string, unknown>): void {
  assertPositiveFinite(value.sourceDurationSeconds, 86_400, 'Color Treatment source duration is invalid.')
  if (
    typeof value.analysisWindowStartSeconds !== 'number'
    || !Number.isFinite(value.analysisWindowStartSeconds)
    || value.analysisWindowStartSeconds < 0
    || typeof value.analysisWindowEndSeconds !== 'number'
    || !Number.isFinite(value.analysisWindowEndSeconds)
    || value.analysisWindowEndSeconds <= value.analysisWindowStartSeconds
    || value.analysisWindowEndSeconds > (value.sourceDurationSeconds as number)
    || value.analysisWindowEndSeconds - value.analysisWindowStartSeconds > MAX_SCAN_DURATION_SECONDS
  ) throw new Error('Color Treatment analysis window is invalid.')
  if (
    value.maxFrameCount !== MAX_FRAME_COUNT
    || value.maxEvidenceItems !== MAX_EVIDENCE_ITEMS
    || value.maxStructuredContextCharacters !== MAX_STRUCTURED_CONTEXT_CHARACTERS
    || value.maxScanDurationSeconds !== MAX_SCAN_DURATION_SECONDS
    || typeof value.sourcePeoplePresent !== 'boolean'
    || typeof value.sourceBrandColorContextPresent !== 'boolean'
  ) throw new Error('Color Treatment bounds or context flags are invalid.')
  const frames = value.frameSamples as EditReferenceColorTreatmentFrameEvidence[]
  if (frames.some((frame) => frame.sourceTimeSeconds < (value.analysisWindowStartSeconds as number)
    || frame.sourceTimeSeconds > (value.analysisWindowEndSeconds as number))) {
    throw new Error('Color Treatment frame is outside the approved analysis window.')
  }
}

function validateRequestCostAuthority(value: Record<string, unknown>): void {
  if (value.executionScope === 'controlled_test') {
    if (
      value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
    ) throw new Error('Controlled Color Treatment requests cannot claim production cost authority.')
    return
  }
  if (value.executionScope !== 'production') throw new Error('Color Treatment execution scope is invalid.')
  for (const key of ['approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId'] as const) {
    assertId(value[key], `Color Treatment ${key} is invalid.`)
  }
  assertPositiveMoneyMicros(value.maximumAuthorizedInternalCostMicros, 'Color Treatment maximum cost is invalid.')
}

function validateRequestSafetyFlags(value: Record<string, unknown>): void {
  if (
    value.boundedPrivateFrameInputAllowed !== true
    || value.ownedLutPassthroughHandledBySeparateTargetAssetWorkflow !== true
  ) throw new Error('Color Treatment required safety flags are invalid.')
  for (const key of [
    'rawFullMediaInputAllowed', 'rawFramePersistenceAllowed', 'rawHistogramPersistenceAllowed',
    'rawProviderPayloadPersistenceAllowed', 'technicalSignalsMayEstablishSemanticColorIntent',
    'exactPaletteSwatchTransferAllowed', 'exactColorValueTransferAllowed',
    'exactCurveOrControlPointTransferAllowed', 'exactGradeSettingTransferAllowed',
    'exactReferenceLutReconstructionAllowed', 'unownedReferenceLutTransferAllowed',
    'exactLookTransformTransferAllowed', 'executableTargetGradeAllowed', 'externalUrlFetchAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ] as const) if (value[key] !== false) throw new Error('Color Treatment request crossed a safety boundary.')
}

function validateBlockedResult(
  request: EditReferenceColorTreatmentStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'blockerCode', 'blockerMessage',
    'retryAvailable', 'retryReason', 'findings', 'boundedPrivateFramesRead',
    'technicalColorResultRead', 'providerCallMade', 'modelCallMade', 'workerJobCreated',
    'temporaryFramesCleaned', 'internalCostStatus', 'meteredInternalCostMicros',
    'usageEventIds', 'internalCostRecordIds', 'remoteMutationMade',
    'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceColorTreatmentStudyBlockerCode)) {
    throw new Error('Color Treatment blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 500, 'Color Treatment blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Color Treatment retry availability is invalid.')
  if (value.retryReason !== null) assertSafeText(value.retryReason, 500, 'Color Treatment retry reason is invalid.')
  if (value.retryAvailable !== (value.retryReason !== null)) throw new Error('Color Treatment retry state is inconsistent.')
  if (!Array.isArray(value.findings) || value.findings.length !== 0) {
    throw new Error('Blocked Color Treatment results cannot contain findings.')
  }
  for (const key of [
    'boundedPrivateFramesRead', 'technicalColorResultRead', 'providerCallMade',
    'modelCallMade', 'workerJobCreated', 'temporaryFramesCleaned',
  ] as const) if (typeof value[key] !== 'boolean') {
    throw new Error('Blocked Color Treatment execution evidence is invalid.')
  }
  if (
    value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Blocked Color Treatment results crossed a remote or customer-charging boundary.')
  if (!['not_incurred', 'metered', 'unverified'].includes(String(value.internalCostStatus))) {
    throw new Error('Blocked Color Treatment internal-cost status is invalid.')
  }
  if (value.meteredInternalCostMicros !== null) {
    assertMoneyMicros(value.meteredInternalCostMicros, 'Blocked Color Treatment internal cost is invalid.')
  }
  assertIdArray(value.usageEventIds, 64, true, 'Blocked Color Treatment usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Blocked Color Treatment internal-cost IDs are invalid.')
  if (request.executionScope === 'controlled_test') {
    if (
      value.providerCallMade !== false
      || value.modelCallMade !== false
      || value.workerJobCreated !== false
      || value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Color Treatment blockers cannot claim paid execution or cost.')
  } else if (value.providerCallMade === true || value.modelCallMade === true || value.workerJobCreated === true) {
    if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
      throw new Error('Blocked production Color Treatment execution requires attempt cost records.')
    }
    if (value.internalCostStatus === 'not_incurred') {
      throw new Error('Blocked paid Color Treatment execution cannot claim no cost was incurred.')
    }
    if (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null) {
      throw new Error('Unverified blocked Color Treatment cost must remain null.')
    }
    if (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null) {
      throw new Error('Metered blocked Color Treatment execution requires an amount.')
    }
    if (
      value.internalCostStatus === 'metered'
      && BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    ) throw new Error('Blocked Color Treatment execution exceeded its authorized maximum.')
  } else if (
    value.internalCostStatus !== 'not_incurred'
    || value.meteredInternalCostMicros !== '0'
    || (value.usageEventIds as string[]).length > 0
    || (value.internalCostRecordIds as string[]).length > 0
  ) throw new Error('Unstarted Color Treatment blockers cannot claim internal-cost usage.')
}

function validateNeedsMoreEvidenceResult(
  request: EditReferenceColorTreatmentStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'evidenceMode', 'missingEvidenceKinds',
    'findings', 'retryAvailable', 'retryReason', 'technicalSignalTreatedAsSemanticIntent',
    'providerCallMade', 'modelCallMade', 'workerJobCreated', 'remoteMutationMade',
    'customerPriceCalculated', 'customerCreditsMutated',
  ], 'needs-more-evidence result')
  if (
    request.evidenceMode !== 'technical_signal_only'
    || value.evidenceMode !== 'technical_signal_only'
    || !Array.isArray(value.missingEvidenceKinds)
    || !sameStringSet(value.missingEvidenceKinds as string[], ['bounded_semantic_frame_evidence'])
    || value.retryAvailable !== true
    || value.technicalSignalTreatedAsSemanticIntent !== false
  ) throw new Error('Color Treatment partial-evidence result is invalid.')
  assertSafeText(value.retryReason, 500, 'Color Treatment retry reason is invalid.')
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
  ) throw new Error('Color Treatment blocked or partial result cannot claim effects or findings.')
}

function validateAnalyzedResult(
  request: EditReferenceColorTreatmentStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion', 'requestDigestSha256', 'status', 'runtimeSource', 'workspaceId',
    'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId',
    'mediaChecksumSha256', 'evidenceManifestDigestSha256', 'frameManifestDigestSha256',
    'technicalColorResultDigestSha256', 'consumedFrameEvidenceIds', 'evidence',
    'technicalColorAuthority', 'findings', 'coverage', 'summary', 'execution', 'analyzer',
    'provenance', 'usage', 'privacy', 'copySafety', 'colorSafety', 'transferBoundary',
  ], 'analyzed result')
  if (request.evidenceMode !== 'frames_and_technical_signal') {
    throw new Error('Technical signals alone cannot create analyzed Color Treatment findings.')
  }
  if (!['verified_local', 'verified_live'].includes(String(value.runtimeSource))) {
    throw new Error('Color Treatment runtime source is invalid.')
  }
  for (const key of [
    'workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId',
    'privateMediaArtifactId', 'mediaChecksumSha256', 'evidenceManifestDigestSha256',
    'frameManifestDigestSha256', 'technicalColorResultDigestSha256',
  ] as const) if (value[key] !== request[key]) throw new Error(`Color Treatment ${key} does not match the request.`)
  assertMatchingIdSet(
    value.consumedFrameEvidenceIds,
    request.frameSamples.map((frame) => frame.frameEvidenceId),
    'Color Treatment consumed frame IDs do not match.',
  )
  validateMatchingEvidenceManifest(value.evidence, request.evidence)
  if (JSON.stringify(value.technicalColorAuthority) !== JSON.stringify(request.technicalColorAuthority)) {
    throw new Error('Color Treatment technical authority does not match the request.')
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
  validateColorSafety(request, value.colorSafety)
  validateTransferBoundary(value.transferBoundary)
}

function validateFindings(
  request: EditReferenceColorTreatmentStudyRequest,
  value: unknown,
): EditReferenceColorTreatmentFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FINDINGS) {
    throw new Error('Color Treatment findings are outside the approved bound.')
  }
  const findings = value as EditReferenceColorTreatmentFinding[]
  const findingIds = new Set<string>()
  const rangeIds = new Set<string>()
  const allowedEvidence = new Set(allEvidence(request.evidence))
  const allowedFrames = new Set(request.frameSamples.map((frame) => frame.frameEvidenceId))
  for (const finding of findings) {
    if (!isRecord(finding)) throw new Error('Color Treatment finding is invalid.')
    assertExactKeys(finding, [
      'findingId', 'category', 'summary', 'evidenceIds', 'frameEvidenceIds', 'sourceRanges',
      'confidence', 'transferability', 'targetAdaptationRequired', 'requiresUserReview',
      'skinToneRelated', 'brandColorRelated', 'hdrOrColorManagementRelated',
      'observedColorCharacterOnly', 'generalizedTonalPrincipleOnly',
      'technicalSignalContextOnly', 'exactPaletteSwatchesRetained', 'exactColorValuesRetained',
      'exactCurveOrControlPointsRetained', 'exactGradeSettingsRetained',
      'exactLutIdentityOrDataRetained', 'exactLookTransformRetained',
      'sourceBrandColorAssetCopied', 'executableTargetGradeCreated',
    ], 'finding')
    assertId(finding.findingId, 'Color Treatment finding ID is invalid.')
    if (findingIds.has(finding.findingId)) throw new Error('Color Treatment finding IDs must be unique.')
    findingIds.add(finding.findingId)
    if (!FINDING_CATEGORIES.has(finding.category as EditReferenceColorTreatmentFindingCategory)) {
      throw new Error('Color Treatment finding category is invalid.')
    }
    assertSafeText(finding.summary, 1_000, 'Color Treatment finding summary is invalid.')
    assertIdArray(finding.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Color Treatment finding evidence is invalid.')
    assertIdArray(finding.frameEvidenceIds, MAX_FRAME_COUNT, false, 'Color Treatment finding frames are invalid.')
    if ((finding.evidenceIds as string[]).some((id) => !allowedEvidence.has(id))) {
      throw new Error('Color Treatment finding cites unapproved evidence.')
    }
    if ((finding.frameEvidenceIds as string[]).some((id) => !allowedFrames.has(id))) {
      throw new Error('Color Treatment finding cites an unapproved frame.')
    }
    assertUnitInterval(finding.confidence, 'Color Treatment finding confidence is invalid.')
    if (!TRANSFERABILITIES.has(finding.transferability as EditReferenceColorTreatmentTransferability)) {
      throw new Error('Color Treatment transferability is invalid.')
    }
    if (
      typeof finding.requiresUserReview !== 'boolean'
      || typeof finding.skinToneRelated !== 'boolean'
      || typeof finding.brandColorRelated !== 'boolean'
      || typeof finding.hdrOrColorManagementRelated !== 'boolean'
      || finding.targetAdaptationRequired !== true
      || finding.observedColorCharacterOnly !== true
      || finding.generalizedTonalPrincipleOnly !== true
      || finding.technicalSignalContextOnly !== true
    ) throw new Error('Color Treatment finding safety metadata is invalid.')
    for (const key of [
      'exactPaletteSwatchesRetained', 'exactColorValuesRetained',
      'exactCurveOrControlPointsRetained', 'exactGradeSettingsRetained',
      'exactLutIdentityOrDataRetained', 'exactLookTransformRetained',
      'sourceBrandColorAssetCopied', 'executableTargetGradeCreated',
    ] as const) if (finding[key] !== false) throw new Error('Color Treatment finding retained exact or executable color data.')
    if (finding.skinToneRelated) {
      if (finding.category !== 'skin_tone_protection' || !request.sourcePeoplePresent || !finding.requiresUserReview) {
        throw new Error('Color Treatment skin-tone finding lacks people authority or review.')
      }
      if (!(finding.evidenceIds as string[]).some((id) => request.evidence.personPresenceEvidenceIds.includes(id))) {
        throw new Error('Color Treatment skin-tone finding lacks person-presence evidence.')
      }
    }
    if (finding.category === 'skin_tone_protection' && !finding.skinToneRelated) {
      throw new Error('Color Treatment skin-tone category must be marked skin-tone related.')
    }
    if (finding.brandColorRelated) {
      if (!request.sourceBrandColorContextPresent || !finding.requiresUserReview) {
        throw new Error('Color Treatment brand-color finding lacks rights authority or review.')
      }
      if (!(finding.evidenceIds as string[]).some((id) => request.evidence.rightsAndBrandEvidenceIds.includes(id))) {
        throw new Error('Color Treatment brand-color finding lacks rights evidence.')
      }
    }
    validateSourceRanges(request, finding, rangeIds)
  }
  return findings
}

function validateSourceRanges(
  request: EditReferenceColorTreatmentStudyRequest,
  finding: EditReferenceColorTreatmentFinding,
  rangeIds: Set<string>,
): void {
  if (!Array.isArray(finding.sourceRanges) || finding.sourceRanges.length < 1 || finding.sourceRanges.length > MAX_SOURCE_RANGES_PER_FINDING) {
    throw new Error('Color Treatment source ranges are outside the approved bound.')
  }
  for (const range of finding.sourceRanges) {
    if (!isRecord(range)) throw new Error('Color Treatment source range is invalid.')
    assertExactKeys(range, [
      'rangeId', 'startSeconds', 'endSeconds', 'evidenceIds', 'frameEvidenceIds',
      'sourceEvidenceOnly', 'targetGradeInstructionCreated', 'executableColorOperationCreated',
    ], 'source range')
    assertId(range.rangeId, 'Color Treatment source range ID is invalid.')
    if (rangeIds.has(range.rangeId)) throw new Error('Color Treatment source-range IDs must be unique.')
    rangeIds.add(range.rangeId)
    if (
      typeof range.startSeconds !== 'number'
      || !Number.isFinite(range.startSeconds)
      || typeof range.endSeconds !== 'number'
      || !Number.isFinite(range.endSeconds)
      || range.startSeconds < request.analysisWindowStartSeconds
      || range.endSeconds <= range.startSeconds
      || range.endSeconds > request.analysisWindowEndSeconds
    ) throw new Error('Color Treatment source range is outside the approved window.')
    assertIdArray(range.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Color Treatment source-range evidence is invalid.')
    assertIdArray(range.frameEvidenceIds, MAX_FRAME_COUNT, false, 'Color Treatment source-range frames are invalid.')
    if ((range.evidenceIds as string[]).some((id) => !finding.evidenceIds.includes(id))
      || (range.frameEvidenceIds as string[]).some((id) => !finding.frameEvidenceIds.includes(id))) {
      throw new Error('Color Treatment source range cites data outside its finding.')
    }
    if (
      range.sourceEvidenceOnly !== true
      || range.targetGradeInstructionCreated !== false
      || range.executableColorOperationCreated !== false
    ) throw new Error('Color Treatment source ranges cannot create target color operations.')
  }
}

function validateCoverage(request: EditReferenceColorTreatmentStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment coverage is invalid.')
  assertExactKeys(value, [
    'evidenceItemCount', 'frameCount', 'representativeFrameCount', 'sceneMatchFrameCount',
    'technicalSampleCount', 'sourceDurationSeconds', 'analysisWindowStartSeconds',
    'analysisWindowEndSeconds', 'analyzedDurationSeconds', 'evidenceMode', 'partial',
    'missingEvidenceKinds',
  ], 'coverage')
  if (
    value.evidenceItemCount !== allEvidence(request.evidence).length
    || value.frameCount !== request.frameSamples.length
    || value.representativeFrameCount !== request.frameSamples.filter((frame) => frame.role === 'representative').length
    || value.sceneMatchFrameCount !== request.frameSamples.filter((frame) => frame.role === 'scene_match').length
    || value.technicalSampleCount !== request.technicalColorAuthority.sampleCount
    || value.sourceDurationSeconds !== request.sourceDurationSeconds
    || value.analysisWindowStartSeconds !== request.analysisWindowStartSeconds
    || value.analysisWindowEndSeconds !== request.analysisWindowEndSeconds
    || value.analyzedDurationSeconds !== request.analysisWindowEndSeconds - request.analysisWindowStartSeconds
    || value.evidenceMode !== 'frames_and_technical_signal'
    || value.partial !== (request.technicalColorAuthority.coverage === 'partial')
  ) throw new Error('Color Treatment coverage does not match the request.')
  assertSafeStringArray(value.missingEvidenceKinds, 16, true, 100, 'Color Treatment missing-evidence kinds are invalid.')
  const expected = request.technicalColorAuthority.coverage === 'partial' ? ['technical_signal_partial_coverage'] : []
  if (!sameStringSet(value.missingEvidenceKinds as string[], expected)) {
    throw new Error('Color Treatment missing-evidence kinds do not match coverage.')
  }
}

function validateSummary(findings: readonly EditReferenceColorTreatmentFinding[], value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment summary is invalid.')
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
  ) throw new Error('Color Treatment summary does not match its findings.')
}

function validateExecution(
  request: EditReferenceColorTreatmentStudyRequest,
  runtimeSource: unknown,
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Color Treatment execution proof is invalid.')
  assertExactKeys(value, [
    'boundedPrivateFramesRead', 'technicalColorResultRead', 'semanticColorTreatmentModelExecuted',
    'rawFullMediaRead', 'rawHistogramRead', 'externalUrlFetched', 'providerCallMade',
    'modelCallMade', 'workerJobCreated', 'temporaryFramesCleaned', 'remoteMutationMade',
  ], 'execution proof')
  if (
    value.boundedPrivateFramesRead !== true
    || value.technicalColorResultRead !== true
    || value.semanticColorTreatmentModelExecuted !== true
    || value.rawFullMediaRead !== false
    || value.rawHistogramRead !== false
    || value.externalUrlFetched !== false
    || value.modelCallMade !== true
    || typeof value.workerJobCreated !== 'boolean'
    || value.temporaryFramesCleaned !== true
    || value.remoteMutationMade !== false
    || request.frameSamples.length < 1
  ) throw new Error('Color Treatment analyzed result lacks bounded execution proof.')
  if (runtimeSource === 'verified_local' && value.providerCallMade !== false) {
    throw new Error('Local Color Treatment execution cannot claim a provider call.')
  }
  if (runtimeSource === 'verified_live' && value.providerCallMade !== true) {
    throw new Error('Live Color Treatment execution requires provider-call proof.')
  }
}

function validateAnalyzer(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment analyzer provenance is invalid.')
  assertExactKeys(value, [
    'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRevision',
    'modelAggregateSha256', 'modelRoutingPolicyVersion', 'analysisInstructionDigestSha256',
  ], 'analyzer provenance')
  for (const key of ['adapterId', 'adapterVersion', 'modelId', 'modelRevision', 'modelRoutingPolicyVersion'] as const) {
    assertId(value[key], 'Color Treatment analyzer provenance ID is invalid.')
  }
  assertSha256(value.modelAggregateSha256, 'Color Treatment model aggregate digest is invalid.')
  assertSha256(value.analysisInstructionDigestSha256, 'Color Treatment instruction digest is invalid.')
  if (runtimeSource === 'verified_local') {
    if (value.providerId !== null) throw new Error('Local Color Treatment analyzer cannot claim a provider.')
  } else assertId(value.providerId, 'Live Color Treatment analyzer requires a provider ID.')
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment provenance is invalid.')
  assertExactKeys(value, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  assertId(value.executionId, 'Color Treatment execution ID is invalid.')
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.completedAt)
    || Date.parse(value.completedAt as string) < Date.parse(value.startedAt as string)) {
    throw new Error('Color Treatment provenance timestamps are invalid.')
  }
}

function validateUsage(request: EditReferenceColorTreatmentStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment usage evidence is invalid.')
  assertExactKeys(value, [
    'mode', 'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'usage evidence')
  assertMoneyMicros(value.meteredInternalCostMicros, 'Color Treatment metered internal cost is invalid.')
  assertIdArray(value.usageEventIds, 32, true, 'Color Treatment usage event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 32, true, 'Color Treatment internal-cost record IDs are invalid.')
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
    ) throw new Error('Controlled Color Treatment tests cannot claim production cost records.')
  } else {
    if (
      value.mode !== 'production_metered'
      || value.approvedUsageEstimateId !== request.approvedUsageEstimateId
      || value.internalCostBudgetId !== request.internalCostBudgetId
      || value.immutableRateCardSnapshotId !== request.immutableRateCardSnapshotId
      || value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
      || (value.usageEventIds as unknown[]).length < 1
      || (value.internalCostRecordIds as unknown[]).length < 1
    ) throw new Error('Production Color Treatment execution requires exact internal-cost authority.')
    if (BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
      throw new Error('Color Treatment execution exceeded its maximum authorized internal cost.')
    }
  }
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Color Treatment usage crossed the customer-pricing boundary.')
}

function validatePrivacy(value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment privacy evidence is invalid.')
  assertExactKeys(value, [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawHistogramsPersisted',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
    'temporaryFramesCleaned',
  ], 'privacy evidence')
  for (const key of [
    'rawFullMediaPersisted', 'rawFramesPersisted', 'rawHistogramsPersisted',
    'rawProviderPayloadPersisted', 'signedUrlPersisted', 'hiddenChainOfThoughtPersisted',
  ] as const) if (value[key] !== false) throw new Error('Color Treatment privacy boundary is invalid.')
  if (value.temporaryFramesCleaned !== true) throw new Error('Color Treatment temporary frames must be cleaned.')
}

function validateCopySafety(value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment copy-safety evidence is invalid.')
  assertExactKeys(value, [
    'exactPaletteSwatchTransferInstructionCreated', 'exactColorValueTransferInstructionCreated',
    'exactCurveOrControlPointTransferInstructionCreated', 'exactGradeSettingTransferInstructionCreated',
    'exactReferenceLutReconstructed', 'unownedReferenceLutTransferInstructionCreated',
    'exactLookTransformTransferInstructionCreated', 'sourceBrandColorAssetCopied',
  ], 'copy-safety evidence')
  if (Object.values(value).some((entry) => entry !== false)) {
    throw new Error('Color Treatment copy-safety boundary is invalid.')
  }
}

function validateColorSafety(request: EditReferenceColorTreatmentStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment safety evidence is invalid.')
  assertExactKeys(value, [
    'technicalSignalTreatedAsSemanticIntent', 'targetColorSpaceReviewRequired',
    'targetHdrSdrTransformReviewRequired', 'targetShotMatchQaRequired',
    'targetGeneratedAssetMatchQaRequired', 'targetSkinToneReviewRequired',
    'targetBrandColorReviewRequired', 'finalRenderColorQaRequired',
    'clippingOrCrushedDetailInstructionCreated',
  ], 'color safety')
  if (
    value.technicalSignalTreatedAsSemanticIntent !== false
    || value.targetColorSpaceReviewRequired !== true
    || value.targetHdrSdrTransformReviewRequired !== true
    || value.targetShotMatchQaRequired !== true
    || value.targetGeneratedAssetMatchQaRequired !== true
    || value.targetSkinToneReviewRequired !== request.sourcePeoplePresent
    || value.targetBrandColorReviewRequired !== request.sourceBrandColorContextPresent
    || value.finalRenderColorQaRequired !== true
    || value.clippingOrCrushedDetailInstructionCreated !== false
  ) throw new Error('Color Treatment safety evidence does not match the request.')
}

function validateTransferBoundary(value: unknown): void {
  if (!isRecord(value)) throw new Error('Color Treatment transfer boundary is invalid.')
  assertExactKeys(value, [
    'findingsMayBecomeTargetInstructionsWithoutApplication', 'targetEvidenceRequired',
    'targetMediaColorAnalysisRequired', 'targetInputWorkingOutputColorSpaceReviewRequired',
    'targetSceneAndShotMatchingRequired', 'userApprovalRequired',
    'ownedLutPassthroughRequiresSeparateTargetAssetApproval',
    'exactReferenceGradeOrUnownedLutTransferAllowed',
  ], 'transfer boundary')
  if (
    value.findingsMayBecomeTargetInstructionsWithoutApplication !== false
    || value.targetEvidenceRequired !== true
    || value.targetMediaColorAnalysisRequired !== true
    || value.targetInputWorkingOutputColorSpaceReviewRequired !== true
    || value.targetSceneAndShotMatchingRequired !== true
    || value.userApprovalRequired !== true
    || value.ownedLutPassthroughRequiresSeparateTargetAssetApproval !== true
    || value.exactReferenceGradeOrUnownedLutTransferAllowed !== false
  ) throw new Error('Color Treatment transfer boundary is invalid.')
}

function normalizedEvidenceManifest(
  evidence: EditReferenceColorTreatmentEvidenceManifest,
): EditReferenceColorTreatmentEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...evidence.mediaStructureEvidenceIds].sort(),
    representativeFrameEvidenceIds: [...evidence.representativeFrameEvidenceIds].sort(),
    technicalColorSignalEvidenceIds: [...evidence.technicalColorSignalEvidenceIds].sort(),
    visualLanguageEvidenceIds: [...evidence.visualLanguageEvidenceIds].sort(),
    studyChatGoalEvidenceIds: [...evidence.studyChatGoalEvidenceIds].sort(),
    personPresenceEvidenceIds: [...evidence.personPresenceEvidenceIds].sort(),
    rightsAndBrandEvidenceIds: [...evidence.rightsAndBrandEvidenceIds].sort(),
  }
}

function validateMatchingEvidenceManifest(
  value: unknown,
  expected: EditReferenceColorTreatmentEvidenceManifest,
): void {
  if (!isRecord(value)) throw new Error('Color Treatment result evidence manifest is invalid.')
  const normalized = normalizedEvidenceManifest(value as unknown as EditReferenceColorTreatmentEvidenceManifest)
  if (JSON.stringify(normalized) !== JSON.stringify(normalizedEvidenceManifest(expected))) {
    throw new Error('Color Treatment result evidence manifest does not match the request.')
  }
}

function allEvidence(evidence: EditReferenceColorTreatmentEvidenceManifest): string[] {
  return Object.values(normalizedEvidenceManifest(evidence)).flat()
}

function assertNoForbiddenContent(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenContent(entry, `${path}[${index}]`))
    return
  }
  if (!isRecord(value)) {
    if (typeof value === 'string' && UNSAFE_STRING_PATTERN.test(value)) {
      throw new Error(`Color Treatment ${path} contains unsafe content.`)
    }
    return
  }
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Color Treatment ${path}.${key} is forbidden.`)
    assertNoForbiddenContent(entry, `${path}.${key}`)
  }
}

function assertExactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`Color Treatment ${label} fields are invalid.`)
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
