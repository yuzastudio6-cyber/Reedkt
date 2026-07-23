import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import type { MotionStudioSpeechC2PostResponseEvidenceV1 } from './post-response'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const MICROS_PER_SECOND = 1_000_000n
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)
const MAX_AUTHORITY_WINDOW_MS = 15 * 60_000
const trustedRateSnapshots = new WeakMap<object, string>()
const trustedAuthorities = new WeakMap<object, string>()
const trustedEvidence = new WeakMap<object, MotionStudioSpeechLocalComputeEvidenceClass>()

export type MotionStudioSpeechLocalComputeEvidenceClass =
  | 'private_local_fixture'
  | 'infrastructure_metered'

/**
 * Current production-promotion truth for speech normalization cost evidence.
 *
 * The shared private media runtime now admits the exact dependent Storytelling
 * Speech normalization work item and emits source-verified cgroup-v2 CPU and
 * memory evidence for its fixed FFmpeg container. The canonical coordinator
 * binds that evidence to the exact package, work item, lease, dispatch,
 * attempt, output manifest, QA, reconciliation and immutable cost record.
 * Current proof remains private injected and non-promotable: a released
 * provider-backed receipt, eligible account/Zero Retention, genuine production
 * continuity and final selection are still required before provider promotion.
 */
export const MOTION_STUDIO_SPEECH_OBSERVED_RESOURCE_METER_READINESS = Object.freeze({
  schemaVersion: 'motion-studio.speech-observed-resource-meter-readiness.v2' as const,
  state: 'canonical_speech_normalization_admitted_private_injected_proof_only' as const,
  canonicalOperationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
  canonicalProfileId: 'approved_storytelling_speech_take_normalization_v1' as const,
  canonicalSharedRuntimeRequired: true as const,
  motionStudioOnlyMeterAllowed: false as const,
  provisionalAllocationCostTrackingAllowed: true as const,
  provisionalAllocationSatisfiesProductionPromotion: false as const,
  observedContainerCpuTimeAvailable: true as const,
  observedPeakMemoryAvailable: true as const,
  observedGpuUsageAvailable: false as const,
  containerStatisticsDigestAvailable: true as const,
  canonicalGenericFfmpegAttemptBindingAvailable: true as const,
  speechCanonicalWorkItemAdmissionAvailable: true as const,
  sourceVerifiedProviderOutputBridgeAvailable: true as const,
  privateArtifactQaAndReconciliationAvailable: true as const,
  acceptedEvidenceClass: 'private_injected_nonprovider_test' as const,
  providerBackedObservedCostPromotionAvailable: false as const,
  releasedRuntimeReceiptAvailable: false as const,
  invoiceReconciliationAvailable: false as const,
  blockedActionScope: Object.freeze([
    'provider_speech_c3_production_promotion',
    'provider_speech_selection_and_mix',
  ] as const),
  allowedForwardProgressScopes: Object.freeze([
    'private_fixture_protocol_qa',
    'provider_usage_cost_reconciliation',
    'human_listening_review',
    'canonical_attempt_binding_and_cost_projection',
    'canonical_storytelling_speech_output_admission',
    'canonical_storytelling_speech_dependent_normalization',
  ] as const),
  immutable: true as const,
})

export interface MotionStudioSpeechLocalComputeRateCardSnapshotV1 {
  schemaVersion: 'motion-studio.speech-local-compute-rate-card.v1'
  snapshotId: string
  toolId: 'ffmpeg'
  operationId: 'tool.ffmpeg.normalize_storytelling_speech_take.v1'
  currency: 'USD'
  unit: 'cpu_second'
  unitPriceUsdMicrosPerCpuSecond: number
  minimumChargeUsdMicros: number
  roundingRule: 'ceil_cpu_microsecond_usd_micro'
  sourceEvidenceClass: 'reeditpro_internal_cost_policy' | 'infrastructure_contract'
  sourceEvidenceId: string
  sourceEvidenceDigest: string
  effectiveFrom: string
  effectiveTo?: string
  verifiedAt: string
  serviceFeeIncluded: false
  customerPricingIncluded: false
  customerCreditsIncluded: false
  immutable: true
  snapshotDigest: string
}

