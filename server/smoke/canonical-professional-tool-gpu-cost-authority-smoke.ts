import assert from 'node:assert/strict'

import {
  assertCanonicalProfessionalToolGpuAttemptCostReceipt,
  assertCanonicalProfessionalToolGpuCostEstimate,
  createCanonicalProfessionalToolGpuAttemptCostReceipt,
  createCanonicalProfessionalToolGpuCostEstimate,
  type CanonicalProfessionalToolGpuUsage,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const observedAt = '2026-08-02T16:00:00.000Z'
const startedAt = '2026-08-02T16:10:00.000Z'
const recordedAt = '2026-08-02T16:20:00.000Z'
const hash = (character: string) => character.repeat(64)
const ref = (id: string, character: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${hash(character)}`,
})

export const a100 = await observe('a100_80gb_heavy_primary')
export const l4Fallback = await observe('l4_heavy_fallback')
const l4Standard = await observe('l4_standard_primary')
const l4FallbackOtherBillingAccount = await observe(
  'l4_heavy_fallback',
  '6',
)
const l4FallbackOtherReader = await observe(
  'l4_heavy_fallback',
  '8',
  '5',
)

const heavyEstimate = createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'estimate-sam3-1-v1',
  scope: scope('sam3_1'),
  primaryRateAuthority: a100,
  primaryUsageRange: range('a100', 60_000, 120_000, 240_000),
  fallbackRateAuthority: l4Fallback,
  fallbackUsageRange: range('l4', 120_000, 240_000, 420_000),
  primaryPreInferenceFailureHighUsage: usage('a100', 0),
  createdAt: startedAt,
})
assert.equal(heavyEstimate.placementClass,
  'a100_80gb_heavy_primary_l4_fallback')
assert.equal(heavyEstimate.primary.routeId, 'a100_80gb_heavy_primary')
assert.equal(heavyEstimate.fallback?.routeId, 'l4_heavy_fallback')
assert.equal(heavyEstimate.serviceFeeIncluded, false)
assert.equal(heavyEstimate.modelOrOperationCostProfileId,
  'sam3_1_multiplex_video_segmentation_v1')
assert.equal(heavyEstimate.runtimeAdmissionGranted, false)
assert.ok(heavyEstimate.maximumReservedToolCostCredits > 0)
assert.ok(heavyEstimate.maximumPlatformInfrastructureRiskUsdNanos >=
  heavyEstimate.maximumCustomerEligibleToolCostUsdNanos)

const standardEstimate = createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'estimate-ffmpeg-v1',
  scope: scope('ffmpeg'),
  primaryRateAuthority: l4Standard,
  primaryUsageRange: range('l4', 30_000, 60_000, 90_000),
  createdAt: startedAt,
})
assert.equal(standardEstimate.placementClass, 'l4_standard_gpu_primary')
assert.equal(standardEstimate.primary.routeId, 'l4_standard_primary')
assert.equal(standardEstimate.fallback, null)
assert.equal(standardEstimate.modelOrOperationCostProfileId,
  'l4_standard_media_render_and_qa_v1')
assert.ok(standardEstimate.primary.high.cost.vcpuUsdNanos > 0)
assert.ok(standardEstimate.primary.high.cost.memoryUsdNanos > 0)
assert.equal(heavyEstimate.primary.high.cost.vcpuUsdNanos, 0)
assert.equal(heavyEstimate.primary.high.cost.memoryUsdNanos, 0)

assert.throws(() => createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'estimate-control-invalid',
  scope: scope('duckdb'),
  primaryRateAuthority: l4Standard,
  primaryUsageRange: range('l4', 1_000, 2_000, 3_000),
  createdAt: startedAt,
}))
assert.throws(() => createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'estimate-cross-billing-account-invalid',
  scope: scope('sam3_1'),
  primaryRateAuthority: a100,
  primaryUsageRange: range('a100', 60_000, 120_000, 240_000),
  fallbackRateAuthority: l4FallbackOtherBillingAccount,
  fallbackUsageRange: range('l4', 120_000, 240_000, 420_000),
  primaryPreInferenceFailureHighUsage: usage('a100', 0),
  createdAt: startedAt,
}))
assert.throws(() => createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'estimate-cross-pricing-reader-invalid',
  scope: scope('sam3_1'),
  primaryRateAuthority: a100,
  primaryUsageRange: range('a100', 60_000, 120_000, 240_000),
  fallbackRateAuthority: l4FallbackOtherReader,
  fallbackUsageRange: range('l4', 120_000, 240_000, 420_000),
  primaryPreInferenceFailureHighUsage: usage('a100', 0),
  createdAt: startedAt,
}))
assert.throws(() => createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'estimate-historical-invalid',
  scope: scope('sam2'),
  primaryRateAuthority: a100,
  primaryUsageRange: range('a100', 1_000, 2_000, 3_000),
  createdAt: startedAt,
}))

const completed = createCanonicalProfessionalToolGpuAttemptCostReceipt({
  receiptId: 'receipt-ffmpeg-completed-v1',
  estimate: standardEstimate,
  ...runtimeRefs('1'),
  executionAttemptId: 'attempt-ffmpeg-1',
  routeId: 'l4_standard_primary',
  rateAuthority: l4Standard,
  workerUsageEvidenceRef: ref('worker-usage-ffmpeg', '5'),
  platformUsageRereadRef: ref('platform-usage-ffmpeg', '6'),
  providerOrModelInferenceOutcome: 'executed',
  actualUsage: usage('l4', 60_000),
  terminalOutcome: 'completed',
  attemptStartedAt: startedAt,
  recordedAt,
})
assert.ok(completed.customerEligibleToolCostCredits > 0)
assert.equal(completed.creditsRecommendedToHoldPendingReconciliation, 0)
assert.equal(completed.reservationResolution,
  'charge_eligible_and_release_unused')
assert.equal(completed.walletOrLedgerMutationPerformed, false)

assert.throws(() => createCanonicalProfessionalToolGpuAttemptCostReceipt({
  receiptId: 'receipt-ffmpeg-false-completion-v1',
  estimate: standardEstimate,
  ...runtimeRefs('9'),
  executionAttemptId: 'attempt-ffmpeg-false-completion-1',
  routeId: 'l4_standard_primary',
  rateAuthority: l4Standard,
  workerUsageEvidenceRef: ref('worker-usage-false-completion', '5'),
  platformUsageRereadRef: ref('platform-usage-false-completion', '6'),
  providerOrModelInferenceOutcome: 'not_executed',
  actualUsage: usage('l4', 60_000),
  terminalOutcome: 'completed',
  attemptStartedAt: startedAt,
  recordedAt,
}))

const failed = createCanonicalProfessionalToolGpuAttemptCostReceipt({
  receiptId: 'receipt-ffmpeg-failed-v1',
  estimate: standardEstimate,
  ...runtimeRefs('2'),
  executionAttemptId: 'attempt-ffmpeg-failed-1',
  routeId: 'l4_standard_primary',
  rateAuthority: l4Standard,
  workerUsageEvidenceRef: ref('worker-usage-ffmpeg-failed', '5'),
  platformUsageRereadRef: ref('platform-usage-ffmpeg-failed', '6'),
  providerOrModelInferenceOutcome: 'not_executed',
  actualUsage: usage('l4', 5_000),
  terminalOutcome: 'reeditpro_failed',
  attemptStartedAt: startedAt,
  recordedAt,
})
assert.equal(failed.customerEligibleToolCostCredits, 0)
assert.equal(failed.creditsRecommendedToReleaseOrRefund,
  standardEstimate.maximumReservedToolCostCredits)
assert.equal(failed.reeditproAbsorbedInfrastructureCostUsdNanos,
  failed.actualInfrastructureCost.totalInfrastructureCostUsdNanos)

const unknown = createCanonicalProfessionalToolGpuAttemptCostReceipt({
  receiptId: 'receipt-sam-unknown-v1',
  estimate: heavyEstimate,
  ...runtimeRefs('3'),
  executionAttemptId: 'attempt-sam-unknown-1',
  routeId: 'a100_80gb_heavy_primary',
  rateAuthority: a100,
  workerUsageEvidenceRef: ref('worker-usage-sam-unknown', '5'),
  platformUsageRereadRef: ref('platform-usage-sam-unknown', '6'),
  providerOrModelInferenceOutcome: 'unknown',
  actualUsage: usage('a100', 20_000),
  terminalOutcome: 'unknown_requires_reconciliation',
  attemptStartedAt: startedAt,
  recordedAt,
})
assert.equal(unknown.customerEligibleToolCostCredits, 0)
assert.equal(unknown.unknownOutcomeBlocksRetry, true)
assert.equal(unknown.creditsRecommendedToReleaseOrRefund, 0)
assert.equal(unknown.creditsRecommendedToHoldPendingReconciliation,
  heavyEstimate.maximumReservedToolCostCredits)

const fallback = createCanonicalProfessionalToolGpuAttemptCostReceipt({
  receiptId: 'receipt-sam-fallback-v1',
  estimate: heavyEstimate,
  ...runtimeRefs('4'),
  executionAttemptId: 'attempt-sam-fallback-2',
  routeId: 'l4_heavy_fallback',
  rateAuthority: l4Fallback,
  workerUsageEvidenceRef: ref('worker-usage-sam-fallback', '5'),
  platformUsageRereadRef: ref('platform-usage-sam-fallback', '6'),
  priorPrimaryFailureReceiptRef: ref('primary-safe-failure', '7'),
  priorPrimaryFailureClass:
    'a100_capacity_unavailable_before_attempt_start',
  providerOrModelInferenceOutcome: 'executed',
  actualUsage: usage('l4', 240_000),
  terminalOutcome: 'completed',
  attemptStartedAt: startedAt,
  recordedAt,
})
assert.equal(fallback.attemptOrdinal, 2)
assert.equal(fallback.routeId, 'l4_heavy_fallback')

assert.throws(() => createCanonicalProfessionalToolGpuAttemptCostReceipt({
  receiptId: 'receipt-sam-bad-fallback-v1',
  estimate: heavyEstimate,
  ...runtimeRefs('8'),
  executionAttemptId: 'attempt-sam-bad-fallback-2',
  routeId: 'l4_heavy_fallback',
  rateAuthority: l4Fallback,
  workerUsageEvidenceRef: ref('worker-usage-sam-bad-fallback', '5'),
  platformUsageRereadRef: ref('platform-usage-sam-bad-fallback', '6'),
  providerOrModelInferenceOutcome: 'executed',
  actualUsage: usage('l4', 240_000),
  terminalOutcome: 'completed',
  attemptStartedAt: startedAt,
  recordedAt,
}))

const tamperedEstimate = structuredClone(heavyEstimate)
tamperedEstimate.maximumReservedToolCostCredits += 1
assert.throws(() => assertCanonicalProfessionalToolGpuCostEstimate(
  tamperedEstimate,
))
const tamperedReceipt = structuredClone(completed)
tamperedReceipt.customerEligibleToolCostCredits = 0
assert.throws(() => assertCanonicalProfessionalToolGpuAttemptCostReceipt(
  tamperedReceipt,
))

console.log(JSON.stringify({
  smoke: 'canonical-professional-tool-gpu-cost-authority',
  checks: 37,
  heavyToolId: heavyEstimate.scope.toolId,
  standardToolId: standardEstimate.scope.toolId,
  heavyPrimaryRoute: heavyEstimate.primary.routeId,
  heavyFallbackRoute: heavyEstimate.fallback?.routeId,
  standardRoute: standardEstimate.primary.routeId,
  heavyReservedCredits: heavyEstimate.maximumReservedToolCostCredits,
  standardReservedCredits: standardEstimate.maximumReservedToolCostCredits,
  failedCustomerCredits: failed.customerEligibleToolCostCredits,
  unknownRetryBlocked: unknown.unknownOutcomeBlocksRetry,
  workerPricingAccepted: completed.workerSuppliedPricingAccepted,
  walletMutationPerformed: completed.walletOrLedgerMutationPerformed,
  estimateHashes: [heavyEstimate.estimateHash, standardEstimate.estimateHash],
  receiptHashes: [
    completed.receiptHash,
    failed.receiptHash,
    unknown.receiptHash,
    fallback.receiptHash,
  ],
}))

function scope(toolId: 'sam3_1' | 'ffmpeg' | 'duckdb' | 'sam2') {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersion: 1,
    editPlanHash: hash('a'),
    outputId: 'output-1',
    operationId: `operation-${toolId}`,
    plannedWorkItemRef: ref(`work-${toolId}`, 'b'),
    toolId,
    exactToolOrModelReleaseRef: ref(`release-${toolId}`, 'c'),
  }
}

function usage(
  route: 'a100' | 'l4',
  activeGpuMilliseconds: number,
): CanonicalProfessionalToolGpuUsage {
  const coldStartMilliseconds = 10_000
  const runtimeAndModelLoadMilliseconds = activeGpuMilliseconds === 0
    ? 0
    : 20_000
  const drainAndShutdownMilliseconds = 2_000
  return {
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds,
    totalBillableMilliseconds: coldStartMilliseconds
      + runtimeAndModelLoadMilliseconds
      + activeGpuMilliseconds
      + drainAndShutdownMilliseconds,
    allocatedGpuCount: 1,
    allocatedVcpuCount: route === 'a100' ? 12 : 8,
    allocatedMemoryGiB: route === 'a100' ? 170 : 32,
    allocatedLocalScratchGiB: route === 'a100' ? 375 : 0,
    privateArtifactBytes: 128 * 1024 * 1024,
    privateArtifactRetentionMilliseconds: 24 * 60 * 60 * 1_000,
    networkEgressBytes: 0,
    classAOperationCount: 4,
    classBOperationCount: 8,
  }
}

function range(
  route: 'a100' | 'l4',
  low: number,
  expected: number,
  high: number,
) {
  return {
    low: usage(route, low),
    expected: usage(route, expected),
    high: usage(route, high),
  }
}

function runtimeRefs(character: string) {
  return {
    approvedSnapshotRef: ref(`approved-snapshot-${character}`, '1'),
    approvalRecordRef: ref(`approval-${character}`, '2'),
    fundedReservationRef: ref(`reservation-${character}`, '3'),
  }
}

async function observe(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
  billingAccountCharacter = '8',
  readerCharacter = '7',
) {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: `current-rate-${routeId}-v1`,
    rateAuthorityVersion: 1,
    routeId,
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawObservation(
          routeId,
          billingAccountCharacter,
          readerCharacter,
        )
      },
    },
  })
}

function rawObservation(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
  billingAccountCharacter = '8',
  readerCharacter = '7',
): CanonicalGoogleCloudGpuRateRawObservation {
  const components = routeId === 'a100_80gb_heavy_primary'
    ? [
        component('a2_ultragpu_1g_machine_bundle',
          'machine_hour', 5_068_797_890, 'a'),
        ...commonComponents(),
      ]
    : [
        component('cloud_run_l4_gpu_second',
          'gpu_second', 186_700, 'b'),
        component('cloud_run_vcpu_second',
          'vcpu_second', 18_000, 'c'),
        component('cloud_run_memory_gib_second',
          'gib_second', 2_000, 'd'),
        ...commonComponents(),
      ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef:
      ref('billing-account-pricing-scope', billingAccountCharacter),
    pricingReaderConfigurationRef:
      ref('gpu-rate-reader-configuration', readerCharacter),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`, '9'),
    pricingReadStartedAt: '2026-08-02T15:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...base,
    pricingReadDigestSha256: sha256AuthorityValue(base),
  }
}

function commonComponents() {
  return [
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, 'e'),
    component('network_egress_gib',
      'gib', 120_000_000, 'f'),
    component('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '1'),
    component('object_class_b_per_1000',
      'per_1000_operations', 400_000, '2'),
  ]
}

function component(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  usdNanosPerBillingUnit: number,
  character: string,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run'
    : componentClass.startsWith('a2_')
      ? 'service-compute-engine'
      : 'service-cloud-storage'
  const skuId = `sku-${componentClass}`
  return {
    componentClass,
    cloudServiceName: componentClass.startsWith('cloud_run')
      ? 'cloud-run'
      : componentClass.startsWith('a2_')
        ? 'compute-engine'
        : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: usdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: usdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef:
        ref(`account-price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: usdNanosPerBillingUnit,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}
