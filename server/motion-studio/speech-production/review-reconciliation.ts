import { ApiError } from '../../errors/api-error'
import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC2ExecutionAuthority,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import {
  readMotionStudioSpeechC2PostResponseEvidence,
  type MotionStudioSpeechC2PostResponseEvidenceV1,
} from './post-response'
import {
  assertMotionStudioSpeechProviderCostReconciliationEvidence,
  type MotionStudioSpeechProviderCostReconciliationEvidenceV1,
} from './provider-cost-reconciliation'
import {
  assertMotionStudioSpeechLocalComputeCostEvidence,
  type MotionStudioSpeechLocalComputeCostEvidenceV1,
} from './local-compute-cost-reconciliation'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const REVIEW_GATES = Object.freeze([
  'meaning_fidelity',
  'pronunciation',
  'voice_continuity',
  'loudness',
] as const)

export type MotionStudioSpeechC3ListeningGate = typeof REVIEW_GATES[number]
export type MotionStudioSpeechC3ReviewClass =
  | 'private_local_fixture_review'
  | 'owner_private_provider_review'

export interface MotionStudioSpeechC3ReviewRequestV1 {
  schemaVersion: 'motion-studio.speech-c3-review-request.v1'
  reviewClass: MotionStudioSpeechC3ReviewClass
  candidateTakeId: string
  postResponseEvidenceDigest: string
  reviewedSpokenTextDigest: string
  reviewerActorId: string
  decision: 'pass_for_selection_review' | 'reject_take'
  results: readonly {
    gate: MotionStudioSpeechC3ListeningGate
    result: 'passed' | 'failed'
    evidenceId: string
    note: string
  }[]
  reviewedAt: string
}

export interface MotionStudioSpeechC3CostReconciliationInputV1 {
  schemaVersion: 'motion-studio.speech-c3-cost-reconciliation-input.v1'
  method: 'private_local_fixture_zero_cost' | 'account_usage_delta'
  candidateTakeId: string
  postResponseEvidenceDigest: string
  costBudgetId: string
  accountUsageBaselineEvidenceId: string
  accountUsageCompletionEvidenceId: string
  providerRateCardSnapshotId: string
  providerUsageEvidenceId: string
  localComputeUsageEvidenceId: string
  currency: 'USD'
  providerCallCount: 0 | 1
  providerCostMicros: number
  localComputeCostMicros: number
  totalInternalProductionCostMicros: number
  maximumAuthorizedProviderCostMicros: number
  customerPricingIncluded: false
  customerCreditsIncluded: false
  billingMutationPerformed: false
  reconciledAt: string
}

export interface MotionStudioSpeechC3ReviewReconciliationV1 {
  schemaVersion: 'motion-studio.speech-c3-review-reconciliation.v1'
  evidenceClass: MotionStudioSpeechC2PostResponseEvidenceV1['evidenceClass']
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  candidateTakeId: string
  speechRequestId: string
  attemptId: string
  costBudgetId: string
  postResponseEvidenceDigest: string
  normalizedAudioSha256: string
  alignmentDigest: string
  executionAuthorityDigest: string
  cost: {
    state: 'reconciled_fixture_zero_cost' | 'reconciled_provider_account_delta'
    method: MotionStudioSpeechC3CostReconciliationInputV1['method']
    accountUsageBaselineEvidenceId: string
    accountUsageCompletionEvidenceId: string
    providerRateCardSnapshotId: string
    providerUsageEvidenceId: string
    localComputeUsageEvidenceId: string
    currency: 'USD'
    providerCallCount: 0 | 1
    providerCostMicros: number
    providerRateCardSnapshotDigest: string | null
    providerUsageEvidenceDigest: string | null
    providerCharacterCostMicrocredits: number
    accountUsageDeltaMicrocredits: number
    roundingRule: 'fixture_zero_cost' | 'ceil_usd_micro'
    localComputeCostAuthorityDigest: string | null
    localComputeRateCardSnapshotId: string | null
    localComputeRateCardSnapshotDigest: string | null
    localComputeUsageEvidenceDigest: string | null
    infrastructureMeterEvidenceDigest: string | null
    localComputeCostEvidenceDigest: string | null
    meteredCpuMicroseconds: number
    localComputeRoundingRule: 'fixture_zero_cost' | 'ceil_cpu_microsecond_usd_micro'
    localComputeCostMicros: number
    totalInternalProductionCostMicros: number
    maximumAuthorizedProviderCostMicros: number
    maximumAuthorizedLocalComputeCostMicros: number
    maximumAuthorizedTotalInternalCostMicros: number
    customerPricingIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    billingMutationPerformed: false
    reconciledAt: string
    costEvidenceDigest: string
  }
  review: {
    reviewClass: MotionStudioSpeechC3ReviewClass
    reviewerActorId: string
    decision: MotionStudioSpeechC3ReviewRequestV1['decision']
    reviewedSpokenTextDigest: string
    results: MotionStudioSpeechC3ReviewRequestV1['results']
    reviewedAt: string
    reviewDigest: string
    ownerReviewRecorded: boolean
    fixtureReviewRecorded: boolean
  }
  state:
    | 'fixture_reviewed_ineligible'
    | 'provider_reviewed_rejected'
    | 'provider_review_complete_awaiting_ms012e_selection'
  selection: {
    eligibleForExplicitSelection: boolean
    selectionDecisionCreated: false
    selected: false
    firstTakeAutoAccepted: false
    finalNarrationMutationPerformed: false
    timelineMutationPerformed: false
    finalAssetEligible: false
  }
  readiness: {
    privateReviewEvidenceReady: true
    c3ProviderEvidenceComplete: boolean
    ms012eSelectionRequired: boolean
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalDeliveryReady: false
  }
  persistence: {
    privateLocalOnly: true
    reviewObjectIdentityHash: string
    postResponseEvidenceObjectIdentityHash: string
    normalizedAudioObjectIdentityHash: string
  }
  createdAt: string
  immutable: true
  recordDigest: string
}

