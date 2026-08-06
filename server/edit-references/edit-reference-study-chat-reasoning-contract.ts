import { createHash } from 'node:crypto'
import { detectEditReferenceCopyRisks } from './edit-reference-copy-safety'

export const EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION =
  'edit-reference-study-chat-reasoning-request-v1' as const
export const EDIT_REFERENCE_STUDY_CHAT_REASONING_RESULT_VERSION =
  'edit-reference-study-chat-reasoning-result-v1' as const

export const EDIT_REFERENCE_STUDY_CHAT_RESPONSE_KINDS = [
  'answer',
  'clarification',
  'evidence_guidance',
  'correction_guidance',
  'dna_guidance',
  'qa_guidance',
] as const

export type EditReferenceStudyChatResponseKind =
  typeof EDIT_REFERENCE_STUDY_CHAT_RESPONSE_KINDS[number]

export const EDIT_REFERENCE_STUDY_CHAT_NEXT_STEPS = [
  'none',
  'answer_clarifying_question',
  'review_saved_evidence',
  'select_evidence_to_correct',
  'add_authorized_evidence',
  'run_evidence_study_after_review',
  'review_preference_dna',
  'resolve_dna_qa_blocker',
] as const

export type EditReferenceStudyChatNextStep =
  typeof EDIT_REFERENCE_STUDY_CHAT_NEXT_STEPS[number]

export interface EditReferenceStudyChatReasoningRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly expectedStudyRevision: number
  readonly clientMessageDigestSha256: string
  readonly structuredContextDigestSha256: string
  readonly maxContextCharacters: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly rawMediaInputAllowed: false
  readonly rawTranscriptInputAllowed: false
  readonly projectChatHistoryInputAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly exactReferenceWordingTransferAllowed: false
  readonly exactReferenceSequenceTransferAllowed: false
  readonly exactReferenceTimingTransferAllowed: false
  readonly referenceIdentityTransferAllowed: false
  readonly evidenceMutationAllowed: false
  readonly dnaMutationAllowed: false
  readonly approvalMutationAllowed: false
  readonly targetOperationCreationAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferenceStudyChatReasoningAnswer {
  readonly responseKind: EditReferenceStudyChatResponseKind
  readonly assistantMessage: string
  readonly clarificationQuestions: readonly string[]
  readonly citedEvidenceIds: readonly string[]
  readonly suggestedNextStep: EditReferenceStudyChatNextStep
  readonly missingEvidenceKinds: readonly string[]
}

export interface EditReferenceAnsweredStudyChatReasoningResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'answered'
  readonly runtimeSource: 'verified_live'
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly studyRevision: number
  readonly answer: EditReferenceStudyChatReasoningAnswer
  readonly execution: {
    readonly structuredContextRead: true
    readonly providerCallMade: true
    readonly modelCallMade: true
    readonly workerJobCreated: false
    readonly remoteMutationMade: false
    readonly evidenceMutationMade: false
    readonly dnaMutationMade: false
    readonly approvalMutationMade: false
    readonly targetOperationCreated: false
  }
  readonly model: {
    readonly adapterId: string
    readonly adapterVersion: string
    readonly providerId: string
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
    readonly mode: 'production_metered'
    readonly approvedUsageEstimateId: string
    readonly internalCostBudgetId: string
    readonly immutableRateCardSnapshotId: string
    readonly maximumAuthorizedInternalCostMicros: string
    readonly meteredInternalCostMicros: string
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly privacy: {
    readonly rawMediaRead: false
    readonly rawTranscriptRead: false
    readonly projectChatHistoryRead: false
    readonly externalUrlFetched: false
    readonly rawProviderPayloadPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly signedUrlPersisted: false
  }
  readonly transferBoundary: {
    readonly exactReferenceWordingRetained: false
    readonly exactReferenceSequenceInstructionCreated: false
    readonly exactReferenceTimingInstructionCreated: false
    readonly referenceIdentityInstructionCreated: false
    readonly responseMayMutateStudyState: false
    readonly responseMayBecomeTargetInstructionWithoutApplication: false
    readonly userApprovalStillRequired: true
  }
}

