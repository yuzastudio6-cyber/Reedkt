import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
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
    gpuMemoryProfileId: 'a100_full_gpu_state_v1',
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
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile

runner_path = sys.argv[1]
spec = importlib.util.spec_from_file_location("sam31_production_runner", runner_path)
if spec is None or spec.loader is None:
    raise RuntimeError("SAM 3.1 runner module could not be loaded")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
selected_driver_path = runner.select_loaded_cuda_driver_library_path([
    ("/usr/local/nvidia/lib64/libcuda.so.580.82.07", (7, 11)),
    ("/usr/lib/x86_64-linux-gnu/libcuda.so.580.82.07", (7, 11)),
])
if selected_driver_path != "/usr/lib/x86_64-linux-gnu/libcuda.so.580.82.07":
    raise AssertionError("CUDA driver alias selection is not canonical")
try:
    runner.select_loaded_cuda_driver_library_path([
        ("/usr/local/nvidia/lib64/libcuda.so.580.82.07", (7, 11)),
        ("/untrusted/libcuda.so.580.82.07", (8, 12)),
    ])
except RuntimeError:
    pass
else:
    raise AssertionError("multiple CUDA driver files were accepted")
if runner.failure_diagnostic_code(
    RuntimeError("loaded CUDA driver library does not match its mode")
) != "driver_file_mode_mismatch":
    raise AssertionError("known CUDA failure was not safely classified")
if runner.failure_diagnostic_code(
    RuntimeError("cuda_bfloat16_kernel_probe_failed")
) != "cuda_bfloat16_kernel_probe_failed":
    raise AssertionError("bfloat16 kernel failure was not safely classified")
if runner.failure_diagnostic_code(
    RuntimeError("nvml_initialization_failed")
) != "nvml_initialization_failed":
    raise AssertionError("NVML initialization failure was not safely classified")
if runner.failure_diagnostic_code(
    RuntimeError("nvml_driver_version_probe_failed")
) != "nvml_driver_version_probe_failed":
    raise AssertionError("NVML driver probe failure was not safely classified")
if runner.failure_diagnostic_code(
    RuntimeError("nvml_library_load_failed")
) != "nvml_library_load_failed":
    raise AssertionError("NVML library failure was not safely classified")
if runner.failure_diagnostic_code(
    RuntimeError("nvml_symbol_resolution_failed")
) != "nvml_symbol_resolution_failed":
    raise AssertionError("NVML symbol failure was not safely classified")
if runner.failure_diagnostic_code(
    RuntimeError("nvml_decoder_utilization_probe_failed")
) != "nvml_decoder_utilization_probe_failed":
    raise AssertionError("NVML decoder failure was not safely classified")
if "pynvml" in Path(runner_path).read_text(encoding="utf-8"):
    raise AssertionError("undeclared pynvml dependency remains in the worker")
if runner.exclusive_phase_nanoseconds(95_610_000_000, 70_969_000_000) != 24_641_000_000:
    raise AssertionError("nested persistence time was not removed from propagation")
for invalid_phase_timing in ((1, 2), (-1, 0), (1, -1), (True, 0)):
    try:
        runner.exclusive_phase_nanoseconds(*invalid_phase_timing)
    except RuntimeError:
        pass
    else:
        raise AssertionError("invalid phase timing was accepted")

class FakeNvmlFunction:
    def __init__(self, implementation):
        self.implementation = implementation
        self.argtypes = None
        self.restype = None

    def __call__(self, *args):
        return self.implementation(*args)

