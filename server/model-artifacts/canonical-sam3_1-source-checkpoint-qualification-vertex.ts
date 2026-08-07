import { z } from 'zod'

import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  canonicalSam31SourceCheckpointQualificationWorkerRequestSchema,
  canonicalSam31SourceCheckpointQualificationWorkerResultSchema,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from './canonical-sam3_1-source-checkpoint-qualification'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SOURCE_CHECKPOINT_WORKER_REQUEST_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-worker-request-v2' as const
export const CANONICAL_SAM3_1_VERTEX_SOURCE_CHECKPOINT_WORKER_RESULT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-worker-result-v2' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })

const requestV1Shape =
  canonicalSam31SourceCheckpointQualificationWorkerRequestSchema.shape
const requestBaseSchema = z.object({
  source: requestV1Shape.source,
  evidenceClass: requestV1Shape.evidenceClass,
  qualificationId: requestV1Shape.qualificationId,
  operationId: requestV1Shape.operationId,
  candidateRef: requestV1Shape.candidateRef,
  officialArtifactPublicationRef:
    requestV1Shape.officialArtifactPublicationRef,
  ingestReceiptRef: requestV1Shape.ingestReceiptRef,
  qualificationImage: requestV1Shape.qualificationImage,
  sourceArchive: requestV1Shape.sourceArchive,
  patchedSourceArchive: requestV1Shape.patchedSourceArchive,
  checkpoint: requestV1Shape.checkpoint,
  dependencyClosure: requestV1Shape.dependencyClosure,
  sourceCodeSecurityReviewRef: requestV1Shape.sourceCodeSecurityReviewRef,
  deterministicProbeFixture: requestV1Shape.deterministicProbeFixture,
}).strict()

const vertexRuntimeRequestSchema = z.object({
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
  customJobParent: z.literal('projects/reeditpro/locations/us-central1'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  vertexAcceleratorType: z.literal('NVIDIA_A100_80GB'),
  allocatedGpuCount: z.literal(1),
  replicaCount: z.literal(1),
  baseImageDigest: z.literal(
    'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
  ),
  pythonVersion: z.literal('3.12'),
  torchVersion: z.literal('2.10.0+cu128'),
  torchvisionVersion: z.literal('0.25.0+cu128'),
  torchcodecVersion: z.literal('0.10.0'),
  torchcodecCudaWheelVersion: z.literal('0.10.0+cu128'),
  einopsVersion: z.literal('0.8.2'),
  pycocotoolsVersion: z.literal('2.0.11'),
  ffmpegVersion: z.literal('8.0.3'),
  ffmpegNvdecAndCuvidRequired: z.literal(true),
  cpuVideoDecodeFallbackAllowed: z.literal(false),
  cudaVersion: z.literal('12.8'),
  fixedBuilder: z.literal('build_sam3_multiplex_video_predictor'),
  maximumTrackedObjects: z.literal(16),
  multiplexCount: z.literal(16),
  useFlashAttention3: z.literal(false),
  useRealValuedRope: z.literal(true),
  torchCompileEnabled: z.literal(false),
  warmupCompilationEnabled: z.literal(false),
  strictCheckpointLoadRequired: z.literal(true),
  repeatedProbeRunCount: z.literal(3),
  bfloat16AutocastRequired: z.literal(true),
  cudaOutputTensorsRequired: z.literal(true),
  privateArtifactTransport: z.literal(
    'vertex_ai_cloud_storage_fuse_fixed_attempt_scope',
  ),
  privateArtifactBucket: z.literal(
    'reeditpro-production-sam31-qualification-private',
  ),
  attemptScopeDerivedOnlyFromServerAttemptId: z.literal(true),
  networkEgressAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  developerMachineExecutionAllowed: z.literal(false),
  persistentResourceAllowed: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  minimumIdleInstances: z.literal(0),
  callerCommandModuleClassModelPathUrlOrEnvironmentAccepted:
    z.literal(false),
}).strict()

const vertexAuthorityRequestSchema = z.object({
  sourceCheckpointQualificationOnly: z.literal(true),
  legacyBatchRequestCastOrRelabelAllowed: z.literal(false),
  imageBuildStarted: z.literal(false),
  productionRuntimeDispatchAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerBillingAuthorityGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const vertexRequestWithoutHashSchema = requestBaseSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SOURCE_CHECKPOINT_WORKER_REQUEST_VERSION,
  ),
  qualificationVersion: z.literal(2),
  attemptId: safeId,
  attemptDigestSha256: sha256,
  historicalPackageRequestRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      'canonical-sam3_1-source-checkpoint-qualification-worker-request-v1',
    ),
    contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  }).strict(),
  runtime: vertexRuntimeRequestSchema,
  authority: vertexAuthorityRequestSchema,
  issuedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.attemptDigestSha256 !== sha256AuthorityValue(value.attemptId)
    || value.historicalPackageRequestRef.id !== value.qualificationId
    || value.qualificationImage.artifactRef.contentHash !==
      value.qualificationImage.immutableImageDigest
    || value.sourceArchive.artifactRef.contentHash !==
      `sha256:${value.sourceArchive.sha256}`
    || value.patchedSourceArchive.artifactRef.contentHash !==
      `sha256:${value.patchedSourceArchive.sha256}`
    || value.checkpoint.artifactRef.contentHash !==
      `sha256:${value.checkpoint.sha256}`
    || value.deterministicProbeFixture.artifactRef.contentHash !==
      `sha256:${value.deterministicProbeFixture.sha256}`
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex qualification attempt digest is invalid.',
    })
  }
})

