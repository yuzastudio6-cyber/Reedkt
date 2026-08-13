import { z } from 'zod'

import {
  assertPlainSerializedData,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-request-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-response-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_V2_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-request-v2' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_V2_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-response-v2' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_V3_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-request-v3' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_V3_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-response-v3' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID =
  'tool.kornia.refine_mask.v1' as const

const historicalFixedTaskContractDescriptorV1 = Object.freeze({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-fixed-task-v1',
  operationId: CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
  requestVersion:
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_VERSION,
  responseVersion:
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_VERSION,
  invocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID',
  acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
  accelerator: 'nvidia_l4',
  routeId: 'l4_standard_primary',
  taskRelativePath: 'task-qa/task.json',
  responseRelativePath: 'task-qa/response.json',
  samManifestRelativePath: 'output/mask-manifest.json',
  privateCreateOnlyTaskAndResponse: true,
  runtimeDownloadAllowed: false,
  cpuOnlySubstantiveMaskQaAllowed: false,
  callerPathUrlCommandCodeModelOrEnvironmentAccepted: false,
})

const historicalFixedTaskContractDescriptorV2 = Object.freeze({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-fixed-task-v2',
  operationId: CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
  requestVersion:
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_V2_VERSION,
  responseVersion:
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_V2_VERSION,
  l4InvocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID',
  acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
  accelerator: 'nvidia_l4',
  routeId: 'l4_standard_primary',
  l4TaskRelativePath: 'task-qa/task.json',
  l4ResponseRelativePath: 'task-qa/response.json',
  samManifestRelativePath: 'output/mask-manifest.json',
  separateL4AndSam31InvocationRootsRequired: true,
  l4WorkerWritesUnderSam31InvocationRoot: false,
  privateCreateOnlyTaskAndResponse: true,
  runtimeDownloadAllowed: false,
  cpuOnlySubstantiveMaskQaAllowed: false,
  callerPathUrlCommandCodeModelOrEnvironmentAccepted: false,
})

const fixedTaskContractDescriptor = Object.freeze({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-fixed-task-v3',
  operationId: CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
  requestVersion:
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_V3_VERSION,
  responseVersion:
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_V3_VERSION,
  l4InvocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID',
  acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
  accelerator: 'nvidia_l4',
  routeId: 'l4_standard_primary',
  l4TaskRelativePath: 'task-qa/task.json',
  l4ResponseRelativePath: 'task-qa/response.json',
  samManifestRelativePath: 'output/mask-manifest.json',
  previousChunkBoundaryMaskRereadRequiredAfterFirstChunk: true,
  exactOrderedCudaTemporalMetricSeriesRequired: true,
  separateL4AndSam31InvocationRootsRequired: true,
  l4WorkerWritesUnderSam31InvocationRoot: false,
  privateCreateOnlyTaskAndResponse: true,
  runtimeDownloadAllowed: false,
  cpuOnlySubstantiveMaskQaAllowed: false,
  callerPathUrlCommandCodeModelOrEnvironmentAccepted: false,
})

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const safeVersion = z.string().trim().min(1).max(120)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._+:-]*$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const basisPoints = z.number().int().min(0).max(10_000)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: nonnegativeInteger,
  endFrameExclusive: positiveInteger,
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) context.addIssue({
    code: 'custom', message: 'Track All L4 task-QA frame range is empty.',
  })
})
const subjectRoleSchema = z.enum([
  'primary_speaker', 'secondary_speaker', 'hand', 'product',
  'important_object', 'environmental_surface',
])

const subjectBindingSchema = z.object({
  subjectRequestId: safeId,
  subjectEvidenceId: safeId,
  subjectRole: subjectRoleSchema,
  maskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  canonicalFrameRange: frameRangeSchema,
  maskFrameRange: frameRangeSchema,
  trackManifestRef: evidenceRefSchema,
  anchorManifestRef: evidenceRefSchema.nullable(),
  sourceFrameMappingRef: evidenceRefSchema,
  outputFrameDigestSha256: sha256,
}).strict().superRefine((subject, context) => {
  const canonicalCount = subject.canonicalFrameRange.endFrameExclusive
    - subject.canonicalFrameRange.startFrame
  const maskCount = subject.maskFrameRange.endFrameExclusive
    - subject.maskFrameRange.startFrame
  if (canonicalCount !== maskCount) context.addIssue({
    code: 'custom',
    message: 'Track All L4 task-QA subject frame mappings differ in length.',
  })
})