export type EditReferenceStudyChatReasoningBlockerCode =
  | 'reasoning_unavailable'
  | 'context_authority_unverified'
  | 'model_routing_unavailable'
  | 'cost_authority_unavailable'
  | 'runtime_response_invalid'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedStudyChatReasoningResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferenceStudyChatReasoningBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly answer: null
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly remoteMutationMade: false
  readonly evidenceMutationMade: false
  readonly dnaMutationMade: false
  readonly approvalMutationMade: false
  readonly targetOperationCreated: false
  readonly internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export type EditReferenceStudyChatReasoningResult =
  | EditReferenceAnsweredStudyChatReasoningResult
  | EditReferenceBlockedStudyChatReasoningResult

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const UNSAFE_OUTPUT_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential|raw[_ -]?(?:media|transcript|provider|history)/i
const BLOCKER_CODES = new Set<EditReferenceStudyChatReasoningBlockerCode>([
  'reasoning_unavailable',
  'context_authority_unverified',
  'model_routing_unavailable',
  'cost_authority_unavailable',
  'runtime_response_invalid',
  'copy_safety_violation',
  'internal_cost_usage_unverified',
])

function stableRequestPayload(request: EditReferenceStudyChatReasoningRequest): string {
  return JSON.stringify({
    schemaVersion: request.schemaVersion,
    workspaceId: request.workspaceId,
    actorUserId: request.actorUserId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    expectedStudyRevision: request.expectedStudyRevision,
    clientMessageDigestSha256: request.clientMessageDigestSha256,
    structuredContextDigestSha256: request.structuredContextDigestSha256,
    maxContextCharacters: request.maxContextCharacters,
    executionScope: request.executionScope,
    approvedUsageEstimateId: request.approvedUsageEstimateId,
    internalCostBudgetId: request.internalCostBudgetId,
    immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
    rawMediaInputAllowed: request.rawMediaInputAllowed,
    rawTranscriptInputAllowed: request.rawTranscriptInputAllowed,
    projectChatHistoryInputAllowed: request.projectChatHistoryInputAllowed,
    externalUrlFetchAllowed: request.externalUrlFetchAllowed,
    exactReferenceWordingTransferAllowed: request.exactReferenceWordingTransferAllowed,
    exactReferenceSequenceTransferAllowed: request.exactReferenceSequenceTransferAllowed,
    exactReferenceTimingTransferAllowed: request.exactReferenceTimingTransferAllowed,
    referenceIdentityTransferAllowed: request.referenceIdentityTransferAllowed,
    evidenceMutationAllowed: request.evidenceMutationAllowed,
    dnaMutationAllowed: request.dnaMutationAllowed,
    approvalMutationAllowed: request.approvalMutationAllowed,
    targetOperationCreationAllowed: request.targetOperationCreationAllowed,
    customerPriceCalculationAllowed: request.customerPriceCalculationAllowed,
    customerCreditMutationAllowed: request.customerCreditMutationAllowed,
    serviceFeeCalculationAllowed: request.serviceFeeCalculationAllowed,
  })
}

