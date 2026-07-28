import assert from 'node:assert/strict'

import {
  assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate,
  assertCanonicalRembgModelArtifactRequirementSet,
  createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate,
  getCanonicalRembgModelArtifactRequirementSet,
  projectCanonicalRembgGpuBundleRequirements,
  type CanonicalModelArtifactGpuBundle,
  type CanonicalModelArtifactGpuBundleArtifact,
  type CanonicalModelArtifactGpuBundleRequirement,
  type CanonicalModelArtifactLocator,
  type CanonicalRembgSourceFrameExpectationInput,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  getProductionToolProfile,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution'

const SHA = {
  artifactRecord: 'a'.repeat(64),
  manifest: 'b'.repeat(64),
  descriptor: 'c'.repeat(64),
  objectIdentity: 'd'.repeat(64),
  dispatchBinding: 'e'.repeat(64),
  attemptPlan: 'f'.repeat(64),
  handoffManifest: '1'.repeat(64),
  manifestEntry: '2'.repeat(64),
  queueDefinition: '3'.repeat(64),
  regionAuthority: '4'.repeat(64),
  target: '5'.repeat(64),
  cloudRunRequest: '6'.repeat(64),
  sourceMedia: '7'.repeat(64),
  sourceBinding: '8'.repeat(64),
  storageIdentity: '9'.repeat(64),
  frameSelection: '0'.repeat(64),
  frameArtifact: '1'.repeat(64),
  snapshot: '2'.repeat(64),
  workItem: '3'.repeat(64),
}

const requirementSet =
  getCanonicalRembgModelArtifactRequirementSet()
const locator: CanonicalModelArtifactLocator = {
  locatorVersion: 'canonical-model-artifact-locator-v1',
  artifactRecordId:
    `model-artifact-${SHA.artifactRecord}`,
  artifactId: requirementSet.descriptor.artifactId,
  revision: requirementSet.descriptor.revision,
  contentSha256: requirementSet.descriptor.contentSha256,
  manifestDigestSha256: SHA.manifest,
}
const projection =
  projectCanonicalRembgGpuBundleRequirements({
    requirementSet,
    locator,
  })
const gpuBundle = controlledRembgGpuBundle()
const source: CanonicalRembgSourceFrameExpectationInput = {
  sourceSequenceItemId: 'source-item-0001',
  mediaAssetId: 'media-asset-0001',
  sourceCleanupDecisionId: 'cleanup-decision-0001',
  masterFrameIndex: 12,
  sourceFrameIndex: 12,
  frameRate: 30,
  frameSelectionPolicy: 'scene_start_meaning_anchor_v1',
  sourceFrameSelectionDigestSha256: SHA.frameSelection,
  sourceMediaContentSha256: SHA.sourceMedia,
  sourceMediaByteLength: 24_000_000,
  sourceMediaContentType: 'video/mp4',
  sourceBindingHash: SHA.sourceBinding,
  storageIdentityHash: SHA.storageIdentity,
  frameArtifactId: 'source-frame-artifact-0001',
  frameArtifactContentType: 'image/png',
  frameArtifactSha256: SHA.frameArtifact,
  frameArtifactByteLength: 184_500,
  frameWidth: 1_920,
  frameHeight: 1_080,
}
const operationRequest = {
  operationId: 'tool.rembg.remove_image_background.v1',
  approvedSnapshotId: 'approved_snapshot_0001',
  approvedSnapshotHash: SHA.snapshot,
  workItemId: 'approved_work_item_0001',
  workItemHash: SHA.workItem,
  creditEstimateId: 'credit_estimate_0001',
  creditReservationId: 'credit_reservation_0001',
  workerLeaseId: 'worker_lease_0001',
  idempotencyKey: 'rembg_operation_attempt_0001',
  artifactBindings: [{
    artifactId: source.frameArtifactId,
    kind: 'image',
    sha256: source.frameArtifactSha256,
    byteLength: source.frameArtifactByteLength,
  }],
  settings: {
    confidenceThreshold: 0.5,
    alphaMatteMode: 'straight',
    edgeRefinementProfileId:
      'approved_u2netp_default_v1',
    maximumSubjects: 1,
  },
  modelManifestId: `modelmanifest_${SHA.manifest}`,
}

const candidate =
  createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  })