const requestV1BaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_VERSION,
  ),
  operationId: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
  ),
  invocationId: safeId,
  sam31TaskRef: evidenceRefSchema,
  sam31RuntimeRequestBindingSha256: sha256,
  sam31RuntimeResultAdmissionRef: evidenceRefSchema,
  sam31MaskManifestRef: evidenceRefSchema,
  l4ExecutionEnvelopeRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  sourceFrameMappingRef: evidenceRefSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  maskFrameRange: frameRangeSchema,
  expectedMaskManifestByteLength: positiveInteger.max(64 * 1024 * 1024),
  expectedMaskManifestSha256: sha256,
  expectedMaskPngCount: positiveInteger.max(16 * 240),
  subjects: z.array(subjectBindingSchema).min(1).max(16),
  executionPolicy: z.object({
    routeId: z.literal('l4_standard_primary'),
    gpuProfileId: z.literal(
      'quality_l4_user_triggered_standard_media_job_v1',
    ),
    accelerator: z.literal('nvidia_l4'),
    korniaVersion: z.literal('0.8.3'),
    torchVersion: z.literal('2.10.0+cu128'),
    cudaRuntimeVersion: z.literal('12.8'),
    morphologyKernelSize: z.literal(3),
    binaryThreshold: z.literal(127),
    everyManifestMaskMustBeReread: z.literal(true),
    everyRequestedFrameAndSubjectMustBeMeasured: z.literal(true),
    korniaCudaSubstantiveMeasurementRequired: z.literal(true),
    opencvCudaEveryMaskCrosscheckRequired: z.literal(true),
    cpuDecodeAndBoundedSerializationOnly: z.literal(true),
    cpuOnlySubstantiveMaskQaAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    automaticRetryAfterUnknownOutcomeAllowed: z.literal(false),
  }).strict(),
  byteFreeRequest: z.literal(true),
  callerPathUrlCommandCodeOrEnvironmentAccepted: z.literal(false),
  browserOrCallerMeasurementAccepted: z.literal(false),
}).strict()

function requestV1ScopeIsExact(request: z.infer<
  typeof requestV1BaseSchema
>): boolean {
  const frameCount = request.maskFrameRange.endFrameExclusive
    - request.maskFrameRange.startFrame
  const subjectKeys = request.subjects.map((subject) =>
    `${subject.subjectRequestId}\0${subject.subjectEvidenceId}\0${subject.maskObjectId}`)
  const objectIds = request.subjects.map((subject) => subject.maskObjectId)
  return request.sam31MaskManifestRef.contentHash
      === `sha256:${request.expectedMaskManifestSha256}`
    && request.maskFrameRange.startFrame === 0
    && request.maskFrameRange.endFrameExclusive <= 240
    && request.expectedMaskPngCount === frameCount * request.subjects.length
    && request.subjects.every((subject) =>
      subject.maskFrameRange.startFrame === request.maskFrameRange.startFrame
      && subject.maskFrameRange.endFrameExclusive
        === request.maskFrameRange.endFrameExclusive
      && subject.sourceFrameMappingRef.id === request.sourceFrameMappingRef.id
      && subject.sourceFrameMappingRef.version
        === request.sourceFrameMappingRef.version
      && subject.sourceFrameMappingRef.contentHash
        === request.sourceFrameMappingRef.contentHash)
    && request.subjects.every((subject) =>
      subject.outputFrameDigestSha256
        === request.confirmedOutputFrameRef.contentHash.slice(7))
    && new Set(subjectKeys).size === subjectKeys.length
    && new Set(objectIds).size === objectIds.length
}

const requestWithoutHashSchema = requestV1BaseSchema.superRefine(
  (request, context) => {
    if (requestV1ScopeIsExact(request)) return
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 task-QA request lost exact mask or subject scope.',
    })
  },
)

export const canonicalTrackAllSam31L4TaskQaWorkerRequestSchema =
  requestV1BaseSchema.extend({ requestBindingSha256: sha256 }).strict()
    .superRefine((request, context) => {
      if (requestV1ScopeIsExact(request)) return
      context.addIssue({
        code: 'custom',
        message: 'Track All L4 task-QA request lost exact mask or subject scope.',
      })
    })
export type CanonicalTrackAllSam31L4TaskQaWorkerRequest = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerRequestSchema
>

const requestV2WithoutHashSchema = requestV1BaseSchema.omit({
  schemaVersion: true,
  invocationId: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_V2_VERSION,
  ),
  l4InvocationId: safeId,
  sam31InvocationId: safeId,
}).strict()

