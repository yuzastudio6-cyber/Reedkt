import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  getMotionStudioSpeechAccountUsageCompletionEvidenceClass,
  type MotionStudioSpeechAccountUsageCompletionEvidenceV1,
} from './account-usage-completion'
import type { MotionStudioSpeechC2ExecutionAuthorityV1 } from './live-authority'
import type { MotionStudioSpeechC2PostResponseEvidenceV1 } from './post-response'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)
const trustedRateSnapshots = new WeakMap<object, string>()
const trustedCostEvidence = new WeakMap<object, MotionStudioSpeechProviderCostEvidenceClass>()

export type MotionStudioSpeechProviderCostEvidenceClass =
  | 'private_local_fixture'
  | 'authenticated_provider_account_evidence'

export interface MotionStudioSpeechProviderCreditRateCardSnapshotV1 {
  schemaVersion: 'motion-studio.speech-provider-credit-rate-card.v1'
  snapshotId: string
  provider: 'elevenlabs'
  providerAdapterId: 'motion_studio_elevenlabs_timing_v1'
  modelId: 'eleven_v3'
  currency: 'USD'
  billingCostBasisUsdMicros: number
  providerCreditCostBasisMicrocredits: number
  roundingRule: 'ceil_usd_micro'
  sourceEvidenceClass: 'provider_invoice' | 'authenticated_account_contract'
  sourceEvidenceId: string
  sourceEvidenceDigest: string
  effectiveFrom: string
  effectiveTo?: string
  exactAccountAllocation: true
  publicListPriceOnly: false
  serviceFeeIncluded: false
  customerPricingIncluded: false
  customerCreditsIncluded: false
  verifiedAt: string
  immutable: true
  snapshotDigest: string
}

export interface MotionStudioSpeechProviderCostReconciliationEvidenceV1 {
  schemaVersion: 'motion-studio.speech-provider-cost-reconciliation.v1'
  evidenceClass: MotionStudioSpeechProviderCostEvidenceClass
  candidateTakeId: string
  postResponseEvidenceDigest: string
  executionAuthorityDigest: string
  providerRateCardSnapshotId: string
  providerRateCardSnapshotDigest: string
  providerUsageEvidenceId: string
  providerUsageEvidenceDigest: string
  accountUsageBaselineEvidenceId: string
  accountUsageCompletionEvidenceId: string
  providerCharacterCostMicrocredits: number
  accountUsageDeltaMicrocredits: number
  currency: 'USD'
  providerCostMicros: number
  maximumAuthorizedProviderCostMicros: number
  roundingRule: 'ceil_usd_micro'
  customerPricingIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  billingMutationPerformed: false
  reconciledAt: string
  evidenceDigest: string
  immutable: true
}

