import { createHash, randomUUID } from 'node:crypto'
import { classifyPreferenceDNAConfidenceBand } from '../../src/backend/preference-dna/preference-dna-evidence-scoring-service'
import type {
  EditReferenceRecord,
  PreferenceDNAConflictSnapshot,
  PreferenceDNALayerSnapshot,
  PreferenceDNAReasoningProvenance,
  PreferenceDNARuleRecord,
  PreferenceDNAVersionRecord,
  PreferenceEvidenceRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
import {
  hashEditReferencePreferenceDnaReasoningResult,
  type EditReferencePreferenceDnaReasoningAttemptRecord,
} from './edit-reference-preference-dna-reasoning-attempt-contract'
import type {
  EditReferencePreferenceDnaReasoningCandidate,
  EditReferencePreferenceDnaReasoningLayer,
} from './edit-reference-preference-dna-reasoning-contract'
import {
  calculateEditReferenceDNAContentDigest,
  calculateEditReferenceDNAInputDigest,
} from './edit-reference-dna-synthesis'

export const EDIT_REFERENCE_QWEN_DNA_SYNTHESIS_VERSION =
  'edit-reference-qwen-dna-synthesis-v1' as const
export const EDIT_REFERENCE_QWEN_DNA_PROVENANCE_VERSION =
  'edit-reference-qwen-dna-provenance-v1' as const

export interface MaterializeEditReferencePreferenceDnaReasoningCandidateInput {
  readonly workspaceId: string
  readonly expectedAttemptRevision: number
  readonly expectedStudyRevision: number
  readonly expectedResultDigestSha256: string
}

interface MaterializationInput {
  readonly reference: EditReferenceRecord
  readonly study: PreferenceStudySessionRecord
  readonly evidence: readonly PreferenceEvidenceRecord[]
  readonly inputEvidenceRevisions: ReadonlyArray<{ readonly evidenceId: string; readonly revision: number }>
  readonly existingVersions: readonly PreferenceDNAVersionRecord[]
  readonly attempt: EditReferencePreferenceDnaReasoningAttemptRecord
  readonly now: string
}

export function materializeEditReferencePreferenceDnaReasoningCandidate(
  input: MaterializationInput,
): PreferenceDNAVersionRecord {
  const result = input.attempt.result
  if (
    input.attempt.state !== 'completed'
    || input.attempt.revision !== 3
    || input.attempt.candidateHandoffAllowed !== true
    || input.attempt.deterministicFallbackEligible
    || !result
    || result.status !== 'validated_candidate'
    || input.attempt.resultDigestSha256 !== hashEditReferencePreferenceDnaReasoningResult(result)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Only an exact completed Preference DNA reasoning candidate can be materialized.', 409)
  }
  if (
    result.workspaceId !== input.reference.workspaceId
    || result.editReferenceId !== input.reference.id
    || result.studySessionId !== input.study.id
    || input.study.editReferenceId !== input.reference.id
    || result.studyRevision !== input.study.revision
    || input.attempt.studyRevisionAtReservation !== input.study.revision
  ) {
    throw new ApiError('VERSION_CONFLICT', 'The Preference Study changed before candidate materialization.', 409)
  }

  const inputEvidenceRevisions = input.inputEvidenceRevisions
    .map((record) => ({ evidenceId: record.evidenceId, revision: record.revision }))
    .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId))
  const inputEvidenceDigest = calculateEditReferenceDNAInputDigest(inputEvidenceRevisions)
  if (
    inputEvidenceDigest !== input.attempt.request.inputEvidenceDigestSha256
    || inputEvidenceDigest !== result.inputEvidenceDigestSha256
  ) {
    throw new ApiError('VERSION_CONFLICT', 'The exact candidate evidence digest cannot be reconstructed.', 409)
  }
  const evidenceById = new Map(input.evidence.map((record) => [record.id, record]))
  for (const revision of inputEvidenceRevisions) {
    const evidence = evidenceById.get(revision.evidenceId)
    if (
      !evidence
      || evidence.revision !== revision.revision
      || evidence.editReferenceId !== input.reference.id
      || evidence.studySessionId !== input.study.id
    ) throw new ApiError('VERSION_CONFLICT', 'Candidate evidence changed before materialization.', 409)
  }

  const rules = materializeRules(input.attempt.id, result.candidate.layers)
  const ruleIds = new Set(rules.map((rule) => rule.id))
  const layers = result.candidate.layers.map((candidateLayer): PreferenceDNALayerSnapshot => {
    const layerRules = rules.filter((rule) => rule.layerId === candidateLayer.layerId)
    const evidenceIds = unique(layerRules.flatMap((rule) => rule.evidenceIds))
    if (!layerRules.length || !evidenceIds.length || layerRules.some((rule) => !ruleIds.has(rule.id))) {
      throw new ApiError('VALIDATION_FAILED', 'Candidate layer materialization is incomplete.', 409)
    }
    return {
      layerId: candidateLayer.layerId,
      title: candidateLayer.title,
      summary: candidateLayer.summary,
      evidenceIds,
      ruleIds: layerRules.map((rule) => rule.id),
      confidence: candidateLayer.confidence,
      confidenceBand: classifyPreferenceDNAConfidenceBand(candidateLayer.confidence),
      transferability: candidateLayer.transferability,
      coverage: candidateLayer.reviewRequired ? 'review_required' : 'covered',
    }
  })
  const conflicts = materializeConflicts(input.attempt.id, result.candidate)
  const provenance = createReasoningProvenance(input.attempt)
  const versionNumber = input.existingVersions.reduce((maximum, record) => Math.max(maximum, record.version), 0) + 1
  const immutableContent = {
    synthesisVersion: EDIT_REFERENCE_QWEN_DNA_SYNTHESIS_VERSION,
    inputEvidenceRevisions,
    inputEvidenceDigest,
    layers,
    rules,
    conflicts,
    overallConfidence: result.candidate.overallConfidence,
    overallConfidenceBand: classifyPreferenceDNAConfidenceBand(result.candidate.overallConfidence),
    adaptedNotCopied: true as const,
    reasoningProvenance: provenance,
    providerCallMade: true,
    modelCallMade: true,
  }
  return {
    id: `preference-dna-version-${randomUUID()}`,
    workspaceId: input.reference.workspaceId,
    editReferenceId: input.reference.id,
    studySessionId: input.study.id,
    version: versionNumber,
    status: 'review_required',
    synthesisVersion: EDIT_REFERENCE_QWEN_DNA_SYNTHESIS_VERSION,
    runtimeSource: result.runtimeSource,
    inputEvidenceRevisions,
    inputEvidenceDigest,
    layers,
    rules,
    conflicts,
    overallConfidence: result.candidate.overallConfidence,
    overallConfidenceBand: classifyPreferenceDNAConfidenceBand(result.candidate.overallConfidence),
    adaptedNotCopied: true,
    doNotCopyRuleCount: rules.filter((rule) => rule.kind === 'do_not_copy').length,
    qaStatus: 'not_run',
    reasoningProvenance: provenance,
    contentDigest: calculateEditReferenceDNAContentDigest(immutableContent),
    providerCallMade: true,
    modelCallMade: true,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    createdAt: input.now,
  }
}