assert.equal(
  candidate.admissionClass,
  'controlled_non_executable_rembg_gpu_source_frame_preflight',
)
assert.equal(candidate.identity.approvedToolId, 'rembg')
assert.equal(
  candidate.identity.approvedOperationId,
  'tool.rembg.remove_image_background.v1',
)
assert.equal(
  candidate.modelArtifactBinding.modelFamily,
  'u2netp',
)
assert.equal(
  candidate.modelArtifactBinding.executionTarget,
  'google_cloud_run_gpu',
)
assert.equal(
  candidate.modelArtifactBinding.cloudRunAccelerator,
  'nvidia_l4',
)
assert.equal(candidate.modelArtifactBinding.cpuFallbackAllowed, false)
assert.equal(candidate.source.masterFrameIndex, 12)
assert.equal(candidate.source.sourceFrameIndex, 12)
assert.equal(candidate.source.frameWidth, 1_920)
assert.equal(candidate.source.frameHeight, 1_080)
assert.equal(candidate.settings.device, 'cuda')
assert.equal(candidate.settings.outputMode, 'mask_only_png')
assert.equal(candidate.expectedOutputs.length, 3)
assert.equal(
  candidate.expectedOutputs[0].artifactKind,
  'mask_image',
)
assert.equal(
  candidate.expectedOutputs[0].contentType,
  'image/png',
)
assert.deepEqual(candidate.requiredQaGates, [
  'mask_edge_quality',
  'mask_subject_coverage',
])
assert.equal(
  candidate.boundaries.existingCpuFixtureProductionAuthority,
  false,
)
assert.equal(candidate.boundaries.cpuExecutionAccepted, false)
assert.equal(candidate.boundaries.cloudDispatchAuthorized, false)
assert.equal(candidate.boundaries.modelInferenceAuthority, false)
assert.equal(candidate.boundaries.workGraphAuthority, false)
assert.equal(candidate.boundaries.productionReady, false)
assert.deepEqual(
  assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: structuredClone(candidate),
    requirementSet: structuredClone(requirementSet),
    requirementProjection: structuredClone(projection),
    gpuBundle: structuredClone(gpuBundle),
    source: structuredClone(source),
    operationRequest: structuredClone(operationRequest),
  }),
  candidate,
)

const rembgProfile = getProductionToolProfile('rembg')
assert.equal(rembgProfile?.workerType, 'gpu_ai_worker')
assert.equal(rembgProfile?.gpuRequired, true)
assert.equal(rembgProfile?.cpuAllowed, false)
assert.equal(
  resolveProfessionalToolOperationSpec('rembg')
    ?.allowedOperationIds[0],
  'tool.rembg.remove_image_background.v1',
)

let adversarialAssertions = 0

expectRejects(
  () => assertCanonicalRembgModelArtifactRequirementSet({
    ...structuredClone(requirementSet),
    rawModelPath: '/tmp/u2netp.onnx',
  }),
  'unknown model path',
  'rembg_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalRembgModelArtifactRequirementSet({
    ...structuredClone(requirementSet),
    requirementSetDigestSha256: 'f'.repeat(64),
  }),
  'requirement digest',
  'rembg_model_artifact_requirement_set_mismatch',
)
expectRejects(
  () => projectCanonicalRembgGpuBundleRequirements({
    requirementSet,
    locator: {
      ...locator,
      contentSha256: 'f'.repeat(64),
    },
  }),
  'wrong locator checksum',
  'rembg_model_artifact_locator_invalid',
)
expectRejects(
  () => createCandidate({
    source: {
      ...source,
      sourceFrameSelectionDigestSha256: 'bad',
    },
  }),
  'invalid frame selection digest',
  'rembg_source_frame_expectation_invalid',
)
expectRejects(
  () => createCandidate({
    source: {
      ...source,
      sourceMediaContentType: 'video/avi' as never,
    },
  }),
  'unsupported source content type',
  'rembg_source_frame_expectation_invalid',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      artifactBindings: [{
        ...operationRequest.artifactBindings[0],
        sha256: 'f'.repeat(64),
      }],
    },
  }),
  'frame artifact checksum mismatch',
  'rembg_professional_operation_request_lineage_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      settings: {
        ...operationRequest.settings,
        maximumSubjects: 2,
      },
    },
  }),
  'maximum subjects drift',
  'rembg_professional_operation_request_lineage_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      modelManifestId: 'modelmanifest_forged',
    },
  }),
  'model manifest mismatch',
  'rembg_professional_operation_request_lineage_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      device: 'cpu',
    },
  }),
  'caller CPU field',
  'rembg_professional_operation_request_invalid',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      url: 'https://example.com/input.png',
    },
  }),
  'caller URL',
  'rembg_professional_operation_request_invalid',
)
expectRejects(
  () => createCandidate({
    gpuBundle: rehashBundle({
      ...structuredClone(gpuBundle),
      consumerScope: 'sam2.private-inference',
    }),
  }),
  'wrong GPU consumer',
  'rembg_gpu_bundle_identity_mismatch',
)
expectRejects(
  () => createCandidate({
    gpuBundle: rehashBundle({
      ...structuredClone(gpuBundle),
      summary: {
        ...gpuBundle.summary,
        cpuFallbackAllowed: true,
      },
    }),
  }),
  'CPU fallback substitution',
  'rembg_gpu_bundle_invalid',
)
expectRejects(
  () => assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: rehashCandidate({
      ...structuredClone(candidate),
      expectedOutputs: [{
        ...candidate.expectedOutputs[0],
        contentType: 'application/json',
      }, ...candidate.expectedOutputs.slice(1)],
    }),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'output contract substitution',
  'rembg_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () => assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: rehashCandidate({
      ...structuredClone(candidate),
      boundaries: {
        ...candidate.boundaries,
        cloudDispatchAuthorized: true,
      },
    }),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'authority forgery',
  'rembg_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () => assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source: {
      ...source,
      sourceFrameIndex: 13,
    },
    operationRequest,
  }),
  'source parent drift',
  'rembg_gpu_execution_admission_parent_or_derived_lineage_mismatch',
)