export async function reconcileMotionStudioSpeechC3Review(input: {
  localStorageRoot: string
  postResponseEvidenceObjectIdentityHash: string
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  review: MotionStudioSpeechC3ReviewRequestV1
  cost: MotionStudioSpeechC3CostReconciliationInputV1
  providerCostEvidence?: MotionStudioSpeechProviderCostReconciliationEvidenceV1
  localComputeCostEvidence?: MotionStudioSpeechLocalComputeCostEvidenceV1
}): Promise<MotionStudioSpeechC3ReviewReconciliationV1> {
  if (!SHA256.test(input.postResponseEvidenceObjectIdentityHash)) {
    invalid('Speech C3 post-response evidence identity is invalid.')
  }
  const evidence = await readMotionStudioSpeechC2PostResponseEvidence({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash: input.postResponseEvidenceObjectIdentityHash,
  })
  if (!evidence) blocked('Speech C3 requires exact persisted post-response evidence.')
  const authority = assertMotionStudioSpeechC2ExecutionAuthority(
    input.executionAuthority,
    input.request,
    input.capabilitySnapshot,
  )
  const record = compileMotionStudioSpeechC3ReviewReconciliation({
    evidence,
    request: input.request,
    capabilitySnapshot: input.capabilitySnapshot,
    executionAuthority: authority,
    review: input.review,
    cost: input.cost,
    providerCostEvidence: input.providerCostEvidence,
    localComputeCostEvidence: input.localComputeCostEvidence,
  })
  await persistReviewRecord(input.localStorageRoot, record)
  const stored = await readMotionStudioSpeechC3ReviewReconciliation({
    localStorageRoot: input.localStorageRoot,
    reviewObjectIdentityHash: record.persistence.reviewObjectIdentityHash,
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    productionId: record.productionId,
  })
  if (!stored || stored.recordDigest !== record.recordDigest) {
    blocked('Speech C3 private review evidence changed during create-only persistence.')
  }
  return stored
}

export function compileMotionStudioSpeechC3ReviewReconciliation(input: {
  evidence: MotionStudioSpeechC2PostResponseEvidenceV1
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  review: MotionStudioSpeechC3ReviewRequestV1
  cost: MotionStudioSpeechC3CostReconciliationInputV1
  providerCostEvidence?: MotionStudioSpeechProviderCostReconciliationEvidenceV1
  localComputeCostEvidence?: MotionStudioSpeechLocalComputeCostEvidenceV1
}): MotionStudioSpeechC3ReviewReconciliationV1 {
  const authority = assertMotionStudioSpeechC2ExecutionAuthority(
    input.executionAuthority,
    input.request,
    input.capabilitySnapshot,
  )
  assertEvidenceAuthority(input.evidence, authority)
  const review = validateReview(input.review, input.evidence)
  const validatedCost = validateCost(
    input.cost,
    input.evidence,
    authority,
    input.providerCostEvidence,
    input.localComputeCostEvidence,
  )
  const cost = validatedCost.cost
  const providerEvidence = input.evidence.evidenceClass === 'provider_single_submission_private_evidence'
  const passed = review.results.every((result) => result.result === 'passed')
  const state = !providerEvidence
    ? 'fixture_reviewed_ineligible' as const
    : review.decision === 'reject_take'
      ? 'provider_reviewed_rejected' as const
      : 'provider_review_complete_awaiting_ms012e_selection' as const
  const eligibleForExplicitSelection = providerEvidence && passed &&
    review.decision === 'pass_for_selection_review'
  const ownerReviewRecorded = review.reviewClass === 'owner_private_provider_review'
  const fixtureReviewRecorded = review.reviewClass === 'private_local_fixture_review'
  const reviewBase = {
    reviewClass: review.reviewClass,
    reviewerActorId: review.reviewerActorId,
    decision: review.decision,
    reviewedSpokenTextDigest: review.reviewedSpokenTextDigest,
    results: review.results,
    reviewedAt: review.reviewedAt,
    ownerReviewRecorded,
    fixtureReviewRecorded,
  }
  const reviewDigest = sha256CanonicalJson(reviewBase)
  const costBase = {
    state: cost.method === 'account_usage_delta'
      ? 'reconciled_provider_account_delta' as const
      : 'reconciled_fixture_zero_cost' as const,
    method: cost.method,
    accountUsageBaselineEvidenceId: cost.accountUsageBaselineEvidenceId,
    accountUsageCompletionEvidenceId: cost.accountUsageCompletionEvidenceId,
    providerRateCardSnapshotId: cost.providerRateCardSnapshotId,
    providerUsageEvidenceId: cost.providerUsageEvidenceId,
    localComputeUsageEvidenceId: cost.localComputeUsageEvidenceId,
    currency: cost.currency,
    providerCallCount: cost.providerCallCount,
    providerCostMicros: cost.providerCostMicros,
    providerRateCardSnapshotDigest: validatedCost.provider?.providerRateCardSnapshotDigest ?? null,
    providerUsageEvidenceDigest: validatedCost.provider?.providerUsageEvidenceDigest ?? null,
    providerCharacterCostMicrocredits: validatedCost.provider?.providerCharacterCostMicrocredits ?? 0,
    accountUsageDeltaMicrocredits: validatedCost.provider?.accountUsageDeltaMicrocredits ?? 0,
    roundingRule: validatedCost.provider?.roundingRule ?? 'fixture_zero_cost' as const,
    localComputeCostAuthorityDigest: validatedCost.local?.localComputeCostAuthorityDigest ?? null,
    localComputeRateCardSnapshotId: validatedCost.local?.rateCardSnapshotId ?? null,
    localComputeRateCardSnapshotDigest: validatedCost.local?.rateCardSnapshotDigest ?? null,
    localComputeUsageEvidenceDigest: validatedCost.local?.localComputeUsageEvidenceDigest ?? null,
    infrastructureMeterEvidenceDigest: validatedCost.local?.infrastructureMeterEvidenceDigest ?? null,
    localComputeCostEvidenceDigest: validatedCost.local?.evidenceDigest ?? null,
    meteredCpuMicroseconds: validatedCost.local?.meteredCpuMicroseconds ?? 0,
    localComputeRoundingRule: validatedCost.local?.roundingRule ?? 'fixture_zero_cost' as const,
    localComputeCostMicros: cost.localComputeCostMicros,
    totalInternalProductionCostMicros: cost.totalInternalProductionCostMicros,
    maximumAuthorizedProviderCostMicros: cost.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedLocalComputeCostMicros:
      validatedCost.local?.maximumAuthorizedLocalComputeCostMicros ?? 0,
    maximumAuthorizedTotalInternalCostMicros:
      validatedCost.local?.maximumAuthorizedTotalInternalCostMicros ??
      cost.maximumAuthorizedProviderCostMicros,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
    billingMutationPerformed: false as const,
    reconciledAt: cost.reconciledAt,
  }
  const costEvidenceDigest = sha256CanonicalJson(costBase)
  const reviewObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_speech_c3_review_v1',
    candidateTakeId: input.evidence.candidateTakeId,
    postResponseEvidenceDigest: input.evidence.evidenceDigest,
  })
  const base: Omit<MotionStudioSpeechC3ReviewReconciliationV1, 'recordDigest'> = {
    schemaVersion: 'motion-studio.speech-c3-review-reconciliation.v1',
    evidenceClass: input.evidence.evidenceClass,
    workspaceId: input.evidence.workspaceId,
    projectId: input.evidence.projectId,
    editSessionId: input.evidence.editSessionId,
    productionId: input.evidence.productionId,
    candidateTakeId: input.evidence.candidateTakeId,
    speechRequestId: input.evidence.speechRequestId,
    attemptId: input.evidence.attemptId,
    costBudgetId: input.evidence.costBudgetId,
    postResponseEvidenceDigest: input.evidence.evidenceDigest,
    normalizedAudioSha256: input.evidence.normalizedArtifact.sha256,
    alignmentDigest: input.evidence.alignment.alignmentDigest,
    executionAuthorityDigest: authority.authorityDigest,
    cost: { ...costBase, costEvidenceDigest },
    review: { ...reviewBase, reviewDigest },
    state,
    selection: {
      eligibleForExplicitSelection,
      selectionDecisionCreated: false,
      selected: false,
      firstTakeAutoAccepted: false,
      finalNarrationMutationPerformed: false,
      timelineMutationPerformed: false,
      finalAssetEligible: false,
    },
    readiness: {
      privateReviewEvidenceReady: true,
      c3ProviderEvidenceComplete: providerEvidence,
      ms012eSelectionRequired: eligibleForExplicitSelection,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      finalDeliveryReady: false,
    },
    persistence: {
      privateLocalOnly: true,
      reviewObjectIdentityHash,
      postResponseEvidenceObjectIdentityHash: input.evidence.persistence.evidenceObjectIdentityHash,
      normalizedAudioObjectIdentityHash: input.evidence.normalizedArtifact.privateObjectIdentityHash,
    },
    createdAt: latestIso(review.reviewedAt, cost.reconciledAt),
    immutable: true,
  }
  return deepFreeze({ ...base, recordDigest: sha256CanonicalJson(base) })
}

