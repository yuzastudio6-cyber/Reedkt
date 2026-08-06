import { z } from 'zod'

import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from '../../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_GPU_RUNTIME_REQUEST_VERSION =
  'canonical-sam3_1-gpu-runtime-request-v1' as const
export const CANONICAL_SAM3_1_GPU_RUNTIME_RESPONSE_VERSION =
  'canonical-sam3_1-gpu-runtime-response-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeVersion = z.string().trim().min(1).max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._+:-]*$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const forbiddenSerializedText = /(?:https?:|file:|data:|blob:|javascript:|\\|\/Users\/|\/Volumes\/|\/tmp\/|x-goog-|api[_-]?key|password|credential|secret|access[_-]?token|refresh[_-]?token|\bsk-[A-Za-z0-9_-]+)/iu
const approvedSubjectText = z.string().trim().min(1).max(240)
  .refine((value) => !forbiddenSerializedText.test(value))
  .refine((value) => Array.from(value).every((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint > 31 && codePoint !== 127
  }))

const scopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  editPlanId: safeId,
  editPlanVersionId: safeId,
  approvedPlanSnapshotId: safeId,
  approvedPlanSnapshotHash: sha256,
  outputId: safeId,
  sceneId: safeId,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  fundedCreditReservationRef: evidenceRefSchema,
  masterTimingRef: evidenceRefSchema,
  sourceBindingRef: evidenceRefSchema,
}).strict()

const dispatchSchema = z.object({
  routeRole: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  gpuProfileId: z.enum([
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0],
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
  ]),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  attemptOrdinal: z.union([z.literal(1), z.literal(2)]),
  priorAttemptDisposition: z.enum([
    'not_applicable_primary',
    'not_executed_retry_safe',
    'executed_failed_known_terminal',
  ]),
  priorAttemptDispositionRef: evidenceRefSchema.nullable(),
  currentPrimaryAndFallbackRateAuthoritiesReread: z.literal(true),
  exactPerToolEstimateApproved: z.literal(true),
  userTriggeredAfterApproval: z.literal(true),
  scaleFromZeroRequired: z.literal(true),
  scaleBackToZeroAfterTerminalAttemptRequired: z.literal(true),
  unknownPriorOutcomeMayRetryOrFallback: z.literal(false),
  cpuOnlyInferenceAllowed: z.literal(false),
}).strict().superRefine((dispatch, context) => {
  const primary = dispatch.routeRole === 'a100_80gb_heavy_primary'
  const exact = primary
    ? dispatch.gpuProfileId === CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
      && dispatch.accelerator === 'nvidia_a100_80gb'
      && dispatch.attemptOrdinal === 1
      && dispatch.priorAttemptDisposition === 'not_applicable_primary'
      && dispatch.priorAttemptDispositionRef === null
    : dispatch.gpuProfileId === CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
      && dispatch.accelerator === 'nvidia_l4'
      && dispatch.attemptOrdinal === 2
      && dispatch.priorAttemptDisposition !== 'not_applicable_primary'
      && dispatch.priorAttemptDispositionRef !== null
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 dispatch lost its exact A100-primary/L4-fallback boundary.',
  })
})

