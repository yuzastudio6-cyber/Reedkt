import assert from 'node:assert/strict'

import {
  assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate,
  assertCanonicalFasterWhisperGpuBundleRequirementProjection,
  assertCanonicalFasterWhisperGpuRuntimeRequestCandidate,
  assertCanonicalFasterWhisperModelArtifactRequirementSet,
  createCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate,
  createCanonicalFasterWhisperGpuRuntimeRequestCandidate,
  getCanonicalFasterWhisperModelArtifactRequirementSet,
  projectCanonicalFasterWhisperGpuBundleRequirements,
  type CanonicalFasterWhisperSourceAudioExpectationInput,
  type CanonicalModelArtifactGpuBundle,
  type CanonicalModelArtifactGpuBundleArtifact,
  type CanonicalModelArtifactGpuBundleRequirement,
  type CanonicalModelArtifactLocator,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  CANONICAL_PRIVATE_E2E_TOOL_IDS,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution'

const SHA = {
  descriptor: 'a'.repeat(64),
  objectIdentity: 'b'.repeat(64),
  dispatchBinding: 'c'.repeat(64),
  attemptPlan: 'd'.repeat(64),
  handoffManifest: 'e'.repeat(64),
  manifestEntry: 'f'.repeat(64),
  queueDefinition: '1'.repeat(64),
  regionAuthority: '2'.repeat(64),
  target: '3'.repeat(64),
  cloudRunRequest: '4'.repeat(64),
  source: '5'.repeat(64),
  snapshot: '6'.repeat(64),
  workItem: '7'.repeat(64),
}

const requirementSet =
  getCanonicalFasterWhisperModelArtifactRequirementSet()

assert.equal(requirementSet.approvedToolId, 'faster_whisper')
assert.equal(
  requirementSet.approvedOperationId,
  'tool.faster_whisper.transcribe_private_audio.v1',
)
assert.equal(requirementSet.summary.artifactCount, 4)
assert.equal(
  requirementSet.summary.totalByteLength,
  486_212_372,
)
assert.equal(
  requirementSet.sourceObservation.sourceRevision,
  '65882eee9f5cdbeeb2d877f1131d48cf241b327d',
)
assert.equal(
  requirementSet.sourceObservation.modelRevision,
  '536b0662742c02347bc0e980a01041f333bce120',
)
assert.equal(
  requirementSet.sourceObservation.modelBinaryByteLength,
  483_546_902,
)
assert.equal(
  requirementSet.sourceObservation.modelBinaryLfsSha256,
  '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671',
)
assert.deepEqual(
  requirementSet.sourceObservation.expectedRuntimeFileNames,
  [
    'config.json',
    'model.bin',
    'tokenizer.json',
    'vocabulary.txt',
  ],
)
assert.deepEqual(
  requirementSet.artifacts.map((artifact) => ({
    order: artifact.canonicalOrder,
    slot: artifact.slotId,
    bytes: artifact.byteLength,
    sha256: artifact.contentSha256,
  })),
  [
    {
      order: 0,
      slot: 'faster_whisper_config',
      bytes: 2_370,
      sha256:
        'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828',
    },
    {
      order: 1,
      slot: 'faster_whisper_model',
      bytes: 483_546_902,
      sha256:
        '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671',
    },
    {
      order: 2,
      slot: 'faster_whisper_tokenizer',
      bytes: 2_203_239,
      sha256:
        'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab',
    },
    {
      order: 3,
      slot: 'faster_whisper_vocabulary',
      bytes: 459_861,
      sha256:
        '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913',
    },
  ],
)
assert.equal(
  requirementSet.boundaries.legacyManifestTemplateStillPlaceholder,
  true,
)
assert.equal(
  requirementSet.boundaries.canonicalOperationArtifactSetVerified,
  false,
)
assert.equal(requirementSet.boundaries.productionReady, false)
assert.deepEqual(
  assertCanonicalFasterWhisperModelArtifactRequirementSet(
    structuredClone(requirementSet),
  ),
  requirementSet,
)

const locators = requirementSet.artifacts.map(
  (artifact, index): CanonicalModelArtifactLocator => ({
    locatorVersion: 'canonical-model-artifact-locator-v1',
    artifactRecordId:
      `model-artifact-${String(index + 6).repeat(64)}`,
    artifactId: artifact.artifactId,
    revision: artifact.revision,
    contentSha256: artifact.contentSha256,
    manifestDigestSha256:
      String(index + 1).repeat(64),
  }),
) as unknown as readonly [
  CanonicalModelArtifactLocator,
  CanonicalModelArtifactLocator,
  CanonicalModelArtifactLocator,
  CanonicalModelArtifactLocator,
]

const projection =
  projectCanonicalFasterWhisperGpuBundleRequirements({
    requirementSet,
    locators,
  })
assert.equal(projection.requirements.length, 4)
assert.equal(
  projection.consumerScope,
  'faster_whisper.private-inference',
)
assert.equal(
  projection.requirements[1].expectedArtifactFormat,
  'reviewed_binary',
)
assert.equal(
  projection.requirements[1].expectedByteLength,
  483_546_902,
)
assert.equal(
  projection.canonicalOperationArtifactSetVerified,
  false,
)
assert.deepEqual(
  assertCanonicalFasterWhisperGpuBundleRequirementProjection(
    structuredClone(projection),
  ),
  projection,
)

const gpuBundle = controlledFasterWhisperGpuBundle()
const source: CanonicalFasterWhisperSourceAudioExpectationInput = {
  artifactId: 'private-audio-artifact-0001',
  contentSha256: SHA.source,
  byteLength: 9_600_044,
  durationMilliseconds: 300_000,
  sampleRateHz: 16_000,
  channelCount: 1,
  sampleFormat: 'pcm_s16le',
  dependencyQaEvaluationId: 'audio-qa-evaluation-0001',
  dependencyReconciliationId: 'audio-reconciliation-0001',
}
const operationRequest = {
  operationId:
    'tool.faster_whisper.transcribe_private_audio.v1',
  approvedSnapshotId: 'approved-snapshot-0001',
  approvedSnapshotHash: SHA.snapshot,
  workItemId: 'approved-work-item-0001',
  workItemHash: SHA.workItem,
  creditEstimateId: 'credit-estimate-0001',
  creditReservationId: 'credit-reservation-0001',
  workerLeaseId: 'worker-lease-0001',
  idempotencyKey: 'faster-whisper-operation-attempt-0001',
  artifactBindings: [{
    artifactId: source.artifactId,
    kind: 'audio',
    contentType: 'audio/wav',
    sha256: source.contentSha256,
    byteLength: source.byteLength,
  }],
  settings: {
    device: 'cuda',
    computeType: 'float16',
    beamSize: 5,
    wordTimestamps: true,
    vadFilter: true,
    languagePolicy: 'auto_detect_v1',
    temperature: 0,
    conditionOnPreviousText: true,
  },
  modelArtifactManifestDigests: locators.map(
    (locator) => locator.manifestDigestSha256,
  ),
}

const candidate =
  createCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  })

