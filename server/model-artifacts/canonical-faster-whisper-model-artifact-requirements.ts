import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { getGpuModelWeightManifestTemplate } from '../model-weights'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { getNonE2EToolCapabilityProfile } from '../tool-registry'
import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
} from './canonical-model-artifact-types'
import {
  CANONICAL_FASTER_WHISPER_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  CANONICAL_FASTER_WHISPER_SOURCE_OBSERVATION_VERSION,
  type CanonicalFasterWhisperGpuBundleRequirementProjection,
  type CanonicalFasterWhisperGpuBundleRequirementProjectionInput,
  type CanonicalFasterWhisperModelArtifactRequirementDefinition,
  type CanonicalFasterWhisperModelArtifactRequirementSet,
  type CanonicalFasterWhisperSourceObservation,
} from './canonical-faster-whisper-model-artifact-requirement-types'
import type {
  CanonicalModelArtifactLocator,
} from './canonical-model-artifact-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN = /^model-artifact-[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const sourceObservationSchema = z.object({
  observationVersion: z.literal(
    CANONICAL_FASTER_WHISPER_SOURCE_OBSERVATION_VERSION,
  ),
  observedAt: z.literal('2026-07-27'),
  sourceOwner: z.literal('SYSTRAN'),
  sourceRepository: z.literal(
    'https://github.com/SYSTRAN/faster-whisper',
  ),
  sourceRevision: z.literal(
    '65882eee9f5cdbeeb2d877f1131d48cf241b327d',
  ),
  sourceTag: z.literal('v1.2.1'),
  packageVersion: z.literal('1.2.1'),
  sourceRevisionMutable: z.literal(false),
  sourceLicense: z.literal('MIT'),
  sourceLicenseDocumentSha256: z.literal(
    'af6798135e729f8aa6c853936d037dfdea449734d26b8ea6a89805fca758c0d5',
  ),
  sourceReadmeSha256: z.literal(
    '5ae59e0781834e6887bbd51bda2d8bd5dfe08cd345e0c6f7f3aca455d129cc69',
  ),
  modelRepository: z.literal(
    'https://huggingface.co/Systran/faster-whisper-small',
  ),
  modelRevision: z.literal(
    '536b0662742c02347bc0e980a01041f333bce120',
  ),
  modelRevisionMutable: z.literal(false),
  modelLicense: z.literal('MIT'),
  modelCardSha256: z.literal(
    '329373481008c7c38654aff8ecdcf0163c211557cc7ba8e2ef6f2f84b4f75ec8',
  ),
  modelBinaryMetadataObservedWithoutDownload: z.literal(true),
  modelBinaryLfsSha256: z.literal(
    '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671',
  ),
  modelBinaryByteLength: z.literal(483_546_902),
  expectedRuntimeFileCount: z.literal(4),
  expectedRuntimeFileNames: z.tuple([
    z.literal('config.json'),
    z.literal('model.bin'),
    z.literal('tokenizer.json'),
    z.literal('vocabulary.txt'),
  ]),
  officialGpuRuntimeCudaMajor: z.literal(12),
  officialGpuRuntimeCudnnMajor: z.literal(9),
  requiredDevice: z.literal('cuda'),
  requiredComputeType: z.literal('float16'),
  googleCloudRunL4BenchmarkPerformed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
  sourceObservationDigestSha256: digestSchema,
}).strict()

