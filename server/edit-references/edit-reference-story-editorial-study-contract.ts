import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_STORY_EDITORIAL_STUDY_REQUEST_VERSION =
  'edit-reference-story-editorial-study-request-v1' as const
export const EDIT_REFERENCE_STORY_EDITORIAL_STUDY_RESULT_VERSION =
  'edit-reference-story-editorial-study-result-v1' as const

export type EditReferenceStoryEditorialFindingCategory =
  | 'hook_function'
  | 'narrative_arc'
  | 'topic_transition'
  | 'emotional_progression'
  | 'problem_solution_structure'
  | 'education_demo_structure'
  | 'information_density'
  | 'broll_meaning_support'
  | 'pacing_section'

export type EditReferenceStoryEditorialTransferability =
  | 'transferable_principle'
  | 'context_only'
  | 'non_transferable'

export interface EditReferenceStoryEditorialEvidenceManifest {
  readonly mediaStructureEvidenceIds: readonly string[]
  readonly technicalChangePointEvidenceIds: readonly string[]
  readonly visualLanguageEvidenceIds: readonly string[]
  readonly transcriptEvidenceIds: readonly string[]
  readonly speechTimingEvidenceIds: readonly string[]
  readonly studyChatGoalEvidenceIds: readonly string[]
  readonly factSafetyEvidenceIds: readonly string[]
}

export interface EditReferenceStoryEditorialStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_STORY_EDITORIAL_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly evidenceManifestDigestSha256: string
  readonly privateArtifactAccessVerified: true
  readonly privateArtifactFinalized: true
  readonly mediaChecksumVerified: true
  readonly evidenceAuthorityVerified: true
  readonly evidence: EditReferenceStoryEditorialEvidenceManifest
  readonly audioPresence: 'present' | 'absent'
  readonly sourceClaimsPresent: boolean
  readonly maxEvidenceItems: number
  readonly maxStructuredContextCharacters: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly rawMediaInputAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly rawTranscriptPersistenceAllowed: false
  readonly exactReferenceWordingTransferAllowed: false
  readonly exactReferenceSequenceTransferAllowed: false
  readonly exactReferenceTimingTransferAllowed: false
  readonly referenceIdentityTransferAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceStoryEditorialFinding {
  readonly findingId: string
  readonly category: EditReferenceStoryEditorialFindingCategory
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly confidence: number
  readonly transferability: EditReferenceStoryEditorialTransferability
  readonly targetAdaptationRequired: true
  readonly requiresUserReview: boolean
  readonly claimRelated: boolean
  readonly factSafetyStatus: 'not_applicable' | 'bounded_by_evidence' | 'requires_review'
  readonly exactReferenceWordingRetained: false
  readonly exactReferenceSequenceInstructionCreated: false
  readonly exactReferenceTimingInstructionCreated: false
  readonly identityTransferInstructionCreated: false
}

export interface EditReferenceAnalyzedStoryEditorialStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_STORY_EDITORIAL_STUDY_RESULT_VERSION
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
  readonly evidence: EditReferenceStoryEditorialEvidenceManifest
  readonly findings: readonly EditReferenceStoryEditorialFinding[]
  readonly coverage: {
    readonly evidenceItemCount: number
    readonly audioPresence: 'present' | 'absent'
    readonly sourceClaimsPresent: boolean
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
    readonly structuredEvidenceRead: true
    readonly reasoningModelExecuted: true
    readonly rawMediaRead: false
    readonly rawTranscriptPersisted: false
    readonly externalUrlFetched: false
    readonly providerCallMade: boolean
    readonly modelCallMade: true
    readonly workerJobCreated: boolean
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
    readonly reasoningInstructionDigestSha256: string
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
    readonly rawMediaPersisted: false
    readonly rawFramesPersisted: false
    readonly rawTranscriptPersisted: false
    readonly rawProviderPayloadPersisted: false
    readonly signedUrlPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
  }
  readonly copySafety: {
    readonly exactHookWordingRetained: false
    readonly exactSceneSequenceCopyInstructionCreated: false
    readonly exactTimingCopyInstructionCreated: false
    readonly creatorIdentityTransferInstructionCreated: false
    readonly copyrightedAssetTransferInstructionCreated: false
    readonly referenceGraphicLayoutTransferInstructionCreated: false
  }
  readonly factSafety: {
    readonly claimEvidenceRequired: boolean
    readonly claimEvidenceIds: readonly string[]
    readonly unverifiedClaimPresentedAsFact: false
    readonly sourceAttributionRemoved: false
    readonly guiltImplyingVisualInstructionCreated: false
  }
  readonly transferBoundary: {
    readonly technicalChangePointsTreatedAsSemanticScenes: false
    readonly findingsMayBecomeTargetInstructionsWithoutApplication: false
    readonly targetEvidenceRequired: true
    readonly userApprovalRequired: true
    readonly exactTimingOrSequenceTransferAllowed: false
  }
}

