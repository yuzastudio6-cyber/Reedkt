import assert from 'node:assert/strict'

import {
  sealCanonicalSam31VertexSourceCheckpointWorkerResult,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  canonicalSam31VertexQualificationCostReceiptSchema,
  canonicalSam31VertexQualificationPlatformStopSchema,
  createCanonicalSam31VertexQualificationProviderUsage,
  createCanonicalSam31VertexQualificationTerminalReconciler,
  type CanonicalSam31VertexQualificationCostReceipt,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-terminal-reconciliation'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { authority as rateAuthority } from './canonical-current-google-cloud-vertex-a100-rate-authority-smoke'
import {
  accepted,
  admissions,
  persistedExecution,
  request,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-smoke'
import { historical } from './canonical-sam3_1-source-checkpoint-qualification-vertex-smoke'

assert.ok(accepted.executionRef)
const executionRef = accepted.executionRef
const providerTimes = {
  createTime: '2026-08-06T16:10:00.000Z',
  startTime: '2026-08-06T16:11:00.000Z',
  endTime: '2026-08-06T16:13:00.000Z',
}
const secondPrecisionImmediateFailureUsage =
  createCanonicalSam31VertexQualificationProviderUsage({
    attemptId: request.attemptId,
    executionRef,
    workerRequestRef: ref(request.qualificationId, request.requestHash, 2),
    workerResultRef: null,
    providerTimes: {
      createTime: '2026-08-06T16:10:00.000Z',
      startTime: '2026-08-06T16:13:00.000Z',
      endTime: '2026-08-06T16:13:00.000Z',
    },
    providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
    privateArtifactBytes: 4_294_967_296,
    privateArtifactRetentionMilliseconds: 86_400_000,
    networkEgressBytes: 0,
    observedAt: '2026-08-06T16:14:00.000Z',
  })
assert.equal(
  secondPrecisionImmediateFailureUsage.actualUsage.allocatedGpuMilliseconds,
  0,
)
assert.equal(
  secondPrecisionImmediateFailureUsage.actualUsage
    .billableDurationMilliseconds,
  30_000,
)
assert.equal(
  secondPrecisionImmediateFailureUsage.actualUsage
    .actualWallClockMilliseconds,
  180_000,
)
const workerResult = sealCanonicalSam31VertexSourceCheckpointWorkerResult({
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-qualification-worker-result-v2',
  source: 'fixed_sam3_1_vertex_a100_source_checkpoint_qualification_worker',
  evidenceClass: 'canonical_private_reread',
  qualificationId: request.qualificationId,
  qualificationVersion: 2,
  attemptId: request.attemptId,
  attemptDigestSha256: request.attemptDigestSha256,
  operationId: request.operationId,
  requestRef: {
    id: request.qualificationId,
    version: 2,
    schemaVersion: request.schemaVersion,
    contentHash: `sha256:${request.requestHash}`,
  },
  candidateRef: request.candidateRef,
  ingestReceiptRef: request.ingestReceiptRef,
  qualificationImage: {
    artifactRef: request.qualificationImage.artifactRef,
    immutableImageDigest: request.qualificationImage.immutableImageDigest,
    supplyChainReleaseRef: request.qualificationImage.supplyChainReleaseRef,
  },
  artifactVerification: historical.result.artifactVerification,
  runtime: {
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    allocatedGpuCount: 1,
    observedGpuName: 'NVIDIA A100-SXM4-80GB',
    observedGpuTotalMemoryBytes: 85_899_345_920,
    baseImageDigest:
      'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
    pythonVersion: '3.12',
    torchVersion: '2.10.0+cu128',
    torchvisionVersion: '0.25.0+cu128',
    torchcodecVersion: '0.10.0',
    torchcodecCudaWheelVersion: '0.10.0+cu128',
    einopsVersion: '0.8.2',
    pycocotoolsVersion: '2.0.11',
    ffmpegVersion: '8.0.3',
    ffmpegNvdecAndCuvidAvailable: true,
    gpuVideoDecodeBackendStatusVerified: true,
    cpuVideoDecodeFallbackObserved: false,
    cudaVersion: '12.8',
    fixedBuilder: 'build_sam3_multiplex_video_predictor',
    privateArtifactTransport:
      'vertex_ai_cloud_storage_fuse_fixed_attempt_scope',
    exactAttemptScopeDerivedFromServerAttemptId: true,
    requestCheckpointAndFixtureRereadFromPrivateGenerationBoundScope: true,
    resultCreatedOnceInExactPrivateAttemptScope: true,
    networkEgressObserved: false,
    developerMachineExecutionObserved: false,
    cpuOnlyModelExecutionObserved: false,
    quantizationOrResolutionReductionUsed: false,
    providerInferenceExecuted: false,
    bfloat16AutocastExecuted: true,
    persistentResourceObserved: false,
  },
  strictLoad: historical.result.strictLoad,
  deterministicRuns: historical.result.deterministicRuns,
  deterministicOutputDigestSha256:
    historical.result.deterministicOutputDigestSha256,
  deterministicOutputDigestMatchedEveryRun: true,
  actualCudaModelInferenceExecuted: true,
  completedAt: '2026-08-06T16:12:30.000Z',
  authority: {
    qualificationEvidenceOnly: true,
    legacyBatchResultCastOrRelabelAllowed: false,
    imageBuildStarted: false,
    productionRuntimeDispatchAuthorized: false,
    customerCreditsMutated: false,
    customerBillingAuthorityGranted: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionReady: false,
  },
})

const costReceipts: CanonicalSam31VertexQualificationCostReceipt[] = []
const successful = createReconciler({
  providerState: 'JOB_STATE_SUCCEEDED',
  workerResult,
  outcome: 'executed',
  onCost(value) { costReceipts.push(value) },
})
const terminal = await successful.reconcileOne({ executionRef })
assert.equal(terminal.disposition, 'terminal')
assert.equal(terminal.terminalOutcome, 'completed')
assert.equal(terminal.sourceCheckpointQualificationEvidenceReady, true)
assert.equal(terminal.activeA100GpuInstancesAfterObservation, 0)
assert.equal(terminal.retryAllowedWithoutCanonicalReconciliation, false)
assert.equal(terminal.customerWalletLedgerReservationOrCreditMutationPerformed,
  false)
assert.equal(terminal.sourceCheckpointQualificationGranted, false)
assert.equal(terminal.productionReady, false)
const costReceipt = costReceipts[0]
assert.ok(costReceipt)
assert.equal(costReceipt.customerEligibleInfrastructureCostUsdNanos, 0)
assert.equal(costReceipt.customerEligibleToolCostCredits, 0)
assert.equal(costReceipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos,
  costReceipt.weeditproAbsorbedInfrastructureCostUsdNanos)
assert.equal(costReceipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos
  > 0, true)
assert.equal(costReceipt.actualUsage.classAOperationCount, 0)
assert.equal(costReceipt.actualUsage.classBOperationCount, 0)
assert.equal(
  costReceipt.actualUsage.objectStorageOperationMeteringDisposition,
  'deferred_to_cloud_billing_invoice_reconciliation',
)
assert.equal(
  costReceipt.objectStorageOperationCostDeferredToCloudBillingInvoiceReconciliation,
  true,
)
assert.equal(costReceipt.provisionalInternalQualificationCost, true)
assert.equal(costReceipt.finalCloudBillingInvoiceReconciledCostClaimed, false)
assert.equal(
  costReceipt.actualInfrastructureCost.objectClassAOperationsUsdNanos,
  0,
)
assert.equal(
  costReceipt.actualInfrastructureCost.objectClassBOperationsUsdNanos,
  0,
)
const inventedOperationCost = structuredClone(costReceipt)
inventedOperationCost.actualInfrastructureCost.objectClassAOperationsUsdNanos =
  1
inventedOperationCost.actualInfrastructureCost.totalInfrastructureCostUsdNanos +=
  1
inventedOperationCost.weeditproAbsorbedInfrastructureCostUsdNanos += 1
const { receiptHash: _receiptHash, ...inventedOperationCostPayload } =
  inventedOperationCost
assert.equal(_receiptHash.length, 64)
assert.throws(() => canonicalSam31VertexQualificationCostReceiptSchema.parse({
  ...inventedOperationCostPayload,
  receiptHash: sha256AuthorityValue(inventedOperationCostPayload),
}))

let pendingResultReads = 0
const pending = await createReconciler({
  providerState: 'JOB_STATE_RUNNING',
  workerResult,
  outcome: 'executed',
  onResultRead() { pendingResultReads += 1 },
}).reconcileOne({ executionRef })
assert.equal(pending.disposition, 'pending')
assert.equal(pending.checkbackAllowed, true)
assert.equal(pendingResultReads, 0)

let failedResultReads = 0
const failedCosts: CanonicalSam31VertexQualificationCostReceipt[] = []
const failed = await createReconciler({
  providerState: 'JOB_STATE_FAILED',
  workerResult: null,
  outcome: 'unknown',
  onResultRead() { failedResultReads += 1 },
  onCost(value) { failedCosts.push(value) },
}).reconcileOne({ executionRef })
assert.equal(failed.disposition, 'terminal')
assert.equal(failed.terminalOutcome, 'failed')
assert.equal(failed.workerResultRef, null)
assert.equal(failed.sourceCheckpointQualificationEvidenceReady, false)
assert.equal(failedResultReads, 0)
const failedCost = failedCosts[0]
assert.ok(failedCost)
assert.equal(failedCost.customerEligibleInfrastructureCostUsdNanos, 0)

const networkUnknown = await createReconciler({
  providerState: 'network_throw',
  workerResult,
  outcome: 'executed',
}).reconcileOne({ executionRef })
assert.equal(networkUnknown.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(networkUnknown.checkbackAllowed, false)

const tamperedResult = structuredClone(workerResult)
tamperedResult.requestRef.contentHash = `sha256:${'f'.repeat(64)}`
const tampered = await createReconciler({
  providerState: 'JOB_STATE_SUCCEEDED',
  workerResult: tamperedResult,
  outcome: 'executed',
}).reconcileOne({ executionRef })
assert.equal(tampered.disposition,
  'outcome_unknown_requires_reconciliation')

const activeCapacity = await createReconciler({
  providerState: 'JOB_STATE_SUCCEEDED',
  workerResult,
  outcome: 'executed',
  activeA100GpuInstances: 1,
}).reconcileOne({ executionRef })
assert.equal(activeCapacity.disposition,
  'outcome_unknown_requires_reconciliation')

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification-vertex-terminal',
  checks: 44,
  exactWorkerResultGenerationReread: true,
  exactTerminalStateAndUsage: true,
  billingAccountEffectiveProvisionalCostCalculated: true,
  storageOperationCountsInvented: false,
  storageOperationCostDeferredToInvoiceReconciliation: true,
  finalInvoiceReconciledCostClaimed: false,
  internalQualificationCostAbsorbedByWeEditPro: true,
  customerCreditsMutated: false,
  activeA100GpuInstancesAfterObservation: 0,
  unknownOutcomeBlocksRetry: true,
  sourceCheckpointQualificationEvidenceReady: true,
  sourceCheckpointQualificationGranted: false,
  productionReady: false,
}, null, 2))

