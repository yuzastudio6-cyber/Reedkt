import assert from 'node:assert/strict'

import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalSam31L4QualificationAttemptCostReceipt,
  assertCanonicalSam31L4QualificationTerminalObservation,
  createCanonicalSam31L4QualificationAttemptCostReceipt,
  createCanonicalSam31L4QualificationAttemptCostRepository,
  sealCanonicalSam31L4QualificationTerminalObservation,
} from '../tool-cost-metering/canonical-sam3_1-l4-qualification-attempt-cost'
import {
  sealCanonicalSam31L4RuntimePrivateRunReceipt,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const observedAt = '2026-08-12T10:00:00.000Z'
const recordedAt = '2026-08-12T10:04:00.000Z'
const qualificationId = 'sam31-l4-cost-smoke'
const hash = (character: string) => character.repeat(64)
const ref = (id: string, character: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${hash(character)}` as const,
})
const rate = await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
  rateAuthorityId: 'current-rate-l4-heavy-fallback-v1',
  rateAuthorityVersion: 1,
  routeId: 'l4_heavy_fallback',
  region: 'us-central1',
  readPort: {
    async readCurrentRouteRate() {
      return rawRateObservation()
    },
  },
})
const run = sealCanonicalSam31L4RuntimePrivateRunReceipt({
  schemaVersion: 'canonical-sam3_1-l4-runtime-private-run-receipt-v3',
  source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
  evidenceClass: 'canonical_private_l4_cuda_execution_exact_reread',
  status: 'ready_for_terminal_cost_and_independent_mask_quality',
  qualificationId,
  runOrdinal: 1,
  admissionRef: ref('admission', '1'),
  admissionConsumptionRef: ref('consumption', '2'),
  executionEnvelopeRef: ref('envelope', '3'),
  taskRef: ref('task', '4'),
  launchRef: ref('launch', '5'),
  cloudRunOperationName:
    'projects/reeditpro/locations/us-central1/operations/operation-1',
  cloudRunExecutionResource:
    'projects/reeditpro/locations/us-central1/jobs/reeditpro-sam31-l4-fallback/executions/execution-1',
  currentL4FallbackRateAuthorityRef: {
    id: rate.rateAuthorityId,
    version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}`,
  },
  qualifiedA100ServingQualificationRef: ref('a100-qualification', '6'),
  runtimeCandidateReleaseRef: ref('runtime-candidate', '7'),
  checkpointPromotionRef: ref('checkpoint-promotion', '8'),
  runtimeResponseRef: ref('runtime-response', '9'),
  privateOutputRereadEvidenceRef: ref('output-reread', 'a'),
  semanticManifestRef: ref('semantic-manifest', 'b'),
  crossAcceleratorMaskComparisonRef: ref('mask-comparison', 'c'),
  semanticMaskSetDigestSha256: hash('d'),
  immutableImageDigest: `sha256:${hash('e')}`,
  observedAccelerator: 'nvidia_l4',
  observedDriverVersion: '570.124.06',
  observedCudaRuntimeVersion: '12.8',
  wallTimeMilliseconds: 100_000,
  cudaEventInferenceMilliseconds: 72_000,
  privateInputByteLength: 10_000_000,
  workerOutputByteLength: 20_000_000,
  manifestByteLength: 50_000,
  combinedMaskByteLength: 19_000_000,
  propagatedFrameCount: 200,
  losslessMaskPngCount: 400,
  scaleFromZeroObserved: true,
  terminalWorkerStoppedAndScaleBackToZeroVerified: true,
  exactTaskResponseAndEveryOutputMaskReread: true,
  exactFrameObjectAndMaskDimensionsMatchA100ServingQualification: true,
  crossAcceleratorBoxGeometryCompatibilityPassed: true,
  crossAcceleratorPixelComparisonPassed: true,
  semanticMaskSetByteIdentityWithA100ServingBaseline: false,
  qualityEqualToOrBetterThanA100BaselineClaimed: false,
  accountEffectiveRateRereadBeforeDispatch: true,
  terminalPlatformUsageAndCostReceiptPending: true,
  independentTemporalMaskQualityPending: true,
  runtimeReleaseGranted: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  completedAt: '2026-08-12T10:03:31.000Z',
})
const terminal = sealCanonicalSam31L4QualificationTerminalObservation({
  schemaVersion:
    'canonical-sam3_1-l4-qualification-terminal-observation-v1',
  source: 'google_cloud_run_v2_terminal_execution_exact_reread',
  evidenceClass: 'canonical_private_reread',
  qualificationId,
  runOrdinal: 1,
  cloudRunOperationResource: run.cloudRunOperationName,
  cloudRunExecutionResource: run.cloudRunExecutionResource,
  executionCreateTime: '2026-08-12T10:01:00.000Z',
  executionStartTime: '2026-08-12T10:01:10.000Z',
  executionCompletionTime: '2026-08-12T10:03:30.000Z',
  taskCount: 1,
  runningCount: 0,
  succeededCount: 1,
  failedCount: 0,
  cancelledCount: 0,
  retriedCount: 0,
  reconciling: false,
  operationDone: true,
  exactOperationAndExecutionReread: true,
  terminalWorkerStopped: true,
  activeGpuInstancesAfterTerminal: 0,
  scaleBackToZeroVerified: true,
  callerTerminalFieldsAccepted: false,
  observedAt: '2026-08-12T10:03:45.000Z',
})
const receipt = createCanonicalSam31L4QualificationAttemptCostReceipt({
  receiptId: 'sam31-l4-cost-smoke-run-01',
  runReceipt: run,
  terminalObservation: terminal,
  currentRateAuthority: rate,
  recordedAt,
})

