import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV2,
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2,
  buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2,
  buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2,
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  sealCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerEvidence,
} from '../services/canonical-track-all-sam3_1-task-qa-owner'

const ref = (id: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${sha256AuthorityValue({ id })}` as const,
})
const manifestHash = sha256AuthorityValue({ manifest: 'exact-sam-output' })
const sourceFrameMappingRef = ref('source-frame-mapping')
const confirmedOutputFrameRef = ref('confirmed-output-frame')
const request = buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-request-v2',
  operationId: 'tool.kornia.refine_mask.v1',
  l4InvocationId: 'l4-execution-envelope',
  sam31InvocationId: 'sam31-runtime-invocation',
  sam31TaskRef: ref('sam31-task'),
  sam31RuntimeRequestBindingSha256:
    sha256AuthorityValue({ sam31: 'runtime-request' }),
  sam31RuntimeResultAdmissionRef: ref('sam31-result-admission'),
  sam31MaskManifestRef: {
    id: 'sam31-mask-manifest',
    version: 1,
    contentHash: `sha256:${manifestHash}`,
  },
  l4ExecutionEnvelopeRef: ref('l4-execution-envelope'),
  approvedWorkItemRef: ref('l4-approved-work'),
  workerLeaseRef: ref('l4-worker-lease'),
  executionAttemptRef: ref('l4-attempt'),
  sourceFrameMappingRef,
  confirmedOutputFrameRef,
  sourceWidth: 1920,
  sourceHeight: 1080,
  maskFrameRange: { startFrame: 0, endFrameExclusive: 4 },
  expectedMaskManifestByteLength: 8192,
  expectedMaskManifestSha256: manifestHash,
  expectedMaskPngCount: 8,
  subjects: [{
    subjectRequestId: 'subject-request-primary',
    subjectEvidenceId: 'subject-evidence-primary',
    subjectRole: 'primary_speaker',
    maskObjectId: 1,
    canonicalFrameRange: { startFrame: 120, endFrameExclusive: 124 },
    maskFrameRange: { startFrame: 0, endFrameExclusive: 4 },
    trackManifestRef: ref('track-manifest-primary'),
    anchorManifestRef: ref('anchor-manifest-primary'),
    sourceFrameMappingRef,
    outputFrameDigestSha256: confirmedOutputFrameRef.contentHash.slice(7),
  }, {
    subjectRequestId: 'subject-request-product',
    subjectEvidenceId: 'subject-evidence-product',
    subjectRole: 'product',
    maskObjectId: 2,
    canonicalFrameRange: { startFrame: 120, endFrameExclusive: 124 },
    maskFrameRange: { startFrame: 0, endFrameExclusive: 4 },
    trackManifestRef: ref('track-manifest-product'),
    anchorManifestRef: null,
    sourceFrameMappingRef,
    outputFrameDigestSha256: confirmedOutputFrameRef.contentHash.slice(7),
  }],
  executionPolicy: {
    routeId: 'l4_standard_primary',
    gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
    accelerator: 'nvidia_l4',
    korniaVersion: '0.8.3',
    torchVersion: '2.10.0+cu128',
    cudaRuntimeVersion: '12.8',
    morphologyKernelSize: 3,
    binaryThreshold: 127,
    everyManifestMaskMustBeReread: true,
    everyRequestedFrameAndSubjectMustBeMeasured: true,
    korniaCudaSubstantiveMeasurementRequired: true,
    opencvCudaEveryMaskCrosscheckRequired: true,
    cpuDecodeAndBoundedSerializationOnly: true,
    cpuOnlySubstantiveMaskQaAllowed: false,
    runtimeDownloadAllowed: false,
    automaticRetryAfterUnknownOutcomeAllowed: false,
  },
  byteFreeRequest: true,
  callerPathUrlCommandCodeOrEnvironmentAccepted: false,
  browserOrCallerMeasurementAccepted: false,
})

assert.equal(
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV2(request)
    .requestBindingSha256,
  request.requestBindingSha256,
)
assert.equal(
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef().id,
  'canonical-track-all-sam3_1-l4-task-qa-fixed-task-v2',
)

const measurement = (
  subjectRequestId: string,
  subjectEvidenceId: string,
  maskObjectId: number,
) => ({
  subjectRequestId,
  subjectEvidenceId,
  maskObjectId,
  measuredFrameCount: 4,
  expectedFrameCount: 4,
  emptyMaskFrameCount: 0,
  fullFrameMaskCount: 0,
  minimumBinaryIntersectionOverUnionBasisPoints: 9_100,
  maximumNormalizedCentroidShiftBasisPoints: 180,
  maximumBoundaryDisagreementBasisPoints: 250,
  maximumAlphaFlickerBasisPoints: 220,
  minimumEdgeQualityBasisPoints: 9_750,
  minimumSubjectCoverageBasisPoints: 9_200,
  identitySwapCount: 0,
  lostAnchorFrameCount: 0,
  firstMaskFrameIndex: 0,
  lastMaskFrameIndex: 3,
  maskPngCount: 4,
  maskPngByteLength: 4096,
  orderedMaskSetDigestSha256: sha256AuthorityValue({ subjectEvidenceId }),
  completeRequestedRangeCoverage: true as const,
})

const response = buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-response-v2',
  operationId: 'tool.kornia.refine_mask.v1',
  l4InvocationId: request.l4InvocationId,
  sam31InvocationId: request.sam31InvocationId,
  requestBindingSha256: request.requestBindingSha256,
  status: 'completed',
  terminalStage: 'completed',
  gpuEvidence: {
    requestedAccelerator: 'nvidia_l4',
    observedDeviceNameDigestSha256: sha256AuthorityValue({ device: 'l4' }),
    observedNvidiaDriverVersion: '535.216.03',
    observedCudaRuntimeVersion: '12.8',
    observedTorchVersion: '2.10.0+cu128',
    observedKorniaVersion: '0.8.3',
    observedOpenCvVersion: '4.13.0',
    observedComputeCapabilityMajor: 8,
    observedComputeCapabilityMinor: 9,
    observedTotalDeviceMemoryBytes: 24 * 1024 ** 3,
    maximumObservedGpuUtilizationPercent: 72,
    cudaAvailable: true,
    exactL4DeviceObserved: true,
    korniaCudaTensorExecutionObserved: true,
    opencvCudaDeviceCount: 1,
    opencvCudaEveryMaskCrosschecked: true,
    torchCudaKernelCount: 10,
    opencvCudaKernelCount: 16,
    cpuOnlySubstantiveMaskQaUsed: false,
    cudaDriverLibraryMode: 'cuda_compat_12_8',
    observedCudaDriverLibraryPathDigestSha256:
      sha256AuthorityValue({ path: 'compat' }),
  },
  inputEvidence: {
    manifestByteLength: 8192,
    manifestSha256: manifestHash,
    manifestRefExactMatch: true,
    manifestRequestBindingExactMatch: true,
    maskPngCount: 8,
    maskPngByteLength: 8192,
    everyManifestMaskPngRereadAndHashed: true,
    everyRequestedFrameAndSubjectPresentExactlyOnce: true,
    everyMaskMatchesSourceGeometry: true,
    everyMaskIsBinaryGrayscalePng: true,
    unrequestedManifestObjectOrFrameAccepted: false,
  },
  runtimeMeasurement: {
    wallTimeMilliseconds: 950,
    decodeAndUploadMilliseconds: 110,
    korniaCudaMilliseconds: 320,
    opencvCudaCrosscheckMilliseconds: 180,
    peakCudaAllocatedBytes: 1_024_000,
    peakCudaReservedBytes: 2_048_000,
  },
  outputSummary: {
    subjectMeasurements: [
      measurement('subject-request-primary', 'subject-evidence-primary', 1),
      measurement('subject-request-product', 'subject-evidence-product', 2),
    ],
    korniaCudaExecutionDigestSha256: sha256AuthorityValue({ kornia: 'cuda' }),
    opencvCudaCrosscheckExecutionDigestSha256:
      sha256AuthorityValue({ opencv: 'cuda' }),
    completeRequestedFrameAndSubjectCoverage: true,
    sampledOrRepresentativeOnlyMeasurementAccepted: false,
    exactMaskManifestAndEveryMaskPngReread: true,
  },
  failureCode: 'none',
  privateCreateOnlyWorkerOutput: true,
  runtimeDownloadPerformed: false,
  cpuOnlySubstantiveMaskQaUsed: false,
  serverCostReceiptIncluded: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  assetManifestMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})

assert.equal(
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2(response).status,
  'completed',
)
const rawRef = (id: string, contentHash = sha256AuthorityValue({ id })) => ({
  id,
  version: '1',
  contentHash,
})
const canonicalMeasurement =
  sealCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerEvidence({
    measurementId: 'l4-task-qa-measurement',
    canonicalSam31TaskRef: {
      ...rawRef('sam31-task', request.sam31TaskRef.contentHash.slice(7)),
      version: 'canonical-sam3_1-gpu-task-record-v1',
    },
    canonicalSam31RuntimeResultAdmissionRef: {
      ...rawRef(
        'sam31-result-admission',
        request.sam31RuntimeResultAdmissionRef.contentHash.slice(7),
      ),
      version: 'canonical-sam3_1-gpu-runtime-result-admission-v1',
    },
    canonicalSam31MaskSequenceArtifactRef: rawRef(
      'sam31-mask-sequence-artifact',
    ),
    canonicalL4ExecutionEnvelopeRef: rawRef(
      'l4-execution-envelope',
      request.l4ExecutionEnvelopeRef.contentHash.slice(7),
    ),
    canonicalScope: {
      ownerUserId: 'owner-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      editSessionId: 'edit-session-1',
      planVersionId: 'plan-version-1',
      approvedSnapshotRef: rawRef('approved-snapshot'),
      outputId: 'output-wide',
      sceneId: 'scene-1',
      authorizedFrameRanges: [{ startFrame: 120, endFrameExclusive: 124 }],
    },
    sourcePrivateArtifactRef: rawRef('source-private-artifact'),
    requestedRange: { startFrame: 120, endFrameExclusive: 124 },
    l4QaExecution: {
      routeId: 'l4_standard_primary',
      gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
      accelerator: 'nvidia_l4',
      approvedWorkItemRef: rawRef('l4-approved-work'),
      workerLeaseRef: rawRef('l4-worker-lease'),
      executionAttemptRef: rawRef('l4-attempt'),
      currentAccountPriceAuthorityRef: rawRef('l4-current-price'),
      workerUsageEvidenceRef: rawRef('l4-usage'),
      attemptCostReceiptRef: rawRef('l4-attempt-cost'),
      korniaCudaExecutionEvidenceRef: rawRef(
        'l4-kornia-execution',
        response.outputSummary!.korniaCudaExecutionDigestSha256,
      ),
      opencvCrosscheckExecutionEvidenceRef: rawRef(
        'l4-opencv-execution',
        response.outputSummary!.opencvCudaCrosscheckExecutionDigestSha256,
      ),
      actualL4GpuExecutionObserved: true,
      actualKorniaCudaKernelExecutionObserved: true,
      actualOpenCvCrosscheckExecutionObserved: true,
      cpuOnlySubstantiveMaskQaUsed: false,
      userTriggeredAfterApprovedWork: true,
      terminalWorkerStoppedAndScaleBackToZeroVerified: true,
      exactAccountEffectiveAttemptCostPersisted: true,
    },
    workerRequest: request,
    workerResponse: response,
    measuredAt: '2026-08-05T20:00:00.000Z',
  })
assert.equal(canonicalMeasurement.subjectEvidence.length, 2)
assert.equal(
  canonicalMeasurement.sam31TaskRef.version,
  'canonical-sam3_1-gpu-task-record-v1',
)
assert.equal(
  canonicalMeasurement.sam31RuntimeResultAdmissionRef.version,
  'canonical-sam3_1-gpu-runtime-result-admission-v1',
)
assert.equal(
  canonicalMeasurement.subjectEvidence[0]?.temporalQa
    .minimumBinaryIntersectionOverUnionBasisPoints,
  9_100,
)
assert.equal(
  canonicalMeasurement.exactMaskManifestAndEveryMaskPngReread,
  true,
)
const { requestBindingSha256: _requestBindingSha256, ...requestPayload } =
  structuredClone(request)
assert.equal(_requestBindingSha256, request.requestBindingSha256)
assert.throws(() => assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV2({
  ...structuredClone(request),
  expectedMaskPngCount: 7,
}))
assert.throws(() => buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2({
  ...requestPayload,
  executionPolicy: {
    ...structuredClone(request.executionPolicy),
    cpuOnlySubstantiveMaskQaAllowed: true,
  },
} as never))
assert.throws(() => buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2({
  ...requestPayload,
  subjects: request.subjects.map((subject, index) => index === 0
    ? {
        ...structuredClone(subject),
        outputFrameDigestSha256: sha256AuthorityValue({ wrong: 'frame' }),
      }
    : structuredClone(subject)),
}))
assert.throws(() => buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2({
  ...requestPayload,
  l4InvocationId: request.sam31InvocationId,
  l4ExecutionEnvelopeRef: {
    ...request.l4ExecutionEnvelopeRef,
    id: request.sam31InvocationId,
  },
}))
assert.throws(() => assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2({
  ...structuredClone(response),
  customerCreditsMutated: true,
}))
assert.throws(() => buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2({
  ...(() => {
    const { responseBindingSha256: _digest, ...payload } =
      structuredClone(response)
    assert.equal(typeof _digest, 'string')
    return payload
  })(),
  l4InvocationId: response.sam31InvocationId,
}))
assert.throws(() => buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2({
  ...structuredClone(response),
  responseBindingSha256: undefined,
  outputSummary: {
    ...structuredClone(response.outputSummary!),
    sampledOrRepresentativeOnlyMeasurementAccepted: true,
  },
} as never))
assert.throws(() =>
  sealCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerEvidence({
    measurementId: 'l4-task-qa-wrong-lease',
    canonicalSam31TaskRef:
      structuredClone(canonicalMeasurement.sam31TaskRef),
    canonicalSam31RuntimeResultAdmissionRef:
      structuredClone(canonicalMeasurement.sam31RuntimeResultAdmissionRef),
    canonicalSam31MaskSequenceArtifactRef: structuredClone(
      canonicalMeasurement.subjectEvidence[0]!.maskSequenceRef!,
    ),
    canonicalL4ExecutionEnvelopeRef: rawRef(
      'l4-execution-envelope',
      request.l4ExecutionEnvelopeRef.contentHash.slice(7),
    ),
    canonicalScope: structuredClone(canonicalMeasurement.canonicalScope),
    sourcePrivateArtifactRef:
      structuredClone(canonicalMeasurement.sourcePrivateArtifactRef),
    requestedRange: structuredClone(canonicalMeasurement.requestedRange),
    l4QaExecution: {
      ...structuredClone(canonicalMeasurement.l4QaExecution),
      workerLeaseRef: rawRef('different-l4-worker-lease'),
    },
    workerRequest: request,
    workerResponse: response,
    measuredAt: '2026-08-05T20:00:00.000Z',
  }))
const reorderedResponse = buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2({
  ...(() => {
    const { responseBindingSha256: _responseBindingSha256, ...payload } =
      structuredClone(response)
    assert.equal(_responseBindingSha256, response.responseBindingSha256)
    return payload
  })(),
  outputSummary: {
    ...structuredClone(response.outputSummary!),
    subjectMeasurements: [
      structuredClone(response.outputSummary!.subjectMeasurements[1]!),
      structuredClone(response.outputSummary!.subjectMeasurements[0]!),
    ],
  },
})
assert.throws(() =>
  sealCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerEvidence({
    measurementId: 'l4-task-qa-reordered-subjects',
    canonicalSam31TaskRef:
      structuredClone(canonicalMeasurement.sam31TaskRef),
    canonicalSam31RuntimeResultAdmissionRef:
      structuredClone(canonicalMeasurement.sam31RuntimeResultAdmissionRef),
    canonicalSam31MaskSequenceArtifactRef: structuredClone(
      canonicalMeasurement.subjectEvidence[0]!.maskSequenceRef!,
    ),
    canonicalL4ExecutionEnvelopeRef: rawRef(
      'l4-execution-envelope',
      request.l4ExecutionEnvelopeRef.contentHash.slice(7),
    ),
    canonicalScope: structuredClone(canonicalMeasurement.canonicalScope),
    sourcePrivateArtifactRef:
      structuredClone(canonicalMeasurement.sourcePrivateArtifactRef),
    requestedRange: structuredClone(canonicalMeasurement.requestedRange),
    l4QaExecution: structuredClone(canonicalMeasurement.l4QaExecution),
    workerRequest: request,
    workerResponse: reorderedResponse,
    measuredAt: '2026-08-05T20:00:00.000Z',
  }))
const failed = buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-response-v2',
  operationId: 'tool.kornia.refine_mask.v1',
  l4InvocationId: request.l4InvocationId,
  sam31InvocationId: request.sam31InvocationId,
  requestBindingSha256: request.requestBindingSha256,
  status: 'failed',
  terminalStage: 'cuda_admission',
  gpuEvidence: null,
  inputEvidence: null,
  runtimeMeasurement: null,
  outputSummary: null,
  failureCode: 'gpu_mismatch',
  privateCreateOnlyWorkerOutput: false,
  runtimeDownloadPerformed: false,
  cpuOnlySubstantiveMaskQaUsed: false,
  serverCostReceiptIncluded: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  assetManifestMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
assert.equal(failed.status, 'failed')

let getterInvoked = false
const accessor = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    return request.schemaVersion
  },
})
assert.throws(() => assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV2(accessor))
assert.equal(getterInvoked, false)

const runner = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/runner.py', 'utf8',
)
const dockerfile = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate', 'utf8',
)
const entrypoint = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/entrypoint.sh', 'utf8',
)
assert.match(runner, /kornia\.morphology\.closing/u)
assert.match(runner, /cv2\.cuda\.countNonZero/u)
assert.match(runner, /requested_keys != set\(mask_by_key\.keys\(\)\)/u)
assert.match(runner, /configure_l4_paths\(l4_invocation_id\)/u)
assert.match(runner, /configure_sam31_input_paths\(request\["sam31InvocationId"\]\)/u)
assert.match(runner, /L4_INVOCATION_ROOT = base \/ l4_invocation_id/u)
assert.match(runner, /SAM31_INVOCATION_ROOT = base \/ sam31_invocation_id/u)
assert.match(runner, /canonical-track-all-sam3_1-l4-task-qa-worker-exit-v3/u)
assert.match(runner, /opencv_cuda_device_count_mismatch/u)
assert.match(runner, /cuda_driver_library_mapping_mismatch/u)
assert.match(runner, /redacted_unknown_failure/u)
assert.doesNotMatch(runner, /traceback\.print_exc|str\(error\).*stderr/u)
assert.doesNotMatch(runner, /RESPONSE_PATH = MASK_ROOT/u)
assert.match(runner, /cpuOnlySubstantiveMaskQaUsed": False/u)
assert.doesNotMatch(runner, /torch\.device\(["']cpu/u)
assert.doesNotMatch(runner, /requests\.|urllib|https?:\/\//u)
assert.match(dockerfile, /--no-index/u)
assert.match(dockerfile, /candidate-only/u)
assert.match(dockerfile, /contains no checkpoint/u)
assert.match(entrypoint, /nvidia_l4/u)
assert.match(entrypoint, /cuda_compat_12_8/u)
assert.match(entrypoint, /\/\^NVRM version:\//u)
assert.match(entrypoint, /count < 2 \|\| count > 4/u)
assert.match(entrypoint, /is_driver_version\(\$field\)/u)
assert.match(
  entrypoint,
  /runtime_library_paths=\/opt\/weeditpro\/opencv-cuda\/lib:\/opt\/weeditpro\/cuda-npp\/lib:\/usr\/local\/lib\/python3\.12\/dist-packages\/nvidia\/cublas\/lib:\/usr\/local\/lib\/python3\.12\/dist-packages\/nvidia\/cuda_runtime\/lib:\/usr\/local\/lib\/python3\.12\/dist-packages\/nvidia\/cufft\/lib:\/usr\/local\/cuda\/lib64/u,
)
assert.match(
  entrypoint,
  /LD_LIBRARY_PATH="\$\{compatibility_path\}:\$\{host_driver_paths\}:\$\{runtime_library_paths\}"/u,
)
assert.match(
  entrypoint,
  /LD_LIBRARY_PATH="\$\{host_driver_paths\}:\$\{runtime_library_paths\}"/u,
)
assert.doesNotMatch(
  entrypoint,
  /LD_LIBRARY_PATH="\$\{(?:compatibility_path|host_driver_paths)\}(?::\$\{host_driver_paths\})?"/u,
)
assert.doesNotMatch(
  entrypoint,
  /Kernel Module\[\[:space:\]\]\*\\\(\[0-9\]\[0-9\.\]\*\\\)/u,
)
const driverParser = entrypoint.match(
  /driver_version="\$\(\n[ ]{2}awk '\n(?<program>[\s\S]*?)\n[ ]{2}' "\$\{driver_version_file\}"\n\)"/u,
)?.groups?.program
assert.ok(driverParser, 'the exact entrypoint driver parser must remain testable')
const parseDriverVersion = (source: string) => execFileSync(
  'awk',
  [driverParser],
  { input: source, encoding: 'utf8' },
).trim()
assert.equal(
  parseDriverVersion(
    'NVRM version: NVIDIA UNIX x86_64 Kernel Module  535.216.03  Thu Apr  3 01:14:19 UTC 2025\n',
  ),
  '535.216.03',
)
assert.equal(
  parseDriverVersion(
    'NVRM version: NVIDIA UNIX Open Kernel Module for x86_64  580.95.05  Release Build\n',
  ),
  '580.95.05',
)
assert.equal(
  parseDriverVersion('NVRM version: NVIDIA UNIX Open Kernel Module for x86_64 malformed\n'),
  '',
)
assert.equal(
  parseDriverVersion('compiler: gcc version 12.2.0\n'),
  '',
)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-worker',
  requestValidated: true,
  completedAndFailedResponseValidated: true,
  workerResponseCompiledIntoCanonicalMeasurement: true,
  separateSam31InputAndL4JobInvocationRootsRequired: true,
  everyRequestedMaskRequired: true,
  korniaCudaSubstantiveMeasurementRequired: true,
  opencvCudaEveryMaskCrosscheckRequired: true,
  pinnedCudaRuntimeLibrariesRetainedAfterDriverSelection: true,
  cpuOnlySubstantiveQaAllowed: false,
  immutableImageCandidateOnly: true,
  standardAndOpenKernelModuleDriverLinesAdmitted: true,
  liveL4JobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