export function validateEditReferenceQwenDnaVersionProvenance(
  version: PreferenceDNAVersionRecord,
): void {
  const provenance = version.reasoningProvenance
  if (
    version.synthesisVersion !== EDIT_REFERENCE_QWEN_DNA_SYNTHESIS_VERSION
    || !provenance
    || provenance.schemaVersion !== EDIT_REFERENCE_QWEN_DNA_PROVENANCE_VERSION
    || !safeId(provenance.reasoningAttemptId)
    || !isSha256(provenance.requestDigestSha256)
    || !isSha256(provenance.resultDigestSha256)
    || !isSha256(provenance.structuredContextDigestSha256)
    || provenance.inputEvidenceDigestSha256 !== version.inputEvidenceDigest
    || !['verified_controlled', 'verified_live'].includes(provenance.runtimeSource)
    || version.runtimeSource !== provenance.runtimeSource
    || !safeId(provenance.adapterId)
    || !safeId(provenance.adapterVersion)
    || !safeId(provenance.providerId)
    || !safeId(provenance.modelId)
    || !safeId(provenance.modelRevision)
    || !isSha256(provenance.modelAggregateSha256)
    || !safeId(provenance.modelRoutingPolicyVersion)
    || !isSha256(provenance.reasoningInstructionDigestSha256)
    || !safeId(provenance.executionId)
    || !isIsoDate(provenance.startedAt)
    || !isIsoDate(provenance.completedAt)
    || provenance.completedAt < provenance.startedAt
    || !['controlled_not_incurred', 'production_metered'].includes(provenance.usageMode)
    || !moneyMicros(provenance.meteredInternalCostMicros)
    || !Array.isArray(provenance.usageEventIds)
    || !Array.isArray(provenance.internalCostRecordIds)
    || !provenance.usageEventIds.every(safeId)
    || !provenance.internalCostRecordIds.every(safeId)
    || !Array.isArray(provenance.missingEvidenceKinds)
    || !Array.isArray(provenance.limitations)
    || provenance.missingEvidenceKinds.length > 32
    || provenance.limitations.length > 32
    || !provenance.missingEvidenceKinds.every((value) => safeText(value, 500))
    || !provenance.limitations.every((value) => safeText(value, 1_000))
    || typeof provenance.candidateRequiresUserReview !== 'boolean'
    || provenance.candidateResultValidated !== true
    || provenance.deterministicQaRequired !== true
    || provenance.approvalAuthorityGranted !== false
    || provenance.customerPriceCalculated !== false
    || provenance.customerCreditsMutated !== false
    || provenance.serviceFeeIncluded !== false
    || version.providerCallMade !== true
    || version.modelCallMade !== true
  ) throw new Error('Qwen-authored Preference DNA provenance is invalid.')

  const costIds = [
    provenance.approvedUsageEstimateId,
    provenance.internalCostBudgetId,
    provenance.immutableRateCardSnapshotId,
  ]
  if (provenance.usageMode === 'controlled_not_incurred') {
    if (
      costIds.some((value) => value !== null)
      || provenance.maximumAuthorizedInternalCostMicros !== null
      || provenance.meteredInternalCostMicros !== '0'
      || provenance.usageEventIds.length
      || provenance.internalCostRecordIds.length
    ) throw new Error('Controlled Qwen-authored Preference DNA cost provenance is invalid.')
  } else if (
    costIds.some((value) => typeof value !== 'string' || !safeId(value))
    || !moneyMicros(provenance.maximumAuthorizedInternalCostMicros)
    || provenance.usageEventIds.length < 1
    || provenance.internalCostRecordIds.length < 1
  ) throw new Error('Metered Qwen-authored Preference DNA cost provenance is invalid.')
}