export async function readMotionStudioSpeechC3ReviewReconciliation(input: {
  localStorageRoot: string
  reviewObjectIdentityHash: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
}): Promise<MotionStudioSpeechC3ReviewReconciliationV1 | undefined> {
  if (!SHA256.test(input.reviewObjectIdentityHash)) invalid('Speech C3 review identity is invalid.')
  const expectedScope = {
    workspaceId: stableId(input.workspaceId, 'Speech C3 workspace ID'),
    projectId: stableId(input.projectId, 'Speech C3 project ID'),
    editSessionId: stableId(input.editSessionId, 'Speech C3 edit session ID'),
    productionId: stableId(input.productionId, 'Speech C3 production ID'),
  }
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: reviewRelativePath(input.reviewObjectIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 256 || bytes.byteLength > 2 * 1024 * 1024) {
    blocked('Speech C3 private review record is outside its bounded size.')
  }
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) } catch {
    blocked('Speech C3 private review record is invalid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    blocked('Speech C3 private review envelope is invalid.')
  }
  const envelope = parsed as Record<string, unknown>
  assertExactKeys(envelope, ['checksumSha256', 'record', 'recordVersion'], 'Speech C3 private review envelope')
  if (
    envelope.recordVersion !== 'motion-studio-speech-c3-review-record-v1' ||
    typeof envelope.checksumSha256 !== 'string' || !SHA256.test(envelope.checksumSha256) ||
    !envelope.record || typeof envelope.record !== 'object' || Array.isArray(envelope.record)
  ) blocked('Speech C3 private review envelope fields are invalid.')
  const record = assertPersistedRecordShape(envelope.record)
  const { recordDigest, ...base } = record
  if (
    record.schemaVersion !== 'motion-studio.speech-c3-review-reconciliation.v1' ||
    record.immutable !== true || recordDigest !== envelope.checksumSha256 ||
    sha256CanonicalJson(base) !== recordDigest ||
    record.persistence?.reviewObjectIdentityHash !== input.reviewObjectIdentityHash ||
    record.persistence.privateLocalOnly !== true ||
    record.selection?.selectionDecisionCreated !== false || record.selection.selected !== false ||
    record.selection.firstTakeAutoAccepted !== false ||
    record.selection.finalNarrationMutationPerformed !== false ||
    record.selection.timelineMutationPerformed !== false ||
    record.selection.finalAssetEligible !== false || record.readiness?.productReady !== false
  ) blocked('Speech C3 private review failed its immutable and no-selection boundary.')
  if (
    record.workspaceId !== expectedScope.workspaceId || record.projectId !== expectedScope.projectId ||
    record.editSessionId !== expectedScope.editSessionId || record.productionId !== expectedScope.productionId
  ) blocked('Speech C3 private review belongs to a different tenant or production scope.')
  const postResponse = await readMotionStudioSpeechC2PostResponseEvidence({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash: record.persistence.postResponseEvidenceObjectIdentityHash,
  })
  if (
    !postResponse || postResponse.evidenceDigest !== record.postResponseEvidenceDigest ||
    postResponse.candidateTakeId !== record.candidateTakeId ||
    postResponse.normalizedArtifact.sha256 !== record.normalizedAudioSha256 ||
    postResponse.alignment.alignmentDigest !== record.alignmentDigest
  ) blocked('Speech C3 private review lost its exact post-response and audio authority.')
  if (
    record.createdAt !== latestIso(record.review.reviewedAt, record.cost.reconciledAt) ||
    Date.parse(record.review.reviewedAt) < Date.parse(postResponse.createdAt) ||
    Date.parse(record.cost.reconciledAt) < Date.parse(postResponse.createdAt)
  ) blocked('Speech C3 private review chronology does not follow its exact post-response evidence.')
  validatePersistedRecord(record)
  return deepFreeze(record)
}

