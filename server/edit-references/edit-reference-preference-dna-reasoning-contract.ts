import { createHash } from 'node:crypto'
import type { PreferenceDNALayerId } from '../../src/types/preference-dna-builder'
import type { PreferenceEvidenceTransferability } from '../../src/types/edit-reference'
import { detectEditReferenceCopyRisks } from './edit-reference-copy-safety'

export const EDIT_REFERENCE_PREFERENCE_DNA_REASONING_REQUEST_VERSION =
  'edit-reference-preference-dna-reasoning-request-v1' as const
export const EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION =
  'edit-reference-preference-dna-reasoning-result-v1' as const

export const EDIT_REFERENCE_PREFERENCE_DNA_REASONING_LAYER_IDS = [
  'content_type',
  'structure_story_flow',
  'pacing_timing',
  'speech_caption_behavior',
  'visual_scene_language',
  'music_soundsync',
  'sfx_sound_design',
  'graphic_design_visualexplain',
  'ui_document_card_treatment',
  'broll_shot_language',
  'color_tone_space',
  'signature_system_policy',
  'edit_quality_preference',
  'cost_compute_policy',
  'transferable_rules',
  'non_transferable_details',
  'do_not_copy_rules',
  'qa_confidence',
] as const satisfies readonly PreferenceDNALayerId[]

export const EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RULE_KINDS = [
  'must_follow',
  'avoid',
  'do_not_copy',
  'context_only',
] as const

export type EditReferencePreferenceDnaReasoningRuleKind =
  typeof EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RULE_KINDS[number]

export interface EditReferencePreferenceDnaReasoningRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_PREFERENCE_DNA_REASONING_REQUEST_VERSION
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly expectedStudyRevision: number
  readonly inputEvidenceDigestSha256: string
  readonly structuredContextDigestSha256: string
  readonly maxContextCharacters: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly rawMediaInputAllowed: false
  readonly rawFrameInputAllowed: false
  readonly rawTranscriptInputAllowed: false
  readonly projectChatHistoryInputAllowed: false
  readonly externalUrlFetchAllowed: false
  readonly evidenceMutationAllowed: false
  readonly dnaVersionPersistenceAllowed: false
  readonly deterministicDnaReplacementAllowed: false
  readonly qaBypassAllowed: false
  readonly approvalMutationAllowed: false
  readonly targetOperationCreationAllowed: false
  readonly exactReferenceTransferAllowed: false
  readonly customerPriceCalculationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly serviceFeeCalculationAllowed: false
}

export interface EditReferencePreferenceDnaReasoningRule {
  readonly ruleId: string
  readonly kind: EditReferencePreferenceDnaReasoningRuleKind
  readonly statement: string
  readonly evidenceIds: readonly string[]
  readonly confidence: number
  readonly transferability: PreferenceEvidenceTransferability
  readonly targetConditions: readonly string[]
  readonly deterministicSafetyRule: boolean
}

export interface EditReferencePreferenceDnaReasoningLayer {
  readonly layerId: PreferenceDNALayerId
  readonly title: string
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly confidence: number
  readonly transferability: PreferenceEvidenceTransferability
  readonly rules: readonly EditReferencePreferenceDnaReasoningRule[]
  readonly reviewRequired: boolean
}

export interface EditReferencePreferenceDnaReasoningIssue {
  readonly issueId: string
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly requiresUserReview: true
}

export interface EditReferencePreferenceDnaReasoningCandidate {
  readonly layers: readonly EditReferencePreferenceDnaReasoningLayer[]
  readonly contradictions: readonly EditReferencePreferenceDnaReasoningIssue[]
  readonly nonTransferableDetails: readonly EditReferencePreferenceDnaReasoningIssue[]
  readonly transferabilityRules: readonly string[]
  readonly targetAdaptationRules: readonly string[]
  readonly doNotCopyRules: readonly string[]
  readonly missingEvidenceKinds: readonly string[]
  readonly limitations: readonly string[]
  readonly overallConfidence: number
  readonly requiresUserReview: boolean
  readonly adaptedNotCopied: true
}