assert.equal(
  candidate.admissionClass,
  'controlled_non_executable_faster_whisper_gpu_operation_preflight',
)
assert.equal(candidate.identity.approvedToolId, 'faster_whisper')
assert.equal(candidate.modelArtifactBinding.artifactCount, 4)
assert.equal(
  candidate.modelArtifactBinding.totalByteLength,
  486_212_372,
)
assert.equal(
  candidate.modelArtifactBinding.executionTarget,
  'google_cloud_run_gpu',
)
assert.equal(
  candidate.modelArtifactBinding.cloudRunAccelerator,
  'nvidia_l4',
)
assert.equal(candidate.identity.runtimeRegion, 'europe-west1')
assert.equal(candidate.summary.exactCloudRunL4RegionMatched, true)
assert.equal(candidate.settings.device, 'cuda')
assert.equal(candidate.settings.computeType, 'float16')
assert.equal(candidate.settings.wordTimestamps, true)
assert.equal(candidate.settings.vadFilter, true)
assert.equal(candidate.source.sampleRateHz, 16_000)
assert.equal(candidate.source.channelCount, 1)
assert.equal(candidate.expectedOutputs.length, 3)
assert.deepEqual(candidate.requiredQaGates, [
  'transcript_alignment',
  'caption_timing',
])
assert.equal(
  candidate.boundaries.productionToolRegistryCountPreserved,
  true,
)
assert.equal(
  candidate.boundaries.productionToolPromotionAuthorized,
  false,
)
assert.equal(candidate.boundaries.cpuExecutionAccepted, false)
assert.equal(candidate.boundaries.cloudDispatchAuthorized, false)
assert.equal(candidate.boundaries.modelInferenceAuthority, false)
assert.equal(candidate.boundaries.productionReady, false)
assert.deepEqual(
  assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
    value: structuredClone(candidate),
    requirementSet: structuredClone(requirementSet),
    requirementProjection: structuredClone(projection),
    gpuBundle: structuredClone(gpuBundle),
    source: structuredClone(source),
    operationRequest: structuredClone(operationRequest),
  }),
  candidate,
)

