export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_PLAN = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_private_cache_upload_plan_only",
  decision: "qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_plan_ready_for_upload_execute_no_deploy",
  readOnlyGcpInventory: {
    projectInspected: "reeditpro",
    existingTargetBucket: "reeditpro-staging-reeditpro-generated-assets",
    bucketLocation: "US-CENTRAL1",
    dedicatedNewBucketNeededForFirstProof: false,
    bucketCreatedNow: false,
    bucketMutationRunNow: false,
    candidateRuntimeIdentity: "reeditpro-stg-gpu-worker-sa",
    serviceAccountKeyFileCreated: false,
    iamBindingCreatedNow: false
  },
  selectedUploadTarget: {
    uploadTargetStatus: "future_execution_only",
    selectedBucket: "reeditpro-staging-reeditpro-generated-assets",
    selectedObjectPrefix: "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    containerMountPath: "/models/qwen2.5-vl-7b-instruct",
    cloudRunVolumeName: "qwen-model-cache",
    publicModelSourceAllowed: false,
    signedUrlSourceAllowed: false,
    requestTimeModelDownloadAllowed: false,
    modelBakedIntoImage: false,
    objectUploadedNow: false,
    cloudRunMountCreatedNow: false
  },
  uploadManifest: {
    model: "Qwen/Qwen2.5-VL-7B-Instruct",
    revision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    localPrivateCachePath:
      "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5",
    fileCount: 16,
    weightShardCount: 5,
    totalBytes: 16595981281,
    checksumAlgorithm: "sha256",
    aggregateSha256: "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    uploadManifestCreatedNow: "plan_only",
    objectUploadRunNow: false
  },
  futureUploadPreflight: {
    confirmProject: "reeditpro",
    confirmBucketExists: true,
    confirmBucketLocation: "US-CENTRAL1",
    confirmPrefixEmptyOrSameRevisionOnly: true,
    confirmLocalCacheOutsideGitWorktree: true,
    confirmLocalFileCount: 16,
    confirmLocalTotalBytes: 16595981281,
    confirmLocalAggregateSha256: "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
  },
  futureIamAndMountFollowup: {
    runtimeIdentity: "existing_gpu_worker_service_identity_candidate",
    requiredAccess: "read_only_object_access_for_selected_prefix",
    broadBucketAdminRejected: true,
    publicPrincipalRejected: true,
    serviceAccountKeyFileRejected: true,
    cloudRunMountFutureDeploySpecOnly: true,
    cloudRunDeployApproved: false,
    modelImportProofApproved: false,
    modelInferenceProofApproved: false
  },
  runtimeFlags: {
    privateCacheUploadPlanCreated: true,
    bucketCreated: false,
    gcsObjectUploaded: false,
    remoteChecksumVerified: false,
    iamBindingCreated: false,
    serviceAccountKeyCreated: false,
    cloudRunVolumeMountCreated: false,
    dockerBuildRun: false,
    dockerPushRun: false,
    cloudRunDeployCommandExecuted: false,
    cloudRunServiceCreated: false,
    cloudRunJobCreated: false,
    artifactRegistryImageCreated: false,
    reservationCreated: false,
    vmCreated: false,
    dependencyInstallRun: false,
    modelImportRun: false,
    modelLoadRun: false,
    modelInferenceRun: false,
    apiServerStarted: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false
  },
  nextPrompt:
    "QWEN2_5_VL_STACK_TOOL_19-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-EXECUTE: upload private model cache to approved private bucket and verify checksum, no deploy/no inference"
} as const;

export type Qwen25VlCloudRunGpuPrivateCacheUploadPlan =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_PLAN;
