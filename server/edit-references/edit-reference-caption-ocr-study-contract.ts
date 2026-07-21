import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_CAPTION_OCR_STUDY_REQUEST_VERSION =
  'edit-reference-caption-ocr-study-request-v1' as const
export const EDIT_REFERENCE_CAPTION_OCR_STUDY_RESULT_VERSION =
  'edit-reference-caption-ocr-study-result-v1' as const

export const EDIT_REFERENCE_CAPTION_OCR_TOOL_IDS = ['paddleocr', 'tesseract'] as const
export type EditReferenceCaptionOcrToolId = typeof EDIT_REFERENCE_CAPTION_OCR_TOOL_IDS[number]

export interface EditReferenceCaptionOcrStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_CAPTION_OCR_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly framePlanDigestSha256: string
  readonly privateArtifactAccessVerified: true
  readonly privateArtifactFinalized: true
  readonly mediaChecksumVerified: true
  readonly inputEvidenceIds: readonly string[]
  readonly frameTimesSeconds: readonly number[]
  readonly maxScanDurationSeconds: number
  readonly maxRegionsPerFrame: number
  readonly permittedToolIds: readonly EditReferenceCaptionOcrToolId[]
  readonly languageHints: readonly string[]
  readonly executionScope: 'controlled_test' | 'reviewed_local' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly exactTextRetention: 'forbidden'
  readonly externalUrlFetchAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
}

export interface EditReferenceCaptionOcrNormalizedBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface EditReferenceCaptionOcrTextRegionObservation {
  readonly regionId: string
  readonly normalizedBounds: EditReferenceCaptionOcrNormalizedBounds
  readonly lineCount: number
  readonly estimatedCharacterCount: number
  readonly confidence: number
  readonly exactTextPersisted: false
}

export interface EditReferenceCaptionOcrFrameObservation {
  readonly frameTimeSeconds: number
  readonly textRegions: readonly EditReferenceCaptionOcrTextRegionObservation[]
}

export interface EditReferenceAnalyzedCaptionOcrStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_CAPTION_OCR_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'analyzed'
  readonly runtimeSource: 'verified_local'
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly framePlanDigestSha256: string
  readonly inputEvidenceIds: readonly string[]
  readonly analysisArtifactIds: readonly string[]
  readonly tool: {
    readonly toolId: EditReferenceCaptionOcrToolId
    readonly toolVersion: string
    readonly languagePackIds: readonly string[]
    readonly modelWeightOrCheckpointReviewVerified: true
    readonly languagePackReviewVerified: true
  }
  readonly coverage: {
    readonly requestedFrameTimesSeconds: readonly number[]
    readonly analyzedFrameTimesSeconds: readonly number[]
    readonly failedFrameTimesSeconds: readonly number[]
    readonly partial: boolean
  }
  readonly observations: readonly EditReferenceCaptionOcrFrameObservation[]
  readonly summary: {
    readonly analyzedFrameCount: number
    readonly framesWithVisibleText: number
    readonly totalTextRegionCount: number
    readonly averageRegionConfidence: number
  }
  readonly execution: {
    readonly fileBytesRead: true
    readonly mediaProcessingStarted: true
    readonly ocrEngineExecuted: true
    readonly externalUrlFetched: false
    readonly providerCallMade: false
    readonly remoteMutationMade: false
    readonly workerJobCreated: boolean
  }
  readonly provenance: {
    readonly adapterId: string
    readonly adapterVersion: string
    readonly executionId: string
    readonly startedAt: string
    readonly completedAt: string
  }
  readonly usage: {
    readonly mode: 'backend_local_unmetered' | 'controlled_test_unmetered' | 'production_metered'
    readonly approvedUsageEstimateId: string | null
    readonly internalCostBudgetId: string | null
    readonly maximumAuthorizedInternalCostMicros: string | null
    readonly meteredInternalCostMicros: string
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly privacy: {
    readonly rawFramesPersisted: false
    readonly rawOcrOutputPersisted: false
    readonly recognizedTextPersisted: false
    readonly signedUrlPersisted: false
    readonly rawProviderPayloadPersisted: false
  }
  readonly semanticBoundary: {
    readonly captionDesignInterpreted: false
    readonly transcriptAlignmentRan: false
    readonly speechTimingRan: false
  }
  readonly copySafety: {
    readonly exactCaptionWordingRetained: false
    readonly exactTimingCopyInstructionCreated: false
    readonly referenceLayoutCopyInstructionCreated: false
  }
}

export type EditReferenceCaptionOcrStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'model_weight_review_required'
  | 'language_pack_review_required'
  | 'frame_plan_invalid'
  | 'privacy_policy_denied'

export interface EditReferenceBlockedCaptionOcrStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_CAPTION_OCR_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceCaptionOcrStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly observations: readonly []
  readonly providerCallMade: false
  readonly remoteMutationMade: false
  readonly ocrEngineExecuted: false
}

export type EditReferenceCaptionOcrStudyResult =
  | EditReferenceAnalyzedCaptionOcrStudyResult
  | EditReferenceBlockedCaptionOcrStudyResult

export interface EditReferenceCaptionOcrStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  readonly supportedToolIds: readonly EditReferenceCaptionOcrToolId[]
  analyze(request: EditReferenceCaptionOcrStudyRequest): Promise<EditReferenceCaptionOcrStudyResult>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const LANGUAGE_HINT_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const MAX_FRAME_COUNT = 24
const MAX_SCAN_DURATION_SECONDS = 120
const MAX_REGIONS_PER_FRAME = 16
const FORBIDDEN_KEYS = new Set([
  'apiKey',
  'api_key',
  'authorization',
  'bytes',
  'filePath',
  'file_path',
  'localPath',
  'local_path',
  'password',
  'payload',
  'rawFrame',
  'rawFrames',
  'rawOcrOutput',
  'rawPayload',
  'rawProviderPayload',
  'recognizedText',
  'secret',
  'signedUrl',
  'signed_url',
  'text',
  'token',
  'tokens',
  'url',
  'words',
])
const UNSAFE_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i
const BLOCKER_CODES = new Set<EditReferenceCaptionOcrStudyBlockerCode>([
  'adapter_unavailable',
  'private_artifact_unavailable',
  'model_weight_review_required',
  'language_pack_review_required',
  'frame_plan_invalid',
  'privacy_policy_denied',
])

function stableRequestPayload(request: EditReferenceCaptionOcrStudyRequest): string {
  return JSON.stringify({
    schemaVersion: request.schemaVersion,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    framePlanDigestSha256: request.framePlanDigestSha256,
    privateArtifactAccessVerified: request.privateArtifactAccessVerified,
    privateArtifactFinalized: request.privateArtifactFinalized,
    mediaChecksumVerified: request.mediaChecksumVerified,
    inputEvidenceIds: [...request.inputEvidenceIds],
    frameTimesSeconds: [...request.frameTimesSeconds],
    maxScanDurationSeconds: request.maxScanDurationSeconds,
    maxRegionsPerFrame: request.maxRegionsPerFrame,
    permittedToolIds: [...request.permittedToolIds],
    languageHints: [...request.languageHints],
    executionScope: request.executionScope,
    approvedUsageEstimateId: request.approvedUsageEstimateId,
    internalCostBudgetId: request.internalCostBudgetId,
    maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
    exactTextRetention: request.exactTextRetention,
    externalUrlFetchAllowed: request.externalUrlFetchAllowed,
    customerPriceCalculationAllowed: request.customerPriceCalculationAllowed,
    customerCreditMutationAllowed: request.customerCreditMutationAllowed,
  })
}