function createReconciler(input: {
  providerState: 'JOB_STATE_RUNNING' | 'JOB_STATE_SUCCEEDED'
    | 'JOB_STATE_FAILED' | 'network_throw'
  workerResult: unknown
  outcome: 'executed' | 'not_executed' | 'unknown'
  activeA100GpuInstances?: 0 | 1
  onResultRead?: () => void
  onCost?: (value: CanonicalSam31VertexQualificationCostReceipt) => void
}) {
  return createCanonicalSam31VertexQualificationTerminalReconciler({
    admissionRepository: {
      async createOnlyAndReread(value) { return structuredClone(value) },
      async reread(value) {
        return structuredClone(admissions.get(value.contentHash.slice(7)) ?? null)
      },
    },
    executionRepository: {
      async createOnlyAndReread(value) { return structuredClone(value) },
      async reread() { return structuredClone(persistedExecution) },
      async rereadByAdmission() { return structuredClone(persistedExecution) },
    },
    requestReadPort: {
      async rereadExact() { return structuredClone(request) },
    },
    resultReadPort: {
      async rereadExact() {
        input.onResultRead?.()
        return structuredClone(input.workerResult)
      },
    },
    providerUsageReadPort: {
      async rereadExact(value) {
        assert.equal(
          value.providerInferenceOrSubstantiveWorkOutcome,
          input.outcome,
        )
        return createCanonicalSam31VertexQualificationProviderUsage({
          attemptId: request.attemptId,
          executionRef: value.executionRef,
          workerRequestRef: ref(request.qualificationId, request.requestHash, 2),
          workerResultRef: value.workerResultRef,
          providerTimes: value.providerTimes,
          providerInferenceOrSubstantiveWorkOutcome:
            value.providerInferenceOrSubstantiveWorkOutcome,
          privateArtifactBytes: 4_294_967_296,
          privateArtifactRetentionMilliseconds: 86_400_000,
          networkEgressBytes: 0,
          observedAt: '2026-08-06T16:14:00.000Z',
        })
      },
    },
    platformStopReadPort: {
      async rereadExact(value) {
        const payload = {
          schemaVersion:
            'canonical-sam3_1-vertex-qualification-platform-stop-v1' as const,
          source:
            'canonical_server_vertex_qualification_platform_owner' as const,
          evidenceClass: 'canonical_private_reread' as const,
          attemptId: request.attemptId,
          executionRef: value.executionRef,
          cloudTerminalObservationRef: value.cloudTerminalObservationRef,
          providerTimes: value.providerTimes,
          providerJobTerminalStateReread: true as const,
          providerCapacityAndQuotaReread: true as const,
          workerStoppedVerified: true as const,
          activeA100GpuInstancesAfterObservation:
            input.activeA100GpuInstances ?? 0,
          persistentEndpointPresent: false as const,
          minimumIdleInstances: 0 as const,
          exactOneShotA2UltraAllocationReread: true as const,
          allocatedGpuCount: 1 as const,
          allocatedVcpuCount: 12 as const,
          allocatedMemoryGiB: 170 as const,
          bootDiskType: 'pd-ssd' as const,
          bootDiskSizeGb: 200 as const,
          callerCapacityStopUsagePriceOrCostClaimAccepted: false as const,
          observedAt: '2026-08-06T16:14:00.000Z',
        }
        return canonicalSam31VertexQualificationPlatformStopSchema.parse({
          ...payload, evidenceHash: sha256AuthorityValue(payload),
        })
      },
    },
    rateReadPort: {
      async reread() { return structuredClone(rateAuthority) },
    },
    costReceiptStore: {
      async createOnlyAndReread(value) {
        input.onCost?.(value)
        return structuredClone(value)
      },
    },
    auth: {
      async request() {
        if (input.providerState === 'network_throw') {
          throw new Error('unknown provider outcome')
        }
        if (input.providerState === 'JOB_STATE_RUNNING') {
          return { data: {
            name:
              'projects/390722338345/locations/us-central1/customJobs/123456789',
            displayName: expectedDisplayName(),
            state: input.providerState,
            createTime: providerTimes.createTime,
            startTime: providerTimes.startTime,
          } } as never
        }
        return { data: {
          name:
            'projects/390722338345/locations/us-central1/customJobs/123456789',
          displayName: expectedDisplayName(),
          state: input.providerState,
          ...providerTimes,
        } } as never
      },
    },
    now: () => '2026-08-06T16:15:00.000Z',
  })
}

function expectedDisplayName() {
  return `weeditpro-sam31-q-${sha256AuthorityValue(request.attemptId).slice(0, 40)}`
}

function ref(id: string, digest: string, version = 1) {
  return { id, version, contentHash: `sha256:${digest}` }
}