class FakeNvmlLibrary:
    def __init__(self):
        self.nvmlInit_v2 = FakeNvmlFunction(lambda: 0)
        self.nvmlShutdown = FakeNvmlFunction(lambda: 0)
        self.nvmlSystemGetDriverVersion = FakeNvmlFunction(
            self.get_driver_version
        )
        self.nvmlDeviceGetHandleByIndex_v2 = FakeNvmlFunction(
            self.get_handle
        )
        self.nvmlDeviceGetUtilizationRates = FakeNvmlFunction(
            self.get_utilization
        )
        self.nvmlDeviceGetDecoderUtilization = FakeNvmlFunction(
            self.get_decoder_utilization
        )

    @staticmethod
    def get_driver_version(destination, length):
        value = b"580.82.07\0"
        if int(length) < len(value):
            return 7
        runner.ctypes.memmove(destination, value, len(value))
        return 0

    @staticmethod
    def get_handle(index, destination):
        if int(index) != 0:
            return 2
        destination._obj.value = 0xA100
        return 0

    @staticmethod
    def get_utilization(_handle, destination):
        destination._obj.gpu = 87
        destination._obj.memory = 64
        return 0

    @staticmethod
    def get_decoder_utilization(_handle, utilization, sampling_period):
        utilization._obj.value = 71
        sampling_period._obj.value = 16_000
        return 0

original_cdll = runner.ctypes.CDLL
runner.ctypes.CDLL = lambda *_args, **_kwargs: FakeNvmlLibrary()
try:
    nvml = runner.load_fixed_nvml_binding()
    nvml.initialize()
    if nvml.driver_version() != b"580.82.07":
        raise AssertionError("fixed NVML driver-version ABI returned wrong data")
    nvml_handle = nvml.device_handle()
    if nvml_handle.value != 0xA100:
        raise AssertionError("fixed NVML device-handle ABI returned wrong data")
    if nvml.gpu_utilization_percent(nvml_handle) != 87:
        raise AssertionError("fixed NVML compute-utilization ABI returned wrong data")
    if nvml.decoder_utilization_percent(nvml_handle) != 71:
        raise AssertionError("fixed NVML decoder-utilization ABI returned wrong data")
    nvml.shutdown()
finally:
    runner.ctypes.CDLL = original_cdll
runner.stage = "cuda_admission"
if runner.failure_diagnostic_code(
    ImportError("private package detail")
) != "cuda_dependency_import_failed":
    raise AssertionError("CUDA dependency import failure was not safely classified")
try:
    runner.guarded_cuda_probe(
        "cuda_device_properties_probe_failed",
        lambda: (_ for _ in ()).throw(RuntimeError("private provider detail")),
    )
except RuntimeError as error:
    if str(error) != "cuda_device_properties_probe_failed":
        raise AssertionError("CUDA probe exposed a provider exception")
else:
    raise AssertionError("failed CUDA probe was accepted")
if runner.failure_diagnostic_code(
    RuntimeError("private unexpected detail")
) != "unclassified_fail_closed":
    raise AssertionError("unknown CUDA failure detail was exposed")
class OutOfMemoryError(RuntimeError):
    pass
if runner.failure_diagnostic_code(
    OutOfMemoryError("private allocator detail")
) != "cuda_out_of_memory":
    raise AssertionError("CUDA OOM was not classified without message exposure")

class FakeTracker:
    forward_backbone_per_frame_for_eval = True
    offload_output_to_cpu_for_eval = False
    trim_past_non_cond_mem_for_eval = False
    num_maskmem = 7
    memory_temporal_stride_for_eval = 1

class FakeModel:
    tracker = FakeTracker()

class FakePredictor:
    model = FakeModel()

a100_predictor = FakePredictor()
a100_profile = runner.configure_gpu_memory_profile(
    a100_predictor, "nvidia_a100_80gb"
)
if a100_profile != (runner.A100_GPU_MEMORY_PROFILE, False):
    raise AssertionError("A100 full GPU-state profile changed")
if a100_predictor.model.tracker.trim_past_non_cond_mem_for_eval:
    raise AssertionError("A100 unexpectedly enabled temporal-memory trim")
l4_predictor = FakePredictor()
l4_profile = runner.configure_gpu_memory_profile(l4_predictor, "nvidia_l4")
if l4_profile != (runner.L4_GPU_MEMORY_PROFILE, True):
    raise AssertionError("L4 GPU-only bounded-memory profile changed")