export function hashEditReferenceCaptionOcrStudyRequest(
  request: EditReferenceCaptionOcrStudyRequest,
): string {
  validateEditReferenceCaptionOcrStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function validateEditReferenceCaptionOcrStudyRequest(
  value: unknown,
): asserts value is EditReferenceCaptionOcrStudyRequest {
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Caption OCR study request must be an object.')
  assertExactKeys(value, [
    'schemaVersion',
    'workspaceId',
    'editReferenceId',
    'studySessionId',
    'orchestrationId',
    'privateMediaArtifactId',
    'mediaChecksumSha256',
    'framePlanDigestSha256',
    'privateArtifactAccessVerified',
    'privateArtifactFinalized',
    'mediaChecksumVerified',
    'inputEvidenceIds',
    'frameTimesSeconds',
    'maxScanDurationSeconds',
    'maxRegionsPerFrame',
    'permittedToolIds',
    'languageHints',
    'executionScope',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'maximumAuthorizedInternalCostMicros',
    'exactTextRetention',
    'externalUrlFetchAllowed',
    'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_CAPTION_OCR_STUDY_REQUEST_VERSION) {
    throw new Error('Caption OCR study request version is unsupported.')
  }
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    assertId(value[key], `Caption OCR study ${key} is invalid.`)
  }
  assertSha256(value.mediaChecksumSha256, 'Caption OCR study media checksum is invalid.')
  assertSha256(value.framePlanDigestSha256, 'Caption OCR study frame-plan digest is invalid.')
  if (
    value.privateArtifactAccessVerified !== true
    || value.privateArtifactFinalized !== true
    || value.mediaChecksumVerified !== true
  ) {
    throw new Error('Caption OCR study private media authority is incomplete.')
  }
  assertIdArray(value.inputEvidenceIds, 64, false, 'Caption OCR study input evidence IDs are invalid.')
  if (
    typeof value.maxScanDurationSeconds !== 'number'
    || !Number.isFinite(value.maxScanDurationSeconds)
    || value.maxScanDurationSeconds <= 0
    || value.maxScanDurationSeconds > MAX_SCAN_DURATION_SECONDS
  ) {
    throw new Error('Caption OCR study scan duration is outside the approved bound.')
  }
  if (
    typeof value.maxRegionsPerFrame !== 'number'
    || !Number.isSafeInteger(value.maxRegionsPerFrame)
    || value.maxRegionsPerFrame < 1
    || value.maxRegionsPerFrame > MAX_REGIONS_PER_FRAME
  ) {
    throw new Error('Caption OCR study region limit is outside the approved bound.')
  }
  assertFrameTimes(value.frameTimesSeconds, value.maxScanDurationSeconds, 'Caption OCR study frame times are invalid.')
  if (
    !Array.isArray(value.permittedToolIds)
    || value.permittedToolIds.length < 1
    || value.permittedToolIds.length > EDIT_REFERENCE_CAPTION_OCR_TOOL_IDS.length
    || new Set(value.permittedToolIds).size !== value.permittedToolIds.length
    || value.permittedToolIds.some((toolId) => !EDIT_REFERENCE_CAPTION_OCR_TOOL_IDS.includes(toolId as EditReferenceCaptionOcrToolId))
  ) {
    throw new Error('Caption OCR study permitted tools are invalid.')
  }
  if (
    !Array.isArray(value.languageHints)
    || value.languageHints.length < 1
    || value.languageHints.length > 8
    || new Set(value.languageHints).size !== value.languageHints.length
    || value.languageHints.some((hint) => typeof hint !== 'string' || !LANGUAGE_HINT_PATTERN.test(hint))
  ) {
    throw new Error('Caption OCR study language hints are invalid.')
  }
  if (!['controlled_test', 'reviewed_local', 'production'].includes(String(value.executionScope))) {
    throw new Error('Caption OCR study execution scope is invalid.')
  }
  if (value.executionScope !== 'production') {
    if (
      value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
    ) {
      throw new Error('Unmetered Caption OCR execution cannot claim a production cost authorization.')
    }
  } else {
    assertId(value.approvedUsageEstimateId, 'Production Caption OCR requires an approved usage estimate.')
    assertId(value.internalCostBudgetId, 'Production Caption OCR requires an internal cost budget.')
    assertPositiveMoneyMicros(value.maximumAuthorizedInternalCostMicros, 'Production Caption OCR requires a positive maximum authorized internal cost.')
  }
  if (
    value.exactTextRetention !== 'forbidden'
    || value.externalUrlFetchAllowed !== false
    || value.customerPriceCalculationAllowed !== false
    || value.customerCreditMutationAllowed !== false
  ) {
    throw new Error('Caption OCR study safety and cost boundaries are invalid.')
  }
}

export function validateEditReferenceCaptionOcrStudyResult(
  request: EditReferenceCaptionOcrStudyRequest,
  value: unknown,
): asserts value is EditReferenceCaptionOcrStudyResult {
  validateEditReferenceCaptionOcrStudyRequest(request)
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Caption OCR study result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_CAPTION_OCR_STUDY_RESULT_VERSION) {
    throw new Error('Caption OCR study result version is unsupported.')
  }
  if (value.requestDigestSha256 !== hashEditReferenceCaptionOcrStudyRequest(request)) {
    throw new Error('Caption OCR study result does not match the exact request.')
  }
  if (value.status === 'blocked') {
    validateBlockedResult(value)
    return
  }
  if (value.status !== 'analyzed') throw new Error('Caption OCR study result status is unsupported.')
  validateAnalyzedResult(request, value)
}

