import assert from 'node:assert/strict'

import {
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_DIGEST,
} from '../../src/types/living-frame-cloud-run-l4-rate-observation'
import {
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION,
  calculateLivingFrameCloudRunL4PublicListEstimate,
  verifyLivingFrameCloudRunL4PublicRateObservation,
} from '../living-frame/living-frame-cloud-run-l4-rate-observation'

const observation =
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION

assert.equal(
  observation.evidenceClass,
  'dated_public_list_price_observation_non_authoritative',
)
assert.equal(observation.observedDate, '2026-07-29')
assert.equal(observation.runtimeRegion, 'europe-west1')
assert.equal(observation.accelerator, 'nvidia_l4')
assert.equal(observation.rates.perVcpuSecondUsdNanos, 18_000)
assert.equal(
  observation.rates.perMemoryGibSecondUsdNanos,
  2_000,
)
assert.equal(
  observation.rates.perL4GpuSecondUsdNanos,
  186_700,
)
assert.equal(
  observation.rates.perTempStorageGibHourUsdNanos,
  109_589,
)
assert.equal(
  observation.rates.perOutputStorageGibHourUsdNanos,
  27_397,
)
assert.equal(
  observation.rates.perOutputClassAWriteUsdNanos,
  5_000,
)
assert.equal(
  observation.billingRules
    .minimumBillableMillisecondsPerAttempt,
  60_000,
)
assert.equal(
  observation.billingRules.roundingIncrementMilliseconds,
  100,
)
assert.equal(verifyLivingFrameCloudRunL4PublicRateObservation(), true)
assert.equal(
  observation.observationDigest,
  LIVING_FRAME_CLOUD_RUN_L4_PUBLIC_RATE_OBSERVATION_DIGEST,
)

const oneAttempt =
  calculateLivingFrameCloudRunL4PublicListEstimate({
    attemptCount: 1,
    perAttemptWallTimeMilliseconds: 90_000,
    vcpuCount: 8,
    memoryGib: 32,
    gpuCount: 1,
    tempStorageGib: 2,
    outputArtifactCount: 1,
    outputMibPerArtifact: 100,
    outputRetentionHours: 24,
  })

assert.equal(oneAttempt.billableMillisecondsPerAttempt, 90_000)
assert.equal(oneAttempt.totalBillableMilliseconds, 90_000)
assert.deepEqual(oneAttempt.breakdownUsdNanos, {
  cpu: 12_960_000,
  memory: 5_760_000,
  gpu: 16_803_000,
  tempStorage: 5_480,
  outputStorage: 64_212,
  outputClassAWrites: 5_000,
  requests: 0,
})
assert.equal(
  oneAttempt.expectedInternalCostUsdNanos,
  35_597_692,
)
assert.equal(oneAttempt.expectedInternalCostMicros, 35_598)
assert.equal(oneAttempt.syntheticRenderChargeIncluded, false)
assert.equal(oneAttempt.aggregateThenRoundToMicros, true)
assert.equal(oneAttempt.serviceFeeIncluded, false)
assert.equal(oneAttempt.productionRateAuthority, false)
assert.equal(oneAttempt.customerPriceAuthority, false)
assert.equal(oneAttempt.creditAuthority, false)
assert.equal(oneAttempt.runtimeAuthority, false)

const premiumBundle =
  calculateLivingFrameCloudRunL4PublicListEstimate({
    attemptCount: 4,
    perAttemptWallTimeMilliseconds: 90_000,
    vcpuCount: 8,
    memoryGib: 32,
    gpuCount: 1,
    tempStorageGib: 2,
    outputArtifactCount: 2,
    outputMibPerArtifact: 100,
    outputRetentionHours: 24,
  })
assert.equal(premiumBundle.totalBillableMilliseconds, 360_000)
assert.equal(
  premiumBundle.expectedInternalCostUsdNanos,
  142_252_342,
)
assert.equal(
  premiumBundle.expectedInternalCostMicros,
  142_253,
)
assert.equal(
  premiumBundle.rateObservationDigest,
  observation.observationDigest,
)

