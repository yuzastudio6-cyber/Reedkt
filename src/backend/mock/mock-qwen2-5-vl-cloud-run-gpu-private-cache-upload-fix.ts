export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_FIX = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_private_cache_upload_fix",
  decision:
    "qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_fix_selects_cloud_side_transfer_no_deploy_no_inference",
  currentRemoteState: {
    bucket: "reeditpro-staging-reeditpro-generated-assets",
    bucketLocation: "US-CENTRAL1",
    objectPrefix:
      "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    expectedObjectCount: 16,
    expectedTotalBytes: 16595981281,
    currentObjectCount: 6,
    currentTotalBytes: 1694572,
    firstLargeShardPresent: false,
    modelCacheReadyForCloudRunMount: false,
    temporaryCompositeObjectsTreatedAsFinalModelCache: false
  },
  followUpLocalRetry: {
    branch: "codex/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix",
    target: "model-00001-of-00005.safetensors",
    tool: "gcloud_storage_cp_no_clobber",
    mode: "resumable_parallel_composite_upload",
    elapsedBeforeStopMinutes: 13,
    finalShardObjectCreated: false,
    intendedPrefixChangedByRetry: false,
    localUplinkStrategyAcceptedForNextStep: false
  },
  selectedFixStrategy: {
    preferred: "storage_transfer_url_list",
    fallback: "cloud_run_cpu_one_shot_transfer_runner",
    gpuRequiredForTransfer: false,
    qwenInferenceServiceUsedForTransfer: false,
    reason: "local_upload_path_did_not_complete_large_shards_reliably"
  },
  futureUrlListShape: {
    revision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    fileCount: 16,
    requiredFiles: [
      ".gitattributes",
      "README.md",
      "chat_template.json",
      "config.json",
      "generation_config.json",
      "merges.txt",
      "model-00001-of-00005.safetensors",
      "model-00002-of-00005.safetensors",
      "model-00003-of-00005.safetensors",
      "model-00004-of-00005.safetensors",
      "model-00005-of-00005.safetensors",
      "model.safetensors.index.json",
      "preprocessor_config.json",
      "tokenizer_config.json",
      "tokenizer.json",
      "vocab.json"
    ],
    helperManifestFilesExcluded: [
      "aggregate_checksum_sha256.txt",
      "file_checksums_sha256.txt",
      "file_sizes.txt"
    ],
    sourceRepository: "Qwen/Qwen2.5-VL-7B-Instruct",
    sourceRevisionPinned: true,
    signedUrlTokensAllowed: false,
    providerCredentialsAllowed: false
  },
  futureExecutionPreconditions: {
    confirmProject: "reeditpro",
    confirmBucketExists: true,
    confirmBucketLocation: "US-CENTRAL1",
    confirmPrefixPartialSameRevisionOnly: true,
    confirmOfficialPinnedSourceOnly: true,
    confirmNoSignedUrlTokens: true,
    confirmNoPrivateCredentials: true,
    confirmOneTimeTransferOnly: true,
    confirmNoRecurringTransfer: true,
    confirmNoModelImport: true,
    confirmNoInference: true,
    confirmNoCloudRunGpuDeploy: true
  },
  runtimeFlags: {
    privateCacheUploadFixCreated: true,
    localRetryAttempted: true,
    localRetryPassed: false,
    storageTransferJobCreated: false,
    urlListObjectCreated: false,
    cloudRunCpuTransferJobCreated: false,
    cloudRunGpuServiceCreated: false,
    gcsObjectUploadComplete: false,
    remoteChecksumVerified: false,
    remoteAggregateSha256Recomputed: false,
    cloudRunVolumeMountCreated: false,
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
    "QWEN2_5_VL_STACK_TOOL_20-STORAGE-TRANSFER-URL-LIST-EXECUTE: complete private Qwen model cache with one-time Storage Transfer URL-list job, no deploy/no inference"
} as const;

export type Qwen25VlCloudRunGpuPrivateCacheUploadFix =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_FIX;
