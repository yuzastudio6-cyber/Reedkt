import { z } from 'zod'

import {
  aggregateReasoningModelAttemptCosts,
  calculateReasoningModelInternalCost,
  createReasoningModelAttemptCostEvidence,
  getReasoningModelRateCardEntry,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
  type ReasoningModelAttemptCostAggregate,
  type ReasoningModelAttemptCostEvidence,
  type ReasoningModelInternalCostCalculation,
  type ReasoningModelTokenUsage,
} from '../../reasoning-model-cost'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'

export const MOTION_STUDIO_KIMI_K3_COST_ADAPTER_SCHEMA_VERSION =
  'motion-studio.kimi-k3-canonical-cost-adapter.v1' as const
export const MOTION_STUDIO_KIMI_K3_ATTEMPT_COST_SCHEMA_VERSION =
  'motion-studio.kimi-k3-canonical-attempt-cost-evidence.v1' as const
export const MOTION_STUDIO_REASONING_ARTIFACT_COST_SCHEMA_VERSION =
  'motion-studio.reasoning-artifact-cost-summary.v1' as const

export const MOTION_STUDIO_KIMI_K3_PROVIDER_ADAPTER_ID =
  'motion-studio-kimi-k3-server-adapter-v1' as const
export const MOTION_STUDIO_KIMI_K3_MODEL_ID = 'kimi-k3' as const
export const MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID = 'kimi_k3_primary' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const safeInteger = z.number().int().nonnegative().safe()
const isoDate = z.string().datetime({ offset: true })

export const motionStudioKimiK3ProviderUsageV1Schema = z.object({
  promptTokens: safeInteger,
  completionTokens: safeInteger,
  totalTokens: safeInteger,
  cachedTokens: safeInteger,
  reportedReasoningTokens: safeInteger.nullable(),
  reportedImageInputTokens: safeInteger.nullable(),
  reportedVideoInputTokens: safeInteger.nullable(),
  toolCallCount: safeInteger,
}).strict().superRefine((value, context) => {
  if (value.cachedTokens > value.promptTokens) {
    context.addIssue({ code: 'custom', path: ['cachedTokens'], message: 'Cached tokens cannot exceed prompt tokens.' })
  }
  if (value.promptTokens + value.completionTokens !== value.totalTokens) {
    context.addIssue({ code: 'custom', path: ['totalTokens'], message: 'Kimi total tokens must reconcile to prompt plus completion tokens.' })
  }
  if (value.reportedReasoningTokens !== null && value.reportedReasoningTokens > value.completionTokens) {
    context.addIssue({ code: 'custom', path: ['reportedReasoningTokens'], message: 'Reported reasoning tokens cannot exceed completion tokens.' })
  }
  const reportedMediaTokens = (value.reportedImageInputTokens ?? 0) +
    (value.reportedVideoInputTokens ?? 0)
  if (reportedMediaTokens > value.promptTokens) {
    context.addIssue({ code: 'custom', path: ['reportedImageInputTokens'], message: 'Reported media input tokens cannot exceed prompt tokens.' })
  }
})

export type MotionStudioKimiK3ProviderUsageV1 =
  z.infer<typeof motionStudioKimiK3ProviderUsageV1Schema>

export interface MotionStudioKimiK3OfficialPricingProvenance {
  schemaVersion: 'motion-studio.kimi-k3-official-pricing-provenance.v1'
  canonicalRateCardVersion: string
  canonicalRouteId: typeof MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID
  exactProviderModelId: typeof MOTION_STUDIO_KIMI_K3_MODEL_ID
  officialSourceUrl: 'https://platform.kimi.ai/docs/pricing/chat-k3.md'
  sourceDocumentDigest: string
  capturedAt: string
  role: 'corroborating_official_source_not_rate_authority'
  provenanceDigest: string
  immutable: true
}