console.log(JSON.stringify({
  ok: true,
  admissionVersion: candidate.admissionVersion,
  approvedOperationId: candidate.identity.approvedOperationId,
  modelFamily: candidate.modelArtifactBinding.modelFamily,
  modelByteLength: candidate.modelArtifactBinding.byteLength,
  masterFrameIndex: candidate.source.masterFrameIndex,
  sourceFrameIndex: candidate.source.sourceFrameIndex,
  sourceFrameContentType:
    candidate.source.frameArtifactContentType,
  outputProfile:
    candidate.expectedOutputs[0].encodingProfile,
  executionTarget:
    candidate.modelArtifactBinding.executionTarget,
  cloudRunAccelerator:
    candidate.modelArtifactBinding.cloudRunAccelerator,
  cpuFallbackAllowed:
    candidate.modelArtifactBinding.cpuFallbackAllowed,
  exactProductionToolRegistryCountPreserved:
    candidate.boundaries.exactFiftyToolRegistryPreserved,
  canonicalOperationArtifactSetVerified:
    candidate.boundaries.canonicalOperationArtifactSetVerified,
  cloudDispatchAuthorized:
    candidate.boundaries.cloudDispatchAuthorized,
  modelInferenceAuthority:
    candidate.boundaries.modelInferenceAuthority,
  productionReady: candidate.boundaries.productionReady,
  adversarialAssertions,
}, null, 2))

function createCandidate(
  overrides: Partial<{
    readonly source: typeof source
    readonly operationRequest: unknown
    readonly gpuBundle: CanonicalModelArtifactGpuBundle
  }>,
) {
  return createCanonicalRembgCloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle: overrides.gpuBundle ?? gpuBundle,
    source: overrides.source ?? source,
    operationRequest:
      overrides.operationRequest ?? operationRequest,
  })
}