function requestV2ScopeIsExact(request: Omit<z.infer<
  typeof requestV2WithoutHashSchema
>, 'schemaVersion'>): boolean {
  const frameCount = request.maskFrameRange.endFrameExclusive
    - request.maskFrameRange.startFrame
  const subjectKeys = request.subjects.map((subject) =>
    `${subject.subjectRequestId}\0${subject.subjectEvidenceId}\0${subject.maskObjectId}`)
  const objectIds = request.subjects.map((subject) => subject.maskObjectId)
  return request.l4InvocationId !== request.sam31InvocationId
    && request.l4ExecutionEnvelopeRef.id === request.l4InvocationId
    && request.sam31MaskManifestRef.contentHash
      === `sha256:${request.expectedMaskManifestSha256}`
    && request.maskFrameRange.startFrame === 0
    && request.maskFrameRange.endFrameExclusive <= 240
    && request.expectedMaskPngCount === frameCount * request.subjects.length
    && request.subjects.every((subject) =>
      subject.maskFrameRange.startFrame === request.maskFrameRange.startFrame
      && subject.maskFrameRange.endFrameExclusive
        === request.maskFrameRange.endFrameExclusive
      && subject.sourceFrameMappingRef.id === request.sourceFrameMappingRef.id
      && subject.sourceFrameMappingRef.version
        === request.sourceFrameMappingRef.version
      && subject.sourceFrameMappingRef.contentHash
        === request.sourceFrameMappingRef.contentHash)
    && request.subjects.every((subject) =>
      subject.outputFrameDigestSha256
        === request.confirmedOutputFrameRef.contentHash.slice(7))
    && new Set(subjectKeys).size === subjectKeys.length
    && new Set(objectIds).size === objectIds.length
}

export const canonicalTrackAllSam31L4TaskQaWorkerRequestV2Schema =
  requestV2WithoutHashSchema.extend({ requestBindingSha256: sha256 }).strict()
    .superRefine((request, context) => {
      if (requestV2ScopeIsExact(request)) return
      context.addIssue({
    code: 'custom',
    message: 'Track All L4 task-QA v2 request lost separate job or mask scope.',
  })
    })
export type CanonicalTrackAllSam31L4TaskQaWorkerRequestV2 = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerRequestV2Schema
>

const previousBoundarySubjectSchema = z.object({
  subjectRequestId: safeId,
  previousSubjectEvidenceId: safeId,
  currentSubjectEvidenceId: safeId,
  previousMaskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  currentMaskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
}).strict()

const previousChunkBoundaryInputSchema = z.object({
  previousChunkOrdinal: z.number().int().min(1).max(255),
  previousSam31InvocationId: safeId,
  previousSam31RuntimeRequestBindingSha256: sha256,
  previousSam31RuntimeResultAdmissionRef: evidenceRefSchema,
  previousSam31MaskManifestRef: evidenceRefSchema,
  previousSourceFrameMappingRef: evidenceRefSchema,
  previousConfirmedOutputFrameRef: evidenceRefSchema,
  expectedPreviousMaskManifestByteLength:
    positiveInteger.max(64 * 1024 * 1024),
  expectedPreviousMaskManifestSha256: sha256,
  previousCanonicalStartFrameInclusive: nonnegativeInteger,
  previousCanonicalEndFrameInclusive: nonnegativeInteger,
  previousMaskFrameIndex: nonnegativeInteger.max(239),
  currentMaskFrameIndex: z.literal(0),
  overlapFrameCount: z.literal(1),
  subjects: z.array(previousBoundarySubjectSchema).min(1).max(16),
}).strict().superRefine((boundary, context) => {
  const keys = boundary.subjects.map((subject) => subject.subjectRequestId)
  if (boundary.previousCanonicalEndFrameInclusive
      < boundary.previousCanonicalStartFrameInclusive
    || boundary.previousSam31MaskManifestRef.contentHash
      !== `sha256:${boundary.expectedPreviousMaskManifestSha256}`
    || new Set(keys).size !== keys.length
    || new Set(boundary.subjects.map((subject) =>
      subject.previousMaskObjectId)).size !== boundary.subjects.length
    || new Set(boundary.subjects.map((subject) =>
      subject.currentMaskObjectId)).size !== boundary.subjects.length) {
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 previous-chunk boundary input is inconsistent.',
    })
  }
})

const requestV3BaseSchema = requestV2WithoutHashSchema.omit({
  schemaVersion: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_V3_VERSION,
  ),
  chunkOrdinal: z.number().int().min(1).max(256),
  canonicalStartFrameInclusive: nonnegativeInteger,
  canonicalEndFrameInclusive: nonnegativeInteger,
  previousChunkBoundaryInput: previousChunkBoundaryInputSchema.nullable(),
}).strict()