export const canonicalSam31VertexSourceCheckpointWorkerRequestSchema =
  vertexRequestWithoutHashSchema.extend({ requestHash: sha256 }).strict()
export type CanonicalSam31VertexSourceCheckpointWorkerRequest = z.infer<
  typeof canonicalSam31VertexSourceCheckpointWorkerRequestSchema
>

const resultV1Shape =
  canonicalSam31SourceCheckpointQualificationWorkerResultSchema.shape
const resultBaseSchema = z.object({
  evidenceClass: resultV1Shape.evidenceClass,
  qualificationId: resultV1Shape.qualificationId,
  operationId: resultV1Shape.operationId,
  candidateRef: resultV1Shape.candidateRef,
  ingestReceiptRef: resultV1Shape.ingestReceiptRef,
  qualificationImage: resultV1Shape.qualificationImage,
  artifactVerification: resultV1Shape.artifactVerification,
  strictLoad: resultV1Shape.strictLoad,
  deterministicRuns: resultV1Shape.deterministicRuns,
  deterministicOutputDigestSha256:
    resultV1Shape.deterministicOutputDigestSha256,
  deterministicOutputDigestMatchedEveryRun:
    resultV1Shape.deterministicOutputDigestMatchedEveryRun,
  actualCudaModelInferenceExecuted:
    resultV1Shape.actualCudaModelInferenceExecuted,
  completedAt: resultV1Shape.completedAt,
}).strict()