const runtimeRequestCandidate =
  await createCanonicalFasterWhisperGpuRuntimeRequestCandidate({
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  })

assert.equal(
  runtimeRequestCandidate.requestCandidateClass,
  'server_derived_non_dispatching_gpu_runtime_request_candidate',
)
assert.equal(
  runtimeRequestCandidate.runnerRequest.dispatch.runtimeRegion,
  'europe-west1',
)
assert.equal(
  runtimeRequestCandidate.runnerRequest.settings.device,
  'cuda',
)
assert.equal(
  runtimeRequestCandidate.runnerRequest.settings.computeType,
  'float16',
)
assert.equal(
  runtimeRequestCandidate.runnerRequest.modelArtifacts.length,
  4,
)
assert.equal(
  runtimeRequestCandidate.summary.requestContainsCallerPaths,
  false,
)
assert.equal(
  runtimeRequestCandidate.summary.requestContainsCallerBytes,
  false,
)
assert.equal(
  runtimeRequestCandidate.boundaries.runnerInvoked,
  false,
)
assert.equal(
  runtimeRequestCandidate.boundaries.cloudDispatchAuthorized,
  false,
)
assert.equal(
  runtimeRequestCandidate.boundaries.productionReady,
  false,
)
assert.deepEqual(
  await assertCanonicalFasterWhisperGpuRuntimeRequestCandidate({
    candidate: structuredClone(runtimeRequestCandidate),
    value: structuredClone(candidate),
    requirementSet: structuredClone(requirementSet),
    requirementProjection: structuredClone(projection),
    gpuBundle: structuredClone(gpuBundle),
    source: structuredClone(source),
    operationRequest: structuredClone(operationRequest),
  }),
  runtimeRequestCandidate,
)

assert.equal(CANONICAL_PRIVATE_E2E_TOOL_IDS.length, 50)
assert.equal(
  (CANONICAL_PRIVATE_E2E_TOOL_IDS as readonly string[])
    .includes('faster_whisper'),
  false,
)
assert.equal(
  resolveProfessionalToolOperationSpec('faster_whisper'),
  undefined,
)

let adversarialAssertions = 0

