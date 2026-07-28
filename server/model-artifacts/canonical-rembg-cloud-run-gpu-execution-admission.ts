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
  CANONICAL_REMBG_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
  type CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput,
  type CanonicalRembgCloudRunGpuExecutionAdmissionCandidate,
  type CanonicalRembgCloudRunGpuExecutionAdmissionCandidateInput,
  type CanonicalRembgOperationSettings,
  type CanonicalRembgSourceFrameExpectation,
  type CanonicalRembgSourceFrameExpectationInput,
} from './canonical-rembg-cloud-run-gpu-execution-admission-types'
import {
  assertCanonicalRembgGpuBundleRequirementProjection,
  assertCanonicalRembgModelArtifactRequirementSet,
} from './canonical-rembg-model-artifact-requirements'
import {
  assertCanonicalRembgExactSourceFrameArtifactBinding,
} from './canonical-rembg-exact-source-frame-artifact-binding'
import {
  CANONICAL_REMBG_MAXIMUM_FRAME_DIMENSION,
  canonicalRembgSourceFrameExpectationInputSchema,
  canonicalRembgSourceFrameExpectationSchema,
} from './canonical-rembg-source-frame-expectation-schema'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN =
  /^model-artifact-[a-f0-9]{64}$/u
const SAFE_ID_PATTERN =
  /^[A-Za-z][A-Za-z0-9_-]{7,159}$/u

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const operationSettingsSchema = z.object({
  device: z.literal('cuda'),
  modelId: z.literal('u2netp'),
  outputMode: z.literal('mask_only_png'),
  confidenceThreshold: z.literal(0.5),
  alphaMatteMode: z.literal('straight'),
  edgeRefinementProfileId: z.literal(
    'approved_u2netp_default_v1',
  ),
  maximumSubjects: z.literal(1),
  preserveSourceDimensions: z.literal(true),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
}).strict()

const expectedOutputsSchema = z.tuple([
  z.object({
    canonicalOrder: z.literal(0),
    artifactKind: z.literal('mask_image'),
    contentType: z.literal('image/png'),
    encodingProfile: z.literal(
      'gray8_or_rgba_alpha_mask_png_v1',
    ),
    dimensionsMustMatchSourceFrame: z.literal(true),
    trueAlphaOrMaskVariationRequired: z.literal(true),
    privateArtifactRequired: z.literal(true),
  }).strict(),
])

const processBoundEvidenceReceiptsSchema = z.tuple([
  z.object({
    canonicalOrder: z.literal(0),
    evidenceKind: z.literal('mask_analysis_receipt'),
    encodingProfile: z.literal(
      'rembg_u2netp_mask_analysis_receipt_v1',
    ),
    digestOnly: z.literal(true),
    persistedAsCustomerAsset: z.literal(false),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(1),
    evidenceKind: z.literal('mask_qa_measurement_receipt'),
    encodingProfile: z.literal(
      'rembg_mask_qa_measurement_receipt_v1',
    ),
    digestOnly: z.literal(true),
    persistedAsCustomerAsset: z.literal(false),
  }).strict(),
])

