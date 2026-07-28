import assert from 'node:assert/strict'

import {
  assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate,
  assertCanonicalSam2SubjectPromptPacket,
  createCanonicalSam2CloudRunGpuExecutionAdmissionCandidate,
  createCanonicalSam2SubjectPromptPacket,
  getCanonicalSam2ModelArtifactRequirementSet,
  projectCanonicalSam2GpuBundleRequirements,
  type CanonicalModelArtifactGpuBundle,
  type CanonicalModelArtifactGpuBundleArtifact,
  type CanonicalModelArtifactGpuBundleRequirement,
  type CanonicalModelArtifactLocator,
  type CanonicalSam2SourceVideoExpectationInput,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getProfessionalToolOperationSpec,
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
  source: '7'.repeat(64),
  snapshot: '8'.repeat(64),
  workItem: '9'.repeat(64),
}

const requirementSet =
  getCanonicalSam2ModelArtifactRequirementSet()
const locator: CanonicalModelArtifactLocator = {
  locatorVersion: 'canonical-model-artifact-locator-v1',
  artifactRecordId: `model-artifact-${SHA.artifactRecord}`,
  artifactId: requirementSet.descriptor.artifactId,
  revision: requirementSet.descriptor.revision,
  contentSha256: requirementSet.descriptor.contentSha256,
  manifestDigestSha256: SHA.manifest,
}
const projection = projectCanonicalSam2GpuBundleRequirements({
  requirementSet,
  locator,
})
const gpuBundle = controlledSam2GpuBundle()
const source: CanonicalSam2SourceVideoExpectationInput = {
  artifactId: 'private-source-video-artifact-0001',
  contentSha256: SHA.source,
  byteLength: 24_000_000,
  width: 1_920,
  height: 1_080,
  frameCount: 300,
  fpsNumerator: 30,
  fpsDenominator: 1,
  durationMilliseconds: 10_000,
  dependencyQaEvaluationId:
    'source-qa-evaluation-0001',
  dependencyReconciliationId:
    'source-reconciliation-0001',
}
const prompt = createCanonicalSam2SubjectPromptPacket({
  subjectSelectionId: 'subject-selection-0001',
  sourceArtifactId: source.artifactId,
  sourceArtifactSha256: source.contentSha256,
  sourceFrameIndex: 30,
  sourceFrameWidth: source.width,
  sourceFrameHeight: source.height,
  promptMode: 'box',
  boundingBox: {
    x: 0.2,
    y: 0.1,
    width: 0.45,
    height: 0.8,
  },
})
const promptArtifactId = 'subject-prompt-artifact-0001'
const promptArtifactSha256 = sha256AuthorityValue(prompt)
const promptArtifactByteLength = Buffer.byteLength(
  stableAuthorityStringify(prompt),
  'utf8',
)
const operationRequest = {
  operationId: 'tool.sam2.segment_and_track_subject.v1',
  approvedSnapshotId: 'approved-snapshot-0001',
  approvedSnapshotHash: SHA.snapshot,
  workItemId: 'approved-work-item-0001',
  workItemHash: SHA.workItem,
  creditEstimateId: 'credit-estimate-0001',
  creditReservationId: 'credit-reservation-0001',
  workerLeaseId: 'worker-lease-0001',
  idempotencyKey: 'sam2-operation-attempt-0001',
  artifactBindings: [
    {
      artifactId: source.artifactId,
      kind: 'video',
      sha256: source.contentSha256,
      byteLength: source.byteLength,
    },
    {
      artifactId: promptArtifactId,
      kind: 'json_data',
      sha256: promptArtifactSha256,
      byteLength: promptArtifactByteLength,
    },
  ],
  settings: {
    confidenceThreshold: 0.8,
    maximumSubjects: 1,
    frameStride: 1,
    preserveContactObjects: true,
    subjectPromptProfile: 'normalized_box_or_points_v1',
    subjectPromptSha256: promptArtifactSha256,
  },
  modelManifestId: locator.manifestDigestSha256,
}

const candidate =
  createCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    subjectPromptArtifactId: promptArtifactId,
    subjectPromptArtifactByteLength:
      promptArtifactByteLength,
    subjectPrompt: prompt,
    operationRequest,
  })

