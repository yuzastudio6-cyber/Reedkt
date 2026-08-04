import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  getGpuModelWeightManifestTemplate,
} from '../model-weights'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getProductionToolProfile,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-registry'
import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
} from './canonical-model-artifact-types'
import {
  CANONICAL_REMBG_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  CANONICAL_REMBG_SOURCE_OBSERVATION_VERSION,
  type CanonicalRembgGpuBundleRequirementProjection,
  type CanonicalRembgGpuBundleRequirementProjectionInput,
  type CanonicalRembgModelArtifactRequirementDefinition,
  type CanonicalRembgModelArtifactRequirementSet,
  type CanonicalRembgSourceObservation,
} from './canonical-rembg-model-artifact-requirement-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN =
  /^model-artifact-[a-f0-9]{64}$/u
const SAFE_ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const sourceObservationSchema = z.object({
  observationVersion: z.literal(
    CANONICAL_REMBG_SOURCE_OBSERVATION_VERSION,
  ),
  observedAt: z.literal('2026-07-28'),
  rembgSourceRepository: z.literal(
    'https://github.com/danielgatis/rembg',
  ),
  rembgSourceRevision: z.literal(
    '98f3a9fa5397f03a3101cbdb0c7d7b51f4e95bbb',
  ),
  rembgSourceRevisionMutable: z.literal(false),
  rembgPackageVersion: z.literal('2.0.76'),
  rembgLicense: z.literal('MIT'),
  rembgLicenseDocumentSha256: z.literal(
    '90a3215072968fd304669c5389f04f1274a587abdd0507d99dead0f5511f8999',
  ),
  rembgReadmeSha256: z.literal(
    'ef67d0afa50bc139e3e9af511c6b48160ddab436c846443f85d7531d5d0ebcc3',
  ),
  rembgU2netpSourcePath: z.literal(
    'rembg/sessions/u2netp.py',
  ),
  rembgU2netpSourceSha256: z.literal(
    'f0f0f344f5bb19505ab3570d226a73512f99ff28b021d563247776a44969b501',
  ),
  u2netSourceRepository: z.literal(
    'https://github.com/xuebinqin/U-2-Net',
  ),
  u2netSourceRevision: z.literal(
    'ac7e1c817ecab7c7dff5ce6b1abba61cd213ff29',
  ),
  u2netSourceRevisionMutable: z.literal(false),
  u2netLicense: z.literal('Apache-2.0'),
  u2netLicenseDocumentSha256: z.literal(
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
  ),
  u2netReadmeSha256: z.literal(
    '2dda6120b8fde9efc40f342db96087c1827b8657f98bb16b668ebe3c34f66c8f',
  ),
  modelReleaseTag: z.literal('v0.0.0'),
  modelReleaseFile: z.literal('u2netp.onnx'),
  modelByteLength: z.literal(4_574_861),
  modelSha256: z.literal(
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  ),
  rembgDeclaredModelMd5: z.literal(
    '8e83ca70e441ab06c318d82300c84806',
  ),
  rembgModelInputWidth: z.literal(320),
  rembgModelInputHeight: z.literal(320),
  outputDimensionsMatchSource: z.literal(true),
  googleCloudRunL4BenchmarkPerformed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
  sourceObservationDigestSha256: digestSchema,
}).strict()

const licensePolicySchema = z.object({
  modelArtifactLicense: z.literal('Apache-2.0'),
  commercialUseStatus: z.literal('needs_review'),
  reviewStatus: z.literal('evaluation_only'),
  redistributionAllowed: z.literal(false),
  requiresAttribution: z.literal(true),
  paidProductionUseApproved: z.literal(false),
  sourceLicenseDocumentSha256: z.literal(
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
  ),
  modelCardDocumentSha256: z.literal(
    '2dda6120b8fde9efc40f342db96087c1827b8657f98bb16b668ebe3c34f66c8f',
  ),
}).strict()