await expectRejectsAsync(
  () => assertCanonicalFasterWhisperGpuRuntimeRequestCandidate({
    candidate: {
      ...structuredClone(runtimeRequestCandidate),
      sourcePath: '/tmp/caller.wav',
    },
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'runtime request caller path',
  'faster_whisper_gpu_runtime_request_candidate_mismatch',
)
await expectRejectsAsync(
  () => assertCanonicalFasterWhisperGpuRuntimeRequestCandidate({
    candidate: {
      ...structuredClone(runtimeRequestCandidate),
      runnerRequest: {
        ...runtimeRequestCandidate.runnerRequest,
        settings: {
          ...runtimeRequestCandidate.runnerRequest.settings,
          device: 'cpu',
        },
      },
    },
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'runtime request CPU substitution',
  'faster_whisper_gpu_runtime_request_candidate_mismatch',
)
await expectRejectsAsync(
  () => assertCanonicalFasterWhisperGpuRuntimeRequestCandidate({
    candidate: {
      ...structuredClone(runtimeRequestCandidate),
      boundaries: {
        ...runtimeRequestCandidate.boundaries,
        cloudDispatchAuthorized: true,
      },
    },
    value: candidate,
    requirementSet,
    requirementProjection: projection,
    gpuBundle,
    source,
    operationRequest,
  }),
  'runtime request dispatch promotion',
  'faster_whisper_gpu_runtime_request_candidate_mismatch',
)

expectRejects(
  () => assertCanonicalFasterWhisperModelArtifactRequirementSet({
    ...structuredClone(requirementSet),
    forgedProductionAuthority: true,
  }),
  'unknown requirement field',
  'faster_whisper_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => assertCanonicalFasterWhisperModelArtifactRequirementSet(
    rehashRequirementSet({
      ...structuredClone(requirementSet),
      approvedOperationId:
        'tool.faster_whisper.unregistered.v1',
    }),
  ),
  'operation substitution',
  'faster_whisper_model_artifact_requirement_set_invalid',
)
expectRejects(
  () => projectCanonicalFasterWhisperGpuBundleRequirements({
    requirementSet,
    locators: [
      locators[1],
      locators[0],
      locators[2],
      locators[3],
    ],
  }),
  'locator reorder',
  'faster_whisper_model_artifact_locator_mismatch',
)
expectRejects(
  () => assertCanonicalFasterWhisperGpuBundleRequirementProjection({
    ...structuredClone(projection),
    projectionDigestSha256: '0'.repeat(64),
  }),
  'projection digest tampering',
  'faster_whisper_gpu_bundle_requirement_projection_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      rawChat: 'transcribe this',
    },
  }),
  'raw chat field',
  'faster_whisper_candidate_operation_request_invalid',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      settings: {
        ...operationRequest.settings,
        device: 'cpu',
      },
    },
  }),
  'CPU settings substitution',
  'faster_whisper_candidate_operation_request_invalid',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      artifactBindings: [{
        ...operationRequest.artifactBindings[0],
        sha256: '0'.repeat(64),
      }],
    },
  }),
  'audio artifact substitution',
  'faster_whisper_operation_audio_artifact_mismatch',
)
expectRejects(
  () => createCandidate({
    operationRequest: {
      ...operationRequest,
      modelArtifactManifestDigests: [
        operationRequest.modelArtifactManifestDigests[1],
        operationRequest.modelArtifactManifestDigests[0],
        operationRequest.modelArtifactManifestDigests[2],
        operationRequest.modelArtifactManifestDigests[3],
      ],
    },
  }),
  'model manifest reorder',
  'faster_whisper_operation_model_manifest_set_mismatch',
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
  'faster_whisper_gpu_bundle_invalid',
)
expectRejects(
  () => createCandidate({
    gpuBundle: mutateBundleIdentity(gpuBundle, {
      runtimeRegion: 'us-east1',
      cloudRunJobResourceName:
        'projects/reeditpro-production/locations/us-east1/jobs/reeditpro-gpu-ai-worker',
    }),
  }),
  'unsupported L4 region',
  'faster_whisper_gpu_bundle_identity_mismatch',
)
expectRejects(
  () => createCandidate({
    gpuBundle: mutateFirstArtifact(gpuBundle, {
      artifactRole: 'whisper-tokenizer',
    }),
  }),
  'artifact role substitution',
  'faster_whisper_gpu_bundle_artifact_mismatch',
)
expectRejects(
  () =>
    assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
      value: {
        ...structuredClone(candidate),
        modelPath: '/tmp/model.bin',
      },
      requirementSet,
      requirementProjection: projection,
      gpuBundle,
      source,
      operationRequest,
    }),
  'path-bearing candidate',
  'faster_whisper_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () =>
    assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
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
  'faster_whisper_gpu_execution_admission_digest_mismatch',
)
expectRejects(
  () =>
    assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
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
  'faster_whisper_gpu_execution_admission_candidate_invalid',
)
expectRejects(
  () =>
    assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
      value: structuredClone(candidate),
      requirementSet,
      requirementProjection: projection,
      gpuBundle,
      source: {
        ...source,
        durationMilliseconds: source.durationMilliseconds + 1,
      },
      operationRequest,
    }),
  'source lineage mismatch',
  'faster_whisper_source_audio_expectation_lineage_mismatch',
)
expectRejects(
  () =>
    assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
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
  'approved snapshot lineage mismatch',
  'faster_whisper_gpu_execution_admission_derived_fields_invalid',
)
expectRejects(
  () =>
    assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
      value: rehashCandidate({
        ...structuredClone(candidate),
        expectedOutputs: [
          {
            ...candidate.expectedOutputs[0],
            encodingProfile: 'unreviewed_transcript_json',
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
  'output profile substitution',
  'faster_whisper_gpu_execution_admission_candidate_invalid',
)

console.log(JSON.stringify({
  requirementSetVersion: requirementSet.requirementSetVersion,
  admissionVersion: candidate.admissionVersion,
  productionToolCount: CANONICAL_PRIVATE_E2E_TOOL_IDS.length,
  candidateOutsideProductionRegistry:
    resolveProfessionalToolOperationSpec('faster_whisper')
      === undefined,
  modelRevision:
    requirementSet.sourceObservation.modelRevision,
  modelArtifactCount:
    candidate.modelArtifactBinding.artifactCount,
  modelArtifactBytes:
    candidate.modelArtifactBinding.totalByteLength,
  executionTarget:
    candidate.modelArtifactBinding.executionTarget,
  cloudRunAccelerator:
    candidate.modelArtifactBinding.cloudRunAccelerator,
  runtimeRegion: candidate.identity.runtimeRegion,
  runtimeRequestBytes:
    runtimeRequestCandidate.serializedRunnerRequestByteLength,
  runtimeRequestCandidateOnly:
    runtimeRequestCandidate.boundaries.candidateOnly,
  device: candidate.settings.device,
  computeType: candidate.settings.computeType,
  cpuFallbackAllowed:
    candidate.modelArtifactBinding.cpuFallbackAllowed,
  cloudDispatchAuthorized:
    candidate.boundaries.cloudDispatchAuthorized,
  modelInferenceAuthority:
    candidate.boundaries.modelInferenceAuthority,
  productionReady: candidate.boundaries.productionReady,
  adversarialAssertions,
}, null, 2))

function createCandidate(overrides: Partial<{
  operationRequest: unknown
  gpuBundle: CanonicalModelArtifactGpuBundle
}>) {
  return createCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate({
    requirementSet,
    requirementProjection: projection,
    gpuBundle: overrides.gpuBundle ?? gpuBundle,
    source,
    operationRequest:
      overrides.operationRequest ?? operationRequest,
  })
}

function controlledFasterWhisperGpuBundle():
CanonicalModelArtifactGpuBundle {
  const artifacts = requirementSet.descriptors.map(
    (descriptor, index): CanonicalModelArtifactGpuBundleArtifact => {
      const locator = locators[index]!
      const requirement = requirementSet.artifacts[index]!
      const draft = {
        canonicalOrder: requirement.canonicalOrder,
        slotId: requirement.slotId,
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
      return {
        ...draft,
        artifactBindingDigestSha256:
          sha256AuthorityValue(draft),
      }
    },
  )
  const identity = {
    dispatchIntentId: 'dispatch-intent-faster-whisper-0001',
    dispatchBindingHash: SHA.dispatchBinding,
    attemptPlanHash: SHA.attemptPlan,
    handoffManifestHash: SHA.handoffManifest,
    manifestEntryHash: SHA.manifestEntry,
    queueDefinitionHash: SHA.queueDefinition,
    regionAuthorityHash: SHA.regionAuthority,
    jobId: 'gpu-job-faster-whisper-0001',
    deliveryAttempt: 1,
    approvedToolId: 'faster_whisper',
    approvedToolOperationId:
      'tool.faster_whisper.transcribe_private_audio.v1',
    runtimeRegion: 'europe-west1' as const,
    targetHash: SHA.target,
    cloudRunJobResourceName:
      'projects/reeditpro-production/locations/europe-west1/jobs/reeditpro-gpu-ai-worker',
    cloudRunJobRequestSha256: SHA.cloudRunRequest,
    workerServiceAccountEmail:
      'gpu-worker@reeditpro-production.iam.gserviceaccount.com',
  }
  const requirementsDigestSha256 = sha256AuthorityValue(
    artifacts.map(requirementProjection),
  )
  const bundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity,
      consumerScope: 'faster_whisper.private-inference',
      requirementsDigestSha256,
    }).slice(0, 32)}`
  const draft = {
    bundleVersion: 'canonical-model-artifact-gpu-bundle-v1' as const,
    bundleClass:
      'verified_server_resolved_model_artifact_gpu_bundle' as const,
    source:
      'canonical_model_artifact_repository_and_cloud_dispatch_attempt' as const,
    bundleId,
    identity,
    consumerScope: 'faster_whisper.private-inference',
    requirementsDigestSha256,
    artifacts,
    summary: {
      artifactCount: 4,
      totalByteLength: 486_212_372,
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
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
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

function mutateFirstArtifact(
  bundle: CanonicalModelArtifactGpuBundle,
  mutation: Partial<CanonicalModelArtifactGpuBundleArtifact>,
): CanonicalModelArtifactGpuBundle {
  const artifacts = [...structuredClone(bundle.artifacts)]
  const first = {
    ...artifacts[0]!,
    ...mutation,
  }
  const { artifactBindingDigestSha256: _digest, ...firstDraft } =
    first
  void _digest
  artifacts[0] = {
    ...firstDraft,
    artifactBindingDigestSha256:
      sha256AuthorityValue(firstDraft),
  }
  const requirementsDigestSha256 = sha256AuthorityValue(
    artifacts.map(requirementProjection),
  )
  const bundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity: bundle.identity,
      consumerScope: bundle.consumerScope,
      requirementsDigestSha256,
    }).slice(0, 32)}`
  return rehashBundle({
    ...structuredClone(bundle),
    bundleId,
    requirementsDigestSha256,
    artifacts,
  })
}

function mutateBundleIdentity(
  bundle: CanonicalModelArtifactGpuBundle,
  mutation: Partial<
    CanonicalModelArtifactGpuBundle['identity']
  >,
): CanonicalModelArtifactGpuBundle {
  const identity = {
    ...structuredClone(bundle.identity),
    ...mutation,
  }
  const bundleId =
    `model_gpu_bundle_${sha256AuthorityValue({
      identity,
      consumerScope: bundle.consumerScope,
      requirementsDigestSha256:
        bundle.requirementsDigestSha256,
    }).slice(0, 32)}`
  return rehashBundle({
    ...structuredClone(bundle),
    identity,
    bundleId,
  })
}

function rehashRequirementSet(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.requirementSetDigestSha256
  return {
    ...draft,
    requirementSetDigestSha256: sha256AuthorityValue(draft),
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

async function expectRejectsAsync(
  operation: () => Promise<unknown>,
  label: string,
  code: string,
): Promise<void> {
  await assert.rejects(
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