export const canonicalSam31GpuSourceMediaSchema = z.object({
  mediaForm: z.literal('private_read_only_mp4'),
  finalizedSourceArtifactRef: evidenceRefSchema,
  gpuPreparedMaskProxyArtifactRef: evidenceRefSchema,
  exactSourceReadEvidenceRef: evidenceRefSchema,
  ffprobeOrFrameDirectoryEvidenceRef: evidenceRefSchema,
  sourceFrameRangeMappingRef: evidenceRefSchema,
  proxyPixelGeometryQaRef: evidenceRefSchema,
  byteLength: positiveInteger,
  sha256,
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  decodedFrameCount: positiveInteger.max(240),
  fpsNumerator: positiveInteger.max(240_000),
  fpsDenominator: positiveInteger.max(1_001_000),
  selectedStartFrameInclusive: nonnegativeInteger,
  selectedEndFrameInclusive: nonnegativeInteger,
  canonicalSourceStartFrameInclusive: nonnegativeInteger,
  canonicalSourceEndFrameInclusive: nonnegativeInteger,
  boundedChunkOverlapAndStitchPlanRef: evidenceRefSchema,
  variableFrameRateAllowed: z.literal(false),
  callerPathOrUrlAccepted: z.literal(false),
}).strict().superRefine((source, context) => {
  if (
    source.selectedStartFrameInclusive !== 0
    || source.selectedEndFrameInclusive !== source.decodedFrameCount - 1
    || source.canonicalSourceEndFrameInclusive <
      source.canonicalSourceStartFrameInclusive
    || source.canonicalSourceEndFrameInclusive -
      source.canonicalSourceStartFrameInclusive + 1 !==
      source.decodedFrameCount
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 bounded GPU proxy/source frame mapping is invalid.',
  })
})

const approvedPromptSchema = z.object({
  promptType: z.literal('server_compiled_text_subject'),
  approvedSubjectText,
  promptFrameIndex: z.literal(0),
  compiledIntentRef: evidenceRefSchema,
  promptApprovalRef: evidenceRefSchema,
  sourceFrameLineageRef: evidenceRefSchema,
  rawUserChatIncluded: z.literal(false),
  executableTextIncluded: z.literal(false),
}).strict()

const modelArtifactsSchema = z.object({
  sourceCandidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  privateArtifactIngestReceiptRef: evidenceRefSchema,
  sourceArchiveRef: evidenceRefSchema,
  sourceRevision: z.literal(
    '96914d2425f90a64f45ca977c2b5165418099543',
  ),
  sourceArchiveByteLength: z.literal(73_605_120),
  sourceArchiveSha256: z.literal(
    '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
  ),
  reeditproGpuDecodePatchSha256: z.literal(
    'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
  ),
  checkpointRef: evidenceRefSchema,
  checkpointRepositoryRevision: z.literal(
    'daa63191845a41281374e725f4c9e51c7a824460',
  ),
  checkpointFileName: z.literal('sam3.1_multiplex.pt'),
  checkpointByteLength: positiveInteger,
  checkpointSha256: sha256,
  sourceCheckpointCompatibilityQualificationRef: evidenceRefSchema,
  immutableImageReleaseRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  humanTermsAcceptanceAndLegalReviewReread: z.literal(true),
  sourceAndCheckpointMalwareScanReread: z.literal(true),
  runtimeDownloadAllowed: z.literal(false),
}).strict().superRefine((artifacts, context) => {
  if (
    artifacts.sourceArchiveRef.contentHash !==
      `sha256:${artifacts.sourceArchiveSha256}`
    || artifacts.checkpointRef.contentHash !==
      `sha256:${artifacts.checkpointSha256}`
    || artifacts.immutableImageReleaseRef.contentHash !==
      artifacts.immutableImageDigest
  ) context.addIssue({
    code: 'custom',
    message:
      'SAM 3.1 source, checkpoint, or immutable-image ref lost exact byte identity.',
  })
})

const settingsSchema = z.object({
  builder: z.literal('build_sam3_multiplex_video_predictor'),
  predictorVersion: z.literal('sam3.1'),
  maximumTrackedObjectsProductCap: z.literal(16),
  multiplexBucketSize: z.literal(16),
  useFlashAttention3: z.literal(false),
  useRealValuedRope: z.literal(true),
  torchCompileEnabled: z.literal(false),
  warmupCompilationEnabled: z.literal(false),
  defaultOutputProbabilityThreshold: z.literal(0.5),
  asynchronousFrameLoading: z.literal(true),
  videoDecodeBackend: z.literal('torchcodec_0_10_cuda_nvdec'),
  gpuAcceleratedDecode: z.literal(true),
  cpuOpenCvOrPillowDecodeAllowed: z.literal(false),
  strictCheckpointLoadRequired: z.literal(true),
  cudaOutputTensorsRequired: z.literal(true),
  boundedCpuOutputSerializationOnly: z.literal(true),
  offloadVideoToCpu: z.literal(false),
  offloadStateToCpu: z.literal(false),
  propagationDirection: z.literal('forward'),
  outputFormat: z.literal('lossless_grayscale_png_mask_sequence_v1'),
  sourceResolutionPreserved: z.literal(true),
  sourceFrameRangePreserved: z.literal(true),
  quantizationAllowed: z.literal(false),
}).strict()

const requestWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_GPU_RUNTIME_REQUEST_VERSION),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  dispatchAdmissionRef: evidenceRefSchema,
  dispatchAdmissionDigestSha256: sha256,
  scope: scopeSchema,
  dispatch: dispatchSchema,
  sourceMedia: canonicalSam31GpuSourceMediaSchema,
  approvedPrompt: approvedPromptSchema,
  modelArtifacts: modelArtifactsSchema,
  settings: settingsSchema,
  byteFreeRequest: z.literal(true),
  callerCodePathUrlCommandOrEnvironmentAccepted: z.literal(false),
}).strict().superRefine((request, context) => {
  const promptFrame = request.approvedPrompt.promptFrameIndex
  if (
    promptFrame < request.sourceMedia.selectedStartFrameInclusive
    || promptFrame > request.sourceMedia.selectedEndFrameInclusive
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 prompt frame is outside the approved source interval.',
  })
})

export const canonicalSam31GpuRuntimeRequestSchema = requestWithoutHashSchema
  .extend({ requestBindingSha256: sha256 }).strict()
export type CanonicalSam31GpuRuntimeRequest = z.infer<
  typeof canonicalSam31GpuRuntimeRequestSchema
>

const runtimeMeasurementSchema = z.object({
  wallTimeMilliseconds: positiveInteger,
  modelLoadMilliseconds: nonnegativeInteger,
  promptMilliseconds: nonnegativeInteger,
  propagationMilliseconds: nonnegativeInteger,
  outputPersistenceMilliseconds: nonnegativeInteger,
  cudaEventInferenceMilliseconds: positiveInteger,
  peakCudaAllocatedBytes: positiveInteger,
  peakCudaReservedBytes: positiveInteger,
  outputFileCount: positiveInteger,
  outputByteLength: positiveInteger,
}).strict()

const gpuEvidenceSchema = z.object({
  requestedAccelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  observedDeviceNameDigestSha256: sha256,
  observedNvidiaDriverVersion: z.string().regex(
    /^[0-9]+(?:\.[0-9]+){1,3}$/u,
  ),
  observedCudaRuntimeVersion: safeVersion,
  observedTorchVersion: safeVersion,
  observedTorchcodecVersion: z.literal('0.10.0'),
  observedComputeCapabilityMajor: positiveInteger,
  observedComputeCapabilityMinor: nonnegativeInteger,
  observedTotalDeviceMemoryBytes: positiveInteger,
  maximumObservedNvdecUtilizationPercent: positiveInteger.max(100),
  maximumObservedGpuUtilizationPercent: positiveInteger.max(100),
  cudaAvailable: z.literal(true),
  bfloat16AutocastUsed: z.literal(true),
  nvdecHardwareDecodeMeasured: z.literal(true),
  decodedFramesResidentOnCuda: z.literal(true),
  boundedCpuOutputSerializationUsed: z.literal(true),
  cudaKernelExecutionMeasured: z.literal(true),
  cpuOnlyInferenceUsed: z.literal(false),
  cudaDriverLibraryMode: z.enum(['cuda_compat_12_8', 'host_driver']),
  observedCudaDriverLibraryPathDigestSha256: sha256,
  cudaForwardCompatibilityPackageSha256: z.literal(
    'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
  ),
  cudaForwardCompatibilityLibraryLoaded: z.boolean(),
  hostCudaDriverLibraryLoaded: z.boolean(),
}).strict().superRefine((evidence, context) => {
  const driverMajor = Number.parseInt(
    evidence.observedNvidiaDriverVersion.split('.')[0] ?? '',
    10,
  )
  const forwardCompatible = driverMajor >= 535 && driverMajor < 570
  const hostDriver = driverMajor >= 570
  const exact = forwardCompatible
    ? evidence.cudaDriverLibraryMode === 'cuda_compat_12_8'
      && evidence.cudaForwardCompatibilityLibraryLoaded
      && !evidence.hostCudaDriverLibraryLoaded
    : hostDriver
      && evidence.cudaDriverLibraryMode === 'host_driver'
      && !evidence.cudaForwardCompatibilityLibraryLoaded
      && evidence.hostCudaDriverLibraryLoaded
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 CUDA driver-library evidence is incompatible.',
  })
})

