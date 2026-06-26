export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_MOUNT_REVIEW = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_private_cache_mount_review_only",
  decision: "qwen2_5_vl_7b_cloud_run_gpu_private_cache_mount_review_ready_for_private_cache_upload_plan",
  privateCacheStrategy: {
    cacheStrategy: "private_cloud_storage_model_cache_path",
    bucketCandidate: "reeditpro-qwen2-5-vl-model-cache-us-central1",
    objectPrefixCandidate: "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    containerMountPath: "/models/qwen2.5-vl-7b-instruct",
    cloudRunVolumeName: "qwen-model-cache",
    mountMode: "read_only",
    publicModelSourceAllowed: false,
    requestTimeModelDownloadAllowed: false,
    modelBakedIntoImage: false,
    signedUrlSourceAllowed: false,
    gcsObjectUploadedNow: false,
    cloudRunMountCreatedNow: false
  },
  runtimeIdentityAndIam: {
    runtimeIdentity: "cloud_run_service_identity_no_key_file",
    candidateIdentityLabel: "qwen-cloud-run-worker-runtime",
    requiredBucketRole: "object_read_only",
    scope: "selected_object_prefix_only",
    serviceAccountKeyFileAllowed: false,
    publicPrincipalAllowed: false,
    broadStorageAdminAllowed: false,
    iamBindingCreatedNow: false,
    secretManagerReadRequired: false
  },
  modelCacheEvidence: {
    model: "Qwen/Qwen2.5-VL-7B-Instruct",
    revision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    totalBytes: 16595981281,
    aggregateSha256: "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    checksumBeforeImportRequired: true,
    modelImportBeforeChecksumForbidden: true
  },
  startupCopyAndChecksumPlan: {
    directFuseRead: "candidate_for_metadata_import_proof_only",
    copyFromMountToLocalEphemeralPath: "candidate_if_loader_compatibility_requires_it",
    localEphemeralCandidate: "/tmp/reeditpro-qwen2-5-vl/model-cache",
    checksumBeforeImport: true,
    startupHealthLoadsFullModel: false,
    requestTimeDownloadFallback: false
  },
  serviceCarryForward: {
    serviceName: "reeditpro-qwen2-5-vl-l4-worker",
    region: "us-central1",
    gpuType: "nvidia-l4",
    gpuCount: 1,
    cpu: 8,
    memory: "32Gi",
    minInstances: 0,
    maxInstances: 1,
    concurrency: 1,
    timeoutSeconds: 900,
    publicUnauthenticatedAccessAllowed: false,
    backendOnlyInvocationRequired: true
  },
  runtimeFlags: {
    privateCacheMountReviewCreated: true,
    bucketCreated: false,
    gcsObjectUploaded: false,
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
    "QWEN2_5_VL_STACK_TOOL_18-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-PLAN: plan private model cache upload and checksum verification, no upload/no deploy/no inference"
} as const;

export type Qwen25VlCloudRunGpuPrivateCacheMountReview =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_MOUNT_REVIEW;
