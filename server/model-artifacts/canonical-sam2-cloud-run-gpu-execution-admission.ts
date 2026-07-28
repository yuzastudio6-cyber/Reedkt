import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  validateProfessionalToolOperationRequest,
} from '../tool-execution/professional-tool-operation-request-validator'
import {
  canonicalModelArtifactGpuBundleSchema,
} from './canonical-model-artifact-cloud-run-gpu-handoff'
import type {
  CanonicalModelArtifactGpuBundle,
  CanonicalModelArtifactGpuBundleArtifact,
  CanonicalModelArtifactGpuBundleRequirement,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import {
  CANONICAL_SAM2_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
  CANONICAL_SAM2_SUBJECT_PROMPT_PACKET_VERSION,
  type CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput,
  type CanonicalSam2CloudRunGpuExecutionAdmissionCandidate,
  type CanonicalSam2CloudRunGpuExecutionAdmissionCandidateInput,
  type CanonicalSam2OperationSettings,
  type CanonicalSam2SourceVideoExpectation,
  type CanonicalSam2SourceVideoExpectationInput,
  type CanonicalSam2SubjectPromptPacket,
  type CanonicalSam2SubjectPromptPacketInput,
} from './canonical-sam2-cloud-run-gpu-execution-admission-types'
import {
  assertCanonicalSam2GpuBundleRequirementProjection,
  assertCanonicalSam2ModelArtifactRequirementSet,
} from './canonical-sam2-model-artifact-requirements'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN = /^model-artifact-[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_SOURCE_BYTES = (4 * 1_024 * 1_024 * 1_024) - 65_536
const MAXIMUM_PROMPT_BYTES = 65_536

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))
const normalizedCoordinateSchema = z.number().finite().min(0).max(1)
  .refine(hasMaximumSixDecimals)
const positiveNormalizedExtentSchema =
  normalizedCoordinateSchema.refine((value) => value >= 0.001)

const boundingBoxSchema = z.object({
  x: normalizedCoordinateSchema,
  y: normalizedCoordinateSchema,
  width: positiveNormalizedExtentSchema,
  height: positiveNormalizedExtentSchema,
}).strict().superRefine((box, context) => {
  if (box.x + box.width > 1 || box.y + box.height > 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'SAM2 bounding box exceeds the normalized source frame.',
    })
  }
})

const pointSchema = z.object({
  x: normalizedCoordinateSchema,
  y: normalizedCoordinateSchema,
  label: z.enum(['foreground', 'background']),
}).strict()

const promptBaseSchema = z.object({
  promptPacketVersion: z.literal(
    CANONICAL_SAM2_SUBJECT_PROMPT_PACKET_VERSION,
  ),
  promptPacketClass: z.literal(
    'server_compiled_normalized_subject_selection',
  ),
  subjectSelectionId: safeIdSchema,
  sourceArtifactId: safeIdSchema,
  sourceArtifactSha256: digestSchema,
  sourceFrameIndex: z.number().int().nonnegative().max(17_999),
  sourceFrameWidth: z.number().int().min(16).max(8_192),
  sourceFrameHeight: z.number().int().min(16).max(8_192),
  coordinateSpace: z.literal('normalized_source_frame'),
  subjectCount: z.literal(1),
  approvedSubjectLabelIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  rawMediaIncluded: z.literal(false),
  promptDigestSha256: digestSchema,
})

const boxPromptSchema = promptBaseSchema.extend({
  promptMode: z.literal('box'),
  boundingBox: boundingBoxSchema,
  points: z.tuple([]),
}).strict()

const pointPromptSchema = promptBaseSchema.extend({
  promptMode: z.literal('points'),
  boundingBox: z.null(),
  points: z.array(pointSchema).min(1).max(32)
    .superRefine((points, context) => {
      if (!points.some((point) => point.label === 'foreground')) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SAM2 point prompts require a foreground point.',
        })
      }
      const identities = points.map(
        (point) => `${point.x}:${point.y}:${point.label}`,
      )
      if (new Set(identities).size !== identities.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SAM2 point prompts must be unique.',
        })
      }
    }),
}).strict()

const subjectPromptSchema = z.discriminatedUnion('promptMode', [
  boxPromptSchema,
  pointPromptSchema,
])

const sourceSchema = z.object({
  artifactId: safeIdSchema,
  artifactKind: z.literal('video'),
  contentType: z.literal('video/mp4'),
  contentSha256: digestSchema,
  byteLength: z.number().int().positive().max(MAXIMUM_SOURCE_BYTES),
  width: z.number().int().min(16).max(8_192),
  height: z.number().int().min(16).max(8_192),
  frameCount: z.number().int().min(2).max(18_000),
  fpsNumerator: z.number().int().positive().max(240_000),
  fpsDenominator: z.number().int().positive().max(10_000),
  durationMilliseconds: z.number().int().positive()
    .max(600_000),
  dependencyQaEvaluationId: safeIdSchema,
  dependencyReconciliationId: safeIdSchema,
  sourceExpectationDigestSha256: digestSchema,
}).strict()