export interface MotionStudioSpeechLocalComputeCostAuthorityV1 {
  schemaVersion: 'motion-studio.speech-local-compute-cost-authority.v1'
  authorityId: string
  executionAuthorityDigest: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  jobId: string
  attemptId: string
  costBudgetId: string
  planReviewApprovalEvidenceId: string
  creditEstimateApprovalEvidenceId: string
  costCeilingApprovalEvidenceId: string
  normalizationApprovalEvidenceId: string
  rateCardSnapshotId: string
  rateCardSnapshotDigest: string
  maximumAuthorizedLocalComputeCostMicros: number
  maximumAuthorizedTotalInternalCostMicros: number
  providerCostCeilingMicros: number
  customerPricingIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  billingMutationAllowed: false
  issuedAt: string
  expiresAt: string
  authorityDigest: string
  immutable: true
}

export interface MotionStudioSpeechLocalComputeCostEvidenceV1 {
  schemaVersion: 'motion-studio.speech-local-compute-cost-evidence.v1'
  evidenceClass: MotionStudioSpeechLocalComputeEvidenceClass
  executionAuthorityDigest: string
  localComputeCostAuthorityDigest: string
  candidateTakeId: string
  postResponseEvidenceDigest: string
  normalizedAudioSha256: string
  normalizationAttestationDigest: string
  runtimeIdentityDigest: string
  costBudgetId: string
  creditEstimateApprovalEvidenceId: string
  rateCardSnapshotId: string
  rateCardSnapshotDigest: string
  localComputeUsageEvidenceId: string
  localComputeUsageEvidenceDigest: string
  infrastructureMeterEvidenceDigest: string
  meteredCpuMicroseconds: number
  quantityCpuSeconds: number
  currency: 'USD'
  localComputeCostMicros: number
  maximumAuthorizedLocalComputeCostMicros: number
  maximumAuthorizedTotalInternalCostMicros: number
  roundingRule: 'ceil_cpu_microsecond_usd_micro'
  serviceFeeIncluded: false
  customerPricingIncluded: false
  customerCreditsIncluded: false
  billingMutationPerformed: false
  measuredAt: string
  evidenceDigest: string
  immutable: true
}

