import { z } from 'zod'

import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from './canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION =
  'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1' as const
export const CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_WORKER_REQUEST_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-worker-request-v1' as const
export const CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_WORKER_RESULT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-worker-result-v1' as const

const QUALIFICATION_BASE_IMAGE_DIGEST =
  'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca' as const
const SOURCE_SHA256 =
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a' as const
const GPU_DECODE_PATCH_SHA256 =
  'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca' as const
const EMPTY_EVIDENCE_SHA256 = '0'.repeat(64)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const qualificationWorkerRequestWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_WORKER_REQUEST_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_source_checkpoint_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  officialArtifactPublicationRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      'canonical-sam3_1-official-artifact-publication-receipt-v1',
    ),
    contentHash: prefixedSha256,
  }).strict(),
  ingestReceiptRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  qualificationImage: z.object({
    artifactRef: evidenceRefSchema,
    immutableImageDigest: prefixedSha256,
    supplyChainReleaseRef: evidenceRefSchema,
    dockerfileSourceRef: evidenceRefSchema,
    entrypointSourceRef: evidenceRefSchema,
    runnerSourceRef: evidenceRefSchema,
  }).strict(),
  sourceArchive: z.object({
    revision: z.literal(
      '96914d2425f90a64f45ca977c2b5165418099543',
    ),
    byteLength: z.literal(73_605_120),
    sha256: z.literal(SOURCE_SHA256),
    artifactRef: evidenceRefSchema,
  }).strict(),
  patchedSourceArchive: z.object({
    byteLength: z.literal(73_605_120),
    sha256: z.literal(
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    ),
    artifactRef: evidenceRefSchema,
    patchApplicationReceiptRef: evidenceRefSchema,
    patchSha256: z.literal(GPU_DECODE_PATCH_SHA256),
  }).strict(),
  checkpoint: z.object({
    repositoryRevision: z.literal(
      'daa63191845a41281374e725f4c9e51c7a824460',
    ),
    fileName: z.literal('sam3.1_multiplex.pt'),
    byteLength: positiveInteger.min(3_000_000_000).max(5_000_000_000),
    sha256,
    artifactRef: evidenceRefSchema,
    manifestRef: evidenceRefSchema,
    weightsOnlyInspectionRef: evidenceRefSchema,
  }).strict(),
  dependencyClosure: z.object({
    artifactRef: evidenceRefSchema,
    lockSha256: sha256,
    receiptSha256: sha256,
    wheelManifestSha256: sha256,
  }).strict(),
  sourceCodeSecurityReviewRef: evidenceRefSchema,
  deterministicProbeFixture: z.object({
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger.max(64 * 1024 * 1024),
    sha256,
    mediaType: z.literal('video/mp4'),
    width: positiveInteger.max(4_096),
    height: positiveInteger.max(4_096),
    frameCount: positiveInteger.min(2).max(64),
    promptFrameIndex: z.literal(0),
    fixedTextPrompt: z.literal('person'),
  }).strict(),
  runtime: z.object({
    executionTarget: z.literal('google_cloud_batch_a2_ultra_job'),
    machineType: z.literal('a2-ultragpu-1g'),
    accelerator: z.literal('nvidia_a100_80gb'),
    allocatedGpuCount: z.literal(1),
    baseImageDigest: z.literal(QUALIFICATION_BASE_IMAGE_DIGEST),
    pythonVersion: z.literal('3.12'),
    torchVersion: z.literal('2.10.0+cu128'),
    torchvisionVersion: z.literal('0.25.0'),
    torchcodecVersion: z.literal('0.10.0'),
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
    networkEgressAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    developerMachineExecutionAllowed: z.literal(false),
    callerCommandModuleClassModelPathUrlOrEnvironmentAccepted:
      z.literal(false),
    automaticRetryAfterUnknownOutcomeAllowed: z.literal(false),
  }).strict(),
  authority: z.object({
    sourceCheckpointQualificationOnly: z.literal(true),
    imageBuildStarted: z.literal(false),
    productionRuntimeDispatchAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  issuedAt: timestamp,
}).strict().superRefine((request, context) => {
  if (
    request.qualificationImage.artifactRef.contentHash !==
      request.qualificationImage.immutableImageDigest
    || request.sourceArchive.artifactRef.contentHash !==
      `sha256:${request.sourceArchive.sha256}`
    || request.patchedSourceArchive.artifactRef.contentHash !==
      `sha256:${request.patchedSourceArchive.sha256}`
    || request.checkpoint.artifactRef.contentHash !==
      `sha256:${request.checkpoint.sha256}`
    || request.deterministicProbeFixture.artifactRef.contentHash !==
      `sha256:${request.deterministicProbeFixture.sha256}`
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification worker request lost exact bytes.',
  })
})

export const canonicalSam31SourceCheckpointQualificationWorkerRequestSchema =
  qualificationWorkerRequestWithoutHashSchema.extend({
    requestHash: sha256,
  }).strict()
export type CanonicalSam31SourceCheckpointQualificationWorkerRequest = z.infer<
  typeof canonicalSam31SourceCheckpointQualificationWorkerRequestSchema
>

const deterministicWorkerRunSchema = z.object({
  runOrdinal: z.number().int().min(1).max(3),
  sessionStarted: z.literal(true),
  promptAdded: z.literal(true),
  completeForwardPropagationExecuted: z.literal(true),
  sessionClosed: z.literal(true),
  emittedFrameCount: positiveInteger.max(64),
  emittedObjectCount: positiveInteger.max(16),
  outputMaskShapeMatchedProbeFrames: z.literal(true),
  outputObjectIdsMatchedProbePrompt: z.literal(true),
  outputMasksWereCudaTensorsBeforeDigest: z.literal(true),
  outputDigestSha256: sha256,
  wallTimeMilliseconds: positiveInteger.max(3_600_000),
  cudaInferenceMilliseconds: positiveInteger.max(3_600_000),
}).strict().superRefine((run, context) => {
  if (run.cudaInferenceMilliseconds > run.wallTimeMilliseconds) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 qualification CUDA time exceeds wall time.',
    })
  }
})

const qualificationWorkerResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_WORKER_RESULT_VERSION,
  ),
  source: z.literal('fixed_sam3_1_a100_source_checkpoint_qualification_worker'),
  evidenceClass: z.literal('canonical_private_reread'),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  requestRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_WORKER_REQUEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  ingestReceiptRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  qualificationImage: z.object({
    artifactRef: evidenceRefSchema,
    immutableImageDigest: prefixedSha256,
    supplyChainReleaseRef: evidenceRefSchema,
  }).strict().superRefine((image, context) => {
    if (image.artifactRef.contentHash !== image.immutableImageDigest) {
      context.addIssue({
        code: 'custom',
        message: 'SAM 3.1 qualification result lost its image digest.',
      })
    }
  }),
  artifactVerification: z.object({
    exactSourceArchiveReread: z.literal(true),
    exactPatchedSourceArchiveReread: z.literal(true),
    exactCheckpointRereadBeforeAndAfter: z.literal(true),
    exactDependencyWheelAndNativeClosureReread: z.literal(true),
    sourcePatchApplicationReceiptReread: z.literal(true),
    deterministicProbeFixtureReread: z.literal(true),
    weightsOnlyCheckpointInspectionExecuted: z.literal(true),
    unsafeCheckpointGlobalCount: z.literal(0),
  }).strict(),
  runtime: z.object({
    executionTarget: z.literal('google_cloud_batch_a2_ultra_job'),
    machineType: z.literal('a2-ultragpu-1g'),
    accelerator: z.literal('nvidia_a100_80gb'),
    allocatedGpuCount: z.literal(1),
    observedGpuName: z.string().trim().min(1).max(240),
    observedGpuTotalMemoryBytes: positiveInteger.min(79_000_000_000),
    baseImageDigest: z.literal(QUALIFICATION_BASE_IMAGE_DIGEST),
    pythonVersion: z.literal('3.12'),
    torchVersion: z.literal('2.10.0+cu128'),
    torchvisionVersion: z.literal('0.25.0'),
    torchcodecVersion: z.literal('0.10.0'),
    cudaVersion: z.literal('12.8'),
    fixedBuilder: z.literal('build_sam3_multiplex_video_predictor'),
    networkEgressObserved: z.literal(false),
    developerMachineExecutionObserved: z.literal(false),
    cpuOnlyModelExecutionObserved: z.literal(false),
    quantizationOrResolutionReductionUsed: z.literal(false),
    providerInferenceExecuted: z.literal(false),
    bfloat16AutocastExecuted: z.literal(true),
  }).strict(),
  strictLoad: z.object({
    fixedBuilderImportedFromPinnedSource: z.literal(true),
    fixedBuilderCalledExactlyOnce: z.literal(true),
    checkpointLoadedExactlyOnce: z.literal(true),
    strictCheckpointLoadRequested: z.literal(true),
    missingCheckpointKeyCount: z.literal(0),
    unexpectedCheckpointKeyCount: z.literal(0),
    checkpointKeyCount: positiveInteger,
    modelStateKeyCount: positiveInteger,
    checkpointKeySetSha256: sha256,
    modelStateKeySetSha256: sha256,
    checkpointAndModelKeySetsExact: z.literal(true),
  }).strict().superRefine((load, context) => {
    if (
      load.checkpointKeyCount !== load.modelStateKeyCount
      || load.checkpointKeySetSha256 !== load.modelStateKeySetSha256
    ) context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 strict-load key evidence differs.',
    })
  }),
  deterministicRuns: z.tuple([
    deterministicWorkerRunSchema,
    deterministicWorkerRunSchema,
    deterministicWorkerRunSchema,
  ]),
  deterministicOutputDigestSha256: sha256,
  deterministicOutputDigestMatchedEveryRun: z.literal(true),
  actualCudaModelInferenceExecuted: z.literal(true),
  completedAt: timestamp,
  authority: z.object({
    qualificationEvidenceOnly: z.literal(true),
    imageBuildStarted: z.literal(false),
    productionRuntimeDispatchAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((result, context) => {
  const digest = result.deterministicOutputDigestSha256
  if (
    result.deterministicRuns.some((run, index) =>
      run.runOrdinal !== index + 1
      || run.outputDigestSha256 !== digest)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification probe runs are not deterministic.',
  })
})

export const canonicalSam31SourceCheckpointQualificationWorkerResultSchema =
  qualificationWorkerResultWithoutHashSchema.extend({
    resultHash: sha256,
  }).strict()
export type CanonicalSam31SourceCheckpointQualificationWorkerResult = z.infer<
  typeof canonicalSam31SourceCheckpointQualificationWorkerResultSchema
>

export interface CanonicalSam31SourceCheckpointQualificationWorkerEvidence {
  readonly request: CanonicalSam31SourceCheckpointQualificationWorkerRequest
  readonly result: CanonicalSam31SourceCheckpointQualificationWorkerResult
  readonly qualificationJobRef: z.input<typeof evidenceRefSchema>
  readonly qualificationAttemptRef: z.input<typeof evidenceRefSchema>
  readonly qualificationResultRuntimeRef: z.input<typeof evidenceRefSchema>
  readonly qualificationLogRef: z.input<typeof evidenceRefSchema>
  readonly qualificationJobTerminalObservationRef:
    z.input<typeof evidenceRefSchema>
  readonly internalCostReceiptRef: z.input<typeof evidenceRefSchema>
  readonly deterministicProbeResultRef: z.input<typeof evidenceRefSchema>
  readonly terminalJobObservation: {
    readonly immutableImageDigest: string
    readonly jobSucceeded: true
    readonly networkEgressDisabled: true
    readonly automaticRetryCount: 0
    readonly requestObjectReread: true
    readonly requestCheckpointAndFixtureMountsReadOnly: true
    readonly resultMountCreateOnly: true
    readonly resultObjectCreateOnlyAndReread: true
  }
  readonly securityAndCompliance: {
    readonly sourceLicenseReviewedForApprovedUse: boolean
    readonly checkpointLicenseReviewedForApprovedUse: boolean
    readonly privacyReviewApprovedForPrivateQualification: boolean
    readonly tradeControlsReviewApprovedForPrivateQualification: boolean
    readonly sourceMalwareScanPassed: boolean
    readonly checkpointMalwareScanPassed: boolean
    readonly sourceStaticSecurityReviewPassed: boolean
    readonly checkpointWeightsOnlyLoadPassed: boolean
    readonly checkpointTensorAndMetadataAllowlistPassed: boolean
    readonly executablePickleTrustGranted: false
    readonly checkpointRedistributionAuthorized: false
  }
  readonly qualifiedAt: string
}

export function createCanonicalSam31SourceCheckpointQualificationWorkerRequest(
  input: {
    readonly qualificationId: string
    readonly candidate: CanonicalSam31SourceRuntimeCandidate
    readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
    readonly qualificationImage: {
      readonly artifactRef: z.input<typeof evidenceRefSchema>
      readonly immutableImageDigest: string
      readonly supplyChainReleaseRef: z.input<typeof evidenceRefSchema>
      readonly dockerfileSourceRef: z.input<typeof evidenceRefSchema>
      readonly entrypointSourceRef: z.input<typeof evidenceRefSchema>
      readonly runnerSourceRef: z.input<typeof evidenceRefSchema>
    }
    readonly patchedSourceArchiveRef: z.input<typeof evidenceRefSchema>
    readonly patchApplicationReceiptRef: z.input<typeof evidenceRefSchema>
    readonly checkpointWeightsOnlyInspectionRef:
      z.input<typeof evidenceRefSchema>
    readonly dependencyClosureRef: z.input<typeof evidenceRefSchema>
    readonly dependencyLockSha256: string
    readonly dependencyClosureReceiptSha256: string
    readonly dependencyWheelManifestSha256: string
    readonly sourceCodeSecurityReviewRef: z.input<typeof evidenceRefSchema>
    readonly deterministicProbeFixture: {
      readonly artifactRef: z.input<typeof evidenceRefSchema>
      readonly byteLength: number
      readonly sha256: string
      readonly width: number
      readonly height: number
      readonly frameCount: number
    }
    readonly issuedAt: string
  },
): CanonicalSam31SourceCheckpointQualificationWorkerRequest {
  assertPlainSerializedData(input, 'sam3_1_qualification_worker_request_input')
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  if (
    ingest.evidenceClass !== 'canonical_private_reread'
    || ingest.status !== 'ready_for_immutable_image_build_review'
    || !ingest.authority.canonicalTermsAcceptanceObserved
    || !ingest.authority.imageBuildReviewEligible
    || ingest.candidateRef.candidateHash !== candidate.candidateHash
    || ingest.candidateRef.schemaVersion !== candidate.schemaVersion
    || ingest.operationId !== candidate.operationId
  ) throw new Error('SAM 3.1 qualification requires canonical private ingest.')
  const payload = qualificationWorkerRequestWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_WORKER_REQUEST_VERSION,
    source: 'canonical_server_sam3_1_source_checkpoint_qualification_owner',
    evidenceClass: 'canonical_private_reread',
    qualificationId: input.qualificationId,
    qualificationVersion: 1,
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    officialArtifactPublicationRef: ingest.officialArtifactPublicationRef,
    ingestReceiptRef: {
      id: ingest.ingestReceiptId,
      version: ingest.ingestReceiptVersion,
      schemaVersion: ingest.schemaVersion,
      contentHash: `sha256:${ingest.ingestReceiptHash}`,
    },
    qualificationImage: input.qualificationImage,
    sourceArchive: {
      revision: ingest.sourceArchive.revision,
      byteLength: ingest.sourceArchive.coordinate.byteLength,
      sha256: ingest.sourceArchive.coordinate.sha256,
      artifactRef: ingest.sourceArchive.artifactRef,
    },
    patchedSourceArchive: {
      byteLength:
        candidate.runtimeClosure.deterministicPatchedSourceArchiveByteLength,
      sha256:
        candidate.runtimeClosure.deterministicPatchedSourceArchiveSha256,
      artifactRef: input.patchedSourceArchiveRef,
      patchApplicationReceiptRef: input.patchApplicationReceiptRef,
      patchSha256: candidate.runtimeClosure.reeditproGpuDecodePatchSha256,
    },
    checkpoint: {
      repositoryRevision: ingest.checkpoint.revision,
      fileName: ingest.checkpoint.fileName,
      byteLength: ingest.checkpoint.coordinate.byteLength,
      sha256: ingest.checkpoint.coordinate.sha256,
      artifactRef: ingest.checkpoint.artifactRef,
      manifestRef: ingest.checkpoint.manifestRef,
      weightsOnlyInspectionRef: input.checkpointWeightsOnlyInspectionRef,
    },
    dependencyClosure: {
      artifactRef: input.dependencyClosureRef,
      lockSha256: input.dependencyLockSha256,
      receiptSha256: input.dependencyClosureReceiptSha256,
      wheelManifestSha256: input.dependencyWheelManifestSha256,
    },
    sourceCodeSecurityReviewRef: input.sourceCodeSecurityReviewRef,
    deterministicProbeFixture: {
      ...input.deterministicProbeFixture,
      mediaType: 'video/mp4',
      promptFrameIndex: 0,
      fixedTextPrompt: 'person',
    },
    runtime: {
      executionTarget: 'google_cloud_batch_a2_ultra_job',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
      allocatedGpuCount: 1,
      baseImageDigest: QUALIFICATION_BASE_IMAGE_DIGEST,
      pythonVersion: '3.12',
      torchVersion: '2.10.0+cu128',
      torchvisionVersion: '0.25.0',
      torchcodecVersion: '0.10.0',
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
      networkEgressAllowed: false,
      runtimeDownloadAllowed: false,
      developerMachineExecutionAllowed: false,
      callerCommandModuleClassModelPathUrlOrEnvironmentAccepted: false,
      automaticRetryAfterUnknownOutcomeAllowed: false,
    },
    authority: {
      sourceCheckpointQualificationOnly: true,
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
  return canonicalSam31SourceCheckpointQualificationWorkerRequestSchema.parse({
    ...payload,
    requestHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
  value: unknown,
): CanonicalSam31SourceCheckpointQualificationWorkerRequest {
  assertPlainSerializedData(value, 'sam3_1_qualification_worker_request')
  const parsed =
    canonicalSam31SourceCheckpointQualificationWorkerRequestSchema.parse(value)
  const { requestHash, ...payload } = parsed
  if (requestHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification worker request hash is invalid.')
  }
  return parsed
}

/**
 * Seals the fixed worker's byte-free result. Production server code must still
 * reread the create-only private result object and terminal Batch/cost records
 * before passing it into the canonical qualification compiler.
 */
export function sealCanonicalSam31SourceCheckpointQualificationWorkerResult(
  value: z.input<typeof qualificationWorkerResultWithoutHashSchema>,
): CanonicalSam31SourceCheckpointQualificationWorkerResult {
  assertPlainSerializedData(value, 'sam3_1_qualification_worker_result_input')
  const payload = qualificationWorkerResultWithoutHashSchema.parse(value)
  return canonicalSam31SourceCheckpointQualificationWorkerResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourceCheckpointQualificationWorkerResult(
  value: unknown,
): CanonicalSam31SourceCheckpointQualificationWorkerResult {
  assertPlainSerializedData(value, 'sam3_1_qualification_worker_result')
  const parsed =
    canonicalSam31SourceCheckpointQualificationWorkerResultSchema.parse(value)
  const { resultHash, ...payload } = parsed
  if (resultHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification worker result hash is invalid.')
  }
  return parsed
}

const observationSchema = z.object({
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  qualificationJobRef: evidenceRefSchema,
  qualificationAttemptRef: evidenceRefSchema,
  qualificationResultRuntimeRef: evidenceRefSchema,
  qualificationLogRef: evidenceRefSchema,
  qualificationJobTerminalObservationRef: evidenceRefSchema,
  internalCostReceiptRef: evidenceRefSchema,
  qualificationImageRef: evidenceRefSchema,
  qualificationImageSupplyChainReleaseRef: evidenceRefSchema,
  qualificationImageDigest: prefixedSha256,
  qualificationJobRuntimeImageDigest: prefixedSha256,
  qualificationJobSucceeded: z.boolean(),
  qualificationJobNetworkEgressDisabled: z.boolean(),
  qualificationJobAutomaticRetryCount: nonnegativeInteger,
  qualificationRequestObjectReread: z.boolean(),
  qualificationRequestCheckpointAndFixtureMountsReadOnly: z.boolean(),
  qualificationResultMountCreateOnly: z.boolean(),
  qualificationResultObjectCreateOnlyAndReread: z.boolean(),
  dependencyClosureRef: evidenceRefSchema,
  dependencyLockSha256: sha256,
  dependencyClosureReceiptSha256: sha256,
  dependencyWheelManifestSha256: sha256,
  patchApplicationReceiptRef: evidenceRefSchema,
  patchedSourceArchiveRef: evidenceRefSchema,
  patchedSourceArchiveSha256: z.literal(
    'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
  ),
  sourceCodeSecurityReviewRef: evidenceRefSchema,
  checkpointWeightsOnlyInspectionRef: evidenceRefSchema,
  deterministicProbeFixtureRef: evidenceRefSchema,
  deterministicProbeResultRef: evidenceRefSchema,
  securityAndCompliance: z.object({
    sourceLicenseReviewedForApprovedUse: z.boolean(),
    checkpointLicenseReviewedForApprovedUse: z.boolean(),
    privacyReviewApprovedForPrivateQualification: z.boolean(),
    tradeControlsReviewApprovedForPrivateQualification: z.boolean(),
    sourceMalwareScanPassed: z.boolean(),
    checkpointMalwareScanPassed: z.boolean(),
    sourceStaticSecurityReviewPassed: z.boolean(),
    checkpointWeightsOnlyLoadPassed: z.boolean(),
    checkpointTensorAndMetadataAllowlistPassed: z.boolean(),
    executablePickleTrustGranted: z.literal(false),
    checkpointRedistributionAuthorized: z.literal(false),
  }).strict(),
  qualificationRuntime: z.object({
    executionTarget: z.literal('google_cloud_batch_a2_ultra_job'),
    machineType: z.literal('a2-ultragpu-1g'),
    accelerator: z.literal('nvidia_a100_80gb'),
    allocatedGpuCount: z.literal(1),
    baseImageDigest: z.literal(QUALIFICATION_BASE_IMAGE_DIGEST),
    pythonVersion: z.literal('3.12'),
    torchVersion: z.literal('2.10.0'),
    torchvisionVersion: z.literal('0.25.0'),
    torchcodecVersion: z.literal('0.10.0'),
    cudaVersion: z.literal('12.8'),
    fixedBuilder: z.literal('build_sam3_multiplex_video_predictor'),
    networkEgressAllowed: z.literal(false),
    developerMachineExecutionAllowed: z.literal(false),
    callerCommandModuleClassModelOrCheckpointAccepted: z.literal(false),
    sourceCheckpointAndDependencyMountsReadOnly: z.literal(true),
    automaticRetryAfterUnknownOutcomeAllowed: z.literal(false),
  }).strict(),
  compatibilityProbe: z.object({
    exactSourceArchiveReread: z.boolean(),
    exactPatchedSourceArchiveReread: z.boolean(),
    exactCheckpointRereadBeforeAndAfter: z.boolean(),
    exactDependencyWheelAndNativeClosureReread: z.boolean(),
    sourcePatchApplicationReceiptReread: z.boolean(),
    weightsOnlyCheckpointInspectionExecuted: z.boolean(),
    fixedBuilderImportedFromPinnedSource: z.boolean(),
    fixedBuilderCalledExactlyOnce: z.boolean(),
    checkpointLoadedExactlyOnce: z.boolean(),
    strictCheckpointLoadRequested: z.boolean(),
    missingCheckpointKeyCount: nonnegativeInteger,
    unexpectedCheckpointKeyCount: nonnegativeInteger,
    checkpointKeyCount: nonnegativeInteger,
    modelStateKeyCount: nonnegativeInteger,
    checkpointKeySetSha256: sha256,
    modelStateKeySetSha256: sha256,
    checkpointAndModelKeySetsExact: z.boolean(),
    startSessionAddPromptPropagateAndCloseExecuted: z.boolean(),
    actualCudaModelInferenceExecuted: z.boolean(),
    bfloat16AutocastExecuted: z.boolean(),
    outputMaskShapeMatchedProbeFrames: z.boolean(),
    outputObjectIdsMatchedProbePrompt: z.boolean(),
    outputMasksWereCudaTensorsBeforeSerialization: z.boolean(),
    deterministicRepeatedProbeRunCount: nonnegativeInteger,
    deterministicOutputDigestSha256: sha256,
    deterministicOutputDigestMatchedEveryRun: z.boolean(),
    cpuOnlyModelExecutionObserved: z.literal(false),
    quantizationOrResolutionReductionUsed: z.literal(false),
    providerInferenceExecuted: z.literal(false),
  }).strict(),
  qualifiedAt: timestamp,
}).strict()

export type CanonicalSam31SourceCheckpointQualificationObservation = z.infer<
  typeof observationSchema
>

export function createCanonicalSam31SourceCheckpointQualificationObservation(
  input: CanonicalSam31SourceCheckpointQualificationWorkerEvidence,
): CanonicalSam31SourceCheckpointQualificationObservation {
  assertPlainSerializedData(input, 'sam3_1_qualification_worker_evidence')
  const request =
    assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
      input.request,
    )
  const result =
    assertCanonicalSam31SourceCheckpointQualificationWorkerResult(input.result)
  const expectedRequestRef = {
    id: request.qualificationId,
    version: request.qualificationVersion,
    schemaVersion: request.schemaVersion,
    contentHash: `sha256:${request.requestHash}`,
  }
  if (
    result.qualificationId !== request.qualificationId
    || result.qualificationVersion !== request.qualificationVersion
    || result.operationId !== request.operationId
    || !sameRef(result.requestRef, expectedRequestRef)
    || result.candidateRef.schemaVersion !== request.candidateRef.schemaVersion
    || result.candidateRef.candidateHash !== request.candidateRef.candidateHash
    || !sameRef(result.ingestReceiptRef, request.ingestReceiptRef)
    || result.qualificationImage.immutableImageDigest !==
      request.qualificationImage.immutableImageDigest
    || !sameRef(
      result.qualificationImage.artifactRef,
      request.qualificationImage.artifactRef,
    )
    || !sameRef(
      result.qualificationImage.supplyChainReleaseRef,
      request.qualificationImage.supplyChainReleaseRef,
    )
    || input.terminalJobObservation.immutableImageDigest !==
      request.qualificationImage.immutableImageDigest
    || Date.parse(result.completedAt) < Date.parse(request.issuedAt)
  ) throw new Error('SAM 3.1 qualification worker result crossed its request.')
  const firstRun = result.deterministicRuns[0]
  const allLifecycleSteps = result.deterministicRuns.every((run) =>
    run.sessionStarted
    && run.promptAdded
    && run.completeForwardPropagationExecuted
    && run.sessionClosed)
  const outputShapeMatched = result.deterministicRuns.every((run) =>
    run.emittedFrameCount === request.deterministicProbeFixture.frameCount
    && run.outputMaskShapeMatchedProbeFrames)
  const outputObjectsMatched = result.deterministicRuns.every((run) =>
    run.emittedObjectCount >= 1
    && run.emittedObjectCount <= request.runtime.maximumTrackedObjects
    && run.outputObjectIdsMatchedProbePrompt)
  const outputCuda = result.deterministicRuns.every((run) =>
    run.outputMasksWereCudaTensorsBeforeDigest)
  if (!firstRun || !allLifecycleSteps || !outputShapeMatched
    || !outputObjectsMatched || !outputCuda) {
    throw new Error('SAM 3.1 qualification worker did not complete the probe.')
  }
  return observationSchema.parse({
    evidenceClass: 'canonical_private_reread',
    qualificationId: request.qualificationId,
    qualificationVersion: request.qualificationVersion,
    qualificationJobRef: input.qualificationJobRef,
    qualificationAttemptRef: input.qualificationAttemptRef,
    qualificationResultRuntimeRef: input.qualificationResultRuntimeRef,
    qualificationLogRef: input.qualificationLogRef,
    qualificationJobTerminalObservationRef:
      input.qualificationJobTerminalObservationRef,
    internalCostReceiptRef: input.internalCostReceiptRef,
    qualificationImageRef: request.qualificationImage.artifactRef,
    qualificationImageSupplyChainReleaseRef:
      request.qualificationImage.supplyChainReleaseRef,
    qualificationImageDigest:
      request.qualificationImage.immutableImageDigest,
    qualificationJobRuntimeImageDigest:
      input.terminalJobObservation.immutableImageDigest,
    qualificationJobSucceeded: input.terminalJobObservation.jobSucceeded,
    qualificationJobNetworkEgressDisabled:
      input.terminalJobObservation.networkEgressDisabled,
    qualificationJobAutomaticRetryCount:
      input.terminalJobObservation.automaticRetryCount,
    qualificationRequestObjectReread:
      input.terminalJobObservation.requestObjectReread,
    qualificationRequestCheckpointAndFixtureMountsReadOnly:
      input.terminalJobObservation
        .requestCheckpointAndFixtureMountsReadOnly,
    qualificationResultMountCreateOnly:
      input.terminalJobObservation.resultMountCreateOnly,
    qualificationResultObjectCreateOnlyAndReread:
      input.terminalJobObservation.resultObjectCreateOnlyAndReread,
    dependencyClosureRef: request.dependencyClosure.artifactRef,
    dependencyLockSha256: request.dependencyClosure.lockSha256,
    dependencyClosureReceiptSha256:
      request.dependencyClosure.receiptSha256,
    dependencyWheelManifestSha256:
      request.dependencyClosure.wheelManifestSha256,
    patchApplicationReceiptRef:
      request.patchedSourceArchive.patchApplicationReceiptRef,
    patchedSourceArchiveRef: request.patchedSourceArchive.artifactRef,
    patchedSourceArchiveSha256: request.patchedSourceArchive.sha256,
    sourceCodeSecurityReviewRef: request.sourceCodeSecurityReviewRef,
    checkpointWeightsOnlyInspectionRef:
      request.checkpoint.weightsOnlyInspectionRef,
    deterministicProbeFixtureRef:
      request.deterministicProbeFixture.artifactRef,
    deterministicProbeResultRef: input.deterministicProbeResultRef,
    securityAndCompliance: input.securityAndCompliance,
    qualificationRuntime: {
      executionTarget: result.runtime.executionTarget,
      machineType: result.runtime.machineType,
      accelerator: result.runtime.accelerator,
      allocatedGpuCount: result.runtime.allocatedGpuCount,
      baseImageDigest: result.runtime.baseImageDigest,
      pythonVersion: result.runtime.pythonVersion,
      torchVersion: '2.10.0',
      torchvisionVersion: result.runtime.torchvisionVersion,
      torchcodecVersion: result.runtime.torchcodecVersion,
      cudaVersion: result.runtime.cudaVersion,
      fixedBuilder: result.runtime.fixedBuilder,
      networkEgressAllowed: result.runtime.networkEgressObserved,
      developerMachineExecutionAllowed:
        result.runtime.developerMachineExecutionObserved,
      callerCommandModuleClassModelOrCheckpointAccepted: false,
      sourceCheckpointAndDependencyMountsReadOnly: true,
      automaticRetryAfterUnknownOutcomeAllowed: false,
    },
    compatibilityProbe: {
      exactSourceArchiveReread:
        result.artifactVerification.exactSourceArchiveReread,
      exactPatchedSourceArchiveReread:
        result.artifactVerification.exactPatchedSourceArchiveReread,
      exactCheckpointRereadBeforeAndAfter:
        result.artifactVerification.exactCheckpointRereadBeforeAndAfter,
      exactDependencyWheelAndNativeClosureReread:
        result.artifactVerification
          .exactDependencyWheelAndNativeClosureReread,
      sourcePatchApplicationReceiptReread:
        result.artifactVerification.sourcePatchApplicationReceiptReread,
      weightsOnlyCheckpointInspectionExecuted:
        result.artifactVerification.weightsOnlyCheckpointInspectionExecuted,
      fixedBuilderImportedFromPinnedSource:
        result.strictLoad.fixedBuilderImportedFromPinnedSource,
      fixedBuilderCalledExactlyOnce:
        result.strictLoad.fixedBuilderCalledExactlyOnce,
      checkpointLoadedExactlyOnce:
        result.strictLoad.checkpointLoadedExactlyOnce,
      strictCheckpointLoadRequested:
        result.strictLoad.strictCheckpointLoadRequested,
      missingCheckpointKeyCount:
        result.strictLoad.missingCheckpointKeyCount,
      unexpectedCheckpointKeyCount:
        result.strictLoad.unexpectedCheckpointKeyCount,
      checkpointKeyCount: result.strictLoad.checkpointKeyCount,
      modelStateKeyCount: result.strictLoad.modelStateKeyCount,
      checkpointKeySetSha256:
        result.strictLoad.checkpointKeySetSha256,
      modelStateKeySetSha256: result.strictLoad.modelStateKeySetSha256,
      checkpointAndModelKeySetsExact:
        result.strictLoad.checkpointAndModelKeySetsExact,
      startSessionAddPromptPropagateAndCloseExecuted: allLifecycleSteps,
      actualCudaModelInferenceExecuted:
        result.actualCudaModelInferenceExecuted,
      bfloat16AutocastExecuted: result.runtime.bfloat16AutocastExecuted,
      outputMaskShapeMatchedProbeFrames: outputShapeMatched,
      outputObjectIdsMatchedProbePrompt: outputObjectsMatched,
      outputMasksWereCudaTensorsBeforeSerialization: outputCuda,
      deterministicRepeatedProbeRunCount:
        result.deterministicRuns.length,
      deterministicOutputDigestSha256:
        result.deterministicOutputDigestSha256,
      deterministicOutputDigestMatchedEveryRun:
        result.deterministicOutputDigestMatchedEveryRun,
      cpuOnlyModelExecutionObserved:
        result.runtime.cpuOnlyModelExecutionObserved,
      quantizationOrResolutionReductionUsed:
        result.runtime.quantizationOrResolutionReductionUsed,
      providerInferenceExecuted: result.runtime.providerInferenceExecuted,
    },
    qualifiedAt: input.qualifiedAt,
  })
}

const qualificationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_source_checkpoint_qualification_owner',
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum([
    'contract_only',
    'qualified_for_private_image_build',
  ]),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  officialArtifactPublicationRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      'canonical-sam3_1-official-artifact-publication-receipt-v1',
    ),
    contentHash: prefixedSha256,
  }).strict(),
  ingestReceiptRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  termsAcceptanceRef: evidenceRefSchema,
  sourceArchive: z.object({
    revision: z.literal(
      '96914d2425f90a64f45ca977c2b5165418099543',
    ),
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256: sha256,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    gpuDecodePatchSha256: z.literal(GPU_DECODE_PATCH_SHA256),
  }).strict(),
  checkpoint: z.object({
    repositoryRevision: z.literal(
      'daa63191845a41281374e725f4c9e51c7a824460',
    ),
    fileName: z.literal('sam3.1_multiplex.pt'),
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256: sha256,
    manifestRef: evidenceRefSchema,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
  }).strict(),
  controlledObservation: observationSchema.omit({
    evidenceClass: true,
    qualificationId: true,
    qualificationVersion: true,
    qualifiedAt: true,
  }).strict(),
  authority: z.object({
    qualificationEvidenceOnly: z.literal(true),
    securityLicenseAndCompatibilityQualified: z.boolean(),
    privateImageBuildReviewEligible: z.boolean(),
    imageBuildStarted: z.literal(false),
    runtimeDispatchAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  qualifiedAt: timestamp,
}).strict().superRefine((record, context) => {
  const canonical = record.evidenceClass === 'canonical_private_reread'
  const security = record.controlledObservation.securityAndCompliance
  const probe = record.controlledObservation.compatibilityProbe
  if (
    record.controlledObservation.patchedSourceArchiveRef.contentHash !==
      `sha256:${record.controlledObservation.patchedSourceArchiveSha256}`
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 patched source evidence does not bind exact bytes.',
  })
  const canonicalEvidence =
    record.status === 'qualified_for_private_image_build'
    && record.controlledObservation.qualificationImageRef.contentHash ===
      record.controlledObservation.qualificationImageDigest
    && record.controlledObservation.qualificationJobRuntimeImageDigest ===
      record.controlledObservation.qualificationImageDigest
    && record.controlledObservation.qualificationJobSucceeded
    && record.controlledObservation.qualificationJobNetworkEgressDisabled
    && record.controlledObservation.qualificationJobAutomaticRetryCount === 0
    && record.controlledObservation.qualificationRequestObjectReread
    && record.controlledObservation
      .qualificationRequestCheckpointAndFixtureMountsReadOnly
    && record.controlledObservation.qualificationResultMountCreateOnly
    && record.controlledObservation
      .qualificationResultObjectCreateOnlyAndReread
    && record.sourceArchive.byteLength === 73_605_120
    && record.sourceArchive.sha256 === SOURCE_SHA256
    && record.sourceArchive.artifactRef.contentHash ===
      `sha256:${record.sourceArchive.sha256}`
    && record.checkpoint.byteLength >= 3_000_000_000
    && record.checkpoint.byteLength <= 5_000_000_000
    && record.checkpoint.artifactRef.contentHash ===
      `sha256:${record.checkpoint.sha256}`
    && security.sourceLicenseReviewedForApprovedUse
    && security.checkpointLicenseReviewedForApprovedUse
    && security.privacyReviewApprovedForPrivateQualification
    && security.tradeControlsReviewApprovedForPrivateQualification
    && security.sourceMalwareScanPassed
    && security.checkpointMalwareScanPassed
    && security.sourceStaticSecurityReviewPassed
    && security.checkpointWeightsOnlyLoadPassed
    && security.checkpointTensorAndMetadataAllowlistPassed
    && probe.exactSourceArchiveReread
    && probe.exactPatchedSourceArchiveReread
    && probe.exactCheckpointRereadBeforeAndAfter
    && probe.exactDependencyWheelAndNativeClosureReread
    && probe.sourcePatchApplicationReceiptReread
    && probe.weightsOnlyCheckpointInspectionExecuted
    && probe.fixedBuilderImportedFromPinnedSource
    && probe.fixedBuilderCalledExactlyOnce
    && probe.checkpointLoadedExactlyOnce
    && probe.strictCheckpointLoadRequested
    && probe.missingCheckpointKeyCount === 0
    && probe.unexpectedCheckpointKeyCount === 0
    && probe.checkpointKeyCount > 0
    && probe.checkpointKeyCount === probe.modelStateKeyCount
    && probe.checkpointKeySetSha256 === probe.modelStateKeySetSha256
    && probe.checkpointAndModelKeySetsExact
    && probe.startSessionAddPromptPropagateAndCloseExecuted
    && probe.actualCudaModelInferenceExecuted
    && probe.bfloat16AutocastExecuted
    && probe.outputMaskShapeMatchedProbeFrames
    && probe.outputObjectIdsMatchedProbePrompt
    && probe.outputMasksWereCudaTensorsBeforeSerialization
    && probe.deterministicRepeatedProbeRunCount >= 3
    && probe.deterministicOutputDigestSha256 !== EMPTY_EVIDENCE_SHA256
    && probe.deterministicOutputDigestMatchedEveryRun
    && record.authority.securityLicenseAndCompatibilityQualified
    && record.authority.privateImageBuildReviewEligible
  const contractEvidence = record.status === 'contract_only'
    && !record.controlledObservation.qualificationJobSucceeded
    && !record.controlledObservation.qualificationJobNetworkEgressDisabled
    && record.controlledObservation.qualificationJobAutomaticRetryCount === 0
    && !record.controlledObservation.qualificationRequestObjectReread
    && !record.controlledObservation
      .qualificationRequestCheckpointAndFixtureMountsReadOnly
    && !record.controlledObservation.qualificationResultMountCreateOnly
    && !record.controlledObservation
      .qualificationResultObjectCreateOnlyAndReread
    && !security.sourceLicenseReviewedForApprovedUse
    && !security.checkpointLicenseReviewedForApprovedUse
    && !security.privacyReviewApprovedForPrivateQualification
    && !security.tradeControlsReviewApprovedForPrivateQualification
    && !security.sourceMalwareScanPassed
    && !security.checkpointMalwareScanPassed
    && !security.sourceStaticSecurityReviewPassed
    && !security.checkpointWeightsOnlyLoadPassed
    && !security.checkpointTensorAndMetadataAllowlistPassed
    && !probe.exactSourceArchiveReread
    && !probe.exactPatchedSourceArchiveReread
    && !probe.exactCheckpointRereadBeforeAndAfter
    && !probe.exactDependencyWheelAndNativeClosureReread
    && !probe.sourcePatchApplicationReceiptReread
    && !probe.weightsOnlyCheckpointInspectionExecuted
    && !probe.fixedBuilderImportedFromPinnedSource
    && !probe.fixedBuilderCalledExactlyOnce
    && !probe.checkpointLoadedExactlyOnce
    && !probe.strictCheckpointLoadRequested
    && probe.missingCheckpointKeyCount === 0
    && probe.unexpectedCheckpointKeyCount === 0
    && probe.checkpointKeyCount === 0
    && probe.modelStateKeyCount === 0
    && !probe.checkpointAndModelKeySetsExact
    && !probe.startSessionAddPromptPropagateAndCloseExecuted
    && !probe.actualCudaModelInferenceExecuted
    && !probe.bfloat16AutocastExecuted
    && !probe.outputMaskShapeMatchedProbeFrames
    && !probe.outputObjectIdsMatchedProbePrompt
    && !probe.outputMasksWereCudaTensorsBeforeSerialization
    && probe.deterministicRepeatedProbeRunCount === 0
    && probe.deterministicOutputDigestSha256 === EMPTY_EVIDENCE_SHA256
    && !probe.deterministicOutputDigestMatchedEveryRun
    && !record.authority.securityLicenseAndCompatibilityQualified
    && !record.authority.privateImageBuildReviewEligible
  if (canonical ? !canonicalEvidence : !contractEvidence) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 source/checkpoint qualification is not admissible.',
  })
})