function requestV3ScopeIsExact(request: z.infer<
  typeof requestV3BaseSchema
>): boolean {
  const frameCount = request.maskFrameRange.endFrameExclusive
    - request.maskFrameRange.startFrame
  const currentSubjectIds = new Set(request.subjects.map((subject) =>
    subject.subjectRequestId))
  const boundary = request.previousChunkBoundaryInput
  return requestV2ScopeIsExact(request)
    && request.canonicalEndFrameInclusive
      - request.canonicalStartFrameInclusive + 1 === frameCount
    && (request.chunkOrdinal === 1) === (boundary === null)
    && (boundary === null || (
      boundary.previousChunkOrdinal === request.chunkOrdinal - 1
      && boundary.previousSam31InvocationId !== request.sam31InvocationId
      && boundary.previousSam31InvocationId !== request.l4InvocationId
      && boundary.previousCanonicalEndFrameInclusive
        === request.canonicalStartFrameInclusive
      && boundary.previousConfirmedOutputFrameRef.id
        === request.confirmedOutputFrameRef.id
      && boundary.previousConfirmedOutputFrameRef.version
        === request.confirmedOutputFrameRef.version
      && boundary.previousConfirmedOutputFrameRef.contentHash
        === request.confirmedOutputFrameRef.contentHash
      && boundary.previousMaskFrameIndex
        === boundary.previousCanonicalEndFrameInclusive
          - boundary.previousCanonicalStartFrameInclusive
      && boundary.subjects.every((subject) =>
        currentSubjectIds.has(subject.subjectRequestId)
        && request.subjects.some((candidate) =>
          candidate.subjectRequestId === subject.subjectRequestId
          && candidate.subjectEvidenceId === subject.currentSubjectEvidenceId
          && candidate.maskObjectId === subject.currentMaskObjectId))
    ))
}

const requestV3WithoutHashSchema = requestV3BaseSchema.superRefine(
  (request, context) => {
    if (requestV3ScopeIsExact(request)) return
    context.addIssue({
    code: 'custom',
    message: 'Track All L4 task-QA v3 lost temporal chunk lineage.',
  })
  },
)

export const canonicalTrackAllSam31L4TaskQaWorkerRequestV3Schema =
  requestV3BaseSchema.extend({ requestBindingSha256: sha256 }).strict()
    .superRefine((request, context) => {
      if (!requestV3ScopeIsExact(request)) context.addIssue({
        code: 'custom',
        message: 'Track All L4 task-QA v3 lost temporal chunk lineage.',
      })
    })
export type CanonicalTrackAllSam31L4TaskQaWorkerRequestV3 = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerRequestV3Schema
>

const subjectMeasurementSchema = z.object({
  subjectRequestId: safeId,
  subjectEvidenceId: safeId,
  maskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  measuredFrameCount: positiveInteger,
  expectedFrameCount: positiveInteger,
  emptyMaskFrameCount: nonnegativeInteger,
  fullFrameMaskCount: nonnegativeInteger,
  minimumBinaryIntersectionOverUnionBasisPoints: basisPoints,
  maximumNormalizedCentroidShiftBasisPoints: basisPoints,
  maximumBoundaryDisagreementBasisPoints: basisPoints,
  maximumAlphaFlickerBasisPoints: basisPoints,
  minimumEdgeQualityBasisPoints: basisPoints,
  minimumSubjectCoverageBasisPoints: basisPoints,
  identitySwapCount: nonnegativeInteger,
  lostAnchorFrameCount: nonnegativeInteger,
  firstMaskFrameIndex: nonnegativeInteger,
  lastMaskFrameIndex: nonnegativeInteger,
  maskPngCount: positiveInteger,
  maskPngByteLength: positiveInteger,
  orderedMaskSetDigestSha256: sha256,
  completeRequestedRangeCoverage: z.literal(true),
}).strict().superRefine((measurement, context) => {
  const exact = measurement.measuredFrameCount === measurement.expectedFrameCount
    && measurement.maskPngCount === measurement.expectedFrameCount
    && measurement.lastMaskFrameIndex - measurement.firstMaskFrameIndex + 1
      === measurement.expectedFrameCount
    && measurement.emptyMaskFrameCount <= measurement.measuredFrameCount
    && measurement.fullFrameMaskCount <= measurement.measuredFrameCount
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Track All L4 subject measurement is incomplete.',
  })
})

const gpuEvidenceSchema = z.object({
  requestedAccelerator: z.literal('nvidia_l4'),
  observedDeviceNameDigestSha256: sha256,
  observedNvidiaDriverVersion: z.string().regex(
    /^[0-9]+(?:\.[0-9]+){1,3}$/u,
  ),
  observedCudaRuntimeVersion: z.literal('12.8'),
  observedTorchVersion: z.literal('2.10.0+cu128'),
  observedKorniaVersion: z.literal('0.8.3'),
  observedOpenCvVersion: safeVersion,
  observedComputeCapabilityMajor: positiveInteger,
  observedComputeCapabilityMinor: nonnegativeInteger,
  observedTotalDeviceMemoryBytes: positiveInteger,
  maximumObservedGpuUtilizationPercent: positiveInteger.max(100),
  cudaAvailable: z.literal(true),
  exactL4DeviceObserved: z.literal(true),
  korniaCudaTensorExecutionObserved: z.literal(true),
  opencvCudaDeviceCount: z.literal(1),
  opencvCudaEveryMaskCrosschecked: z.literal(true),
  torchCudaKernelCount: positiveInteger,
  opencvCudaKernelCount: positiveInteger,
  cpuOnlySubstantiveMaskQaUsed: z.literal(false),
  cudaDriverLibraryMode: z.enum(['cuda_compat_12_8', 'host_driver']),
  observedCudaDriverLibraryPathDigestSha256: sha256,
}).strict()

