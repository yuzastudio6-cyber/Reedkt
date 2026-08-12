import assert from 'node:assert/strict'

import {
  CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION,
  CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
  canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  assertCanonicalSam31VertexServingWindowCostReceipt,
  assertCanonicalSam31VertexServingWindowUsage,
  calculateCanonicalSam31VertexServingWindowCost,
  createCanonicalSam31VertexServingWindowCostReceipt,
  createCanonicalSam31VertexServingWindowUsage,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-window-cost-authority'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = (id: string, character: string, version = 1) => ({
  id, version, contentHash: hash(character),
})
const RATE = 3_600_000_000
const ratePayload = {
  schemaVersion:
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION,
  source:
    'server_owned_current_google_cloud_vertex_a100_serving_billing_reread' as const,
  rateAuthorityId: 'vertex-a100-serving-rate-smoke',
  rateAuthorityVersion: 1,
  routeId: 'a100_80gb_heavy_primary' as const,
  profileId: 'quality_a100_80gb_scale_zero_serving_v1' as const,
  routeRole: 'heavy_primary' as const,
  executionTarget:
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
  endpointId: 'weeditpro-sam31-a100-scale-zero-v1' as const,
  machineType: 'a2-ultragpu-1g' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  acceleratorCount: 1 as const,
  allocatedVcpuCount: 12 as const,
  allocatedMemoryGiB: 170 as const,
  minimumReplicaCount: 0 as const,
  maximumReplicaCount: 1 as const,
  pricingModel: 'vertex_ai_online_prediction_on_demand_payg' as const,
  pricingSetMode:
    'vertex_online_prediction_usage_plus_management_skus' as const,
  predictionUsageSkuSetIncluded: true as const,
  vertexManagementFeeSkuSetIncluded: true as const,
  trainingOrCustomJobSkuSetIncluded: false as const,
  computeEngineVmSkuSetIncluded: false as const,
  mixedOrDoubleCountedPricingSetAccepted: false as const,
  region: 'us-central1' as const,
  currency: 'USD' as const,
  sourceClass: 'billing_account_effective_pricing_api' as const,
  billingAccountPricingScopeRef: ref('billing-scope', 'a'),
  pricingReaderConfigurationRef: ref('serving-reader', 'b'),
  components: CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES.map(
    (componentClass, index) => ({
      componentClass,
      cloudServiceName: 'services.aiplatform.googleapis.com',
      skuRateBindingId: `serving-rate-binding-${index}`,
      skuPriceTerm: {
        cloudServiceId: 'services.aiplatform.googleapis.com',
        skuId: `SERVING-SKU-${index}`,
        consumptionModel: 'on_demand',
        apiUnit: componentClass.includes('ram')
          ? 'GiBy.h' as const
          : componentClass === 'private_object_storage_gib_month'
            ? 'GiBy.mo' as const
            : componentClass === 'network_egress_gib'
              ? 'GiBy' as const
              : componentClass.includes('operations')
                ? 'count' as const
                : 'h' as const,
        apiUnitQuantity: componentClass.includes('operations')
          ? '1000' as const
          : '1' as const,
        contractPriceTiers: [{
          startAmount: '0',
          contractPriceUsdNanos: RATE,
        }],
        maximumContractPriceUsdNanos: RATE,
        skuMetadataRef: ref(`sku-metadata-${index}`, 'c'),
        billingAccountPriceRef: ref(`account-price-${index}`, 'd'),
      },
      skuDescriptionDigestSha256: 'e'.repeat(64),
      skuRegion: 'us-central1' as const,
      billingUnit: componentClass === 'vertex_prediction_a100_80gb_hour'
        ? 'gpu_hour' as const
        : componentClass.includes('core_hour')
          ? 'vcpu_hour' as const
          : componentClass.includes('ram_gib_hour')
            ? 'gib_hour' as const
            : componentClass === 'private_object_storage_gib_month'
              ? 'gib_month' as const
              : componentClass === 'network_egress_gib'
                ? 'gib' as const
                : 'per_1000_operations' as const,
      maximumUsdNanosPerBillingUnit: RATE,
      currentPriceObservedAt: '2026-08-11T12:00:01.000Z',
      skuRecordRef: ref(`sku-record-${index}`, 'f'),
    })),
  pricingReadStartedAt: '2026-08-11T12:00:00.000Z',
  pricingReadFinishedAt: '2026-08-11T12:00:01.000Z',
  pricingReadDigestSha256: '1'.repeat(64),
  priceRecordSetRef: ref('price-record-set', '2'),
  observedAt: '2026-08-11T12:00:01.000Z',
  expiresAt: '2026-08-12T12:00:01.000Z',
  maximumAuthorityAgeSeconds: 86_400 as const,
  minimumWarmBillingWindowSeconds: 300 as const,
  exactSkuRegionCurrencyTierAndCurrentAccountPriceReread: true as const,
  estimateMustIncludeColdLoadActivePersistenceAndIdleWindow: true as const,
  actualAttemptCostRequiresEndpointUsageAndBillingReread: true as const,
  customerPricingOrServiceFeeAuthorityGranted: false as const,
  walletOrCreditMutationAuthorityGranted: false as const,
  endpointOrGpuJobStarted: false as const,
  publicDeliveryAuthorityGranted: false as const,
  productionAuthorityGranted: false as const,
}
const rateAuthority = canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema
  .parse({
    ...ratePayload,
    rateAuthorityHash: sha256AuthorityValue(ratePayload),
  })