export interface EditReferencePreferenceDnaReasoningValidation {
  readonly strictSchemaValidated: true
  readonly exactEvidenceLinksValidated: true
  readonly goalLayerCoverageValidated: true
  readonly confidenceValidated: true
  readonly transferabilityValidated: true
  readonly copySafetyValidated: true
  readonly deterministicSafetyRulesInjected: true
  readonly missingEvidenceReviewed: boolean
  readonly contradictionsReviewed: boolean
  readonly nonTransferableDetailsReviewed: boolean
  readonly unsafeAssetAssumptionsRejected: true
}

export interface EditReferencePreferenceDnaReasoningModelProvenance {
  readonly adapterId: string
  readonly adapterVersion: string
  readonly providerId: string
  readonly modelId: string
  readonly modelRevision: string
  readonly modelAggregateSha256: string
  readonly modelRoutingPolicyVersion: string
  readonly reasoningInstructionDigestSha256: string
}

export type EditReferencePreferenceDnaReasoningUsage =
  | {
      readonly mode: 'controlled_not_incurred'
      readonly approvedUsageEstimateId: null
      readonly internalCostBudgetId: null
      readonly immutableRateCardSnapshotId: null
      readonly maximumAuthorizedInternalCostMicros: null
      readonly meteredInternalCostMicros: '0'
      readonly usageEventIds: readonly []
      readonly internalCostRecordIds: readonly []
      readonly customerPriceCalculated: false
      readonly customerCreditsMutated: false
      readonly serviceFeeIncluded: false
    }
  | {
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

export interface EditReferenceValidatedPreferenceDnaReasoningResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'validated_candidate'
  readonly runtimeSource: 'verified_controlled' | 'verified_live'
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly studyRevision: number
  readonly inputEvidenceDigestSha256: string
  readonly candidate: EditReferencePreferenceDnaReasoningCandidate
  readonly validation: EditReferencePreferenceDnaReasoningValidation
  readonly model: EditReferencePreferenceDnaReasoningModelProvenance
  readonly provenance: {
    readonly executionId: string
    readonly startedAt: string
    readonly completedAt: string
  }
  readonly usage: EditReferencePreferenceDnaReasoningUsage
  readonly execution: {
    readonly structuredEvidenceRead: true
    readonly providerCallMade: true
    readonly modelCallMade: true
    readonly workerJobCreated: false
    readonly remoteMutationMade: false
    readonly evidenceMutationMade: false
    readonly dnaVersionPersisted: false
    readonly deterministicDnaReplaced: false
    readonly qaBypassed: false
    readonly approvalMutationMade: false
    readonly targetOperationCreated: false
  }
  readonly privacy: {
    readonly rawMediaRead: false
    readonly rawFramesRead: false
    readonly rawTranscriptRead: false
    readonly projectChatHistoryRead: false
    readonly externalUrlFetched: false
    readonly rawProviderPayloadPersisted: false
    readonly hiddenChainOfThoughtPersisted: false
    readonly signedUrlPersisted: false
  }
  readonly authority: {
    readonly candidateOnly: true
    readonly deterministicDnaRemainsAuthoritative: true
    readonly deterministicQaRequired: true
    readonly exactVersionApprovalRequired: true
    readonly targetSpecificApplicationRequired: true
    readonly userApprovalStillRequired: true
  }
}

export type EditReferencePreferenceDnaReasoningBlockerCode =
  | 'evidence_not_ready'
  | 'context_authority_unverified'
  | 'model_routing_unavailable'
  | 'cost_authority_unavailable'
  | 'reasoning_unavailable'
  | 'runtime_response_invalid'
  | 'evidence_link_invalid'
  | 'goal_layer_coverage_missing'
  | 'transferability_invalid'
  | 'copy_safety_violation'
  | 'internal_cost_usage_unverified'