assert.equal(
  candidate.admissionClass,
  'controlled_non_executable_sam2_gpu_operation_preflight',
)
assert.equal(candidate.identity.approvedToolId, 'sam2')
assert.equal(
  candidate.identity.approvedOperationId,
  'tool.sam2.segment_and_track_subject.v1',
)
assert.equal(
  candidate.modelArtifactBinding.executionTarget,
  'google_cloud_run_gpu',
)
assert.equal(
  candidate.modelArtifactBinding.cloudRunAccelerator,
  'nvidia_l4',
)
assert.equal(
  candidate.modelArtifactBinding.modelAccelerator,
  'cuda',
)
assert.equal(candidate.modelArtifactBinding.cpuFallbackAllowed, false)
assert.equal(candidate.source.frameCount, 300)
assert.equal(candidate.subjectPrompt.promptMode, 'box')
assert.equal(candidate.settings.maximumSubjects, 1)
assert.equal(
  candidate.settings.subjectPromptSha256,
  promptArtifactSha256,
)
assert.equal(candidate.expectedOutputs.length, 3)
assert.equal(
  candidate.expectedOutputs[0].encodingProfile,
  'gray8_ffv1_matroska_mask_sequence_v1',
)
assert.deepEqual(candidate.requiredQaGates, [
  'mask_edge_quality',
  'mask_temporal_stability',
  'mask_subject_coverage',
])
assert.equal(
  candidate.summary.exactStructuredSubjectPromptBindingMatched,
  true,
)
assert.equal(candidate.boundaries.candidateOnly, true)
assert.equal(
  candidate.boundaries.freshRepositoryByteRehashRequired,
  true,
)
assert.equal(
  candidate.boundaries.canonicalOperationArtifactSetVerified,
  false,
)
assert.equal(candidate.boundaries.cloudDispatchAuthorized, false)
assert.equal(candidate.boundaries.modelInferenceAuthority, false)
assert.equal(candidate.boundaries.productionReady, false)
assert.deepEqual(
  assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: structuredClone(candidate),
    requirementSet: structuredClone(requirementSet),
    requirementProjection: structuredClone(projection),
    gpuBundle: structuredClone(gpuBundle),
    source: structuredClone(source),
    operationRequest: structuredClone(operationRequest),
  }),
  candidate,
)

const sam2Operation = getProfessionalToolOperationSpec('sam2')
assert.ok(sam2Operation)
assert.deepEqual(
  sam2Operation.declaredPrivateInputArtifactKinds,
  ['image', 'video', 'frame_sequence', 'json_data'],
)
assert.deepEqual(
  sam2Operation.requestSchema.properties.settings.required,
  [
    'confidenceThreshold',
    'maximumSubjects',
    'frameStride',
    'preserveContactObjects',
    'subjectPromptProfile',
    'subjectPromptSha256',
  ],
)
const subjectPromptSha256Constraint =
  sam2Operation.requestSchema.properties.settings.properties
    .subjectPromptSha256
assert.equal(subjectPromptSha256Constraint?.type, 'string')
assert.equal(
  subjectPromptSha256Constraint?.type === 'string'
    ? subjectPromptSha256Constraint.pattern
    : undefined,
  '^[a-f0-9]{64}$',
)

const pointsPrompt = createCanonicalSam2SubjectPromptPacket({
  subjectSelectionId: 'subject-selection-points-0001',
  sourceArtifactId: source.artifactId,
  sourceArtifactSha256: source.contentSha256,
  sourceFrameIndex: 0,
  sourceFrameWidth: source.width,
  sourceFrameHeight: source.height,
  promptMode: 'points',
  points: [
    { x: 0.5, y: 0.4, label: 'foreground' },
    { x: 0.05, y: 0.05, label: 'background' },
  ],
})
assert.equal(pointsPrompt.promptMode, 'points')
assert.equal(pointsPrompt.points.length, 2)

let adversarialAssertions = 0