export interface MotionStudioKimiK3TokenCostBreakdown {
  canonicalCost: ReasoningModelInternalCostCalculation
  cachedInputTokens: number
  cacheMissInputTokens: number
  outputTokensIncludingReasoning: number
  cachedInputInternalCostMicros: number
  cacheMissInputInternalCostMicros: number
  outputInternalCostMicros: number
  totalInternalCostMicros: number
  cacheSavingsInternalCostMicros: number
}

export interface MotionStudioKimiK3AttemptCostEvidenceV1 {
  schemaVersion: typeof MOTION_STUDIO_KIMI_K3_ATTEMPT_COST_SCHEMA_VERSION
  logicalArtifactKey: string
  jobId: string
  costEstimateItemId: string
  canonicalRateCardVersion: string
  officialPricingProvenanceDigest: string
  providerUsage: MotionStudioKimiK3ProviderUsageV1
  canonicalAttemptCostEvidence: ReasoningModelAttemptCostEvidence
  acceptedArtifact: boolean
  failureCategory: string | null
  latencyMilliseconds: number
  maximumAuthorizedInternalCostMicros: number
  cacheSavingsInternalCostMicros: number
  customerPricingIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  attemptCostEvidenceDigest: string
  immutable: true
}

export interface MotionStudioReasoningAttemptCostRef {
  logicalArtifactKey: string
  canonicalAttemptCostEvidence: ReasoningModelAttemptCostEvidence
  acceptedArtifact: boolean
  latencyMilliseconds: number
}

export interface MotionStudioReasoningArtifactCostSummaryV1 {
  schemaVersion: typeof MOTION_STUDIO_REASONING_ARTIFACT_COST_SCHEMA_VERSION
  logicalArtifactKey: string
  canonicalAggregate: ReasoningModelAttemptCostAggregate
  attemptEvidenceHashes: readonly string[]
  attemptCount: number
  acceptedArtifactCount: number
  failedOrRejectedAttemptCount: number
  totalInternalCostMicros: number | null
  costPerAcceptedArtifactMicros: number | null
  totalLatencyMilliseconds: number
  customerPricingIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  summaryDigest: string
  immutable: true
}

const KIMI_K3_PRICING_CAPTURED_AT = '2026-07-18T23:22:21.000Z' as const
const KIMI_K3_PRICING_SOURCE_DOCUMENT_DIGEST =
  '182d0b488553d8faf22cb34e52b9f623312b75763a8d781f245ee3e66bc3d869' as const

const officialPricingProvenanceBase = {
  schemaVersion: 'motion-studio.kimi-k3-official-pricing-provenance.v1' as const,
  canonicalRateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
  canonicalRouteId: MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
  exactProviderModelId: MOTION_STUDIO_KIMI_K3_MODEL_ID,
  officialSourceUrl: 'https://platform.kimi.ai/docs/pricing/chat-k3.md' as const,
  sourceDocumentDigest: KIMI_K3_PRICING_SOURCE_DOCUMENT_DIGEST,
  capturedAt: KIMI_K3_PRICING_CAPTURED_AT,
  role: 'corroborating_official_source_not_rate_authority' as const,
}

/**
 * Stronger Motion Studio source provenance for the exact official K3 pricing
 * page. The shared ReEditPro rate card remains the sole calculation authority.
 */
export const MOTION_STUDIO_KIMI_K3_OFFICIAL_PRICING_PROVENANCE:
MotionStudioKimiK3OfficialPricingProvenance = deepFreeze({
  ...officialPricingProvenanceBase,
  provenanceDigest: sha256CanonicalJson(officialPricingProvenanceBase),
  immutable: true,
})