export function assertMotionStudioSpeechC3ReviewReconciliationRecord(
  input: MotionStudioSpeechC3ReviewReconciliationV1,
): MotionStudioSpeechC3ReviewReconciliationV1 {
  const record = assertPersistedRecordShape(input)
  const { recordDigest, ...base } = record
  if (
    record.schemaVersion !== 'motion-studio.speech-c3-review-reconciliation.v1' ||
    record.immutable !== true || !SHA256.test(recordDigest) ||
    sha256CanonicalJson(base) !== recordDigest ||
    record.persistence?.privateLocalOnly !== true ||
    record.selection?.selectionDecisionCreated !== false || record.selection.selected !== false ||
    record.selection.firstTakeAutoAccepted !== false ||
    record.selection.finalNarrationMutationPerformed !== false ||
    record.selection.timelineMutationPerformed !== false ||
    record.selection.finalAssetEligible !== false || record.readiness?.productReady !== false
  ) blocked('Speech C3 review failed its immutable and no-selection boundary.')
  validatePersistedRecord(record)
  return deepFreeze(record)
}

function validateReview(
  review: MotionStudioSpeechC3ReviewRequestV1,
  evidence: MotionStudioSpeechC2PostResponseEvidenceV1,
): MotionStudioSpeechC3ReviewRequestV1 {
  assertExactKeys(review as unknown as Record<string, unknown>, [
    'candidateTakeId', 'decision', 'postResponseEvidenceDigest', 'results',
    'reviewClass', 'reviewedAt', 'reviewedSpokenTextDigest', 'reviewerActorId', 'schemaVersion',
  ], 'Speech C3 review request')
  if (review.schemaVersion !== 'motion-studio.speech-c3-review-request.v1') invalid('Speech C3 review schema is invalid.')
  if (!['private_local_fixture_review', 'owner_private_provider_review'].includes(review.reviewClass)) {
    invalid('Speech C3 review class is invalid.')
  }
  if (review.candidateTakeId !== evidence.candidateTakeId || review.postResponseEvidenceDigest !== evidence.evidenceDigest) {
    blocked('Speech C3 review does not bind the exact candidate and post-response evidence.')
  }
  if (!SHA256.test(review.reviewedSpokenTextDigest) || review.reviewedSpokenTextDigest !== evidence.alignment.spokenTextDigest) {
    blocked('Speech C3 meaning review does not bind the exact approved spoken text.')
  }
  stableId(review.reviewerActorId, 'Speech C3 reviewer actor ID')
  exactIso(review.reviewedAt, 'Speech C3 review time')
  if (Date.parse(review.reviewedAt) < Date.parse(evidence.createdAt)) {
    invalid('Speech C3 review cannot predate its exact post-response evidence.')
  }
  if (!['pass_for_selection_review', 'reject_take'].includes(review.decision)) invalid('Speech C3 review decision is invalid.')
  if (!Array.isArray(review.results) || review.results.length !== REVIEW_GATES.length) {
    invalid('Speech C3 review requires every exact listening gate.')
  }
  review.results.forEach((result, index) => {
    assertExactKeys(result as unknown as Record<string, unknown>, ['evidenceId', 'gate', 'note', 'result'], `Speech C3 review result ${index}`)
    if (result.gate !== REVIEW_GATES[index]) invalid('Speech C3 listening gates must be exact, distinct, and ordered.')
    if (!['passed', 'failed'].includes(result.result)) invalid('Speech C3 listening gate result is invalid.')
    stableId(result.evidenceId, 'Speech C3 listening evidence ID')
    safeNote(result.note)
  })
  const allPassed = review.results.every((result) => result.result === 'passed')
  if (review.decision === 'pass_for_selection_review' && !allPassed) {
    invalid('A Speech C3 pass decision requires every listening gate to pass.')
  }
  if (review.decision === 'reject_take' && allPassed) {
    invalid('A Speech C3 rejection requires at least one failed listening gate.')
  }
  if (
    evidence.evidenceClass === 'private_local_transport_fixture' &&
    review.reviewClass !== 'private_local_fixture_review'
  ) blocked('Fixture speech evidence cannot receive an owner provider review.')
  if (
    evidence.evidenceClass === 'provider_single_submission_private_evidence' &&
    review.reviewClass !== 'owner_private_provider_review'
  ) blocked('Provider speech evidence requires an explicit owner private review.')
  return review
}

