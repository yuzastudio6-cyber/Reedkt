import { z } from 'zod'

import {
  assertPlainSerializedData,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from '../../services/private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_REQUEST_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-request-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_WORKER_RESPONSE_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-worker-response-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID =
  'tool.kornia.refine_mask.v1' as const

const fixedTaskContractDescriptor = Object.freeze({
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

const requestWithoutHashSchema = z.object({
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
}).strict().superRefine((request, context) => {
  const frameCount = request.maskFrameRange.endFrameExclusive
    - request.maskFrameRange.startFrame
  const subjectKeys = request.subjects.map((subject) =>
    `${subject.subjectRequestId}\0${subject.subjectEvidenceId}\0${subject.maskObjectId}`)
  const objectIds = request.subjects.map((subject) => subject.maskObjectId)
  const exact = request.sam31MaskManifestRef.contentHash
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
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Track All L4 task-QA request lost exact mask or subject scope.',
  })
})

export const canonicalTrackAllSam31L4TaskQaWorkerRequestSchema =
  requestWithoutHashSchema.extend({ requestBindingSha256: sha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaWorkerRequest = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerRequestSchema
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

const responseWithoutHashSchema = z.object({
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
}).strict().superRefine((response, context) => {
  const completed = response.status === 'completed'
  const exact = completed
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
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Track All L4 task-QA response lost its fail-closed state.',
  })
})

export const canonicalTrackAllSam31L4TaskQaWorkerResponseSchema =
  responseWithoutHashSchema.extend({ responseBindingSha256: sha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaWorkerResponse = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaWorkerResponseSchema
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
