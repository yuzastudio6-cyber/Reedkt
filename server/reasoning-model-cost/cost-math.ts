import { createHash } from 'node:crypto'

import {
  REEDITPRO_REASONING_FALLBACK_TRIGGERS,
  REEDITPRO_REASONING_MODEL_ROUTE_IDS,
} from '../../src/types/reasoning-model-routing'
import {
  getReEditProReasoningModelRoute,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  getReasoningModelRateCardEntry,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
} from './rate-card'
import type {
  ReasoningModelAttemptCostAggregate,
  ReasoningModelAttemptCostEvidence,
  ReasoningModelAttemptCostEvidenceInput,
  ReasoningModelCostResult,
  ReasoningModelFxSnapshot,
  ReasoningModelInternalCostCalculation,
  ReasoningModelTokenUsage,
} from './types'

const TOKENS_PER_MILLION = 1_000_000n
const MICROS_PER_UNIT = 1_000_000n
const SHA256 = /^[a-f0-9]{64}$/

export function calculateReasoningModelInternalCost(input: {
  routeId: ReasoningModelAttemptCostEvidenceInput['routeId']
  usage: ReasoningModelTokenUsage
  fxSnapshot?: ReasoningModelFxSnapshot
}): ReasoningModelCostResult<ReasoningModelInternalCostCalculation> {
  const rate = getReasoningModelRateCardEntry(input.routeId)
  const usageValidation = validateUsage(input.usage, rate.contextWindowTokens)
  if (!usageValidation.ok) return usageValidation

  const cacheRates = resolveCacheRates(input.routeId, input.usage)
  if (!cacheRates.ok) return cacheRates

  const breakdownNativeMicros = {
    uncachedInput: tokenCost(
      input.usage.uncachedInputTokens,
      rate.cacheMissInputMicrosPerMillionTokens,
    ),
    cachedInput: tokenCost(
      input.usage.cachedInputTokens,
      cacheRates.data.cacheHitMicrosPerMillionTokens,
    ),
    cacheCreationInput: tokenCost(
      input.usage.cacheCreationInputTokens,
      cacheRates.data.cacheCreationMicrosPerMillionTokens,
    ),
    output: tokenCost(
      input.usage.outputTokens,
      rate.outputMicrosPerMillionTokens,
    ),
  }
  const nativeCostMicros = Object.values(breakdownNativeMicros)
    .reduce((sum, value) => sum + value, 0)

  let normalizedUsdCostMicros: number | null = nativeCostMicros
  let normalization: ReasoningModelInternalCostCalculation['normalization'] = 'native_usd'
  let fxSnapshot: ReasoningModelFxSnapshot | null = null

  if (rate.nativeCurrency === 'CNY') {
    normalizedUsdCostMicros = null
    normalization = 'requires_versioned_fx_snapshot'
    if (input.fxSnapshot) {
      const fxValidation = validateFxSnapshot(input.fxSnapshot)
      if (!fxValidation.ok) return fxValidation
      normalizedUsdCostMicros = safeNumber(ceilDivide(
        BigInt(nativeCostMicros) * BigInt(input.fxSnapshot.cnyToUsdMicrosPerCny),
        MICROS_PER_UNIT,
      ))
      normalization = 'versioned_fx_snapshot'
      fxSnapshot = { ...input.fxSnapshot }
    }
  } else if (input.fxSnapshot) {
    return failure('unexpected_fx_snapshot', 'fxSnapshot', 'USD-native routes must not apply an FX snapshot.')
  }

  return {
    ok: true,
    data: {
      schemaVersion: 'reasoning-model-internal-cost-calculation-v1',
      boundary: 'internal_provider_cost_only',
      routeId: input.routeId,
      provider: rate.provider,
      exactProviderModelId: rate.exactProviderModelId,
      rateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
      nativeCurrency: rate.nativeCurrency,
      nativeCostMicros,
      normalizedUsdCostMicros,
      normalization,
      fxSnapshot,
      usage: { ...input.usage },
      breakdownNativeMicros,
      pricingSourceUrls: [...rate.pricingSourceUrls],
      providerInvoiceReconciled: false,
      customerPriceIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
    },
  }
}