function controlledRembgGpuBundle():
CanonicalModelArtifactGpuBundle {
  const descriptor = requirementSet.descriptor
  const artifactDraft = {
    canonicalOrder: 0,
    slotId: 'rembg_u2netp_onnx',
    locator,
    descriptorDigestSha256: SHA.descriptor,
    objectIdentityDigestSha256: SHA.objectIdentity,
    artifactId: descriptor.artifactId,
    revision: descriptor.revision,
    artifactFormat: descriptor.artifactFormat,
    artifactRole: descriptor.artifactRole,
    modelFamily: descriptor.modelFamily,
    byteLength: descriptor.byteLength,
    contentSha256: descriptor.contentSha256,
    repositoryAdmission: descriptor.repositoryAdmission,
    sourceObservationDigestSha256:
      descriptor.sourceObservationDigestSha256,
    reviewEvidenceDigestSha256:
      descriptor.reviewEvidenceDigestSha256,
    securityReviewDigestSha256:
      descriptor.securityReviewDigestSha256,
    licensePolicyDigestSha256:
      sha256AuthorityValue(descriptor.licensePolicy),
    commercialUseStatus:
      descriptor.licensePolicy.commercialUseStatus,
    reviewStatus: descriptor.licensePolicy.reviewStatus,
    paidProductionUseApproved:
      descriptor.licensePolicy.paidProductionUseApproved,
    consumerScopeVerified: true as const,
    executionClass: 'gpu_required' as const,
    requiredExecutionTarget:
      'google_cloud_run_gpu' as const,
    accelerator: 'cuda' as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    fullRepositoryChecksumVerified: true as const,
    required: true as const,
  }
  const artifact:
  CanonicalModelArtifactGpuBundleArtifact = {
    ...artifactDraft,
    artifactBindingDigestSha256:
      sha256AuthorityValue(artifactDraft),
  }
  const identity = {
    dispatchIntentId: 'dispatch_intent_rembg_0001',
    dispatchBindingHash: SHA.dispatchBinding,
    attemptPlanHash: SHA.attemptPlan,
    handoffManifestHash: SHA.handoffManifest,
    manifestEntryHash: SHA.manifestEntry,
    queueDefinitionHash: SHA.queueDefinition,
    regionAuthorityHash: SHA.regionAuthority,
    jobId: 'gpu_job_rembg_0001',
    deliveryAttempt: 1,
    approvedToolId: 'rembg',
    approvedToolOperationId:
      'tool.rembg.remove_image_background.v1',
    runtimeRegion: 'us-east1' as const,
    targetHash: SHA.target,
    cloudRunJobResourceName:
      'projects/weeditpro-internal/locations/us-east1/jobs/weeditpro-gpu-ai-worker',
    cloudRunJobRequestSha256: SHA.cloudRunRequest,
    workerServiceAccountEmail:
      'gpu-worker@weeditpro-internal.iam.gserviceaccount.com',
  }
  const requirementsDigestSha256 =
    sha256AuthorityValue([requirementProjection(artifact)])
  const bundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity,
      consumerScope: 'rembg.private-inference',
      requirementsDigestSha256,
    }).slice(0, 32)}`
  const bundleDraft = {
    bundleVersion:
      'canonical-model-artifact-gpu-bundle-v1' as const,
    bundleClass:
      'verified_server_resolved_model_artifact_gpu_bundle' as const,
    source:
      'canonical_model_artifact_repository_and_cloud_dispatch_attempt' as const,
    bundleId,
    identity,
    consumerScope: 'rembg.private-inference',
    requirementsDigestSha256,
    artifacts: [artifact],
    summary: {
      artifactCount: 1,
      totalByteLength: descriptor.byteLength,
      allArtifactsRequired: true as const,
      allArtifactIdentitiesUnique: true as const,
      allArtifactSlotsUnique: true as const,
      allArtifactsRepositoryVerified: true as const,
      allArtifactsGpuOnly: true as const,
      allArtifactsCudaRequired: true as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
    },
    execution: {
      workerType: 'gpu_ai_worker' as const,
      executionTarget: 'google_cloud_run_gpu' as const,
      cloudRunAccelerator: 'nvidia_l4' as const,
      modelAccelerator: 'cuda' as const,
      gpuCount: 1 as const,
      noGpuZonalRedundancy: true as const,
      taskCount: 1 as const,
      parallelism: 1 as const,
      cloudRunInternalMaxRetries: 0 as const,
      packageQueueOwnsApprovedAttempts: true as const,
      workerLoadsAuthorityByOpaqueDispatchIntent: true as const,
    },
    blockers: [
      'canonical_operation_model_artifact_set_not_verified',
      'cloud_run_gpu_job_deployment_not_verified',
      'cloud_run_read_only_model_mount_not_verified',
      'deployed_gpu_capacity_not_verified',
      'distributed_model_artifact_repository_not_implemented',
      'model_artifact_paid_production_license_not_approved',
      'model_artifact_repository_admission_not_production_reviewed',
      'private_generation_bound_model_artifact_distribution_not_verified',
      'worker_service_identity_and_iam_not_verified',
    ],
    boundaries: {
      exactApprovedPackageAttemptBound: true as const,
      cloudTaskBodyContainsModelArtifactData: false as const,
      cloudRunEnvironmentContainsModelArtifactData: false as const,
      callerBytesAccepted: false as const,
      callerPathAccepted: false as const,
      callerUrlAccepted: false as const,
      credentialsIncluded: false as const,
      canonicalOperationArtifactSetVerified: false as const,
      privateGcsDistributionVerified: false as const,
      cloudRunReadOnlyMountVerified: false as const,
      workerServiceIdentityVerified: false as const,
      cloudRunJobDeploymentVerified: false as const,
      deployedGpuCapacityVerified: false as const,
      remoteMutationAuthorized: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      operationAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      customerPriceAuthority: false as const,
      customerCreditAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionReady: false as const,
    },
  }
  return {
    ...bundleDraft,
    bundleDigestSha256: sha256AuthorityValue(bundleDraft),
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

function rehashBundle(
  value: Record<string, unknown>,
): CanonicalModelArtifactGpuBundle {
  const draft = { ...value }
  delete draft.bundleDigestSha256
  return {
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
  } as unknown as CanonicalModelArtifactGpuBundle
}

function rehashCandidate(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.admissionDigestSha256
  return {
    ...draft,
    admissionDigestSha256: sha256AuthorityValue(draft),
  }
}

function expectRejects(
  operation: () => unknown,
  label: string,
  code: string,
): void {
  assert.throws(
    operation,
    (error: unknown) => {
      assert.equal(error instanceof Error, true, `${label}: Error`)
      assert.equal(
        (error as Error).message.includes(code),
        true,
        `${label}: ${String((error as Error).message)}`,
      )
      return true
    },
    label,
  )
  adversarialAssertions += 1
}