if not l4_predictor.model.tracker.trim_past_non_cond_mem_for_eval:
    raise AssertionError("L4 temporal-memory trim was not enabled")
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

def fixture_ref(identity, version=1):
    return {
        "id": identity,
        "version": version,
        "contentHash": "sha256:" + hashlib.sha256(identity.encode()).hexdigest(),
    }

qualification_id = "sam31-vertex-qualification-fixture"
worker_request_ref = {
    **fixture_ref(qualification_id, 2),
    "schemaVersion": (
        "canonical-sam3_1-source-checkpoint-qualification-worker-request-v2"
    ),
}
worker_result_ref = {
    **fixture_ref("sam31-vertex-worker-result"),
    "schemaVersion": (
        "canonical-sam3_1-source-checkpoint-qualification-worker-result-v2"
    ),
}
qualification_payload = {
    "schemaVersion": (
        "canonical-sam3_1-source-checkpoint-compatibility-qualification-v2"
    ),
    "source": "canonical_sam3_1_vertex_source_checkpoint_qualification_owner",
    "evidenceClass": "canonical_private_reread",
    "status": "qualified_for_private_image_build",
    "qualificationId": qualification_id,
    "qualificationVersion": 2,
    "candidate": {"operationId": runner.OPERATION_ID},
    "ingestReceipt": {},
    "workerRequest": {},
    "workerResult": {},
    "admission": {},
    "execution": {},
    "terminalReconciliation": {},
    "providerUsage": {},
    "platformStop": {},
    "currentAccountRateAuthority": {},
    "qualificationCostReceipt": {},
    "securityComplianceClearance": {},
    "exactEvidenceRefs": {
        "workerRequestRef": worker_request_ref,
        "workerResultRef": worker_result_ref,
        "admissionRef": fixture_ref("sam31-vertex-admission"),
        "executionRef": fixture_ref("sam31-vertex-execution"),
        "cloudTerminalObservationRef": fixture_ref("sam31-vertex-terminal"),
        "providerUsageEvidenceRef": fixture_ref("sam31-vertex-usage"),
        "platformStopEvidenceRef": fixture_ref("sam31-vertex-stop"),
        "currentAccountRateAuthorityRef": fixture_ref("sam31-vertex-rate"),
        "qualificationCostReceiptRef": fixture_ref("sam31-vertex-cost"),
        "securityComplianceClearanceRef": fixture_ref("sam31-vertex-security"),
    },
    "qualificationTruth": {
        "officialSam31SourceAndCheckpointReread": True,
        "exactVertexRequestResultAdmissionExecutionAndTerminalReread": True,
        "exactA10080GbExecutionVerified": True,
        "actualCudaModelInferenceExecuted": True,
        "completeForwardPropagationExecuted": True,
        "deterministicRepeatedProbeVerified": True,
        "strictCheckpointLoadVerified": True,
        "networkEgressObserved": False,
        "cpuOnlyModelExecutionObserved": False,
        "cpuVideoDecodeFallbackObserved": False,
        "quantizationOrResolutionReductionUsed": False,
        "automaticRetryUsed": False,
        "persistentGpuResourceObserved": False,
        "activeA100GpuInstancesAfterObservation": 0,
        "billingAccountEffectiveRateAndUsageReread": True,
        "cloudInvoiceReconciliationStillRequired": True,
        "legacyBatchRequestOrResultCastOrRelabelUsed": False,
    },
    "authority": {
        "sourceCheckpointQualificationGranted": True,
        "privateImageBuildReviewEligible": True,
        "imageBuildStarted": False,
        "productionRuntimeDispatchAuthorized": False,
        "customerMediaProcessed": False,
        "customerCreditsMutated": False,
        "customerBillingAuthorityGranted": False,
        "qaApproved": False,
        "publicDeliveryAuthorized": False,
        "productionReady": False,
    },
    "qualifiedAt": "2026-08-10T00:00:00.000Z",
}
qualification_hash = hashlib.sha256(
    runner.observed_canonical_json_bytes(qualification_payload)
).hexdigest()
qualification = {
    **qualification_payload,
    "qualificationHash": qualification_hash,
}
qualification_ref = {
    "id": qualification_id,
    "version": 2,
    "schemaVersion": qualification_payload["schemaVersion"],
    "contentHash": "sha256:" + qualification_hash,
}
ingest_hash = hashlib.sha256(b"sam31-ingest").hexdigest()
plain_vertex_refs = {
    name: fixture_ref("binding-" + name)
    for name in (
        "workerRequestRef",
        "workerResultRef",
        "admissionRef",
        "executionRef",
        "terminalReconciliationRef",
        "providerUsageEvidenceRef",
        "platformStopEvidenceRef",
        "currentAccountRateAuthorityRef",
        "qualificationCostReceiptRef",
        "securityComplianceClearanceRef",
    )
}
plain_vertex_refs["workerRequestRef"] = fixture_ref(qualification_id, 2)
binding_payload = {
    "schemaVersion": "canonical-sam3_1-image-build-artifact-binding-v3",
    "source": "canonical_sam3_1_vertex_image_build_artifact_owner",
    "evidenceClass": "canonical_private_reread",
    "status": "private_artifacts_admitted",
    "operationId": runner.OPERATION_ID,
    "candidateRef": {
        "schemaVersion": "canonical-sam3_1-source-runtime-candidate-v4",
        "candidateHash": hashlib.sha256(b"candidate").hexdigest(),
    },
    "ingestReceiptRef": {
        **fixture_ref("sam31-ingest"),
        "schemaVersion": "canonical-sam3_1-private-artifact-ingest-receipt-v3",
        "contentHash": "sha256:" + ingest_hash,
    },
    "sourceCheckpointQualificationRef": qualification_ref,
    "termsAcceptanceRef": fixture_ref("terms"),
    "sourceArchive": {
        "repository": "https://github.com/facebookresearch/sam3.git",
        "revision": runner.SOURCE_REVISION,
        "artifactRef": fixture_ref("source"),
        "byteLength": runner.SOURCE_ARCHIVE_BYTE_LENGTH,
        "sha256": runner.SOURCE_ARCHIVE_SHA256,
        "licenseRef": fixture_ref("source-license"),
        "securityReviewRef": fixture_ref("source-security"),
        "malwareScanRef": fixture_ref("source-malware"),
    },
    "checkpoint": {
        "repository": "facebook/sam3.1",
        "revision": runner.CHECKPOINT_REVISION,
        "fileName": runner.CHECKPOINT_FILE_NAME,
        "artifactRef": fixture_ref("checkpoint"),
        "manifestRef": fixture_ref("checkpoint-manifest"),
        "byteLength": 3_502_755_717,
        "sha256": hashlib.sha256(b"checkpoint").hexdigest(),
        "licenseRef": fixture_ref("checkpoint-license"),
        "securityReviewRef": fixture_ref("checkpoint-security"),
        "malwareScanRef": fixture_ref("checkpoint-malware"),
        "checkpointBytesIncludedInImageBuildCapsule": False,
        "checkpointRereadOnlyAtQualifiedRuntime": True,
    },
    "vertexQualificationEvidenceRefs": plain_vertex_refs,
    "qualificationTruth": {
        "exactVertexA100ExecutionReread": True,
        "actualCudaModelInferenceExecuted": True,
        "completeForwardPropagationExecuted": True,
        "deterministicRepeatedProbeVerified": True,
        "strictCheckpointLoadVerified": True,
        "cpuOnlySubstantiveExecutionObserved": False,
        "cpuVideoDecodeFallbackObserved": False,
        "legacyBatchCastOrRelabelUsed": False,
        "scaleFromZeroVerified": True,
        "accountEffectivePricingReread": True,
    },
    "privacyBoundary": {
        "sourceOrCheckpointStorageCoordinateIncluded": False,
        "bucketObjectGenerationEtagIncluded": False,
        "checkpointBytesIncluded": False,
        "providerOrRepositoryTokenIncluded": False,
        "browserOrCallerDataIncluded": False,
        "opaqueEvidenceRefsOnly": True,
    },
    "authority": {
        "sanitizedBuildBindingOnly": True,
        "privateArtifactIngestReread": True,
        "sourceCheckpointQualificationReread": True,
        "imageBuildAuthorized": False,
        "imageBuildStarted": False,
        "runtimeAuthorized": False,
        "checkpointRedistributionAuthorized": False,
        "customerCreditsMutated": False,
        "qaApproved": False,
        "productionReady": False,
    },
}
binding = {
    **binding_payload,
    "bindingHash": hashlib.sha256(
        runner.observed_canonical_json_bytes(binding_payload)
    ).hexdigest(),
}
with tempfile.TemporaryDirectory() as root:
    qualification_path = Path(root) / "qualification.json"
    binding_path = Path(root) / "binding.json"
    qualification_path.write_bytes(
        runner.observed_canonical_json_bytes(qualification)
    )
    binding_path.write_bytes(runner.observed_canonical_json_bytes(binding))
    runner.read_closed_receipt(qualification_path, qualification_ref)
    runner.read_artifact_build_binding(
        binding_path, ingest_hash, qualification_ref
    )
    relabeled_binding = copy.deepcopy(binding)
    relabeled_binding["sourceCheckpointQualificationRef"]["version"] = 1
    relabeled_payload = dict(relabeled_binding)
    del relabeled_payload["bindingHash"]
    relabeled_binding["bindingHash"] = hashlib.sha256(
        runner.observed_canonical_json_bytes(relabeled_payload)
    ).hexdigest()
    binding_path.write_bytes(
        runner.observed_canonical_json_bytes(relabeled_binding)
    )
    try:
        runner.read_artifact_build_binding(
            binding_path, ingest_hash, qualification_ref
        )
    except ValueError:
        pass
    else:
        raise AssertionError("cross-version baked binding relabel was accepted")