const inputEvidenceSchema = z.object({
  manifestByteLength: positiveInteger,
  manifestSha256: sha256,
  manifestRefExactMatch: z.literal(true),
  manifestRequestBindingExactMatch: z.literal(true),
  maskPngCount: positiveInteger,
  maskPngByteLength: positiveInteger,
  everyManifestMaskPngRereadAndHashed: z.literal(true),
  everyRequestedFrameAndSubjectPresentExactlyOnce: z.literal(true),
  everyMaskMatchesSourceGeometry: z.literal(true),
  everyMaskIsBinaryGrayscalePng: z.literal(true),
  unrequestedManifestObjectOrFrameAccepted: z.literal(false),
}).strict()

const runtimeMeasurementSchema = z.object({
  wallTimeMilliseconds: positiveInteger,
  decodeAndUploadMilliseconds: nonnegativeInteger,
  korniaCudaMilliseconds: positiveInteger,
  opencvCudaCrosscheckMilliseconds: positiveInteger,
  peakCudaAllocatedBytes: positiveInteger,
  peakCudaReservedBytes: positiveInteger,
}).strict()

const outputSummarySchema = z.object({
  subjectMeasurements: z.array(subjectMeasurementSchema).min(1).max(16),
  korniaCudaExecutionDigestSha256: sha256,
  opencvCudaCrosscheckExecutionDigestSha256: sha256,
  completeRequestedFrameAndSubjectCoverage: z.literal(true),
  sampledOrRepresentativeOnlyMeasurementAccepted: z.literal(false),
  exactMaskManifestAndEveryMaskPngReread: z.literal(true),
}).strict()

const responseV1BaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_VERSION,
  ),
  operationId: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
  ),
  requestBindingSha256: sha256,
  status: z.enum(['completed', 'failed']),
  terminalStage: z.enum([
    'request_validation', 'manifest_reread', 'cuda_admission',
    'mask_reread', 'kornia_cuda_measurement', 'opencv_cuda_crosscheck',
    'output_persistence', 'completed',
  ]),
  gpuEvidence: gpuEvidenceSchema.nullable(),
  inputEvidence: inputEvidenceSchema.nullable(),
  runtimeMeasurement: runtimeMeasurementSchema.nullable(),
  outputSummary: outputSummarySchema.nullable(),
  failureCode: z.enum([
    'none', 'request_rejected', 'manifest_mismatch', 'gpu_mismatch',
    'mask_mismatch', 'kornia_cuda_failed', 'opencv_cuda_failed',
    'output_failed',
  ]),
  privateCreateOnlyWorkerOutput: z.boolean(),
  runtimeDownloadPerformed: z.literal(false),
  cpuOnlySubstantiveMaskQaUsed: z.literal(false),
  serverCostReceiptIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

type TrackAllL4TaskQaResponseState = Omit<z.infer<
  typeof responseV1BaseSchema
>, 'schemaVersion'> & { readonly schemaVersion: string }

function responseStateIsExact(
  response: TrackAllL4TaskQaResponseState,
): boolean {
  const completed = response.status === 'completed'
  return completed
    ? response.terminalStage === 'completed'
      && response.failureCode === 'none'
      && response.gpuEvidence !== null
      && response.inputEvidence !== null
      && response.runtimeMeasurement !== null
      && response.outputSummary !== null
      && response.privateCreateOnlyWorkerOutput
      && response.outputSummary.subjectMeasurements.length > 0
      && new Set(response.outputSummary.subjectMeasurements.map((subject) =>
        `${subject.subjectRequestId}\0${subject.subjectEvidenceId}\0${subject.maskObjectId}`,
      )).size === response.outputSummary.subjectMeasurements.length
    : response.terminalStage !== 'completed'
      && response.failureCode !== 'none'
      && response.gpuEvidence === null
      && response.inputEvidence === null
      && response.runtimeMeasurement === null
      && response.outputSummary === null
      && !response.privateCreateOnlyWorkerOutput
}

const responseWithoutHashSchema = responseV1BaseSchema.superRefine(
  (response, context) => {
    if (responseStateIsExact(response)) return
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 task-QA response lost its fail-closed state.',
    })
  },
)

export const canonicalTrackAllSam31L4TaskQaWorkerResponseSchema =
  responseV1BaseSchema.extend({ responseBindingSha256: sha256 }).strict()
    .superRefine((response, context) => {
      if (responseStateIsExact(response)) return
      context.addIssue({
        code: 'custom',
        message: 'Track All L4 task-QA response lost its fail-closed state.',
      })
    })