expectRejects(
  () => assertCanonicalSam2SubjectPromptPacket({
    ...structuredClone(prompt),
    rawUserChat: 'pick the person',
  }),
  'raw-chat field',
  'sam2_subject_prompt_packet_invalid',
)
expectRejects(
  () => assertCanonicalSam2SubjectPromptPacket({
    ...structuredClone(prompt),
    promptDigestSha256: '0'.repeat(64),
  }),
  'prompt digest tampering',
  'sam2_subject_prompt_packet_digest_mismatch',
)
expectRejects(
  () => createCanonicalSam2SubjectPromptPacket({
    subjectSelectionId: 'subject-selection-bad-box',
    sourceArtifactId: source.artifactId,
    sourceArtifactSha256: source.contentSha256,
    sourceFrameIndex: 0,
    sourceFrameWidth: source.width,
    sourceFrameHeight: source.height,
    promptMode: 'box',
    boundingBox: {
      x: 0.8,
      y: 0.1,
      width: 0.4,
      height: 0.8,
    },
  }),
  'out-of-frame box',
  'sam2_subject_prompt_packet_invalid',
)
expectRejects(
  () => createCanonicalSam2SubjectPromptPacket({
    subjectSelectionId: 'subject-selection-no-foreground',
    sourceArtifactId: source.artifactId,
    sourceArtifactSha256: source.contentSha256,
    sourceFrameIndex: 0,
    sourceFrameWidth: source.width,
    sourceFrameHeight: source.height,
    promptMode: 'points',
    points: [
      { x: 0.1, y: 0.1, label: 'background' },
    ],
  }),
  'point prompts without foreground',
  'sam2_subject_prompt_packet_invalid',
)
expectRejects(
  () => createCanonicalSam2SubjectPromptPacket({
    subjectSelectionId: 'subject-selection-duplicate-points',
    sourceArtifactId: source.artifactId,
    sourceArtifactSha256: source.contentSha256,
    sourceFrameIndex: 0,
    sourceFrameWidth: source.width,
    sourceFrameHeight: source.height,
    promptMode: 'points',
    points: [
      { x: 0.2, y: 0.2, label: 'foreground' },
      { x: 0.2, y: 0.2, label: 'foreground' },
    ],
  }),
  'duplicate point prompts',
  'sam2_subject_prompt_packet_invalid',
)
expectRejects(
  () => createCandidate({
    source: {
      ...source,
      durationMilliseconds: 9_999,
    },
  }),
  'source timing mismatch',
  'sam2_source_video_duration_mismatch',
)
expectRejects(
  () => createCandidate({
    subjectPromptArtifactByteLength:
      promptArtifactByteLength + 1,
  }),
  'prompt artifact byte-length mismatch',
  'sam2_subject_prompt_artifact_length_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      artifactBindings: [
        operationRequest.artifactBindings[0],
      ],
    },
  }),
  'missing prompt artifact binding',
  'sam2_operation_requires_source_and_prompt_artifacts',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      settings: {
        ...operationRequest.settings,
        subjectPromptSha256: '0'.repeat(64),
      },
    },
  }),
  'prompt settings digest mismatch',
  'sam2_operation_subject_prompt_digest_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      modelManifestId: 'different-model-manifest-0001',
    },
  }),
  'model manifest mismatch',
  'sam2_operation_model_manifest_mismatch',
)
expectRejects(
  () => createCandidate({
    subjectPrompt: rehashPrompt({
      ...structuredClone(prompt),
      sourceFrameIndex: 300,
    }),
  }),
  'prompt outside source range',
  'sam2_subject_prompt_source_mismatch',
)
expectRejects(
  () => createCandidate({
    gpuBundle: rehashBundle({
      ...structuredClone(gpuBundle),
      execution: {
        ...gpuBundle.execution,
        modelAccelerator: 'cpu',
      },
    }),
  }),
  'CPU bundle substitution',
  'sam2_gpu_bundle_invalid',
)
expectRejects(
  () => createCandidate({
    gpuBundle: rehashBundle({
      ...structuredClone(gpuBundle),
      identity: {
        ...gpuBundle.identity,
        approvedToolOperationId: 'tool.sam2.wrong.v1',
      },
    }),
  }),
  'operation substitution',
  'sam2_gpu_bundle_identity_mismatch',
)
expectRejects(
  () => assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: {
      ...structuredClone(candidate),
      rawModelPath: '/tmp/sam2.pt',
    },
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'path-bearing candidate',
  'sam2_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () => assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: {
      ...structuredClone(candidate),
      admissionDigestSha256: '0'.repeat(64),
    },
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'candidate digest tampering',
  'sam2_gpu_execution_admission_digest_mismatch',
)
expectRejects(
  () => assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: rehashCandidate({
      ...structuredClone(candidate),
      boundaries: {
        ...candidate.boundaries,
        modelInferenceAuthority: true,
      },
    }),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'forged inference authority',
  'sam2_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () => assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: rehashCandidate({
      ...structuredClone(candidate),
      expectedOutputs: [
        {
          ...candidate.expectedOutputs[0],
          contentType: 'application/json',
        },
        candidate.expectedOutputs[1],
        candidate.expectedOutputs[2],
      ],
    }),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'mask output substitution',
  'sam2_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () => assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: structuredClone(candidate),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source: {
      ...source,
      frameCount: 301,
      durationMilliseconds: 10_033,
    },
    operationRequest,
  }),
  'source authority lineage mismatch',
  'sam2_source_video_expectation_lineage_mismatch',
)
expectRejects(
  () => assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    value: structuredClone(candidate),
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest: {
      ...operationRequest,
      approvedSnapshotId: 'approved-snapshot-forged-0002',
    },
  }),
  'operation authority lineage mismatch',
  'sam2_gpu_execution_admission_derived_fields_invalid',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      rawChat: 'segment the speaker',
    },
  }),
  'raw-chat operation field',
  'sam2_professional_operation_request_invalid',
)