export function hashEditReferenceCaptionOcrStudyResult(
  request: EditReferenceCaptionOcrStudyRequest,
  value: EditReferenceCaptionOcrStudyResult,
): string {
  validateEditReferenceCaptionOcrStudyResult(request, value)
  return createHash('sha256').update(stableCanonicalJson(value)).digest('hex')
}

function validateBlockedResult(value: Record<string, unknown>): void {
  assertExactKeys(value, [
    'schemaVersion',
    'requestDigestSha256',
    'status',
    'blockerCode',
    'blockerMessage',
    'retryAvailable',
    'retryReason',
    'observations',
    'providerCallMade',
    'remoteMutationMade',
    'ocrEngineExecuted',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceCaptionOcrStudyBlockerCode)) {
    throw new Error('Caption OCR study blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 500, 'Caption OCR study blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Caption OCR study retry flag is invalid.')
  if (value.retryAvailable) {
    assertSafeText(value.retryReason, 500, 'Retryable Caption OCR study blockers require a safe reason.')
  } else if (value.retryReason !== null) {
    throw new Error('Non-retryable Caption OCR study blockers cannot include a retry reason.')
  }
  if (
    !Array.isArray(value.observations)
    || value.observations.length !== 0
    || value.providerCallMade !== false
    || value.remoteMutationMade !== false
    || value.ocrEngineExecuted !== false
  ) {
    throw new Error('Blocked Caption OCR study results cannot contain observations or side effects.')
  }
}

function validateAnalyzedResult(
  request: EditReferenceCaptionOcrStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion',
    'requestDigestSha256',
    'status',
    'runtimeSource',
    'workspaceId',
    'editReferenceId',
    'studySessionId',
    'orchestrationId',
    'privateMediaArtifactId',
    'mediaChecksumSha256',
    'framePlanDigestSha256',
    'inputEvidenceIds',
    'analysisArtifactIds',
    'tool',
    'coverage',
    'observations',
    'summary',
    'execution',
    'provenance',
    'usage',
    'privacy',
    'semanticBoundary',
    'copySafety',
  ], 'analyzed result')
  if (value.runtimeSource !== 'verified_local') throw new Error('Caption OCR analyzed runtime source must be verified local.')
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    if (value[key] !== request[key]) throw new Error('Caption OCR analyzed result identity does not match the request.')
  }
  if (value.mediaChecksumSha256 !== request.mediaChecksumSha256 || value.framePlanDigestSha256 !== request.framePlanDigestSha256) {
    throw new Error('Caption OCR analyzed result media lineage does not match the request.')
  }
  assertMatchingIdArray(value.inputEvidenceIds, request.inputEvidenceIds, 'Caption OCR analyzed input evidence does not match the request.')
  assertIdArray(value.analysisArtifactIds, 32, false, 'Caption OCR analysis artifact IDs are invalid.')
  validateTool(request, value.tool)
  const coverage = validateCoverage(request, value.coverage)
  const observations = validateObservations(request, coverage.analyzedFrameTimesSeconds, value.observations)
  validateSummary(observations, value.summary)
  validateExecution(value.execution)
  validateProvenance(value.provenance)
  validateUsage(request, value.usage)
  validateAllFalseObject(value.privacy, [
    'rawFramesPersisted',
    'rawOcrOutputPersisted',
    'recognizedTextPersisted',
    'signedUrlPersisted',
    'rawProviderPayloadPersisted',
  ], 'Caption OCR privacy boundary is invalid.')
  validateAllFalseObject(value.semanticBoundary, [
    'captionDesignInterpreted',
    'transcriptAlignmentRan',
    'speechTimingRan',
  ], 'Caption OCR semantic boundary is invalid.')
  validateAllFalseObject(value.copySafety, [
    'exactCaptionWordingRetained',
    'exactTimingCopyInstructionCreated',
    'referenceLayoutCopyInstructionCreated',
  ], 'Caption OCR copy-safety boundary is invalid.')
}

function validateTool(request: EditReferenceCaptionOcrStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption OCR tool provenance is invalid.')
  assertExactKeys(value, [
    'toolId',
    'toolVersion',
    'languagePackIds',
    'modelWeightOrCheckpointReviewVerified',
    'languagePackReviewVerified',
  ], 'tool provenance')
  if (
    !request.permittedToolIds.includes(value.toolId as EditReferenceCaptionOcrToolId)
    || !EDIT_REFERENCE_CAPTION_OCR_TOOL_IDS.includes(value.toolId as EditReferenceCaptionOcrToolId)
  ) {
    throw new Error('Caption OCR result used an unapproved tool.')
  }
  assertId(value.toolVersion, 'Caption OCR tool version is invalid.')
  assertIdArray(value.languagePackIds, 8, false, 'Caption OCR language-pack IDs are invalid.')
  if (value.modelWeightOrCheckpointReviewVerified !== true || value.languagePackReviewVerified !== true) {
    throw new Error('Caption OCR result lacks model/checkpoint or language-pack review proof.')
  }
}

function validateCoverage(
  request: EditReferenceCaptionOcrStudyRequest,
  value: unknown,
): {
  analyzedFrameTimesSeconds: readonly number[]
  failedFrameTimesSeconds: readonly number[]
} {
  if (!isRecord(value)) throw new Error('Caption OCR coverage is invalid.')
  assertExactKeys(value, [
    'requestedFrameTimesSeconds',
    'analyzedFrameTimesSeconds',
    'failedFrameTimesSeconds',
    'partial',
  ], 'coverage')
  assertMatchingNumberArray(value.requestedFrameTimesSeconds, request.frameTimesSeconds, 'Caption OCR requested coverage does not match the frame plan.')
  assertFrameTimes(value.analyzedFrameTimesSeconds, request.maxScanDurationSeconds, 'Caption OCR analyzed frame times are invalid.')
  if (!Array.isArray(value.failedFrameTimesSeconds)) throw new Error('Caption OCR failed frame times are invalid.')
  if (value.failedFrameTimesSeconds.length > 0) {
    assertFrameTimes(value.failedFrameTimesSeconds, request.maxScanDurationSeconds, 'Caption OCR failed frame times are invalid.')
  }
  const analyzed = value.analyzedFrameTimesSeconds as number[]
  const failed = value.failedFrameTimesSeconds as number[]
  if (analyzed.length < 1) throw new Error('Analyzed Caption OCR results require at least one analyzed frame.')
  const combined = [...analyzed, ...failed].sort((left, right) => left - right)
  if (!sameNumberArray(combined, request.frameTimesSeconds) || new Set(combined).size !== combined.length) {
    throw new Error('Caption OCR coverage must partition the exact requested frame plan.')
  }
  if (value.partial !== (failed.length > 0)) throw new Error('Caption OCR partial coverage flag is inconsistent.')
  return { analyzedFrameTimesSeconds: analyzed, failedFrameTimesSeconds: failed }
}

function validateObservations(
  request: EditReferenceCaptionOcrStudyRequest,
  analyzedFrameTimesSeconds: readonly number[],
  value: unknown,
): readonly EditReferenceCaptionOcrFrameObservation[] {
  if (!Array.isArray(value) || value.length !== analyzedFrameTimesSeconds.length) {
    throw new Error('Caption OCR observations must cover every analyzed frame exactly once.')
  }
  const observations = value as unknown as EditReferenceCaptionOcrFrameObservation[]
  const seenTimes = new Set<number>()
  const seenRegionIds = new Set<string>()
  for (const observation of observations) {
    if (!isRecord(observation)) throw new Error('Caption OCR frame observation is invalid.')
    assertExactKeys(observation, ['frameTimeSeconds', 'textRegions'], 'frame observation')
    if (!analyzedFrameTimesSeconds.includes(observation.frameTimeSeconds) || seenTimes.has(observation.frameTimeSeconds)) {
      throw new Error('Caption OCR frame observation time is outside the analyzed coverage.')
    }
    seenTimes.add(observation.frameTimeSeconds)
    if (!Array.isArray(observation.textRegions) || observation.textRegions.length > request.maxRegionsPerFrame) {
      throw new Error('Caption OCR frame region count exceeds the approved bound.')
    }
    for (const region of observation.textRegions) {
      validateRegion(region, seenRegionIds)
    }
  }
  if (!sameNumberArray([...seenTimes].sort((left, right) => left - right), [...analyzedFrameTimesSeconds].sort((left, right) => left - right))) {
    throw new Error('Caption OCR observations do not match analyzed coverage.')
  }
  return observations
}