export function createReasoningModelAttemptCostEvidence(
  input: ReasoningModelAttemptCostEvidenceInput,
): ReasoningModelCostResult<ReasoningModelAttemptCostEvidence> {
  for (const [field, value] of Object.entries({
    reasoningRunId: input.reasoningRunId,
    attemptId: input.attemptId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    idempotencyKey: input.idempotencyKey,
  })) {
    if (!value.trim() || value.length > 240) {
      return failure('invalid_identity', field, `${field} must be a bounded non-empty identity.`)
    }
  }
  if (!SHA256.test(input.requestPayloadHash)) {
    return failure('invalid_hash', 'requestPayloadHash', 'requestPayloadHash must be lowercase SHA-256.')
  }
  if (!SHA256.test(input.responseUsageHash)) {
    return failure('invalid_hash', 'responseUsageHash', 'responseUsageHash must be lowercase SHA-256.')
  }
  if (!Number.isFinite(Date.parse(input.recordedAt))) {
    return failure('invalid_timestamp', 'recordedAt', 'recordedAt must be an ISO timestamp.')
  }

  const route = getReEditProReasoningModelRoute(input.routeId)
  if (input.attemptOrdinal !== route.priority) {
    return failure('invalid_attempt_order', 'attemptOrdinal', 'Attempt ordinal must match the immutable route priority.')
  }
  if (route.routeRole === 'primary' && input.failureTrigger !== null) {
    return failure('invalid_fallback_trigger', 'failureTrigger', 'The primary attempt cannot have a fallback-entry trigger.')
  }
  if (
    route.routeRole === 'fallback' &&
    (input.failureTrigger === null || !REEDITPRO_REASONING_FALLBACK_TRIGGERS.includes(input.failureTrigger))
  ) {
    return failure('invalid_fallback_trigger', 'failureTrigger', 'Fallback attempts require an allowed failure trigger from the immediately preceding route.')
  }

  const calculated = calculateReasoningModelInternalCost({
    routeId: input.routeId,
    usage: input.usage,
    fxSnapshot: input.fxSnapshot,
  })
  if (!calculated.ok) return calculated

  const withoutHash = {
    schemaVersion: 'reasoning-model-attempt-cost-evidence-v1' as const,
    boundary: 'internal_provider_cost_only' as const,
    evidenceClassification: 'provisional_metered_not_invoice_reconciled' as const,
    reasoningRunId: input.reasoningRunId,
    attemptId: input.attemptId,
    attemptOrdinal: input.attemptOrdinal,
    routeId: input.routeId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    idempotencyKey: input.idempotencyKey,
    requestPayloadHash: input.requestPayloadHash,
    responseUsageHash: input.responseUsageHash,
    outcome: input.outcome,
    failureTrigger: input.failureTrigger,
    cost: calculated.data,
    recordedAt: new Date(input.recordedAt).toISOString(),
    persistence: {
      databaseBacked: false as const,
      productionDurability: false as const,
      invoiceReconciled: false as const,
    },
    commercialBoundary: {
      customerPriceCalculated: false as const,
      customerCreditsCalculated: false as const,
      customerChargeCreated: false as const,
      walletMutationMade: false as const,
      serviceFeeIncluded: false as const,
    },
  }

  return {
    ok: true,
    data: {
      ...withoutHash,
      evidenceHash: sha256(stableStringify({
        routeContractVersion: REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
        ...withoutHash,
      })),
    },
  }
}