export interface EditReferenceBlockedPreferenceDnaReasoningResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferencePreferenceDnaReasoningBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly candidate: null
  readonly deterministicFallbackAvailable: true
  readonly deterministicFallbackExecutedByThisResult: false
  readonly qwenAuthoredDnaClaimed: false
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly remoteMutationMade: false
  readonly evidenceMutationMade: false
  readonly dnaVersionPersisted: false
  readonly deterministicDnaReplaced: false
  readonly qaBypassed: false
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

export type EditReferencePreferenceDnaReasoningResult =
  | EditReferenceValidatedPreferenceDnaReasoningResult
  | EditReferenceBlockedPreferenceDnaReasoningResult

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const UNSAFE_TEXT_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential|raw[_ -]?(?:media|frame|transcript|provider|history)/i
const BLOCKER_CODES = new Set<EditReferencePreferenceDnaReasoningBlockerCode>([
  'evidence_not_ready',
  'context_authority_unverified',
  'model_routing_unavailable',
  'cost_authority_unavailable',
  'reasoning_unavailable',
  'runtime_response_invalid',
  'evidence_link_invalid',
  'goal_layer_coverage_missing',
  'transferability_invalid',
  'copy_safety_violation',
  'internal_cost_usage_unverified',
])

export function hashEditReferencePreferenceDnaReasoningRequest(
  request: EditReferencePreferenceDnaReasoningRequest,
): string {
  validateEditReferencePreferenceDnaReasoningRequest(request)
  return sha256(stableStringify(request))
}

export function validateEditReferencePreferenceDnaReasoningRequest(
  request: EditReferencePreferenceDnaReasoningRequest,
): void {
  assertExactKeys(request, [
    'schemaVersion', 'workspaceId', 'actorUserId', 'editReferenceId', 'studySessionId',
    'expectedStudyRevision', 'inputEvidenceDigestSha256', 'structuredContextDigestSha256',
    'maxContextCharacters', 'executionScope', 'approvedUsageEstimateId', 'internalCostBudgetId',
    'immutableRateCardSnapshotId', 'maximumAuthorizedInternalCostMicros', 'rawMediaInputAllowed',
    'rawFrameInputAllowed', 'rawTranscriptInputAllowed', 'projectChatHistoryInputAllowed',
    'externalUrlFetchAllowed', 'evidenceMutationAllowed', 'dnaVersionPersistenceAllowed',
    'deterministicDnaReplacementAllowed', 'qaBypassAllowed', 'approvalMutationAllowed',
    'targetOperationCreationAllowed', 'exactReferenceTransferAllowed',
    'customerPriceCalculationAllowed', 'customerCreditMutationAllowed', 'serviceFeeCalculationAllowed',
  ], 'request')
  if (request.schemaVersion !== EDIT_REFERENCE_PREFERENCE_DNA_REASONING_REQUEST_VERSION) {
    throw new Error('Preference DNA reasoning request version is unsupported.')
  }
  for (const value of [request.workspaceId, request.actorUserId, request.editReferenceId, request.studySessionId]) {
    if (!ID_PATTERN.test(value)) throw new Error('Preference DNA reasoning identity is invalid.')
  }
  if (
    !Number.isSafeInteger(request.expectedStudyRevision)
    || request.expectedStudyRevision < 1
    || !SHA256_PATTERN.test(request.inputEvidenceDigestSha256)
    || !SHA256_PATTERN.test(request.structuredContextDigestSha256)
    || !Number.isSafeInteger(request.maxContextCharacters)
    || request.maxContextCharacters < 1
    || request.maxContextCharacters > 64_000
    || !['controlled_test', 'production'].includes(request.executionScope)
  ) throw new Error('Preference DNA reasoning request bounds are invalid.')
  const forbidden = [
    request.rawMediaInputAllowed,
    request.rawFrameInputAllowed,
    request.rawTranscriptInputAllowed,
    request.projectChatHistoryInputAllowed,
    request.externalUrlFetchAllowed,
    request.evidenceMutationAllowed,
    request.dnaVersionPersistenceAllowed,
    request.deterministicDnaReplacementAllowed,
    request.qaBypassAllowed,
    request.approvalMutationAllowed,
    request.targetOperationCreationAllowed,
    request.exactReferenceTransferAllowed,
    request.customerPriceCalculationAllowed,
    request.customerCreditMutationAllowed,
    request.serviceFeeCalculationAllowed,
  ]
  if (forbidden.some((value) => value !== false)) {
    throw new Error('Preference DNA reasoning request exceeds its candidate-only boundary.')
  }
  const costIds = [
    request.approvedUsageEstimateId,
    request.internalCostBudgetId,
    request.immutableRateCardSnapshotId,
  ]
  if (request.executionScope === 'controlled_test') {
    if (costIds.some((value) => value !== null) || request.maximumAuthorizedInternalCostMicros !== null) {
      throw new Error('Controlled Preference DNA reasoning cannot claim production cost authority.')
    }
    return
  }
  if (costIds.some((value) => typeof value !== 'string' || !ID_PATTERN.test(value))) {
    throw new Error('Production Preference DNA reasoning requires exact cost identities.')
  }
  if (
    !request.maximumAuthorizedInternalCostMicros
    || !MONEY_MICROS_PATTERN.test(request.maximumAuthorizedInternalCostMicros)
    || BigInt(request.maximumAuthorizedInternalCostMicros) <= 0n
  ) throw new Error('Production Preference DNA reasoning requires a positive internal-cost ceiling.')
}