function validateRegion(value: unknown, seenRegionIds: Set<string>): void {
  if (!isRecord(value)) throw new Error('Caption OCR text region is invalid.')
  assertExactKeys(value, [
    'regionId',
    'normalizedBounds',
    'lineCount',
    'estimatedCharacterCount',
    'confidence',
    'exactTextPersisted',
  ], 'text region')
  assertId(value.regionId, 'Caption OCR region ID is invalid.')
  if (seenRegionIds.has(value.regionId)) throw new Error('Caption OCR region IDs must be unique.')
  seenRegionIds.add(value.regionId)
  validateBounds(value.normalizedBounds)
  if (typeof value.lineCount !== 'number' || !Number.isSafeInteger(value.lineCount) || value.lineCount < 1 || value.lineCount > 8) {
    throw new Error('Caption OCR line count is invalid.')
  }
  if (
    typeof value.estimatedCharacterCount !== 'number'
    || !Number.isSafeInteger(value.estimatedCharacterCount)
    || value.estimatedCharacterCount < 1
    || value.estimatedCharacterCount > 500
  ) {
    throw new Error('Caption OCR estimated character count is invalid.')
  }
  assertUnitInterval(value.confidence, 'Caption OCR region confidence is invalid.')
  if (value.exactTextPersisted !== false) throw new Error('Caption OCR exact recognized text must not persist.')
}

function validateBounds(value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption OCR normalized bounds are invalid.')
  assertExactKeys(value, ['x', 'y', 'width', 'height'], 'normalized bounds')
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    assertUnitInterval(value[key], 'Caption OCR normalized bounds are invalid.')
  }
  if (
    typeof value.width !== 'number'
    || typeof value.height !== 'number'
    || value.width <= 0
    || value.height <= 0
    || (value.x as number) + value.width > 1.000_001
    || (value.y as number) + value.height > 1.000_001
  ) {
    throw new Error('Caption OCR normalized bounds exceed the frame.')
  }
}

function validateSummary(
  observations: readonly EditReferenceCaptionOcrFrameObservation[],
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Caption OCR summary is invalid.')
  assertExactKeys(value, [
    'analyzedFrameCount',
    'framesWithVisibleText',
    'totalTextRegionCount',
    'averageRegionConfidence',
  ], 'summary')
  const regions = observations.flatMap((observation) => observation.textRegions)
  const framesWithVisibleText = observations.filter((observation) => observation.textRegions.length > 0).length
  const averageConfidence = regions.length === 0
    ? 0
    : regions.reduce((sum, region) => sum + region.confidence, 0) / regions.length
  if (
    value.analyzedFrameCount !== observations.length
    || value.framesWithVisibleText !== framesWithVisibleText
    || value.totalTextRegionCount !== regions.length
    || typeof value.averageRegionConfidence !== 'number'
    || !Number.isFinite(value.averageRegionConfidence)
    || Math.abs(value.averageRegionConfidence - averageConfidence) > 0.000_001
  ) {
    throw new Error('Caption OCR summary does not match the bounded observations.')
  }
}

function validateExecution(value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption OCR execution proof is invalid.')
  assertExactKeys(value, [
    'fileBytesRead',
    'mediaProcessingStarted',
    'ocrEngineExecuted',
    'externalUrlFetched',
    'providerCallMade',
    'remoteMutationMade',
    'workerJobCreated',
  ], 'execution proof')
  if (
    value.fileBytesRead !== true
    || value.mediaProcessingStarted !== true
    || value.ocrEngineExecuted !== true
    || value.externalUrlFetched !== false
    || value.providerCallMade !== false
    || value.remoteMutationMade !== false
    || typeof value.workerJobCreated !== 'boolean'
  ) {
    throw new Error('Caption OCR analyzed result lacks exact local execution proof.')
  }
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption OCR provenance is invalid.')
  assertExactKeys(value, ['adapterId', 'adapterVersion', 'executionId', 'startedAt', 'completedAt'], 'provenance')
  for (const key of ['adapterId', 'adapterVersion', 'executionId'] as const) {
    assertId(value[key], 'Caption OCR provenance ID is invalid.')
  }
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.completedAt)) throw new Error('Caption OCR provenance timestamps are invalid.')
  if (Date.parse(value.completedAt) < Date.parse(value.startedAt)) throw new Error('Caption OCR provenance time order is invalid.')
}