export type EditReferenceStoryEditorialStudyBlockerCode =
  | 'adapter_unavailable'
  | 'private_artifact_unavailable'
  | 'evidence_authority_unverified'
  | 'visual_evidence_unavailable'
  | 'transcript_evidence_unavailable'
  | 'speech_timing_unavailable'
  | 'fact_safety_evidence_required'
  | 'cost_authority_unavailable'
  | 'model_routing_unavailable'
  | 'privacy_policy_denied'
  | 'runtime_response_invalid'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedStoryEditorialStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_STORY_EDITORIAL_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceStoryEditorialStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason: string | null
  readonly findings: readonly []
  readonly structuredEvidenceRead: boolean
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly workerJobCreated: boolean
  readonly internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export type EditReferenceStoryEditorialStudyResult =
  | EditReferenceAnalyzedStoryEditorialStudyResult
  | EditReferenceBlockedStoryEditorialStudyResult

export interface EditReferenceStoryEditorialStudyAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  analyze(request: EditReferenceStoryEditorialStudyRequest): Promise<EditReferenceStoryEditorialStudyResult>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const MAX_EVIDENCE_ITEMS = 64
const MAX_STRUCTURED_CONTEXT_CHARACTERS = 32_000
const MAX_FINDINGS = 64
const FINDING_CATEGORIES = new Set<EditReferenceStoryEditorialFindingCategory>([
  'hook_function',
  'narrative_arc',
  'topic_transition',
  'emotional_progression',
  'problem_solution_structure',
  'education_demo_structure',
  'information_density',
  'broll_meaning_support',
  'pacing_section',
])
const TRANSFERABILITIES = new Set<EditReferenceStoryEditorialTransferability>([
  'transferable_principle',
  'context_only',
  'non_transferable',
])
const BLOCKER_CODES = new Set<EditReferenceStoryEditorialStudyBlockerCode>([
  'adapter_unavailable',
  'private_artifact_unavailable',
  'evidence_authority_unverified',
  'visual_evidence_unavailable',
  'transcript_evidence_unavailable',
  'speech_timing_unavailable',
  'fact_safety_evidence_required',
  'cost_authority_unavailable',
  'model_routing_unavailable',
  'privacy_policy_denied',
  'runtime_response_invalid',
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
  'exactHookWording',
  'exactSceneOrder',
  'exactStorySequence',
  'exactStoryTiming',
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
  'rawTranscript',
  'secret',
  'signedUrl',
  'signed_url',
  'token',
  'tokens',
  'transcriptText',
  'url',
])
const UNSAFE_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

function stableRequestPayload(request: EditReferenceStoryEditorialStudyRequest): string {
  return JSON.stringify({
    schemaVersion: request.schemaVersion,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    privateArtifactAccessVerified: request.privateArtifactAccessVerified,
    privateArtifactFinalized: request.privateArtifactFinalized,
    mediaChecksumVerified: request.mediaChecksumVerified,
    evidenceAuthorityVerified: request.evidenceAuthorityVerified,
    evidence: copyEvidenceManifest(request.evidence),
    audioPresence: request.audioPresence,
    sourceClaimsPresent: request.sourceClaimsPresent,
    maxEvidenceItems: request.maxEvidenceItems,
    maxStructuredContextCharacters: request.maxStructuredContextCharacters,
    executionScope: request.executionScope,
    approvedUsageEstimateId: request.approvedUsageEstimateId,
    internalCostBudgetId: request.internalCostBudgetId,
    immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
    rawMediaInputAllowed: request.rawMediaInputAllowed,
    externalUrlFetchAllowed: request.externalUrlFetchAllowed,
    rawTranscriptPersistenceAllowed: request.rawTranscriptPersistenceAllowed,
    exactReferenceWordingTransferAllowed: request.exactReferenceWordingTransferAllowed,
    exactReferenceSequenceTransferAllowed: request.exactReferenceSequenceTransferAllowed,
    exactReferenceTimingTransferAllowed: request.exactReferenceTimingTransferAllowed,
    referenceIdentityTransferAllowed: request.referenceIdentityTransferAllowed,
    customerPriceCalculationAllowed: request.customerPriceCalculationAllowed,
    customerCreditMutationAllowed: request.customerCreditMutationAllowed,
    serviceFeeCalculationAllowed: request.serviceFeeCalculationAllowed,
  })
}