const descriptorSchema = z.object({
  descriptorVersion: z.literal(
    CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  ),
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
  consumerScopes: z.tuple([
    z.literal('faster_whisper.private-inference'),
  ]),
  repositoryAdmission: z.literal('controlled_internal_test'),
  sourceObservationDigestSha256: digestSchema,
  reviewEvidenceDigestSha256: digestSchema,
  securityReviewDigestSha256: digestSchema,
  licensePolicy: z.object({
    modelArtifactLicense: z.literal('MIT'),
    commercialUseStatus: z.literal('allowed'),
    reviewStatus: z.literal('evaluation_only'),
    redistributionAllowed: z.literal(true),
    requiresAttribution: z.literal(true),
    paidProductionUseApproved: z.literal(false),
    sourceLicenseDocumentSha256: z.literal(
      'af6798135e729f8aa6c853936d037dfdea449734d26b8ea6a89805fca758c0d5',
    ),
    modelCardDocumentSha256: z.literal(
      '329373481008c7c38654aff8ecdcf0163c211557cc7ba8e2ef6f2f84b4f75ec8',
    ),
  }).strict(),
  executionPolicy: z.object({
    executionClass: z.literal('gpu_required'),
    requiredExecutionTarget: z.literal('google_cloud_run_gpu'),
    accelerator: z.literal('cuda'),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  callerBytesAccepted: z.literal(false),
  callerPathAccepted: z.literal(false),
  callerUrlAccepted: z.literal(false),
}).strict()

const requirementDefinitionSchema = z.object({
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
  byteLength: z.union([
    z.literal(2_370),
    z.literal(483_546_902),
    z.literal(2_203_239),
    z.literal(459_861),
  ]),
  contentSha256: digestSchema,
  consumerScope: z.literal('faster_whisper.private-inference'),
  required: z.literal(true),
  requirementDigestSha256: digestSchema,
}).strict()

const boundariesSchema = z.object({
  exactImmutablePackageSourceObserved: z.literal(true),
  exactImmutableModelRevisionObserved: z.literal(true),
  exactRuntimeFileSetDefined: z.literal(true),
  exactRepositoryLocatorsRequired: z.literal(true),
  legacyManifestTemplateStillPlaceholder: z.literal(true),
  packageDependencyLockQualified: z.literal(false),
  modelArtifactsIngested: z.literal(false),
  canonicalOperationArtifactSetVerified: z.literal(false),
  privateGpuDistributionVerified: z.literal(false),
  cloudRunReadOnlyMountVerified: z.literal(false),
  cloudRunCudaRuntimeImageVerified: z.literal(false),
  cloudRunL4CudaBenchmarkVerified: z.literal(false),
  privateAudioArtifactReadVerified: z.literal(false),
  privateTranscriptArtifactsVerified: z.literal(false),
  transcriptAlignmentQaVerified: z.literal(false),
  captionTimingQaVerified: z.literal(false),
  paidProductionOwnerApproval: z.literal(false),
  sourceDownloadAuthorized: z.literal(false),
  modelArtifactIngestAuthorized: z.literal(false),
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

const requirementSetSchema = z.object({
  requirementSetVersion: z.literal(
    CANONICAL_FASTER_WHISPER_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  ),
  requirementSetClass: z.literal(
    'server_owned_exact_faster_whisper_operation_model_artifact_definition',
  ),
  requirementSetId: z.literal(
    'systran_faster_whisper_small_transcription_internal_candidate',
  ),
  approvedToolId: z.literal('faster_whisper'),
  approvedOperationId: z.literal(
    'tool.faster_whisper.transcribe_private_audio.v1',
  ),
  legacyModelWeightManifestId: z.literal('faster_whisper_model'),
  sourceObservation: sourceObservationSchema,
  descriptors: z.array(descriptorSchema).length(4),
  artifacts: z.array(requirementDefinitionSchema).length(4),
  summary: z.object({
    artifactCount: z.literal(4),
    totalByteLength: z.literal(486_212_372),
    exactRuntimeFileSetDefined: z.literal(true),
    packageDependencyLockStillRequired: z.literal(true),
    exactCudaRuntimeImageStillRequired: z.literal(true),
    allArtifactsGpuRequired: z.literal(true),
    googleCloudRunGpuRequired: z.literal(true),
    cudaRequired: z.literal(true),
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
  requirementSetDigestSha256: digestSchema,
}).strict()

const locatorSchema = z.object({
  locatorVersion: z.literal('canonical-model-artifact-locator-v1'),
  artifactRecordId: z.string().regex(ARTIFACT_RECORD_PATTERN),
  artifactId: safeIdSchema,
  revision: z.literal(
    '536b0662742c02347bc0e980a01041f333bce120',
  ),
  contentSha256: digestSchema,
  manifestDigestSha256: digestSchema,
}).strict()

const gpuRequirementSchema = z.object({
  canonicalOrder: z.number().int().min(0).max(3),
  slotId: z.enum([
    'faster_whisper_config',
    'faster_whisper_model',
    'faster_whisper_tokenizer',
    'faster_whisper_vocabulary',
  ]),
  locator: locatorSchema,
  expectedArtifactId: safeIdSchema,
  expectedRevision: z.literal(
    '536b0662742c02347bc0e980a01041f333bce120',
  ),
  expectedArtifactFormat: z.enum([
    'configuration',
    'reviewed_binary',
    'tokenizer',
  ]),
  expectedArtifactRole: z.enum([
    'ctranslate2-whisper-config',
    'ctranslate2-whisper-model',
    'whisper-tokenizer',
    'whisper-vocabulary',
  ]),
  expectedModelFamily: z.literal('systran-faster-whisper-small'),
  expectedByteLength: z.number().int().positive()
    .max(1_000_000_000),
  expectedContentSha256: digestSchema,
  required: z.literal(true),
}).strict()

const projectionSchema = z.object({
  requirementSetDigestSha256: digestSchema,
  approvedToolId: z.literal('faster_whisper'),
  approvedOperationId: z.literal(
    'tool.faster_whisper.transcribe_private_audio.v1',
  ),
  consumerScope: z.literal('faster_whisper.private-inference'),
  requirements: z.array(gpuRequirementSchema).length(4),
  repositoryVerificationStillRequired: z.literal(true),
  canonicalOperationArtifactSetVerified: z.literal(false),
  cloudDispatchAuthorized: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  productionReady: z.literal(false),
  projectionDigestSha256: digestSchema,
}).strict()

const ARTIFACT_SPECS = [
  {
    canonicalOrder: 0 as const,
    slotId: 'faster_whisper_config' as const,
    artifactId: 'systran-faster-whisper-small-config-json',
    artifactFormat: 'configuration' as const,
    artifactRole: 'ctranslate2-whisper-config' as const,
    byteLength: 2_370 as const,
    contentSha256:
      'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828',
  },
  {
    canonicalOrder: 1 as const,
    slotId: 'faster_whisper_model' as const,
    artifactId: 'systran-faster-whisper-small-model-bin',
    artifactFormat: 'reviewed_binary' as const,
    artifactRole: 'ctranslate2-whisper-model' as const,
    byteLength: 483_546_902 as const,
    contentSha256:
      '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671',
  },
  {
    canonicalOrder: 2 as const,
    slotId: 'faster_whisper_tokenizer' as const,
    artifactId: 'systran-faster-whisper-small-tokenizer-json',
    artifactFormat: 'tokenizer' as const,
    artifactRole: 'whisper-tokenizer' as const,
    byteLength: 2_203_239 as const,
    contentSha256:
      'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab',
  },
  {
    canonicalOrder: 3 as const,
    slotId: 'faster_whisper_vocabulary' as const,
    artifactId: 'systran-faster-whisper-small-vocabulary-txt',
    artifactFormat: 'tokenizer' as const,
    artifactRole: 'whisper-vocabulary' as const,
    byteLength: 459_861 as const,
    contentSha256:
      '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913',
  },
] as const

const SOURCE_OBSERVATION_DRAFT = {
  observationVersion:
    CANONICAL_FASTER_WHISPER_SOURCE_OBSERVATION_VERSION,
  observedAt: '2026-07-27' as const,
  sourceOwner: 'SYSTRAN' as const,
  sourceRepository:
    'https://github.com/SYSTRAN/faster-whisper' as const,
  sourceRevision:
    '65882eee9f5cdbeeb2d877f1131d48cf241b327d' as const,
  sourceTag: 'v1.2.1' as const,
  packageVersion: '1.2.1' as const,
  sourceRevisionMutable: false as const,
  sourceLicense: 'MIT' as const,
  sourceLicenseDocumentSha256:
    'af6798135e729f8aa6c853936d037dfdea449734d26b8ea6a89805fca758c0d5' as const,
  sourceReadmeSha256:
    '5ae59e0781834e6887bbd51bda2d8bd5dfe08cd345e0c6f7f3aca455d129cc69' as const,
  modelRepository:
    'https://huggingface.co/Systran/faster-whisper-small' as const,
  modelRevision:
    '536b0662742c02347bc0e980a01041f333bce120' as const,
  modelRevisionMutable: false as const,
  modelLicense: 'MIT' as const,
  modelCardSha256:
    '329373481008c7c38654aff8ecdcf0163c211557cc7ba8e2ef6f2f84b4f75ec8' as const,
  modelBinaryMetadataObservedWithoutDownload: true as const,
  modelBinaryLfsSha256:
    '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671' as const,
  modelBinaryByteLength: 483_546_902 as const,
  expectedRuntimeFileCount: 4 as const,
  expectedRuntimeFileNames: [
    'config.json',
    'model.bin',
    'tokenizer.json',
    'vocabulary.txt',
  ] as const,
  officialGpuRuntimeCudaMajor: 12 as const,
  officialGpuRuntimeCudnnMajor: 9 as const,
  requiredDevice: 'cuda' as const,
  requiredComputeType: 'float16' as const,
  googleCloudRunL4BenchmarkPerformed: false as const,
  runtimeDownloadAllowed: false as const,
  networkFetchAllowed: false as const,
}

const SOURCE_OBSERVATION = deepFreeze(
  sourceObservationSchema.parse({
    ...SOURCE_OBSERVATION_DRAFT,
    sourceObservationDigestSha256:
      sha256AuthorityValue(SOURCE_OBSERVATION_DRAFT),
  }),
) as CanonicalFasterWhisperSourceObservation

const REVIEW_EVIDENCE = {
  evidenceVersion: 'faster-whisper-model-artifact-review-evidence-v1',
  disposition: 'controlled_internal_candidate',
  packageLicenseObserved: 'MIT',
  modelCardLicenseObserved: 'MIT',
  commercialUseUnderObservedLicense: 'allowed',
  exactRuntimeFileMetadataObserved: true,
  modelBinaryBytesDownloadedDuringObservation: false,
  paidProductionOwnerApproval: false,
  googleCloudRunL4BenchmarkObserved: false,
  transcriptAlignmentBenchmarkObserved: false,
  captionTimingBenchmarkObserved: false,
} as const

const SECURITY_EVIDENCE = {
  evidenceVersion:
    'faster-whisper-model-artifact-security-evidence-v1',
  exactTrustedServerOwnedChecksumsRequired: true,
  isolatedPinnedCudaContainerRequired: true,
  unprivilegedRuntimeRequired: true,
  readOnlyRootFilesystemRequired: true,
  readOnlyModelMountRequired: true,
  networkDisabledRequired: true,
  runtimeDownloadAllowed: false,
  callerModelFilesAllowed: false,
  arbitraryModelDirectoryAllowed: false,
  dependencyLockQualified: false,
} as const

const DESCRIPTORS = ARTIFACT_SPECS.map((spec) =>
  deepFreeze(descriptorSchema.parse({
    descriptorVersion:
      CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
    artifactId: spec.artifactId,
    revision: SOURCE_OBSERVATION.modelRevision,
    artifactFormat: spec.artifactFormat,
    artifactRole: spec.artifactRole,
    modelFamily: 'systran-faster-whisper-small',
    byteLength: spec.byteLength,
    contentSha256: spec.contentSha256,
    consumerScopes: ['faster_whisper.private-inference'],
    repositoryAdmission: 'controlled_internal_test',
    sourceObservationDigestSha256:
      SOURCE_OBSERVATION.sourceObservationDigestSha256,
    reviewEvidenceDigestSha256:
      sha256AuthorityValue(REVIEW_EVIDENCE),
    securityReviewDigestSha256:
      sha256AuthorityValue(SECURITY_EVIDENCE),
    licensePolicy: {
      modelArtifactLicense: 'MIT',
      commercialUseStatus: 'allowed',
      reviewStatus: 'evaluation_only',
      redistributionAllowed: true,
      requiresAttribution: true,
      paidProductionUseApproved: false,
      sourceLicenseDocumentSha256:
        SOURCE_OBSERVATION.sourceLicenseDocumentSha256,
      modelCardDocumentSha256:
        SOURCE_OBSERVATION.modelCardSha256,
    },
    executionPolicy: {
      executionClass: 'gpu_required',
      requiredExecutionTarget: 'google_cloud_run_gpu',
      accelerator: 'cuda',
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
  }))
) as unknown as CanonicalFasterWhisperModelArtifactRequirementSet[
  'descriptors'
]

const REQUIREMENT_DRAFTS = ARTIFACT_SPECS.map((spec) => ({
  canonicalOrder: spec.canonicalOrder,
  slotId: spec.slotId,
  artifactId: spec.artifactId,
  revision: SOURCE_OBSERVATION.modelRevision,
  artifactFormat: spec.artifactFormat,
  artifactRole: spec.artifactRole,
  modelFamily: 'systran-faster-whisper-small' as const,
  byteLength: spec.byteLength,
  contentSha256: spec.contentSha256,
  consumerScope: 'faster_whisper.private-inference' as const,
  required: true as const,
}))

const REQUIREMENTS = REQUIREMENT_DRAFTS.map((draft) =>
  deepFreeze(requirementDefinitionSchema.parse({
    ...draft,
    requirementDigestSha256: sha256AuthorityValue(draft),
  }))
) as unknown as CanonicalFasterWhisperModelArtifactRequirementSet[
  'artifacts'
]

const BLOCKERS = [
  'canonical_model_artifact_repository_records_not_ingested',
  'canonical_operation_gpu_bundle_not_verified',
  'cloud_run_cuda_runtime_image_not_qualified',
  'cloud_run_l4_cuda_benchmark_not_run',
  'faster_whisper_dependency_lock_not_qualified',
  'faster_whisper_gpu_model_load_fixture_not_passed',
  'faster_whisper_transcript_and_caption_qa_not_verified',
  'model_artifact_paid_production_owner_approval_missing',
  'private_audio_and_transcript_transport_not_admitted',
] as const

const BOUNDARIES = {
  exactImmutablePackageSourceObserved: true as const,
  exactImmutableModelRevisionObserved: true as const,
  exactRuntimeFileSetDefined: true as const,
  exactRepositoryLocatorsRequired: true as const,
  legacyManifestTemplateStillPlaceholder: true as const,
  packageDependencyLockQualified: false as const,
  modelArtifactsIngested: false as const,
  canonicalOperationArtifactSetVerified: false as const,
  privateGpuDistributionVerified: false as const,
  cloudRunReadOnlyMountVerified: false as const,
  cloudRunCudaRuntimeImageVerified: false as const,
  cloudRunL4CudaBenchmarkVerified: false as const,
  privateAudioArtifactReadVerified: false as const,
  privateTranscriptArtifactsVerified: false as const,
  transcriptAlignmentQaVerified: false as const,
  captionTimingQaVerified: false as const,
  paidProductionOwnerApproval: false as const,
  sourceDownloadAuthorized: false as const,
  modelArtifactIngestAuthorized: false as const,
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

const REQUIREMENT_SET_DRAFT = {
  requirementSetVersion:
    CANONICAL_FASTER_WHISPER_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  requirementSetClass:
    'server_owned_exact_faster_whisper_operation_model_artifact_definition' as const,
  requirementSetId:
    'systran_faster_whisper_small_transcription_internal_candidate' as const,
  approvedToolId: 'faster_whisper' as const,
  approvedOperationId:
    'tool.faster_whisper.transcribe_private_audio.v1' as const,
  legacyModelWeightManifestId: 'faster_whisper_model' as const,
  sourceObservation: SOURCE_OBSERVATION,
  descriptors: DESCRIPTORS,
  artifacts: REQUIREMENTS,
  summary: {
    artifactCount: 4 as const,
    totalByteLength: 486_212_372 as const,
    exactRuntimeFileSetDefined: true as const,
    packageDependencyLockStillRequired: true as const,
    exactCudaRuntimeImageStillRequired: true as const,
    allArtifactsGpuRequired: true as const,
    googleCloudRunGpuRequired: true as const,
    cudaRequired: true as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
  },
  blockers: BLOCKERS,
  boundaries: BOUNDARIES,
}

const REQUIREMENT_SET = deepFreeze(
  requirementSetSchema.parse({
    ...REQUIREMENT_SET_DRAFT,
    requirementSetDigestSha256:
      sha256AuthorityValue(REQUIREMENT_SET_DRAFT),
  }),
) as unknown as CanonicalFasterWhisperModelArtifactRequirementSet

assertCanonicalRegistryCompatibility()

export function getCanonicalFasterWhisperModelArtifactRequirementSet():
CanonicalFasterWhisperModelArtifactRequirementSet {
  return REQUIREMENT_SET
}

export function assertCanonicalFasterWhisperModelArtifactRequirementSet(
  value: unknown,
): CanonicalFasterWhisperModelArtifactRequirementSet {
  const parsed = requirementSetSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'faster_whisper_model_artifact_requirement_set_invalid',
    )
  }
  const { requirementSetDigestSha256, ...draft } = parsed.data
  const requirementDigestsMatch = parsed.data.artifacts.every(
    (artifact, index) =>
      artifact.requirementDigestSha256
        === sha256AuthorityValue(REQUIREMENT_DRAFTS[index]),
  )
  if (
    requirementSetDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.data.sourceObservation.sourceObservationDigestSha256
      !== sha256AuthorityValue(SOURCE_OBSERVATION_DRAFT)
    || !requirementDigestsMatch
    || stableAuthorityStringify(parsed.data)
      !== stableAuthorityStringify(REQUIREMENT_SET)
  ) {
    throw blocked(
      'faster_whisper_model_artifact_requirement_set_mismatch',
    )
  }
  return REQUIREMENT_SET
}

export function projectCanonicalFasterWhisperGpuBundleRequirements(
  input: CanonicalFasterWhisperGpuBundleRequirementProjectionInput,
): CanonicalFasterWhisperGpuBundleRequirementProjection {
  const requirementSet =
    assertCanonicalFasterWhisperModelArtifactRequirementSet(
      input.requirementSet,
    )
  if (!Array.isArray(input.locators) || input.locators.length !== 4) {
    throw invalid('faster_whisper_model_artifact_locators_invalid')
  }
  const locators = input.locators.map((value, index) => {
    const parsed = locatorSchema.safeParse(value)
    const requirement = requirementSet.artifacts[index]
    if (
      !parsed.success
      || !requirement
      || parsed.data.artifactId !== requirement.artifactId
      || parsed.data.revision !== requirement.revision
      || parsed.data.contentSha256 !== requirement.contentSha256
    ) {
      throw blocked(
        'faster_whisper_model_artifact_locator_mismatch',
      )
    }
    return parsed.data
  }) as unknown as CanonicalFasterWhisperGpuBundleRequirementProjectionInput[
    'locators'
  ]
  const requirements = requirementSet.artifacts.map(
    (requirement, index) =>
      gpuRequirementFor(requirement, locators[index]!),
  ) as unknown as CanonicalFasterWhisperGpuBundleRequirementProjection[
    'requirements'
  ]
  const draft = {
    requirementSetDigestSha256:
      requirementSet.requirementSetDigestSha256,
    approvedToolId: requirementSet.approvedToolId,
    approvedOperationId: requirementSet.approvedOperationId,
    consumerScope: 'faster_whisper.private-inference' as const,
    requirements,
    repositoryVerificationStillRequired: true as const,
    canonicalOperationArtifactSetVerified: false as const,
    cloudDispatchAuthorized: false as const,
    modelInferenceAuthority: false as const,
    productionReady: false as const,
  }
  return deepFreeze(projectionSchema.parse({
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  })) as unknown as CanonicalFasterWhisperGpuBundleRequirementProjection
}

export function assertCanonicalFasterWhisperGpuBundleRequirementProjection(
  value: unknown,
): CanonicalFasterWhisperGpuBundleRequirementProjection {
  const parsed = projectionSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'faster_whisper_gpu_bundle_requirement_projection_invalid',
    )
  }
  const { projectionDigestSha256, ...draft } = parsed.data
  const requirementsMatch = parsed.data.requirements.every(
    (projected, index) => {
      const requirement = REQUIREMENT_SET.artifacts[index]
      return Boolean(
        requirement
        && stableAuthorityStringify(projected)
          === stableAuthorityStringify(
            gpuRequirementFor(requirement, projected.locator),
          ),
      )
    },
  )
  if (
    projectionDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.data.requirementSetDigestSha256
      !== REQUIREMENT_SET.requirementSetDigestSha256
    || !requirementsMatch
  ) {
    throw blocked(
      'faster_whisper_gpu_bundle_requirement_projection_mismatch',
    )
  }
  return deepFreeze(
    parsed.data,
  ) as unknown as CanonicalFasterWhisperGpuBundleRequirementProjection
}

function gpuRequirementFor(
  requirement: CanonicalFasterWhisperModelArtifactRequirementDefinition,
  locator: CanonicalModelArtifactLocator,
) {
  return {
    canonicalOrder: requirement.canonicalOrder,
    slotId: requirement.slotId,
    locator,
    expectedArtifactId: requirement.artifactId,
    expectedRevision: requirement.revision,
    expectedArtifactFormat: requirement.artifactFormat,
    expectedArtifactRole: requirement.artifactRole,
    expectedModelFamily: requirement.modelFamily,
    expectedByteLength: requirement.byteLength,
    expectedContentSha256: requirement.contentSha256,
    required: true as const,
  }
}

function assertCanonicalRegistryCompatibility(): void {
  const profile = getNonE2EToolCapabilityProfile('faster_whisper')
  const legacyManifest =
    getGpuModelWeightManifestTemplate('faster_whisper_model')
  if (
    !profile
    || profile.workerType !== 'gpu_ai_worker'
    || profile.gpuRequired !== true
    || profile.cpuAllowed !== false
    || profile.modelWeightsRequired !== true
    || !legacyManifest
    || legacyManifest.toolId !== 'faster_whisper'
    || legacyManifest.reviewStatus !== 'needs_review'
    || legacyManifest.commercialUseAllowed !== false
  ) {
    throw new Error(
      'non-E2E Faster Whisper capability profile drifted',
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