const vertexRuntimeResultSchema = z.object({
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  allocatedGpuCount: z.literal(1),
  observedGpuName: z.string().trim().min(1).max(240),
  observedGpuTotalMemoryBytes: z.number().int().min(79_000_000_000).safe(),
  baseImageDigest: z.literal(
    'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
  ),
  pythonVersion: z.literal('3.12'),
  torchVersion: z.literal('2.10.0+cu128'),
  torchvisionVersion: z.literal('0.25.0+cu128'),
  torchcodecVersion: z.literal('0.10.0'),
  torchcodecCudaWheelVersion: z.literal('0.10.0+cu128'),
  einopsVersion: z.literal('0.8.2'),
  pycocotoolsVersion: z.literal('2.0.11'),
  ffmpegVersion: z.literal('8.0.3'),
  ffmpegNvdecAndCuvidAvailable: z.literal(true),
  gpuVideoDecodeBackendStatusVerified: z.literal(true),
  cpuVideoDecodeFallbackObserved: z.literal(false),
  cudaVersion: z.literal('12.8'),
  fixedBuilder: z.literal('build_sam3_multiplex_video_predictor'),
  privateArtifactTransport: z.literal(
    'vertex_ai_cloud_storage_fuse_fixed_attempt_scope',
  ),
  exactAttemptScopeDerivedFromServerAttemptId: z.literal(true),
  requestCheckpointAndFixtureRereadFromPrivateGenerationBoundScope:
    z.literal(true),
  resultCreatedOnceInExactPrivateAttemptScope: z.literal(true),
  networkEgressObserved: z.literal(false),
  developerMachineExecutionObserved: z.literal(false),
  cpuOnlyModelExecutionObserved: z.literal(false),
  quantizationOrResolutionReductionUsed: z.literal(false),
  providerInferenceExecuted: z.literal(false),
  bfloat16AutocastExecuted: z.literal(true),
  persistentResourceObserved: z.literal(false),
}).strict()

const vertexResultWithoutHashSchema = resultBaseSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SOURCE_CHECKPOINT_WORKER_RESULT_VERSION,
  ),
  source: z.literal(
    'fixed_sam3_1_vertex_a100_source_checkpoint_qualification_worker',
  ),
  qualificationVersion: z.literal(2),
  attemptId: safeId,
  attemptDigestSha256: sha256,
  requestRef: z.object({
    id: safeId,
    version: z.literal(2),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_VERTEX_SOURCE_CHECKPOINT_WORKER_REQUEST_VERSION,
    ),
    contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  }).strict(),
  runtime: vertexRuntimeResultSchema,
  authority: z.object({
    qualificationEvidenceOnly: z.literal(true),
    legacyBatchResultCastOrRelabelAllowed: z.literal(false),
    imageBuildStarted: z.literal(false),
    productionRuntimeDispatchAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (
    value.attemptDigestSha256 !== sha256AuthorityValue(value.attemptId)
    || value.requestRef.id !== value.qualificationId
    || value.qualificationImage.artifactRef.contentHash !==
      value.qualificationImage.immutableImageDigest
    || value.deterministicRuns.some((run, index) =>
      run.runOrdinal !== index + 1
      || run.outputDigestSha256 !== value.deterministicOutputDigestSha256)
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex qualification result lost its attempt or request.',
  })
})

export const canonicalSam31VertexSourceCheckpointWorkerResultSchema =
  vertexResultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalSam31VertexSourceCheckpointWorkerResult = z.infer<
  typeof canonicalSam31VertexSourceCheckpointWorkerResultSchema
>

