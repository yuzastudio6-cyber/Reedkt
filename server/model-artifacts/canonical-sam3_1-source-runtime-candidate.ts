import { z } from 'zod'

import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION =
  'canonical-sam3_1-source-runtime-candidate-v4' as const
export const CANONICAL_SAM3_1_OPERATION_ID =
  'tool.sam3_1.segment_and_track_subject.v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeText = z.string().trim().min(1).max(1_000)

const candidateWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  ),
  source: z.literal('canonical_backend_sam3_1_source_candidate'),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  registryIdentity: z.object({
    canonicalToolId: z.literal('sam3_1'),
    catalogClass: z.literal('non_e2e_capability_candidate'),
    productionStatus: z.literal('needs_license_review'),
    workerType: z.literal('gpu_ai_worker'),
    gpuRequired: z.literal(true),
    cpuAllowed: z.literal(false),
  }).strict(),
  replacement: z.object({
    supersedesForNewPlans: z.literal('sam2'),
    sam2HistoricalEvidenceReadable: z.literal(true),
    sam2MayAuthorizeNewPlanWorkFallbackOrRepair: z.literal(false),
    livingFrameEstimateProjectionVersion: z.literal(
      'canonical-living-frame-estimate-work-asset-projection-v7',
    ),
    livingFrameWorkGraphProjectionVersion: z.literal(
      'canonical-living-frame-work-graph-projection-v9',
    ),
    livingFrameTemporalMaskUsesSam31Operation: z.literal(true),
    directSam2SubprocessSpawnerAvailable: z.literal(false),
    existingApprovedSnapshotMayBeRewritten: z.literal(false),
    newPlanEstimateApprovalSnapshotAndReservationRequired: z.literal(true),
  }).strict(),
  officialSource: z.object({
    repository: z.literal('https://github.com/facebookresearch/sam3.git'),
    sourceRevision: z.literal(
      '96914d2425f90a64f45ca977c2b5165418099543',
    ),
    sourceTree: z.literal(
      '573deb167702e014829a5b830de8ae62abe891d5',
    ),
    sourceParentRevision: z.literal(
      '6dbb02bd38288df755dfa1378000a861e65b84f6',
    ),
    sourceCommittedAt: z.literal('2026-07-30T17:21:37-07:00'),
    sourceRevisionObservedAt: z.literal('2026-08-01T16:00:00.000Z'),
    release: z.literal('SAM 3.1'),
    releaseDate: z.literal('2026-03-27'),
    sourceLicenseFileSha256: z.literal(
      '4dea99bfaa016e21bc860d73f344236bd1e5c4977d1a9a8fd32f822b500ae1be',
    ),
    deterministicGitArchiveFormat: z.literal(
      'git_archive_tar_uncompressed',
    ),
    deterministicGitArchivePrefix: z.literal('sam3/'),
    deterministicGitArchiveByteLength: z.literal(73_605_120),
    deterministicGitArchiveSha256: z.literal(
      '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
    ),
    pyprojectSha256: z.literal(
      '255f5d8d1db011459878e3de296a6afc84e03a8dda2bfa756a4de304aaff6366',
    ),
    modelBuilderSha256: z.literal(
      'd71d6d3e485ec3eae48bbc2ba676f401b5853d65c4195a91d077b04da38121c2',
    ),
    basePredictorSha256: z.literal(
      'e6ac612276ab208fa486499507175acc3f93fd6aab753dd553468b3330ad536b',
    ),
    multiplexVideoPredictorSha256: z.literal(
      '15abe64bff63c95b8bcb67b5af0818b1b3783eb6537ec4d8b3a5e6b56915d1c1',
    ),
    submodulesRequired: z.literal(false),
    sourceRevisionSignatureVerified: z.literal(false),
    sourceArchiveIngestedAndReread: z.literal(false),
    sourceSecurityScanPassed: z.literal(false),
    sourceLicenseApprovedForReeditpro: z.literal(false),
  }).strict(),
  officialCheckpoint: z.object({
    repository: z.literal('facebook/sam3.1'),
    repositoryRevision: z.literal(
      'daa63191845a41281374e725f4c9e51c7a824460',
    ),
    fileName: z.literal('sam3.1_multiplex.pt'),
    repositoryGating: z.literal('manual'),
    hostedInferenceProviderAvailable: z.literal(false),
    transformersIntegrationAvailable: z.literal(false),
    knownPublicCompatibilityIssueNumber: z.literal(526),
    knownPublicCompatibilityIssueStateAtReview: z.literal('open'),
    knownPublicCompatibilityIssueObservedAt: z.literal('2026-08-06'),
    pinnedSourceAndCheckpointMayBeAssumedCompatible: z.literal(false),
    unreviewedCheckpointKeyRewriteAllowed: z.literal(false),
    partialTrackerLoadWarningMayQualifyCompatibility: z.literal(false),
    strictFinalAssembledVideoModelMayQualifyWithoutIssueClosure:
      z.literal(true),
    strictQualificationRequiresSingleCheckpointLoad: z.literal(true),
    strictQualificationRequiresExactModelKeySet: z.literal(true),
    strictQualificationRequiresCompleteVideoProbe: z.literal(true),
    exactByteLengthAvailableWithoutAuthorizedDownload: z.literal(false),
    exactSha256AvailableWithoutAuthorizedDownload: z.literal(false),
    thirdPartyMirrorOrScanMaySatisfyCanonicalIngest: z.literal(false),
    thirdPartyMirrorDownloadAllowed: z.literal(false),
    gatedRepositoryAccessRequired: z.literal(true),
    authorizedHumanTermsAcceptanceRequired: z.literal(true),
    automatedTermsAcceptanceAllowed: z.literal(false),
    exactDownloadedByteLength: z.null(),
    exactDownloadedSha256: z.null(),
    checkpointLicenseApprovedForReeditpro: z.literal(false),
    checkpointMalwareScanPassed: z.literal(false),
    checkpointPrivateArtifactIngested: z.literal(false),
    checkpointGenerationEtagAndHashRereadVerified: z.literal(false),
  }).strict(),
  runtimeClosure: z.object({
    pythonMinimumVersion: z.literal('3.12'),
    torchMinimumVersion: z.literal('2.7'),
    cudaMinimumVersion: z.literal('12.6'),
    candidatePythonVersion: z.literal('3.12'),
    candidateTorchVersion: z.literal('2.10.0'),
    candidateTorchvisionVersion: z.literal('0.25.0'),
    candidateTorchcodecVersion: z.literal('0.10.0'),
    candidateCudaVersion: z.literal('12.8'),
    reeditproGpuDecodePatchSha256: z.literal(
      'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
    ),
    reeditproGpuDecodePatchAppliesCleanlyToPinnedSource: z.literal(true),
    reeditproGpuDecodePatchSemanticAuditPassed: z.literal(true),
    reeditproGpuDecodePatchModifiedPaths: z.tuple([
      z.literal('sam3/model/io_utils.py'),
      z.literal('sam3/model/sam3_base_predictor.py'),
      z.literal('sam3/model/sam3_multiplex_tracking.py'),
      z.literal('sam3/model/sam3_multiplex_video_predictor.py'),
      z.literal('sam3/model_builder.py'),
    ]),
    reeditproPatchedSourceTree: z.literal(
      'f3a58b95a0e460d76e1cf38abff0382a7307f67d',
    ),
    deterministicPatchedSourceArchiveFormat: z.literal(
      'git_archive_tree_tar_uncompressed_fixed_mtime',
    ),
    deterministicPatchedSourceArchivePrefix: z.literal('sam3/'),
    deterministicPatchedSourceArchiveMtime: z.literal(
      '2026-07-30T17:21:37-07:00',
    ),
    deterministicPatchedSourceArchiveByteLength: z.literal(73_605_120),
    deterministicPatchedSourceArchiveSha256: z.literal(
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    ),
    callerSuppliedPatchedSourceArchiveHashAllowed: z.literal(false),
    candidateBaseImage: z.object({
      taggedReference: z.literal(
        'pytorch/pytorch:2.10.0-cuda12.8-cudnn9-runtime',
      ),
      resolvedReference: z.literal(
        'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      ),
      resolvedDigestSha256: z.literal(
        'b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      ),
      platformOs: z.literal('linux'),
      platformArchitecture: z.literal('amd64'),
      observedPythonVersion: z.literal('3.12'),
      observedTorchVersion: z.literal('2.10.0'),
      observedCudaVersion: z.literal('12.8.1'),
      observedAt: z.literal('2026-08-02T12:39:12Z'),
      immutableDigestObserved: z.literal(true),
      dependencyClosureQualified: z.literal(false),
      imageBuildUseAuthorized: z.literal(false),
    }).strict(),
    cudaDriverCompatibility: z.object({
      officialNvidiaCompatibilityDocumentation: z.literal(
        'https://docs.nvidia.com/deploy/cuda-compatibility/forward-compatibility.html',
      ),
      officialCloudRunGpuDocumentation: z.literal(
        'https://docs.cloud.google.com/run/docs/configuring/jobs/gpu',
      ),
      cloudRunL4DocumentedDriverBranch: z.literal('535.x'),
      cloudRunL4DocumentedCudaDriverCapability: z.literal('12.2'),
      cudaForwardCompatibilityPackageName: z.literal('cuda-compat-12-8'),
      cudaForwardCompatibilityPackageVersion: z.literal(
        '570.211.01-0ubuntu1',
      ),
      cudaForwardCompatibilityRepository: z.literal(
        'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64',
      ),
      cudaForwardCompatibilityFileName: z.literal(
        'cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb',
      ),
      cudaForwardCompatibilityByteLength: z.literal(37_945_232),
      cudaForwardCompatibilitySha256: z.literal(
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      ),
      packageArchitecture: z.literal('amd64'),
      packageRepositoryObservedAt: z.literal('2026-08-03T00:00:00.000Z'),
      compatibilityLibraryPath: z.literal(
        '/usr/local/cuda-12.8/compat',
      ),
      minimumSupportedHostDriverMajor: z.literal(535),
      compatibilityPackageUsedBelowDriverMajor: z.literal(570),
      hostDriverLibrariesUsedAtOrAboveDriverMajor: z.literal(570),
      runtimeDriverVersionAndLoadedLibraryPathEvidenceRequired:
        z.literal(true),
      callerSelectedCompatibilityPackageAllowed: z.literal(false),
      networkPackageInstallAllowed: z.literal(false),
      packageIngestedAndReread: z.literal(false),
      packageSecurityScanPassed: z.literal(false),
      a100CompatibilityQualified: z.literal(false),
      l4CompatibilityQualified: z.literal(false),
    }).strict(),
    optionalFlashAttention3MayBeUsedOnlyAfterSeparateQualification:
      z.literal(true),
    exactBaseImageDigestPinned: z.literal(false),
    exactWheelAndNativeLibraryHashesPinned: z.literal(false),
    sourceInstalledFromExactRevision: z.literal(false),
    checkpointAndPinnedSourceCompatibilityQualified: z.literal(false),
    noMissingOrUnexpectedCheckpointKeysQualified: z.literal(false),
    immutableA100ImageBuiltAndScanned: z.literal(false),
    immutableL4ImageBuiltAndScanned: z.literal(false),
  }).strict(),
  fixedApi: z.object({
    builder: z.literal('build_sam3_multiplex_video_predictor'),
    predictorVersion: z.literal('sam3.1'),
    objectMultiplexRequired: z.literal(true),
    maximumTrackedObjectsProductCap: z.literal(16),
    multiplexBucketSize: z.literal(16),
    useFlashAttention3: z.literal(false),
    useRealValuedRope: z.literal(true),
    torchCompileEnabled: z.literal(false),
    warmupCompilationEnabled: z.literal(false),
    defaultOutputProbabilityThreshold: z.literal(0.5),
    asynchronousFrameLoadingAllowed: z.literal(true),
    upstreamAcceptedSourceMediaForms: z.tuple([
      z.literal('private_read_only_mp4'),
      z.literal('private_read_only_numbered_jpeg_directory'),
    ]),
    reeditproGpuAdmissibleSourceMediaForms: z.tuple([
      z.literal('private_read_only_mp4'),
    ]),
    gpuDecodeBackend: z.literal('torchcodec_0_10_cuda_nvdec'),
    gpuDecodeRequired: z.literal(true),
    cpuOpenCvOrPillowDecodeAllowed: z.literal(false),
    strictCheckpointLoadRequired: z.literal(true),
    cudaOutputTensorsRequired: z.literal(true),
    boundedCpuOutputSerializationOnly: z.literal(true),
    lifecycleRequestOrder: z.tuple([
      z.literal('start_session'),
      z.literal('add_prompt'),
      z.literal('propagate_in_video'),
      z.literal('close_session'),
    ]),
    requestApi: z.literal('handle_request'),
    streamingRequestApi: z.literal('handle_stream_request'),
    videoPropagationRequestType: z.literal('propagate_in_video'),
    propagationDirection: z.literal('forward'),
    outputObjectIdsField: z.literal('out_obj_ids'),
    outputNormalizedBoxesField: z.literal('out_boxes_xywh'),
    outputBinaryMasksField: z.literal('out_binary_masks'),
    outputMaskPixelType: z.literal('boolean'),
    callerSelectedPythonModuleClassOrCheckpointAllowed: z.literal(false),
    callerRawChatOrExecutableTextAllowed: z.literal(false),
    serverCompiledApprovedSubjectPromptRequired: z.literal(true),
    promptSnapshotAndSourceFrameLineageRequired: z.literal(true),
    runtimeNetworkOrHuggingFaceDownloadAllowed: z.literal(false),
    exactPrivateCheckpointMountRequired: z.literal(true),
    exactSourceMediaMountRequired: z.literal(true),
    createOnlyPrivateOutputMountRequired: z.literal(true),
  }).strict(),
  compute: z.object({
    primaryProfileId: z.literal(
      CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0],
    ),
    fallbackProfileId: z.literal(
      CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
    ),
    a100Primary: z.literal(true),
    l4ClassifiedFallback: z.literal(true),
    explicitApprovedUserEditTriggerRequired: z.literal(true),
    noApprovedWorkMeansZeroGpuJobs: z.literal(true),
    cpuOnlyHeavyExecutionAllowed: z.literal(false),
    outputOffloadToCpuForEvaluationAllowed: z.literal(false),
    modelQuantizationAllowed: z.literal(false),
    resolutionReductionAllowed: z.literal(false),
    temporalQaReductionAllowed: z.literal(false),
    costOnlyFallbackAllowed: z.literal(false),
    unknownOutcomeFallbackAllowed: z.literal(false),
  }).strict(),
  cost: z.object({
    costProfileId: z.literal('sam3_1_multiplex_video_segmentation_v1'),
    estimateBeforeApprovalRequired: z.literal(true),
    primaryAndFallbackRateAuthoritiesRequired: z.literal(true),
    coldStartAndModelLoadIncluded: z.literal(true),
    exactPerAttemptUsageReceiptRequired: z.literal(true),
    systemFailureChargedToUser: z.literal(false),
    unapprovedOverageChargedToUser: z.literal(false),
    serviceFeeIncludedInToolCost: z.literal(false),
  }).strict(),
  qa: z.object({
    exactSourceFrameAndPromptLineageRequired: z.literal(true),
    maskEdgeQualityRequired: z.literal(true),
    temporalStabilityRequired: z.literal(true),
    subjectCoverageRequired: z.literal(true),
    contactObjectPreservationRequired: z.literal(true),
    completeSelectedIntervalInspectionRequired: z.literal(true),
    downstreamCompositionQaRequired: z.literal(true),
    directPrivateVisualReviewRequired: z.literal(true),
    repairCreatesNewArtifactAndFullReinspection: z.literal(true),
  }).strict(),
  remainingGates: z.tuple([
    z.literal('authorized_human_gated_checkpoint_terms_acceptance'),
    z.literal('exact_checkpoint_download_byte_length_sha256_and_license_reread'),
    z.literal('private_checkpoint_ingest_generation_etag_hash_and_malware_scan'),
    z.literal('exact_source_archive_license_and_security_approval'),
    z.literal('official_sam3_issue_526_review_and_strict_final_assembled_video_predictor_qualification'),
    z.literal('pinned_source_checkpoint_strict_compatibility_and_output_shape_qualification'),
    z.literal('pinned_python_torch_cuda_wheel_and_native_library_closure'),
    z.literal('cuda_12_8_l4_driver_forward_compatibility_artifact_and_runtime_load_qualification'),
    z.literal('immutable_a100_and_l4_image_build_scan_signature_and_attestation'),
    z.literal('a100_and_l4_real_media_quality_performance_and_cost_qualification'),
    z.literal('canonical_work_lease_usage_cost_asset_manifest_and_qa_integration'),
    z.literal('complete_private_end_to_end_professional_visual_review'),
  ]),
  authority: z.object({
    sourceCandidateOnly: z.literal(true),
    termsAccepted: z.literal(false),
    sourceIngested: z.literal(false),
    checkpointIngested: z.literal(false),
    imageBuiltOrPushed: z.literal(false),
    runtimeExecuted: z.literal(false),
    workDispatched: z.literal(false),
    costOrCreditMutationCreated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict()

export const canonicalSam31SourceRuntimeCandidateSchema =
  candidateWithoutHashSchema.extend({ candidateHash: sha256 }).strict()
export type CanonicalSam31SourceRuntimeCandidate = z.infer<
  typeof canonicalSam31SourceRuntimeCandidateSchema
>

export function createCanonicalSam31SourceRuntimeCandidate():
CanonicalSam31SourceRuntimeCandidate {
  const payload = candidateWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    source: 'canonical_backend_sam3_1_source_candidate',
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    registryIdentity: {
      canonicalToolId: 'sam3_1',
      catalogClass: 'non_e2e_capability_candidate',
      productionStatus: 'needs_license_review',
      workerType: 'gpu_ai_worker',
      gpuRequired: true,
      cpuAllowed: false,
    },
    replacement: {
      supersedesForNewPlans: 'sam2',
      sam2HistoricalEvidenceReadable: true,
      sam2MayAuthorizeNewPlanWorkFallbackOrRepair: false,
      livingFrameEstimateProjectionVersion:
        'canonical-living-frame-estimate-work-asset-projection-v7',
      livingFrameWorkGraphProjectionVersion:
        'canonical-living-frame-work-graph-projection-v9',
      livingFrameTemporalMaskUsesSam31Operation: true,
      directSam2SubprocessSpawnerAvailable: false,
      existingApprovedSnapshotMayBeRewritten: false,
      newPlanEstimateApprovalSnapshotAndReservationRequired: true,
    },
    officialSource: {
      repository: 'https://github.com/facebookresearch/sam3.git',
      sourceRevision: '96914d2425f90a64f45ca977c2b5165418099543',
      sourceTree: '573deb167702e014829a5b830de8ae62abe891d5',
      sourceParentRevision: '6dbb02bd38288df755dfa1378000a861e65b84f6',
      sourceCommittedAt: '2026-07-30T17:21:37-07:00',
      sourceRevisionObservedAt: '2026-08-01T16:00:00.000Z',
      release: 'SAM 3.1',
      releaseDate: '2026-03-27',
      sourceLicenseFileSha256:
        '4dea99bfaa016e21bc860d73f344236bd1e5c4977d1a9a8fd32f822b500ae1be',
      deterministicGitArchiveFormat:
        'git_archive_tar_uncompressed',
      deterministicGitArchivePrefix: 'sam3/',
      deterministicGitArchiveByteLength: 73_605_120,
      deterministicGitArchiveSha256:
        '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
      pyprojectSha256:
        '255f5d8d1db011459878e3de296a6afc84e03a8dda2bfa756a4de304aaff6366',
      modelBuilderSha256:
        'd71d6d3e485ec3eae48bbc2ba676f401b5853d65c4195a91d077b04da38121c2',
      basePredictorSha256:
        'e6ac612276ab208fa486499507175acc3f93fd6aab753dd553468b3330ad536b',
      multiplexVideoPredictorSha256:
        '15abe64bff63c95b8bcb67b5af0818b1b3783eb6537ec4d8b3a5e6b56915d1c1',
      submodulesRequired: false,
      sourceRevisionSignatureVerified: false,
      sourceArchiveIngestedAndReread: false,
      sourceSecurityScanPassed: false,
      sourceLicenseApprovedForReeditpro: false,
    },
    officialCheckpoint: {
      repository: 'facebook/sam3.1',
      repositoryRevision: 'daa63191845a41281374e725f4c9e51c7a824460',
      fileName: 'sam3.1_multiplex.pt',
      repositoryGating: 'manual',
      hostedInferenceProviderAvailable: false,
      transformersIntegrationAvailable: false,
      knownPublicCompatibilityIssueNumber: 526,
      knownPublicCompatibilityIssueStateAtReview: 'open',
      knownPublicCompatibilityIssueObservedAt: '2026-08-06',
      pinnedSourceAndCheckpointMayBeAssumedCompatible: false,
      unreviewedCheckpointKeyRewriteAllowed: false,
      partialTrackerLoadWarningMayQualifyCompatibility: false,
      strictFinalAssembledVideoModelMayQualifyWithoutIssueClosure: true,
      strictQualificationRequiresSingleCheckpointLoad: true,
      strictQualificationRequiresExactModelKeySet: true,
      strictQualificationRequiresCompleteVideoProbe: true,
      exactByteLengthAvailableWithoutAuthorizedDownload: false,
      exactSha256AvailableWithoutAuthorizedDownload: false,
      thirdPartyMirrorOrScanMaySatisfyCanonicalIngest: false,
      thirdPartyMirrorDownloadAllowed: false,
      gatedRepositoryAccessRequired: true,
      authorizedHumanTermsAcceptanceRequired: true,
      automatedTermsAcceptanceAllowed: false,
      exactDownloadedByteLength: null,
      exactDownloadedSha256: null,
      checkpointLicenseApprovedForReeditpro: false,
      checkpointMalwareScanPassed: false,
      checkpointPrivateArtifactIngested: false,
      checkpointGenerationEtagAndHashRereadVerified: false,
    },
    runtimeClosure: {
      pythonMinimumVersion: '3.12',
      torchMinimumVersion: '2.7',
      cudaMinimumVersion: '12.6',
      candidatePythonVersion: '3.12',
      candidateTorchVersion: '2.10.0',
      candidateTorchvisionVersion: '0.25.0',
      candidateTorchcodecVersion: '0.10.0',
      candidateCudaVersion: '12.8',
      reeditproGpuDecodePatchSha256:
        'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
      reeditproGpuDecodePatchAppliesCleanlyToPinnedSource: true,
      reeditproGpuDecodePatchSemanticAuditPassed: true,
      reeditproGpuDecodePatchModifiedPaths: [
        'sam3/model/io_utils.py',
        'sam3/model/sam3_base_predictor.py',
        'sam3/model/sam3_multiplex_tracking.py',
        'sam3/model/sam3_multiplex_video_predictor.py',
        'sam3/model_builder.py',
      ],
      reeditproPatchedSourceTree:
        'f3a58b95a0e460d76e1cf38abff0382a7307f67d',
      deterministicPatchedSourceArchiveFormat:
        'git_archive_tree_tar_uncompressed_fixed_mtime',
      deterministicPatchedSourceArchivePrefix: 'sam3/',
      deterministicPatchedSourceArchiveMtime:
        '2026-07-30T17:21:37-07:00',
      deterministicPatchedSourceArchiveByteLength: 73_605_120,
      deterministicPatchedSourceArchiveSha256:
        'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
      callerSuppliedPatchedSourceArchiveHashAllowed: false,
      candidateBaseImage: {
        taggedReference: 'pytorch/pytorch:2.10.0-cuda12.8-cudnn9-runtime',
        resolvedReference:
          'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
        resolvedDigestSha256:
          'b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
        platformOs: 'linux',
        platformArchitecture: 'amd64',
        observedPythonVersion: '3.12',
        observedTorchVersion: '2.10.0',
        observedCudaVersion: '12.8.1',
        observedAt: '2026-08-02T12:39:12Z',
        immutableDigestObserved: true,
        dependencyClosureQualified: false,
        imageBuildUseAuthorized: false,
      },
      cudaDriverCompatibility: {
        officialNvidiaCompatibilityDocumentation:
          'https://docs.nvidia.com/deploy/cuda-compatibility/forward-compatibility.html',
        officialCloudRunGpuDocumentation:
          'https://docs.cloud.google.com/run/docs/configuring/jobs/gpu',
        cloudRunL4DocumentedDriverBranch: '535.x',
        cloudRunL4DocumentedCudaDriverCapability: '12.2',
        cudaForwardCompatibilityPackageName: 'cuda-compat-12-8',
        cudaForwardCompatibilityPackageVersion: '570.211.01-0ubuntu1',
        cudaForwardCompatibilityRepository:
          'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64',
        cudaForwardCompatibilityFileName:
          'cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb',
        cudaForwardCompatibilityByteLength: 37_945_232,
        cudaForwardCompatibilitySha256:
          'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
        packageArchitecture: 'amd64',
        packageRepositoryObservedAt: '2026-08-03T00:00:00.000Z',
        compatibilityLibraryPath: '/usr/local/cuda-12.8/compat',
        minimumSupportedHostDriverMajor: 535,
        compatibilityPackageUsedBelowDriverMajor: 570,
        hostDriverLibrariesUsedAtOrAboveDriverMajor: 570,
        runtimeDriverVersionAndLoadedLibraryPathEvidenceRequired: true,
        callerSelectedCompatibilityPackageAllowed: false,
        networkPackageInstallAllowed: false,
        packageIngestedAndReread: false,
        packageSecurityScanPassed: false,
        a100CompatibilityQualified: false,
        l4CompatibilityQualified: false,
      },
      optionalFlashAttention3MayBeUsedOnlyAfterSeparateQualification: true,
      exactBaseImageDigestPinned: false,
      exactWheelAndNativeLibraryHashesPinned: false,
      sourceInstalledFromExactRevision: false,
      checkpointAndPinnedSourceCompatibilityQualified: false,
      noMissingOrUnexpectedCheckpointKeysQualified: false,
      immutableA100ImageBuiltAndScanned: false,
      immutableL4ImageBuiltAndScanned: false,
    },
    fixedApi: {
      builder: 'build_sam3_multiplex_video_predictor',
      predictorVersion: 'sam3.1',
      objectMultiplexRequired: true,
      maximumTrackedObjectsProductCap: 16,
      multiplexBucketSize: 16,
      useFlashAttention3: false,
      useRealValuedRope: true,
      torchCompileEnabled: false,
      warmupCompilationEnabled: false,
      defaultOutputProbabilityThreshold: 0.5,
      asynchronousFrameLoadingAllowed: true,
      upstreamAcceptedSourceMediaForms: [
        'private_read_only_mp4',
        'private_read_only_numbered_jpeg_directory',
      ],
      reeditproGpuAdmissibleSourceMediaForms: [
        'private_read_only_mp4',
      ],
      gpuDecodeBackend: 'torchcodec_0_10_cuda_nvdec',
      gpuDecodeRequired: true,
      cpuOpenCvOrPillowDecodeAllowed: false,
      strictCheckpointLoadRequired: true,
      cudaOutputTensorsRequired: true,
      boundedCpuOutputSerializationOnly: true,
      lifecycleRequestOrder: [
        'start_session',
        'add_prompt',
        'propagate_in_video',
        'close_session',
      ],
      requestApi: 'handle_request',
      streamingRequestApi: 'handle_stream_request',
      videoPropagationRequestType: 'propagate_in_video',
      propagationDirection: 'forward',
      outputObjectIdsField: 'out_obj_ids',
      outputNormalizedBoxesField: 'out_boxes_xywh',
      outputBinaryMasksField: 'out_binary_masks',
      outputMaskPixelType: 'boolean',
      callerSelectedPythonModuleClassOrCheckpointAllowed: false,
      callerRawChatOrExecutableTextAllowed: false,
      serverCompiledApprovedSubjectPromptRequired: true,
      promptSnapshotAndSourceFrameLineageRequired: true,
      runtimeNetworkOrHuggingFaceDownloadAllowed: false,
      exactPrivateCheckpointMountRequired: true,
      exactSourceMediaMountRequired: true,
      createOnlyPrivateOutputMountRequired: true,
    },
    compute: {
      primaryProfileId: CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0],
      fallbackProfileId: CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
      a100Primary: true,
      l4ClassifiedFallback: true,
      explicitApprovedUserEditTriggerRequired: true,
      noApprovedWorkMeansZeroGpuJobs: true,
      cpuOnlyHeavyExecutionAllowed: false,
      outputOffloadToCpuForEvaluationAllowed: false,
      modelQuantizationAllowed: false,
      resolutionReductionAllowed: false,
      temporalQaReductionAllowed: false,
      costOnlyFallbackAllowed: false,
      unknownOutcomeFallbackAllowed: false,
    },
    cost: {
      costProfileId: 'sam3_1_multiplex_video_segmentation_v1',
      estimateBeforeApprovalRequired: true,
      primaryAndFallbackRateAuthoritiesRequired: true,
      coldStartAndModelLoadIncluded: true,
      exactPerAttemptUsageReceiptRequired: true,
      systemFailureChargedToUser: false,
      unapprovedOverageChargedToUser: false,
      serviceFeeIncludedInToolCost: false,
    },
    qa: {
      exactSourceFrameAndPromptLineageRequired: true,
      maskEdgeQualityRequired: true,
      temporalStabilityRequired: true,
      subjectCoverageRequired: true,
      contactObjectPreservationRequired: true,
      completeSelectedIntervalInspectionRequired: true,
      downstreamCompositionQaRequired: true,
      directPrivateVisualReviewRequired: true,
      repairCreatesNewArtifactAndFullReinspection: true,
    },
    remainingGates: [
      'authorized_human_gated_checkpoint_terms_acceptance',
      'exact_checkpoint_download_byte_length_sha256_and_license_reread',
      'private_checkpoint_ingest_generation_etag_hash_and_malware_scan',
      'exact_source_archive_license_and_security_approval',
      'official_sam3_issue_526_review_and_strict_final_assembled_video_predictor_qualification',
      'pinned_source_checkpoint_strict_compatibility_and_output_shape_qualification',
      'pinned_python_torch_cuda_wheel_and_native_library_closure',
      'cuda_12_8_l4_driver_forward_compatibility_artifact_and_runtime_load_qualification',
      'immutable_a100_and_l4_image_build_scan_signature_and_attestation',
      'a100_and_l4_real_media_quality_performance_and_cost_qualification',
      'canonical_work_lease_usage_cost_asset_manifest_and_qa_integration',
      'complete_private_end_to_end_professional_visual_review',
    ],
    authority: {
      sourceCandidateOnly: true,
      termsAccepted: false,
      sourceIngested: false,
      checkpointIngested: false,
      imageBuiltOrPushed: false,
      runtimeExecuted: false,
      workDispatched: false,
      costOrCreditMutationCreated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31SourceRuntimeCandidateSchema.parse({
    ...payload,
    candidateHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourceRuntimeCandidate(
  value: unknown,
): CanonicalSam31SourceRuntimeCandidate {
  const parsed = canonicalSam31SourceRuntimeCandidateSchema.parse(value)
  const { candidateHash, ...payload } = parsed
  if (
    candidateHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(parsed) !== stableAuthorityStringify(
      createCanonicalSam31SourceRuntimeCandidate(),
    )
  ) throw new Error('SAM 3.1 source/runtime candidate is stale or invalid.')
  return parsed
}

export const CANONICAL_SAM3_1_SOURCE_RUNTIME_NOTE = safeText.parse(
  'SAM 3.1 replaces SAM 2 for new plans only after exact gated checkpoint, immutable A100/L4 image, cost, temporal QA, and private end-to-end qualification; this source candidate grants no runtime authority.',
)