print(json.dumps({
    "v1Accepted": True,
    "v2Accepted": True,
    "relabelRejected": True,
    "vertexQualificationReceiptV2Accepted": True,
    "vertexImageBindingV3Accepted": True,
    "bakedBindingRelabelRejected": True,
    "providerMountAliasesCollapsedByFileIdentity": True,
    "multipleDriverFilesRejected": True,
    "safeCudaDiagnosticTaxonomyVerified": True,
    "routeBoundGpuMemoryProfilesVerified": True,
}))
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
  {
    v1Accepted: true,
    v2Accepted: true,
    relabelRejected: true,
    vertexQualificationReceiptV2Accepted: true,
    vertexImageBindingV3Accepted: true,
    bakedBindingRelabelRejected: true,
    providerMountAliasesCollapsedByFileIdentity: true,
    multipleDriverFilesRejected: true,
    safeCudaDiagnosticTaxonomyVerified: true,
    routeBoundGpuMemoryProfilesVerified: true,
  },
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
    gpuMemoryProfileId: 'a100_full_gpu_state_v1',
    pastNonConditioningMemoryTrimmedOnGpu: false,
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
const historicalRequestPayload = structuredClone(request)
Reflect.deleteProperty(historicalRequestPayload, 'requestBindingSha256')
Reflect.deleteProperty(
  historicalRequestPayload.settings,
  'gpuMemoryProfileId',
)
const historicalRequest = buildCanonicalSam31GpuRuntimeRequest(
  historicalRequestPayload,
)
const historicalResponsePayload = structuredClone(response)
Reflect.deleteProperty(historicalResponsePayload, 'responseBindingSha256')
historicalResponsePayload.requestBindingSha256 =
  historicalRequest.requestBindingSha256