const outputSummarySchema = z.object({
  manifestRef: evidenceRefSchema,
  manifestSha256: sha256,
  firstFrameIndex: nonnegativeInteger,
  lastFrameIndex: nonnegativeInteger,
  propagatedFrameCount: positiveInteger,
  distinctObjectIds: z.array(nonnegativeInteger).max(16),
  losslessMaskPngCount: positiveInteger,
  normalizedBoxRecordCount: nonnegativeInteger,
  allMasksMatchSourceDimensions: z.literal(true),
  allFramesWithinApprovedInterval: z.literal(true),
  createOnlyPrivatePersistence: z.literal(true),
  exactPrivateRereadPending: z.literal(true),
}).strict()

const responseWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_GPU_RUNTIME_RESPONSE_VERSION),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  requestBindingSha256: sha256,
  dispatchAdmissionDigestSha256: sha256,
  status: z.enum(['completed', 'failed']),
  terminalStage: z.enum([
    'request_validation',
    'artifact_verification',
    'cuda_admission',
    'model_load',
    'session_start',
    'prompt',
    'propagation',
    'output_persistence',
    'artifact_reread',
    'completed',
  ]),
  gpuEvidence: gpuEvidenceSchema.nullable(),
  runtimeMeasurement: runtimeMeasurementSchema.nullable(),
  outputSummary: outputSummarySchema.nullable(),
  failureCode: z.enum([
    'none',
    'request_rejected',
    'artifact_mismatch',
    'gpu_mismatch',
    'model_load_failed',
    'inference_failed',
    'output_failed',
  ]),
  modelSourceAndCheckpointHashesVerifiedBeforeAndAfter: z.boolean(),
  sourceCheckpointCompatibilityQualificationReread: z.boolean(),
  serverCostReceiptIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((response, context) => {
  const completed = response.status === 'completed'
  const outputInternallyConsistent = response.outputSummary !== null
    && response.runtimeMeasurement !== null
    && response.outputSummary.manifestRef.contentHash ===
      `sha256:${response.outputSummary.manifestSha256}`
    && response.outputSummary.lastFrameIndex >=
      response.outputSummary.firstFrameIndex
    && response.outputSummary.propagatedFrameCount ===
      response.outputSummary.lastFrameIndex -
        response.outputSummary.firstFrameIndex + 1
    && response.runtimeMeasurement.outputFileCount ===
      response.outputSummary.losslessMaskPngCount + 1
    && response.outputSummary.distinctObjectIds.length > 0
    && new Set(response.outputSummary.distinctObjectIds).size ===
      response.outputSummary.distinctObjectIds.length
    && response.outputSummary.distinctObjectIds.every((objectId, index) =>
      index === 0 || objectId >
        response.outputSummary!.distinctObjectIds[index - 1])
  const exact = completed
    ? response.terminalStage === 'completed'
      && response.gpuEvidence !== null
      && response.runtimeMeasurement !== null
      && response.outputSummary !== null
      && response.failureCode === 'none'
      && response.modelSourceAndCheckpointHashesVerifiedBeforeAndAfter
      && response.sourceCheckpointCompatibilityQualificationReread
      && outputInternallyConsistent
    : response.terminalStage !== 'completed'
      && response.failureCode !== 'none'
      && response.gpuEvidence === null
      && response.runtimeMeasurement === null
      && response.outputSummary === null
      && !response.modelSourceAndCheckpointHashesVerifiedBeforeAndAfter
      && !response.sourceCheckpointCompatibilityQualificationReread
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 runtime response lost its fail-closed terminal state.',
  })
})