const settingsSchema = z.object({
  confidenceThreshold: z.number().finite().min(0).max(1),
  maximumSubjects: z.literal(1),
  frameStride: z.number().int().min(1).max(30),
  edgeRefinementProfileId: safeIdSchema.optional(),
  preserveContactObjects: z.boolean(),
  subjectPromptProfile: z.literal(
    'normalized_box_or_points_v1',
  ),
  subjectPromptSha256: digestSchema,
}).strict()

const outputSchema = z.tuple([
  z.object({
    canonicalOrder: z.literal(0),
    artifactKind: z.literal('mask_sequence'),
    contentType: z.literal('video/x-matroska'),
    encodingProfile: z.literal(
      'gray8_ffv1_matroska_mask_sequence_v1',
    ),
    frameCountMustMatchSource: z.literal(true),
    dimensionsMustMatchSource: z.literal(true),
    frameTimingMustMatchSource: z.literal(true),
    privateArtifactRequired: z.literal(true),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(1),
    artifactKind: z.literal('analysis_report'),
    contentType: z.literal('application/json'),
    encodingProfile: z.literal(
      'sam2_tracking_analysis_report_json_v1',
    ),
    privateArtifactRequired: z.literal(true),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(2),
    artifactKind: z.literal('qa_report'),
    contentType: z.literal('application/json'),
    encodingProfile: z.literal(
      'sam2_mask_qa_measurement_report_json_v1',
    ),
    privateArtifactRequired: z.literal(true),
  }).strict(),
])

