import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CLOUD_RUN_L4_ESTIMATE_RATE_BASIS_VERSION,
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_DIGEST,
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_VERSION,
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_SOURCE_CODES,
  type LivingFrameCloudRunL4EstimateCalculation,
  type LivingFrameCloudRunL4EstimateInput,
  type LivingFrameCloudRunL4PublicRateObservation,
} from '../../src/types/living-frame-cloud-run-l4-rate-observation'
import { ApiError } from '../errors/api-error'

const USD_NANOS_PER_MICRO = 1_000n
const MILLISECONDS_PER_SECOND = 1_000n
const MILLISECONDS_PER_HOUR = 3_600_000n
const MIB_PER_GIB = 1_024n
const MAX_ATTEMPT_COUNT = 384
const MAX_ATTEMPT_WALL_TIME_MILLISECONDS = 3_600_000
const MAX_VCPU_COUNT = 64
const MAX_MEMORY_GIB = 512
const MAX_TEMP_STORAGE_GIB = 64
const MAX_OUTPUT_ARTIFACT_COUNT = 128
const MAX_OUTPUT_MIB_PER_ARTIFACT = 10_240
const MAX_OUTPUT_RETENTION_HOURS = 720

const OBSERVATION_WITHOUT_DIGEST = {
  schemaVersion:
    LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_VERSION,
  evidenceClass:
    'dated_public_list_price_observation_non_authoritative',
  observedDate: '2026-07-29',
  sourceCodes:
    LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_SOURCE_CODES,
  currency: 'USD',
  runtimeRegion: 'europe-west1',
  billingMode: 'instance_based',
  accelerator: 'nvidia_l4',
  zonalRedundancy: 'disabled',
  cloudStorageClass: 'regional_standard',
  rates: {
    perVcpuSecondUsdNanos: 18_000,
    perMemoryGibSecondUsdNanos: 2_000,
    perL4GpuSecondUsdNanos: 186_700,
    perTempStorageGibHourUsdNanos: 109_589,
    perOutputStorageGibHourUsdNanos: 27_397,
    perOutputClassAWriteUsdNanos: 5_000,
    perRequestUsdNanos: 0,
  },
  billingRules: {
    minimumBillableMillisecondsPerAttempt: 60_000,
    roundingIncrementMilliseconds: 100,
    minimumVcpuCount: 4,
    minimumMemoryGib: 16,
    gpuCountPerInstance: 1,
    freeTierApplied: false,
    committedUseDiscountApplied: false,
    billingAccountDiscountApplied: false,
  },
  exclusions: {
    networkEgress: 'same_region_assumed_zero',
    classBReads: 'not_included_requires_actual_usage',
    artifactRegistry:
      'not_included_requires_shared_runtime_usage',
    softDeleteAndVersionRetention:
      'not_included_requires_storage_policy',
    taxAndCurrencyConversion:
      'not_included_requires_billing_account',
  },
  publicListObservationOnly: true,
  currentPricingApiReReadRequired: true,
  billingAccountRateAuthority: false,
  productionRateAuthority: false,
  actualAttemptCostAuthority: false,
  invoiceReconciliationAuthority: false,
  customerEstimateAuthority: false,
  customerPriceAuthority: false,
  creditAuthority: false,
  serviceFeeAuthority: false,
  approvalAuthority: false,
  reservationAuthority: false,
  walletAuthority: false,
  runtimeAuthority: false,
  productionAuthority: false,
} as const satisfies Omit<
  LivingFrameCloudRunL4PublicRateObservation,
  'observationDigest'
>

const OBSERVATION_DIGEST =
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_DIGEST

if (
  sha256CanonicalJson(OBSERVATION_WITHOUT_DIGEST)
  !== OBSERVATION_DIGEST
) {
  throw invalid(
    'Living Frame Cloud Run L4 public-rate observation changed without a new version and digest.',
  )
}

export const LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION =
  deepFreeze({
    ...OBSERVATION_WITHOUT_DIGEST,
    observationDigest: OBSERVATION_DIGEST,
  }) satisfies LivingFrameCloudRunL4PublicRateObservation