export function hashEditReferenceStoryEditorialStudyRequest(
  request: EditReferenceStoryEditorialStudyRequest,
): string {
  validateEditReferenceStoryEditorialStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function validateEditReferenceStoryEditorialStudyRequest(
  value: unknown,
): asserts value is EditReferenceStoryEditorialStudyRequest {
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Story/Editorial study request must be an object.')
  assertExactKeys(value, [
    'schemaVersion',
    'workspaceId',
    'editReferenceId',
    'studySessionId',
    'orchestrationId',
    'privateMediaArtifactId',
    'mediaChecksumSha256',
    'evidenceManifestDigestSha256',
    'privateArtifactAccessVerified',
    'privateArtifactFinalized',
    'mediaChecksumVerified',
    'evidenceAuthorityVerified',
    'evidence',
    'audioPresence',
    'sourceClaimsPresent',
    'maxEvidenceItems',
    'maxStructuredContextCharacters',
    'executionScope',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros',
    'rawMediaInputAllowed',
    'externalUrlFetchAllowed',
    'rawTranscriptPersistenceAllowed',
    'exactReferenceWordingTransferAllowed',
    'exactReferenceSequenceTransferAllowed',
    'exactReferenceTimingTransferAllowed',
    'referenceIdentityTransferAllowed',
    'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ], 'request')
  if (value.schemaVersion !== EDIT_REFERENCE_STORY_EDITORIAL_STUDY_REQUEST_VERSION) {
    throw new Error('Story/Editorial study request version is unsupported.')
  }
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    assertId(value[key], `Story/Editorial study ${key} is invalid.`)
  }
  assertSha256(value.mediaChecksumSha256, 'Story/Editorial media checksum is invalid.')
  assertSha256(value.evidenceManifestDigestSha256, 'Story/Editorial evidence-manifest digest is invalid.')
  if (
    value.privateArtifactAccessVerified !== true
    || value.privateArtifactFinalized !== true
    || value.mediaChecksumVerified !== true
    || value.evidenceAuthorityVerified !== true
  ) {
    throw new Error('Story/Editorial private media or evidence authority is incomplete.')
  }
  if (value.audioPresence !== 'present' && value.audioPresence !== 'absent') {
    throw new Error('Story/Editorial audio presence is invalid.')
  }
  if (typeof value.sourceClaimsPresent !== 'boolean') throw new Error('Story/Editorial claim-presence flag is invalid.')
  if (value.maxEvidenceItems !== MAX_EVIDENCE_ITEMS) throw new Error('Story/Editorial evidence-item bound is invalid.')
  if (value.maxStructuredContextCharacters !== MAX_STRUCTURED_CONTEXT_CHARACTERS) {
    throw new Error('Story/Editorial structured-context bound is invalid.')
  }
  validateEvidenceManifest(value.evidence, value.audioPresence, value.sourceClaimsPresent, value.maxEvidenceItems)
  if (value.executionScope !== 'controlled_test' && value.executionScope !== 'production') {
    throw new Error('Story/Editorial execution scope is invalid.')
  }
  if (value.executionScope === 'controlled_test') {
    if (
      value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.immutableRateCardSnapshotId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
    ) {
      throw new Error('Controlled Story/Editorial tests cannot claim production cost authority.')
    }
  } else {
    assertId(value.approvedUsageEstimateId, 'Production Story/Editorial study requires an approved usage estimate.')
    assertId(value.internalCostBudgetId, 'Production Story/Editorial study requires an internal cost budget.')
    assertId(value.immutableRateCardSnapshotId, 'Production Story/Editorial study requires an immutable rate-card snapshot.')
    assertPositiveMoneyMicros(
      value.maximumAuthorizedInternalCostMicros,
      'Production Story/Editorial study requires a positive maximum authorized internal cost.',
    )
  }
  for (const key of [
    'rawMediaInputAllowed',
    'externalUrlFetchAllowed',
    'rawTranscriptPersistenceAllowed',
    'exactReferenceWordingTransferAllowed',
    'exactReferenceSequenceTransferAllowed',
    'exactReferenceTimingTransferAllowed',
    'referenceIdentityTransferAllowed',
    'customerPriceCalculationAllowed',
    'customerCreditMutationAllowed',
    'serviceFeeCalculationAllowed',
  ] as const) {
    if (value[key] !== false) throw new Error(`Story/Editorial safety boundary ${key} must remain false.`)
  }
}

export function validateEditReferenceStoryEditorialStudyResult(
  request: EditReferenceStoryEditorialStudyRequest,
  value: unknown,
): asserts value is EditReferenceStoryEditorialStudyResult {
  validateEditReferenceStoryEditorialStudyRequest(request)
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Story/Editorial study result must be an object.')
  if (value.schemaVersion !== EDIT_REFERENCE_STORY_EDITORIAL_STUDY_RESULT_VERSION) {
    throw new Error('Story/Editorial study result version is unsupported.')
  }
  if (value.requestDigestSha256 !== hashEditReferenceStoryEditorialStudyRequest(request)) {
    throw new Error('Story/Editorial study result does not match the exact request.')
  }
  if (value.status === 'blocked') {
    validateBlockedResult(request, value)
    return
  }
  if (value.status !== 'analyzed') throw new Error('Story/Editorial study result status is unsupported.')
  validateAnalyzedResult(request, value)
}

export function createBlockedEditReferenceStoryEditorialStudyResult(input: {
  readonly request: EditReferenceStoryEditorialStudyRequest
  readonly blockerCode: EditReferenceStoryEditorialStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly execution?: {
    readonly structuredEvidenceRead?: boolean
    readonly providerCallMade?: boolean
    readonly modelCallMade?: boolean
    readonly workerJobCreated?: boolean
  }
  readonly usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}): EditReferenceBlockedStoryEditorialStudyResult {
  const result: EditReferenceBlockedStoryEditorialStudyResult = {
    schemaVersion: EDIT_REFERENCE_STORY_EDITORIAL_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceStoryEditorialStudyRequest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    retryReason: input.retryAvailable ? (input.retryReason ?? null) : null,
    findings: [],
    structuredEvidenceRead: input.execution?.structuredEvidenceRead ?? false,
    providerCallMade: input.execution?.providerCallMade ?? false,
    modelCallMade: input.execution?.modelCallMade ?? false,
    workerJobCreated: input.execution?.workerJobCreated ?? false,
    internalCostStatus: input.usage?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: input.usage ? input.usage.meteredInternalCostMicros : '0',
    usageEventIds: [...(input.usage?.usageEventIds ?? [])],
    internalCostRecordIds: [...(input.usage?.internalCostRecordIds ?? [])],
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  validateEditReferenceStoryEditorialStudyResult(input.request, result)
  return result
}

function validateEvidenceManifest(
  value: unknown,
  audioPresence: 'present' | 'absent',
  sourceClaimsPresent: boolean,
  maxEvidenceItems: number,
): asserts value is EditReferenceStoryEditorialEvidenceManifest {
  if (!isRecord(value)) throw new Error('Story/Editorial evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds',
    'technicalChangePointEvidenceIds',
    'visualLanguageEvidenceIds',
    'transcriptEvidenceIds',
    'speechTimingEvidenceIds',
    'studyChatGoalEvidenceIds',
    'factSafetyEvidenceIds',
  ] as const
  assertExactKeys(value, keys, 'evidence manifest')
  for (const key of keys) assertIdArray(value[key], maxEvidenceItems, true, `Story/Editorial ${key} is invalid.`)
  for (const key of ['mediaStructureEvidenceIds', 'technicalChangePointEvidenceIds', 'visualLanguageEvidenceIds', 'studyChatGoalEvidenceIds'] as const) {
    if ((value[key] as string[]).length < 1) throw new Error(`Story/Editorial ${key} requires approved evidence.`)
  }
  const transcriptIds = value.transcriptEvidenceIds as string[]
  const speechTimingIds = value.speechTimingEvidenceIds as string[]
  if (audioPresence === 'present' && (transcriptIds.length < 1 || speechTimingIds.length < 1)) {
    throw new Error('Story/Editorial audio-bearing media requires transcript and speech-timing evidence.')
  }
  if (audioPresence === 'absent' && (transcriptIds.length > 0 || speechTimingIds.length > 0)) {
    throw new Error('Story/Editorial audio-absent media cannot claim transcript or speech-timing evidence.')
  }
  if (sourceClaimsPresent && (value.factSafetyEvidenceIds as string[]).length < 1) {
    throw new Error('Story/Editorial claim-bearing media requires fact-safety evidence.')
  }
  const allIds = evidenceIds(value as unknown as EditReferenceStoryEditorialEvidenceManifest)
  if (allIds.length > maxEvidenceItems || new Set(allIds).size !== allIds.length) {
    throw new Error('Story/Editorial evidence manifest exceeds its bound or repeats evidence IDs.')
  }
}

function validateBlockedResult(
  request: EditReferenceStoryEditorialStudyRequest,
  value: Record<string, unknown>,
): void {
  assertExactKeys(value, [
    'schemaVersion',
    'requestDigestSha256',
    'status',
    'blockerCode',
    'blockerMessage',
    'retryAvailable',
    'retryReason',
    'findings',
    'structuredEvidenceRead',
    'providerCallMade',
    'modelCallMade',
    'workerJobCreated',
    'internalCostStatus',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'remoteMutationMade',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(value.blockerCode as EditReferenceStoryEditorialStudyBlockerCode)) {
    throw new Error('Story/Editorial blocker code is invalid.')
  }
  assertSafeText(value.blockerMessage, 600, 'Story/Editorial blocker message is invalid.')
  if (typeof value.retryAvailable !== 'boolean') throw new Error('Story/Editorial retry flag is invalid.')
  if (value.retryAvailable) {
    assertSafeText(value.retryReason, 600, 'Retryable Story/Editorial blockers require a safe reason.')
  } else if (value.retryReason !== null) {
    throw new Error('Non-retryable Story/Editorial blockers cannot include a retry reason.')
  }
  if (!Array.isArray(value.findings) || value.findings.length !== 0) {
    throw new Error('Blocked Story/Editorial results cannot contain findings.')
  }
  for (const key of [
    'structuredEvidenceRead',
    'providerCallMade',
    'modelCallMade',
    'workerJobCreated',
  ] as const) {
    if (typeof value[key] !== 'boolean') throw new Error('Blocked Story/Editorial execution evidence is invalid.')
  }
  if (
    value.remoteMutationMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) {
    throw new Error('Blocked Story/Editorial results crossed a remote or customer-charging boundary.')
  }
  if (!['not_incurred', 'metered', 'unverified'].includes(String(value.internalCostStatus))) {
    throw new Error('Blocked Story/Editorial internal-cost status is invalid.')
  }
  if (value.meteredInternalCostMicros !== null) {
    assertMoneyMicros(value.meteredInternalCostMicros, 'Blocked Story/Editorial internal cost is invalid.')
  }
  assertIdArray(value.usageEventIds, 64, true, 'Blocked Story/Editorial usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Blocked Story/Editorial internal-cost IDs are invalid.')
  const executionStarted = value.providerCallMade === true || value.modelCallMade === true || value.workerJobCreated === true
  if (request.executionScope === 'controlled_test') {
    if (
      executionStarted
      || value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || (value.usageEventIds as string[]).length > 0
      || (value.internalCostRecordIds as string[]).length > 0
    ) throw new Error('Controlled Story/Editorial blockers cannot claim paid execution or cost.')
  } else if (executionStarted) {
    if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
      throw new Error('Blocked production Story/Editorial execution requires attempt cost records.')
    }
    if (value.internalCostStatus === 'not_incurred') {
      throw new Error('Blocked paid Story/Editorial execution cannot claim that no cost was incurred.')
    }
    if (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null) {
      throw new Error('Unverified blocked Story/Editorial cost must remain null.')
    }
    if (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null) {
      throw new Error('Metered blocked Story/Editorial execution requires an amount.')
    }
    if (
      value.internalCostStatus === 'metered'
      && BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    ) throw new Error('Blocked Story/Editorial execution exceeded its authorized maximum.')
  } else if (
    value.internalCostStatus !== 'not_incurred'
    || value.meteredInternalCostMicros !== '0'
    || (value.usageEventIds as string[]).length > 0
    || (value.internalCostRecordIds as string[]).length > 0
  ) {
    throw new Error('Unstarted Story/Editorial blockers cannot claim internal-cost usage.')
  }
}

function validateAnalyzedResult(
  request: EditReferenceStoryEditorialStudyRequest,
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
    'evidenceManifestDigestSha256',
    'evidence',
    'findings',
    'coverage',
    'summary',
    'execution',
    'model',
    'provenance',
    'usage',
    'privacy',
    'copySafety',
    'factSafety',
    'transferBoundary',
  ], 'analyzed result')
  if (value.runtimeSource !== 'verified_local' && value.runtimeSource !== 'verified_live') {
    throw new Error('Story/Editorial analyzed runtime source is invalid.')
  }
  for (const key of ['workspaceId', 'editReferenceId', 'studySessionId', 'orchestrationId', 'privateMediaArtifactId'] as const) {
    if (value[key] !== request[key]) throw new Error('Story/Editorial analyzed identity does not match the request.')
  }
  if (
    value.mediaChecksumSha256 !== request.mediaChecksumSha256
    || value.evidenceManifestDigestSha256 !== request.evidenceManifestDigestSha256
  ) {
    throw new Error('Story/Editorial analyzed lineage does not match the request.')
  }
  validateMatchingEvidenceManifest(request.evidence, value.evidence)
  const findings = validateFindings(request, value.findings)
  validateCoverage(request, value.coverage)
  validateSummary(findings, value.summary)
  validateExecution(value.runtimeSource, value.execution)
  validateModel(value.runtimeSource, value.model)
  validateProvenance(value.provenance)
  validateUsage(request, value.usage)
  validateAllFalseObject(value.privacy, [
    'rawMediaPersisted',
    'rawFramesPersisted',
    'rawTranscriptPersisted',
    'rawProviderPayloadPersisted',
    'signedUrlPersisted',
    'hiddenChainOfThoughtPersisted',
  ], 'Story/Editorial privacy boundary is invalid.')
  validateAllFalseObject(value.copySafety, [
    'exactHookWordingRetained',
    'exactSceneSequenceCopyInstructionCreated',
    'exactTimingCopyInstructionCreated',
    'creatorIdentityTransferInstructionCreated',
    'copyrightedAssetTransferInstructionCreated',
    'referenceGraphicLayoutTransferInstructionCreated',
  ], 'Story/Editorial copy-safety boundary is invalid.')
  validateFactSafety(request, value.factSafety)
  validateTransferBoundary(value.transferBoundary)
}

function validateFindings(
  request: EditReferenceStoryEditorialStudyRequest,
  value: unknown,
): readonly EditReferenceStoryEditorialFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FINDINGS) {
    throw new Error('Story/Editorial analyzed findings are outside the approved bound.')
  }
  const allowedEvidenceIds = new Set(evidenceIds(request.evidence))
  const findingIds = new Set<string>()
  for (const finding of value) {
    if (!isRecord(finding)) throw new Error('Story/Editorial finding is invalid.')
    assertExactKeys(finding, [
      'findingId',
      'category',
      'summary',
      'evidenceIds',
      'confidence',
      'transferability',
      'targetAdaptationRequired',
      'requiresUserReview',
      'claimRelated',
      'factSafetyStatus',
      'exactReferenceWordingRetained',
      'exactReferenceSequenceInstructionCreated',
      'exactReferenceTimingInstructionCreated',
      'identityTransferInstructionCreated',
    ], 'finding')
    assertId(finding.findingId, 'Story/Editorial finding ID is invalid.')
    if (findingIds.has(finding.findingId as string)) throw new Error('Story/Editorial finding IDs must be unique.')
    findingIds.add(finding.findingId as string)
    if (!FINDING_CATEGORIES.has(finding.category as EditReferenceStoryEditorialFindingCategory)) {
      throw new Error('Story/Editorial finding category is invalid.')
    }
    assertSafeText(finding.summary, 1_000, 'Story/Editorial finding summary is invalid.')
    assertIdArray(finding.evidenceIds, MAX_EVIDENCE_ITEMS, false, 'Story/Editorial finding evidence IDs are invalid.')
    if (!(finding.evidenceIds as string[]).every((id) => allowedEvidenceIds.has(id))) {
      throw new Error('Story/Editorial finding references evidence outside the exact request.')
    }
    assertUnitInterval(finding.confidence, 'Story/Editorial finding confidence is invalid.', true)
    if (!TRANSFERABILITIES.has(finding.transferability as EditReferenceStoryEditorialTransferability)) {
      throw new Error('Story/Editorial finding transferability is invalid.')
    }
    if (
      finding.targetAdaptationRequired !== true
      || typeof finding.requiresUserReview !== 'boolean'
      || typeof finding.claimRelated !== 'boolean'
    ) {
      throw new Error('Story/Editorial target-adaptation or review boundary is invalid.')
    }
    if (!['not_applicable', 'bounded_by_evidence', 'requires_review'].includes(String(finding.factSafetyStatus))) {
      throw new Error('Story/Editorial finding fact-safety status is invalid.')
    }
    for (const key of [
      'exactReferenceWordingRetained',
      'exactReferenceSequenceInstructionCreated',
      'exactReferenceTimingInstructionCreated',
      'identityTransferInstructionCreated',
    ] as const) {
      if (finding[key] !== false) throw new Error('Story/Editorial finding violates the no-copy boundary.')
    }
    if (finding.claimRelated) {
      if (!request.sourceClaimsPresent || finding.factSafetyStatus === 'not_applicable') {
        throw new Error('Story/Editorial claim-related findings require source claims and an explicit fact-safety status.')
      }
      const factSafetyIds = new Set(request.evidence.factSafetyEvidenceIds)
      if (!(finding.evidenceIds as string[]).some((id) => factSafetyIds.has(id))) {
        throw new Error('Story/Editorial claim-related findings require fact-safety evidence.')
      }
    } else if (finding.factSafetyStatus !== 'not_applicable') {
      throw new Error('Story/Editorial non-claim findings must use the not-applicable fact-safety status.')
    }
  }
  return value as EditReferenceStoryEditorialFinding[]
}