export function validateEditReferencePreferenceDnaReasoningResult(
  request: EditReferencePreferenceDnaReasoningRequest,
  result: EditReferencePreferenceDnaReasoningResult,
): void {
  validateEditReferencePreferenceDnaReasoningRequest(request)
  if (result.schemaVersion !== EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION) {
    throw new Error('Preference DNA reasoning result version is unsupported.')
  }
  if (result.requestDigestSha256 !== hashEditReferencePreferenceDnaReasoningRequest(request)) {
    throw new Error('Preference DNA reasoning result does not match the exact request.')
  }
  if (result.status === 'blocked') {
    validateBlocked(result)
    return
  }
  validateCandidateResult(request, result)
}

function validateCandidateResult(
  request: EditReferencePreferenceDnaReasoningRequest,
  result: EditReferenceValidatedPreferenceDnaReasoningResult,
): void {
  assertExactKeys(result, [
    'schemaVersion', 'requestDigestSha256', 'status', 'runtimeSource', 'workspaceId', 'actorUserId',
    'editReferenceId', 'studySessionId', 'studyRevision', 'inputEvidenceDigestSha256', 'candidate',
    'validation', 'model', 'provenance', 'usage', 'execution', 'privacy', 'authority',
  ], 'validated result')
  if (
    result.workspaceId !== request.workspaceId
    || result.actorUserId !== request.actorUserId
    || result.editReferenceId !== request.editReferenceId
    || result.studySessionId !== request.studySessionId
    || result.studyRevision !== request.expectedStudyRevision
    || result.inputEvidenceDigestSha256 !== request.inputEvidenceDigestSha256
    || result.runtimeSource !== (request.executionScope === 'production' ? 'verified_live' : 'verified_controlled')
  ) throw new Error('Preference DNA reasoning result identity or runtime source is invalid.')
  validateCandidate(result.candidate)
  assertExactKeys(result.validation, [
    'strictSchemaValidated', 'exactEvidenceLinksValidated', 'goalLayerCoverageValidated',
    'confidenceValidated', 'transferabilityValidated', 'copySafetyValidated',
    'deterministicSafetyRulesInjected', 'missingEvidenceReviewed', 'contradictionsReviewed',
    'nonTransferableDetailsReviewed', 'unsafeAssetAssumptionsRejected',
  ], 'validation report')
  if (Object.values(result.validation).some((value) => typeof value !== 'boolean')) {
    throw new Error('Preference DNA reasoning validation report is invalid.')
  }
  for (const key of [
    'strictSchemaValidated', 'exactEvidenceLinksValidated', 'goalLayerCoverageValidated',
    'confidenceValidated', 'transferabilityValidated', 'copySafetyValidated',
    'deterministicSafetyRulesInjected', 'unsafeAssetAssumptionsRejected',
  ] as const) if (result.validation[key] !== true) throw new Error(`Preference DNA reasoning ${key} must pass.`)
  validateModel(result.model)
  assertExactKeys(result.provenance, ['executionId', 'startedAt', 'completedAt'], 'provenance')
  if (
    !ID_PATTERN.test(result.provenance.executionId)
    || !isIso(result.provenance.startedAt)
    || !isIso(result.provenance.completedAt)
    || Date.parse(result.provenance.completedAt) < Date.parse(result.provenance.startedAt)
  ) throw new Error('Preference DNA reasoning provenance is invalid.')
  assertExactKeys(result.execution, [
    'structuredEvidenceRead', 'providerCallMade', 'modelCallMade', 'workerJobCreated',
    'remoteMutationMade', 'evidenceMutationMade', 'dnaVersionPersisted',
    'deterministicDnaReplaced', 'qaBypassed', 'approvalMutationMade', 'targetOperationCreated',
  ], 'execution')
  assertExactKeys(result.privacy, [
    'rawMediaRead', 'rawFramesRead', 'rawTranscriptRead', 'projectChatHistoryRead',
    'externalUrlFetched', 'rawProviderPayloadPersisted', 'hiddenChainOfThoughtPersisted',
    'signedUrlPersisted',
  ], 'privacy')
  assertExactKeys(result.authority, [
    'candidateOnly', 'deterministicDnaRemainsAuthoritative', 'deterministicQaRequired',
    'exactVersionApprovalRequired', 'targetSpecificApplicationRequired', 'userApprovalStillRequired',
  ], 'candidate authority')
  if (Object.values(result.execution).some((value) => value !== false && value !== true)) {
    throw new Error('Preference DNA reasoning execution report is invalid.')
  }
  if (
    result.execution.structuredEvidenceRead !== true
    || result.execution.providerCallMade !== true
    || result.execution.modelCallMade !== true
    || Object.entries(result.execution).some(([key, value]) => key !== 'structuredEvidenceRead' && key !== 'providerCallMade' && key !== 'modelCallMade' && value !== false)
    || Object.values(result.privacy).some((value) => value !== false)
    || Object.values(result.authority).some((value) => value !== true)
  ) throw new Error('Preference DNA reasoning crossed its private candidate boundary.')
  validateUsage(request, result.usage)
}