assert.equal(receipt.actualUsage.totalBillableMilliseconds, 150_000)
assert.equal(receipt.actualUsage.coldStartMilliseconds, 10_000)
assert.equal(receipt.actualUsage.activeGpuMilliseconds, 100_000)
assert.equal(receipt.actualUsage.drainAndShutdownMilliseconds, 40_000)
assert.equal(receipt.actualUsage.allocatedGpuCount, 1)
assert.equal(receipt.actualUsage.allocatedVcpuCount, 8)
assert.equal(receipt.actualUsage.allocatedMemoryGiB, 32)
assert.equal(receipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos > 0, true)
assert.equal(receipt.customerEligibleInfrastructureCostUsdNanos, 0)
assert.equal(receipt.customerEligibleToolCostCredits, 0)
assert.equal(receipt.customerWalletOrLedgerMutated, false)
assert.equal(receipt.serviceFeeIncluded, false)
assert.equal(receipt.cloudBillingInvoiceReconciliationRequired, true)
assert.equal(assertCanonicalSam31L4QualificationAttemptCostReceipt(
  receipt,
).receiptHash, receipt.receiptHash)
assert.equal(assertCanonicalSam31L4QualificationTerminalObservation(
  terminal,
).observationHash, terminal.observationHash)

const tamperedReceipt = structuredClone(receipt)
tamperedReceipt.actualUsage.totalBillableMilliseconds += 1
assert.throws(() => assertCanonicalSam31L4QualificationAttemptCostReceipt(
  tamperedReceipt,
))
const crossedTerminal = structuredClone(terminal)
crossedTerminal.runOrdinal = 2
crossedTerminal.observationHash = sha256AuthorityValue(
  omit(crossedTerminal, 'observationHash'),
)
assert.throws(() => createCanonicalSam31L4QualificationAttemptCostReceipt({
  receiptId: 'crossed',
  runReceipt: run,
  terminalObservation: crossedTerminal,
  currentRateAuthority: rate,
  recordedAt,
}))
const staleRate = structuredClone(rate)
staleRate.expiresAt = recordedAt
staleRate.rateAuthorityHash = sha256AuthorityValue(
  omit(staleRate, 'rateAuthorityHash'),
)
assert.throws(() => createCanonicalSam31L4QualificationAttemptCostReceipt({
  receiptId: 'stale',
  runReceipt: run,
  terminalObservation: terminal,
  currentRateAuthority: staleRate,
  recordedAt,
}))

const records = new Map<string, Buffer>()
const repository = createCanonicalSam31L4QualificationAttemptCostRepository({
  objectPort: {
    async createOnly({ objectPath, body }) {
      if (records.has(objectPath)) return 'already_exists' as const
      records.set(objectPath, Buffer.from(body))
      return 'created' as const
    },
    async readExact(objectPath) {
      const body = records.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  },
})
assert.equal(await repository.persistCreateOnly({ receipt }), 'created')
assert.equal(await repository.persistCreateOnly({ receipt }), 'already_exists')
const reread = await repository.reread({ qualificationId, runOrdinal: 1 })
assert.equal(reread?.receiptHash, receipt.receiptHash)
if (!reread) throw new Error('receipt_missing')
reread.actualUsage.activeGpuMilliseconds += 1
assert.equal((await repository.reread({
  qualificationId,
  runOrdinal: 1,
}))?.actualUsage.activeGpuMilliseconds, 100_000)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-l4-qualification-attempt-cost',
  checks: 23,
  totalBillableMilliseconds: receipt.actualUsage.totalBillableMilliseconds,
  totalInfrastructureCostUsdNanos:
    receipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos,
  exactAccountEffectiveRateUsed:
    receipt.exactCurrentBillingAccountPriceReread,
  cloudBillingInvoiceReconciliationRequired:
    receipt.cloudBillingInvoiceReconciliationRequired,
  customerCreditsMutated: receipt.customerWalletOrLedgerMutated,
  productionAuthorityGranted: receipt.productionAuthorityGranted,
}))

function rawRateObservation(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    component('cloud_run_l4_gpu_second', 'gpu_second', 186_700, '1'),
    component('cloud_run_vcpu_second', 'vcpu_second', 18_000, '2'),
    component('cloud_run_memory_gib_second', 'gib_second', 2_000, '3'),
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, '4'),
    component('network_egress_gib', 'gib', 120_000_000, '5'),
    component('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '6'),
    component('object_class_b_per_1000',
      'per_1000_operations', 400_000, '7'),
  ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-scope', '8'),
    pricingReaderConfigurationRef: ref('pricing-reader', '9'),
    routeId: 'l4_heavy_fallback' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('price-record-set', 'a'),
    pricingReadStartedAt: '2026-08-12T09:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return { ...base, pricingReadDigestSha256: sha256AuthorityValue(base) }
}

function component(
  componentClass:
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  price: number,
  character: string,
) {
  const cloudRun = componentClass.startsWith('cloud_run')
  return {
    componentClass,
    cloudServiceName: cloudRun ? 'cloud-run' : 'cloud-storage',
    skuRateBindingId: `binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId: cloudRun ? 'service-cloud-run' : 'service-storage',
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: price,
      }],
      maximumContractPriceUsdNanos: price,
      skuMetadataRef: ref(`metadata-${componentClass}`, character),
      billingAccountPriceRef: ref(`price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`record-${componentClass}`, character),
  }
}

function omit<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}
