import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { getNonE2EToolCapabilityProfile } from '../tool-registry'
import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
} from './canonical-model-artifact-types'
import {
  CANONICAL_SAM2_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  CANONICAL_SAM2_SOURCE_OBSERVATION_VERSION,
  type CanonicalSam2GpuBundleRequirementProjection,
  type CanonicalSam2GpuBundleRequirementProjectionInput,
  type CanonicalSam2ModelArtifactRequirementDefinition,
  type CanonicalSam2ModelArtifactRequirementSet,
  type CanonicalSam2SourceObservation,
} from './canonical-sam2-model-artifact-requirement-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN = /^model-artifact-[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const sourceObservationSchema = z.object({
  observationVersion: z.literal(
    CANONICAL_SAM2_SOURCE_OBSERVATION_VERSION,
  ),
  observedAt: z.literal('2026-07-27'),
  sourceOwner: z.literal('Meta Platforms, Inc.'),
  sourceRepository: z.literal(
    'https://github.com/facebookresearch/sam2',
  ),
  sourceRevision: z.literal(
    '2b90b9f5ceec907a1c18123530e92e794ad901a4',
  ),
  sourceRevisionMutable: z.literal(false),
  sourceLicense: z.literal('Apache-2.0'),
  sourceLicenseDocumentSha256: z.literal(
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
  ),
  sourceReadmeSha256: z.literal(
    'eea69ee1042fb30933c5ca5019fbf0f6f9366cec5e792109281b5023a4f1589c',
  ),
  sourcePyprojectSha256: z.literal(
    'c58230f78769620dcd11d15824d491b049be8f542eeb875d2e8091be797ec3f3',
  ),
  checkpointDownloadScriptPath: z.literal(
    'checkpoints/download_ckpts.sh',
  ),
  checkpointDownloadScriptSha256: z.literal(
    '6cb8caa8f70f40f7076029a9c858bfa4d4fdfb6c960b7943331c85432f6c2ac6',
  ),
  modelConfigPath: z.literal(
    'sam2/configs/sam2.1/sam2.1_hiera_s.yaml',
  ),
  modelConfigSha256: z.literal(
    '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55',
  ),
  checkpointRepository: z.literal(
    'https://huggingface.co/facebook/sam2.1-hiera-small',
  ),
  checkpointRepositoryRevision: z.literal(
    'ee5bba1d82bb8749febdf90f45e84b687142ba03',
  ),
  checkpointRevisionMutable: z.literal(false),
  checkpointFileName: z.literal('sam2.1_hiera_small.pt'),
  checkpointByteLength: z.literal(184_416_285),
  checkpointSha256: z.literal(
    '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
  ),
  checkpointModelCardSha256: z.literal(
    '6ec2d54879e41ad876d8cded0d641e8bc6ab74d5e095a73afc3f8406372ee6e9',
  ),
  checkpointRepositoryConfigSha256: z.literal(
    '632e5cd0104f5ab6cd4f9d2dfd80a8e7240e481ad7960a13cad2ae3504b88dbd',
  ),
  checkpointRepositoryConfigMatchesSelectedRuntimeConfig:
    z.literal(false),
  selectedRuntimeConfigSource: z.literal(
    'pinned_official_source_repository',
  ),
  nativeSam2BuilderRequired: z.literal(true),
  huggingFaceFromPretrainedRouteQualified: z.literal(false),
  officialMetaDistributionSha256Matches: z.literal(true),
  officialMetaDistributionByteLengthMatches: z.literal(true),
  officialModelParameterCountMillions: z.literal(46),
  officialA100CompiledFramesPerSecond: z.literal(84.8),
  officialBenchmarkAccelerator: z.literal('nvidia_a100'),
  officialBenchmarkTorchVersion: z.literal('2.5.1'),
  officialBenchmarkCudaVersion: z.literal('12.4'),
  googleCloudRunL4BenchmarkPerformed: z.literal(false),
  mutableReferenceAccepted: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
  sourceObservationDigestSha256: digestSchema,
}).strict()