function validateCandidate(candidate: EditReferencePreferenceDnaReasoningCandidate): void {
  assertExactKeys(candidate, [
    'layers', 'contradictions', 'nonTransferableDetails', 'transferabilityRules',
    'targetAdaptationRules', 'doNotCopyRules', 'missingEvidenceKinds', 'limitations',
    'overallConfidence', 'requiresUserReview', 'adaptedNotCopied',
  ], 'candidate')
  if (
    candidate.layers.length < 1
    || candidate.layers.length > EDIT_REFERENCE_PREFERENCE_DNA_REASONING_LAYER_IDS.length
    || new Set(candidate.layers.map((layer) => layer.layerId)).size !== candidate.layers.length
    || !finiteConfidence(candidate.overallConfidence)
    || candidate.adaptedNotCopied !== true
  ) throw new Error('Preference DNA reasoning candidate bounds are invalid.')
  const allowedLayers = new Set<string>(EDIT_REFERENCE_PREFERENCE_DNA_REASONING_LAYER_IDS)
  const riskyTransferText: string[] = []
  let deterministicSafetyRuleCount = 0
  for (const layer of candidate.layers) {
    assertExactKeys(layer, [
      'layerId', 'title', 'summary', 'evidenceIds', 'confidence', 'transferability',
      'rules', 'reviewRequired',
    ], 'candidate layer')
    if (
      !allowedLayers.has(layer.layerId)
      || !safeText(layer.title, 160)
      || !safeText(layer.summary, 1_200)
      || !finiteConfidence(layer.confidence)
      || !validTransferability(layer.transferability)
      || layer.rules.length < 1
      || layer.rules.length > 32
    ) throw new Error('Preference DNA reasoning layer is invalid.')
    assertIds(layer.evidenceIds, 64)
    for (const rule of layer.rules) {
      assertExactKeys(rule, [
        'ruleId', 'kind', 'statement', 'evidenceIds', 'confidence', 'transferability',
        'targetConditions', 'deterministicSafetyRule',
      ], 'candidate rule')
      if (
        !ID_PATTERN.test(rule.ruleId)
        || !EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RULE_KINDS.includes(rule.kind)
        || !safeText(rule.statement, 800)
        || !finiteConfidence(rule.confidence)
        || !validTransferability(rule.transferability)
      ) throw new Error('Preference DNA reasoning rule is invalid.')
      assertIds(rule.evidenceIds, 64)
      assertSafeTextArray(rule.targetConditions, 8, 500, false)
      if (rule.evidenceIds.some((id) => !layer.evidenceIds.includes(id))) {
        throw new Error('Preference DNA reasoning rule escapes its layer evidence.')
      }
      if (rule.kind === 'must_follow' && rule.transferability !== 'transferable') {
        throw new Error('Preference DNA reasoning must-follow rule is not transferable.')
      }
      if (rule.kind === 'do_not_copy' && (rule.transferability !== 'do_not_copy' || layer.layerId !== 'do_not_copy_rules')) {
        throw new Error('Preference DNA reasoning do-not-copy rule is misclassified.')
      }
      if (rule.deterministicSafetyRule) deterministicSafetyRuleCount += 1
      if (!rule.deterministicSafetyRule && ['must_follow', 'avoid'].includes(rule.kind)) riskyTransferText.push(rule.statement)
    }
  }
  for (const issue of [...candidate.contradictions, ...candidate.nonTransferableDetails]) {
    assertExactKeys(issue, ['issueId', 'summary', 'evidenceIds', 'requiresUserReview'], 'candidate issue')
    if (!ID_PATTERN.test(issue.issueId) || !safeText(issue.summary, 800) || issue.requiresUserReview !== true) {
      throw new Error('Preference DNA reasoning issue is invalid.')
    }
    assertIds(issue.evidenceIds, 64)
  }
  assertSafeTextArray(candidate.transferabilityRules, 32, 800, false)
  assertSafeTextArray(candidate.targetAdaptationRules, 32, 800, false)
  assertSafeTextArray(candidate.doNotCopyRules, 32, 800, false)
  assertSafeTextArray(candidate.missingEvidenceKinds, 32, 200, true)
  assertSafeTextArray(candidate.limitations, 32, 500, true)
  riskyTransferText.push(...candidate.transferabilityRules, ...candidate.targetAdaptationRules)
  if (
    deterministicSafetyRuleCount < 5
    || candidate.doNotCopyRules.some((rule) => !isExplicitSafetyBoundary(rule))
    || detectEditReferenceCopyRisks(riskyTransferText).length > 0
  ) {
    throw new Error('Preference DNA reasoning candidate failed deterministic copy safety.')
  }
}