export type CanonicalTrackAllSam31L4TaskQaWorkerResponse = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerResponseSchema
>

const responseV2WithoutHashSchema = responseV1BaseSchema.omit({
  schemaVersion: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_V2_VERSION,
  ),
  l4InvocationId: safeId,
  sam31InvocationId: safeId,
}).strict()

export const canonicalTrackAllSam31L4TaskQaWorkerResponseV2Schema =
  responseV2WithoutHashSchema.extend({ responseBindingSha256: sha256 }).strict()
    .superRefine((response, context) => {
      if (!responseStateIsExact(response)) context.addIssue({
          code: 'custom',
          message: 'Track All L4 task-QA response lost its fail-closed state.',
        })
      if (response.l4InvocationId === response.sam31InvocationId) {
        context.addIssue({
          code: 'custom',
          message: 'Track All L4 task-QA response collapsed separate job identities.',
        })
      }
    })
export type CanonicalTrackAllSam31L4TaskQaWorkerResponseV2 = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerResponseV2Schema
>

const temporalMetricSeriesSchema = z.object({
  subjectRequestId: safeId,
  subjectEvidenceId: safeId,
  maskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  expectedFrameCount: positiveInteger.max(240),
  expectedFramePairCount: positiveInteger.max(239),
  centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints:
    z.array(basisPoints).min(1).max(239),
  meanAbsoluteAlphaDeltaBasisPoints: z.array(basisPoints).min(1).max(239),
  boundaryDisagreementBasisPoints: z.array(basisPoints).min(2).max(240),
  exactOrderedPerFramePairMetricsFromKorniaCuda: z.literal(true),
  exactOrderedPerFrameMetricsFromKorniaCuda: z.literal(true),
  opencvCudaEveryMaskCrosschecked: z.literal(true),
}).strict().superRefine((series, context) => {
  if (series.expectedFrameCount < 2
    || series.expectedFramePairCount !== series.expectedFrameCount - 1
    || series.centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints
      .length !== series.expectedFramePairCount
    || series.meanAbsoluteAlphaDeltaBasisPoints.length
      !== series.expectedFramePairCount
    || series.boundaryDisagreementBasisPoints.length
      !== series.expectedFrameCount) context.addIssue({
      code: 'custom',
      message: 'Track All L4 temporal metric series is incomplete.',
    })
})

const crossChunkBoundaryMeasurementSchema = z.object({
  subjectRequestId: safeId,
  previousSubjectEvidenceId: safeId,
  currentSubjectEvidenceId: safeId,
  previousMaskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  currentMaskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  previousMaskFrameIndex: nonnegativeInteger.max(239),
  currentMaskFrameIndex: z.literal(0),
  previousMaskSha256: sha256,
  currentMaskSha256: sha256,
  centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints:
    basisPoints,
  meanAbsoluteAlphaDeltaBasisPoints: basisPoints,
  boundaryDisagreementBasisPoints: basisPoints,
  identitySwitchCount: z.number().int().min(0).max(1),
  objectDropoutCount: z.number().int().min(0).max(1),
  exactSharedCanonicalFrameCompared: z.literal(true),
  actualKorniaCudaBoundaryMeasurementObserved: z.literal(true),
  actualOpenCvCudaPreviousAndCurrentMasksCrosschecked: z.literal(true),
}).strict()

const outputSummaryV3Schema = outputSummarySchema.extend({
  temporalMetricSeries: z.array(temporalMetricSeriesSchema).min(1).max(16),
  crossChunkBoundaryMeasurements:
    z.array(crossChunkBoundaryMeasurementSchema).max(16),
  exactOrderedTemporalMetricSeriesIncluded: z.literal(true),
  previousChunkBoundaryComparedWhenRequired: z.literal(true),
}).strict().superRefine((summary, context) => {
  const measurementKeys = summary.subjectMeasurements.map((subject) =>
    `${subject.subjectRequestId}\0${subject.subjectEvidenceId}\0${subject.maskObjectId}`)
  const seriesKeys = summary.temporalMetricSeries.map((subject) =>
    `${subject.subjectRequestId}\0${subject.subjectEvidenceId}\0${subject.maskObjectId}`)
  if (stableAuthorityStringify(measurementKeys)
      !== stableAuthorityStringify(seriesKeys)
    || new Set(seriesKeys).size !== seriesKeys.length
    || new Set(summary.crossChunkBoundaryMeasurements.map((subject) =>
      subject.subjectRequestId)).size
      !== summary.crossChunkBoundaryMeasurements.length) context.addIssue({
      code: 'custom',
      message: 'Track All L4 temporal response crossed subject scope.',
    })
})

