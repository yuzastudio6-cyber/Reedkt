import type {
  ReEditProReasoningFallbackTrigger,
  ReEditProActiveReasoningModelRouteId,
  ReEditProReasoningModelProvider,
} from '../../src/types/reasoning-model-routing'

export type ReasoningModelCostCurrency = 'USD' | 'CNY'

export type ReasoningModelCacheBillingMode =
  | 'none'
  | 'provider_native'
  | 'qwen_implicit'
  | 'qwen_explicit'

export interface ReasoningModelTokenUsage {
  uncachedInputTokens: number
  cachedInputTokens: number
  cacheCreationInputTokens: number
  outputTokens: number
  cacheBillingMode: ReasoningModelCacheBillingMode
}

export interface ReasoningModelFxSnapshot {
  snapshotId: string
  source: string
  sourceUrl: string
  observedAt: string
  cnyToUsdMicrosPerCny: number
}

export interface ReasoningModelRateCardEntry {
  routeId: ReEditProActiveReasoningModelRouteId
  provider: ReEditProReasoningModelProvider
  exactProviderModelId: string
  nativeCurrency: ReasoningModelCostCurrency
  contextWindowTokens: number
  cacheMissInputMicrosPerMillionTokens: number
  providerNativeCacheHitMicrosPerMillionTokens: number | null
  providerNativeCacheCreationMicrosPerMillionTokens: number | null
  qwenImplicitCacheHitMicrosPerMillionTokens: number | null
  qwenExplicitCacheHitMicrosPerMillionTokens: number | null
  qwenExplicitCacheCreationMicrosPerMillionTokens: number | null
  outputMicrosPerMillionTokens: number
  longContextInputThresholdTokens: number | null
  longContextInputRateMultiplierBps: number
  longContextOutputRateMultiplierBps: number
  pricingSourceUrls: readonly string[]
  observedAt: string
}

export interface ReasoningModelInternalCostCalculation {
  schemaVersion: 'reasoning-model-internal-cost-calculation-v2'
  boundary: 'internal_provider_cost_only'
  routeId: ReEditProActiveReasoningModelRouteId
  provider: ReEditProReasoningModelProvider
  exactProviderModelId: string
  rateCardVersion: string
  nativeCurrency: ReasoningModelCostCurrency
  nativeCostMicros: number
  normalizedUsdCostMicros: number | null
  normalization: 'native_usd' | 'versioned_fx_snapshot' | 'requires_versioned_fx_snapshot'
  fxSnapshot: ReasoningModelFxSnapshot | null
  usage: ReasoningModelTokenUsage
  pricingClass: 'standard' | 'long_context'
  longContextInputThresholdTokens: number | null
  breakdownNativeMicros: {
    uncachedInput: number
    cachedInput: number
    cacheCreationInput: number
    output: number
  }
  pricingSourceUrls: string[]
  providerInvoiceReconciled: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
}

export interface ReasoningModelAttemptCostEvidenceInput {
  reasoningRunId: string
  attemptId: string
  attemptOrdinal: 1 | 2 | 3
  routeId: ReEditProActiveReasoningModelRouteId
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  requestPayloadHash: string
  responseUsageHash: string
  outcome: 'completed' | 'failed'
  failureTrigger: ReEditProReasoningFallbackTrigger | null
  usage: ReasoningModelTokenUsage
  fxSnapshot?: ReasoningModelFxSnapshot
  recordedAt: string
}

export interface ReasoningModelAttemptCostEvidence {
  schemaVersion: 'reasoning-model-attempt-cost-evidence-v1'
  boundary: 'internal_provider_cost_only'
  evidenceClassification: 'provisional_metered_not_invoice_reconciled'
  reasoningRunId: string
  attemptId: string
  attemptOrdinal: 1 | 2 | 3
  routeId: ReEditProActiveReasoningModelRouteId
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  requestPayloadHash: string
  responseUsageHash: string
  outcome: 'completed' | 'failed'
  failureTrigger: ReEditProReasoningFallbackTrigger | null
  cost: ReasoningModelInternalCostCalculation
  recordedAt: string
  persistence: {
    databaseBacked: false
    productionDurability: false
    invoiceReconciled: false
  }
  commercialBoundary: {
    customerPriceCalculated: false
    customerCreditsCalculated: false
    customerChargeCreated: false
    walletMutationMade: false
    serviceFeeIncluded: false
  }
  evidenceHash: string
}

export interface ReasoningModelAttemptCostAggregate {
  reasoningRunId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  routeIds: ReEditProActiveReasoningModelRouteId[]
  attemptCount: number
  completedAttemptCount: number
  failedAttemptCount: number
  nativeCostMicrosByCurrency: Partial<Record<ReasoningModelCostCurrency, number>>
  normalizedUsdCostMicros: number | null
  allAttemptsUsdNormalized: boolean
  customerChargeCreated: false
  serviceFeeIncluded: false
}

export type ReasoningModelCostResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; field: string } }