const boundarySchema = z.object({
  candidateOnly: z.literal(true),
  canonicalOperationArtifactSetVerified: z.literal(false),
  freshRepositoryByteRehashRequired: z.literal(true),
  approvedPackageRereadRequired: z.literal(true),
  approvedSnapshotRereadRequired: z.literal(true),
  workerLeaseRereadRequired: z.literal(true),
  privateSourceArtifactReadVerified: z.literal(false),
  privatePromptArtifactReadVerified: z.literal(false),
  cloudRunReadOnlyModelMountVerified: z.literal(false),
  cloudRunL4RuntimeImageVerified: z.literal(false),
  cloudRunL4CudaBenchmarkVerified: z.literal(false),
  sam2SourceInstallVerified: z.literal(false),
  sam2CheckpointLoadVerified: z.literal(false),
  sam2InferenceVerified: z.literal(false),
  privateMaskOutputArtifactVerified: z.literal(false),
  maskQaVerified: z.literal(false),
  paidProductionOwnerApproval: z.literal(false),
  callerBytesAccepted: z.literal(false),
  callerPathAccepted: z.literal(false),
  callerUrlAccepted: z.literal(false),
  rawChatAccepted: z.literal(false),
  arbitraryPromptAccepted: z.literal(false),
  arbitraryModelAccepted: z.literal(false),
  cloudDispatchAuthorized: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueMutationAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  customerCostAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const candidateSchema = z.object({
  admissionVersion: z.literal(
    CANONICAL_SAM2_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
  ),
  admissionClass: z.literal(
    'controlled_non_executable_sam2_gpu_operation_preflight',
  ),
  admissionId: z.string().regex(
    /^sam2_gpu_preflight_[a-f0-9]{32}$/u,
  ),
  identity: z.object({
    approvedToolId: z.literal('sam2'),
    approvedOperationId: z.literal(
      'tool.sam2.segment_and_track_subject.v1',
    ),
    requirementSetDigestSha256: digestSchema,
    requirementProjectionDigestSha256: digestSchema,
    gpuBundleDigestSha256: digestSchema,
    gpuBundleRequirementsDigestSha256: digestSchema,
    dispatchIntentId: safeIdSchema,
    dispatchBindingHash: digestSchema,
    attemptPlanHash: digestSchema,
    approvedSnapshotId: safeIdSchema,
    approvedSnapshotHash: digestSchema,
    workItemId: safeIdSchema,
    workItemHash: digestSchema,
    creditEstimateId: safeIdSchema,
    creditReservationId: safeIdSchema,
    workerLeaseId: safeIdSchema,
    idempotencyKey: safeIdSchema,
    operationRequestDigestSha256: digestSchema,
  }).strict(),
  modelArtifactBinding: z.object({
    artifactCount: z.literal(1),
    slotId: z.literal('sam2_checkpoint'),
    artifactRecordId: z.string().regex(ARTIFACT_RECORD_PATTERN),
    artifactId: z.literal(
      'meta-sam2.1-hiera-small-checkpoint',
    ),
    revision: z.literal(
      'ee5bba1d82bb8749febdf90f45e84b687142ba03',
    ),
    modelFamily: z.literal('sam2.1-hiera-small'),
    byteLength: z.literal(184_416_285),
    contentSha256: z.literal(
      '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
    ),
    consumerScope: z.literal('sam2.private-inference'),
    executionTarget: z.literal('google_cloud_run_gpu'),
    cloudRunAccelerator: z.literal('nvidia_l4'),
    modelAccelerator: z.literal('cuda'),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  source: sourceSchema,
  subjectPromptArtifactBinding: z.object({
    artifactId: safeIdSchema,
    artifactKind: z.literal('json_data'),
    contentType: z.literal('application/json'),
    contentSha256: digestSchema,
    byteLength: z.number().int().positive()
      .max(MAXIMUM_PROMPT_BYTES),
    canonicalJsonEncoding: z.literal(
      'stable_authority_json_utf8_no_bom',
    ),
  }).strict(),
  subjectPrompt: subjectPromptSchema,
  settings: settingsSchema,
  expectedOutputs: outputSchema,
  requiredQaGates: z.tuple([
    z.literal('mask_edge_quality'),
    z.literal('mask_temporal_stability'),
    z.literal('mask_subject_coverage'),
  ]),
  summary: z.object({
    exactModelArtifactIdentityMatched: z.literal(true),
    exactCloudRunGpuAttemptIdentityMatched: z.literal(true),
    exactPrivateSourceBindingMatched: z.literal(true),
    exactStructuredSubjectPromptBindingMatched: z.literal(true),
    exactOperationSettingsMatched: z.literal(true),
    exactOutputAndQaContractDeclared: z.literal(true),
    subjectCount: z.literal(1),
    sourceFrameCount: z.number().int().min(2).max(18_000),
    outputFrameCount: z.number().int().min(2).max(18_000),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  blockers: z.array(safeIdSchema).min(1).max(32)
    .refine((values) => new Set(values).size === values.length)
    .refine((values) => values.every(
      (value, index) => index === 0 || values[index - 1]! < value,
    )),
  boundaries: boundarySchema,
  admissionDigestSha256: digestSchema,
}).strict()

const BLOCKERS = [
  'approved_package_operation_input_reread_required',
  'cloud_run_gpu_job_deployment_not_verified',
  'cloud_run_l4_cuda_benchmark_not_run',
  'cloud_run_read_only_model_mount_not_verified',
  'model_artifact_fresh_repository_verification_required',
  'private_source_and_prompt_artifact_read_not_verified',
  'sam2_gpu_runtime_checkpoint_load_not_verified',
  'sam2_gpu_runtime_source_install_not_verified',
  'sam2_mask_artifact_write_and_qa_not_verified',
  'worker_service_identity_and_iam_not_verified',
] as const

const BOUNDARIES = {
  candidateOnly: true as const,
  canonicalOperationArtifactSetVerified: false as const,
  freshRepositoryByteRehashRequired: true as const,
  approvedPackageRereadRequired: true as const,
  approvedSnapshotRereadRequired: true as const,
  workerLeaseRereadRequired: true as const,
  privateSourceArtifactReadVerified: false as const,
  privatePromptArtifactReadVerified: false as const,
  cloudRunReadOnlyModelMountVerified: false as const,
  cloudRunL4RuntimeImageVerified: false as const,
  cloudRunL4CudaBenchmarkVerified: false as const,
  sam2SourceInstallVerified: false as const,
  sam2CheckpointLoadVerified: false as const,
  sam2InferenceVerified: false as const,
  privateMaskOutputArtifactVerified: false as const,
  maskQaVerified: false as const,
  paidProductionOwnerApproval: false as const,
  callerBytesAccepted: false as const,
  callerPathAccepted: false as const,
  callerUrlAccepted: false as const,
  rawChatAccepted: false as const,
  arbitraryPromptAccepted: false as const,
  arbitraryModelAccepted: false as const,
  cloudDispatchAuthorized: false as const,
  modelInferenceAuthority: false as const,
  providerAuthority: false as const,
  toolRegistryAuthority: false as const,
  workGraphAuthority: false as const,
  queueMutationAuthority: false as const,
  assetManifestAuthority: false as const,
  customerCostAuthority: false as const,
  approvalAuthority: false as const,
  snapshotAuthority: false as const,
  renderAuthority: false as const,
  runtimeAuthority: false as const,
  productionReady: false as const,
}

const EXPECTED_OUTPUTS = [
  {
    canonicalOrder: 0 as const,
    artifactKind: 'mask_sequence' as const,
    contentType: 'video/x-matroska' as const,
    encodingProfile:
      'gray8_ffv1_matroska_mask_sequence_v1' as const,
    frameCountMustMatchSource: true as const,
    dimensionsMustMatchSource: true as const,
    frameTimingMustMatchSource: true as const,
    privateArtifactRequired: true as const,
  },
  {
    canonicalOrder: 1 as const,
    artifactKind: 'analysis_report' as const,
    contentType: 'application/json' as const,
    encodingProfile:
      'sam2_tracking_analysis_report_json_v1' as const,
    privateArtifactRequired: true as const,
  },
  {
    canonicalOrder: 2 as const,
    artifactKind: 'qa_report' as const,
    contentType: 'application/json' as const,
    encodingProfile:
      'sam2_mask_qa_measurement_report_json_v1' as const,
    privateArtifactRequired: true as const,
  },
] as const

const REQUIRED_QA_GATES = [
  'mask_edge_quality',
  'mask_temporal_stability',
  'mask_subject_coverage',
] as const

export function createCanonicalSam2SubjectPromptPacket(
  input: CanonicalSam2SubjectPromptPacketInput,
): CanonicalSam2SubjectPromptPacket {
  const common = {
    promptPacketVersion:
      CANONICAL_SAM2_SUBJECT_PROMPT_PACKET_VERSION,
    promptPacketClass:
      'server_compiled_normalized_subject_selection' as const,
    subjectSelectionId: input.subjectSelectionId,
    sourceArtifactId: input.sourceArtifactId,
    sourceArtifactSha256: input.sourceArtifactSha256,
    sourceFrameIndex: input.sourceFrameIndex,
    sourceFrameWidth: input.sourceFrameWidth,
    sourceFrameHeight: input.sourceFrameHeight,
    coordinateSpace: 'normalized_source_frame' as const,
    subjectCount: 1 as const,
    approvedSubjectLabelIncluded: false as const,
    rawChatIncluded: false as const,
    rawMediaIncluded: false as const,
  }
  const draft = input.promptMode === 'box'
    ? {
        ...common,
        promptMode: 'box' as const,
        boundingBox: input.boundingBox,
        points: [] as const,
      }
    : {
        ...common,
        promptMode: 'points' as const,
        boundingBox: null,
        points: input.points,
      }
  return assertCanonicalSam2SubjectPromptPacket({
    ...draft,
    promptDigestSha256: sha256AuthorityValue(draft),
  })
}

export function assertCanonicalSam2SubjectPromptPacket(
  value: unknown,
): CanonicalSam2SubjectPromptPacket {
  const parsed = subjectPromptSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('sam2_subject_prompt_packet_invalid')
  }
  const { promptDigestSha256, ...draft } = parsed.data
  if (promptDigestSha256 !== sha256AuthorityValue(draft)) {
    throw blocked('sam2_subject_prompt_packet_digest_mismatch')
  }
  return deepFreeze(parsed.data) as CanonicalSam2SubjectPromptPacket
}

export function createCanonicalSam2CloudRunGpuExecutionAdmissionCandidate(
  input: CanonicalSam2CloudRunGpuExecutionAdmissionCandidateInput,
): CanonicalSam2CloudRunGpuExecutionAdmissionCandidate {
  const requirementSet =
    assertCanonicalSam2ModelArtifactRequirementSet(
      input.requirementSet,
    )
  const projection =
    assertCanonicalSam2GpuBundleRequirementProjection(
      input.requirementProjection,
    )
  const gpuBundle = assertExactSam2GpuBundle(input.gpuBundle)
  assertParentLineage({
    requirementSet,
    projection,
    gpuBundle,
  })
  const prompt =
    assertCanonicalSam2SubjectPromptPacket(input.subjectPrompt)
  const source = createSourceExpectation(input.source)
  assertPromptMatchesSource(prompt, source)
  const promptArtifact = createPromptArtifactBinding({
    artifactId: input.subjectPromptArtifactId,
    byteLength: input.subjectPromptArtifactByteLength,
    prompt,
  })
  const operation = parseExactOperationRequest({
    operationRequest: input.operationRequest,
    source,
    prompt,
    promptArtifact,
    gpuBundle,
  })
  const artifact = gpuBundle.artifacts[0]!
  const identity = {
    approvedToolId: 'sam2' as const,
    approvedOperationId:
      'tool.sam2.segment_and_track_subject.v1' as const,
    requirementSetDigestSha256:
      requirementSet.requirementSetDigestSha256,
    requirementProjectionDigestSha256:
      projection.projectionDigestSha256,
    gpuBundleDigestSha256: gpuBundle.bundleDigestSha256,
    gpuBundleRequirementsDigestSha256:
      gpuBundle.requirementsDigestSha256,
    dispatchIntentId: gpuBundle.identity.dispatchIntentId,
    dispatchBindingHash: gpuBundle.identity.dispatchBindingHash,
    attemptPlanHash: gpuBundle.identity.attemptPlanHash,
    approvedSnapshotId: operation.approvedSnapshotId,
    approvedSnapshotHash: operation.approvedSnapshotHash,
    workItemId: operation.workItemId,
    workItemHash: operation.workItemHash,
    creditEstimateId: operation.creditEstimateId,
    creditReservationId: operation.creditReservationId,
    workerLeaseId: operation.workerLeaseId,
    idempotencyKey: operation.idempotencyKey,
    operationRequestDigestSha256:
      sha256AuthorityValue(input.operationRequest),
  }
  const modelArtifactBinding = {
    artifactCount: 1 as const,
    slotId: 'sam2_checkpoint' as const,
    artifactRecordId: artifact.locator.artifactRecordId,
    artifactId:
      'meta-sam2.1-hiera-small-checkpoint' as const,
    revision:
      'ee5bba1d82bb8749febdf90f45e84b687142ba03' as const,
    modelFamily: 'sam2.1-hiera-small' as const,
    byteLength: 184_416_285 as const,
    contentSha256:
      '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38' as const,
    consumerScope: 'sam2.private-inference' as const,
    executionTarget: 'google_cloud_run_gpu' as const,
    cloudRunAccelerator: 'nvidia_l4' as const,
    modelAccelerator: 'cuda' as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
  }
  const summary = {
    exactModelArtifactIdentityMatched: true as const,
    exactCloudRunGpuAttemptIdentityMatched: true as const,
    exactPrivateSourceBindingMatched: true as const,
    exactStructuredSubjectPromptBindingMatched: true as const,
    exactOperationSettingsMatched: true as const,
    exactOutputAndQaContractDeclared: true as const,
    subjectCount: 1 as const,
    sourceFrameCount: source.frameCount,
    outputFrameCount: source.frameCount,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
  }
  const admissionId = admissionIdFor({
    identity,
    sourceExpectationDigestSha256:
      source.sourceExpectationDigestSha256,
    promptContentSha256: promptArtifact.contentSha256,
  })
  const draft = {
    admissionVersion:
      CANONICAL_SAM2_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
    admissionClass:
      'controlled_non_executable_sam2_gpu_operation_preflight' as const,
    admissionId,
    identity,
    modelArtifactBinding,
    source,
    subjectPromptArtifactBinding: promptArtifact,
    subjectPrompt: prompt,
    settings: operation.settings,
    expectedOutputs: EXPECTED_OUTPUTS,
    requiredQaGates: REQUIRED_QA_GATES,
    summary,
    blockers: BLOCKERS,
    boundaries: BOUNDARIES,
  }
  return assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: {
      ...draft,
      admissionDigestSha256: sha256AuthorityValue(draft),
    },
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source: input.source,
    operationRequest: input.operationRequest,
  })
}

export function assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate(
  input: CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput,
): CanonicalSam2CloudRunGpuExecutionAdmissionCandidate {
  const parsed = candidateSchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalid('sam2_gpu_execution_admission_candidate_invalid')
  }
  const candidate = parsed.data
  const { admissionDigestSha256, ...draft } = candidate
  if (admissionDigestSha256 !== sha256AuthorityValue(draft)) {
    throw blocked('sam2_gpu_execution_admission_digest_mismatch')
  }
  const requirementSet =
    assertCanonicalSam2ModelArtifactRequirementSet(
      input.requirementSet,
    )
  const projection =
    assertCanonicalSam2GpuBundleRequirementProjection(
      input.requirementProjection,
    )
  const gpuBundle = assertExactSam2GpuBundle(input.gpuBundle)
  assertParentLineage({
    requirementSet,
    projection,
    gpuBundle,
  })
  const source = createSourceExpectation(input.source)
  if (
    stableAuthorityStringify(candidate.source)
      !== stableAuthorityStringify(source)
  ) {
    throw blocked('sam2_source_video_expectation_lineage_mismatch')
  }
  const prompt =
    assertCanonicalSam2SubjectPromptPacket(candidate.subjectPrompt)
  assertPromptMatchesSource(prompt, source)
  const operation = parseExactOperationRequest({
    operationRequest: input.operationRequest,
    source,
    prompt,
    promptArtifact: candidate.subjectPromptArtifactBinding,
    gpuBundle,
  })
  assertCandidateDerivedFields({
    candidate,
    requirementSetDigestSha256:
      requirementSet.requirementSetDigestSha256,
    projectionDigestSha256: projection.projectionDigestSha256,
    gpuBundle,
    operation,
    operationRequestDigestSha256:
      sha256AuthorityValue(input.operationRequest),
  })
  return deepFreeze(
    candidate,
  ) as CanonicalSam2CloudRunGpuExecutionAdmissionCandidate
}

function createSourceExpectation(
  input: CanonicalSam2SourceVideoExpectationInput,
): CanonicalSam2SourceVideoExpectation {
  const draft = {
    artifactId: input.artifactId,
    artifactKind: 'video' as const,
    contentType: 'video/mp4' as const,
    contentSha256: input.contentSha256,
    byteLength: input.byteLength,
    width: input.width,
    height: input.height,
    frameCount: input.frameCount,
    fpsNumerator: input.fpsNumerator,
    fpsDenominator: input.fpsDenominator,
    durationMilliseconds: input.durationMilliseconds,
    dependencyQaEvaluationId: input.dependencyQaEvaluationId,
    dependencyReconciliationId:
      input.dependencyReconciliationId,
  }
  return assertSourceExpectation({
    ...draft,
    sourceExpectationDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function assertSourceExpectation(
  value: unknown,
): CanonicalSam2SourceVideoExpectation {
  const parsed = sourceSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('sam2_source_video_expectation_invalid')
  }
  const {
    sourceExpectationDigestSha256,
    ...draft
  } = parsed.data
  if (
    sourceExpectationDigestSha256
      !== sha256AuthorityValue(draft)
  ) {
    throw blocked('sam2_source_video_expectation_digest_mismatch')
  }
  const expectedDurationMilliseconds = Math.round(
    parsed.data.frameCount * 1_000
      * parsed.data.fpsDenominator
      / parsed.data.fpsNumerator,
  )
  if (
    parsed.data.durationMilliseconds
      !== expectedDurationMilliseconds
  ) {
    throw blocked('sam2_source_video_duration_mismatch')
  }
  return deepFreeze(
    parsed.data,
  ) as CanonicalSam2SourceVideoExpectation
}

function createPromptArtifactBinding(input: {
  artifactId: string
  byteLength: number
  prompt: CanonicalSam2SubjectPromptPacket
}): CanonicalSam2CloudRunGpuExecutionAdmissionCandidate[
  'subjectPromptArtifactBinding'
] {
  const canonicalJson =
    stableAuthorityStringify(input.prompt)
  const contentSha256 = sha256AuthorityValue(input.prompt)
  const byteLength = Buffer.byteLength(canonicalJson, 'utf8')
  if (
    input.byteLength !== byteLength
    || byteLength <= 0
    || byteLength > MAXIMUM_PROMPT_BYTES
  ) {
    throw blocked('sam2_subject_prompt_artifact_length_mismatch')
  }
  return {
    artifactId: parseSafeId(
      input.artifactId,
      'sam2_subject_prompt_artifact_id_invalid',
    ),
    artifactKind: 'json_data',
    contentType: 'application/json',
    contentSha256,
    byteLength,
    canonicalJsonEncoding:
      'stable_authority_json_utf8_no_bom',
  }
}

function parseExactOperationRequest(input: {
  operationRequest: unknown
  source: CanonicalSam2SourceVideoExpectation
  prompt: CanonicalSam2SubjectPromptPacket
  promptArtifact:
    CanonicalSam2CloudRunGpuExecutionAdmissionCandidate[
      'subjectPromptArtifactBinding'
    ]
  gpuBundle: CanonicalModelArtifactGpuBundle
}): {
  approvedSnapshotId: string
  approvedSnapshotHash: string
  workItemId: string
  workItemHash: string
  creditEstimateId: string
  creditReservationId: string
  workerLeaseId: string
  idempotencyKey: string
  settings: CanonicalSam2OperationSettings
} {
  const validation = validateProfessionalToolOperationRequest(
    'sam2',
    input.operationRequest,
  )
  if (!validation.ok) {
    throw invalid(
      'sam2_professional_operation_request_invalid',
    )
  }
  const request = validation.request
  if (
    request.modelManifestId
      !== input.gpuBundle.artifacts[0]!.locator.manifestDigestSha256
  ) {
    throw blocked('sam2_operation_model_manifest_mismatch')
  }
  if (!Array.isArray(request.artifactBindings)) {
    throw invalid('sam2_operation_artifact_bindings_invalid')
  }
  const bindings = request.artifactBindings as Array<
    Record<string, unknown>
  >
  if (bindings.length !== 2) {
    throw blocked('sam2_operation_requires_source_and_prompt_artifacts')
  }
  const sourceBindings = bindings.filter(
    (binding) => binding.kind === 'video',
  )
  const promptBindings = bindings.filter(
    (binding) => binding.kind === 'json_data',
  )
  if (
    sourceBindings.length !== 1
    || promptBindings.length !== 1
    || !bindingMatches(sourceBindings[0]!, {
      artifactId: input.source.artifactId,
      sha256: input.source.contentSha256,
      byteLength: input.source.byteLength,
    })
    || !bindingMatches(promptBindings[0]!, {
      artifactId: input.promptArtifact.artifactId,
      sha256: input.promptArtifact.contentSha256,
      byteLength: input.promptArtifact.byteLength,
    })
  ) {
    throw blocked('sam2_operation_artifact_binding_mismatch')
  }
  const settingsResult = settingsSchema.safeParse(request.settings)
  if (!settingsResult.success) {
    throw invalid('sam2_operation_settings_invalid')
  }
  if (
    settingsResult.data.subjectPromptSha256
      !== input.promptArtifact.contentSha256
    || input.prompt.promptDigestSha256
      !== sha256AuthorityValue(withoutPromptDigest(input.prompt))
  ) {
    throw blocked('sam2_operation_subject_prompt_digest_mismatch')
  }
  if (
    input.source.byteLength + input.promptArtifact.byteLength
      > validation.spec.resourceCeilings.maxInputBytes
  ) {
    throw blocked('sam2_operation_input_byte_limit_exceeded')
  }
  return {
    approvedSnapshotId:
      String(request.approvedSnapshotId),
    approvedSnapshotHash:
      String(request.approvedSnapshotHash),
    workItemId: String(request.workItemId),
    workItemHash: String(request.workItemHash),
    creditEstimateId: String(request.creditEstimateId),
    creditReservationId:
      String(request.creditReservationId),
    workerLeaseId: String(request.workerLeaseId),
    idempotencyKey: String(request.idempotencyKey),
    settings:
      deepFreeze(settingsResult.data) as CanonicalSam2OperationSettings,
  }
}

function assertExactSam2GpuBundle(
  value: unknown,
): CanonicalModelArtifactGpuBundle {
  const parsed = canonicalModelArtifactGpuBundleSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('sam2_gpu_bundle_invalid')
  }
  const bundle = parsed.data
  const { bundleDigestSha256, ...draft } = bundle
  if (
    bundleDigestSha256 !== sha256AuthorityValue(draft)
    || bundle.consumerScope !== 'sam2.private-inference'
    || bundle.identity.approvedToolId !== 'sam2'
    || bundle.identity.approvedToolOperationId
      !== 'tool.sam2.segment_and_track_subject.v1'
    || bundle.artifacts.length !== 1
    || bundle.summary.artifactCount !== 1
    || bundle.summary.totalByteLength !== 184_416_285
    || bundle.execution.executionTarget
      !== 'google_cloud_run_gpu'
    || bundle.execution.cloudRunAccelerator !== 'nvidia_l4'
    || bundle.execution.modelAccelerator !== 'cuda'
    || bundle.summary.cpuFallbackAllowed !== false
    || bundle.summary.runtimeDownloadAllowed !== false
    || bundle.summary.networkFetchAllowed !== false
  ) {
    throw blocked('sam2_gpu_bundle_identity_mismatch')
  }
  const artifact = bundle.artifacts[0]!
  const requirement = requirementProjection(artifact)
  const { artifactBindingDigestSha256, ...artifactDraft } = artifact
  const requiredBundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity: bundle.identity,
      consumerScope: bundle.consumerScope,
      requirementsDigestSha256:
        bundle.requirementsDigestSha256,
    }).slice(0, 32)}`
  if (
    artifact.canonicalOrder !== 0
    || artifact.slotId !== 'sam2_checkpoint'
    || artifact.artifactId
      !== 'meta-sam2.1-hiera-small-checkpoint'
    || artifact.revision
      !== 'ee5bba1d82bb8749febdf90f45e84b687142ba03'
    || artifact.artifactFormat !== 'pytorch_checkpoint'
    || artifact.artifactRole
      !== 'sam2-video-segmentation-checkpoint'
    || artifact.modelFamily !== 'sam2.1-hiera-small'
    || artifact.byteLength !== 184_416_285
    || artifact.contentSha256
      !== '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38'
    || artifact.requiredExecutionTarget
      !== 'google_cloud_run_gpu'
    || artifact.accelerator !== 'cuda'
    || artifact.cpuFallbackAllowed !== false
    || artifact.runtimeDownloadAllowed !== false
    || artifact.networkFetchAllowed !== false
    || artifactBindingDigestSha256
      !== sha256AuthorityValue(artifactDraft)
    || bundle.requirementsDigestSha256
      !== sha256AuthorityValue([requirement])
    || bundle.bundleId !== requiredBundleId
  ) {
    throw blocked('sam2_gpu_bundle_artifact_mismatch')
  }
  return deepFreeze(bundle) as CanonicalModelArtifactGpuBundle
}

function assertParentLineage(input: {
  requirementSet: ReturnType<
    typeof assertCanonicalSam2ModelArtifactRequirementSet
  >
  projection: ReturnType<
    typeof assertCanonicalSam2GpuBundleRequirementProjection
  >
  gpuBundle: CanonicalModelArtifactGpuBundle
}): void {
  const projected = input.projection.requirements[0]
  const bundled = requirementProjection(input.gpuBundle.artifacts[0]!)
  if (
    input.projection.requirementSetDigestSha256
      !== input.requirementSet.requirementSetDigestSha256
    || input.projection.approvedToolId
      !== input.gpuBundle.identity.approvedToolId
    || input.projection.approvedOperationId
      !== input.gpuBundle.identity.approvedToolOperationId
    || input.projection.consumerScope
      !== input.gpuBundle.consumerScope
    || stableAuthorityStringify(projected)
      !== stableAuthorityStringify(bundled)
  ) {
    throw blocked('sam2_gpu_execution_parent_lineage_mismatch')
  }
}

function assertPromptMatchesSource(
  prompt: CanonicalSam2SubjectPromptPacket,
  source: CanonicalSam2SourceVideoExpectation,
): void {
  if (
    prompt.sourceArtifactId !== source.artifactId
    || prompt.sourceArtifactSha256 !== source.contentSha256
    || prompt.sourceFrameIndex >= source.frameCount
    || prompt.sourceFrameWidth !== source.width
    || prompt.sourceFrameHeight !== source.height
  ) {
    throw blocked('sam2_subject_prompt_source_mismatch')
  }
}

function assertCandidateDerivedFields(input: {
  candidate: z.infer<typeof candidateSchema>
  requirementSetDigestSha256: string
  projectionDigestSha256: string
  gpuBundle: CanonicalModelArtifactGpuBundle
  operation: ReturnType<typeof parseExactOperationRequest>
  operationRequestDigestSha256: string
}): void {
  const { candidate, gpuBundle, operation } = input
  const artifact = gpuBundle.artifacts[0]!
  const promptContentSha256 =
    sha256AuthorityValue(candidate.subjectPrompt)
  const expectedAdmissionId = admissionIdFor({
    identity: candidate.identity,
    sourceExpectationDigestSha256:
      candidate.source.sourceExpectationDigestSha256,
    promptContentSha256,
  })
  if (
    candidate.identity.requirementSetDigestSha256
      !== input.requirementSetDigestSha256
    || candidate.identity.requirementProjectionDigestSha256
      !== input.projectionDigestSha256
    || candidate.identity.gpuBundleDigestSha256
      !== gpuBundle.bundleDigestSha256
    || candidate.identity.gpuBundleRequirementsDigestSha256
      !== gpuBundle.requirementsDigestSha256
    || candidate.identity.dispatchIntentId
      !== gpuBundle.identity.dispatchIntentId
    || candidate.identity.dispatchBindingHash
      !== gpuBundle.identity.dispatchBindingHash
    || candidate.identity.attemptPlanHash
      !== gpuBundle.identity.attemptPlanHash
    || candidate.identity.approvedSnapshotId
      !== operation.approvedSnapshotId
    || candidate.identity.approvedSnapshotHash
      !== operation.approvedSnapshotHash
    || candidate.identity.workItemId
      !== operation.workItemId
    || candidate.identity.workItemHash
      !== operation.workItemHash
    || candidate.identity.creditEstimateId
      !== operation.creditEstimateId
    || candidate.identity.creditReservationId
      !== operation.creditReservationId
    || candidate.identity.workerLeaseId
      !== operation.workerLeaseId
    || candidate.identity.idempotencyKey
      !== operation.idempotencyKey
    || candidate.identity.operationRequestDigestSha256
      !== input.operationRequestDigestSha256
    || candidate.modelArtifactBinding.artifactRecordId
      !== artifact.locator.artifactRecordId
    || candidate.subjectPromptArtifactBinding.contentSha256
      !== promptContentSha256
    || candidate.subjectPromptArtifactBinding.byteLength
      !== Buffer.byteLength(
        stableAuthorityStringify(candidate.subjectPrompt),
        'utf8',
      )
    || candidate.settings.subjectPromptSha256
      !== promptContentSha256
    || stableAuthorityStringify(candidate.settings)
      !== stableAuthorityStringify(operation.settings)
    || candidate.summary.sourceFrameCount
      !== candidate.source.frameCount
    || candidate.summary.outputFrameCount
      !== candidate.source.frameCount
    || candidate.admissionId !== expectedAdmissionId
    || stableAuthorityStringify(candidate.blockers)
      !== stableAuthorityStringify(BLOCKERS)
    || stableAuthorityStringify(candidate.boundaries)
      !== stableAuthorityStringify(BOUNDARIES)
    || stableAuthorityStringify(candidate.expectedOutputs)
      !== stableAuthorityStringify(EXPECTED_OUTPUTS)
    || stableAuthorityStringify(candidate.requiredQaGates)
      !== stableAuthorityStringify(REQUIRED_QA_GATES)
  ) {
    throw blocked('sam2_gpu_execution_admission_derived_fields_invalid')
  }
}

function requirementProjection(
  artifact: CanonicalModelArtifactGpuBundleArtifact,
): CanonicalModelArtifactGpuBundleRequirement {
  return {
    canonicalOrder: artifact.canonicalOrder,
    slotId: artifact.slotId,
    locator: artifact.locator,
    expectedArtifactId: artifact.artifactId,
    expectedRevision: artifact.revision,
    expectedArtifactFormat: artifact.artifactFormat,
    expectedArtifactRole: artifact.artifactRole,
    expectedModelFamily: artifact.modelFamily,
    expectedByteLength: artifact.byteLength,
    expectedContentSha256: artifact.contentSha256,
    required: true,
  }
}

function bindingMatches(
  value: Record<string, unknown>,
  expected: {
    artifactId: string
    sha256: string
    byteLength: number
  },
): boolean {
  return value.artifactId === expected.artifactId
    && value.sha256 === expected.sha256
    && value.byteLength === expected.byteLength
}

function withoutPromptDigest(
  prompt: CanonicalSam2SubjectPromptPacket,
): Omit<CanonicalSam2SubjectPromptPacket, 'promptDigestSha256'> {
  const { promptDigestSha256: _promptDigestSha256, ...draft } =
    prompt
  void _promptDigestSha256
  return draft
}

function admissionIdFor(input: {
  identity:
    CanonicalSam2CloudRunGpuExecutionAdmissionCandidate['identity']
  sourceExpectationDigestSha256: string
  promptContentSha256: string
}): string {
  return `sam2_gpu_preflight_${
    sha256AuthorityValue(input).slice(0, 32)
  }`
}

function parseSafeId(value: unknown, code: string): string {
  const parsed = safeIdSchema.safeParse(value)
  if (!parsed.success) throw invalid(code)
  return parsed.data
}

function hasMaximumSixDecimals(value: number): boolean {
  return Math.abs(
    Math.round(value * 1_000_000) / 1_000_000 - value,
  ) <= Number.EPSILON
}

function invalid(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 400)
}

function blocked(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 409)
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}