const previousBoundaryInputEvidenceSchema = z.object({
  manifestByteLength: positiveInteger,
  manifestSha256: sha256,
  manifestRefExactMatch: z.literal(true),
  sourceFrameMappingExactMatch: z.literal(true),
  confirmedOutputFrameExactMatch: z.literal(true),
  sharedCanonicalFrameExactMatch: z.literal(true),
  previousMaskPngCount: positiveInteger.max(16),
  previousMaskPngByteLength: positiveInteger,
  everyRequiredPreviousBoundaryMaskRereadAndHashed: z.literal(true),
}).strict()

const responseV3BaseSchema = responseV1BaseSchema.omit({
  schemaVersion: true,
  outputSummary: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_V3_VERSION,
  ),
  l4InvocationId: safeId,
  sam31InvocationId: safeId,
  chunkOrdinal: z.number().int().min(1).max(256),
  previousBoundaryInputEvidence:
    previousBoundaryInputEvidenceSchema.nullable(),
  outputSummary: outputSummaryV3Schema.nullable(),
}).strict()

function responseV3StateIsExact(response: z.infer<
  typeof responseV3BaseSchema
>): boolean {
  const completed = response.status === 'completed'
  return response.l4InvocationId !== response.sam31InvocationId
    && (completed
      ? response.terminalStage === 'completed'
        && response.failureCode === 'none'
        && response.gpuEvidence !== null
        && response.inputEvidence !== null
        && response.runtimeMeasurement !== null
        && response.outputSummary !== null
        && (response.chunkOrdinal === 1)
          === (response.previousBoundaryInputEvidence === null)
        && response.privateCreateOnlyWorkerOutput
        && response.outputSummary.subjectMeasurements.length > 0
        && response.outputSummary.temporalMetricSeries.length
          === response.outputSummary.subjectMeasurements.length
      : response.terminalStage !== 'completed'
        && response.failureCode !== 'none'
        && response.gpuEvidence === null
        && response.inputEvidence === null
        && response.runtimeMeasurement === null
        && response.outputSummary === null
        && response.previousBoundaryInputEvidence === null
        && !response.privateCreateOnlyWorkerOutput)
}

const responseV3WithoutHashSchema = responseV3BaseSchema.superRefine(
  (response, context) => {
    if (responseV3StateIsExact(response)) return
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 task-QA v3 response lost fail-closed state.',
    })
  },
)

export const canonicalTrackAllSam31L4TaskQaWorkerResponseV3Schema =
  responseV3BaseSchema.extend({ responseBindingSha256: sha256 }).strict()
    .superRefine((response, context) => {
      if (!responseV3StateIsExact(response)) context.addIssue({
        code: 'custom',
        message: 'Track All L4 task-QA v3 response lost fail-closed state.',
      })
    })
export type CanonicalTrackAllSam31L4TaskQaWorkerResponseV3 = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerResponseV3Schema
>

export function canonicalTrackAllSam31L4TaskQaFixedTaskContractRef() {
  return evidenceRefSchema.parse({
    id: fixedTaskContractDescriptor.schemaVersion,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(
      fixedTaskContractDescriptor,
    )}`,
  })
}

export function canonicalTrackAllSam31L4TaskQaHistoricalFixedTaskV1ContractRef() {
  return evidenceRefSchema.parse({
    id: historicalFixedTaskContractDescriptorV1.schemaVersion,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(
      historicalFixedTaskContractDescriptorV1,
    )}`,
  })
}