export function hashEditReferenceStudyChatReasoningRequest(
  request: EditReferenceStudyChatReasoningRequest,
): string {
  validateEditReferenceStudyChatReasoningRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function validateEditReferenceStudyChatReasoningRequest(
  request: EditReferenceStudyChatReasoningRequest,
): void {
  assertExactKeys(request, [
    'schemaVersion', 'workspaceId', 'actorUserId', 'editReferenceId', 'studySessionId',
    'expectedStudyRevision', 'clientMessageDigestSha256', 'structuredContextDigestSha256',
    'maxContextCharacters', 'executionScope', 'approvedUsageEstimateId', 'internalCostBudgetId',
    'immutableRateCardSnapshotId', 'maximumAuthorizedInternalCostMicros', 'rawMediaInputAllowed',
    'rawTranscriptInputAllowed', 'projectChatHistoryInputAllowed', 'externalUrlFetchAllowed',
    'exactReferenceWordingTransferAllowed', 'exactReferenceSequenceTransferAllowed',
    'exactReferenceTimingTransferAllowed', 'referenceIdentityTransferAllowed', 'evidenceMutationAllowed',
    'dnaMutationAllowed', 'approvalMutationAllowed', 'targetOperationCreationAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed', 'serviceFeeCalculationAllowed',
  ], 'request')
  if (request.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION) {
    throw new Error('Study Chat reasoning request version is unsupported.')
  }
  for (const value of [
    request.workspaceId,
    request.actorUserId,
    request.editReferenceId,
    request.studySessionId,
  ]) if (!ID_PATTERN.test(value)) throw new Error('Study Chat reasoning identity is invalid.')
  if (
    !Number.isSafeInteger(request.expectedStudyRevision)
    || request.expectedStudyRevision < 1
    || !Number.isSafeInteger(request.maxContextCharacters)
    || request.maxContextCharacters < 1
    || request.maxContextCharacters > 32_000
    || !SHA256_PATTERN.test(request.clientMessageDigestSha256)
    || !SHA256_PATTERN.test(request.structuredContextDigestSha256)
    || !['controlled_test', 'production'].includes(request.executionScope)
  ) throw new Error('Study Chat reasoning request bounds or digests are invalid.')
  const forbiddenFlags = [
    request.rawMediaInputAllowed,
    request.rawTranscriptInputAllowed,
    request.projectChatHistoryInputAllowed,
    request.externalUrlFetchAllowed,
    request.exactReferenceWordingTransferAllowed,
    request.exactReferenceSequenceTransferAllowed,
    request.exactReferenceTimingTransferAllowed,
    request.referenceIdentityTransferAllowed,
    request.evidenceMutationAllowed,
    request.dnaMutationAllowed,
    request.approvalMutationAllowed,
    request.targetOperationCreationAllowed,
    request.customerPriceCalculationAllowed,
    request.customerCreditMutationAllowed,
    request.serviceFeeCalculationAllowed,
  ]
  if (forbiddenFlags.some((flag) => flag !== false)) {
    throw new Error('Study Chat reasoning request exceeds the read-only safety boundary.')
  }
  const costIds = [
    request.approvedUsageEstimateId,
    request.internalCostBudgetId,
    request.immutableRateCardSnapshotId,
  ]
  if (request.executionScope === 'controlled_test') {
    if (costIds.some((value) => value !== null) || request.maximumAuthorizedInternalCostMicros !== null) {
      throw new Error('Controlled Study Chat reasoning cannot claim production cost authority.')
    }
    return
  }
  if (costIds.some((value) => typeof value !== 'string' || !ID_PATTERN.test(value))) {
    throw new Error('Production Study Chat reasoning requires exact cost-authority identities.')
  }
  if (
    !request.maximumAuthorizedInternalCostMicros
    || !MONEY_MICROS_PATTERN.test(request.maximumAuthorizedInternalCostMicros)
    || BigInt(request.maximumAuthorizedInternalCostMicros) <= 0n
  ) throw new Error('Production Study Chat reasoning requires a positive internal-cost ceiling.')
}

export function validateEditReferenceStudyChatReasoningResult(
  request: EditReferenceStudyChatReasoningRequest,
  result: EditReferenceStudyChatReasoningResult,
): void {
  validateEditReferenceStudyChatReasoningRequest(request)
  if (result.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_REASONING_RESULT_VERSION) {
    throw new Error('Study Chat reasoning result version is unsupported.')
  }
  if (result.requestDigestSha256 !== hashEditReferenceStudyChatReasoningRequest(request)) {
    throw new Error('Study Chat reasoning result does not match the exact request.')
  }
  if (result.status === 'blocked') {
    validateBlockedResult(result)
    return
  }
  validateAnsweredResult(request, result)
}

function validateBlockedResult(result: EditReferenceBlockedStudyChatReasoningResult): void {
  assertExactKeys(result, [
    'schemaVersion', 'requestDigestSha256', 'status', 'blockerCode', 'blockerMessage',
    'retryAvailable', 'retryReason', 'answer', 'providerCallMade', 'modelCallMade',
    'remoteMutationMade', 'evidenceMutationMade', 'dnaMutationMade', 'approvalMutationMade',
    'targetOperationCreated', 'internalCostStatus', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(result.blockerCode) || !safeOutputText(result.blockerMessage, 600)) {
    throw new Error('Study Chat reasoning blocker is invalid.')
  }
  if (result.retryAvailable && !safeOutputText(result.retryReason, 600)) {
    throw new Error('Retryable Study Chat reasoning blockers require a safe retry reason.')
  }
  if (!result.retryAvailable && result.retryReason !== undefined) {
    throw new Error('Non-retryable Study Chat reasoning blockers cannot include a retry reason.')
  }
  if (
    result.answer !== null
    || result.remoteMutationMade !== false
    || result.evidenceMutationMade !== false
    || result.dnaMutationMade !== false
    || result.approvalMutationMade !== false
    || result.targetOperationCreated !== false
    || result.customerPriceCalculated !== false
    || result.customerCreditsMutated !== false
    || result.serviceFeeIncluded !== false
    || (result.modelCallMade && !result.providerCallMade)
  ) throw new Error('Blocked Study Chat reasoning result has invalid side effects.')
  validateUsageState(result)
}

function validateAnsweredResult(
  request: EditReferenceStudyChatReasoningRequest,
  result: EditReferenceAnsweredStudyChatReasoningResult,
): void {
  assertExactKeys(result, [
    'schemaVersion', 'requestDigestSha256', 'status', 'runtimeSource', 'workspaceId', 'actorUserId',
    'editReferenceId', 'studySessionId', 'studyRevision', 'answer', 'execution', 'model',
    'provenance', 'usage', 'privacy', 'transferBoundary',
  ], 'answered result')
  if (
    result.runtimeSource !== 'verified_live'
    || result.workspaceId !== request.workspaceId
    || result.actorUserId !== request.actorUserId
    || result.editReferenceId !== request.editReferenceId
    || result.studySessionId !== request.studySessionId
    || result.studyRevision !== request.expectedStudyRevision
  ) throw new Error('Study Chat reasoning answer identity is invalid.')
  validateAnswer(result.answer)
  if (detectEditReferenceCopyRisks([
    result.answer.assistantMessage,
    ...result.answer.clarificationQuestions,
  ]).length > 0) throw new Error('Study Chat reasoning answer contains an unsafe exact-copy instruction.')
  if (
    result.execution.structuredContextRead !== true
    || result.execution.providerCallMade !== true
    || result.execution.modelCallMade !== true
    || result.execution.workerJobCreated !== false
    || result.execution.remoteMutationMade !== false
    || result.execution.evidenceMutationMade !== false
    || result.execution.dnaMutationMade !== false
    || result.execution.approvalMutationMade !== false
    || result.execution.targetOperationCreated !== false
  ) throw new Error('Study Chat reasoning execution exceeded its read-only boundary.')
  assertExactKeys(result.model, [
    'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRevision',
    'modelAggregateSha256', 'modelRoutingPolicyVersion', 'reasoningInstructionDigestSha256',
  ], 'model provenance')
  for (const value of [
    result.model.adapterId,
    result.model.adapterVersion,
    result.model.providerId,
    result.model.modelId,
    result.model.modelRevision,
    result.model.modelRoutingPolicyVersion,
  ]) if (!ID_PATTERN.test(value)) throw new Error('Study Chat reasoning model identity is invalid.')
  if (!SHA256_PATTERN.test(result.model.modelAggregateSha256) || !SHA256_PATTERN.test(result.model.reasoningInstructionDigestSha256)) {
    throw new Error('Study Chat reasoning model digests are invalid.')
  }
  assertExactKeys(result.provenance, ['executionId', 'startedAt', 'completedAt'], 'execution provenance')
  if (
    !ID_PATTERN.test(result.provenance.executionId)
    || !isIsoDate(result.provenance.startedAt)
    || !isIsoDate(result.provenance.completedAt)
    || Date.parse(result.provenance.completedAt) < Date.parse(result.provenance.startedAt)
  ) throw new Error('Study Chat reasoning execution provenance is invalid.')
  validateAnsweredUsage(request, result.usage)
  if (Object.values(result.privacy).some((value) => value !== false)) {
    throw new Error('Study Chat reasoning answer violates its privacy boundary.')
  }
  if (
    result.transferBoundary.exactReferenceWordingRetained !== false
    || result.transferBoundary.exactReferenceSequenceInstructionCreated !== false
    || result.transferBoundary.exactReferenceTimingInstructionCreated !== false
    || result.transferBoundary.referenceIdentityInstructionCreated !== false
    || result.transferBoundary.responseMayMutateStudyState !== false
    || result.transferBoundary.responseMayBecomeTargetInstructionWithoutApplication !== false
    || result.transferBoundary.userApprovalStillRequired !== true
  ) throw new Error('Study Chat reasoning transfer boundary is invalid.')
}

function validateAnswer(answer: EditReferenceStudyChatReasoningAnswer): void {
  assertExactKeys(answer, [
    'responseKind', 'assistantMessage', 'clarificationQuestions', 'citedEvidenceIds',
    'suggestedNextStep', 'missingEvidenceKinds',
  ], 'answer')
  if (
    !EDIT_REFERENCE_STUDY_CHAT_RESPONSE_KINDS.includes(answer.responseKind)
    || !safeOutputText(answer.assistantMessage, 2_400)
    || !EDIT_REFERENCE_STUDY_CHAT_NEXT_STEPS.includes(answer.suggestedNextStep)
  ) throw new Error('Study Chat reasoning answer content is invalid.')
  assertBoundedTextArray(answer.clarificationQuestions, 3, 500, 'clarificationQuestions', true)
  assertBoundedIds(answer.citedEvidenceIds, 32, 'citedEvidenceIds', true)
  assertBoundedTextArray(answer.missingEvidenceKinds, 16, 160, 'missingEvidenceKinds', true)
  if (answer.responseKind === 'clarification' && answer.clarificationQuestions.length < 1) {
    throw new Error('Study Chat clarification responses require at least one question.')
  }
}

function validateAnsweredUsage(
  request: EditReferenceStudyChatReasoningRequest,
  usage: EditReferenceAnsweredStudyChatReasoningResult['usage'],
): void {
  assertExactKeys(usage, [
    'mode', 'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'usage')
  if (
    usage.mode !== 'production_metered'
    || usage.approvedUsageEstimateId !== request.approvedUsageEstimateId
    || usage.internalCostBudgetId !== request.internalCostBudgetId
    || usage.immutableRateCardSnapshotId !== request.immutableRateCardSnapshotId
    || usage.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
    || !MONEY_MICROS_PATTERN.test(usage.meteredInternalCostMicros)
    || BigInt(usage.meteredInternalCostMicros) <= 0n
    || BigInt(usage.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
    || usage.customerPriceCalculated !== false
    || usage.customerCreditsMutated !== false
    || usage.serviceFeeIncluded !== false
  ) throw new Error('Study Chat reasoning metered usage is invalid.')
  assertBoundedIds(usage.usageEventIds, 64, 'usageEventIds')
  assertBoundedIds(usage.internalCostRecordIds, 64, 'internalCostRecordIds')
}

function validateUsageState(result: EditReferenceBlockedStudyChatReasoningResult): void {
  assertBoundedIds(result.usageEventIds, 64, 'usageEventIds', true)
  assertBoundedIds(result.internalCostRecordIds, 64, 'internalCostRecordIds', true)
  if (result.internalCostStatus === 'not_incurred') {
    if (result.meteredInternalCostMicros !== '0' || result.usageEventIds.length || result.internalCostRecordIds.length) {
      throw new Error('Non-incurred Study Chat reasoning cannot contain usage records.')
    }
    return
  }
  if (result.internalCostStatus === 'metered') {
    if (
      !result.meteredInternalCostMicros
      || !MONEY_MICROS_PATTERN.test(result.meteredInternalCostMicros)
      || result.usageEventIds.length < 1
      || result.internalCostRecordIds.length < 1
    ) throw new Error('Metered Study Chat reasoning blocker requires usage evidence.')
    return
  }
  if (result.internalCostStatus !== 'unverified' || result.meteredInternalCostMicros !== null) {
    throw new Error('Study Chat reasoning blocker has an invalid usage state.')
  }
  if (!result.providerCallMade || result.usageEventIds.length < 1 || result.internalCostRecordIds.length < 1) {
    throw new Error('Unverified Study Chat reasoning cost requires an attempted provider call and reserved usage identities.')
  }
}

export function createBlockedEditReferenceStudyChatReasoningResult(input: {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly blockerCode: EditReferenceStudyChatReasoningBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly providerCallMade?: boolean
  readonly modelCallMade?: boolean
  readonly usage?: {
    readonly internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}): EditReferenceBlockedStudyChatReasoningResult {
  const usage = input.usage ?? {
    internalCostStatus: 'not_incurred' as const,
    meteredInternalCostMicros: '0',
    usageEventIds: [],
    internalCostRecordIds: [],
  }
  const result: EditReferenceBlockedStudyChatReasoningResult = {
    schemaVersion: EDIT_REFERENCE_STUDY_CHAT_REASONING_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceStudyChatReasoningRequest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    ...(input.retryReason ? { retryReason: input.retryReason } : {}),
    answer: null,
    providerCallMade: input.providerCallMade ?? false,
    modelCallMade: input.modelCallMade ?? false,
    remoteMutationMade: false,
    evidenceMutationMade: false,
    dnaMutationMade: false,
    approvalMutationMade: false,
    targetOperationCreated: false,
    internalCostStatus: usage.internalCostStatus,
    meteredInternalCostMicros: usage.meteredInternalCostMicros,
    usageEventIds: [...usage.usageEventIds],
    internalCostRecordIds: [...usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  validateEditReferenceStudyChatReasoningResult(input.request, result)
  return result
}

function assertBoundedIds(values: readonly string[], maxItems: number, name: string, allowEmpty = false): void {
  if ((!allowEmpty && values.length < 1) || values.length > maxItems || new Set(values).size !== values.length) {
    throw new Error(`Study Chat reasoning ${name} is not bounded or unique.`)
  }
  if (values.some((value) => !ID_PATTERN.test(value))) {
    throw new Error(`Study Chat reasoning ${name} contains an invalid identity.`)
  }
}

function assertBoundedTextArray(
  values: readonly string[],
  maxItems: number,
  maxLength: number,
  name: string,
  allowEmpty = false,
): void {
  if ((!allowEmpty && values.length < 1) || values.length > maxItems || values.some((value) => !safeOutputText(value, maxLength))) {
    throw new Error(`Study Chat reasoning ${name} is invalid.`)
  }
}

export function isSafeEditReferenceStudyChatReasoningText(value: unknown, maxLength: number): value is string {
  return safeOutputText(value, maxLength)
}

function safeOutputText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maxLength
    && !UNSAFE_OUTPUT_PATTERN.test(value)
}

function assertExactKeys(value: unknown, allowedKeys: readonly string[], name: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Study Chat reasoning ${name} must be an object.`)
  }
  const allowed = new Set(allowedKeys)
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new Error(`Study Chat reasoning ${name} contains an unsupported field.`)
  }
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}