const completedAttempt = {
  workspaceId: 'workspace-a',
  projectId: 'project-a',
  editSessionId: 'session-a',
  editPlanId: 'plan-a',
  editPlanVersion: 1,
  executionAttemptRef: ref('attempt-a', '3'),
  approvedSnapshotRef: ref('snapshot-a', '4'),
  approvedWorkItemRef: ref('work-a', '5'),
  workerLeaseRef: ref('lease-a', '6'),
  fundedReservationRef: ref('reservation-a', '7'),
  approvedEstimateRef: ref('estimate-a', '8'),
  userApprovalRecordRef: ref('approval-a', '9'),
  userTriggerRecordRef: ref('trigger-a', 'a'),
  requestStartedAt: '2026-08-11T12:02:10.000Z',
  responseCompletedAt: '2026-08-11T12:02:11.000Z',
  activeRequestMilliseconds: 1_000,
  terminalOutcome: 'completed' as const,
  providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
  approvedReservedToolCostCredits: 100,
  exactApprovedPlanReservationLeaseTriggerAndAttemptReread: true as const,
  callerSuppliedOutcomeUsageOrPricingAccepted: false as const,
}
const failedAttempt = {
  ...completedAttempt,
  workspaceId: 'workspace-b',
  projectId: 'project-b',
  editSessionId: 'session-b',
  editPlanId: 'plan-b',
  executionAttemptRef: ref('attempt-b', 'b'),
  approvedSnapshotRef: ref('snapshot-b', 'c'),
  approvedWorkItemRef: ref('work-b', 'd'),
  workerLeaseRef: ref('lease-b', 'e'),
  fundedReservationRef: ref('reservation-b', 'f'),
  approvedEstimateRef: ref('estimate-b', '1'),
  userApprovalRecordRef: ref('approval-b', '2'),
  userTriggerRecordRef: ref('trigger-b', '3'),
  requestStartedAt: '2026-08-11T12:02:12.000Z',
  responseCompletedAt: '2026-08-11T12:02:14.000Z',
  activeRequestMilliseconds: 2_000,
  terminalOutcome: 'weeditpro_failed' as const,
  providerInferenceOrSubstantiveWorkOutcome: 'not_executed' as const,
  approvedReservedToolCostCredits: 2_000,
}
const usage = createCanonicalSam31VertexServingWindowUsage({
  allocationWindowId: 'sam31-serving-window-smoke-1',
  endpointDeploymentRef: ref('sam31-serving-deployment', '4'),
  scaleUpTriggeredAt: '2026-08-11T12:00:00.000Z',
  billableAllocationStartedAt: '2026-08-11T12:00:00.000Z',
  endpointReadyAt: '2026-08-11T12:02:00.000Z',
  billableAllocationEndedAt: '2026-08-11T12:05:00.000Z',
  attempts: [failedAttempt, completedAttempt],
  privateArtifactBytes: 1_073_741_824,
  privateArtifactRetentionMilliseconds: 2_592_000_000,
  networkEgressBytes: 1_073_741_824,
  classAOperationCount: 1_000,
  classBOperationCount: 1_000,
  endpointMonitoringUsageRef: ref('endpoint-monitoring', '5'),
  cloudBillingUsageExportRef: ref('billing-usage-export', '6'),
  observedAt: '2026-08-11T12:05:30.000Z',
})
assert.deepEqual(assertCanonicalSam31VertexServingWindowUsage(usage), usage)
assert.deepEqual(usage.attempts.map((attempt) =>
  attempt.executionAttemptRef.id), ['attempt-a', 'attempt-b'])