function validateUsage(request: EditReferenceCaptionOcrStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Caption OCR usage evidence is invalid.')
  assertExactKeys(value, [
    'mode',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'maximumAuthorizedInternalCostMicros',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'usage evidence')
  if (!['backend_local_unmetered', 'controlled_test_unmetered', 'production_metered'].includes(String(value.mode))) {
    throw new Error('Caption OCR usage mode is invalid.')
  }
  assertIdArray(value.usageEventIds, 32, true, 'Caption OCR usage event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 32, true, 'Caption OCR internal-cost record IDs are invalid.')
  assertMoneyMicros(value.meteredInternalCostMicros, 'Caption OCR metered internal cost is invalid.')
  if (request.executionScope !== 'production') {
    const expectedMode = request.executionScope === 'reviewed_local'
      ? 'backend_local_unmetered'
      : 'controlled_test_unmetered'
    if (
      value.mode !== expectedMode
      || value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as unknown[]).length !== 0
      || (value.internalCostRecordIds as unknown[]).length !== 0
    ) {
      throw new Error('Unmetered Caption OCR execution cannot claim production cost records.')
    }
  } else {
    if (
      value.mode !== 'production_metered'
      || value.approvedUsageEstimateId !== request.approvedUsageEstimateId
      || value.internalCostBudgetId !== request.internalCostBudgetId
      || value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
      || (value.usageEventIds as unknown[]).length < 1
      || (value.internalCostRecordIds as unknown[]).length < 1
    ) {
      throw new Error('Production Caption OCR execution requires exact usage and internal-cost authority.')
    }
    if (BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
      throw new Error('Caption OCR execution exceeded its maximum authorized internal cost.')
    }
  }
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) {
    throw new Error('Caption OCR usage evidence crossed the customer-pricing boundary.')
  }
}

function validateAllFalseObject(value: unknown, keys: readonly string[], message: string): void {
  if (!isRecord(value)) throw new Error(message)
  assertExactKeys(value, keys, 'false-only boundary')
  if (keys.some((key) => value[key] !== false)) throw new Error(message)
}

function assertFrameTimes(value: unknown, maxSeconds: number, message: string): asserts value is number[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FRAME_COUNT) throw new Error(message)
  let previous = -1
  for (const time of value) {
    if (typeof time !== 'number' || !Number.isFinite(time) || time < 0 || time > maxSeconds || time <= previous) {
      throw new Error(message)
    }
    previous = time
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
  ) {
    throw new Error(message)
  }
}

function assertMatchingIdArray(value: unknown, expected: readonly string[], message: string): void {
  assertIdArray(value, 64, expected.length === 0, message)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new Error(message)
}

function assertMatchingNumberArray(value: unknown, expected: readonly number[], message: string): void {
  if (!Array.isArray(value) || !sameNumberArray(value, expected)) throw new Error(message)
}

function sameNumberArray(left: readonly unknown[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function assertUnitInterval(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(message)
}

function assertSafeText(value: unknown, maxLength: number, message: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength || UNSAFE_STRING_PATTERN.test(value)) {
    throw new Error(message)
  }
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
}

function assertNoUnsafeContent(value: unknown, depth = 0): void {
  if (depth > 10) throw new Error('Caption OCR contract nesting is too deep.')
  if (typeof value === 'string') {
    if (UNSAFE_STRING_PATTERN.test(value)) throw new Error('Caption OCR contract contains unsafe private or credential-like text.')
    return
  }
  if (Array.isArray(value)) {
    for (const entry of value) assertNoUnsafeContent(entry, depth + 1)
    return
  }
  if (!isRecord(value)) return
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error('Caption OCR contract contains a forbidden raw/private field.')
    assertNoUnsafeContent(entry, depth + 1)
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`Caption OCR ${label} contains unsupported fields.`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stableCanonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableCanonicalJson).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableCanonicalJson(value[key])}`
    )).join(',')}}`
  }
  return JSON.stringify(value)
}