export function calculateMotionStudioKimiK3TokenCost(input: {
  promptTokens: number
  cachedTokens: number
  completionTokens: number
}): MotionStudioKimiK3TokenCostBreakdown {
  const usage = toCanonicalUsage({
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    totalTokens: safeSum([input.promptTokens, input.completionTokens], 'Kimi total token quantity'),
    cachedTokens: input.cachedTokens,
    reportedReasoningTokens: null,
    reportedImageInputTokens: null,
    reportedVideoInputTokens: null,
    toolCallCount: 0,
  })
  const canonicalCost = requireCost(calculateReasoningModelInternalCost({
    routeId: MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
    usage,
  }))
  const allMissCost = requireCost(calculateReasoningModelInternalCost({
    routeId: MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
    usage: {
      uncachedInputTokens: input.promptTokens,
      cachedInputTokens: 0,
      cacheCreationInputTokens: 0,
      outputTokens: input.completionTokens,
      cacheBillingMode: 'provider_native',
    },
  }))
  return deepFreeze(toMotionCostBreakdown(canonicalCost, allMissCost.nativeCostMicros))
}

export function estimateMotionStudioKimiK3MaximumAttemptCost(input: {
  projectedPromptTokens: number
  maximumCompletionTokens: number
}): MotionStudioKimiK3TokenCostBreakdown {
  return calculateMotionStudioKimiK3TokenCost({
    promptTokens: input.projectedPromptTokens,
    cachedTokens: 0,
    completionTokens: input.maximumCompletionTokens,
  })
}

export function createMotionStudioKimiK3AttemptCostEvidence(input: {
  logicalArtifactKey: string
  jobId: string
  reasoningRunId: string
  attemptId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  requestPayloadHash: string
  responseUsageDigest: string
  usage: MotionStudioKimiK3ProviderUsageV1
  outcome: 'completed' | 'failed'
  acceptedArtifact: boolean
  failureCategory: string | null
  latencyMilliseconds: number
  costEstimateItemId: string
  rateCardVersionId: string
  maximumAuthorizedInternalCostMicros: number
  measuredAt: string
}): { evidence: MotionStudioKimiK3AttemptCostEvidenceV1; usageLines: readonly MotionStudioAttemptUsageLine[] } {
  assertStableId(input.logicalArtifactKey, 'Kimi logical artifact key')
  assertStableId(input.jobId, 'Kimi job ID')
  assertStableId(input.costEstimateItemId, 'Kimi cost estimate item ID')
  assertDigest(input.responseUsageDigest, 'Kimi response usage digest')
  assertSafeInteger(input.latencyMilliseconds, 'Kimi attempt latency')
  assertSafeInteger(input.maximumAuthorizedInternalCostMicros, 'Kimi maximum authorized internal cost')
  isoDate.parse(input.measuredAt)
  const usage = motionStudioKimiK3ProviderUsageV1Schema.parse(input.usage)

  if (input.rateCardVersionId !== REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION) {
    blocked('Kimi attempt must use the canonical shared reasoning-model rate-card version authorized by its estimate item.')
  }
  if (input.acceptedArtifact && input.outcome !== 'completed') {
    invalid('Only a completed Kimi attempt can produce an accepted artifact.')
  }
  if (input.acceptedArtifact && input.failureCategory !== null) {
    invalid('An accepted Kimi artifact cannot retain a failure category.')
  }
  if (!input.acceptedArtifact && !input.failureCategory?.trim()) {
    invalid('A non-accepted Kimi attempt must retain its failure category.')
  }

  const canonicalResult = createReasoningModelAttemptCostEvidence({
    reasoningRunId: input.reasoningRunId,
    attemptId: input.attemptId,
    attemptOrdinal: 1,
    routeId: MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    idempotencyKey: input.idempotencyKey,
    requestPayloadHash: input.requestPayloadHash,
    responseUsageHash: input.responseUsageDigest,
    outcome: input.outcome,
    failureTrigger: null,
    usage: toCanonicalUsage(usage),
    recordedAt: input.measuredAt,
  })
  const canonicalAttemptCostEvidence = requireCost(canonicalResult)
  const cost = canonicalAttemptCostEvidence.cost
  if (cost.normalizedUsdCostMicros === null) {
    blocked('The USD-native Kimi route must produce a normalized USD internal cost.')
  }
  if (cost.normalizedUsdCostMicros > input.maximumAuthorizedInternalCostMicros) {
    blocked('Kimi attempt cost exceeds the exact maximum authorized internal cost.')
  }

  const allMissCost = requireCost(calculateReasoningModelInternalCost({
    routeId: MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
    usage: {
      uncachedInputTokens: usage.promptTokens,
      cachedInputTokens: 0,
      cacheCreationInputTokens: 0,
      outputTokens: usage.completionTokens,
      cacheBillingMode: 'provider_native',
    },
  }))
  const cacheSavingsInternalCostMicros = Math.max(0,
    allMissCost.nativeCostMicros - cost.nativeCostMicros)
  const base = {
    schemaVersion: MOTION_STUDIO_KIMI_K3_ATTEMPT_COST_SCHEMA_VERSION,
    logicalArtifactKey: input.logicalArtifactKey,
    jobId: input.jobId,
    costEstimateItemId: input.costEstimateItemId,
    canonicalRateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    officialPricingProvenanceDigest:
      MOTION_STUDIO_KIMI_K3_OFFICIAL_PRICING_PROVENANCE.provenanceDigest,
    providerUsage: usage,
    canonicalAttemptCostEvidence,
    acceptedArtifact: input.acceptedArtifact,
    failureCategory: input.failureCategory,
    latencyMilliseconds: input.latencyMilliseconds,
    maximumAuthorizedInternalCostMicros: input.maximumAuthorizedInternalCostMicros,
    cacheSavingsInternalCostMicros,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
    immutable: true as const,
  }
  const evidence = deepFreeze({
    ...base,
    attemptCostEvidenceDigest: sha256CanonicalJson(base),
  })
  assertMotionStudioKimiK3AttemptCostEvidence(evidence)

  const usageLines = deepFreeze([
    usageLine('cached_input_token', cost.usage.cachedInputTokens,
      cost.breakdownNativeMicros.cachedInput, input, evidence),
    usageLine('input_token', cost.usage.uncachedInputTokens,
      cost.breakdownNativeMicros.uncachedInput, input, evidence),
    usageLine('output_token', cost.usage.outputTokens,
      cost.breakdownNativeMicros.output, input, evidence),
  ])
  return deepFreeze({ evidence, usageLines })
}