const descriptorSchema = z.object({
  descriptorVersion: z.literal(
    CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  ),
  artifactId: z.literal('meta-sam2.1-hiera-small-checkpoint'),
  revision: z.literal(
    'ee5bba1d82bb8749febdf90f45e84b687142ba03',
  ),
  artifactFormat: z.literal('pytorch_checkpoint'),
  artifactRole: z.literal('sam2-video-segmentation-checkpoint'),
  modelFamily: z.literal('sam2.1-hiera-small'),
  byteLength: z.literal(184_416_285),
  contentSha256: z.literal(
    '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
  ),
  consumerScopes: z.tuple([
    z.literal('sam2.private-inference'),
  ]),
  repositoryAdmission: z.literal('controlled_internal_test'),
  sourceObservationDigestSha256: digestSchema,
  reviewEvidenceDigestSha256: digestSchema,
  securityReviewDigestSha256: digestSchema,
  licensePolicy: z.object({
    modelArtifactLicense: z.literal('Apache-2.0'),
    commercialUseStatus: z.literal('allowed'),
    reviewStatus: z.literal('evaluation_only'),
    redistributionAllowed: z.literal(true),
    requiresAttribution: z.literal(true),
    paidProductionUseApproved: z.literal(false),
    sourceLicenseDocumentSha256: z.literal(
      'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
    ),
    modelCardDocumentSha256: z.literal(
      '6ec2d54879e41ad876d8cded0d641e8bc6ab74d5e095a73afc3f8406372ee6e9',
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
  canonicalOrder: z.literal(0),
  slotId: z.literal('sam2_checkpoint'),
  artifactId: z.literal('meta-sam2.1-hiera-small-checkpoint'),
  revision: z.literal(
    'ee5bba1d82bb8749febdf90f45e84b687142ba03',
  ),
  artifactFormat: z.literal('pytorch_checkpoint'),
  artifactRole: z.literal('sam2-video-segmentation-checkpoint'),
  modelFamily: z.literal('sam2.1-hiera-small'),
  byteLength: z.literal(184_416_285),
  contentSha256: z.literal(
    '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
  ),
  consumerScope: z.literal('sam2.private-inference'),
  required: z.literal(true),
  requirementDigestSha256: digestSchema,
}).strict()

const boundariesSchema = z.object({
  exactImmutableUpstreamSourceObserved: z.literal(true),
  exactCheckpointIdentityObserved: z.literal(true),
  exactModelArtifactSlotDefinitionComplete: z.literal(true),
  exactRepositoryLocatorRequired: z.literal(true),
  legacyManifestTemplateStillPlaceholder: z.literal(true),
  runtimeSourceInstallQualified: z.literal(false),
  checkpointConfinedDeserializationQualified: z.literal(false),
  modelArtifactIngested: z.literal(false),
  canonicalOperationArtifactSetVerified: z.literal(false),
  privateGpuDistributionVerified: z.literal(false),
  cloudRunReadOnlyMountVerified: z.literal(false),
  cloudRunL4CudaBenchmarkVerified: z.literal(false),
  privateInputArtifactReadVerified: z.literal(false),
  privateMaskOutputArtifactVerified: z.literal(false),
  temporalMaskQaVerified: z.literal(false),
  paidProductionOwnerApproval: z.literal(false),
  sourceDownloadAuthorized: z.literal(false),
  modelArtifactIngestAuthorized: z.literal(false),
  cloudDispatchAuthorized: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  providerAuthority: z.literal(false),
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
    CANONICAL_SAM2_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  ),
  requirementSetClass: z.literal(
    'server_owned_exact_sam2_operation_model_artifact_definition',
  ),
  requirementSetId: z.literal(
    'sam2_1_hiera_small_segment_and_track_subject_internal_candidate',
  ),
  approvedToolId: z.literal('sam2'),
  approvedOperationId: z.literal(
    'tool.sam2.segment_and_track_subject.v1',
  ),
  legacyModelWeightManifestId: z.literal('sam2_checkpoint'),
  sourceObservation: sourceObservationSchema,
  descriptor: descriptorSchema,
  artifacts: z.tuple([requirementDefinitionSchema]),
  summary: z.object({
    artifactCount: z.literal(1),
    totalByteLength: z.literal(184_416_285),
    modelArtifactSlotDefinitionComplete: z.literal(true),
    runtimeSourceAndConfigQualificationStillRequired: z.literal(true),
    runtimeConfigCheckpointLoadFixtureStillRequired: z.literal(true),
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
  artifactId: z.literal('meta-sam2.1-hiera-small-checkpoint'),
  revision: z.literal(
    'ee5bba1d82bb8749febdf90f45e84b687142ba03',
  ),
  contentSha256: z.literal(
    '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
  ),
  manifestDigestSha256: digestSchema,
}).strict()

const projectionSchema = z.object({
  requirementSetDigestSha256: digestSchema,
  approvedToolId: z.literal('sam2'),
  approvedOperationId: z.literal(
    'tool.sam2.segment_and_track_subject.v1',
  ),
  consumerScope: z.literal('sam2.private-inference'),
  requirements: z.tuple([
    z.object({
      canonicalOrder: z.literal(0),
      slotId: z.literal('sam2_checkpoint'),
      locator: locatorSchema,
      expectedArtifactId: z.literal(
        'meta-sam2.1-hiera-small-checkpoint',
      ),
      expectedRevision: z.literal(
        'ee5bba1d82bb8749febdf90f45e84b687142ba03',
      ),
      expectedArtifactFormat: z.literal('pytorch_checkpoint'),
      expectedArtifactRole: z.literal(
        'sam2-video-segmentation-checkpoint',
      ),
      expectedModelFamily: z.literal('sam2.1-hiera-small'),
      expectedByteLength: z.literal(184_416_285),
      expectedContentSha256: z.literal(
        '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
      ),
      required: z.literal(true),
    }).strict(),
  ]),
  repositoryVerificationStillRequired: z.literal(true),
  canonicalOperationArtifactSetVerified: z.literal(false),
  cloudDispatchAuthorized: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  productionReady: z.literal(false),
  projectionDigestSha256: digestSchema,
}).strict()

const SOURCE_OBSERVATION_DRAFT = {
  observationVersion: CANONICAL_SAM2_SOURCE_OBSERVATION_VERSION,
  observedAt: '2026-07-27' as const,
  sourceOwner: 'Meta Platforms, Inc.' as const,
  sourceRepository:
    'https://github.com/facebookresearch/sam2' as const,
  sourceRevision:
    '2b90b9f5ceec907a1c18123530e92e794ad901a4' as const,
  sourceRevisionMutable: false as const,
  sourceLicense: 'Apache-2.0' as const,
  sourceLicenseDocumentSha256:
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4' as const,
  sourceReadmeSha256:
    'eea69ee1042fb30933c5ca5019fbf0f6f9366cec5e792109281b5023a4f1589c' as const,
  sourcePyprojectSha256:
    'c58230f78769620dcd11d15824d491b049be8f542eeb875d2e8091be797ec3f3' as const,
  checkpointDownloadScriptPath:
    'checkpoints/download_ckpts.sh' as const,
  checkpointDownloadScriptSha256:
    '6cb8caa8f70f40f7076029a9c858bfa4d4fdfb6c960b7943331c85432f6c2ac6' as const,
  modelConfigPath:
    'sam2/configs/sam2.1/sam2.1_hiera_s.yaml' as const,
  modelConfigSha256:
    '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55' as const,
  checkpointRepository:
    'https://huggingface.co/facebook/sam2.1-hiera-small' as const,
  checkpointRepositoryRevision:
    'ee5bba1d82bb8749febdf90f45e84b687142ba03' as const,
  checkpointRevisionMutable: false as const,
  checkpointFileName: 'sam2.1_hiera_small.pt' as const,
  checkpointByteLength: 184_416_285 as const,
  checkpointSha256:
    '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38' as const,
  checkpointModelCardSha256:
    '6ec2d54879e41ad876d8cded0d641e8bc6ab74d5e095a73afc3f8406372ee6e9' as const,
  checkpointRepositoryConfigSha256:
    '632e5cd0104f5ab6cd4f9d2dfd80a8e7240e481ad7960a13cad2ae3504b88dbd' as const,
  checkpointRepositoryConfigMatchesSelectedRuntimeConfig:
    false as const,
  selectedRuntimeConfigSource:
    'pinned_official_source_repository' as const,
  nativeSam2BuilderRequired: true as const,
  huggingFaceFromPretrainedRouteQualified: false as const,
  officialMetaDistributionSha256Matches: true as const,
  officialMetaDistributionByteLengthMatches: true as const,
  officialModelParameterCountMillions: 46 as const,
  officialA100CompiledFramesPerSecond: 84.8 as const,
  officialBenchmarkAccelerator: 'nvidia_a100' as const,
  officialBenchmarkTorchVersion: '2.5.1' as const,
  officialBenchmarkCudaVersion: '12.4' as const,
  googleCloudRunL4BenchmarkPerformed: false as const,
  mutableReferenceAccepted: false as const,
  runtimeDownloadAllowed: false as const,
  networkFetchAllowed: false as const,
}

const SOURCE_OBSERVATION = deepFreeze(
  sourceObservationSchema.parse({
    ...SOURCE_OBSERVATION_DRAFT,
    sourceObservationDigestSha256:
      sha256AuthorityValue(SOURCE_OBSERVATION_DRAFT),
  }),
) as CanonicalSam2SourceObservation

const REVIEW_EVIDENCE = {
  evidenceVersion: 'sam2-model-artifact-review-evidence-v1',
  disposition: 'controlled_internal_candidate',
  checkpointLicenseObserved: 'Apache-2.0',
  commercialUseUnderObservedLicense: 'allowed',
  paidProductionOwnerApproval: false,
  officialA100BenchmarkObserved: true,
  googleCloudRunL4BenchmarkObserved: false,
  maskQualityBenchmarkObserved: false,
  temporalStabilityBenchmarkObserved: false,
  sourceTruthAndContactObjectQaObserved: false,
} as const

const SECURITY_EVIDENCE = {
  evidenceVersion: 'sam2-model-artifact-security-evidence-v1',
  checkpointSerialization: 'pytorch_pickle_state_dict',
  exactTrustedServerOwnedChecksumRequired: true,
  isolatedPinnedCudaContainerRequired: true,
  unprivilegedRuntimeRequired: true,
  readOnlyRootFilesystemRequired: true,
  readOnlyModelMountRequired: true,
  networkDisabledRequired: true,
  runtimeDownloadAllowed: false,
  callerCheckpointAllowed: false,
  arbitraryPickleCheckpointAllowed: false,
  confinedDeserializationQualified: false,
} as const

const DESCRIPTOR = deepFreeze(descriptorSchema.parse({
  descriptorVersion: CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  artifactId: 'meta-sam2.1-hiera-small-checkpoint',
  revision: SOURCE_OBSERVATION.checkpointRepositoryRevision,
  artifactFormat: 'pytorch_checkpoint',
  artifactRole: 'sam2-video-segmentation-checkpoint',
  modelFamily: 'sam2.1-hiera-small',
  byteLength: SOURCE_OBSERVATION.checkpointByteLength,
  contentSha256: SOURCE_OBSERVATION.checkpointSha256,
  consumerScopes: ['sam2.private-inference'],
  repositoryAdmission: 'controlled_internal_test',
  sourceObservationDigestSha256:
    SOURCE_OBSERVATION.sourceObservationDigestSha256,
  reviewEvidenceDigestSha256:
    sha256AuthorityValue(REVIEW_EVIDENCE),
  securityReviewDigestSha256:
    sha256AuthorityValue(SECURITY_EVIDENCE),
  licensePolicy: {
    modelArtifactLicense: 'Apache-2.0',
    commercialUseStatus: 'allowed',
    reviewStatus: 'evaluation_only',
    redistributionAllowed: true,
    requiresAttribution: true,
    paidProductionUseApproved: false,
    sourceLicenseDocumentSha256:
      SOURCE_OBSERVATION.sourceLicenseDocumentSha256,
    modelCardDocumentSha256:
      SOURCE_OBSERVATION.checkpointModelCardSha256,
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

const REQUIREMENT_DRAFT = {
  canonicalOrder: 0 as const,
  slotId: 'sam2_checkpoint' as const,
  artifactId: DESCRIPTOR.artifactId,
  revision: DESCRIPTOR.revision,
  artifactFormat: DESCRIPTOR.artifactFormat,
  artifactRole: DESCRIPTOR.artifactRole,
  modelFamily: DESCRIPTOR.modelFamily,
  byteLength: DESCRIPTOR.byteLength,
  contentSha256: DESCRIPTOR.contentSha256,
  consumerScope: 'sam2.private-inference' as const,
  required: true as const,
}

const REQUIREMENT = deepFreeze(
  requirementDefinitionSchema.parse({
    ...REQUIREMENT_DRAFT,
    requirementDigestSha256:
      sha256AuthorityValue(REQUIREMENT_DRAFT),
  }),
) as CanonicalSam2ModelArtifactRequirementDefinition

const BLOCKERS = [
  'canonical_model_artifact_repository_record_not_ingested',
  'canonical_operation_gpu_bundle_not_verified',
  'google_cloud_run_l4_cuda_benchmark_not_run',
  'model_artifact_paid_production_owner_approval_missing',
  'private_input_and_mask_output_transport_not_admitted',
  'sam2_pickle_checkpoint_confined_deserialization_not_qualified',
  'sam2_runtime_config_checkpoint_load_fixture_not_passed',
  'sam2_runtime_source_install_not_qualified',
  'sam2_temporal_mask_qa_fixture_not_passed',
] as const

const BOUNDARIES = {
  exactImmutableUpstreamSourceObserved: true as const,
  exactCheckpointIdentityObserved: true as const,
  exactModelArtifactSlotDefinitionComplete: true as const,
  exactRepositoryLocatorRequired: true as const,
  legacyManifestTemplateStillPlaceholder: true as const,
  runtimeSourceInstallQualified: false as const,
  checkpointConfinedDeserializationQualified: false as const,
  modelArtifactIngested: false as const,
  canonicalOperationArtifactSetVerified: false as const,
  privateGpuDistributionVerified: false as const,
  cloudRunReadOnlyMountVerified: false as const,
  cloudRunL4CudaBenchmarkVerified: false as const,
  privateInputArtifactReadVerified: false as const,
  privateMaskOutputArtifactVerified: false as const,
  temporalMaskQaVerified: false as const,
  paidProductionOwnerApproval: false as const,
  sourceDownloadAuthorized: false as const,
  modelArtifactIngestAuthorized: false as const,
  cloudDispatchAuthorized: false as const,
  modelInferenceAuthority: false as const,
  providerAuthority: false as const,
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
    CANONICAL_SAM2_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  requirementSetClass:
    'server_owned_exact_sam2_operation_model_artifact_definition' as const,
  requirementSetId:
    'sam2_1_hiera_small_segment_and_track_subject_internal_candidate' as const,
  approvedToolId: 'sam2' as const,
  approvedOperationId:
    'tool.sam2.segment_and_track_subject.v1' as const,
  legacyModelWeightManifestId: 'sam2_checkpoint' as const,
  sourceObservation: SOURCE_OBSERVATION,
  descriptor: DESCRIPTOR,
  artifacts: [REQUIREMENT] as const,
  summary: {
    artifactCount: 1 as const,
    totalByteLength: 184_416_285 as const,
    modelArtifactSlotDefinitionComplete: true as const,
    runtimeSourceAndConfigQualificationStillRequired: true as const,
    runtimeConfigCheckpointLoadFixtureStillRequired: true as const,
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
) as CanonicalSam2ModelArtifactRequirementSet

assertCanonicalRegistryCompatibility()

export function getCanonicalSam2ModelArtifactRequirementSet():
CanonicalSam2ModelArtifactRequirementSet {
  return REQUIREMENT_SET
}

export function assertCanonicalSam2ModelArtifactRequirementSet(
  value: unknown,
): CanonicalSam2ModelArtifactRequirementSet {
  const parsed = requirementSetSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('sam2_model_artifact_requirement_set_invalid')
  }
  const { requirementSetDigestSha256, ...draft } = parsed.data
  if (
    requirementSetDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.data.sourceObservation.sourceObservationDigestSha256
      !== sha256AuthorityValue(SOURCE_OBSERVATION_DRAFT)
    || parsed.data.artifacts[0].requirementDigestSha256
      !== sha256AuthorityValue(REQUIREMENT_DRAFT)
    || stableAuthorityStringify(parsed.data)
      !== stableAuthorityStringify(REQUIREMENT_SET)
  ) {
    throw blocked('sam2_model_artifact_requirement_set_mismatch')
  }
  return REQUIREMENT_SET
}

export function projectCanonicalSam2GpuBundleRequirements(
  input: CanonicalSam2GpuBundleRequirementProjectionInput,
): CanonicalSam2GpuBundleRequirementProjection {
  const requirementSet =
    assertCanonicalSam2ModelArtifactRequirementSet(
      input.requirementSet,
    )
  const locator = locatorSchema.safeParse(input.locator)
  if (!locator.success) {
    throw invalid('sam2_model_artifact_locator_invalid')
  }
  const requirement = requirementSet.artifacts[0]
  const draft = {
    requirementSetDigestSha256:
      requirementSet.requirementSetDigestSha256,
    approvedToolId: requirementSet.approvedToolId,
    approvedOperationId: requirementSet.approvedOperationId,
    consumerScope: requirement.consumerScope,
    requirements: [{
      canonicalOrder: requirement.canonicalOrder,
      slotId: requirement.slotId,
      locator: locator.data,
      expectedArtifactId: requirement.artifactId,
      expectedRevision: requirement.revision,
      expectedArtifactFormat: requirement.artifactFormat,
      expectedArtifactRole: requirement.artifactRole,
      expectedModelFamily: requirement.modelFamily,
      expectedByteLength: requirement.byteLength,
      expectedContentSha256: requirement.contentSha256,
      required: true as const,
    }] as const,
    repositoryVerificationStillRequired: true as const,
    canonicalOperationArtifactSetVerified: false as const,
    cloudDispatchAuthorized: false as const,
    modelInferenceAuthority: false as const,
    productionReady: false as const,
  }
  return deepFreeze(projectionSchema.parse({
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  })) as CanonicalSam2GpuBundleRequirementProjection
}

export function assertCanonicalSam2GpuBundleRequirementProjection(
  value: unknown,
): CanonicalSam2GpuBundleRequirementProjection {
  const parsed = projectionSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('sam2_gpu_bundle_requirement_projection_invalid')
  }
  const { projectionDigestSha256, ...draft } = parsed.data
  if (
    projectionDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.data.requirementSetDigestSha256
      !== REQUIREMENT_SET.requirementSetDigestSha256
  ) {
    throw blocked('sam2_gpu_bundle_requirement_projection_mismatch')
  }
  return deepFreeze(
    parsed.data,
  ) as CanonicalSam2GpuBundleRequirementProjection
}

function assertCanonicalRegistryCompatibility(): void {
  const profile = getNonE2EToolCapabilityProfile('sam2')
  if (
    !profile
    || profile.workerType !== 'gpu_ai_worker'
    || profile.gpuRequired !== true
    || profile.cpuAllowed !== false
    || profile.modelWeightsRequired !== true
  ) {
    throw new Error(
      'non-E2E SAM2 capability profile drifted',
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