function validateCost(
  cost: MotionStudioSpeechC3CostReconciliationInputV1,
  evidence: MotionStudioSpeechC2PostResponseEvidenceV1,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
  providerCostEvidence?: MotionStudioSpeechProviderCostReconciliationEvidenceV1,
  localComputeCostEvidence?: MotionStudioSpeechLocalComputeCostEvidenceV1,
): {
  cost: MotionStudioSpeechC3CostReconciliationInputV1
  provider?: MotionStudioSpeechProviderCostReconciliationEvidenceV1
  local?: MotionStudioSpeechLocalComputeCostEvidenceV1
} {
  assertExactKeys(cost as unknown as Record<string, unknown>, [
    'accountUsageBaselineEvidenceId', 'accountUsageCompletionEvidenceId', 'billingMutationPerformed',
    'candidateTakeId', 'costBudgetId', 'currency', 'customerCreditsIncluded',
    'customerPricingIncluded', 'localComputeCostMicros', 'localComputeUsageEvidenceId',
    'maximumAuthorizedProviderCostMicros', 'method', 'postResponseEvidenceDigest',
    'providerCallCount', 'providerCostMicros', 'providerRateCardSnapshotId',
    'providerUsageEvidenceId', 'reconciledAt', 'schemaVersion', 'totalInternalProductionCostMicros',
  ], 'Speech C3 cost reconciliation')
  if (cost.schemaVersion !== 'motion-studio.speech-c3-cost-reconciliation-input.v1') {
    invalid('Speech C3 cost reconciliation schema is invalid.')
  }
  if (
    cost.candidateTakeId !== evidence.candidateTakeId ||
    cost.postResponseEvidenceDigest !== evidence.evidenceDigest ||
    cost.costBudgetId !== evidence.costBudgetId
  ) blocked('Speech C3 cost evidence does not bind the exact candidate and cost budget.')
  ;[
    cost.accountUsageBaselineEvidenceId, cost.accountUsageCompletionEvidenceId,
    cost.providerRateCardSnapshotId, cost.providerUsageEvidenceId, cost.localComputeUsageEvidenceId,
  ].forEach((value) => stableId(value, 'Speech C3 cost evidence ID'))
  if (
    cost.accountUsageBaselineEvidenceId !== authority.accountUsageBaselineEvidenceId ||
    cost.providerRateCardSnapshotId !== authority.providerRateCardSnapshotId ||
    cost.maximumAuthorizedProviderCostMicros !== authority.maximumAuthorizedProviderCostMicros
  ) blocked('Speech C3 cost evidence changed the exact authority baseline, rate card, or ceiling.')
  if (cost.accountUsageCompletionEvidenceId === cost.accountUsageBaselineEvidenceId) {
    invalid('Speech C3 account usage completion evidence must differ from its baseline.')
  }
  if (cost.currency !== 'USD') invalid('Speech C3 cost currency must be USD.')
  for (const amount of [cost.providerCostMicros, cost.localComputeCostMicros, cost.totalInternalProductionCostMicros]) {
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 10_000_000) invalid('Speech C3 cost amount is invalid.')
  }
  if (
    !Number.isSafeInteger(cost.maximumAuthorizedProviderCostMicros) ||
    cost.providerCostMicros > cost.maximumAuthorizedProviderCostMicros ||
    cost.totalInternalProductionCostMicros !== cost.providerCostMicros + cost.localComputeCostMicros
  ) blocked('Speech C3 cost reconciliation exceeds authority or does not conserve exact cost.')
  if (
    cost.customerPricingIncluded !== false || cost.customerCreditsIncluded !== false ||
    cost.billingMutationPerformed !== false
  ) blocked('Speech C3 cost evidence cannot contain customer-commercial authority.')
  exactIso(cost.reconciledAt, 'Speech C3 cost reconciliation time')
  if (Date.parse(cost.reconciledAt) < Date.parse(evidence.createdAt)) {
    invalid('Speech C3 cost reconciliation cannot predate its exact post-response evidence.')
  }
  if (evidence.evidenceClass === 'private_local_transport_fixture') {
    if (
      cost.method !== 'private_local_fixture_zero_cost' || cost.providerCallCount !== 0 ||
      cost.providerCostMicros !== 0 || cost.localComputeCostMicros !== 0 ||
      cost.totalInternalProductionCostMicros !== 0 || evidence.externalProviderCallCount !== 0 ||
      providerCostEvidence !== undefined || localComputeCostEvidence !== undefined
    ) blocked('Fixture speech evidence must remain zero-cost and non-provider.')
    return { cost }
  } else {
    if (
      cost.method !== 'account_usage_delta' || cost.providerCallCount !== 1 ||
      evidence.externalProviderCallCount !== 1 || !providerCostEvidence || !localComputeCostEvidence
    ) blocked('Provider speech evidence requires exact provider and local-compute reconciliation evidence.')
    const provider = assertMotionStudioSpeechProviderCostReconciliationEvidence({
      evidence: providerCostEvidence,
      postResponseEvidence: evidence,
      executionAuthority: authority,
    })
    const local = assertMotionStudioSpeechLocalComputeCostEvidence({
      evidence: localComputeCostEvidence,
      postResponseEvidence: evidence,
      executionAuthority: authority,
    })
    if (
      cost.accountUsageBaselineEvidenceId !== provider.accountUsageBaselineEvidenceId ||
      cost.accountUsageCompletionEvidenceId !== provider.accountUsageCompletionEvidenceId ||
      cost.providerRateCardSnapshotId !== provider.providerRateCardSnapshotId ||
      cost.providerUsageEvidenceId !== provider.providerUsageEvidenceId ||
      cost.providerCostMicros !== provider.providerCostMicros ||
      cost.maximumAuthorizedProviderCostMicros !== provider.maximumAuthorizedProviderCostMicros ||
      cost.localComputeUsageEvidenceId !== local.localComputeUsageEvidenceId ||
      cost.localComputeCostMicros !== local.localComputeCostMicros ||
      cost.totalInternalProductionCostMicros !== provider.providerCostMicros + local.localComputeCostMicros ||
      Date.parse(cost.reconciledAt) < Date.parse(provider.reconciledAt) ||
      Date.parse(cost.reconciledAt) < Date.parse(local.measuredAt)
    ) blocked('Speech C3 provider cost fields do not match exact derived usage and rate-card evidence.')
    return { cost, provider, local }
  }
}