export function summarizeMotionStudioReasoningArtifactCost(
  logicalArtifactKey: string,
  attempts: readonly MotionStudioReasoningAttemptCostRef[],
): MotionStudioReasoningArtifactCostSummaryV1 {
  assertStableId(logicalArtifactKey, 'Reasoning logical artifact key')
  if (attempts.length < 1) invalid('Reasoning artifact cost summary requires at least one attempt.')
  for (const attempt of attempts) {
    if (attempt.logicalArtifactKey !== logicalArtifactKey) {
      invalid('Every reasoning attempt in one artifact summary must share the exact logical artifact key.')
    }
    assertSafeInteger(attempt.latencyMilliseconds, 'Reasoning attempt latency')
    if (attempt.acceptedArtifact && attempt.canonicalAttemptCostEvidence.outcome !== 'completed') {
      invalid('Only a completed reasoning attempt can produce an accepted artifact.')
    }
  }
  const acceptedArtifactCount = attempts.filter((attempt) => attempt.acceptedArtifact).length
  if (acceptedArtifactCount > 1) {
    invalid('One reasoning logical artifact summary cannot contain multiple accepted attempts.')
  }
  const canonicalResult = aggregateReasoningModelAttemptCosts(
    attempts.map((attempt) => attempt.canonicalAttemptCostEvidence),
  )
  const canonicalAggregate = requireCost(canonicalResult)
  const totalInternalCostMicros = canonicalAggregate.normalizedUsdCostMicros
  const base = {
    schemaVersion: MOTION_STUDIO_REASONING_ARTIFACT_COST_SCHEMA_VERSION,
    logicalArtifactKey,
    canonicalAggregate,
    attemptEvidenceHashes: attempts.map((attempt) =>
      attempt.canonicalAttemptCostEvidence.evidenceHash),
    attemptCount: attempts.length,
    acceptedArtifactCount,
    failedOrRejectedAttemptCount: attempts.filter((attempt) =>
      attempt.canonicalAttemptCostEvidence.outcome === 'failed' || !attempt.acceptedArtifact).length,
    totalInternalCostMicros,
    costPerAcceptedArtifactMicros:
      acceptedArtifactCount === 1 ? totalInternalCostMicros : null,
    totalLatencyMilliseconds: safeSum(
      attempts.map((attempt) => attempt.latencyMilliseconds),
      'Reasoning total latency',
    ),
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
    immutable: true as const,
  }
  return deepFreeze({ ...base, summaryDigest: sha256CanonicalJson(base) })
}