function validateBlocked(result: EditReferenceBlockedPreferenceDnaReasoningResult): void {
  assertExactKeys(result, [
    'schemaVersion', 'requestDigestSha256', 'status', 'blockerCode', 'blockerMessage',
    'retryAvailable', ...(result.retryReason === undefined ? [] : ['retryReason']),
    'candidate', 'deterministicFallbackAvailable',
    'deterministicFallbackExecutedByThisResult', 'qwenAuthoredDnaClaimed', 'providerCallMade',
    'modelCallMade', 'remoteMutationMade', 'evidenceMutationMade', 'dnaVersionPersisted',
    'deterministicDnaReplaced', 'qaBypassed', 'approvalMutationMade', 'targetOperationCreated',
    'internalCostStatus', 'meteredInternalCostMicros', 'usageEventIds', 'internalCostRecordIds',
    'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'blocked result')
  if (
    !BLOCKER_CODES.has(result.blockerCode)
    || !safeText(result.blockerMessage, 600)
    || (result.retryAvailable && !safeText(result.retryReason, 600))
    || (!result.retryAvailable && result.retryReason !== undefined)
    || result.candidate !== null
    || result.deterministicFallbackAvailable !== true
    || result.deterministicFallbackExecutedByThisResult !== false
    || result.qwenAuthoredDnaClaimed !== false
    || result.remoteMutationMade !== false
    || result.evidenceMutationMade !== false
    || result.dnaVersionPersisted !== false
    || result.deterministicDnaReplaced !== false
    || result.qaBypassed !== false
    || result.approvalMutationMade !== false
    || result.targetOperationCreated !== false
    || result.customerPriceCalculated !== false
    || result.customerCreditsMutated !== false
    || result.serviceFeeIncluded !== false
    || (result.modelCallMade && !result.providerCallMade)
  ) throw new Error('Blocked Preference DNA reasoning result is invalid.')
  assertIds(result.usageEventIds, 64, true)
  assertIds(result.internalCostRecordIds, 64, true)
  if (result.internalCostStatus === 'not_incurred') {
    if (result.meteredInternalCostMicros !== '0' || result.usageEventIds.length || result.internalCostRecordIds.length) {
      throw new Error('Non-incurred Preference DNA reasoning has invalid usage.')
    }
  } else if (result.internalCostStatus === 'metered') {
    if (!result.meteredInternalCostMicros || !MONEY_MICROS_PATTERN.test(result.meteredInternalCostMicros) || !result.usageEventIds.length || !result.internalCostRecordIds.length) {
      throw new Error('Metered Preference DNA reasoning blocker lacks usage evidence.')
    }
  } else if (
    result.internalCostStatus !== 'unverified'
    || result.meteredInternalCostMicros !== null
    || !result.providerCallMade
    || !result.usageEventIds.length
    || !result.internalCostRecordIds.length
  ) throw new Error('Unverified Preference DNA reasoning cost is invalid.')
}

function validateModel(model: EditReferencePreferenceDnaReasoningModelProvenance): void {
  assertExactKeys(model, [
    'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRevision',
    'modelAggregateSha256', 'modelRoutingPolicyVersion', 'reasoningInstructionDigestSha256',
  ], 'model provenance')
  for (const value of [
    model.adapterId, model.adapterVersion, model.providerId, model.modelId,
    model.modelRevision, model.modelRoutingPolicyVersion,
  ]) if (!ID_PATTERN.test(value)) throw new Error('Preference DNA reasoning model identity is invalid.')
  if (!SHA256_PATTERN.test(model.modelAggregateSha256) || !SHA256_PATTERN.test(model.reasoningInstructionDigestSha256)) {
    throw new Error('Preference DNA reasoning model digest is invalid.')
  }
}

function validateUsage(
  request: EditReferencePreferenceDnaReasoningRequest,
  usage: EditReferencePreferenceDnaReasoningUsage,
): void {
  assertExactKeys(usage, [
    'mode', 'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ], 'usage')
  if (request.executionScope === 'controlled_test') {
    if (
      usage.mode !== 'controlled_not_incurred'
      || usage.approvedUsageEstimateId !== null
      || usage.internalCostBudgetId !== null
      || usage.immutableRateCardSnapshotId !== null
      || usage.maximumAuthorizedInternalCostMicros !== null
      || usage.meteredInternalCostMicros !== '0'
      || usage.usageEventIds.length
      || usage.internalCostRecordIds.length
    ) throw new Error('Controlled Preference DNA reasoning usage is invalid.')
  } else if (
    usage.mode !== 'production_metered'
    || usage.approvedUsageEstimateId !== request.approvedUsageEstimateId
    || usage.internalCostBudgetId !== request.internalCostBudgetId
    || usage.immutableRateCardSnapshotId !== request.immutableRateCardSnapshotId
    || usage.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
    || !MONEY_MICROS_PATTERN.test(usage.meteredInternalCostMicros)
    || BigInt(usage.meteredInternalCostMicros) <= 0n
    || BigInt(usage.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros as string)
  ) throw new Error('Production Preference DNA reasoning usage is invalid.')
  assertIds(usage.usageEventIds, 64, request.executionScope === 'controlled_test')
  assertIds(usage.internalCostRecordIds, 64, request.executionScope === 'controlled_test')
  if (usage.customerPriceCalculated !== false || usage.customerCreditsMutated !== false || usage.serviceFeeIncluded !== false) {
    throw new Error('Preference DNA reasoning mixed internal cost with customer pricing.')
  }
}

export function createBlockedEditReferencePreferenceDnaReasoningResult(input: {
  readonly request: EditReferencePreferenceDnaReasoningRequest
  readonly blockerCode: EditReferencePreferenceDnaReasoningBlockerCode
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
}): EditReferenceBlockedPreferenceDnaReasoningResult {
  const usage = input.usage ?? {
    internalCostStatus: 'not_incurred' as const,
    meteredInternalCostMicros: '0',
    usageEventIds: [],
    internalCostRecordIds: [],
  }
  const result: EditReferenceBlockedPreferenceDnaReasoningResult = {
    schemaVersion: EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION,
    requestDigestSha256: hashEditReferencePreferenceDnaReasoningRequest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    ...(input.retryReason ? { retryReason: input.retryReason } : {}),
    candidate: null,
    deterministicFallbackAvailable: true,
    deterministicFallbackExecutedByThisResult: false,
    qwenAuthoredDnaClaimed: false,
    providerCallMade: input.providerCallMade ?? false,
    modelCallMade: input.modelCallMade ?? false,
    remoteMutationMade: false,
    evidenceMutationMade: false,
    dnaVersionPersisted: false,
    deterministicDnaReplaced: false,
    qaBypassed: false,
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
  validateEditReferencePreferenceDnaReasoningResult(input.request, result)
  return result
}

export function isSafeEditReferencePreferenceDnaReasoningText(value: unknown, maxLength: number): value is string {
  return safeText(value, maxLength)
}

function validTransferability(value: unknown): value is PreferenceEvidenceTransferability {
  return ['transferable', 'non_transferable', 'do_not_copy', 'requires_user_review', 'unknown'].includes(String(value))
}

function finiteConfidence(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

function assertIds(values: readonly string[], max: number, allowEmpty = false): void {
  if ((!allowEmpty && !values.length) || values.length > max || new Set(values).size !== values.length || values.some((value) => !ID_PATTERN.test(value))) {
    throw new Error('Preference DNA reasoning identity list is invalid.')
  }
}

function assertSafeTextArray(values: readonly string[], maxItems: number, maxLength: number, allowEmpty: boolean): void {
  if ((!allowEmpty && !values.length) || values.length > maxItems || values.some((value) => !safeText(value, maxLength))) {
    throw new Error('Preference DNA reasoning text list is invalid.')
  }
}

function safeText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maxLength
    && !UNSAFE_TEXT_PATTERN.test(value)
}

function isExplicitSafetyBoundary(value: string): boolean {
  return /^(?:do not|never|avoid)\b/i.test(value.trim())
    || /\bmust not\b/i.test(value)
    || /\bonly as [^.!?]{0,120}\bguidance\b/i.test(value)
}

function assertExactKeys(value: unknown, allowedKeys: readonly string[], name: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Preference DNA reasoning ${name} must be an object.`)
  const allowed = new Set(allowedKeys)
  const actual = Object.keys(value)
  if (
    actual.length !== allowed.size
    || actual.some((key) => !allowed.has(key))
    || allowedKeys.some((key) => !(key in value))
  ) throw new Error(`Preference DNA reasoning ${name} does not match its exact schema.`)
}

function isIso(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