function validateCoverage(request: EditReferenceStoryEditorialStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Story/Editorial coverage is invalid.')
  assertExactKeys(value, [
    'evidenceItemCount',
    'audioPresence',
    'sourceClaimsPresent',
    'partial',
    'missingEvidenceKinds',
  ], 'coverage')
  if (value.evidenceItemCount !== evidenceIds(request.evidence).length) {
    throw new Error('Story/Editorial evidence coverage count does not match the request.')
  }
  if (value.audioPresence !== request.audioPresence || value.sourceClaimsPresent !== request.sourceClaimsPresent) {
    throw new Error('Story/Editorial coverage does not match source evidence.')
  }
  if (typeof value.partial !== 'boolean') throw new Error('Story/Editorial partial-coverage flag is invalid.')
  assertIdArray(value.missingEvidenceKinds, 16, true, 'Story/Editorial missing-evidence kinds are invalid.')
  if (value.partial !== ((value.missingEvidenceKinds as string[]).length > 0)) {
    throw new Error('Story/Editorial partial coverage and missing-evidence list are inconsistent.')
  }
}

function validateSummary(
  findings: readonly EditReferenceStoryEditorialFinding[],
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Story/Editorial summary is invalid.')
  assertExactKeys(value, [
    'findingCount',
    'transferablePrincipleCount',
    'contextOnlyCount',
    'nonTransferableCount',
    'averageConfidence',
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
  ) {
    throw new Error('Story/Editorial summary counts do not match findings.')
  }
  const average = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  if (typeof value.averageConfidence !== 'number' || Math.abs(value.averageConfidence - average) > 0.000_001) {
    throw new Error('Story/Editorial average confidence does not match findings.')
  }
}

function validateExecution(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Story/Editorial execution evidence is invalid.')
  assertExactKeys(value, [
    'structuredEvidenceRead',
    'reasoningModelExecuted',
    'rawMediaRead',
    'rawTranscriptPersisted',
    'externalUrlFetched',
    'providerCallMade',
    'modelCallMade',
    'workerJobCreated',
    'remoteMutationMade',
  ], 'execution')
  if (value.structuredEvidenceRead !== true || value.reasoningModelExecuted !== true || value.modelCallMade !== true) {
    throw new Error('Story/Editorial analyzed result lacks reasoning execution proof.')
  }
  for (const key of ['rawMediaRead', 'rawTranscriptPersisted', 'externalUrlFetched', 'remoteMutationMade'] as const) {
    if (value[key] !== false) throw new Error('Story/Editorial execution crossed a privacy or remote-mutation boundary.')
  }
  if (typeof value.providerCallMade !== 'boolean' || typeof value.workerJobCreated !== 'boolean') {
    throw new Error('Story/Editorial execution flags are invalid.')
  }
  if ((runtimeSource === 'verified_live') !== value.providerCallMade) {
    throw new Error('Story/Editorial provider execution does not match the runtime source.')
  }
}

function validateModel(runtimeSource: unknown, value: unknown): void {
  if (!isRecord(value)) throw new Error('Story/Editorial model provenance is invalid.')
  assertExactKeys(value, [
    'adapterId',
    'adapterVersion',
    'providerId',
    'modelId',
    'modelRevision',
    'modelAggregateSha256',
    'modelRoutingPolicyVersion',
    'reasoningInstructionDigestSha256',
  ], 'model provenance')
  for (const key of ['adapterId', 'adapterVersion', 'modelId', 'modelRevision', 'modelRoutingPolicyVersion'] as const) {
    assertId(value[key], `Story/Editorial ${key} is invalid.`)
  }
  assertSha256(value.modelAggregateSha256, 'Story/Editorial model aggregate is invalid.')
  assertSha256(value.reasoningInstructionDigestSha256, 'Story/Editorial reasoning-instruction digest is invalid.')
  if (runtimeSource === 'verified_live') {
    assertId(value.providerId, 'Live Story/Editorial results require provider identity.')
  } else if (value.providerId !== null) {
    throw new Error('Local Story/Editorial results cannot claim a provider identity.')
  }
}

function validateProvenance(value: unknown): void {
  if (!isRecord(value)) throw new Error('Story/Editorial provenance is invalid.')
  assertExactKeys(value, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  assertId(value.executionId, 'Story/Editorial execution ID is invalid.')
  assertTimestamp(value.startedAt, 'Story/Editorial start timestamp is invalid.')
  assertTimestamp(value.completedAt, 'Story/Editorial completion timestamp is invalid.')
  if (Date.parse(value.completedAt as string) < Date.parse(value.startedAt as string)) {
    throw new Error('Story/Editorial completion precedes its start.')
  }
}

function validateUsage(request: EditReferenceStoryEditorialStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Story/Editorial usage is invalid.')
  assertExactKeys(value, [
    'mode',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'usage')
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) {
    throw new Error('Story/Editorial usage must not calculate customer price, credits, or service fees.')
  }
  assertMoneyMicros(value.meteredInternalCostMicros, 'Story/Editorial metered internal cost is invalid.')
  assertIdArray(value.usageEventIds, 64, true, 'Story/Editorial usage event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, true, 'Story/Editorial internal-cost record IDs are invalid.')
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
    ) {
      throw new Error('Controlled Story/Editorial usage cannot claim production metering.')
    }
    return
  }
  if (value.mode !== 'production_metered') throw new Error('Production Story/Editorial usage must be metered.')
  for (const key of ['approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId'] as const) {
    if (value[key] !== request[key]) throw new Error('Story/Editorial production cost authority does not match the request.')
  }
  if (value.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros) {
    throw new Error('Story/Editorial maximum authorized internal cost does not match the request.')
  }
  assertPositiveMoneyMicros(value.meteredInternalCostMicros, 'Production Story/Editorial study requires positive metered internal cost.')
  if (
    BigInt(value.meteredInternalCostMicros as string) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
  ) {
    throw new Error('Story/Editorial metered internal cost exceeds the authorized maximum.')
  }
  if ((value.usageEventIds as string[]).length < 1 || (value.internalCostRecordIds as string[]).length < 1) {
    throw new Error('Production Story/Editorial usage requires usage and internal-cost records.')
  }
}

function validateFactSafety(request: EditReferenceStoryEditorialStudyRequest, value: unknown): void {
  if (!isRecord(value)) throw new Error('Story/Editorial fact-safety result is invalid.')
  assertExactKeys(value, [
    'claimEvidenceRequired',
    'claimEvidenceIds',
    'unverifiedClaimPresentedAsFact',
    'sourceAttributionRemoved',
    'guiltImplyingVisualInstructionCreated',
  ], 'fact safety')
  if (value.claimEvidenceRequired !== request.sourceClaimsPresent) {
    throw new Error('Story/Editorial fact-safety requirement does not match the request.')
  }
  assertMatchingIdArray(
    value.claimEvidenceIds,
    request.evidence.factSafetyEvidenceIds,
    'Story/Editorial fact-safety evidence does not match the request.',
  )
  for (const key of ['unverifiedClaimPresentedAsFact', 'sourceAttributionRemoved', 'guiltImplyingVisualInstructionCreated'] as const) {
    if (value[key] !== false) throw new Error('Story/Editorial fact-safety result is unsafe.')
  }
}

function validateTransferBoundary(value: unknown): void {
  if (!isRecord(value)) throw new Error('Story/Editorial transfer boundary is invalid.')
  assertExactKeys(value, [
    'technicalChangePointsTreatedAsSemanticScenes',
    'findingsMayBecomeTargetInstructionsWithoutApplication',
    'targetEvidenceRequired',
    'userApprovalRequired',
    'exactTimingOrSequenceTransferAllowed',
  ], 'transfer boundary')
  if (
    value.technicalChangePointsTreatedAsSemanticScenes !== false
    || value.findingsMayBecomeTargetInstructionsWithoutApplication !== false
    || value.targetEvidenceRequired !== true
    || value.userApprovalRequired !== true
    || value.exactTimingOrSequenceTransferAllowed !== false
  ) {
    throw new Error('Story/Editorial transfer boundary permits unsafe direct copying or application.')
  }
}

function validateMatchingEvidenceManifest(
  expected: EditReferenceStoryEditorialEvidenceManifest,
  value: unknown,
): void {
  if (!isRecord(value)) throw new Error('Story/Editorial result evidence manifest is invalid.')
  const keys = [
    'mediaStructureEvidenceIds',
    'technicalChangePointEvidenceIds',
    'visualLanguageEvidenceIds',
    'transcriptEvidenceIds',
    'speechTimingEvidenceIds',
    'studyChatGoalEvidenceIds',
    'factSafetyEvidenceIds',
  ] as const
  assertExactKeys(value, keys, 'result evidence manifest')
  for (const key of keys) {
    assertMatchingIdArray(value[key], expected[key], `Story/Editorial result ${key} does not match the request.`)
  }
}

function evidenceIds(manifest: EditReferenceStoryEditorialEvidenceManifest): string[] {
  return [
    ...manifest.mediaStructureEvidenceIds,
    ...manifest.technicalChangePointEvidenceIds,
    ...manifest.visualLanguageEvidenceIds,
    ...manifest.transcriptEvidenceIds,
    ...manifest.speechTimingEvidenceIds,
    ...manifest.studyChatGoalEvidenceIds,
    ...manifest.factSafetyEvidenceIds,
  ]
}

function copyEvidenceManifest(
  manifest: EditReferenceStoryEditorialEvidenceManifest,
): EditReferenceStoryEditorialEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...manifest.mediaStructureEvidenceIds],
    technicalChangePointEvidenceIds: [...manifest.technicalChangePointEvidenceIds],
    visualLanguageEvidenceIds: [...manifest.visualLanguageEvidenceIds],
    transcriptEvidenceIds: [...manifest.transcriptEvidenceIds],
    speechTimingEvidenceIds: [...manifest.speechTimingEvidenceIds],
    studyChatGoalEvidenceIds: [...manifest.studyChatGoalEvidenceIds],
    factSafetyEvidenceIds: [...manifest.factSafetyEvidenceIds],
  }
}

