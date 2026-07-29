export const LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_VERSION =
  'living-frame-cloud-run-l4-public-rate-observation-2026-07-29-v1' as const

export const LIVING_FRAME_CLOUD_RUN_L4_ESTIMATE_RATE_BASIS_VERSION =
  'living-frame-cloud-run-l4-public-list-prices-2026-07-29-v1' as const

export const LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_DIGEST =
  '04b100a074d520ce904f86df961617e53b7933d90bd69d6e233f286d2b326e9a' as const

export const LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_SOURCE_CODES = [
  'google_cloud_run_public_pricing_page',
  'google_cloud_run_gpu_support_page',
  'google_cloud_storage_public_pricing_page',
] as const

export type LivingFrameCloudRunL4PublicRateSourceCode =
  (typeof LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_SOURCE_CODES)[number]

export interface LivingFrameCloudRunL4PublicRateObservation {
  readonly schemaVersion:
    typeof LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_VERSION
  readonly evidenceClass:
    'dated_public_list_price_observation_non_authoritative'
  readonly observedDate: '2026-07-29'
  readonly sourceCodes:
    readonly LivingFrameCloudRunL4PublicRateSourceCode[]
  readonly currency: 'USD'
  readonly runtimeRegion: 'europe-west1'
  readonly billingMode: 'instance_based'
  readonly accelerator: 'nvidia_l4'
  readonly zonalRedundancy: 'disabled'
  readonly cloudStorageClass: 'regional_standard'
  readonly rates: {
    readonly perVcpuSecondUsdNanos: 18_000
    readonly perMemoryGibSecondUsdNanos: 2_000
    readonly perL4GpuSecondUsdNanos: 186_700
    readonly perTempStorageGibHourUsdNanos: 109_589
    readonly perOutputStorageGibHourUsdNanos: 27_397
    readonly perOutputClassAWriteUsdNanos: 5_000
    readonly perRequestUsdNanos: 0
  }
  readonly billingRules: {
    readonly minimumBillableMillisecondsPerAttempt: 60_000
    readonly roundingIncrementMilliseconds: 100
    readonly minimumVcpuCount: 4
    readonly minimumMemoryGib: 16
    readonly gpuCountPerInstance: 1
    readonly freeTierApplied: false
    readonly committedUseDiscountApplied: false
    readonly billingAccountDiscountApplied: false
  }
  readonly exclusions: {
    readonly networkEgress: 'same_region_assumed_zero'
    readonly classBReads: 'not_included_requires_actual_usage'
    readonly artifactRegistry: 'not_included_requires_shared_runtime_usage'
    readonly softDeleteAndVersionRetention:
      'not_included_requires_storage_policy'
    readonly taxAndCurrencyConversion:
      'not_included_requires_billing_account'
  }
  readonly observationDigest: string
  readonly publicListObservationOnly: true
  readonly currentPricingApiReReadRequired: true
  readonly billingAccountRateAuthority: false
  readonly productionRateAuthority: false
  readonly actualAttemptCostAuthority: false
  readonly invoiceReconciliationAuthority: false
  readonly customerEstimateAuthority: false
  readonly customerPriceAuthority: false
  readonly creditAuthority: false
  readonly serviceFeeAuthority: false
  readonly approvalAuthority: false
  readonly reservationAuthority: false
  readonly walletAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCloudRunL4EstimateInput {
  readonly attemptCount: number
  readonly perAttemptWallTimeMilliseconds: number
  readonly vcpuCount: number
  readonly memoryGib: number
  readonly gpuCount: 1
  readonly tempStorageGib: number
  readonly outputArtifactCount: number
  readonly outputMibPerArtifact: number
  readonly outputRetentionHours: number
}

export interface LivingFrameCloudRunL4EstimateCalculation {
  readonly rateBasisVersion:
    typeof LIVING_FRAME_CLOUD_RUN_L4_ESTIMATE_RATE_BASIS_VERSION
  readonly rateObservationDigest: string
  readonly attemptCount: number
  readonly perAttemptWallTimeMilliseconds: number
  readonly billableMillisecondsPerAttempt: number
  readonly totalBillableMilliseconds: number
  readonly breakdownUsdNanos: {
    readonly cpu: number
    readonly memory: number
    readonly gpu: number
    readonly tempStorage: number
    readonly outputStorage: number
    readonly outputClassAWrites: number
    readonly requests: 0
  }
  readonly expectedInternalCostUsdNanos: number
  readonly expectedInternalCostMicros: number
  readonly aggregateThenRoundToMicros: true
  readonly syntheticRenderChargeIncluded: false
  readonly serviceFeeIncluded: false
  readonly freeTierApplied: false
  readonly discountApplied: false
  readonly productionRateAuthority: false
  readonly actualAttemptCostAuthority: false
  readonly customerEstimateAuthority: false
  readonly customerPriceAuthority: false
  readonly creditAuthority: false
  readonly serviceFeeAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}