export function canonicalTrackAllSam31L4TaskQaHistoricalFixedTaskV2ContractRef() {
  return evidenceRefSchema.parse({
    id: historicalFixedTaskContractDescriptorV2.schemaVersion,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(
      historicalFixedTaskContractDescriptorV2,
    )}`,
  })
}

export function buildCanonicalTrackAllSam31L4TaskQaWorkerRequest(
  input: z.input<typeof requestWithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaWorkerRequest {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_worker_request')
  const payload = requestWithoutHashSchema.parse(input)
  return canonicalTrackAllSam31L4TaskQaWorkerRequestSchema.parse({
    ...payload,
    requestBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaWorkerRequest(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaWorkerRequest {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_worker_request')
  const request = canonicalTrackAllSam31L4TaskQaWorkerRequestSchema.parse(value)
  const { requestBindingSha256, ...payload } = request
  if (requestBindingSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA request digest is invalid.')
  }
  return structuredClone(request)
}

export function buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV2(
  input: z.input<typeof requestV2WithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaWorkerRequestV2 {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_worker_request_v2')
  const payload = requestV2WithoutHashSchema.parse(input)
  if (!requestV2ScopeIsExact(payload)) throw new TypeError(
    'Track All L4 task-QA v2 request lost separate job or mask scope.',
  )
  return canonicalTrackAllSam31L4TaskQaWorkerRequestV2Schema.parse({
    ...payload,
    requestBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV2(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaWorkerRequestV2 {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_worker_request_v2')
  const request = canonicalTrackAllSam31L4TaskQaWorkerRequestV2Schema.parse(
    value,
  )
  const { requestBindingSha256, ...payload } = request
  if (requestBindingSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA v2 request digest is invalid.')
  }
  return structuredClone(request)
}

export function buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV3(
  input: z.input<typeof requestV3WithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaWorkerRequestV3 {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_worker_request_v3')
  const payload = requestV3WithoutHashSchema.parse(input)
  return canonicalTrackAllSam31L4TaskQaWorkerRequestV3Schema.parse({
    ...payload,
    requestBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaWorkerRequestV3 {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_worker_request_v3')
  const request = canonicalTrackAllSam31L4TaskQaWorkerRequestV3Schema.parse(
    value,
  )
  const { requestBindingSha256, ...payload } = request
  if (requestBindingSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA v3 request digest is invalid.')
  }
  return structuredClone(request)
}

export function buildCanonicalTrackAllSam31L4TaskQaWorkerResponse(
  input: z.input<typeof responseWithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaWorkerResponse {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_worker_response')
  const payload = responseWithoutHashSchema.parse(input)
  return canonicalTrackAllSam31L4TaskQaWorkerResponseSchema.parse({
    ...payload,
    responseBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaWorkerResponse(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaWorkerResponse {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_worker_response')
  const response = canonicalTrackAllSam31L4TaskQaWorkerResponseSchema.parse(
    value,
  )
  const { responseBindingSha256, ...payload } = response
  if (responseBindingSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA response digest is invalid.')
  }
  return structuredClone(response)
}

export function buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2(
  input: z.input<typeof responseV2WithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaWorkerResponseV2 {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_worker_response_v2')
  const payload = responseV2WithoutHashSchema.parse(input)
  if (payload.l4InvocationId === payload.sam31InvocationId) throw new TypeError(
    'Track All L4 task-QA response collapsed separate job identities.',
  )
  return canonicalTrackAllSam31L4TaskQaWorkerResponseV2Schema.parse({
    ...payload,
    responseBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaWorkerResponseV2 {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_worker_response_v2')
  const response = canonicalTrackAllSam31L4TaskQaWorkerResponseV2Schema.parse(
    value,
  )
  const { responseBindingSha256, ...payload } = response
  if (responseBindingSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA v2 response digest is invalid.')
  }
  return structuredClone(response)
}

export function buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV3(
  input: z.input<typeof responseV3WithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaWorkerResponseV3 {
  assertBoundedTemporalResponseData(input)
  const payload = responseV3WithoutHashSchema.parse(input)
  return canonicalTrackAllSam31L4TaskQaWorkerResponseV3Schema.parse({
    ...payload,
    responseBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaWorkerResponseV3 {
  assertBoundedTemporalResponseData(value)
  const response = canonicalTrackAllSam31L4TaskQaWorkerResponseV3Schema.parse(
    value,
  )
  const { responseBindingSha256, ...payload } = response
  if (responseBindingSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA v3 response digest is invalid.')
  }
  return structuredClone(response)
}

function assertBoundedTemporalResponseData(value: unknown): void {
  const state = { seen: new Set<object>(), entries: 0 }
  const visit = (current: unknown, depth: number): void => {
    if (depth > 16) throw new TypeError(
      'Track All L4 temporal response nesting is too deep.',
    )
    if (current === null || typeof current === 'boolean'
      || (typeof current === 'number' && Number.isFinite(current))) return
    if (typeof current === 'string') {
      if (current.length > 16_384) throw new TypeError(
        'Track All L4 temporal response string is too long.',
      )
      return
    }
    if (typeof current !== 'object' || state.seen.has(current)) {
      throw new TypeError('Track All L4 temporal response is not plain data.')
    }
    state.seen.add(current)
    const prototype = Object.getPrototypeOf(current)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new TypeError('Track All L4 temporal response has a prototype.')
    }
    const keys = Reflect.ownKeys(current)
    if (keys.length > 4_096) throw new TypeError(
      'Track All L4 temporal response node is too large.',
    )
    state.entries += keys.length
    if (state.entries > 100_000) throw new TypeError(
      'Track All L4 temporal response tree is too large.',
    )
    for (const key of keys) {
      if (typeof key !== 'string') throw new TypeError(
        'Track All L4 temporal response has a symbol key.',
      )
      const descriptor = Object.getOwnPropertyDescriptor(current, key)
      if (!descriptor || !('value' in descriptor)) throw new TypeError(
        'Track All L4 temporal response has an accessor.',
      )
      visit(descriptor.value, depth + 1)
    }
    state.seen.delete(current)
  }
  try {
    visit(value, 0)
  } catch (error) {
    if (error instanceof TypeError
      && error.message.startsWith('Track All L4 temporal response')) {
      throw error
    }
    throw new TypeError('Track All L4 temporal response is hostile.', {
      cause: error,
    })
  }
}