export function validateEditReferenceQwenDnaVersionAttemptBinding(
  version: PreferenceDNAVersionRecord,
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord,
): void {
  validateEditReferenceQwenDnaVersionProvenance(version)
  const provenance = version.reasoningProvenance
  const result = attempt.result
  if (
    !provenance
    || attempt.state !== 'completed'
    || !attempt.candidateHandoffAllowed
    || attempt.deterministicFallbackEligible
    || !result
    || result.status !== 'validated_candidate'
    || provenance.reasoningAttemptId !== attempt.id
    || provenance.requestDigestSha256 !== attempt.requestDigestSha256
    || provenance.resultDigestSha256 !== attempt.resultDigestSha256
    || provenance.resultDigestSha256 !== hashEditReferencePreferenceDnaReasoningResult(result)
    || provenance.structuredContextDigestSha256 !== attempt.request.structuredContextDigestSha256
    || provenance.inputEvidenceDigestSha256 !== attempt.request.inputEvidenceDigestSha256
    || provenance.runtimeSource !== result.runtimeSource
    || provenance.adapterId !== result.model.adapterId
    || provenance.adapterVersion !== result.model.adapterVersion
    || provenance.providerId !== result.model.providerId
    || provenance.modelId !== result.model.modelId
    || provenance.modelRevision !== result.model.modelRevision
    || provenance.modelAggregateSha256 !== result.model.modelAggregateSha256
    || provenance.modelRoutingPolicyVersion !== result.model.modelRoutingPolicyVersion
    || provenance.reasoningInstructionDigestSha256 !== result.model.reasoningInstructionDigestSha256
    || provenance.executionId !== result.provenance.executionId
    || provenance.startedAt !== result.provenance.startedAt
    || provenance.completedAt !== result.provenance.completedAt
    || provenance.usageMode !== result.usage.mode
    || provenance.approvedUsageEstimateId !== result.usage.approvedUsageEstimateId
    || provenance.internalCostBudgetId !== result.usage.internalCostBudgetId
    || provenance.immutableRateCardSnapshotId !== result.usage.immutableRateCardSnapshotId
    || provenance.maximumAuthorizedInternalCostMicros !== result.usage.maximumAuthorizedInternalCostMicros
    || provenance.meteredInternalCostMicros !== result.usage.meteredInternalCostMicros
    || stableStringify(provenance.usageEventIds) !== stableStringify(result.usage.usageEventIds)
    || stableStringify(provenance.internalCostRecordIds) !== stableStringify(result.usage.internalCostRecordIds)
    || stableStringify(provenance.missingEvidenceKinds) !== stableStringify(result.candidate.missingEvidenceKinds)
    || stableStringify(provenance.limitations) !== stableStringify(result.candidate.limitations)
    || provenance.candidateRequiresUserReview !== result.candidate.requiresUserReview
  ) throw new Error('Qwen-authored Preference DNA attempt binding is invalid.')
}