export function createMotionStudioSpeechLocalComputeRateCardSnapshot(input: {
  snapshotId: string
  unitPriceUsdMicrosPerCpuSecond: number
  minimumChargeUsdMicros: number
  sourceEvidenceClass: MotionStudioSpeechLocalComputeRateCardSnapshotV1['sourceEvidenceClass']
  sourceEvidenceId: string
  sourceEvidenceDigest: string
  effectiveFrom: string
  effectiveTo?: string
  verifiedAt: string
}): MotionStudioSpeechLocalComputeRateCardSnapshotV1 {
  for (const value of [input.snapshotId, input.sourceEvidenceId]) {
    if (!STABLE_ID.test(value)) invalid('Speech local-compute rate card contains an invalid stable reference.')
  }
  if (!['reeditpro_internal_cost_policy', 'infrastructure_contract'].includes(input.sourceEvidenceClass)) {
    invalid('Speech local-compute rate card requires internal policy or infrastructure-contract evidence.')
  }
  if (!SHA256.test(input.sourceEvidenceDigest)) invalid('Speech local-compute rate-card source digest is malformed.')
  if (
    !Number.isSafeInteger(input.unitPriceUsdMicrosPerCpuSecond) ||
    input.unitPriceUsdMicrosPerCpuSecond < 1 || input.unitPriceUsdMicrosPerCpuSecond > 10_000_000 ||
    !Number.isSafeInteger(input.minimumChargeUsdMicros) ||
    input.minimumChargeUsdMicros < 0 || input.minimumChargeUsdMicros > 10_000_000
  ) invalid('Speech local-compute rate-card amounts are invalid.')
  const effectiveFrom = exactIso(input.effectiveFrom, 'local-compute rate-card effective time')
  const effectiveTo = input.effectiveTo
    ? exactIso(input.effectiveTo, 'local-compute rate-card expiry time')
    : undefined
  const verifiedAt = exactIso(input.verifiedAt, 'local-compute rate-card verification time')
  if (Date.parse(verifiedAt) < Date.parse(effectiveFrom) ||
    (effectiveTo && Date.parse(effectiveTo) <= Date.parse(effectiveFrom))) {
    invalid('Speech local-compute rate-card validity window is invalid.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-local-compute-rate-card.v1' as const,
    snapshotId: input.snapshotId,
    toolId: 'ffmpeg' as const,
    operationId: 'tool.ffmpeg.normalize_storytelling_speech_take.v1' as const,
    currency: 'USD' as const,
    unit: 'cpu_second' as const,
    unitPriceUsdMicrosPerCpuSecond: input.unitPriceUsdMicrosPerCpuSecond,
    minimumChargeUsdMicros: input.minimumChargeUsdMicros,
    roundingRule: 'ceil_cpu_microsecond_usd_micro' as const,
    sourceEvidenceClass: input.sourceEvidenceClass,
    sourceEvidenceId: input.sourceEvidenceId,
    sourceEvidenceDigest: input.sourceEvidenceDigest,
    effectiveFrom,
    ...(effectiveTo ? { effectiveTo } : {}),
    verifiedAt,
    serviceFeeIncluded: false as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    immutable: true as const,
  }
  const snapshot = deepFreeze({ ...base, snapshotDigest: sha256CanonicalJson(base) })
  trustedRateSnapshots.set(snapshot, snapshot.snapshotDigest)
  return snapshot
}

export function createMotionStudioSpeechLocalComputeCostAuthority(input: {
  authorityId: string
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  rateCardSnapshot: MotionStudioSpeechLocalComputeRateCardSnapshotV1
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechLocalComputeCostAuthorityV1 {
  const execution = input.executionAuthority
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(execution)
  if (!STABLE_ID.test(input.authorityId)) {
    invalid('Speech local-compute cost authority contains an invalid stable reference.')
  }
  const rate = assertRateCardSnapshot(input.rateCardSnapshot, input.issuedAt)
  const issuedAt = exactIso(input.issuedAt, 'local-compute authority issue time')
  const expiresAt = exactIso(input.expiresAt, 'local-compute authority expiry time')
  const window = Date.parse(expiresAt) - Date.parse(issuedAt)
  if (window <= 0 || window > MAX_AUTHORITY_WINDOW_MS ||
    Date.parse(issuedAt) < Date.parse(execution.issuedAt) ||
    Date.parse(expiresAt) > Date.parse(execution.expiresAt)) {
    blocked('Speech local-compute cost authority must stay inside the exact execution-authority window.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-local-compute-cost-authority.v1' as const,
    authorityId: input.authorityId,
    executionAuthorityDigest: execution.authorityDigest,
    workspaceId: execution.workspaceId,
    projectId: execution.projectId,
    editSessionId: execution.editSessionId,
    productionId: execution.productionId,
    approvedSnapshotId: execution.approvedSnapshotId,
    approvedSnapshotDigest: execution.approvedSnapshotDigest,
    jobId: execution.jobId,
    attemptId: execution.attemptId,
    costBudgetId: execution.costBudgetId,
    planReviewApprovalEvidenceId: execution.planReviewApprovalEvidenceId,
    creditEstimateApprovalEvidenceId: execution.creditEstimateApprovalEvidenceId,
    costCeilingApprovalEvidenceId: execution.preflightGateEvidence.exact_rate_card_and_cost_ceiling,
    normalizationApprovalEvidenceId: execution.preflightGateEvidence.private_ingest_and_normalization,
    rateCardSnapshotId: rate.snapshotId,
    rateCardSnapshotDigest: rate.snapshotDigest,
    maximumAuthorizedLocalComputeCostMicros: execution.maximumAuthorizedLocalComputeCostMicros,
    maximumAuthorizedTotalInternalCostMicros: execution.maximumAuthorizedTotalInternalCostMicros,
    providerCostCeilingMicros: execution.maximumAuthorizedProviderCostMicros,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
    billingMutationAllowed: false as const,
    issuedAt,
    expiresAt,
    immutable: true as const,
  }
  const authority = deepFreeze({ ...base, authorityDigest: sha256CanonicalJson(base) })
  trustedAuthorities.set(authority, authority.authorityDigest)
  return authority
}

export function createMotionStudioSpeechLocalComputeCostEvidence(input: {
  postResponseEvidence: MotionStudioSpeechC2PostResponseEvidenceV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  localComputeCostAuthority: MotionStudioSpeechLocalComputeCostAuthorityV1
  rateCardSnapshot: MotionStudioSpeechLocalComputeRateCardSnapshotV1
  localComputeUsageEvidenceId: string
  infrastructureMeterEvidenceDigest: string
  meteredCpuMicroseconds: number
  measuredAt: string
}): MotionStudioSpeechLocalComputeCostEvidenceV1 {
  const execution = input.executionAuthority
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(execution)
  const authority = assertLocalComputeAuthority(input.localComputeCostAuthority, execution, input.measuredAt)
  const rate = assertRateCardSnapshot(input.rateCardSnapshot, input.measuredAt)
  const post = input.postResponseEvidence
  assertPostResponseEvidence(post, execution)
  if (post.evidenceClass === 'provider_single_submission_private_evidence') {
    blocked(
      'Provider speech local-compute promotion requires canonical attempt-bound worker-resource cost evidence; runtime-level cgroup evidence alone cannot promote the provider attempt.',
    )
  }
  if (rate.snapshotId !== authority.rateCardSnapshotId || rate.snapshotDigest !== authority.rateCardSnapshotDigest) {
    blocked('Speech local-compute usage does not use the exact authorized rate-card snapshot.')
  }
  if (!STABLE_ID.test(input.localComputeUsageEvidenceId) || !SHA256.test(input.infrastructureMeterEvidenceDigest)) {
    invalid('Speech local-compute usage evidence reference is malformed.')
  }
  if (!Number.isSafeInteger(input.meteredCpuMicroseconds) ||
    input.meteredCpuMicroseconds < 1 || input.meteredCpuMicroseconds > 500_000_000) {
    invalid('Speech local-compute CPU measurement is outside the bounded five-hundred-second window.')
  }
  const calculated = safeNumber(ceilDiv(
    BigInt(input.meteredCpuMicroseconds) * BigInt(rate.unitPriceUsdMicrosPerCpuSecond),
    MICROS_PER_SECOND,
  ), 'speech local-compute internal cost')
  const localComputeCostMicros = Math.max(rate.minimumChargeUsdMicros, calculated)
  if (localComputeCostMicros > authority.maximumAuthorizedLocalComputeCostMicros) {
    blocked('Speech local-compute usage exceeds the exact authorized internal-cost ceiling.')
  }
  const measuredAt = exactIso(input.measuredAt, 'local-compute measurement time')
  if (Date.parse(measuredAt) < Date.parse(post.createdAt)) {
    invalid('Speech local-compute measurement cannot predate post-response evidence.')
  }
  const localComputeUsageEvidenceDigest = sha256CanonicalJson({
    domain: 'motion_studio_speech_local_compute_usage_v1',
    executionAuthorityDigest: execution.authorityDigest,
    candidateTakeId: post.candidateTakeId,
    postResponseEvidenceDigest: post.evidenceDigest,
    localComputeUsageEvidenceId: input.localComputeUsageEvidenceId,
    infrastructureMeterEvidenceDigest: input.infrastructureMeterEvidenceDigest,
    meteredCpuMicroseconds: input.meteredCpuMicroseconds,
    measuredAt,
  })
  const evidenceClass = 'private_local_fixture' as const
  const base = {
    schemaVersion: 'motion-studio.speech-local-compute-cost-evidence.v1' as const,
    evidenceClass,
    executionAuthorityDigest: execution.authorityDigest,
    localComputeCostAuthorityDigest: authority.authorityDigest,
    candidateTakeId: post.candidateTakeId,
    postResponseEvidenceDigest: post.evidenceDigest,
    normalizedAudioSha256: post.normalizedArtifact.sha256,
    normalizationAttestationDigest: post.normalizedArtifact.normalizationAttestationDigest,
    runtimeIdentityDigest: post.normalizedArtifact.runtimeImageIdentityDigest,
    costBudgetId: execution.costBudgetId,
    creditEstimateApprovalEvidenceId: authority.creditEstimateApprovalEvidenceId,
    rateCardSnapshotId: rate.snapshotId,
    rateCardSnapshotDigest: rate.snapshotDigest,
    localComputeUsageEvidenceId: input.localComputeUsageEvidenceId,
    localComputeUsageEvidenceDigest,
    infrastructureMeterEvidenceDigest: input.infrastructureMeterEvidenceDigest,
    meteredCpuMicroseconds: input.meteredCpuMicroseconds,
    quantityCpuSeconds: input.meteredCpuMicroseconds / 1_000_000,
    currency: 'USD' as const,
    localComputeCostMicros,
    maximumAuthorizedLocalComputeCostMicros: authority.maximumAuthorizedLocalComputeCostMicros,
    maximumAuthorizedTotalInternalCostMicros: authority.maximumAuthorizedTotalInternalCostMicros,
    roundingRule: 'ceil_cpu_microsecond_usd_micro' as const,
    serviceFeeIncluded: false as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    billingMutationPerformed: false as const,
    measuredAt,
    immutable: true as const,
  }
  const evidence = deepFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
  trustedEvidence.set(evidence, evidenceClass)
  return evidence
}

export function assertMotionStudioSpeechLocalComputeCostEvidence(input: {
  evidence: MotionStudioSpeechLocalComputeCostEvidenceV1
  postResponseEvidence: MotionStudioSpeechC2PostResponseEvidenceV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
}): MotionStudioSpeechLocalComputeCostEvidenceV1 {
  if (input.postResponseEvidence.evidenceClass === 'provider_single_submission_private_evidence') {
    blocked(
      'Provider speech local-compute promotion requires canonical attempt-bound worker-resource cost evidence; legacy Motion evidence cannot satisfy this gate.',
    )
  }
  const evidenceClass = trustedEvidence.get(input.evidence)
  if (!evidenceClass || evidenceClass !== input.evidence.evidenceClass) {
    blocked('Speech local-compute cost requires trusted in-process derivation evidence.')
  }
  const expectedEvidenceClass = 'private_local_fixture' as const
  const { evidenceDigest, ...base } = input.evidence
  if (!SHA256.test(evidenceDigest) || sha256CanonicalJson(base) !== evidenceDigest) {
    blocked('Speech local-compute cost evidence failed its immutable digest.')
  }
  if (
    input.evidence.evidenceClass !== expectedEvidenceClass ||
    input.evidence.executionAuthorityDigest !== input.executionAuthority.authorityDigest ||
    input.evidence.candidateTakeId !== input.postResponseEvidence.candidateTakeId ||
    input.evidence.postResponseEvidenceDigest !== input.postResponseEvidence.evidenceDigest ||
    input.evidence.normalizedAudioSha256 !== input.postResponseEvidence.normalizedArtifact.sha256 ||
    input.evidence.normalizationAttestationDigest !==
      input.postResponseEvidence.normalizedArtifact.normalizationAttestationDigest ||
    input.evidence.runtimeIdentityDigest !==
      input.postResponseEvidence.normalizedArtifact.runtimeImageIdentityDigest ||
    input.evidence.costBudgetId !== input.executionAuthority.costBudgetId ||
    input.evidence.creditEstimateApprovalEvidenceId !==
      input.executionAuthority.creditEstimateApprovalEvidenceId ||
    !STABLE_ID.test(input.evidence.rateCardSnapshotId) ||
    !STABLE_ID.test(input.evidence.localComputeUsageEvidenceId) ||
    input.evidence.localComputeUsageEvidenceDigest !== sha256CanonicalJson({
      domain: 'motion_studio_speech_local_compute_usage_v1',
      executionAuthorityDigest: input.executionAuthority.authorityDigest,
      candidateTakeId: input.postResponseEvidence.candidateTakeId,
      postResponseEvidenceDigest: input.postResponseEvidence.evidenceDigest,
      localComputeUsageEvidenceId: input.evidence.localComputeUsageEvidenceId,
      infrastructureMeterEvidenceDigest: input.evidence.infrastructureMeterEvidenceDigest,
      meteredCpuMicroseconds: input.evidence.meteredCpuMicroseconds,
      measuredAt: input.evidence.measuredAt,
    }) ||
    !SHA256.test(input.evidence.localComputeUsageEvidenceDigest) ||
    !SHA256.test(input.evidence.infrastructureMeterEvidenceDigest) ||
    !SHA256.test(input.evidence.localComputeCostAuthorityDigest) ||
    !SHA256.test(input.evidence.rateCardSnapshotDigest) ||
    !Number.isSafeInteger(input.evidence.meteredCpuMicroseconds) ||
    input.evidence.meteredCpuMicroseconds < 1 ||
    input.evidence.quantityCpuSeconds !== input.evidence.meteredCpuMicroseconds / 1_000_000 ||
    !Number.isSafeInteger(input.evidence.localComputeCostMicros) ||
    input.evidence.localComputeCostMicros < 0 ||
    !Number.isSafeInteger(input.evidence.maximumAuthorizedLocalComputeCostMicros) ||
    input.evidence.maximumAuthorizedLocalComputeCostMicros < 1 ||
    input.evidence.localComputeCostMicros > input.evidence.maximumAuthorizedLocalComputeCostMicros ||
    !Number.isSafeInteger(input.evidence.maximumAuthorizedTotalInternalCostMicros) ||
    input.evidence.maximumAuthorizedTotalInternalCostMicros !==
      input.executionAuthority.maximumAuthorizedProviderCostMicros +
      input.evidence.maximumAuthorizedLocalComputeCostMicros ||
    input.evidence.serviceFeeIncluded !== false || input.evidence.customerPricingIncluded !== false ||
    input.evidence.customerCreditsIncluded !== false || input.evidence.billingMutationPerformed !== false ||
    input.evidence.roundingRule !== 'ceil_cpu_microsecond_usd_micro' ||
    input.evidence.immutable !== true || !Object.isFrozen(input.evidence)
  ) blocked('Speech local-compute cost evidence does not bind its exact authorized usage.')
  return input.evidence
}

function assertLocalComputeAuthority(
  authority: MotionStudioSpeechLocalComputeCostAuthorityV1,
  execution: MotionStudioSpeechC2ExecutionAuthorityV1,
  at: string,
): MotionStudioSpeechLocalComputeCostAuthorityV1 {
  if (trustedAuthorities.get(authority) !== authority.authorityDigest) {
    blocked('Speech local-compute cost requires the exact in-process immutable authority.')
  }
  const { authorityDigest, ...base } = authority
  const measuredAt = Date.parse(exactIso(at, 'local-compute authority use time'))
  if (
    !SHA256.test(authorityDigest) || sha256CanonicalJson(base) !== authorityDigest ||
    authority.executionAuthorityDigest !== execution.authorityDigest || authority.jobId !== execution.jobId ||
    authority.attemptId !== execution.attemptId || authority.costBudgetId !== execution.costBudgetId ||
    authority.approvedSnapshotId !== execution.approvedSnapshotId ||
    authority.approvedSnapshotDigest !== execution.approvedSnapshotDigest ||
    authority.planReviewApprovalEvidenceId !== execution.planReviewApprovalEvidenceId ||
    authority.creditEstimateApprovalEvidenceId !== execution.creditEstimateApprovalEvidenceId ||
    authority.costCeilingApprovalEvidenceId !==
      execution.preflightGateEvidence.exact_rate_card_and_cost_ceiling ||
    authority.normalizationApprovalEvidenceId !==
      execution.preflightGateEvidence.private_ingest_and_normalization ||
    authority.providerCostCeilingMicros !== execution.maximumAuthorizedProviderCostMicros ||
    authority.maximumAuthorizedLocalComputeCostMicros !==
      execution.maximumAuthorizedLocalComputeCostMicros ||
    authority.maximumAuthorizedTotalInternalCostMicros !==
      execution.maximumAuthorizedTotalInternalCostMicros ||
    authority.maximumAuthorizedTotalInternalCostMicros !==
      authority.providerCostCeilingMicros + authority.maximumAuthorizedLocalComputeCostMicros ||
    measuredAt < Date.parse(authority.issuedAt) || measuredAt > Date.parse(authority.expiresAt) ||
    authority.customerPricingIncluded !== false || authority.customerCreditsIncluded !== false ||
    authority.serviceFeeIncluded !== false || authority.billingMutationAllowed !== false ||
    authority.immutable !== true
  ) blocked('Speech local-compute cost authority does not bind the exact execution attempt and budget.')
  return authority
}

function assertRateCardSnapshot(
  snapshot: MotionStudioSpeechLocalComputeRateCardSnapshotV1,
  at: string,
): MotionStudioSpeechLocalComputeRateCardSnapshotV1 {
  if (trustedRateSnapshots.get(snapshot) !== snapshot.snapshotDigest) {
    blocked('Speech local-compute cost requires the exact in-process immutable rate-card snapshot.')
  }
  const { snapshotDigest, ...base } = snapshot
  const measuredAt = Date.parse(exactIso(at, 'local-compute rate-card use time'))
  if (
    !SHA256.test(snapshotDigest) || sha256CanonicalJson(base) !== snapshotDigest ||
    snapshot.toolId !== 'ffmpeg' ||
    snapshot.operationId !== 'tool.ffmpeg.normalize_storytelling_speech_take.v1' ||
    snapshot.currency !== 'USD' || snapshot.unit !== 'cpu_second' ||
    snapshot.roundingRule !== 'ceil_cpu_microsecond_usd_micro' ||
    measuredAt < Date.parse(snapshot.effectiveFrom) || measuredAt < Date.parse(snapshot.verifiedAt) ||
    (snapshot.effectiveTo !== undefined && measuredAt >= Date.parse(snapshot.effectiveTo)) ||
    snapshot.serviceFeeIncluded !== false || snapshot.customerPricingIncluded !== false ||
    snapshot.customerCreditsIncluded !== false || snapshot.immutable !== true
  ) blocked('Speech local-compute rate-card snapshot is not current exact internal-cost authority.')
  return snapshot
}

function assertPostResponseEvidence(
  evidence: MotionStudioSpeechC2PostResponseEvidenceV1,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
): void {
  const { evidenceDigest, ...base } = evidence
  if (
    !SHA256.test(evidenceDigest) || sha256CanonicalJson(base) !== evidenceDigest ||
    evidence.executionAuthorityDigest !== authority.authorityDigest ||
    evidence.costBudgetId !== authority.costBudgetId || evidence.selection.selected !== false ||
    evidence.persistence.normalizedAudioPersisted !== true ||
    !SHA256.test(evidence.normalizedArtifact.sha256) ||
    !SHA256.test(evidence.normalizedArtifact.normalizationAttestationDigest) ||
    !SHA256.test(evidence.normalizedArtifact.runtimeImageIdentityDigest)
  ) blocked('Speech local-compute cost requires exact immutable normalized-audio evidence.')
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n || denominator <= 0n) invalid('Speech local-compute cost ratio is invalid.')
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator
}

function safeNumber(value: bigint, label: string): number {
  if (value < 0n || value > MAX_SAFE_BIGINT) invalid(`${label} exceeds the safe integer bound.`)
  return Number(value)
}

function exactIso(value: string, label: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    invalid(`Speech ${label} is invalid.`)
  }
  return value
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
    requiredGate: 'motion_studio_speech_local_compute_cost_reconciliation',
  })
}