export function createMotionStudioSpeechProviderCreditRateCardSnapshot(input: {
  snapshotId: string
  billingCostBasisUsdMicros: number
  providerCreditCostBasisMicrocredits: number
  sourceEvidenceClass: MotionStudioSpeechProviderCreditRateCardSnapshotV1['sourceEvidenceClass']
  sourceEvidenceId: string
  sourceEvidenceDigest: string
  effectiveFrom: string
  effectiveTo?: string
  verifiedAt: string
}): MotionStudioSpeechProviderCreditRateCardSnapshotV1 {
  if (!['provider_invoice', 'authenticated_account_contract'].includes(input.sourceEvidenceClass)) {
    invalid('Speech provider rate card requires exact account invoice or contract evidence.')
  }
  for (const value of [input.snapshotId, input.sourceEvidenceId]) {
    if (!STABLE_ID.test(value)) invalid('Speech provider rate card contains an invalid stable reference.')
  }
  if (!SHA256.test(input.sourceEvidenceDigest)) invalid('Speech provider rate-card source digest is malformed.')
  if (
    !Number.isSafeInteger(input.billingCostBasisUsdMicros) || input.billingCostBasisUsdMicros < 1 ||
    input.billingCostBasisUsdMicros > 100_000_000_000
  ) invalid('Speech provider rate-card USD cost basis is invalid.')
  if (
    !Number.isSafeInteger(input.providerCreditCostBasisMicrocredits) ||
    input.providerCreditCostBasisMicrocredits < 1 ||
    input.providerCreditCostBasisMicrocredits > 9_000_000_000_000_000
  ) invalid('Speech provider rate-card credit basis is invalid.')
  const effectiveFrom = exactIso(input.effectiveFrom, 'provider rate-card effective time')
  const effectiveTo = input.effectiveTo
    ? exactIso(input.effectiveTo, 'provider rate-card expiry time')
    : undefined
  const verifiedAt = exactIso(input.verifiedAt, 'provider rate-card verification time')
  if (effectiveTo && Date.parse(effectiveTo) <= Date.parse(effectiveFrom)) {
    invalid('Speech provider rate-card validity window is invalid.')
  }
  if (Date.parse(verifiedAt) < Date.parse(effectiveFrom)) {
    invalid('Speech provider rate-card verification cannot predate its effective time.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-provider-credit-rate-card.v1' as const,
    snapshotId: input.snapshotId,
    provider: 'elevenlabs' as const,
    providerAdapterId: 'motion_studio_elevenlabs_timing_v1' as const,
    modelId: 'eleven_v3' as const,
    currency: 'USD' as const,
    billingCostBasisUsdMicros: input.billingCostBasisUsdMicros,
    providerCreditCostBasisMicrocredits: input.providerCreditCostBasisMicrocredits,
    roundingRule: 'ceil_usd_micro' as const,
    sourceEvidenceClass: input.sourceEvidenceClass,
    sourceEvidenceId: input.sourceEvidenceId,
    sourceEvidenceDigest: input.sourceEvidenceDigest,
    effectiveFrom,
    ...(effectiveTo ? { effectiveTo } : {}),
    exactAccountAllocation: true as const,
    publicListPriceOnly: false as const,
    serviceFeeIncluded: false as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    verifiedAt,
    immutable: true as const,
  }
  const snapshot = deepFreeze({ ...base, snapshotDigest: sha256CanonicalJson(base) })
  trustedRateSnapshots.set(snapshot, snapshot.snapshotDigest)
  return snapshot
}

export function createMotionStudioSpeechProviderCostReconciliationEvidence(input: {
  postResponseEvidence: MotionStudioSpeechC2PostResponseEvidenceV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  accountUsageCompletionEvidence: MotionStudioSpeechAccountUsageCompletionEvidenceV1
  rateCardSnapshot: MotionStudioSpeechProviderCreditRateCardSnapshotV1
  providerUsageEvidenceId: string
  reconciledAt: string
}): MotionStudioSpeechProviderCostReconciliationEvidenceV1 {
  const post = input.postResponseEvidence
  const authority = input.executionAuthority
  const completion = input.accountUsageCompletionEvidence
  const rate = assertRateCardSnapshot(input.rateCardSnapshot, input.reconciledAt)
  const completionClass = getMotionStudioSpeechAccountUsageCompletionEvidenceClass(completion)
  if (!STABLE_ID.test(input.providerUsageEvidenceId)) invalid('Speech provider usage evidence ID is malformed.')
  assertPostResponseEvidence(post, authority)
  assertCompletionEvidence(completion, post, authority)
  const evidenceClass = post.evidenceClass === 'provider_single_submission_private_evidence'
    ? 'authenticated_provider_account_evidence' as const
    : 'private_local_fixture' as const
  if (
    (evidenceClass === 'authenticated_provider_account_evidence' &&
      completionClass !== 'authenticated_provider_read_only') ||
    (evidenceClass === 'private_local_fixture' && completionClass !== 'private_local_fixture')
  ) blocked('Speech provider cost evidence cannot cross fixture and authenticated provenance classes.')
  if (rate.snapshotId !== authority.providerRateCardSnapshotId) {
    blocked('Speech provider cost evidence does not use the exact authorized rate-card snapshot.')
  }
  const providerCharacterCostMicrocredits = post.providerCharacterCostMicrocredits!
  if (providerCharacterCostMicrocredits < 1) {
    blocked('Speech provider cost reconciliation requires positive billed character-cost evidence.')
  }
  if (
    completion.state !== 'exact_provider_usage_reconciled' || !completion.exactUsageMatch ||
    !completion.accountIdentityStable ||
    completion.accountUsageDeltaMicrocredits !== providerCharacterCostMicrocredits
  ) blocked('Speech provider account usage does not exactly reconcile to the response character cost.')
  const providerCostMicros = safeNumber(ceilDiv(
    BigInt(providerCharacterCostMicrocredits) * BigInt(rate.billingCostBasisUsdMicros),
    BigInt(rate.providerCreditCostBasisMicrocredits),
  ), 'speech provider internal cost')
  if (providerCostMicros > authority.maximumAuthorizedProviderCostMicros) {
    blocked('Speech provider cost exceeds the exact authorized internal-cost ceiling.')
  }
  const reconciledAt = exactIso(input.reconciledAt, 'provider cost reconciliation time')
  if (Date.parse(reconciledAt) < Date.parse(completion.capturedAt)) {
    invalid('Speech provider cost reconciliation cannot predate account-usage completion evidence.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-provider-cost-reconciliation.v1' as const,
    evidenceClass,
    candidateTakeId: post.candidateTakeId,
    postResponseEvidenceDigest: post.evidenceDigest,
    executionAuthorityDigest: authority.authorityDigest,
    providerRateCardSnapshotId: rate.snapshotId,
    providerRateCardSnapshotDigest: rate.snapshotDigest,
    providerUsageEvidenceId: input.providerUsageEvidenceId,
    providerUsageEvidenceDigest: completion.evidenceDigest,
    accountUsageBaselineEvidenceId: completion.accountUsageBaselineEvidenceId,
    accountUsageCompletionEvidenceId: completion.accountUsageCompletionEvidenceId,
    providerCharacterCostMicrocredits,
    accountUsageDeltaMicrocredits: completion.accountUsageDeltaMicrocredits,
    currency: 'USD' as const,
    providerCostMicros,
    maximumAuthorizedProviderCostMicros: authority.maximumAuthorizedProviderCostMicros,
    roundingRule: 'ceil_usd_micro' as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
    billingMutationPerformed: false as const,
    reconciledAt,
    immutable: true as const,
  }
  const evidence = deepFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
  trustedCostEvidence.set(evidence, evidenceClass)
  return evidence
}

export function assertMotionStudioSpeechProviderCostReconciliationEvidence(input: {
  evidence: MotionStudioSpeechProviderCostReconciliationEvidenceV1
  postResponseEvidence: MotionStudioSpeechC2PostResponseEvidenceV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
}): MotionStudioSpeechProviderCostReconciliationEvidenceV1 {
  const evidenceClass = trustedCostEvidence.get(input.evidence)
  if (!evidenceClass || evidenceClass !== input.evidence.evidenceClass) {
    blocked('Speech provider cost reconciliation requires trusted in-process derivation evidence.')
  }
  const { evidenceDigest, ...base } = input.evidence
  if (!SHA256.test(evidenceDigest) || sha256CanonicalJson(base) !== evidenceDigest) {
    blocked('Speech provider cost reconciliation evidence failed its immutable digest.')
  }
  if (
    input.evidence.candidateTakeId !== input.postResponseEvidence.candidateTakeId ||
    input.evidence.postResponseEvidenceDigest !== input.postResponseEvidence.evidenceDigest ||
    input.evidence.executionAuthorityDigest !== input.executionAuthority.authorityDigest ||
    input.evidence.providerRateCardSnapshotId !== input.executionAuthority.providerRateCardSnapshotId ||
    input.evidence.accountUsageBaselineEvidenceId !== input.executionAuthority.accountUsageBaselineEvidenceId ||
    input.evidence.maximumAuthorizedProviderCostMicros !==
      input.executionAuthority.maximumAuthorizedProviderCostMicros ||
    input.evidence.providerCharacterCostMicrocredits !==
      input.postResponseEvidence.providerCharacterCostMicrocredits ||
    input.evidence.accountUsageDeltaMicrocredits !==
      input.evidence.providerCharacterCostMicrocredits ||
    input.evidence.providerCostMicros > input.evidence.maximumAuthorizedProviderCostMicros ||
    input.evidence.customerPricingIncluded !== false || input.evidence.customerCreditsIncluded !== false ||
    input.evidence.serviceFeeIncluded !== false || input.evidence.billingMutationPerformed !== false
  ) blocked('Speech provider cost reconciliation evidence does not bind its exact authorized usage.')
  return input.evidence
}

function assertRateCardSnapshot(
  snapshot: MotionStudioSpeechProviderCreditRateCardSnapshotV1,
  at: string,
): MotionStudioSpeechProviderCreditRateCardSnapshotV1 {
  if (trustedRateSnapshots.get(snapshot) !== snapshot.snapshotDigest) {
    blocked('Speech provider cost requires the exact in-process immutable rate-card snapshot.')
  }
  const { snapshotDigest, ...base } = snapshot
  if (!SHA256.test(snapshotDigest) || sha256CanonicalJson(base) !== snapshotDigest) {
    blocked('Speech provider rate-card snapshot failed its immutable digest.')
  }
  const measuredAt = Date.parse(exactIso(at, 'provider cost measurement time'))
  if (
    snapshot.provider !== 'elevenlabs' || snapshot.providerAdapterId !== 'motion_studio_elevenlabs_timing_v1' ||
    snapshot.modelId !== 'eleven_v3' || snapshot.currency !== 'USD' ||
    snapshot.roundingRule !== 'ceil_usd_micro' || snapshot.exactAccountAllocation !== true ||
    snapshot.publicListPriceOnly !== false || snapshot.serviceFeeIncluded !== false ||
    snapshot.customerPricingIncluded !== false || snapshot.customerCreditsIncluded !== false ||
    snapshot.immutable !== true || measuredAt < Date.parse(snapshot.effectiveFrom) ||
    measuredAt < Date.parse(snapshot.verifiedAt) ||
    (snapshot.effectiveTo !== undefined && measuredAt >= Date.parse(snapshot.effectiveTo))
  ) blocked('Speech provider rate-card snapshot is not current exact internal-cost authority.')
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
    evidence.externalProviderCallCount > 1 ||
    evidence.reconciliation.providerCharacterCostHeaderPresent !== true ||
    evidence.providerCharacterCostMicrocredits === undefined ||
    evidence.providerCharacterCostCredits !== evidence.providerCharacterCostMicrocredits / 1_000_000 ||
    evidence.reconciliation.providerCharacterCostMicrocredits !== evidence.providerCharacterCostMicrocredits ||
    !evidence.providerCharacterCostEvidenceDigest ||
    evidence.reconciliation.providerCharacterCostEvidenceDigest !== evidence.providerCharacterCostEvidenceDigest
  ) blocked('Speech provider cost requires exact post-response character-cost evidence.')
}

function assertCompletionEvidence(
  completion: MotionStudioSpeechAccountUsageCompletionEvidenceV1,
  post: MotionStudioSpeechC2PostResponseEvidenceV1,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
): void {
  const { evidenceDigest, ...base } = completion
  if (
    !SHA256.test(evidenceDigest) || sha256CanonicalJson(base) !== evidenceDigest ||
    completion.executionAuthorityDigest !== authority.authorityDigest ||
    completion.candidateTakeId !== post.candidateTakeId ||
    completion.postResponseEvidenceDigest !== post.evidenceDigest ||
    completion.accountUsageBaselineEvidenceId !== authority.accountUsageBaselineEvidenceId ||
    completion.providerCharacterCostMicrocredits !== post.providerCharacterCostMicrocredits ||
    completion.providerCharacterCostEvidenceDigest !== post.providerCharacterCostEvidenceDigest ||
    completion.providerGenerationCallMade !== false || completion.purchasePerformed !== false ||
    completion.accountMutationPerformed !== false || completion.providerRequestCount !== 1 ||
    completion.credentialValuePersisted !== false || completion.rawProviderResponsePersisted !== false
  ) blocked('Speech provider account-usage evidence does not bind the exact response and authority.')
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n || denominator <= 0n) invalid('Speech provider cost ratio is invalid.')
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator
}

function safeNumber(value: bigint, label: string): number {
  if (value < 0n || value > MAX_SAFE_BIGINT) invalid(`${label} exceeds the safe integer bound.`)
  return Number(value)
}

function exactIso(value: string, label: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) invalid(`Speech ${label} is invalid.`)
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
    requiredGate: 'motion_studio_speech_provider_cost_reconciliation',
  })
}
