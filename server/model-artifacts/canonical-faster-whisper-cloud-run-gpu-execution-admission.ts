import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  CANONICAL_PRIVATE_E2E_TOOL_IDS,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-registry'
import {
  canonicalModelArtifactGpuBundleSchema,
} from './canonical-model-artifact-cloud-run-gpu-handoff'
import type {
  CanonicalModelArtifactGpuBundle,
  CanonicalModelArtifactGpuBundleArtifact,
  CanonicalModelArtifactGpuBundleRequirement,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import {
  CANONICAL_FASTER_WHISPER_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
  type CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput,
  type CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate,
  type CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidateInput,
  type CanonicalFasterWhisperOperationSettings,
  type CanonicalFasterWhisperSourceAudioExpectation,
  type CanonicalFasterWhisperSourceAudioExpectationInput,
} from './canonical-faster-whisper-cloud-run-gpu-execution-admission-types'
import {
  assertCanonicalFasterWhisperGpuBundleRequirementProjection,
  assertCanonicalFasterWhisperModelArtifactRequirementSet,
  getCanonicalFasterWhisperModelArtifactRequirementSet,
} from './canonical-faster-whisper-model-artifact-requirements'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN = /^model-artifact-[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_AUDIO_BYTES = 2 * 1_024 * 1_024 * 1_024
const MAXIMUM_AUDIO_DURATION_MILLISECONDS = 7_200_000

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const sourceSchema = z.object({
  artifactId: safeIdSchema,
  artifactKind: z.literal('audio'),
  contentType: z.literal('audio/wav'),
  contentSha256: digestSchema,
  byteLength: z.number().int().positive().max(MAXIMUM_AUDIO_BYTES),
  durationMilliseconds: z.number().int().positive()
    .max(MAXIMUM_AUDIO_DURATION_MILLISECONDS),
  sampleRateHz: z.literal(16_000),
  channelCount: z.literal(1),
  sampleFormat: z.literal('pcm_s16le'),
  dependencyQaEvaluationId: safeIdSchema,
  dependencyReconciliationId: safeIdSchema,
  sourceExpectationDigestSha256: digestSchema,
}).strict()

const settingsSchema = z.object({
  device: z.literal('cuda'),
  computeType: z.literal('float16'),
  beamSize: z.literal(5),
  wordTimestamps: z.literal(true),
  vadFilter: z.literal(true),
  languagePolicy: z.literal('auto_detect_v1'),
  temperature: z.literal(0),
  conditionOnPreviousText: z.literal(true),
}).strict()

const operationArtifactBindingSchema = z.object({
  artifactId: safeIdSchema,
  kind: z.literal('audio'),
  contentType: z.literal('audio/wav'),
  sha256: digestSchema,
  byteLength: z.number().int().positive().max(MAXIMUM_AUDIO_BYTES),
}).strict()

/**
 * Faster Whisper is not one of the exact 50 production tool identities.
 * This candidate-only schema preserves immutable package authority without
 * granting a production operation, worker dispatch, or registry promotion.
 */
const candidateOperationRequestSchema = z.object({
  operationId: z.literal(
    'tool.faster_whisper.transcribe_private_audio.v1',
  ),
  approvedSnapshotId: safeIdSchema,
  approvedSnapshotHash: digestSchema,
  workItemId: safeIdSchema,
  workItemHash: digestSchema,
  creditEstimateId: safeIdSchema,
  creditReservationId: safeIdSchema,
  workerLeaseId: safeIdSchema,
  idempotencyKey: safeIdSchema,
  artifactBindings: z.tuple([operationArtifactBindingSchema]),
  settings: settingsSchema,
  modelArtifactManifestDigests: z.tuple([
    digestSchema,
    digestSchema,
    digestSchema,
    digestSchema,
  ]),
}).strict()

const boundModelArtifactSchema = z.object({
  canonicalOrder: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
  ]),
  slotId: z.enum([
    'faster_whisper_config',
    'faster_whisper_model',
    'faster_whisper_tokenizer',
    'faster_whisper_vocabulary',
  ]),
  artifactRecordId: z.string().regex(ARTIFACT_RECORD_PATTERN),
  manifestDigestSha256: digestSchema,
  artifactId: safeIdSchema,
  revision: z.literal(
    '536b0662742c02347bc0e980a01041f333bce120',
  ),
  artifactFormat: z.enum([
    'configuration',
    'reviewed_binary',
    'tokenizer',
  ]),
  artifactRole: z.enum([
    'ctranslate2-whisper-config',
    'ctranslate2-whisper-model',
    'whisper-tokenizer',
    'whisper-vocabulary',
  ]),
  modelFamily: z.literal('systran-faster-whisper-small'),
  byteLength: z.number().int().positive().max(1_000_000_000),
  contentSha256: digestSchema,
}).strict()

