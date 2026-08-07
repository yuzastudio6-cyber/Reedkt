import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest,
  assertCanonicalSam31VertexSourceCheckpointWorkerResult,
  createCanonicalSam31VertexSourceCheckpointWorkerRequest,
  sealCanonicalSam31VertexSourceCheckpointWorkerResult,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  canonicalIngest,
  candidate,
} from './canonical-sam3_1-source-checkpoint-qualification-smoke'
import {
  createCanonicalSam31QualificationWorkerEvidenceFixture,
} from './fixtures/canonical-sam3_1-qualification-worker-fixture'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const historical = createCanonicalSam31QualificationWorkerEvidenceFixture({
  candidate,
  ingestReceipt: canonicalIngest,
  qualificationId: 'sam31-vertex-qualification',
  qualifiedAt: '2026-08-07T20:00:00.000Z',
})
export const attemptId = 'sam31-vertex-attempt-001'
export const request = createCanonicalSam31VertexSourceCheckpointWorkerRequest({
  historicalPackageRequest: historical.request,
  attemptId,
  issuedAt: '2026-08-07T19:59:00.000Z',
})
assert.equal(request.qualificationVersion, 2)
assert.equal(request.runtime.executionTarget,
  'google_cloud_vertex_custom_job_a2_ultra')
assert.equal(request.runtime.privateArtifactTransport,
  'vertex_ai_cloud_storage_fuse_fixed_attempt_scope')
assert.equal(request.runtime.minimumIdleInstances, 0)
assert.equal(request.authority.legacyBatchRequestCastOrRelabelAllowed, false)
assert.equal(request.attemptDigestSha256, sha256AuthorityValue(attemptId))
assert.equal(
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest(request).requestHash,
  request.requestHash,
)

export const result = sealCanonicalSam31VertexSourceCheckpointWorkerResult({
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-qualification-worker-result-v2',
  source: 'fixed_sam3_1_vertex_a100_source_checkpoint_qualification_worker',
  evidenceClass: 'canonical_private_reread',
  qualificationId: request.qualificationId,
  qualificationVersion: 2,
  attemptId,
  attemptDigestSha256: sha256AuthorityValue(attemptId),
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
  completedAt: '2026-08-07T20:00:00.000Z',
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
assert.equal(
  assertCanonicalSam31VertexSourceCheckpointWorkerResult(result).resultHash,
  result.resultHash,
)

const crossedAttempt = structuredClone(request)
crossedAttempt.attemptId = 'sam31-vertex-attempt-002'
assert.throws(() =>
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest(crossedAttempt))
const relabeledBatch = structuredClone(result)
;(relabeledBatch.runtime as { executionTarget: string }).executionTarget =
  'google_cloud_batch_a2_ultra_job'
assert.throws(() =>
  assertCanonicalSam31VertexSourceCheckpointWorkerResult(relabeledBatch))
const callerPath = structuredClone(request) as unknown as Record<string, unknown>
callerPath.privatePath = '/gcs/caller'
assert.throws(() =>
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest(callerPath))

const runner = readFileSync(new URL(
  '../../docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  import.meta.url,
), 'utf8')
assert.match(runner, /source-checkpoint-qualification\/v2\/attempts/u)
assert.match(runner, /WEEDITPRO_GPU_INVOCATION_ID/u)
assert.match(runner,
  /vertex_ai_cloud_storage_fuse_fixed_attempt_scope/u)
assert.match(runner, /google_cloud_vertex_custom_job_a2_ultra/u)
assert.doesNotMatch(runner, /google_cloud_batch_a2_ultra_job/u)
assert.doesNotMatch(runner, /\/mnt\/disks\/reeditpro/u)
assert.doesNotMatch(runner,
  /os\.environ\.get\("(?:PATH|URL|MODEL|CHECKPOINT|COMMAND)/u)

console.log(JSON.stringify({
  contract: 'canonical-sam3_1-vertex-source-checkpoint-worker-v2',
  requestHash: request.requestHash,
  resultHash: result.resultHash,
  checks: 19,
}, null, 2))