const boundariesSchema = z.object({
  candidateOnly: z.literal(true),
  exactFiftyToolRegistryPreserved: z.literal(true),
  canonicalOperationArtifactSetVerified: z.literal(false),
  freshRepositoryByteRehashRequired: z.literal(true),
  approvedPackageRereadRequired: z.literal(true),
  approvedSnapshotRereadRequired: z.literal(true),
  workerLeaseRereadRequired: z.literal(true),
  sourceMediaArtifactRereadRequired: z.literal(true),
  sourceFrameExtractionArtifactAdmissionVerified:
    z.literal(true),
  sourceFrameExtractionArtifactRereadRequired: z.literal(true),
  cloudRunReadOnlyModelMountVerified: z.literal(false),
  cloudRunCudaRuntimeImageVerified: z.literal(false),
  cloudRunL4CudaBenchmarkVerified: z.literal(false),
  dependencyLockVerified: z.literal(false),
  onnxCudaProviderLoadVerified: z.literal(false),
  u2netpInferenceVerified: z.literal(false),
  privateMaskOutputArtifactVerified: z.literal(false),
  maskQaVerified: z.literal(false),
  paidProductionOwnerApproval: z.literal(false),
  existingCpuFixtureProductionAuthority: z.literal(false),
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
    CANONICAL_REMBG_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
  ),
  admissionClass: z.literal(
    'controlled_non_executable_rembg_gpu_source_frame_preflight',
  ),
  admissionId: z.string().regex(
    /^rembg_gpu_preflight_[a-f0-9]{32}$/u,
  ),
  identity: z.object({
    approvedToolId: z.literal('rembg'),
    approvedOperationId: z.literal(
      'tool.rembg.remove_image_background.v1',
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
    modelManifestId: safeIdSchema,
    sourceFrameArtifactBindingDigestSha256: digestSchema,
    operationRequestDigestSha256: digestSchema,
  }).strict(),
  modelArtifactBinding: z.object({
    artifactCount: z.literal(1),
    slotId: z.literal('rembg_u2netp_onnx'),
    artifactRecordId: z.string().regex(
      ARTIFACT_RECORD_PATTERN,
    ),
    artifactId: z.literal('rembg-u2netp-onnx'),
    revision: z.literal(
      'rembg-v0.0.0-u2netp-309c8469258d',
    ),
    modelFamily: z.literal('u2netp'),
    byteLength: z.literal(4_574_861),
    contentSha256: z.literal(
      '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
    ),
    consumerScope: z.literal('rembg.private-inference'),
    executionTarget: z.literal('google_cloud_run_gpu'),
    cloudRunAccelerator: z.literal('nvidia_l4'),
    modelAccelerator: z.literal('cuda'),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  source: canonicalRembgSourceFrameExpectationSchema,
  settings: operationSettingsSchema,
  expectedOutputs: expectedOutputsSchema,
  processBoundEvidenceReceipts:
    processBoundEvidenceReceiptsSchema,
  requiredQaGates: z.tuple([
    z.literal('mask_edge_quality'),
    z.literal('mask_subject_coverage'),
  ]),
  summary: z.object({
    exactModelArtifactIdentityMatched: z.literal(true),
    exactCloudRunGpuAttemptIdentityMatched: z.literal(true),
    exactSourceMediaAndFrameLineageMatched: z.literal(true),
    exactCanonicalSourceFrameExtractionArtifactMatched:
      z.literal(true),
    exactGpuOnlySettingsMatched: z.literal(true),
    exactSingleMaskArtifactAndProcessEvidenceContractDeclared:
      z.literal(true),
    sourceMasterFrameIndex: z.number().int().min(0),
    sourceFrameIndex: z.number().int().min(0),
    frameWidth: z.number().int().min(1)
      .max(CANONICAL_REMBG_MAXIMUM_FRAME_DIMENSION),
    frameHeight: z.number().int().min(1)
      .max(CANONICAL_REMBG_MAXIMUM_FRAME_DIMENSION),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  blockers: z.array(z.string().regex(
    /^[a-z][a-z0-9_]{7,159}$/u,
  )).min(1).max(32)
    .refine((values) => new Set(values).size === values.length)
    .refine((values) => values.every(
      (value, index) =>
        index === 0 || values[index - 1]! < value,
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
  'mask_artifact_qa_and_reconciliation_not_verified',
  'rembg_cuda_dependency_lock_not_qualified',
  'rembg_model_paid_production_approval_missing',
  'rembg_onnx_cuda_provider_load_not_verified',
] as const

const BOUNDARIES = {
  candidateOnly: true as const,
  exactFiftyToolRegistryPreserved: true as const,
  canonicalOperationArtifactSetVerified: false as const,
  freshRepositoryByteRehashRequired: true as const,
  approvedPackageRereadRequired: true as const,
  approvedSnapshotRereadRequired: true as const,
  workerLeaseRereadRequired: true as const,
  sourceMediaArtifactRereadRequired: true as const,
  sourceFrameExtractionArtifactAdmissionVerified:
    true as const,
  sourceFrameExtractionArtifactRereadRequired: true as const,
  cloudRunReadOnlyModelMountVerified: false as const,
  cloudRunCudaRuntimeImageVerified: false as const,
  cloudRunL4CudaBenchmarkVerified: false as const,
  dependencyLockVerified: false as const,
  onnxCudaProviderLoadVerified: false as const,
  u2netpInferenceVerified: false as const,
  privateMaskOutputArtifactVerified: false as const,
  maskQaVerified: false as const,
  paidProductionOwnerApproval: false as const,
  existingCpuFixtureProductionAuthority: false as const,
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
    artifactKind: 'mask_image' as const,
    contentType: 'image/png' as const,
    encodingProfile:
      'gray8_or_rgba_alpha_mask_png_v1' as const,
    dimensionsMustMatchSourceFrame: true as const,
    trueAlphaOrMaskVariationRequired: true as const,
    privateArtifactRequired: true as const,
  },
] as const

const PROCESS_BOUND_EVIDENCE_RECEIPTS = [
  {
    canonicalOrder: 0 as const,
    evidenceKind: 'mask_analysis_receipt' as const,
    encodingProfile:
      'rembg_u2netp_mask_analysis_receipt_v1' as const,
    digestOnly: true as const,
    persistedAsCustomerAsset: false as const,
  },
  {
    canonicalOrder: 1 as const,
    evidenceKind:
      'mask_qa_measurement_receipt' as const,
    encodingProfile:
      'rembg_mask_qa_measurement_receipt_v1' as const,
    digestOnly: true as const,
    persistedAsCustomerAsset: false as const,
  },
] as const

const REQUIRED_QA_GATES = [
  'mask_edge_quality',
  'mask_subject_coverage',
] as const

export function createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate(
  input: CanonicalRembgCloudRunGpuExecutionAdmissionCandidateInput,
): CanonicalRembgCloudRunGpuExecutionAdmissionCandidate {
  const requirementSet =
    assertCanonicalRembgModelArtifactRequirementSet(
      input.requirementSet,
    )
  const projection =
    assertCanonicalRembgGpuBundleRequirementProjection(
      input.requirementProjection,
    )
  const gpuBundle = assertExactRembgGpuBundle(input.gpuBundle)
  const sourceArtifactBinding =
    assertCanonicalRembgExactSourceFrameArtifactBinding(
      input.sourceArtifactBinding,
    )
  const source = createSourceExpectation(
    sourceArtifactBinding.source,
  )
  const operation = parseExactOperationRequest({
    value: input.operationRequest,
    source,
    projection,
  })
  assertParentLineage({
    requirementSet,
    projection,
    gpuBundle,
  })
  const artifact = gpuBundle.artifacts[0]!
  const settings = operationSettings()
  const draft = {
    admissionVersion:
      CANONICAL_REMBG_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION,
    admissionClass:
      'controlled_non_executable_rembg_gpu_source_frame_preflight' as const,
    admissionId: admissionIdFor({
      requirementSetDigestSha256:
        requirementSet.requirementSetDigestSha256,
      requirementProjectionDigestSha256:
        projection.projectionDigestSha256,
      gpuBundleDigestSha256:
        gpuBundle.bundleDigestSha256,
      sourceFrameExpectationDigestSha256:
        source.sourceFrameExpectationDigestSha256,
      sourceFrameArtifactBindingDigestSha256:
        sourceArtifactBinding.bindingDigestSha256,
      operationRequestDigestSha256:
        operation.operationRequestDigestSha256,
    }),
    identity: {
      approvedToolId: 'rembg' as const,
      approvedOperationId:
        'tool.rembg.remove_image_background.v1' as const,
      requirementSetDigestSha256:
        requirementSet.requirementSetDigestSha256,
      requirementProjectionDigestSha256:
        projection.projectionDigestSha256,
      gpuBundleDigestSha256:
        gpuBundle.bundleDigestSha256,
      gpuBundleRequirementsDigestSha256:
        gpuBundle.requirementsDigestSha256,
      dispatchIntentId:
        gpuBundle.identity.dispatchIntentId,
      dispatchBindingHash:
        gpuBundle.identity.dispatchBindingHash,
      attemptPlanHash:
        gpuBundle.identity.attemptPlanHash,
      approvedSnapshotId: operation.approvedSnapshotId,
      approvedSnapshotHash:
        operation.approvedSnapshotHash,
      workItemId: operation.workItemId,
      workItemHash: operation.workItemHash,
      creditEstimateId: operation.creditEstimateId,
      creditReservationId:
        operation.creditReservationId,
      workerLeaseId: operation.workerLeaseId,
      idempotencyKey: operation.idempotencyKey,
      modelManifestId: operation.modelManifestId,
      sourceFrameArtifactBindingDigestSha256:
        sourceArtifactBinding.bindingDigestSha256,
      operationRequestDigestSha256:
        operation.operationRequestDigestSha256,
    },
    modelArtifactBinding: {
      artifactCount: 1 as const,
      slotId: 'rembg_u2netp_onnx' as const,
      artifactRecordId: artifact.locator.artifactRecordId,
      artifactId: 'rembg-u2netp-onnx' as const,
      revision:
        'rembg-v0.0.0-u2netp-309c8469258d' as const,
      modelFamily: 'u2netp' as const,
      byteLength: 4_574_861 as const,
      contentSha256:
        '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' as const,
      consumerScope: 'rembg.private-inference' as const,
      executionTarget: 'google_cloud_run_gpu' as const,
      cloudRunAccelerator: 'nvidia_l4' as const,
      modelAccelerator: 'cuda' as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
    },
    source,
    settings,
    expectedOutputs: EXPECTED_OUTPUTS,
    processBoundEvidenceReceipts:
      PROCESS_BOUND_EVIDENCE_RECEIPTS,
    requiredQaGates: REQUIRED_QA_GATES,
    summary: {
      exactModelArtifactIdentityMatched: true as const,
      exactCloudRunGpuAttemptIdentityMatched: true as const,
      exactSourceMediaAndFrameLineageMatched: true as const,
      exactCanonicalSourceFrameExtractionArtifactMatched:
        true as const,
      exactGpuOnlySettingsMatched: true as const,
      exactSingleMaskArtifactAndProcessEvidenceContractDeclared:
        true as const,
      sourceMasterFrameIndex: source.masterFrameIndex,
      sourceFrameIndex: source.sourceFrameIndex,
      frameWidth: source.frameWidth,
      frameHeight: source.frameHeight,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
    },
    blockers: BLOCKERS,
    boundaries: BOUNDARIES,
  }
  return deepFreeze(candidateSchema.parse({
    ...draft,
    admissionDigestSha256: sha256AuthorityValue(draft),
  })) as CanonicalRembgCloudRunGpuExecutionAdmissionCandidate
}

export function assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate(
  input: CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput,
): CanonicalRembgCloudRunGpuExecutionAdmissionCandidate {
  const parsed = candidateSchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalid('rembg_gpu_execution_admission_candidate_invalid')
  }
  const expected =
    createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
      requirementSet: input.requirementSet,
      requirementProjection: input.requirementProjection,
      gpuBundle: input.gpuBundle,
      sourceArtifactBinding: input.sourceArtifactBinding,
      operationRequest: input.operationRequest,
    })
  if (
    stableAuthorityStringify(parsed.data)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked(
      'rembg_gpu_execution_admission_parent_or_derived_lineage_mismatch',
    )
  }
  return expected
}

function createSourceExpectation(
  value: CanonicalRembgSourceFrameExpectationInput,
): CanonicalRembgSourceFrameExpectation {
  const parsed =
    canonicalRembgSourceFrameExpectationInputSchema
      .safeParse(value)
  if (!parsed.success) {
    throw invalid('rembg_source_frame_expectation_invalid')
  }
  const draft = {
    ...parsed.data,
    artifactKind: 'image' as const,
    frameDerivationPolicy:
      'canonical_ffmpeg_exact_decoded_source_frame_rgba_png_v1' as const,
  }
  return deepFreeze(
    canonicalRembgSourceFrameExpectationSchema.parse({
    ...draft,
    sourceFrameExpectationDigestSha256:
      sha256AuthorityValue(draft),
    }),
  ) as CanonicalRembgSourceFrameExpectation
}

function parseExactOperationRequest(input: {
  value: unknown
  source: CanonicalRembgSourceFrameExpectation
  projection:
    ReturnType<
      typeof assertCanonicalRembgGpuBundleRequirementProjection
    >
}): {
  readonly approvedSnapshotId: string
  readonly approvedSnapshotHash: string
  readonly workItemId: string
  readonly workItemHash: string
  readonly creditEstimateId: string
  readonly creditReservationId: string
  readonly workerLeaseId: string
  readonly idempotencyKey: string
  readonly modelManifestId: string
  readonly operationRequestDigestSha256: string
} {
  const validation =
    validateProfessionalToolOperationRequest(
      'rembg',
      input.value,
    )
  if (!validation.ok) {
    throw invalid('rembg_professional_operation_request_invalid')
  }
  const request = validation.request
  const bindings = request.artifactBindings
  const settings = request.settings
  const projectedLocator =
    input.projection.requirements[0].locator
  const expectedModelManifestId =
    `modelmanifest_${projectedLocator.manifestDigestSha256}`
  if (
    !Array.isArray(bindings)
    || bindings.length !== 1
    || !isRecord(bindings[0])
    || bindings[0].artifactId !== input.source.frameArtifactId
    || bindings[0].kind !== 'image'
    || bindings[0].sha256
      !== input.source.frameArtifactSha256
    || bindings[0].byteLength
      !== input.source.frameArtifactByteLength
    || !isRecord(settings)
    || settings.confidenceThreshold !== 0.5
    || settings.alphaMatteMode !== 'straight'
    || settings.edgeRefinementProfileId
      !== 'approved_u2netp_default_v1'
    || settings.maximumSubjects !== 1
    || request.modelManifestId !== expectedModelManifestId
  ) {
    throw blocked(
      'rembg_professional_operation_request_lineage_mismatch',
    )
  }
  return {
    approvedSnapshotId: String(request.approvedSnapshotId),
    approvedSnapshotHash: String(request.approvedSnapshotHash),
    workItemId: String(request.workItemId),
    workItemHash: String(request.workItemHash),
    creditEstimateId: String(request.creditEstimateId),
    creditReservationId:
      String(request.creditReservationId),
    workerLeaseId: String(request.workerLeaseId),
    idempotencyKey: String(request.idempotencyKey),
    modelManifestId: expectedModelManifestId,
    operationRequestDigestSha256:
      sha256AuthorityValue(request),
  }
}

function assertExactRembgGpuBundle(
  value: unknown,
): CanonicalModelArtifactGpuBundle {
  const parsed =
    canonicalModelArtifactGpuBundleSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('rembg_gpu_bundle_invalid')
  }
  const bundle = parsed.data
  const { bundleDigestSha256, ...bundleDraft } = bundle
  const expectedBlockers = [
    'canonical_operation_model_artifact_set_not_verified',
    'cloud_run_gpu_job_deployment_not_verified',
    'cloud_run_read_only_model_mount_not_verified',
    'deployed_gpu_capacity_not_verified',
    'distributed_model_artifact_repository_not_implemented',
    'model_artifact_paid_production_license_not_approved',
    'model_artifact_repository_admission_not_production_reviewed',
    'private_generation_bound_model_artifact_distribution_not_verified',
    'worker_service_identity_and_iam_not_verified',
  ]
  if (
    bundleDigestSha256 !== sha256AuthorityValue(bundleDraft)
    || bundle.consumerScope !== 'rembg.private-inference'
    || bundle.identity.approvedToolId !== 'rembg'
    || bundle.identity.approvedToolOperationId
      !== 'tool.rembg.remove_image_background.v1'
    || bundle.artifacts.length !== 1
    || bundle.summary.artifactCount !== 1
    || bundle.summary.totalByteLength !== 4_574_861
    || bundle.execution.executionTarget
      !== 'google_cloud_run_gpu'
    || bundle.execution.cloudRunAccelerator !== 'nvidia_l4'
    || bundle.execution.modelAccelerator !== 'cuda'
    || bundle.summary.cpuFallbackAllowed !== false
    || bundle.summary.runtimeDownloadAllowed !== false
    || bundle.summary.networkFetchAllowed !== false
    || stableAuthorityStringify(bundle.blockers)
      !== stableAuthorityStringify(expectedBlockers)
    || stableAuthorityStringify(bundle.boundaries)
      !== stableAuthorityStringify(genericGpuBundleBoundaries())
  ) {
    throw blocked('rembg_gpu_bundle_identity_mismatch')
  }
  const artifact = bundle.artifacts[0]!
  const projected = requirementProjection(artifact)
  const { artifactBindingDigestSha256, ...artifactDraft } =
    artifact
  const expectedBundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity: bundle.identity,
      consumerScope: bundle.consumerScope,
      requirementsDigestSha256:
        bundle.requirementsDigestSha256,
    }).slice(0, 32)}`
  if (
    artifact.canonicalOrder !== 0
    || artifact.slotId !== 'rembg_u2netp_onnx'
    || artifact.artifactId !== 'rembg-u2netp-onnx'
    || artifact.revision
      !== 'rembg-v0.0.0-u2netp-309c8469258d'
    || artifact.artifactFormat !== 'onnx'
    || artifact.artifactRole
      !== 'rembg-u2netp-background-removal-onnx'
    || artifact.modelFamily !== 'u2netp'
    || artifact.byteLength !== 4_574_861
    || artifact.contentSha256
      !== '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
    || artifact.consumerScopeVerified !== true
    || artifact.executionClass !== 'gpu_required'
    || artifact.requiredExecutionTarget
      !== 'google_cloud_run_gpu'
    || artifact.accelerator !== 'cuda'
    || artifact.cpuFallbackAllowed !== false
    || artifact.runtimeDownloadAllowed !== false
    || artifact.networkFetchAllowed !== false
    || artifactBindingDigestSha256
      !== sha256AuthorityValue(artifactDraft)
    || bundle.requirementsDigestSha256
      !== sha256AuthorityValue([projected])
    || bundle.bundleId !== expectedBundleId
  ) {
    throw blocked('rembg_gpu_bundle_artifact_mismatch')
  }
  return deepFreeze(bundle) as CanonicalModelArtifactGpuBundle
}

function assertParentLineage(input: {
  requirementSet:
    ReturnType<
      typeof assertCanonicalRembgModelArtifactRequirementSet
    >
  projection:
    ReturnType<
      typeof assertCanonicalRembgGpuBundleRequirementProjection
    >
  gpuBundle: CanonicalModelArtifactGpuBundle
}): void {
  const projected = input.projection.requirements[0]
  const bundled =
    requirementProjection(input.gpuBundle.artifacts[0]!)
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
    throw blocked(
      'rembg_gpu_execution_parent_lineage_mismatch',
    )
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

function operationSettings(): CanonicalRembgOperationSettings {
  return deepFreeze(operationSettingsSchema.parse({
    device: 'cuda',
    modelId: 'u2netp',
    outputMode: 'mask_only_png',
    confidenceThreshold: 0.5,
    alphaMatteMode: 'straight',
    edgeRefinementProfileId:
      'approved_u2netp_default_v1',
    maximumSubjects: 1,
    preserveSourceDimensions: true,
    runtimeDownloadAllowed: false,
    networkFetchAllowed: false,
  })) as CanonicalRembgOperationSettings
}

function genericGpuBundleBoundaries():
CanonicalModelArtifactGpuBundle['boundaries'] {
  return {
    exactApprovedPackageAttemptBound: true,
    cloudTaskBodyContainsModelArtifactData: false,
    cloudRunEnvironmentContainsModelArtifactData: false,
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
    credentialsIncluded: false,
    canonicalOperationArtifactSetVerified: false,
    privateGcsDistributionVerified: false,
    cloudRunReadOnlyMountVerified: false,
    workerServiceIdentityVerified: false,
    cloudRunJobDeploymentVerified: false,
    deployedGpuCapacityVerified: false,
    remoteMutationAuthorized: false,
    cloudDispatchAuthorized: false,
    modelInferenceAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationAuthority: false,
    workGraphAuthority: false,
    queueMutationAuthority: false,
    assetManifestAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  }
}

function admissionIdFor(input: {
  readonly requirementSetDigestSha256: string
  readonly requirementProjectionDigestSha256: string
  readonly gpuBundleDigestSha256: string
  readonly sourceFrameExpectationDigestSha256: string
  readonly sourceFrameArtifactBindingDigestSha256: string
  readonly operationRequestDigestSha256: string
}): string {
  return `rembg_gpu_preflight_${
    sha256AuthorityValue(input).slice(0, 32)
  }`
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
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