const expectedOutputsSchema = z.tuple([
  z.object({
    canonicalOrder: z.literal(0),
    artifactKind: z.literal('transcript_json'),
    contentType: z.literal('application/json'),
    encodingProfile: z.literal(
      'faster_whisper_word_timed_transcript_json_v1',
    ),
    privateArtifactRequired: z.literal(true),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(1),
    artifactKind: z.literal('caption_segments_json'),
    contentType: z.literal('application/json'),
    encodingProfile: z.literal(
      'faster_whisper_caption_segments_json_v1',
    ),
    privateArtifactRequired: z.literal(true),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(2),
    artifactKind: z.literal('analysis_report'),
    contentType: z.literal('application/json'),
    encodingProfile: z.literal(
      'faster_whisper_transcription_analysis_report_json_v1',
    ),
    privateArtifactRequired: z.literal(true),
  }).strict(),
])

const boundariesSchema = z.object({
  candidateOnly: z.literal(true),
  productionToolRegistryCountPreserved: z.literal(true),
  productionToolPromotionAuthorized: z.literal(false),
  canonicalOperationArtifactSetVerified: z.literal(false),
  freshRepositoryByteRehashRequired: z.literal(true),
  approvedPackageRereadRequired: z.literal(true),
  approvedSnapshotRereadRequired: z.literal(true),
  workerLeaseRereadRequired: z.literal(true),
  privateAudioArtifactReadVerified: z.literal(false),
  cloudRunReadOnlyModelMountVerified: z.literal(false),
  cloudRunCudaRuntimeImageVerified: z.literal(false),
  cloudRunL4CudaBenchmarkVerified: z.literal(false),
  packageDependencyLockVerified: z.literal(false),
  ctranslate2ModelLoadVerified: z.literal(false),
  fasterWhisperInferenceVerified: z.literal(false),
  privateTranscriptArtifactWriteVerified: z.literal(false),
  transcriptAlignmentQaVerified: z.literal(false),
  captionTimingQaVerified: z.literal(false),
  paidProductionOwnerApproval: z.literal(false),
  callerBytesAccepted: z.literal(false),
  callerPathAccepted: z.literal(false),
  callerUrlAccepted: z.literal(false),
  rawChatAccepted: z.literal(false),
  arbitrarySettingsAccepted: z.literal(false),
  arbitraryModelAccepted: z.literal(false),
  cpuExecutionAccepted: z.literal(false),
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
    CANONICAL_FASTER_WHISPER_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
  ),
  admissionClass: z.literal(
    'controlled_non_executable_faster_whisper_gpu_operation_preflight',
  ),
  admissionId: z.string().regex(
    /^faster_whisper_gpu_preflight_[a-f0-9]{32}$/u,
  ),
  identity: z.object({
    approvedToolId: z.literal('faster_whisper'),
    approvedOperationId: z.literal(
      'tool.faster_whisper.transcribe_private_audio.v1',
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
    artifactCount: z.literal(4),
    totalByteLength: z.literal(486_212_372),
    artifacts: z.array(boundModelArtifactSchema).length(4),
    consumerScope: z.literal('faster_whisper.private-inference'),
    executionTarget: z.literal('google_cloud_run_gpu'),
    cloudRunAccelerator: z.literal('nvidia_l4'),
    modelAccelerator: z.literal('cuda'),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  source: sourceSchema,
  settings: settingsSchema,
  expectedOutputs: expectedOutputsSchema,
  requiredQaGates: z.tuple([
    z.literal('transcript_alignment'),
    z.literal('caption_timing'),
  ]),
  summary: z.object({
    exactModelArtifactSetMatched: z.literal(true),
    exactCloudRunGpuAttemptIdentityMatched: z.literal(true),
    exactPrivateAudioBindingMatched: z.literal(true),
    exactGpuOnlySettingsMatched: z.literal(true),
    exactOutputAndQaContractDeclared: z.literal(true),
    modelArtifactCount: z.literal(4),
    inputDurationMilliseconds: z.number().int().positive()
      .max(MAXIMUM_AUDIO_DURATION_MILLISECONDS),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  blockers: z.array(safeIdSchema).min(1).max(32)
    .refine((values) => new Set(values).size === values.length)
    .refine((values) => values.every(
      (value, index) => index === 0 || values[index - 1]! < value,
    )),
  boundaries: boundariesSchema,
  admissionDigestSha256: digestSchema,
}).strict()

const BLOCKERS = [
  'approved_package_operation_input_reread_required',
  'cloud_run_cuda_runtime_image_not_qualified',
  'cloud_run_gpu_job_deployment_not_verified',
  'cloud_run_l4_cuda_benchmark_not_run',
  'cloud_run_read_only_model_mount_not_verified',
  'faster_whisper_dependency_lock_not_qualified',
  'faster_whisper_gpu_model_load_not_verified',
  'faster_whisper_transcript_and_caption_qa_not_verified',
  'model_artifact_fresh_repository_verification_required',
  'private_audio_and_transcript_artifact_transport_not_verified',
  'worker_service_identity_and_iam_not_verified',
] as const

const BOUNDARIES = {
  candidateOnly: true as const,
  productionToolRegistryCountPreserved: true as const,
  productionToolPromotionAuthorized: false as const,
  canonicalOperationArtifactSetVerified: false as const,
  freshRepositoryByteRehashRequired: true as const,
  approvedPackageRereadRequired: true as const,
  approvedSnapshotRereadRequired: true as const,
  workerLeaseRereadRequired: true as const,
  privateAudioArtifactReadVerified: false as const,
  cloudRunReadOnlyModelMountVerified: false as const,
  cloudRunCudaRuntimeImageVerified: false as const,
  cloudRunL4CudaBenchmarkVerified: false as const,
  packageDependencyLockVerified: false as const,
  ctranslate2ModelLoadVerified: false as const,
  fasterWhisperInferenceVerified: false as const,
  privateTranscriptArtifactWriteVerified: false as const,
  transcriptAlignmentQaVerified: false as const,
  captionTimingQaVerified: false as const,
  paidProductionOwnerApproval: false as const,
  callerBytesAccepted: false as const,
  callerPathAccepted: false as const,
  callerUrlAccepted: false as const,
  rawChatAccepted: false as const,
  arbitrarySettingsAccepted: false as const,
  arbitraryModelAccepted: false as const,
  cpuExecutionAccepted: false as const,
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
    artifactKind: 'transcript_json' as const,
    contentType: 'application/json' as const,
    encodingProfile:
      'faster_whisper_word_timed_transcript_json_v1' as const,
    privateArtifactRequired: true as const,
  },
  {
    canonicalOrder: 1 as const,
    artifactKind: 'caption_segments_json' as const,
    contentType: 'application/json' as const,
    encodingProfile:
      'faster_whisper_caption_segments_json_v1' as const,
    privateArtifactRequired: true as const,
  },
  {
    canonicalOrder: 2 as const,
    artifactKind: 'analysis_report' as const,
    contentType: 'application/json' as const,
    encodingProfile:
      'faster_whisper_transcription_analysis_report_json_v1' as const,
    privateArtifactRequired: true as const,
  },
] as const

const REQUIRED_QA_GATES = [
  'transcript_alignment',
  'caption_timing',
] as const

assertCandidateOnlyRegistryBoundary()

export function createCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate(
  input: CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidateInput,
): CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate {
  const requirementSet =
    assertCanonicalFasterWhisperModelArtifactRequirementSet(
      input.requirementSet,
    )
  const projection =
    assertCanonicalFasterWhisperGpuBundleRequirementProjection(
      input.requirementProjection,
    )
  const gpuBundle =
    assertExactFasterWhisperGpuBundle(input.gpuBundle)
  assertParentLineage({ requirementSet, projection, gpuBundle })
  const source = createSourceExpectation(input.source)
  const operation = parseExactOperationRequest({
    operationRequest: input.operationRequest,
    source,
    gpuBundle,
  })
  const identity = {
    approvedToolId: 'faster_whisper' as const,
    approvedOperationId:
      'tool.faster_whisper.transcribe_private_audio.v1' as const,
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
  const modelArtifactBinding = modelArtifactBindingFor(gpuBundle)
  const summary = {
    exactModelArtifactSetMatched: true as const,
    exactCloudRunGpuAttemptIdentityMatched: true as const,
    exactPrivateAudioBindingMatched: true as const,
    exactGpuOnlySettingsMatched: true as const,
    exactOutputAndQaContractDeclared: true as const,
    modelArtifactCount: 4 as const,
    inputDurationMilliseconds: source.durationMilliseconds,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
  }
  const admissionId = admissionIdFor({
    identity,
    sourceExpectationDigestSha256:
      source.sourceExpectationDigestSha256,
  })
  const draft = {
    admissionVersion:
      CANONICAL_FASTER_WHISPER_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
    admissionClass:
      'controlled_non_executable_faster_whisper_gpu_operation_preflight' as const,
    admissionId,
    identity,
    modelArtifactBinding,
    source,
    settings: operation.settings,
    expectedOutputs: EXPECTED_OUTPUTS,
    requiredQaGates: REQUIRED_QA_GATES,
    summary,
    blockers: BLOCKERS,
    boundaries: BOUNDARIES,
  }
  return assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
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

export function assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate(
  input: CanonicalFasterWhisperCloudRunGpuExecutionAdmissionAssertionInput,
): CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate {
  const parsed = candidateSchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalid(
      'faster_whisper_gpu_execution_admission_candidate_invalid',
    )
  }
  const candidate = parsed.data
  const { admissionDigestSha256, ...draft } = candidate
  if (admissionDigestSha256 !== sha256AuthorityValue(draft)) {
    throw blocked(
      'faster_whisper_gpu_execution_admission_digest_mismatch',
    )
  }
  const requirementSet =
    assertCanonicalFasterWhisperModelArtifactRequirementSet(
      input.requirementSet,
    )
  const projection =
    assertCanonicalFasterWhisperGpuBundleRequirementProjection(
      input.requirementProjection,
    )
  const gpuBundle =
    assertExactFasterWhisperGpuBundle(input.gpuBundle)
  assertParentLineage({ requirementSet, projection, gpuBundle })
  const source = createSourceExpectation(input.source)
  if (
    stableAuthorityStringify(candidate.source)
      !== stableAuthorityStringify(source)
  ) {
    throw blocked(
      'faster_whisper_source_audio_expectation_lineage_mismatch',
    )
  }
  const operation = parseExactOperationRequest({
    operationRequest: input.operationRequest,
    source,
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
  ) as unknown as CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate
}

function createSourceExpectation(
  input: CanonicalFasterWhisperSourceAudioExpectationInput,
): CanonicalFasterWhisperSourceAudioExpectation {
  const draft = {
    artifactId: input.artifactId,
    artifactKind: 'audio' as const,
    contentType: 'audio/wav' as const,
    contentSha256: input.contentSha256,
    byteLength: input.byteLength,
    durationMilliseconds: input.durationMilliseconds,
    sampleRateHz: input.sampleRateHz,
    channelCount: input.channelCount,
    sampleFormat: input.sampleFormat,
    dependencyQaEvaluationId: input.dependencyQaEvaluationId,
    dependencyReconciliationId:
      input.dependencyReconciliationId,
  }
  const parsed = sourceSchema.safeParse({
    ...draft,
    sourceExpectationDigestSha256:
      sha256AuthorityValue(draft),
  })
  if (!parsed.success) {
    throw invalid('faster_whisper_source_audio_expectation_invalid')
  }
  return deepFreeze(
    parsed.data,
  ) as CanonicalFasterWhisperSourceAudioExpectation
}

function parseExactOperationRequest(input: {
  operationRequest: unknown
  source: CanonicalFasterWhisperSourceAudioExpectation
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
  settings: CanonicalFasterWhisperOperationSettings
} {
  const parsed = candidateOperationRequestSchema.safeParse(
    input.operationRequest,
  )
  if (!parsed.success) {
    throw invalid(
      'faster_whisper_candidate_operation_request_invalid',
    )
  }
  const request = parsed.data
  const binding = request.artifactBindings[0]
  if (
    binding.artifactId !== input.source.artifactId
    || binding.sha256 !== input.source.contentSha256
    || binding.byteLength !== input.source.byteLength
  ) {
    throw blocked(
      'faster_whisper_operation_audio_artifact_mismatch',
    )
  }
  const expectedManifestDigests = input.gpuBundle.artifacts.map(
    (artifact) => artifact.locator.manifestDigestSha256,
  )
  if (
    stableAuthorityStringify(request.modelArtifactManifestDigests)
      !== stableAuthorityStringify(expectedManifestDigests)
  ) {
    throw blocked(
      'faster_whisper_operation_model_manifest_set_mismatch',
    )
  }
  return {
    approvedSnapshotId: request.approvedSnapshotId,
    approvedSnapshotHash: request.approvedSnapshotHash,
    workItemId: request.workItemId,
    workItemHash: request.workItemHash,
    creditEstimateId: request.creditEstimateId,
    creditReservationId: request.creditReservationId,
    workerLeaseId: request.workerLeaseId,
    idempotencyKey: request.idempotencyKey,
    settings: deepFreeze(
      request.settings,
    ) as CanonicalFasterWhisperOperationSettings,
  }
}

function assertExactFasterWhisperGpuBundle(
  value: unknown,
): CanonicalModelArtifactGpuBundle {
  const parsed = canonicalModelArtifactGpuBundleSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('faster_whisper_gpu_bundle_invalid')
  }
  const bundle = parsed.data
  const { bundleDigestSha256, ...draft } = bundle
  const requiredBundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity: bundle.identity,
      consumerScope: bundle.consumerScope,
      requirementsDigestSha256:
        bundle.requirementsDigestSha256,
    }).slice(0, 32)}`
  if (
    bundleDigestSha256 !== sha256AuthorityValue(draft)
    || bundle.consumerScope
      !== 'faster_whisper.private-inference'
    || bundle.identity.approvedToolId !== 'faster_whisper'
    || bundle.identity.approvedToolOperationId
      !== 'tool.faster_whisper.transcribe_private_audio.v1'
    || bundle.artifacts.length !== 4
    || bundle.summary.artifactCount !== 4
    || bundle.summary.totalByteLength !== 486_212_372
    || bundle.execution.executionTarget
      !== 'google_cloud_run_gpu'
    || bundle.execution.cloudRunAccelerator !== 'nvidia_l4'
    || bundle.execution.modelAccelerator !== 'cuda'
    || bundle.summary.cpuFallbackAllowed !== false
    || bundle.summary.runtimeDownloadAllowed !== false
    || bundle.summary.networkFetchAllowed !== false
    || bundle.bundleId !== requiredBundleId
  ) {
    throw blocked('faster_whisper_gpu_bundle_identity_mismatch')
  }
  const requirementSet =
    assertCanonicalFasterWhisperModelArtifactRequirementSet(
      getCanonicalFasterWhisperModelArtifactRequirementSet(),
    )
  const projected = bundle.artifacts.map((artifact, index) => {
    const requirement = requirementSet.artifacts[index]
    const descriptor = requirementSet.descriptors[index]
    if (!requirement || !descriptor) {
      throw blocked('faster_whisper_gpu_bundle_artifact_mismatch')
    }
    const { artifactBindingDigestSha256, ...artifactDraft } =
      artifact
    const artifactMatches =
      artifact.canonicalOrder === requirement.canonicalOrder
      && artifact.slotId === requirement.slotId
      && artifact.artifactId === requirement.artifactId
      && artifact.revision === requirement.revision
      && artifact.artifactFormat === requirement.artifactFormat
      && artifact.artifactRole === requirement.artifactRole
      && artifact.modelFamily === requirement.modelFamily
      && artifact.byteLength === requirement.byteLength
      && artifact.contentSha256 === requirement.contentSha256
      && artifact.locator.artifactId === requirement.artifactId
      && artifact.locator.revision === requirement.revision
      && artifact.locator.contentSha256 === requirement.contentSha256
      && artifact.repositoryAdmission
        === descriptor.repositoryAdmission
      && artifact.sourceObservationDigestSha256
        === descriptor.sourceObservationDigestSha256
      && artifact.reviewEvidenceDigestSha256
        === descriptor.reviewEvidenceDigestSha256
      && artifact.securityReviewDigestSha256
        === descriptor.securityReviewDigestSha256
      && artifact.licensePolicyDigestSha256
        === sha256AuthorityValue(descriptor.licensePolicy)
      && artifact.commercialUseStatus
        === descriptor.licensePolicy.commercialUseStatus
      && artifact.reviewStatus
        === descriptor.licensePolicy.reviewStatus
      && artifact.paidProductionUseApproved
        === descriptor.licensePolicy.paidProductionUseApproved
      && artifact.consumerScopeVerified === true
      && artifact.executionClass === 'gpu_required'
      && artifact.requiredExecutionTarget
        === 'google_cloud_run_gpu'
      && artifact.accelerator === 'cuda'
      && artifact.cpuFallbackAllowed === false
      && artifact.runtimeDownloadAllowed === false
      && artifact.networkFetchAllowed === false
      && artifact.fullRepositoryChecksumVerified === true
      && artifact.required === true
      && artifactBindingDigestSha256
        === sha256AuthorityValue(artifactDraft)
    if (!artifactMatches) {
      throw blocked('faster_whisper_gpu_bundle_artifact_mismatch')
    }
    return gpuRequirementFor(artifact)
  })
  if (
    bundle.requirementsDigestSha256
      !== sha256AuthorityValue(projected)
  ) {
    throw blocked(
      'faster_whisper_gpu_bundle_requirements_digest_mismatch',
    )
  }
  return deepFreeze(bundle) as CanonicalModelArtifactGpuBundle
}

function assertParentLineage(input: {
  requirementSet: ReturnType<
    typeof assertCanonicalFasterWhisperModelArtifactRequirementSet
  >
  projection: ReturnType<
    typeof assertCanonicalFasterWhisperGpuBundleRequirementProjection
  >
  gpuBundle: CanonicalModelArtifactGpuBundle
}): void {
  const bundledRequirements = input.gpuBundle.artifacts.map(
    gpuRequirementFor,
  )
  if (
    input.projection.requirementSetDigestSha256
      !== input.requirementSet.requirementSetDigestSha256
    || input.projection.approvedToolId
      !== input.gpuBundle.identity.approvedToolId
    || input.projection.approvedOperationId
      !== input.gpuBundle.identity.approvedToolOperationId
    || input.projection.consumerScope
      !== input.gpuBundle.consumerScope
    || stableAuthorityStringify(input.projection.requirements)
      !== stableAuthorityStringify(bundledRequirements)
  ) {
    throw blocked(
      'faster_whisper_gpu_execution_parent_lineage_mismatch',
    )
  }
}

function modelArtifactBindingFor(
  bundle: CanonicalModelArtifactGpuBundle,
): CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate[
  'modelArtifactBinding'
] {
  const artifacts = bundle.artifacts.map((artifact) => ({
    canonicalOrder: artifact.canonicalOrder as 0 | 1 | 2 | 3,
    slotId: artifact.slotId as
      | 'faster_whisper_config'
      | 'faster_whisper_model'
      | 'faster_whisper_tokenizer'
      | 'faster_whisper_vocabulary',
    artifactRecordId: artifact.locator.artifactRecordId,
    manifestDigestSha256:
      artifact.locator.manifestDigestSha256,
    artifactId: artifact.artifactId,
    revision:
      '536b0662742c02347bc0e980a01041f333bce120' as const,
    artifactFormat: artifact.artifactFormat,
    artifactRole: artifact.artifactRole,
    modelFamily: 'systran-faster-whisper-small' as const,
    byteLength: artifact.byteLength,
    contentSha256: artifact.contentSha256,
  })) as unknown as CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate[
    'modelArtifactBinding'
  ]['artifacts']
  return {
    artifactCount: 4,
    totalByteLength: 486_212_372,
    artifacts,
    consumerScope: 'faster_whisper.private-inference',
    executionTarget: 'google_cloud_run_gpu',
    cloudRunAccelerator: 'nvidia_l4',
    modelAccelerator: 'cuda',
    cpuFallbackAllowed: false,
    runtimeDownloadAllowed: false,
    networkFetchAllowed: false,
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
  const expectedModelArtifactBinding =
    modelArtifactBindingFor(input.gpuBundle)
  const expectedAdmissionId = admissionIdFor({
    identity: input.candidate.identity,
    sourceExpectationDigestSha256:
      input.candidate.source.sourceExpectationDigestSha256,
  })
  const identity = input.candidate.identity
  const operation = input.operation
  if (
    identity.requirementSetDigestSha256
      !== input.requirementSetDigestSha256
    || identity.requirementProjectionDigestSha256
      !== input.projectionDigestSha256
    || identity.gpuBundleDigestSha256
      !== input.gpuBundle.bundleDigestSha256
    || identity.gpuBundleRequirementsDigestSha256
      !== input.gpuBundle.requirementsDigestSha256
    || identity.dispatchIntentId
      !== input.gpuBundle.identity.dispatchIntentId
    || identity.dispatchBindingHash
      !== input.gpuBundle.identity.dispatchBindingHash
    || identity.attemptPlanHash
      !== input.gpuBundle.identity.attemptPlanHash
    || identity.approvedSnapshotId !== operation.approvedSnapshotId
    || identity.approvedSnapshotHash
      !== operation.approvedSnapshotHash
    || identity.workItemId !== operation.workItemId
    || identity.workItemHash !== operation.workItemHash
    || identity.creditEstimateId !== operation.creditEstimateId
    || identity.creditReservationId
      !== operation.creditReservationId
    || identity.workerLeaseId !== operation.workerLeaseId
    || identity.idempotencyKey !== operation.idempotencyKey
    || identity.operationRequestDigestSha256
      !== input.operationRequestDigestSha256
    || stableAuthorityStringify(
      input.candidate.modelArtifactBinding,
    ) !== stableAuthorityStringify(expectedModelArtifactBinding)
    || stableAuthorityStringify(input.candidate.settings)
      !== stableAuthorityStringify(operation.settings)
    || input.candidate.summary.inputDurationMilliseconds
      !== input.candidate.source.durationMilliseconds
    || input.candidate.admissionId !== expectedAdmissionId
    || stableAuthorityStringify(input.candidate.blockers)
      !== stableAuthorityStringify(BLOCKERS)
    || stableAuthorityStringify(input.candidate.boundaries)
      !== stableAuthorityStringify(BOUNDARIES)
    || stableAuthorityStringify(input.candidate.expectedOutputs)
      !== stableAuthorityStringify(EXPECTED_OUTPUTS)
    || stableAuthorityStringify(input.candidate.requiredQaGates)
      !== stableAuthorityStringify(REQUIRED_QA_GATES)
  ) {
    throw blocked(
      'faster_whisper_gpu_execution_admission_derived_fields_invalid',
    )
  }
}

function gpuRequirementFor(
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

function admissionIdFor(input: {
  identity:
    CanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate[
      'identity'
    ]
  sourceExpectationDigestSha256: string
}): string {
  return `faster_whisper_gpu_preflight_${
    sha256AuthorityValue(input).slice(0, 32)
  }`
}

function assertCandidateOnlyRegistryBoundary(): void {
  if (
    CANONICAL_PRIVATE_E2E_TOOL_IDS.length !== 50
    || (CANONICAL_PRIVATE_E2E_TOOL_IDS as readonly string[])
      .includes('faster_whisper')
    || resolveProfessionalToolOperationSpec('faster_whisper')
      !== undefined
  ) {
    throw new Error(
      'Faster Whisper candidate crossed the exact 50-tool boundary',
    )
  }
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
