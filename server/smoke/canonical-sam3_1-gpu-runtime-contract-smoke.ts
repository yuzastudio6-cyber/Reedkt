import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

import {
  assertCanonicalSam31GpuRuntimeRequest,
  assertCanonicalSam31GpuRuntimeResponse,
  buildCanonicalSam31GpuRuntimeRequest,
  buildCanonicalSam31GpuRuntimeResponse,
  type CanonicalSam31GpuRuntimeRequest,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const hash = (seed: string) => `sha256:${sha256AuthorityValue(seed)}`
const ref = (id: string) => ({ id, version: 1, contentHash: hash(id) })
const candidate = createCanonicalSam31SourceRuntimeCandidate()
const checkpointSha = sha256AuthorityValue('authorized-checkpoint')
const immutableImageDigest = hash('sam31-image')

const request = buildCanonicalSam31GpuRuntimeRequest({
  schemaVersion: 'canonical-sam3_1-gpu-runtime-request-v1',
  operationId: 'tool.sam3_1.segment_and_track_subject.v1',
  dispatchAdmissionRef: ref('sam31-dispatch-admission'),
  dispatchAdmissionDigestSha256: sha256AuthorityValue('dispatch'),
  scope: {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersionId: 'edit-plan-version-1',
    approvedPlanSnapshotId: 'snapshot-1',
    approvedPlanSnapshotHash: sha256AuthorityValue('snapshot'),
    outputId: 'output-vertical-1',
    sceneId: 'scene-1',
    approvedWorkItemRef: ref('sam31-work-1'),
    workerLeaseRef: ref('sam31-lease-1'),
    executionAttemptRef: ref('sam31-attempt-1'),
    fundedCreditReservationRef: ref('reservation-1'),
    masterTimingRef: ref('master-timing-1'),
    sourceBindingRef: ref('source-binding-1'),
  },
  dispatch: {
    routeRole: 'a100_80gb_heavy_primary',
    gpuProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
    accelerator: 'nvidia_a100_80gb',
    attemptOrdinal: 1,
    priorAttemptDisposition: 'not_applicable_primary',
    priorAttemptDispositionRef: null,
    currentPrimaryAndFallbackRateAuthoritiesReread: true,
    exactPerToolEstimateApproved: true,
    userTriggeredAfterApproval: true,
    scaleFromZeroRequired: true,
    scaleBackToZeroAfterTerminalAttemptRequired: true,
    unknownPriorOutcomeMayRetryOrFallback: false,
    cpuOnlyInferenceAllowed: false,
  },
  sourceMedia: {
    mediaForm: 'private_read_only_mp4',
    finalizedSourceArtifactRef: ref('source-video-1'),
    gpuPreparedMaskProxyArtifactRef: ref('gpu-mask-proxy-1'),
    exactSourceReadEvidenceRef: ref('gpu-mask-proxy-read-1'),
    ffprobeOrFrameDirectoryEvidenceRef: ref('source-probe-1'),
    sourceFrameRangeMappingRef: ref('source-proxy-frame-map-1'),
    proxyPixelGeometryQaRef: ref('proxy-pixel-geometry-qa-1'),
    byteLength: 20_000_000,
    sha256: sha256AuthorityValue('gpu-mask-proxy'),
    width: 2160,
    height: 3840,
    decodedFrameCount: 240,
    fpsNumerator: 30,
    fpsDenominator: 1,
    selectedStartFrameInclusive: 0,
    selectedEndFrameInclusive: 239,
    canonicalSourceStartFrameInclusive: 300,
    canonicalSourceEndFrameInclusive: 539,
    boundedChunkOverlapAndStitchPlanRef: ref('mask-chunk-stitch-1'),
    variableFrameRateAllowed: false,
    callerPathOrUrlAccepted: false,
  },
  approvedPrompt: {
    promptType: 'server_compiled_text_subject',
    approvedSubjectText: 'basketball player in the foreground',
    promptFrameIndex: 0,
    compiledIntentRef: ref('compiled-intent-1'),
    promptApprovalRef: ref('prompt-approval-1'),
    sourceFrameLineageRef: ref('source-frame-300-local-0'),
    rawUserChatIncluded: false,
    executableTextIncluded: false,
  },
  modelArtifacts: {
    sourceCandidateRef: {
      schemaVersion: candidate.schemaVersion,
      candidateHash: candidate.candidateHash,
    },
    privateArtifactIngestReceiptRef: ref('sam31-ingest-1'),
    sourceArchiveRef: {
      id: 'sam31-source-archive-1',
      version: 1,
      contentHash:
        `sha256:${candidate.officialSource.deterministicGitArchiveSha256}`,
    },
    sourceRevision: candidate.officialSource.sourceRevision,
    sourceArchiveByteLength:
      candidate.officialSource.deterministicGitArchiveByteLength,
    sourceArchiveSha256:
      candidate.officialSource.deterministicGitArchiveSha256,
    reeditproGpuDecodePatchSha256:
      candidate.runtimeClosure.reeditproGpuDecodePatchSha256,
    checkpointRef: {
      id: 'sam31-checkpoint-1',
      version: 1,
      contentHash: `sha256:${checkpointSha}`,
    },
    checkpointRepositoryRevision:
      candidate.officialCheckpoint.repositoryRevision,
    checkpointFileName: candidate.officialCheckpoint.fileName,
    checkpointByteLength: 3_500_000_000,
    checkpointSha256: checkpointSha,
    sourceCheckpointCompatibilityQualificationRef: {
      ...ref('sam31-source-checkpoint-qualification-1'),
      version: 1 as const,
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1' as const,
    },
    immutableImageReleaseRef: {
      id: 'sam31-image-release-1',
      version: 1,
      contentHash: immutableImageDigest,
    },
    immutableImageDigest,
    humanTermsAcceptanceAndLegalReviewReread: true,
    sourceAndCheckpointMalwareScanReread: true,
    runtimeDownloadAllowed: false,
  },
  settings: {
    builder: 'build_sam3_multiplex_video_predictor',
    predictorVersion: 'sam3.1',
    maximumTrackedObjectsProductCap: 16,
    multiplexBucketSize: 16,
    useFlashAttention3: false,
    useRealValuedRope: true,
    torchCompileEnabled: false,
    warmupCompilationEnabled: false,
    defaultOutputProbabilityThreshold: 0.5,
    asynchronousFrameLoading: true,
    videoDecodeBackend: 'torchcodec_0_10_cuda_nvdec',
    gpuAcceleratedDecode: true,
    cpuOpenCvOrPillowDecodeAllowed: false,
    strictCheckpointLoadRequired: true,
    cudaOutputTensorsRequired: true,
    boundedCpuOutputSerializationOnly: true,
    offloadVideoToCpu: false,
    offloadStateToCpu: false,
    propagationDirection: 'forward',
    outputFormat: 'lossless_grayscale_png_mask_sequence_v1',
    sourceResolutionPreserved: true,
    sourceFrameRangePreserved: true,
    quantizationAllowed: false,
  },
  byteFreeRequest: true,
  callerCodePathUrlCommandOrEnvironmentAccepted: false,
})
assert.deepEqual(assertCanonicalSam31GpuRuntimeRequest(request), request)

const { requestBindingSha256: _v2Binding, ...v2RequestPayload } = request
void _v2Binding
const vertexQualifiedRequest = buildCanonicalSam31GpuRuntimeRequest({
  ...v2RequestPayload,
  modelArtifacts: {
    ...request.modelArtifacts,
    sourceCheckpointCompatibilityQualificationRef: {
      ...request.modelArtifacts.sourceCheckpointCompatibilityQualificationRef,
      version: 2,
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
    },
  },
})
assert.equal(
  vertexQualifiedRequest.modelArtifacts
    .sourceCheckpointCompatibilityQualificationRef.version,
  2,
)
assert.deepEqual(
  assertCanonicalSam31GpuRuntimeRequest(vertexQualifiedRequest),
  vertexQualifiedRequest,
)
const relabeledVertexRequest = structuredClone(vertexQualifiedRequest)
relabeledVertexRequest.modelArtifacts
  .sourceCheckpointCompatibilityQualificationRef.version = 1 as never
const relabeledVertexPayload = { ...relabeledVertexRequest }
Reflect.deleteProperty(relabeledVertexPayload, 'requestBindingSha256')
relabeledVertexRequest.requestBindingSha256 = sha256AuthorityValue(
  relabeledVertexPayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeRequest(
  relabeledVertexRequest,
))

const pythonArtifactIdentityProbe = spawnSync(
  'python3',
  ['-I', '-B', '-c', String.raw`
import copy
import importlib.util
import json
import sys

runner_path = sys.argv[1]
spec = importlib.util.spec_from_file_location("sam31_production_runner", runner_path)
if spec is None or spec.loader is None:
    raise RuntimeError("SAM 3.1 runner module could not be loaded")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
payload = json.load(sys.stdin)
runner.validate_model_artifacts(payload["v1"])
runner.validate_model_artifacts(payload["v2"])
relabeled = copy.deepcopy(payload["v2"])
relabeled["sourceCheckpointCompatibilityQualificationRef"]["version"] = 1
try:
    runner.validate_model_artifacts(relabeled)
except ValueError:
    pass
else:
    raise AssertionError("cross-version qualification relabel was accepted")
print(json.dumps({"v1Accepted": True, "v2Accepted": True, "relabelRejected": True}))
`, resolve(
    process.cwd(),
    'docker/prod/gpu-worker/sam3_1/runner.py',
  )],
  {
    input: JSON.stringify({
      v1: request.modelArtifacts,
      v2: vertexQualifiedRequest.modelArtifacts,
    }),
    encoding: 'utf8',
  },
)
assert.equal(
  pythonArtifactIdentityProbe.status,
  0,
  `${pythonArtifactIdentityProbe.stdout}\n${pythonArtifactIdentityProbe.stderr}`,
)
assert.deepEqual(
  JSON.parse(pythonArtifactIdentityProbe.stdout),
  { v1Accepted: true, v2Accepted: true, relabelRejected: true },
)

const response = buildCanonicalSam31GpuRuntimeResponse({
  schemaVersion: 'canonical-sam3_1-gpu-runtime-response-v1',
  operationId: request.operationId,
  requestBindingSha256: request.requestBindingSha256,
  dispatchAdmissionDigestSha256: request.dispatchAdmissionDigestSha256,
  status: 'completed',
  terminalStage: 'completed',
  gpuEvidence: {
    requestedAccelerator: request.dispatch.accelerator,
    observedDeviceNameDigestSha256: sha256AuthorityValue('NVIDIA A100-SXM4-80GB'),
    observedNvidiaDriverVersion: '570.211.01',
    observedCudaRuntimeVersion: '12.8',
    observedTorchVersion: '2.10.0+cu128',
    observedTorchcodecVersion: '0.10.0',
    observedComputeCapabilityMajor: 8,
    observedComputeCapabilityMinor: 0,
    observedTotalDeviceMemoryBytes: 85_899_345_920,
    maximumObservedNvdecUtilizationPercent: 81,
    maximumObservedGpuUtilizationPercent: 97,
    cudaAvailable: true,
    bfloat16AutocastUsed: true,
    nvdecHardwareDecodeMeasured: true,
    decodedFramesResidentOnCuda: true,
    boundedCpuOutputSerializationUsed: true,
    cudaKernelExecutionMeasured: true,
    cpuOnlyInferenceUsed: false,
    cudaDriverLibraryMode: 'host_driver',
    observedCudaDriverLibraryPathDigestSha256: sha256AuthorityValue(
      '/usr/local/nvidia/lib64/libcuda.so.570.211.01',
    ),
    cudaForwardCompatibilityPackageSha256:
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    cudaForwardCompatibilityLibraryLoaded: false,
    hostCudaDriverLibraryLoaded: true,
  },
  runtimeMeasurement: {
    wallTimeMilliseconds: 120_000,
    modelLoadMilliseconds: 20_000,
    promptMilliseconds: 2_000,
    propagationMilliseconds: 90_000,
    outputPersistenceMilliseconds: 8_000,
    cudaEventInferenceMilliseconds: 89_000,
    peakCudaAllocatedBytes: 40_000_000_000,
    peakCudaReservedBytes: 50_000_000_000,
    outputFileCount: 241,
    outputByteLength: 2_000_000_000,
  },
  outputSummary: {
    manifestRef: {
      id: 'sam31-mask-manifest-1',
      version: 1,
      contentHash: `sha256:${sha256AuthorityValue('mask-manifest')}`,
    },
    manifestSha256: sha256AuthorityValue('mask-manifest'),
    firstFrameIndex: 0,
    lastFrameIndex: 239,
    propagatedFrameCount: 240,
    distinctObjectIds: [0],
    losslessMaskPngCount: 240,
    normalizedBoxRecordCount: 240,
    allMasksMatchSourceDimensions: true,
    allFramesWithinApprovedInterval: true,
    createOnlyPrivatePersistence: true,
    exactPrivateRereadPending: true,
  },
  failureCode: 'none',
  modelSourceAndCheckpointHashesVerifiedBeforeAndAfter: true,
  sourceCheckpointCompatibilityQualificationReread: true,
  serverCostReceiptIncluded: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
assert.deepEqual(assertCanonicalSam31GpuRuntimeResponse({ request, response }),
  response)

const { requestBindingSha256: _requestBindingSha256, ...requestPayload } =
  request
void _requestBindingSha256
const fallback = buildCanonicalSam31GpuRuntimeRequest({
  ...requestPayload,
  dispatch: {
    ...request.dispatch,
    routeRole: 'l4_heavy_fallback',
    gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
    accelerator: 'nvidia_l4',
    attemptOrdinal: 2,
    priorAttemptDisposition: 'not_executed_retry_safe',
    priorAttemptDispositionRef: ref('a100-prior-attempt-disposition-1'),
  },
})
assert.equal(fallback.dispatch.accelerator, 'nvidia_l4')

const adversarial: Array<(value: CanonicalSam31GpuRuntimeRequest) => void> = [
  (value) => { value.dispatch.accelerator = 'nvidia_l4' },
  (value) => { value.dispatch.cpuOnlyInferenceAllowed = true as never },
  (value) => { value.dispatch.attemptOrdinal = 2 },
  (value) => { value.sourceMedia.selectedEndFrameInclusive = 238 },
  (value) => { value.approvedPrompt.promptFrameIndex = 240 as never },
  (value) => { value.approvedPrompt.approvedSubjectText = 'file:///tmp/model' },
  (value) => { value.modelArtifacts.runtimeDownloadAllowed = true as never },
  (value) => { value.modelArtifacts.sourceArchiveRef = ref('wrong-source') },
  (value) => { value.modelArtifacts.checkpointRef = ref('wrong-checkpoint') },
  (value) => {
    value.modelArtifacts.immutableImageReleaseRef = ref('wrong-image')
  },
  (value) => { value.settings.useFlashAttention3 = true as never },
  (value) => { value.settings.maximumTrackedObjectsProductCap = 128 as never },
  (value) => { value.settings.offloadVideoToCpu = true as never },
  (value) => { value.settings.cpuOpenCvOrPillowDecodeAllowed = true as never },
]
for (const mutate of adversarial) {
  const value = structuredClone(request)
  mutate(value)
  const payload = { ...value }
  Reflect.deleteProperty(payload, 'requestBindingSha256')
  value.requestBindingSha256 = sha256AuthorityValue(payload)
  assert.throws(() => assertCanonicalSam31GpuRuntimeRequest(value))
}

const badResponse = structuredClone(response)
badResponse.outputSummary = null
const badResponsePayload = { ...badResponse }
Reflect.deleteProperty(badResponsePayload, 'responseBindingSha256')
badResponse.responseBindingSha256 = sha256AuthorityValue(badResponsePayload)
assert.throws(() => assertCanonicalSam31GpuRuntimeResponse({
  request,
  response: badResponse,
}))

const wrongGpuResponse = structuredClone(response)
wrongGpuResponse.gpuEvidence!.requestedAccelerator = 'nvidia_l4'
const wrongGpuPayload = { ...wrongGpuResponse }
Reflect.deleteProperty(wrongGpuPayload, 'responseBindingSha256')
wrongGpuResponse.responseBindingSha256 = sha256AuthorityValue(
  wrongGpuPayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeResponse({
  request,
  response: wrongGpuResponse,
}))

const wrongHostModeResponse = structuredClone(response)
wrongHostModeResponse.gpuEvidence!.observedNvidiaDriverVersion = '535.216.03'
const wrongHostModePayload = { ...wrongHostModeResponse }
Reflect.deleteProperty(wrongHostModePayload, 'responseBindingSha256')
wrongHostModeResponse.responseBindingSha256 = sha256AuthorityValue(
  wrongHostModePayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeResponse({
  request,
  response: wrongHostModeResponse,
}))

const wrongCompatModeResponse = structuredClone(response)
wrongCompatModeResponse.gpuEvidence!.cudaDriverLibraryMode =
  'cuda_compat_12_8'
wrongCompatModeResponse.gpuEvidence!.cudaForwardCompatibilityLibraryLoaded =
  true
wrongCompatModeResponse.gpuEvidence!.hostCudaDriverLibraryLoaded = false
const wrongCompatModePayload = { ...wrongCompatModeResponse }
Reflect.deleteProperty(wrongCompatModePayload, 'responseBindingSha256')
wrongCompatModeResponse.responseBindingSha256 = sha256AuthorityValue(
  wrongCompatModePayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeResponse({
  request,
  response: wrongCompatModeResponse,
}))

const partialFramesResponse = structuredClone(response)
partialFramesResponse.outputSummary!.lastFrameIndex = 238
partialFramesResponse.outputSummary!.propagatedFrameCount = 239
const partialFramesPayload = { ...partialFramesResponse }
Reflect.deleteProperty(partialFramesPayload, 'responseBindingSha256')
partialFramesResponse.responseBindingSha256 = sha256AuthorityValue(
  partialFramesPayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeResponse({
  request,
  response: partialFramesResponse,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-contract',
  checks: 52,
  primaryProfile: request.dispatch.gpuProfileId,
  fallbackProfile: fallback.dispatch.gpuProfileId,
  fixedBuilder: request.settings.builder,
  trackedObjectProductCap: request.settings.maximumTrackedObjectsProductCap,
  cpuOnlyInferenceAllowed: request.dispatch.cpuOnlyInferenceAllowed,
  runtimeNetworkAllowed: request.modelArtifacts.runtimeDownloadAllowed,
  vertexV2QualificationAcceptedWithoutRelabel: true,
  adversarialCases: adversarial.length + 5,
  requestBindingSha256: request.requestBindingSha256,
  responseBindingSha256: response.responseBindingSha256,
}))