Reflect.deleteProperty(
  historicalResponsePayload.gpuEvidence!,
  'gpuMemoryProfileId',
)
Reflect.deleteProperty(
  historicalResponsePayload.gpuEvidence!,
  'pastNonConditioningMemoryTrimmedOnGpu',
)
const historicalResponse = buildCanonicalSam31GpuRuntimeResponse(
  historicalResponsePayload,
)
assert.deepEqual(assertCanonicalSam31GpuRuntimeResponse({
  request: historicalRequest,
  response: historicalResponse,
}), historicalResponse)
const responseWirePayload = structuredClone(response) as Record<string, unknown>
Reflect.deleteProperty(responseWirePayload, 'responseBindingSha256')
assert.equal(
  response.responseBindingSha256,
  utf16LexicalWireDigest(responseWirePayload),
)
assert.notEqual(
  response.responseBindingSha256,
  sha256AuthorityValue(responseWirePayload),
)

const doubleCountedResponse = structuredClone(response)
doubleCountedResponse.runtimeMeasurement!.propagationMilliseconds = 111_000
const doubleCountedPayload = { ...doubleCountedResponse }
Reflect.deleteProperty(doubleCountedPayload, 'responseBindingSha256')
doubleCountedResponse.responseBindingSha256 = sha256AuthorityValue(
  doubleCountedPayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeResponse({
  request,
  response: doubleCountedResponse,
}))