export function assertMotionStudioKimiK3AttemptCostEvidence(
  evidence: MotionStudioKimiK3AttemptCostEvidenceV1,
): void {
  motionStudioKimiK3ProviderUsageV1Schema.parse(evidence.providerUsage)
  if (evidence.schemaVersion !== MOTION_STUDIO_KIMI_K3_ATTEMPT_COST_SCHEMA_VERSION) {
    blocked('Kimi attempt cost evidence has an unsupported schema version.')
  }
  if (evidence.canonicalRateCardVersion !== REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION) {
    blocked('Kimi attempt cost evidence is not bound to the canonical shared rate card.')
  }
  if (evidence.officialPricingProvenanceDigest !==
      MOTION_STUDIO_KIMI_K3_OFFICIAL_PRICING_PROVENANCE.provenanceDigest) {
    blocked('Kimi attempt cost evidence lost its exact official pricing provenance.')
  }
  if (evidence.canonicalAttemptCostEvidence.routeId !== MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID ||
      evidence.canonicalAttemptCostEvidence.attemptOrdinal !== 1) {
    blocked('Motion Studio Kimi evidence must bind the canonical primary Kimi route.')
  }
  const canonicalValidation = aggregateReasoningModelAttemptCosts([
    evidence.canonicalAttemptCostEvidence,
  ])
  if (!canonicalValidation.ok) blocked(canonicalValidation.error.message)
  const expectedUsage = toCanonicalUsage(evidence.providerUsage)
  if (sha256CanonicalJson(expectedUsage) !==
      sha256CanonicalJson(evidence.canonicalAttemptCostEvidence.cost.usage)) {
    blocked('Kimi provider usage does not match the canonical cost evidence.')
  }
  if (evidence.canonicalAttemptCostEvidence.cost.normalizedUsdCostMicros === null ||
      evidence.canonicalAttemptCostEvidence.cost.normalizedUsdCostMicros >
      evidence.maximumAuthorizedInternalCostMicros) {
    blocked('Kimi canonical attempt cost exceeds or cannot reconcile to its maximum authority.')
  }
  if (evidence.acceptedArtifact && evidence.canonicalAttemptCostEvidence.outcome !== 'completed') {
    blocked('Only a completed Kimi attempt can be accepted.')
  }
  const base = { ...evidence } as Record<string, unknown>
  delete base.attemptCostEvidenceDigest
  if (sha256CanonicalJson(base) !== evidence.attemptCostEvidenceDigest) {
    blocked('Kimi attempt cost evidence failed immutable digest verification.')
  }
}

export function assertMotionStudioReasoningArtifactCostSummary(
  summary: MotionStudioReasoningArtifactCostSummaryV1,
): void {
  if (summary.schemaVersion !== MOTION_STUDIO_REASONING_ARTIFACT_COST_SCHEMA_VERSION) {
    blocked('Reasoning artifact cost summary has an unsupported schema version.')
  }
  const base = { ...summary } as Record<string, unknown>
  delete base.summaryDigest
  if (sha256CanonicalJson(base) !== summary.summaryDigest) {
    blocked('Reasoning artifact cost summary failed immutable digest verification.')
  }
}

