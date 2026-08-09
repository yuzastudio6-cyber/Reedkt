import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  sealCanonicalSam31VertexSourceCheckpointWorkerResult,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  calculateCanonicalA100VertexInfrastructureCost,
} from '../tool-cost-metering/canonical-a100-vertex-attempt-cost-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexQualificationAdmission,
  assertCanonicalSam31VertexQualificationExecution,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  canonicalSam31VertexQualificationCostReceiptSchema,
  canonicalSam31VertexQualificationPlatformStopSchema,
  canonicalSam31VertexQualificationTerminalResultSchema,
  createCanonicalSam31VertexQualificationProviderUsage,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-terminal-reconciliation'
import {
  assertCanonicalSam31VertexQualificationRelease,
  createCanonicalSam31VertexQualificationReleaseOwner,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import {
  sealCanonicalSam31QualificationSecurityClearance,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-release-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { authority as rateFixture } from
  './canonical-current-google-cloud-vertex-a100-rate-authority-smoke'
import {
  canonicalIngest,
  candidate,
} from './canonical-sam3_1-source-checkpoint-qualification-smoke'
import {
  accepted,
  admissions,
  persistedExecution,
  request,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-smoke'
import {
  historical,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-smoke'

assert.ok(accepted.admissionRef)
assert.ok(accepted.executionRef)
const admissionRef = accepted.admissionRef
const executionRef = accepted.executionRef
const admission = assertCanonicalSam31VertexQualificationAdmission(
  admissions.get(admissionRef.contentHash.slice('sha256:'.length)),
)
const execution = assertCanonicalSam31VertexQualificationExecution(
  persistedExecution,
)
const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
  rateFixture,
  '2026-08-06T16:16:00.000Z',
)
const workerRequestRef = ref(request.qualificationId, request.requestHash, 2)
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
const workerResultRef = ref(
  `sam31-vertex-worker-result-${workerResult.resultHash.slice(0, 32)}`,
  workerResult.resultHash,
)
const providerTimes = {
  createTime: '2026-08-06T16:10:00.000Z',
  startTime: '2026-08-06T16:11:00.000Z',
  endTime: '2026-08-06T16:13:00.000Z',
}
const providerUsage = createCanonicalSam31VertexQualificationProviderUsage({
  attemptId: request.attemptId,
  executionRef,
  workerRequestRef,
  workerResultRef,
  providerTimes,
  providerInferenceOrSubstantiveWorkOutcome: 'executed',
  privateArtifactBytes: 4_294_967_296,
  privateArtifactRetentionMilliseconds: 86_400_000,
  networkEgressBytes: 0,
  observedAt: '2026-08-06T16:14:00.000Z',
})
const providerUsageRef = ref(
  `sam31-vertex-provider-usage-${providerUsage.evidenceHash.slice(0, 32)}`,
  providerUsage.evidenceHash,
)
const cloudTerminalObservationRef = ref(
  'sam31-vertex-terminal.test',
  hash('cloud-terminal-observation'),
)
const platformStopPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-qualification-platform-stop-v1' as const,
  source: 'canonical_server_vertex_qualification_platform_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  attemptId: request.attemptId,
  executionRef,
  cloudTerminalObservationRef,
  providerTimes,
  providerJobTerminalStateReread: true as const,
  providerCapacityAndQuotaReread: true as const,
  workerStoppedVerified: true as const,
  activeA100GpuInstancesAfterObservation: 0 as const,
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
const platformStop = canonicalSam31VertexQualificationPlatformStopSchema
  .parse({
    ...platformStopPayload,
    evidenceHash: sha256AuthorityValue(platformStopPayload),
  })
const platformStopRef = ref(
  `sam31-vertex-platform-stop-${platformStop.evidenceHash.slice(0, 32)}`,
  platformStop.evidenceHash,
)
const rateRef = ref(
  rate.rateAuthorityId,
  rate.rateAuthorityHash,
  rate.rateAuthorityVersion,
)
const actualCost = calculateCanonicalA100VertexInfrastructureCost({
  rateAuthority: rate,
  usage: providerUsage.actualUsage,
  at: '2026-08-06T16:14:00.000Z',
})
const costPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-qualification-cost-receipt-v2' as const,
  source: 'canonical_server_sam3_1_vertex_qualification_cost_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  receiptId: 'sam31-vertex-qualification-cost-test',
  attemptId: request.attemptId,
  admissionRef,
  executionRef,
  cloudTerminalObservationRef,
  providerUsageEvidenceRef: providerUsageRef,
  platformStopEvidenceRef: platformStopRef,
  currentAccountRateAuthorityRef: rateRef,
  terminalOutcome: 'completed' as const,
  providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
  actualUsage: providerUsage.actualUsage,
  actualInfrastructureCost: actualCost,
  billingAccountEffectiveVertexUsageSkuSetUsed: true as const,
  billingAccountIdentifierIncluded: false as const,
  customerEligibleInfrastructureCostUsdNanos: 0 as const,
  customerEligibleToolCostCredits: 0 as const,
  weeditproAbsorbedInfrastructureCostUsdNanos:
    actualCost.totalInfrastructureCostUsdNanos,
  internalQualificationCostOnly: true as const,
  serviceFeeIncluded: false as const,
  customerWalletLedgerReservationOrCreditMutationPerformed: false as const,
  exactProviderAllocationArtifactBytesAndCurrentAccountRateReread:
    true as const,
  objectStorageOperationCostDeferredToCloudBillingInvoiceReconciliation:
    true as const,
  provisionalInternalQualificationCost: true as const,
  finalCloudBillingInvoiceReconciledCostClaimed: false as const,
  activeA100GpuInstancesAfterTerminalAttempt: 0 as const,
  automaticRetryAllowed: false as const,
  cloudBillingInvoiceReconciliationRequired: true as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  recordedAt: '2026-08-06T16:14:00.000Z',
}
const cost = canonicalSam31VertexQualificationCostReceiptSchema.parse({
  ...costPayload,
  receiptHash: sha256AuthorityValue(costPayload),
})
const costRef = ref(cost.receiptId, cost.receiptHash)
const terminalPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-qualification-terminal-result-v1' as const,
  source:
    'canonical_server_sam3_1_vertex_qualification_terminal_reconciliation' as const,
  attemptId: request.attemptId,
  admissionRef,
  executionRef,
  workerRequestRef,
  disposition: 'terminal' as const,
  providerState: 'JOB_STATE_SUCCEEDED' as const,
  terminalOutcome: 'completed' as const,
  workerResultRef,
  cloudTerminalObservationRef,
  providerUsageEvidenceRef: providerUsageRef,
  platformStopEvidenceRef: platformStopRef,
  currentAccountRateAuthorityRef: rateRef,
  costReceiptRef: costRef,
  exactWorkerResultGenerationReread: true,
  providerJobTerminalStateReread: true,
  activeA100GpuInstancesAfterObservation: 0 as const,
  sourceCheckpointQualificationEvidenceReady: true,
  checkbackAllowed: false,
  retryAllowedWithoutCanonicalReconciliation: false as const,
  minimumIdleInstances: 0 as const,
  persistentEndpointPresent: false as const,
  customerWalletLedgerReservationOrCreditMutationPerformed: false as const,
  sourceCheckpointQualificationGranted: false as const,
  runtimeReleaseGranted: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionReady: false as const,
  observedAt: '2026-08-06T16:14:00.000Z',
}
const terminal = canonicalSam31VertexQualificationTerminalResultSchema.parse({
  ...terminalPayload,
  resultHash: sha256AuthorityValue(terminalPayload),
})
const terminalRef = ref(
  `sam31-vertex-terminal-reconciliation-${terminal.resultHash.slice(0, 32)}`,
  terminal.resultHash,
)
const clearance = sealCanonicalSam31QualificationSecurityClearance({
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-security-compliance-clearance-v1',
  source: 'canonical_sam3_1_security_legal_privacy_compliance_owner',
  evidenceClass: 'canonical_private_reread',
  clearanceId: 'sam31-vertex-qualification-clearance-test',
  clearanceVersion: 1,
  qualificationId: request.qualificationId,
  candidateRef: request.candidateRef,
  ingestReceiptRef: ref(
    canonicalIngest.ingestReceiptId,
    canonicalIngest.ingestReceiptHash,
  ),
  workerRequestRef,
  termsAcceptanceRef: canonicalIngest.termsAcceptanceRef,
  reviewedEvidenceRefs: {
    legalReviewRef: ref('sam31-legal-review', hash('legal')),
    privacyReviewRef: ref('sam31-privacy-review', hash('privacy')),
    tradeControlsReviewRef: ref('sam31-trade-review', hash('trade')),
    sourceLicenseReviewRef: canonicalIngest.sourceArchive.licenseRef,
    checkpointLicenseReviewRef: canonicalIngest.checkpoint.licenseRef,
    sourceMalwareScanRef: canonicalIngest.sourceArchive.malwareScanRef,
    checkpointMalwareScanRef: canonicalIngest.checkpoint.malwareScanRef,
    sourceIngestSecurityReviewRef:
      canonicalIngest.sourceArchive.securityReviewRef,
    checkpointIngestSecurityReviewRef:
      canonicalIngest.checkpoint.securityReviewRef,
    sourceCodeStaticSecurityReviewRef: request.sourceCodeSecurityReviewRef,
    unsignedSourceRevisionAcceptanceRef:
      canonicalIngest.sourceArchive.unsignedSourceRevisionAcceptanceRef,
    checkpointWeightsOnlyInspectionRef:
      request.checkpoint.weightsOnlyInspectionRef,
  },
  decisions: {
    sourceLicenseReviewedForApprovedUse: true,
    checkpointLicenseReviewedForApprovedUse: true,
    privacyReviewApprovedForPrivateQualification: true,
    tradeControlsReviewApprovedForPrivateQualification: true,
    sourceMalwareScanPassed: true,
    checkpointMalwareScanPassed: true,
    sourceStaticSecurityReviewPassed: true,
    checkpointStaticSecurityReviewPassed: true,
    unsignedSourceRevisionAccepted: true,
    noOpenHighOrCriticalSecurityFinding: true,
    checkpointWeightsOnlyResultMustBeCorroboratedByWorker: true,
    checkpointTensorAllowlistMustBeCorroboratedByWorker: true,
    executablePickleTrustGranted: false,
    checkpointRedistributionAuthorized: false,
  },
  authority: {
    authenticatedReviewOwnersReread: true,
    privateSourceCheckpointQualificationOnly: true,
    customerMediaProcessingAuthorized: false,
    runtimeImageReleaseAuthorized: false,
    customerCreditsMutated: false,
    customerBillingAuthorityGranted: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionReady: false,
  },
  approvedAt: '2026-08-06T16:15:00.000Z',
  validUntil: '2026-08-07T16:15:00.000Z',
})
const clearanceRef = ref(clearance.clearanceId, clearance.clearanceHash)
const values = new Map<string, unknown>([
  ['candidate', candidate],
  ['ingest', canonicalIngest],
  ['request', request],
  ['result', workerResult],
  ['admission', admission],
  ['execution', execution],
  ['terminal', terminal],
  ['usage', providerUsage],
  ['stop', platformStop],
  ['rate', rate],
  ['cost', cost],
  ['clearance', clearance],
])
const objects = new Map<string, Buffer>()
const owner = createCanonicalSam31VertexQualificationReleaseOwner({
  readPort: readPort(values),
  releaseObjectPort: memoryObjectPort(objects),
  now: () => '2026-08-06T16:16:00.000Z',
})
const compileRequest = {
  qualificationId: request.qualificationId,
  workerRequestRef,
  workerResultRef,
  admissionRef,
  executionRef,
  terminalReconciliationRef: terminalRef,
  providerUsageRef,
  platformStopRef,
  currentAccountRateRef: rateRef,
  qualificationCostReceiptRef: costRef,
  securityComplianceClearanceRef: clearanceRef,
}
const release = await owner.compileAndPersist(compileRequest)
assert.deepEqual(assertCanonicalSam31VertexQualificationRelease(release), release)
assert.equal(release.qualification.qualificationVersion, 2)
assert.equal(release.qualification.workerRequest.qualificationVersion, 2)
assert.equal(release.qualification.workerResult.qualificationVersion, 2)
assert.equal(release.qualification.qualificationTruth
  .legacyBatchRequestOrResultCastOrRelabelUsed, false)
assert.equal(release.qualification.qualificationTruth
  .exactA10080GbExecutionVerified, true)
assert.equal(release.sourceCheckpointQualificationGranted, true)
assert.equal(release.privateImageBuildReviewEligible, true)
assert.equal(release.imageBuildStarted, false)
assert.equal(release.productionReady, false)
const replay = await owner.compileAndPersist(compileRequest)
assert.equal(replay.releaseHash, release.releaseHash)
assert.equal(objects.size, 1)

const batchRelabel = structuredClone(workerResult)
;(batchRelabel.runtime as { executionTarget: string }).executionTarget =
  'google_cloud_batch_a2_ultra_job'
values.set('result', batchRelabel)
await assert.rejects(owner.compileAndPersist(compileRequest))
values.set('result', workerResult)

const activeGpu = structuredClone(platformStop)
;(activeGpu as { activeA100GpuInstancesAfterObservation: number })
  .activeA100GpuInstancesAfterObservation = 1
values.set('stop', activeGpu)
await assert.rejects(owner.compileAndPersist(compileRequest))
values.set('stop', platformStop)

const crossedRequestRef = structuredClone(compileRequest)
crossedRequestRef.workerRequestRef.contentHash = `sha256:${'f'.repeat(64)}`
await assert.rejects(owner.compileAndPersist(crossedRequestRef))

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner',
  checks: 22,
  officialSam31VertexA100EvidenceQualified: true,
  legacyBatchCastOrRelabelUsed: false,
  exactRequestResultAdmissionExecutionTerminalAndCostReread: true,
  sourceCheckpointQualificationGranted: true,
  privateImageBuildReviewEligible: true,
  activeA100GpuInstancesAfterObservation: 0,
  customerCreditsMutated: false,
  imageBuildStarted: false,
  productionReady: false,
}, null, 2))

function readPort(store: Map<string, unknown>) {
  return {
    async rereadCandidate() { return structuredClone(store.get('candidate')) },
    async rereadIngestReceipt() { return structuredClone(store.get('ingest')) },
    async rereadWorkerRequest() { return structuredClone(store.get('request')) },
    async rereadWorkerResult() { return structuredClone(store.get('result')) },
    async rereadAdmission() { return structuredClone(store.get('admission')) },
    async rereadExecution() { return structuredClone(store.get('execution')) },
    async rereadTerminalReconciliation() {
      return structuredClone(store.get('terminal'))
    },
    async rereadProviderUsage() { return structuredClone(store.get('usage')) },
    async rereadPlatformStop() { return structuredClone(store.get('stop')) },
    async rereadCurrentAccountRate() { return structuredClone(store.get('rate')) },
    async rereadQualificationCostReceipt() {
      return structuredClone(store.get('cost'))
    },
    async rereadSecurityComplianceClearance() {
      return structuredClone(store.get('clearance'))
    },
  }
}

function memoryObjectPort(
  store: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = store.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      store.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = store.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function ref(id: string, hashValue: string, version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${hashValue}` as const,
  }
}

function hash(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