export function aggregateReasoningModelAttemptCosts(
  attempts: readonly ReasoningModelAttemptCostEvidence[],
): ReasoningModelCostResult<ReasoningModelAttemptCostAggregate> {
  if (attempts.length < 1 || attempts.length > REEDITPRO_REASONING_MODEL_ROUTE_IDS.length) {
    return failure('invalid_attempt_count', 'attempts', 'A reasoning cost aggregate requires one to three contiguous attempts.')
  }

  const authority = {
    reasoningRunId: attempts[0].reasoningRunId,
    approvedPlanSnapshotId: attempts[0].approvedPlanSnapshotId,
    creditReservationId: attempts[0].creditReservationId,
  }
  const ids = new Set<string>()
  const nativeCostMicrosByCurrency: ReasoningModelAttemptCostAggregate['nativeCostMicrosByCurrency'] = {}
  let normalizedUsdCostMicros = 0
  let allAttemptsUsdNormalized = true

  for (const [index, attempt] of attempts.entries()) {
    if (ids.has(attempt.attemptId)) {
      return failure('duplicate_attempt', 'attemptId', `Attempt ${attempt.attemptId} appears more than once.`)
    }
    ids.add(attempt.attemptId)
    if (
      attempt.reasoningRunId !== authority.reasoningRunId ||
      attempt.approvedPlanSnapshotId !== authority.approvedPlanSnapshotId ||
      attempt.creditReservationId !== authority.creditReservationId
    ) {
      return failure('mixed_attempt_authority', 'attempts', 'All reasoning attempts must share one run, approved snapshot, and reservation authority.')
    }
    const expectedOrdinal = index + 1
    if (
      attempt.attemptOrdinal !== expectedOrdinal ||
      attempt.routeId !== REEDITPRO_REASONING_MODEL_ROUTE_IDS[index]
    ) {
      return failure('non_contiguous_route_chain', 'attempts', 'Reasoning attempts must start with Kimi and follow the canonical route without skips or reordering.')
    }
    if (attempt.evidenceHash !== reasoningModelAttemptEvidenceHash(attempt)) {
      return failure('invalid_evidence_hash', 'evidenceHash', `Attempt ${attempt.attemptId} failed integrity verification.`)
    }
    if (index < attempts.length - 1 && attempt.outcome !== 'failed') {
      return failure('attempt_after_completion', 'attempts', 'No reasoning fallback may follow a completed attempt.')
    }
    const currency = attempt.cost.nativeCurrency
    nativeCostMicrosByCurrency[currency] =
      (nativeCostMicrosByCurrency[currency] ?? 0) + attempt.cost.nativeCostMicros
    if (attempt.cost.normalizedUsdCostMicros === null) {
      allAttemptsUsdNormalized = false
    } else {
      normalizedUsdCostMicros += attempt.cost.normalizedUsdCostMicros
    }
  }

  return {
    ok: true,
    data: {
      ...authority,
      routeIds: attempts.map((attempt) => attempt.routeId),
      attemptCount: attempts.length,
      completedAttemptCount: attempts.filter((attempt) => attempt.outcome === 'completed').length,
      failedAttemptCount: attempts.filter((attempt) => attempt.outcome === 'failed').length,
      nativeCostMicrosByCurrency,
      normalizedUsdCostMicros: allAttemptsUsdNormalized ? normalizedUsdCostMicros : null,
      allAttemptsUsdNormalized,
      customerChargeCreated: false,
      serviceFeeIncluded: false,
    },
  }
}

function reasoningModelAttemptEvidenceHash(
  evidence: ReasoningModelAttemptCostEvidence,
): string {
  const withoutHash: Partial<ReasoningModelAttemptCostEvidence> = { ...evidence }
  delete withoutHash.evidenceHash
  return sha256(stableStringify({
    routeContractVersion: REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    ...withoutHash,
  }))
}

function resolveCacheRates(
  routeId: ReasoningModelAttemptCostEvidenceInput['routeId'],
  usage: ReasoningModelTokenUsage,
): ReasoningModelCostResult<{
  cacheHitMicrosPerMillionTokens: number
  cacheCreationMicrosPerMillionTokens: number
}> {
  const rate = getReasoningModelRateCardEntry(routeId)

  if (routeId === 'qwen_3_7_fallback') {
    if (usage.cacheBillingMode === 'none') {
      if (usage.cachedInputTokens !== 0 || usage.cacheCreationInputTokens !== 0) {
        return failure('invalid_cache_usage', 'cacheBillingMode', 'Qwen cache tokens require an explicit Qwen cache billing mode.')
      }
      return { ok: true, data: { cacheHitMicrosPerMillionTokens: 0, cacheCreationMicrosPerMillionTokens: 0 } }
    }
    if (usage.cacheBillingMode === 'qwen_implicit') {
      if (usage.cacheCreationInputTokens !== 0) {
        return failure('invalid_cache_usage', 'cacheCreationInputTokens', 'Implicit Qwen caching cannot include explicit cache-creation tokens.')
      }
      return {
        ok: true,
        data: {
          cacheHitMicrosPerMillionTokens: rate.qwenImplicitCacheHitMicrosPerMillionTokens!,
          cacheCreationMicrosPerMillionTokens: 0,
        },
      }
    }
    if (usage.cacheBillingMode === 'qwen_explicit') {
      return {
        ok: true,
        data: {
          cacheHitMicrosPerMillionTokens: rate.qwenExplicitCacheHitMicrosPerMillionTokens!,
          cacheCreationMicrosPerMillionTokens: rate.qwenExplicitCacheCreationMicrosPerMillionTokens!,
        },
      }
    }
    return failure('invalid_cache_mode', 'cacheBillingMode', 'Qwen does not use provider_native cache billing.')
  }

  if (usage.cacheBillingMode === 'none') {
    if (usage.cachedInputTokens !== 0 || usage.cacheCreationInputTokens !== 0) {
      return failure('invalid_cache_usage', 'cacheBillingMode', 'Cache tokens require provider_native cache billing.')
    }
    return { ok: true, data: { cacheHitMicrosPerMillionTokens: 0, cacheCreationMicrosPerMillionTokens: 0 } }
  }
  if (usage.cacheBillingMode !== 'provider_native' || usage.cacheCreationInputTokens !== 0) {
    return failure('invalid_cache_mode', 'cacheBillingMode', 'Kimi and DeepSeek accept only provider_native cache hits and no cache-creation token class.')
  }
  return {
    ok: true,
    data: {
      cacheHitMicrosPerMillionTokens: rate.providerNativeCacheHitMicrosPerMillionTokens!,
      cacheCreationMicrosPerMillionTokens: 0,
    },
  }
}