console.log(JSON.stringify({
  admissionVersion: candidate.admissionVersion,
  approvedOperationId: candidate.identity.approvedOperationId,
  modelFamily: candidate.modelArtifactBinding.modelFamily,
  checkpointByteLength:
    candidate.modelArtifactBinding.byteLength,
  sourceFrameCount: candidate.source.frameCount,
  promptMode: candidate.subjectPrompt.promptMode,
  promptArtifactBytes:
    candidate.subjectPromptArtifactBinding.byteLength,
  outputProfile:
    candidate.expectedOutputs[0].encodingProfile,
  executionTarget:
    candidate.modelArtifactBinding.executionTarget,
  cloudRunAccelerator:
    candidate.modelArtifactBinding.cloudRunAccelerator,
  cpuFallbackAllowed:
    candidate.modelArtifactBinding.cpuFallbackAllowed,
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
    source: typeof source
    subjectPromptArtifactByteLength: number
    subjectPrompt: typeof prompt
    operationRequest: unknown
    gpuBundle: CanonicalModelArtifactGpuBundle
  }>,
) {
  return createCanonicalSam2CloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle: overrides.gpuBundle ?? gpuBundle,
    source: overrides.source ?? source,
    subjectPromptArtifactId: promptArtifactId,
    subjectPromptArtifactByteLength:
      overrides.subjectPromptArtifactByteLength
        ?? promptArtifactByteLength,
    subjectPrompt: overrides.subjectPrompt ?? prompt,
    operationRequest:
      overrides.operationRequest ?? operationRequest,
  })
}

function controlledSam2GpuBundle():
CanonicalModelArtifactGpuBundle {
  const descriptor = requirementSet.descriptor
  const artifactDraft = {
    canonicalOrder: 0,
    slotId: 'sam2_checkpoint',
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
    requiredExecutionTarget: 'google_cloud_run_gpu' as const,
    accelerator: 'cuda' as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    fullRepositoryChecksumVerified: true as const,
    required: true as const,
  }
  const artifact: CanonicalModelArtifactGpuBundleArtifact = {
    ...artifactDraft,
    artifactBindingDigestSha256:
      sha256AuthorityValue(artifactDraft),
  }
  const identity = {
    dispatchIntentId: 'dispatch-intent-sam2-0001',
    dispatchBindingHash: SHA.dispatchBinding,
    attemptPlanHash: SHA.attemptPlan,
    handoffManifestHash: SHA.handoffManifest,
    manifestEntryHash: SHA.manifestEntry,
    queueDefinitionHash: SHA.queueDefinition,
    regionAuthorityHash: SHA.regionAuthority,
    jobId: 'gpu-job-sam2-0001',
    deliveryAttempt: 1,
    approvedToolId: 'sam2',
    approvedToolOperationId:
      'tool.sam2.segment_and_track_subject.v1',
    runtimeRegion: 'us-east1' as const,
    targetHash: SHA.target,
    cloudRunJobResourceName:
      'projects/reeditpro-production/locations/us-east1/jobs/reeditpro-gpu-ai-worker',
    cloudRunJobRequestSha256: SHA.cloudRunRequest,
    workerServiceAccountEmail:
      'gpu-worker@reeditpro-production.iam.gserviceaccount.com',
  }
  const requirementsDigestSha256 =
    sha256AuthorityValue([requirementProjection(artifact)])
  const bundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity,
      consumerScope: 'sam2.private-inference',
      requirementsDigestSha256,
    }).slice(0, 32)}`
  const bundleDraft = {
    bundleVersion: 'canonical-model-artifact-gpu-bundle-v1' as const,
    bundleClass:
      'verified_server_resolved_model_artifact_gpu_bundle' as const,
    source:
      'canonical_model_artifact_repository_and_cloud_dispatch_attempt' as const,
    bundleId,
    identity,
    consumerScope: 'sam2.private-inference',
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

function rehashPrompt(
  value: Record<string, unknown>,
): typeof prompt {
  const draft = { ...value }
  delete draft.promptDigestSha256
  return {
    ...draft,
    promptDigestSha256: sha256AuthorityValue(draft),
  } as typeof prompt
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