export function createCanonicalSam31VertexSourceCheckpointWorkerRequest(input: {
  readonly historicalPackageRequest:
    CanonicalSam31SourceCheckpointQualificationWorkerRequest
  readonly attemptId: string
  readonly issuedAt: string
}): CanonicalSam31VertexSourceCheckpointWorkerRequest {
  assertPlainSerializedData(input, 'sam31_vertex_worker_request_input')
  const historical =
    assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
      input.historicalPackageRequest,
    )
  const packagePayload = requestBaseSchema.parse({
    source: historical.source,
    evidenceClass: historical.evidenceClass,
    qualificationId: historical.qualificationId,
    operationId: historical.operationId,
    candidateRef: historical.candidateRef,
    officialArtifactPublicationRef:
      historical.officialArtifactPublicationRef,
    ingestReceiptRef: historical.ingestReceiptRef,
    qualificationImage: historical.qualificationImage,
    sourceArchive: historical.sourceArchive,
    patchedSourceArchive: historical.patchedSourceArchive,
    checkpoint: historical.checkpoint,
    dependencyClosure: historical.dependencyClosure,
    sourceCodeSecurityReviewRef: historical.sourceCodeSecurityReviewRef,
    deterministicProbeFixture: historical.deterministicProbeFixture,
  })
  const payload = vertexRequestWithoutHashSchema.parse({
    ...packagePayload,
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SOURCE_CHECKPOINT_WORKER_REQUEST_VERSION,
    qualificationVersion: 2,
    attemptId: input.attemptId,
    attemptDigestSha256: sha256AuthorityValue(input.attemptId),
    historicalPackageRequestRef: {
      id: historical.qualificationId,
      version: 1,
      schemaVersion: historical.schemaVersion,
      contentHash: `sha256:${historical.requestHash}`,
    },
    runtime: {
      routeId: 'a100_80gb_heavy_primary',
      executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
      customJobParent: 'projects/reeditpro/locations/us-central1',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
      vertexAcceleratorType: 'NVIDIA_A100_80GB',
      allocatedGpuCount: 1,
      replicaCount: 1,
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
      ffmpegNvdecAndCuvidRequired: true,
      cpuVideoDecodeFallbackAllowed: false,
      cudaVersion: '12.8',
      fixedBuilder: 'build_sam3_multiplex_video_predictor',
      maximumTrackedObjects: 16,
      multiplexCount: 16,
      useFlashAttention3: false,
      useRealValuedRope: true,
      torchCompileEnabled: false,
      warmupCompilationEnabled: false,
      strictCheckpointLoadRequired: true,
      repeatedProbeRunCount: 3,
      bfloat16AutocastRequired: true,
      cudaOutputTensorsRequired: true,
      privateArtifactTransport:
        'vertex_ai_cloud_storage_fuse_fixed_attempt_scope',
      privateArtifactBucket:
        'reeditpro-production-sam31-qualification-private',
      attemptScopeDerivedOnlyFromServerAttemptId: true,
      networkEgressAllowed: false,
      runtimeDownloadAllowed: false,
      developerMachineExecutionAllowed: false,
      persistentResourceAllowed: false,
      automaticRetryAllowed: false,
      minimumIdleInstances: 0,
      callerCommandModuleClassModelPathUrlOrEnvironmentAccepted: false,
    },
    authority: {
      sourceCheckpointQualificationOnly: true,
      legacyBatchRequestCastOrRelabelAllowed: false,
      imageBuildStarted: false,
      productionRuntimeDispatchAuthorized: false,
      customerCreditsMutated: false,
      customerBillingAuthorityGranted: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    issuedAt: input.issuedAt,
  })
  return canonicalSam31VertexSourceCheckpointWorkerRequestSchema.parse({
    ...payload,
    requestHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexSourceCheckpointWorkerRequest(
  value: unknown,
): CanonicalSam31VertexSourceCheckpointWorkerRequest {
  assertPlainSerializedData(value, 'sam31_vertex_worker_request')
  const parsed = canonicalSam31VertexSourceCheckpointWorkerRequestSchema
    .parse(value)
  const { requestHash, ...payload } = parsed
  if (requestHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification worker request hash is invalid.')
  }
  return parsed
}

export function sealCanonicalSam31VertexSourceCheckpointWorkerResult(
  value: z.input<typeof vertexResultWithoutHashSchema>,
): CanonicalSam31VertexSourceCheckpointWorkerResult {
  assertPlainSerializedData(value, 'sam31_vertex_worker_result_input')
  const payload = vertexResultWithoutHashSchema.parse(value)
  return canonicalSam31VertexSourceCheckpointWorkerResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexSourceCheckpointWorkerResult(
  value: unknown,
): CanonicalSam31VertexSourceCheckpointWorkerResult {
  assertPlainSerializedData(value, 'sam31_vertex_worker_result')
  const parsed = canonicalSam31VertexSourceCheckpointWorkerResultSchema
    .parse(value)
  const { resultHash, ...payload } = parsed
  if (resultHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification worker result hash is invalid.')
  }
  return parsed
}