function assertEvidenceAuthority(
  evidence: MotionStudioSpeechC2PostResponseEvidenceV1,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
): void {
  if (
    evidence.workspaceId !== authority.workspaceId || evidence.projectId !== authority.projectId ||
    evidence.editSessionId !== authority.editSessionId || evidence.productionId !== authority.productionId ||
    evidence.speechRequestId !== authority.speechRequestId || evidence.requestDigest !== authority.speechRequestDigest ||
    evidence.approvedSnapshotId !== authority.approvedSnapshotId ||
    evidence.approvedSnapshotDigest !== authority.approvedSnapshotDigest ||
    evidence.approvedWorkItemId !== authority.approvedWorkItemId || evidence.jobId !== authority.jobId ||
    evidence.attemptId !== authority.attemptId || evidence.leaseId !== authority.leaseId ||
    evidence.costBudgetId !== authority.costBudgetId ||
    evidence.executionAuthorityId !== authority.authorityId ||
    evidence.executionAuthorityDigest !== authority.authorityDigest
  ) blocked('Speech C3 evidence does not bind the exact execution authority.')
}

function validatePersistedRecord(record: MotionStudioSpeechC3ReviewReconciliationV1): void {
  for (const [value, label] of [
    [record.workspaceId, 'workspace ID'], [record.projectId, 'project ID'],
    [record.editSessionId, 'edit session ID'], [record.productionId, 'production ID'],
    [record.candidateTakeId, 'candidate take ID'], [record.speechRequestId, 'speech request ID'],
    [record.attemptId, 'attempt ID'], [record.costBudgetId, 'cost budget ID'],
    [record.review.reviewerActorId, 'reviewer actor ID'],
    [record.cost.accountUsageBaselineEvidenceId, 'usage baseline evidence ID'],
    [record.cost.accountUsageCompletionEvidenceId, 'usage completion evidence ID'],
    [record.cost.providerRateCardSnapshotId, 'provider rate-card evidence ID'],
    [record.cost.providerUsageEvidenceId, 'provider usage evidence ID'],
    [record.cost.localComputeUsageEvidenceId, 'local compute evidence ID'],
  ] as const) stableId(value, `Speech C3 persisted ${label}`)
  for (const digest of [
    record.postResponseEvidenceDigest, record.normalizedAudioSha256, record.alignmentDigest,
    record.executionAuthorityDigest, record.cost.costEvidenceDigest, record.review.reviewDigest,
    record.review.reviewedSpokenTextDigest, record.persistence.reviewObjectIdentityHash,
    record.persistence.postResponseEvidenceObjectIdentityHash,
    record.persistence.normalizedAudioObjectIdentityHash, record.recordDigest,
  ]) if (!SHA256.test(digest)) blocked('Speech C3 persisted review contains an invalid digest.')
  exactIso(record.createdAt, 'Speech C3 persisted creation time')
  exactIso(record.review.reviewedAt, 'Speech C3 persisted review time')
  exactIso(record.cost.reconciledAt, 'Speech C3 persisted cost reconciliation time')
  if (
    !SHA256.test(record.cost.costEvidenceDigest) ||
    !SHA256.test(record.review.reviewDigest) ||
    record.cost.customerPricingIncluded !== false || record.cost.customerCreditsIncluded !== false ||
    record.cost.serviceFeeIncluded !== false ||
    record.cost.billingMutationPerformed !== false ||
    record.readiness.privateReviewEvidenceReady !== true ||
    record.readiness.externalBetaReady !== false || record.readiness.productionReady !== false ||
    record.readiness.finalDeliveryReady !== false
  ) blocked('Speech C3 persisted review contains invalid readiness or commercial state.')
  const { costEvidenceDigest, ...costBase } = record.cost
  const { reviewDigest, ...reviewBase } = record.review
  if (sha256CanonicalJson(costBase) !== costEvidenceDigest || sha256CanonicalJson(reviewBase) !== reviewDigest) {
    blocked('Speech C3 persisted review sub-evidence failed digest verification.')
  }
  if (
    record.evidenceClass === 'private_local_transport_fixture' &&
    (record.state !== 'fixture_reviewed_ineligible' || record.readiness.c3ProviderEvidenceComplete ||
      record.selection.eligibleForExplicitSelection || record.review.ownerReviewRecorded)
  ) blocked('Speech C3 fixture evidence was incorrectly promoted.')
  const providerEvidence = record.evidenceClass === 'provider_single_submission_private_evidence'
  if (!providerEvidence && record.evidenceClass !== 'private_local_transport_fixture') {
    blocked('Speech C3 persisted review contains an unknown evidence class.')
  }
  if (
    record.review.ownerReviewRecorded !== (record.review.reviewClass === 'owner_private_provider_review') ||
    record.review.fixtureReviewRecorded !== (record.review.reviewClass === 'private_local_fixture_review') ||
    providerEvidence !== record.review.ownerReviewRecorded ||
    record.readiness.c3ProviderEvidenceComplete !== providerEvidence
  ) blocked('Speech C3 persisted review class does not match its evidence class.')
  const allPassed = record.review.results.every((result, index) => {
    if (
      result.gate !== REVIEW_GATES[index] || !['passed', 'failed'].includes(result.result)
    ) blocked('Speech C3 persisted listening gates are invalid or out of order.')
    stableId(result.evidenceId, 'Speech C3 persisted listening evidence ID')
    safeNote(result.note)
    return result.result === 'passed'
  })
  if (
    (record.review.decision === 'pass_for_selection_review' && !allPassed) ||
    (record.review.decision === 'reject_take' && allPassed) ||
    !['pass_for_selection_review', 'reject_take'].includes(record.review.decision)
  ) blocked('Speech C3 persisted review decision does not match its listening gates.')
  for (const amount of [
    record.cost.providerCostMicros, record.cost.localComputeCostMicros,
    record.cost.totalInternalProductionCostMicros, record.cost.maximumAuthorizedProviderCostMicros,
    record.cost.maximumAuthorizedLocalComputeCostMicros,
    record.cost.maximumAuthorizedTotalInternalCostMicros,
  ]) {
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 10_000_000) {
      blocked('Speech C3 persisted review contains an invalid internal cost amount.')
    }
  }
  if (
    !Number.isSafeInteger(record.cost.meteredCpuMicroseconds) ||
    record.cost.meteredCpuMicroseconds < 0 || record.cost.meteredCpuMicroseconds > 500_000_000
  ) blocked('Speech C3 persisted review contains an invalid local-compute CPU measurement.')
  if (
    record.cost.currency !== 'USD' ||
    record.cost.totalInternalProductionCostMicros !==
      record.cost.providerCostMicros + record.cost.localComputeCostMicros ||
    record.cost.providerCostMicros > record.cost.maximumAuthorizedProviderCostMicros ||
    record.cost.localComputeCostMicros > record.cost.maximumAuthorizedLocalComputeCostMicros ||
    record.cost.maximumAuthorizedTotalInternalCostMicros !==
      record.cost.maximumAuthorizedProviderCostMicros +
      record.cost.maximumAuthorizedLocalComputeCostMicros ||
    record.cost.totalInternalProductionCostMicros >
      record.cost.maximumAuthorizedTotalInternalCostMicros ||
    record.cost.maximumAuthorizedProviderCostMicros < 1 ||
    record.cost.maximumAuthorizedProviderCostMicros > 250_000 ||
    record.cost.maximumAuthorizedLocalComputeCostMicros > 250_000 ||
    record.cost.maximumAuthorizedTotalInternalCostMicros > 250_000 ||
    record.cost.accountUsageCompletionEvidenceId === record.cost.accountUsageBaselineEvidenceId
  ) blocked('Speech C3 persisted review cost does not conserve exact authorized usage.')
  if (providerEvidence) {
    if (
      record.cost.method !== 'account_usage_delta' ||
      record.cost.state !== 'reconciled_provider_account_delta' || record.cost.providerCallCount !== 1 ||
      record.state === 'fixture_reviewed_ineligible' ||
      !record.cost.providerRateCardSnapshotDigest || !SHA256.test(record.cost.providerRateCardSnapshotDigest) ||
      !record.cost.providerUsageEvidenceDigest || !SHA256.test(record.cost.providerUsageEvidenceDigest) ||
      !record.cost.localComputeCostAuthorityDigest ||
      !SHA256.test(record.cost.localComputeCostAuthorityDigest) ||
      !record.cost.localComputeRateCardSnapshotId ||
      !STABLE_ID.test(record.cost.localComputeRateCardSnapshotId) ||
      !record.cost.localComputeRateCardSnapshotDigest ||
      !SHA256.test(record.cost.localComputeRateCardSnapshotDigest) ||
      !record.cost.localComputeUsageEvidenceDigest ||
      !SHA256.test(record.cost.localComputeUsageEvidenceDigest) ||
      !record.cost.infrastructureMeterEvidenceDigest ||
      !SHA256.test(record.cost.infrastructureMeterEvidenceDigest) ||
      !record.cost.localComputeCostEvidenceDigest ||
      !SHA256.test(record.cost.localComputeCostEvidenceDigest) ||
      record.cost.meteredCpuMicroseconds < 1 ||
      record.cost.maximumAuthorizedLocalComputeCostMicros < 1 ||
      record.cost.localComputeRoundingRule !== 'ceil_cpu_microsecond_usd_micro' ||
      record.cost.providerCharacterCostMicrocredits < 1 ||
      record.cost.accountUsageDeltaMicrocredits !== record.cost.providerCharacterCostMicrocredits ||
      record.cost.roundingRule !== 'ceil_usd_micro'
    ) blocked('Speech C3 persisted provider evidence has invalid cost or review state.')
  } else if (
    record.cost.method !== 'private_local_fixture_zero_cost' ||
    record.cost.state !== 'reconciled_fixture_zero_cost' || record.cost.providerCallCount !== 0 ||
    record.cost.providerCostMicros !== 0 || record.state !== 'fixture_reviewed_ineligible' ||
    record.cost.providerRateCardSnapshotDigest !== null || record.cost.providerUsageEvidenceDigest !== null ||
    record.cost.localComputeCostAuthorityDigest !== null ||
    record.cost.localComputeRateCardSnapshotId !== null ||
    record.cost.localComputeRateCardSnapshotDigest !== null ||
    record.cost.localComputeUsageEvidenceDigest !== null ||
    record.cost.infrastructureMeterEvidenceDigest !== null ||
    record.cost.localComputeCostEvidenceDigest !== null ||
    record.cost.meteredCpuMicroseconds !== 0 || record.cost.localComputeCostMicros !== 0 ||
    record.cost.maximumAuthorizedLocalComputeCostMicros !== 0 ||
    record.cost.maximumAuthorizedTotalInternalCostMicros !==
      record.cost.maximumAuthorizedProviderCostMicros ||
    record.cost.localComputeRoundingRule !== 'fixture_zero_cost' ||
    record.cost.providerCharacterCostMicrocredits !== 0 || record.cost.accountUsageDeltaMicrocredits !== 0 ||
    record.cost.roundingRule !== 'fixture_zero_cost'
  ) blocked('Speech C3 persisted fixture evidence has invalid cost or review state.')
  if (
    providerEvidence && record.state !== (
      record.review.decision === 'reject_take'
        ? 'provider_reviewed_rejected'
        : 'provider_review_complete_awaiting_ms012e_selection'
    )
  ) blocked('Speech C3 persisted provider review state does not match its decision.')
  if (
    record.selection.eligibleForExplicitSelection !==
      (providerEvidence && allPassed && record.review.decision === 'pass_for_selection_review' &&
        record.state === 'provider_review_complete_awaiting_ms012e_selection') ||
    record.readiness.ms012eSelectionRequired !== record.selection.eligibleForExplicitSelection
  ) blocked('Speech C3 selection eligibility does not match exact review state.')
}