export const canonicalSam31SourceCheckpointQualificationSchema =
  qualificationWithoutHashSchema.extend({ qualificationHash: sha256 }).strict()
export type CanonicalSam31SourceCheckpointQualification = z.infer<
  typeof canonicalSam31SourceCheckpointQualificationSchema
>

export function compileCanonicalSam31SourceCheckpointQualification(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly observation: CanonicalSam31SourceCheckpointQualificationObservation
  readonly workerEvidence?:
    CanonicalSam31SourceCheckpointQualificationWorkerEvidence
}): CanonicalSam31SourceCheckpointQualification {
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  assertPlainSerializedData(input.observation,
    'sam3_1_source_checkpoint_qualification_observation')
  const observation = observationSchema.parse(input.observation)
  const canonical = observation.evidenceClass === 'canonical_private_reread'
  if (canonical) {
    if (!input.workerEvidence) {
      throw new Error(
        'SAM 3.1 canonical qualification requires fixed worker evidence.',
      )
    }
    const workerObservation =
      createCanonicalSam31SourceCheckpointQualificationObservation(
        input.workerEvidence,
      )
    if (
      sha256AuthorityValue(workerObservation) !==
        sha256AuthorityValue(observation)
    ) throw new Error(
      'SAM 3.1 qualification observation differs from fixed worker evidence.',
    )
  } else if (input.workerEvidence !== undefined) {
    throw new Error(
      'SAM 3.1 synthetic qualification cannot carry canonical worker evidence.',
    )
  }
  if (
    candidate.candidateHash !== ingest.candidateRef.candidateHash
    || candidate.schemaVersion !== ingest.candidateRef.schemaVersion
    || candidate.operationId !== ingest.operationId
    || observation.evidenceClass !== ingest.evidenceClass
  ) throw new Error('SAM 3.1 qualification crossed candidate or ingest.')
  const {
    evidenceClass,
    qualificationId,
    qualificationVersion,
    qualifiedAt,
    ...controlledObservation
  } = observation
  const payload = qualificationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
    source: 'canonical_sam3_1_source_checkpoint_qualification_owner',
    evidenceClass,
    status: canonical
      ? 'qualified_for_private_image_build'
      : 'contract_only',
    qualificationId,
    qualificationVersion,
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    officialArtifactPublicationRef: ingest.officialArtifactPublicationRef,
    ingestReceiptRef: {
      id: ingest.ingestReceiptId,
      version: ingest.ingestReceiptVersion,
      schemaVersion: ingest.schemaVersion,
      contentHash: `sha256:${ingest.ingestReceiptHash}`,
    },
    termsAcceptanceRef: ingest.termsAcceptanceRef,
    sourceArchive: {
      revision: ingest.sourceArchive.revision,
      artifactRef: ingest.sourceArchive.artifactRef,
      byteLength: ingest.sourceArchive.coordinate.byteLength,
      sha256: ingest.sourceArchive.coordinate.sha256,
      licenseRef: ingest.sourceArchive.licenseRef,
      securityReviewRef: ingest.sourceArchive.securityReviewRef,
      malwareScanRef: ingest.sourceArchive.malwareScanRef,
      gpuDecodePatchSha256: GPU_DECODE_PATCH_SHA256,
    },
    checkpoint: {
      repositoryRevision: ingest.checkpoint.revision,
      fileName: ingest.checkpoint.fileName,
      artifactRef: ingest.checkpoint.artifactRef,
      byteLength: ingest.checkpoint.coordinate.byteLength,
      sha256: ingest.checkpoint.coordinate.sha256,
      manifestRef: ingest.checkpoint.manifestRef,
      licenseRef: ingest.checkpoint.licenseRef,
      securityReviewRef: ingest.checkpoint.securityReviewRef,
      malwareScanRef: ingest.checkpoint.malwareScanRef,
    },
    controlledObservation,
    authority: {
      qualificationEvidenceOnly: true,
      securityLicenseAndCompatibilityQualified: canonical,
      privateImageBuildReviewEligible: canonical,
      imageBuildStarted: false,
      runtimeDispatchAuthorized: false,
      customerCreditsMutated: false,
      customerBillingAuthorityGranted: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    qualifiedAt,
  })
  return canonicalSam31SourceCheckpointQualificationSchema.parse({
    ...payload,
    qualificationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourceCheckpointQualification(
  value: unknown,
): CanonicalSam31SourceCheckpointQualification {
  assertPlainSerializedData(value, 'sam3_1_source_checkpoint_qualification')
  const parsed = canonicalSam31SourceCheckpointQualificationSchema.parse(value)
  const { qualificationHash, ...payload } = parsed
  if (qualificationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 source/checkpoint qualification hash is invalid.')
  }
  return parsed
}

export function canonicalSam31SourceCheckpointQualificationRef(
  value: unknown,
): {
  readonly id: string
  readonly version: 1
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION
  readonly contentHash: `sha256:${string}`
} {
  const qualification = assertCanonicalSam31SourceCheckpointQualification(
    value,
  )
  return Object.freeze({
    id: qualification.qualificationId,
    version: qualification.qualificationVersion,
    schemaVersion: qualification.schemaVersion,
    contentHash: `sha256:${qualification.qualificationHash}`,
  })
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