export function calculateLivingFrameCloudRunL4PublicListEstimate(
  input: LivingFrameCloudRunL4EstimateInput,
): LivingFrameCloudRunL4EstimateCalculation {
  assertEstimateInput(input)
  const observation =
    LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION
  const billableMillisecondsPerAttempt = Math.max(
    observation.billingRules
      .minimumBillableMillisecondsPerAttempt,
    roundUp(
      input.perAttemptWallTimeMilliseconds,
      observation.billingRules.roundingIncrementMilliseconds,
    ),
  )
  const totalBillableMilliseconds =
    billableMillisecondsPerAttempt
    * input.attemptCount
  if (!Number.isSafeInteger(totalBillableMilliseconds)) {
    throw invalid(
      'Living Frame Cloud Run L4 billable duration exceeds safe integer bounds.',
    )
  }

  const totalBillableMillisecondsBigInt =
    BigInt(totalBillableMilliseconds)
  const rates = observation.rates
  const cpu = ceilDivide(
    BigInt(input.vcpuCount)
      * totalBillableMillisecondsBigInt
      * BigInt(rates.perVcpuSecondUsdNanos),
    MILLISECONDS_PER_SECOND,
  )
  const memory = ceilDivide(
    BigInt(input.memoryGib)
      * totalBillableMillisecondsBigInt
      * BigInt(rates.perMemoryGibSecondUsdNanos),
    MILLISECONDS_PER_SECOND,
  )
  const gpu = ceilDivide(
    BigInt(input.gpuCount)
      * totalBillableMillisecondsBigInt
      * BigInt(rates.perL4GpuSecondUsdNanos),
    MILLISECONDS_PER_SECOND,
  )
  const tempStorage = ceilDivide(
    BigInt(input.tempStorageGib)
      * totalBillableMillisecondsBigInt
      * BigInt(rates.perTempStorageGibHourUsdNanos),
    MILLISECONDS_PER_HOUR,
  )
  const outputStorage = ceilDivide(
    BigInt(input.outputArtifactCount)
      * BigInt(input.outputMibPerArtifact)
      * BigInt(input.outputRetentionHours)
      * BigInt(rates.perOutputStorageGibHourUsdNanos),
    MIB_PER_GIB,
  )
  const outputClassAWrites =
    BigInt(input.outputArtifactCount)
    * BigInt(rates.perOutputClassAWriteUsdNanos)
  const requests = 0n
  const expectedInternalCostUsdNanos =
    cpu
    + memory
    + gpu
    + tempStorage
    + outputStorage
    + outputClassAWrites
    + requests
  const expectedInternalCostMicros = ceilDivide(
    expectedInternalCostUsdNanos,
    USD_NANOS_PER_MICRO,
  )

  return deepFreeze({
    rateBasisVersion:
      LIVING_FRAME_CLOUD_RUN_L4_ESTIMATE_RATE_BASIS_VERSION,
    rateObservationDigest:
      observation.observationDigest,
    attemptCount: input.attemptCount,
    perAttemptWallTimeMilliseconds:
      input.perAttemptWallTimeMilliseconds,
    billableMillisecondsPerAttempt,
    totalBillableMilliseconds,
    breakdownUsdNanos: {
      cpu: toSafeNumber(cpu, 'CPU cost'),
      memory: toSafeNumber(memory, 'memory cost'),
      gpu: toSafeNumber(gpu, 'GPU cost'),
      tempStorage:
        toSafeNumber(tempStorage, 'temporary-storage cost'),
      outputStorage:
        toSafeNumber(outputStorage, 'output-storage cost'),
      outputClassAWrites:
        toSafeNumber(
          outputClassAWrites,
          'output Class A operation cost',
        ),
      requests: 0,
    },
    expectedInternalCostUsdNanos:
      toSafeNumber(
        expectedInternalCostUsdNanos,
        'aggregate internal cost',
      ),
    expectedInternalCostMicros:
      toSafeNumber(
        expectedInternalCostMicros,
        'aggregate internal cost in USD micros',
      ),
    aggregateThenRoundToMicros: true,
    syntheticRenderChargeIncluded: false,
    serviceFeeIncluded: false,
    freeTierApplied: false,
    discountApplied: false,
    productionRateAuthority: false,
    actualAttemptCostAuthority: false,
    customerEstimateAuthority: false,
    customerPriceAuthority: false,
    creditAuthority: false,
    serviceFeeAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })
}

export function verifyLivingFrameCloudRunL4PublicRateObservation(): boolean {
  return (
    LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION
      .observationDigest
    === sha256CanonicalJson(OBSERVATION_WITHOUT_DIGEST)
  )
}

function assertEstimateInput(
  input: LivingFrameCloudRunL4EstimateInput,
): void {
  const rules =
    LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION
      .billingRules
  if (
    !isIntegerInRange(
      input.attemptCount,
      1,
      MAX_ATTEMPT_COUNT,
    )
    || !isIntegerInRange(
      input.perAttemptWallTimeMilliseconds,
      1,
      MAX_ATTEMPT_WALL_TIME_MILLISECONDS,
    )
    || !isIntegerInRange(
      input.vcpuCount,
      rules.minimumVcpuCount,
      MAX_VCPU_COUNT,
    )
    || !isIntegerInRange(
      input.memoryGib,
      rules.minimumMemoryGib,
      MAX_MEMORY_GIB,
    )
    || input.gpuCount
      !== rules.gpuCountPerInstance
    || !isIntegerInRange(
      input.tempStorageGib,
      0,
      MAX_TEMP_STORAGE_GIB,
    )
    || !isIntegerInRange(
      input.outputArtifactCount,
      0,
      MAX_OUTPUT_ARTIFACT_COUNT,
    )
    || !isIntegerInRange(
      input.outputMibPerArtifact,
      input.outputArtifactCount === 0 ? 0 : 1,
      MAX_OUTPUT_MIB_PER_ARTIFACT,
    )
    || !isIntegerInRange(
      input.outputRetentionHours,
      input.outputArtifactCount === 0 ? 0 : 1,
      MAX_OUTPUT_RETENTION_HOURS,
    )
    || (
      input.outputArtifactCount === 0
      && (
        input.outputMibPerArtifact !== 0
        || input.outputRetentionHours !== 0
      )
    )
  ) {
    throw invalid(
      'Living Frame Cloud Run L4 estimate input is invalid.',
    )
  }
}

function isIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
): boolean {
  return Number.isSafeInteger(value)
    && value >= minimum
    && value <= maximum
}

function roundUp(
  value: number,
  increment: number,
): number {
  return Math.ceil(value / increment) * increment
}

function ceilDivide(
  numerator: bigint,
  denominator: bigint,
): bigint {
  if (numerator === 0n) return 0n
  return (numerator + denominator - 1n) / denominator
}

function toSafeNumber(
  value: bigint,
  label: string,
): number {
  const numberValue = Number(value)
  if (
    !Number.isSafeInteger(numberValue)
    || numberValue < 0
  ) {
    throw invalid(
      `Living Frame Cloud Run L4 ${label} exceeds safe integer bounds.`,
    )
  }
  return numberValue
}

function sha256CanonicalJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value), 'utf8')
    .digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(message: string): ApiError {
  return new ApiError(
    'CREDIT_ESTIMATE_NOT_APPROVED',
    message,
    409,
  )
}