function assertPersistedRecordShape(value: unknown): MotionStudioSpeechC3ReviewReconciliationV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('Speech C3 private review record shape is invalid.')
  }
  const record = value as MotionStudioSpeechC3ReviewReconciliationV1
  assertExactKeys(record as unknown as Record<string, unknown>, [
    'alignmentDigest', 'attemptId', 'candidateTakeId', 'cost', 'costBudgetId', 'createdAt',
    'editSessionId', 'evidenceClass', 'executionAuthorityDigest', 'immutable',
    'normalizedAudioSha256', 'persistence', 'productionId', 'projectId', 'readiness',
    'recordDigest', 'review', 'schemaVersion', 'selection', 'speechRequestId', 'state',
    'workspaceId', 'postResponseEvidenceDigest',
  ], 'Speech C3 private review record')
  for (const [label, nested] of [
    ['cost', record.cost], ['review', record.review], ['selection', record.selection],
    ['readiness', record.readiness], ['persistence', record.persistence],
  ] as const) {
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      blocked(`Speech C3 private review ${label} shape is invalid.`)
    }
  }
  assertExactKeys(record.cost as unknown as Record<string, unknown>, [
    'accountUsageDeltaMicrocredits',
    'accountUsageBaselineEvidenceId', 'accountUsageCompletionEvidenceId', 'billingMutationPerformed',
    'costEvidenceDigest', 'currency', 'customerCreditsIncluded', 'customerPricingIncluded',
    'infrastructureMeterEvidenceDigest', 'localComputeCostAuthorityDigest',
    'localComputeCostEvidenceDigest', 'localComputeCostMicros', 'localComputeRateCardSnapshotDigest',
    'localComputeRateCardSnapshotId', 'localComputeRoundingRule', 'localComputeUsageEvidenceDigest',
    'localComputeUsageEvidenceId', 'maximumAuthorizedLocalComputeCostMicros',
    'maximumAuthorizedProviderCostMicros', 'maximumAuthorizedTotalInternalCostMicros',
    'meteredCpuMicroseconds',
    'method', 'providerCallCount', 'providerCharacterCostMicrocredits', 'providerCostMicros',
    'providerRateCardSnapshotDigest', 'providerRateCardSnapshotId', 'providerUsageEvidenceDigest',
    'providerUsageEvidenceId', 'reconciledAt', 'roundingRule', 'serviceFeeIncluded', 'state',
    'totalInternalProductionCostMicros',
  ], 'Speech C3 private review cost')
  assertExactKeys(record.review as unknown as Record<string, unknown>, [
    'decision', 'fixtureReviewRecorded', 'ownerReviewRecorded', 'results', 'reviewClass',
    'reviewDigest', 'reviewedAt', 'reviewedSpokenTextDigest', 'reviewerActorId',
  ], 'Speech C3 private review decision')
  assertExactKeys(record.selection as unknown as Record<string, unknown>, [
    'eligibleForExplicitSelection', 'finalAssetEligible', 'finalNarrationMutationPerformed',
    'firstTakeAutoAccepted', 'selected', 'selectionDecisionCreated', 'timelineMutationPerformed',
  ], 'Speech C3 private review selection')
  assertExactKeys(record.readiness as unknown as Record<string, unknown>, [
    'c3ProviderEvidenceComplete', 'externalBetaReady', 'finalDeliveryReady',
    'ms012eSelectionRequired', 'privateReviewEvidenceReady', 'productReady', 'productionReady',
  ], 'Speech C3 private review readiness')
  assertExactKeys(record.persistence as unknown as Record<string, unknown>, [
    'normalizedAudioObjectIdentityHash', 'postResponseEvidenceObjectIdentityHash',
    'privateLocalOnly', 'reviewObjectIdentityHash',
  ], 'Speech C3 private review persistence')
  if (!Array.isArray(record.review.results) || record.review.results.length !== REVIEW_GATES.length) {
    blocked('Speech C3 private review listening results are invalid.')
  }
  record.review.results.forEach((result, index) => {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      blocked('Speech C3 private review listening result shape is invalid.')
    }
    assertExactKeys(result as unknown as Record<string, unknown>, [
      'evidenceId', 'gate', 'note', 'result',
    ], `Speech C3 private review listening result ${index}`)
  })
  return record
}