export function assertMotionStudioKimiK3CanonicalRateAuthority(): void {
  const rate = getReasoningModelRateCardEntry(MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID)
  if (
    rate.exactProviderModelId !== MOTION_STUDIO_KIMI_K3_MODEL_ID ||
    rate.nativeCurrency !== 'USD' ||
    rate.providerNativeCacheHitMicrosPerMillionTokens !== 300_000 ||
    rate.cacheMissInputMicrosPerMillionTokens !== 3_000_000 ||
    rate.outputMicrosPerMillionTokens !== 15_000_000
  ) {
    blocked('The canonical shared Kimi rate authority no longer matches the verified official K3 pricing provenance.')
  }
}

function toCanonicalUsage(
  usageInput: MotionStudioKimiK3ProviderUsageV1,
): ReasoningModelTokenUsage {
  const usage = motionStudioKimiK3ProviderUsageV1Schema.parse(usageInput)
  return {
    uncachedInputTokens: usage.promptTokens - usage.cachedTokens,
    cachedInputTokens: usage.cachedTokens,
    cacheCreationInputTokens: 0,
    outputTokens: usage.completionTokens,
    cacheBillingMode: 'provider_native',
  }
}

function toMotionCostBreakdown(
  canonicalCost: ReasoningModelInternalCostCalculation,
  allMissInputAndOutputCostMicros: number,
): MotionStudioKimiK3TokenCostBreakdown {
  assertMotionStudioKimiK3CanonicalRateAuthority()
  if (canonicalCost.normalizedUsdCostMicros === null) {
    blocked('Kimi canonical cost must be USD-normalized.')
  }
  return {
    canonicalCost,
    cachedInputTokens: canonicalCost.usage.cachedInputTokens,
    cacheMissInputTokens: canonicalCost.usage.uncachedInputTokens,
    outputTokensIncludingReasoning: canonicalCost.usage.outputTokens,
    cachedInputInternalCostMicros: canonicalCost.breakdownNativeMicros.cachedInput,
    cacheMissInputInternalCostMicros: canonicalCost.breakdownNativeMicros.uncachedInput,
    outputInternalCostMicros: canonicalCost.breakdownNativeMicros.output,
    totalInternalCostMicros: canonicalCost.normalizedUsdCostMicros,
    cacheSavingsInternalCostMicros: Math.max(0,
      allMissInputAndOutputCostMicros - canonicalCost.nativeCostMicros),
  }
}

function usageLine(
  meterId: 'cached_input_token' | 'input_token' | 'output_token',
  quantity: number,
  internalCostMicros: number,
  input: { costEstimateItemId: string; responseUsageDigest: string },
  evidence: MotionStudioKimiK3AttemptCostEvidenceV1,
): MotionStudioAttemptUsageLine {
  return {
    costEstimateItemId: input.costEstimateItemId,
    meterId,
    quantity,
    internalCostMicros,
    evidenceClass: 'provider_reported',
    evidenceDigest: sha256CanonicalJson({
      schemaVersion: 'motion-studio.kimi-k3-canonical-usage-line.v1',
      canonicalAttemptEvidenceHash:
        evidence.canonicalAttemptCostEvidence.evidenceHash,
      motionAttemptEvidenceDigest: evidence.attemptCostEvidenceDigest,
      responseUsageDigest: input.responseUsageDigest,
      meterId,
      quantity,
      internalCostMicros,
    }),
  }
}

function requireCost<T>(
  result: { ok: true; data: T } | { ok: false; error: { code: string; message: string; field: string } },
): T {
  if (!result.ok) blocked(`${result.error.code}:${result.error.field}: ${result.error.message}`)
  return result.data
}

function safeSum(values: readonly number[], label: string): number {
  let total = 0n
  for (const value of values) {
    assertSafeInteger(value, label)
    total += BigInt(value)
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) invalid(`${label} exceeds safe integer bounds.`)
  return Number(total)
}

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) invalid(`${label} must be a non-negative safe integer.`)
}

function assertStableId(value: string, label: string): void {
  if (!stableId.safeParse(value).success) invalid(`${label} is not a stable identifier.`)
}

function assertDigest(value: string, label: string): void {
  if (!digest.safeParse(value).success) invalid(`${label} must be a SHA-256 digest.`)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