const minimumPerAttempt =
  calculateLivingFrameCloudRunL4PublicListEstimate({
    attemptCount: 2,
    perAttemptWallTimeMilliseconds: 1_000,
    vcpuCount: 4,
    memoryGib: 16,
    gpuCount: 1,
    tempStorageGib: 0,
    outputArtifactCount: 0,
    outputMibPerArtifact: 0,
    outputRetentionHours: 0,
  })
assert.equal(
  minimumPerAttempt.billableMillisecondsPerAttempt,
  60_000,
)
assert.equal(
  minimumPerAttempt.totalBillableMilliseconds,
  120_000,
)

const roundedAttempt =
  calculateLivingFrameCloudRunL4PublicListEstimate({
    attemptCount: 1,
    perAttemptWallTimeMilliseconds: 60_001,
    vcpuCount: 4,
    memoryGib: 16,
    gpuCount: 1,
    tempStorageGib: 0,
    outputArtifactCount: 0,
    outputMibPerArtifact: 0,
    outputRetentionHours: 0,
  })
assert.equal(
  roundedAttempt.billableMillisecondsPerAttempt,
  60_100,
)

for (const invalidInput of [
  {
    attemptCount: 0,
    perAttemptWallTimeMilliseconds: 90_000,
    vcpuCount: 8,
    memoryGib: 32,
    gpuCount: 1,
    tempStorageGib: 2,
    outputArtifactCount: 1,
    outputMibPerArtifact: 100,
    outputRetentionHours: 24,
  },
  {
    attemptCount: 1,
    perAttemptWallTimeMilliseconds: 90_000,
    vcpuCount: 3,
    memoryGib: 32,
    gpuCount: 1,
    tempStorageGib: 2,
    outputArtifactCount: 1,
    outputMibPerArtifact: 100,
    outputRetentionHours: 24,
  },
  {
    attemptCount: 1,
    perAttemptWallTimeMilliseconds: 90_000,
    vcpuCount: 8,
    memoryGib: 15,
    gpuCount: 1,
    tempStorageGib: 2,
    outputArtifactCount: 1,
    outputMibPerArtifact: 100,
    outputRetentionHours: 24,
  },
  {
    attemptCount: 1,
    perAttemptWallTimeMilliseconds: 90_000,
    vcpuCount: 8,
    memoryGib: 32,
    gpuCount: 1,
    tempStorageGib: 2,
    outputArtifactCount: 0,
    outputMibPerArtifact: 100,
    outputRetentionHours: 24,
  },
] as const) {
  assert.throws(() =>
    calculateLivingFrameCloudRunL4PublicListEstimate(
      invalidInput,
    ),
  )
}

assert.deepEqual(
  Object.values({
    billingAccountRateAuthority:
      observation.billingAccountRateAuthority,
    productionRateAuthority:
      observation.productionRateAuthority,
    actualAttemptCostAuthority:
      observation.actualAttemptCostAuthority,
    invoiceReconciliationAuthority:
      observation.invoiceReconciliationAuthority,
    customerEstimateAuthority:
      observation.customerEstimateAuthority,
    customerPriceAuthority:
      observation.customerPriceAuthority,
    creditAuthority: observation.creditAuthority,
    serviceFeeAuthority:
      observation.serviceFeeAuthority,
    approvalAuthority: observation.approvalAuthority,
    reservationAuthority: observation.reservationAuthority,
    walletAuthority: observation.walletAuthority,
    runtimeAuthority: observation.runtimeAuthority,
    productionAuthority: observation.productionAuthority,
  }),
  Array.from({ length: 13 }, () => false),
)

console.log(
  'Living Frame Cloud Run L4 public-rate observation passed exact public-list unit math, per-attempt billing minimum/rounding, storage/write attribution, adversarial bounds, no synthetic render charge, and non-authority checks.',
)