export function hasValidEditReferenceDnaProviderProvenance(
  version: PreferenceDNAVersionRecord,
): boolean {
  if (version.synthesisVersion === 'edit-reference-dna-synthesis-v1') {
    return version.runtimeSource === 'verified_mock'
      && version.reasoningProvenance === undefined
      && version.providerCallMade === false
      && version.modelCallMade === false
  }
  try {
    validateEditReferenceQwenDnaVersionProvenance(version)
    return true
  } catch {
    return false
  }
}

function materializeRules(
  attemptId: string,
  layers: readonly EditReferencePreferenceDnaReasoningLayer[],
): PreferenceDNARuleRecord[] {
  const records = layers.flatMap((layer) => layer.rules.map((rule): PreferenceDNARuleRecord => ({
    id: stableId('preference-dna-rule', { attemptId, layerId: layer.layerId, candidateRuleId: rule.ruleId }),
    layerId: layer.layerId,
    kind: rule.kind,
    statement: rule.statement,
    evidenceIds: unique(rule.evidenceIds),
    confidence: rule.confidence,
    transferability: rule.transferability,
    source: rule.deterministicSafetyRule ? 'deterministic_safety_rule' : 'qwen_reasoning_candidate',
    targetConditions: unique(rule.targetConditions),
  })))
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    throw new ApiError('VALIDATION_FAILED', 'Candidate rule identity is not unique.', 409)
  }
  return records
}

function materializeConflicts(
  attemptId: string,
  candidate: EditReferencePreferenceDnaReasoningCandidate,
): PreferenceDNAConflictSnapshot[] {
  return [
    ...candidate.contradictions.map((issue): PreferenceDNAConflictSnapshot => ({
      id: stableId('preference-dna-conflict', { attemptId, kind: 'reasoning_contradiction', issueId: issue.issueId }),
      kind: 'reasoning_contradiction',
      title: 'Reasoning contradiction requires review',
      summary: issue.summary,
      evidenceIds: unique(issue.evidenceIds),
      severity: 'high',
      requiresUserReview: true,
    })),
    ...candidate.nonTransferableDetails.map((issue): PreferenceDNAConflictSnapshot => ({
      id: stableId('preference-dna-conflict', { attemptId, kind: 'reasoning_non_transferable_detail', issueId: issue.issueId }),
      kind: 'reasoning_non_transferable_detail',
      title: 'Reference-specific detail cannot transfer',
      summary: issue.summary,
      evidenceIds: unique(issue.evidenceIds),
      severity: 'medium',
      requiresUserReview: true,
    })),
  ]
}

function createReasoningProvenance(
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord,
): PreferenceDNAReasoningProvenance {
  const result = attempt.result
  if (!result || result.status !== 'validated_candidate' || !attempt.resultDigestSha256) {
    throw new ApiError('VALIDATION_FAILED', 'Preference DNA reasoning result provenance is unavailable.', 409)
  }
  return {
    schemaVersion: EDIT_REFERENCE_QWEN_DNA_PROVENANCE_VERSION,
    reasoningAttemptId: attempt.id,
    requestDigestSha256: attempt.requestDigestSha256,
    resultDigestSha256: attempt.resultDigestSha256,
    structuredContextDigestSha256: attempt.request.structuredContextDigestSha256,
    inputEvidenceDigestSha256: attempt.request.inputEvidenceDigestSha256,
    runtimeSource: result.runtimeSource,
    adapterId: result.model.adapterId,
    adapterVersion: result.model.adapterVersion,
    providerId: result.model.providerId,
    modelId: result.model.modelId,
    modelRevision: result.model.modelRevision,
    modelAggregateSha256: result.model.modelAggregateSha256,
    modelRoutingPolicyVersion: result.model.modelRoutingPolicyVersion,
    reasoningInstructionDigestSha256: result.model.reasoningInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    usageMode: result.usage.mode,
    approvedUsageEstimateId: result.usage.approvedUsageEstimateId,
    internalCostBudgetId: result.usage.internalCostBudgetId,
    immutableRateCardSnapshotId: result.usage.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: result.usage.maximumAuthorizedInternalCostMicros,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    missingEvidenceKinds: [...result.candidate.missingEvidenceKinds],
    limitations: [...result.candidate.limitations],
    candidateRequiresUserReview: result.candidate.requiresUserReview,
    candidateResultValidated: true,
    deterministicQaRequired: true,
    approvalAuthorityGranted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableStringify(value))}`
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function safeId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function moneyMicros(value: unknown): value is string {
  return typeof value === 'string' && /^(?:0|[1-9][0-9]{0,15})$/.test(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function safeText(value: unknown, max: number): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= max
    && !/https?:\/\/|file:\/\/|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i.test(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