function validateUsage(
  usage: ReasoningModelTokenUsage,
  contextWindowTokens: number,
): ReasoningModelCostResult<ReasoningModelTokenUsage> {
  for (const [field, value] of Object.entries({
    uncachedInputTokens: usage.uncachedInputTokens,
    cachedInputTokens: usage.cachedInputTokens,
    cacheCreationInputTokens: usage.cacheCreationInputTokens,
    outputTokens: usage.outputTokens,
  })) {
    if (!Number.isSafeInteger(value) || value < 0) {
      return failure('invalid_token_count', field, `${field} must be a non-negative safe integer.`)
    }
  }
  const total = usage.uncachedInputTokens + usage.cachedInputTokens +
    usage.cacheCreationInputTokens + usage.outputTokens
  if (total <= 0 || total > contextWindowTokens) {
    return failure('context_window_exceeded', 'usage', `Total metered tokens must be between 1 and ${contextWindowTokens}.`)
  }
  return { ok: true, data: { ...usage } }
}

function validateFxSnapshot(
  snapshot: ReasoningModelFxSnapshot,
): ReasoningModelCostResult<ReasoningModelFxSnapshot> {
  if (!snapshot.snapshotId.trim() || !snapshot.source.trim()) {
    return failure('invalid_fx_snapshot', 'fxSnapshot', 'FX snapshot requires immutable identity and source.')
  }
  try {
    const url = new URL(snapshot.sourceUrl)
    if (url.protocol !== 'https:') throw new Error('not https')
  } catch {
    return failure('invalid_fx_snapshot', 'sourceUrl', 'FX snapshot sourceUrl must be HTTPS.')
  }
  if (!Number.isFinite(Date.parse(snapshot.observedAt))) {
    return failure('invalid_fx_snapshot', 'observedAt', 'FX snapshot observedAt must be an ISO timestamp.')
  }
  if (!Number.isSafeInteger(snapshot.cnyToUsdMicrosPerCny) || snapshot.cnyToUsdMicrosPerCny <= 0) {
    return failure('invalid_fx_snapshot', 'cnyToUsdMicrosPerCny', 'FX quote must be positive integer USD micros per CNY.')
  }
  return { ok: true, data: { ...snapshot } }
}

function tokenCost(tokens: number, rateMicrosPerMillionTokens: number): number {
  if (tokens === 0 || rateMicrosPerMillionTokens === 0) return 0
  return safeNumber(ceilDivide(
    BigInt(tokens) * BigInt(rateMicrosPerMillionTokens),
    TOKENS_PER_MILLION,
  ))
}

function ceilDivide(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator
}

function safeNumber(value: bigint): number {
  const numberValue = Number(value)
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    throw new Error('Reasoning model cost exceeded safe integer precision.')
  }
  return numberValue
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function failure<T>(code: string, field: string, message: string): ReasoningModelCostResult<T> {
  return { ok: false, error: { code, field, message } }
}