function utf16LexicalWireDigest(value: unknown): string {
  const stable = (nested: unknown): unknown => {
    if (Array.isArray(nested)) return nested.map(stable)
    if (nested && typeof nested === 'object') {
      return Object.fromEntries(
        Object.entries(nested as Record<string, unknown>)
          .filter(([, item]) => item !== undefined)
          .sort(([left], [right]) =>
            left < right ? -1 : left > right ? 1 : 0)
          .map(([key, item]) => [key, stable(item)]),
      )
    }
    return nested
  }
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')
}

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
  settings: {
    ...request.settings,
    gpuMemoryProfileId:
      'l4_gpu_only_serial_object_propagation_trimmed_past_non_conditioning_memory_v1',
  },
})
assert.equal(fallback.dispatch.accelerator, 'nvidia_l4')
const staleL4MemoryProfile = structuredClone(fallback)
staleL4MemoryProfile.settings.gpuMemoryProfileId =
  'l4_gpu_only_trimmed_past_non_conditioning_memory_v1'
const staleL4MemoryProfilePayload = { ...staleL4MemoryProfile }
Reflect.deleteProperty(
  staleL4MemoryProfilePayload,
  'requestBindingSha256',
)
staleL4MemoryProfile.requestBindingSha256 = sha256AuthorityValue(
  staleL4MemoryProfilePayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeRequest(
  staleL4MemoryProfile,
))

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
  (value) => {
    value.settings.gpuMemoryProfileId =
      'l4_gpu_only_trimmed_past_non_conditioning_memory_v1'
  },
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

const wrongMemoryProfileResponse = structuredClone(response)
wrongMemoryProfileResponse.gpuEvidence!.gpuMemoryProfileId =
  'l4_gpu_only_trimmed_past_non_conditioning_memory_v1'
wrongMemoryProfileResponse.gpuEvidence!
  .pastNonConditioningMemoryTrimmedOnGpu = true
const wrongMemoryProfilePayload = { ...wrongMemoryProfileResponse }
Reflect.deleteProperty(wrongMemoryProfilePayload, 'responseBindingSha256')
wrongMemoryProfileResponse.responseBindingSha256 = sha256AuthorityValue(
  wrongMemoryProfilePayload,
)
assert.throws(() => assertCanonicalSam31GpuRuntimeResponse({
  request,
  response: wrongMemoryProfileResponse,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-contract',
  checks: 64,
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