export const canonicalSam31GpuRuntimeResponseSchema = responseWithoutHashSchema
  .extend({ responseBindingSha256: sha256 }).strict()
export type CanonicalSam31GpuRuntimeResponse = z.infer<
  typeof canonicalSam31GpuRuntimeResponseSchema
>

export function buildCanonicalSam31GpuRuntimeRequest(
  input: z.input<typeof requestWithoutHashSchema>,
): CanonicalSam31GpuRuntimeRequest {
  const payload = requestWithoutHashSchema.parse(input)
  return canonicalSam31GpuRuntimeRequestSchema.parse({
    ...payload,
    requestBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31GpuRuntimeRequest(
  value: unknown,
): CanonicalSam31GpuRuntimeRequest {
  const parsed = canonicalSam31GpuRuntimeRequestSchema.parse(value)
  const { requestBindingSha256, ...payload } = parsed
  if (requestBindingSha256 !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 GPU runtime request binding is invalid.')
  }
  return parsed
}

export function buildCanonicalSam31GpuRuntimeResponse(
  input: z.input<typeof responseWithoutHashSchema>,
): CanonicalSam31GpuRuntimeResponse {
  const payload = responseWithoutHashSchema.parse(input)
  return canonicalSam31GpuRuntimeResponseSchema.parse({
    ...payload,
    responseBindingSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31GpuRuntimeResponse(input: {
  readonly request: unknown
  readonly response: unknown
}): CanonicalSam31GpuRuntimeResponse {
  const request = assertCanonicalSam31GpuRuntimeRequest(input.request)
  const response = canonicalSam31GpuRuntimeResponseSchema.parse(input.response)
  const { responseBindingSha256, ...payload } = response
  if (
    responseBindingSha256 !== sha256AuthorityValue(payload)
    || response.requestBindingSha256 !== request.requestBindingSha256
    || response.dispatchAdmissionDigestSha256 !==
      request.dispatchAdmissionDigestSha256
  ) throw new Error('SAM 3.1 GPU runtime response binding is invalid.')
  if (response.status === 'completed') {
    const gpu = response.gpuEvidence
    const output = response.outputSummary
    const primary = request.dispatch.accelerator === 'nvidia_a100_80gb'
    const exactGpu = gpu !== null
      && gpu.requestedAccelerator === request.dispatch.accelerator
      && gpu.observedComputeCapabilityMajor === 8
      && gpu.observedComputeCapabilityMinor === (primary ? 0 : 9)
      && gpu.observedTotalDeviceMemoryBytes >=
        (primary ? 75 : 20) * 1024 ** 3
    const exactOutput = output !== null
      && output.firstFrameIndex ===
        request.sourceMedia.selectedStartFrameInclusive
      && output.lastFrameIndex ===
        request.sourceMedia.selectedEndFrameInclusive
      && output.propagatedFrameCount ===
        request.sourceMedia.decodedFrameCount
    if (!exactGpu || !exactOutput) {
      throw new Error(
        'SAM 3.1 GPU response does not match the admitted GPU or frame range.',
      )
    }
  }
  return response
}

export function canonicalSam31GpuRuntimeRequestDigest(
  value: CanonicalSam31GpuRuntimeRequest,
): string {
  return sha256AuthorityValue(JSON.parse(stableAuthorityStringify(value)))
}