async function persistReviewRecord(root: string, record: MotionStudioSpeechC3ReviewReconciliationV1): Promise<void> {
  const bytes = Buffer.from(`${JSON.stringify({
    recordVersion: 'motion-studio-speech-c3-review-record-v1',
    record,
    checksumSha256: record.recordDigest,
  })}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: root,
    relativePath: reviewRelativePath(record.persistence.reviewObjectIdentityHash),
    content: bytes,
  })
}

function reviewRelativePath(identity: string): string {
  return `motion-studio-speech-c3/private-v1/${identity.slice(0, 2)}/${identity}.json`
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    invalid(`${label} contains missing or unknown fields.`)
  }
}

function stableId(value: string, label: string): string {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) invalid(`${label} is invalid.`)
  return value
}

function safeNote(value: string): string {
  if (
    typeof value !== 'string' || value.length < 4 || value.length > 500 ||
    [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
    /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/i.test(value)
  ) invalid('Speech C3 review note is unsafe or outside its bounded size.')
  return value
}

function exactIso(value: string, label: string): string {
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) invalid(`${label} is invalid.`)
  return value
}

function latestIso(left: string, right: string): string {
  return Date.parse(left) >= Date.parse(right) ? left : right
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(deepFreeze)
  else Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_speech_c3_review_reconciliation',
  })
}