const descriptorSchema = z.object({
  descriptorVersion: z.literal(
    CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  ),
  artifactId: z.literal('rembg-u2netp-onnx'),
  revision: z.literal(
    'rembg-v0.0.0-u2netp-309c8469258d',
  ),
  artifactFormat: z.literal('onnx'),
  artifactRole: z.literal(
    'rembg-u2netp-background-removal-onnx',
  ),
  modelFamily: z.literal('u2netp'),
  byteLength: z.literal(4_574_861),
  contentSha256: z.literal(
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  ),
  consumerScopes: z.tuple([
    z.literal('rembg.private-inference'),
  ]),
  repositoryAdmission: z.literal('controlled_internal_test'),
  sourceObservationDigestSha256: digestSchema,
  reviewEvidenceDigestSha256: digestSchema,
  securityReviewDigestSha256: digestSchema,
  licensePolicy: licensePolicySchema,
  executionPolicy: z.object({
    executionClass: z.literal('gpu_required'),
    requiredExecutionTarget: z.literal(
      'google_cloud_run_gpu',
    ),
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
  slotId: z.literal('rembg_u2netp_onnx'),
  artifactId: z.literal('rembg-u2netp-onnx'),
  revision: z.literal(
    'rembg-v0.0.0-u2netp-309c8469258d',
  ),
  artifactFormat: z.literal('onnx'),
  artifactRole: z.literal(
    'rembg-u2netp-background-removal-onnx',
  ),
  modelFamily: z.literal('u2netp'),
  byteLength: z.literal(4_574_861),
  contentSha256: z.literal(
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  ),
  consumerScope: z.literal('rembg.private-inference'),
  required: z.literal(true),
  requirementDigestSha256: digestSchema,
}).strict()

const boundariesSchema = z.object({
  exactImmutableUpstreamSourceObserved: z.literal(true),
  exactModelIdentityObserved: z.literal(true),
  exactModelArtifactSlotDefinitionComplete: z.literal(true),
  exactRepositoryLocatorRequired: z.literal(true),
  legacyManifestTemplateStillPlaceholder: z.literal(true),
  existingCpuFixtureProductionAuthority: z.literal(false),
  dependencyLockedCudaRuntimeQualified: z.literal(false),
  modelArtifactIngested: z.literal(false),
  canonicalOperationArtifactSetVerified: z.literal(false),
  privateGpuDistributionVerified: z.literal(false),
  cloudRunReadOnlyMountVerified: z.literal(false),
  cloudRunL4CudaBenchmarkVerified: z.literal(false),
  privateSourceFrameArtifactReadVerified: z.literal(false),
  privateMaskOutputArtifactVerified: z.literal(false),
  maskQaVerified: z.literal(false),
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
    CANONICAL_REMBG_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  ),
  requirementSetClass: z.literal(
    'server_owned_exact_rembg_operation_model_artifact_definition',
  ),
  requirementSetId: z.literal(
    'rembg_u2netp_mask_only_internal_candidate',
  ),
  approvedToolId: z.literal('rembg'),
  approvedOperationId: z.literal(
    'tool.rembg.remove_image_background.v1',
  ),
  legacyModelWeightManifestId: z.literal(
    'rembg_u2netp_model',
  ),
  sourceObservation: sourceObservationSchema,
  descriptor: descriptorSchema,
  artifacts: z.tuple([requirementDefinitionSchema]),
  summary: z.object({
    artifactCount: z.literal(1),
    totalByteLength: z.literal(4_574_861),
    modelArtifactSlotDefinitionComplete: z.literal(true),
    exactModelBytesPreviouslyObserved: z.literal(true),
    dependencyLockedCudaRuntimeStillRequired: z.literal(true),
    maskOnlySourceFrameFixtureStillRequired: z.literal(true),
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
      (value, index) =>
        index === 0 || values[index - 1]! < value,
    )),
  boundaries: boundariesSchema,
  requirementSetDigestSha256: digestSchema,
}).strict()

const locatorSchema = z.object({
  locatorVersion: z.literal(
    'canonical-model-artifact-locator-v1',
  ),
  artifactRecordId: z.string().regex(ARTIFACT_RECORD_PATTERN),
  artifactId: z.literal('rembg-u2netp-onnx'),
  revision: z.literal(
    'rembg-v0.0.0-u2netp-309c8469258d',
  ),
  contentSha256: z.literal(
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  ),
  manifestDigestSha256: digestSchema,
}).strict()

const gpuRequirementSchema = z.object({
  canonicalOrder: z.literal(0),
  slotId: z.literal('rembg_u2netp_onnx'),
  locator: locatorSchema,
  expectedArtifactId: z.literal('rembg-u2netp-onnx'),
  expectedRevision: z.literal(
    'rembg-v0.0.0-u2netp-309c8469258d',
  ),
  expectedArtifactFormat: z.literal('onnx'),
  expectedArtifactRole: z.literal(
    'rembg-u2netp-background-removal-onnx',
  ),
  expectedModelFamily: z.literal('u2netp'),
  expectedByteLength: z.literal(4_574_861),
  expectedContentSha256: z.literal(
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  ),
  required: z.literal(true),
}).strict()

const projectionSchema = z.object({
  requirementSetDigestSha256: digestSchema,
  approvedToolId: z.literal('rembg'),
  approvedOperationId: z.literal(
    'tool.rembg.remove_image_background.v1',
  ),
  consumerScope: z.literal('rembg.private-inference'),
  requirements: z.tuple([gpuRequirementSchema]),
  repositoryVerificationStillRequired: z.literal(true),
  canonicalOperationArtifactSetVerified: z.literal(false),
  cloudDispatchAuthorized: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  productionReady: z.literal(false),
  projectionDigestSha256: digestSchema,
}).strict()

const SOURCE_OBSERVATION_DRAFT = {
  observationVersion:
    CANONICAL_REMBG_SOURCE_OBSERVATION_VERSION,
  observedAt: '2026-07-28' as const,
  rembgSourceRepository:
    'https://github.com/danielgatis/rembg' as const,
  rembgSourceRevision:
    '98f3a9fa5397f03a3101cbdb0c7d7b51f4e95bbb' as const,
  rembgSourceRevisionMutable: false as const,
  rembgPackageVersion: '2.0.76' as const,
  rembgLicense: 'MIT' as const,
  rembgLicenseDocumentSha256:
    '90a3215072968fd304669c5389f04f1274a587abdd0507d99dead0f5511f8999' as const,
  rembgReadmeSha256:
    'ef67d0afa50bc139e3e9af511c6b48160ddab436c846443f85d7531d5d0ebcc3' as const,
  rembgU2netpSourcePath:
    'rembg/sessions/u2netp.py' as const,
  rembgU2netpSourceSha256:
    'f0f0f344f5bb19505ab3570d226a73512f99ff28b021d563247776a44969b501' as const,
  u2netSourceRepository:
    'https://github.com/xuebinqin/U-2-Net' as const,
  u2netSourceRevision:
    'ac7e1c817ecab7c7dff5ce6b1abba61cd213ff29' as const,
  u2netSourceRevisionMutable: false as const,
  u2netLicense: 'Apache-2.0' as const,
  u2netLicenseDocumentSha256:
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4' as const,
  u2netReadmeSha256:
    '2dda6120b8fde9efc40f342db96087c1827b8657f98bb16b668ebe3c34f66c8f' as const,
  modelReleaseTag: 'v0.0.0' as const,
  modelReleaseFile: 'u2netp.onnx' as const,
  modelByteLength: 4_574_861 as const,
  modelSha256:
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' as const,
  rembgDeclaredModelMd5:
    '8e83ca70e441ab06c318d82300c84806' as const,
  rembgModelInputWidth: 320 as const,
  rembgModelInputHeight: 320 as const,
  outputDimensionsMatchSource: true as const,
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
) as CanonicalRembgSourceObservation

const REVIEW_EVIDENCE = {
  evidenceVersion:
    'rembg-u2netp-model-artifact-review-evidence-v1',
  disposition: 'controlled_internal_candidate',
  rembgPackageLicenseObserved: 'MIT',
  u2netUpstreamLicenseObserved: 'Apache-2.0',
  exactModelSha256AndByteLengthObserved: true,
  commercialUseReviewComplete: false,
  redistributionReviewComplete: false,
  paidProductionOwnerApproval: false,
  googleCloudRunL4BenchmarkObserved: false,
  maskQualityBenchmarkObserved: false,
} as const

const SECURITY_EVIDENCE = {
  evidenceVersion:
    'rembg-u2netp-model-artifact-security-evidence-v1',
  modelSerialization: 'onnx',
  exactTrustedServerOwnedChecksumRequired: true,
  isolatedPinnedCudaContainerRequired: true,
  unprivilegedRuntimeRequired: true,
  readOnlyRootFilesystemRequired: true,
  readOnlyModelMountRequired: true,
  networkDisabledRequired: true,
  runtimeDownloadAllowed: false,
  callerModelAllowed: false,
  dependencyLockQualified: false,
  onnxCudaProviderLoadQualified: false,
} as const

const DESCRIPTOR = deepFreeze(descriptorSchema.parse({
  descriptorVersion:
    CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  artifactId: 'rembg-u2netp-onnx',
  revision: 'rembg-v0.0.0-u2netp-309c8469258d',
  artifactFormat: 'onnx',
  artifactRole: 'rembg-u2netp-background-removal-onnx',
  modelFamily: 'u2netp',
  byteLength: SOURCE_OBSERVATION.modelByteLength,
  contentSha256: SOURCE_OBSERVATION.modelSha256,
  consumerScopes: ['rembg.private-inference'],
  repositoryAdmission: 'controlled_internal_test',
  sourceObservationDigestSha256:
    SOURCE_OBSERVATION.sourceObservationDigestSha256,
  reviewEvidenceDigestSha256:
    sha256AuthorityValue(REVIEW_EVIDENCE),
  securityReviewDigestSha256:
    sha256AuthorityValue(SECURITY_EVIDENCE),
  licensePolicy: {
    modelArtifactLicense: 'Apache-2.0',
    commercialUseStatus: 'needs_review',
    reviewStatus: 'evaluation_only',
    redistributionAllowed: false,
    requiresAttribution: true,
    paidProductionUseApproved: false,
    sourceLicenseDocumentSha256:
      SOURCE_OBSERVATION.u2netLicenseDocumentSha256,
    modelCardDocumentSha256:
      SOURCE_OBSERVATION.u2netReadmeSha256,
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
  slotId: 'rembg_u2netp_onnx' as const,
  artifactId: DESCRIPTOR.artifactId,
  revision: DESCRIPTOR.revision,
  artifactFormat: DESCRIPTOR.artifactFormat,
  artifactRole: DESCRIPTOR.artifactRole,
  modelFamily: DESCRIPTOR.modelFamily,
  byteLength: DESCRIPTOR.byteLength,
  contentSha256: DESCRIPTOR.contentSha256,
  consumerScope: 'rembg.private-inference' as const,
  required: true as const,
}

const REQUIREMENT = deepFreeze(
  requirementDefinitionSchema.parse({
    ...REQUIREMENT_DRAFT,
    requirementDigestSha256:
      sha256AuthorityValue(REQUIREMENT_DRAFT),
  }),
) as CanonicalRembgModelArtifactRequirementDefinition

const BLOCKERS = [
  'canonical_model_artifact_repository_record_not_ingested',
  'canonical_operation_gpu_bundle_not_verified',
  'google_cloud_run_l4_cuda_benchmark_not_run',
  'model_artifact_paid_production_owner_approval_missing',
  'private_source_frame_and_mask_output_transport_not_admitted',
  'rembg_cuda_dependency_lock_not_qualified',
  'rembg_mask_only_source_frame_fixture_not_passed',
  'rembg_onnx_cuda_provider_load_not_verified',
] as const

const BOUNDARIES = {
  exactImmutableUpstreamSourceObserved: true as const,
  exactModelIdentityObserved: true as const,
  exactModelArtifactSlotDefinitionComplete: true as const,
  exactRepositoryLocatorRequired: true as const,
  legacyManifestTemplateStillPlaceholder: true as const,
  existingCpuFixtureProductionAuthority: false as const,
  dependencyLockedCudaRuntimeQualified: false as const,
  modelArtifactIngested: false as const,
  canonicalOperationArtifactSetVerified: false as const,
  privateGpuDistributionVerified: false as const,
  cloudRunReadOnlyMountVerified: false as const,
  cloudRunL4CudaBenchmarkVerified: false as const,
  privateSourceFrameArtifactReadVerified: false as const,
  privateMaskOutputArtifactVerified: false as const,
  maskQaVerified: false as const,
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
    CANONICAL_REMBG_MODEL_ARTIFACT_REQUIREMENT_SET_VERSION,
  requirementSetClass:
    'server_owned_exact_rembg_operation_model_artifact_definition' as const,
  requirementSetId:
    'rembg_u2netp_mask_only_internal_candidate' as const,
  approvedToolId: 'rembg' as const,
  approvedOperationId:
    'tool.rembg.remove_image_background.v1' as const,
  legacyModelWeightManifestId:
    'rembg_u2netp_model' as const,
  sourceObservation: SOURCE_OBSERVATION,
  descriptor: DESCRIPTOR,
  artifacts: [REQUIREMENT] as const,
  summary: {
    artifactCount: 1 as const,
    totalByteLength: 4_574_861 as const,
    modelArtifactSlotDefinitionComplete: true as const,
    exactModelBytesPreviouslyObserved: true as const,
    dependencyLockedCudaRuntimeStillRequired: true as const,
    maskOnlySourceFrameFixtureStillRequired: true as const,
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
) as CanonicalRembgModelArtifactRequirementSet

assertCanonicalRegistryCompatibility()

export function getCanonicalRembgModelArtifactRequirementSet():
CanonicalRembgModelArtifactRequirementSet {
  return REQUIREMENT_SET
}

export function assertCanonicalRembgModelArtifactRequirementSet(
  value: unknown,
): CanonicalRembgModelArtifactRequirementSet {
  const parsed = requirementSetSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('rembg_model_artifact_requirement_set_invalid')
  }
  const { requirementSetDigestSha256, ...draft } = parsed.data
  if (
    requirementSetDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.data.sourceObservation
      .sourceObservationDigestSha256
      !== sha256AuthorityValue(SOURCE_OBSERVATION_DRAFT)
    || parsed.data.artifacts[0].requirementDigestSha256
      !== sha256AuthorityValue(REQUIREMENT_DRAFT)
    || stableAuthorityStringify(parsed.data)
      !== stableAuthorityStringify(REQUIREMENT_SET)
  ) {
    throw blocked('rembg_model_artifact_requirement_set_mismatch')
  }
  return REQUIREMENT_SET
}

export function projectCanonicalRembgGpuBundleRequirements(
  input: CanonicalRembgGpuBundleRequirementProjectionInput,
): CanonicalRembgGpuBundleRequirementProjection {
  const requirementSet =
    assertCanonicalRembgModelArtifactRequirementSet(
      input.requirementSet,
    )
  const locator = locatorSchema.safeParse(input.locator)
  if (!locator.success) {
    throw invalid('rembg_model_artifact_locator_invalid')
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
  })) as CanonicalRembgGpuBundleRequirementProjection
}

export function assertCanonicalRembgGpuBundleRequirementProjection(
  value: unknown,
): CanonicalRembgGpuBundleRequirementProjection {
  const parsed = projectionSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'rembg_gpu_bundle_requirement_projection_invalid',
    )
  }
  const { projectionDigestSha256, ...draft } = parsed.data
  const requirement = REQUIREMENT_SET.artifacts[0]
  const projected = parsed.data.requirements[0]
  if (
    projectionDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.data.requirementSetDigestSha256
      !== REQUIREMENT_SET.requirementSetDigestSha256
    || stableAuthorityStringify(projected)
      !== stableAuthorityStringify({
        canonicalOrder: requirement.canonicalOrder,
        slotId: requirement.slotId,
        locator: projected.locator,
        expectedArtifactId: requirement.artifactId,
        expectedRevision: requirement.revision,
        expectedArtifactFormat: requirement.artifactFormat,
        expectedArtifactRole: requirement.artifactRole,
        expectedModelFamily: requirement.modelFamily,
        expectedByteLength: requirement.byteLength,
        expectedContentSha256: requirement.contentSha256,
        required: true,
      })
  ) {
    throw blocked(
      'rembg_gpu_bundle_requirement_projection_mismatch',
    )
  }
  return deepFreeze(
    parsed.data,
  ) as CanonicalRembgGpuBundleRequirementProjection
}

function assertCanonicalRegistryCompatibility(): void {
  const profile = getProductionToolProfile('rembg')
  const operation =
    resolveProfessionalToolOperationSpec('rembg')
  const legacyManifest =
    getGpuModelWeightManifestTemplate('rembg_u2netp_model')
  if (
    !profile
    || profile.workerType !== 'gpu_ai_worker'
    || profile.gpuRequired !== true
    || profile.cpuAllowed !== false
    || profile.modelWeightsRequired !== true
    || !operation
    || operation.canonicalToolId !== 'rembg'
    || operation.allowedOperationIds.length !== 1
    || operation.allowedOperationIds[0]
      !== 'tool.rembg.remove_image_background.v1'
    || operation.workerRuntime.runtimeClass
      !== 'python3_cuda12_gpu_worker'
    || !legacyManifest
    || legacyManifest.toolId !== 'rembg'
    || legacyManifest.reviewStatus !== 'needs_review'
    || legacyManifest.commercialUseAllowed !== false
  ) {
    throw new Error(
      'canonical rembg registry or legacy model-weight boundary drifted',
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