function assertNoUnsafeContent(value: unknown, path = 'root'): void {
  if (typeof value === 'string') {
    if (UNSAFE_STRING_PATTERN.test(value)) throw new Error(`Story/Editorial unsafe string at ${path}.`)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoUnsafeContent(entry, `${path}[${index}]`))
    return
  }
  if (!isRecord(value)) return
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Story/Editorial forbidden field ${key}.`)
    assertNoUnsafeContent(entry, `${path}.${key}`)
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actualKeys = Object.keys(value).sort()
  const expectedKeys = [...expected].sort()
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error(`Story/Editorial ${label} fields are invalid.`)
  }
}

function assertId(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error(message)
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
  assertIdArray(value, MAX_EVIDENCE_ITEMS, expected.length === 0, message)
  if ((value as string[]).length !== expected.length || (value as string[]).some((entry, index) => entry !== expected[index])) {
    throw new Error(message)
  }
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
  ) {
    throw new Error(message)
  }
}

function assertSafeText(value: unknown, maxLength: number, message: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.length > maxLength || UNSAFE_STRING_PATTERN.test(value)) {
    throw new Error(message)
  }
}

function assertTimestamp(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error(message)
}

function validateAllFalseObject(value: unknown, keys: readonly string[], message: string): void {
  if (!isRecord(value)) throw new Error(message)
  assertExactKeys(value, keys, 'false-only boundary')
  for (const key of keys) if (value[key] !== false) throw new Error(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