assert.equal(usage.coldStartMilliseconds, 120_000)
assert.equal(usage.allocatedMilliseconds, 300_000)
assert.equal(usage.billableDurationMilliseconds, 300_000)
assert.equal(usage.activeRequestMilliseconds, 3_000)
assert.equal(usage.nonRequestAllocatedMilliseconds, 297_000)

const cost = calculateCanonicalSam31VertexServingWindowCost({
  rateAuthority,
  usage,
  at: '2026-08-11T12:06:00.000Z',
})
assert.equal(cost.vertexPredictionA10080GbUsdNanos, 300_000_000)
assert.equal(cost.vertexPredictionA2CoreUsdNanos, 3_600_000_000)
assert.equal(cost.vertexPredictionA2RamUsdNanos, 51_000_000_000)
assert.equal(cost.vertexManagementA2CoreUsdNanos, 3_600_000_000)
assert.equal(cost.vertexManagementA2RamUsdNanos, 51_000_000_000)
assert.equal(cost.totalInfrastructureCostUsdNanos, 123_900_000_000)

const receipt = createCanonicalSam31VertexServingWindowCostReceipt({
  receiptId: 'sam31-serving-window-cost-smoke-1',
  usage,
  rateAuthority,
  recordedAt: '2026-08-11T12:06:00.000Z',
})
assert.deepEqual(
  assertCanonicalSam31VertexServingWindowCostReceipt(receipt),
  receipt,
)
assert.equal(receipt.attemptAllocations[0]
  ?.allocatedInfrastructureCostUsdNanos, 41_300_000_000)
assert.equal(receipt.attemptAllocations[0]
  ?.customerEligibleInfrastructureCostUsdNanos, 10_000_000_000)
assert.equal(receipt.attemptAllocations[0]
  ?.customerEligibleToolCostCredits, 100)
assert.equal(receipt.attemptAllocations[0]
  ?.weeditproAbsorbedInfrastructureCostUsdNanos, 31_300_000_000)
assert.equal(receipt.attemptAllocations[1]
  ?.allocatedInfrastructureCostUsdNanos, 82_600_000_000)
assert.equal(receipt.attemptAllocations[1]
  ?.customerEligibleToolCostCredits, 0)
assert.equal(receipt.totalCustomerEligibleToolCostCredits, 100)
assert.equal(receipt.totalWeEditProAbsorbedInfrastructureCostUsdNanos,
  113_900_000_000)
assert.equal(receipt.serviceFeeIncluded, false)
assert.equal(receipt.customerWalletOrLedgerMutationPerformed, false)

const tampered = structuredClone(receipt)
tampered.totalCustomerEligibleToolCostCredits += 1
assert.throws(() =>
  assertCanonicalSam31VertexServingWindowCostReceipt(tampered))
assert.throws(() => createCanonicalSam31VertexServingWindowUsage({
  ...usage,
  attempts: [{
    ...failedAttempt,
    requestStartedAt: '2026-08-11T12:02:10.500Z',
  }, completedAttempt],
}))
assert.throws(() => createCanonicalSam31VertexServingWindowUsage({
  ...usage,
  attempts: [{
    ...failedAttempt,
    terminalOutcome: 'completed',
  }],
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-window-cost-authority',
  checks: 34,
  oneClosedScaleZeroWindowChargedOnce: true,
  predictionAndManagementSkusIncluded: true,
  trainingAndComputeSkusExcluded: true,
  multipleAttemptsAllocatedByMeasuredActiveDuration: true,
  failedAttemptCustomerChargeCredits: 0,
  unapprovedOverageAbsorbedByWeEditPro: true,
  serviceFeeIncluded: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
