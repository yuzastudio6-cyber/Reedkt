export const QWEN2_5_VL_CLOUD_RUN_GPU_NO_DEPLOY_MOUNT_SPEC = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_no_deploy_mount_spec_only",
  decision:
    "qwen2_5_vl_7b_cloud_run_gpu_no_deploy_mount_spec_ready_for_fail_closed_image_build",
  verifiedInputs: {
    project: "reeditpro",
    region: "us-central1",
    serviceName: "reeditpro-qwen2-5-vl-l4-worker",
    runtimeIdentity:
      "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    bucket: "reeditpro-staging-reeditpro-generated-assets",
    bucketLocation: "US-CENTRAL1",
    modelPrefix:
      "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    objectCount: 16,
    totalBytes: 16595981281,
    expectedAggregateSha256:
      "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    prefixScopedReadBindingPresent: true,
    iamConditionTitle: "qwen25vl_model_read",
    runtimeDataPlaneReadProofStillRequired: true
  },
  mountSpec: {
    volumeName: "qwen-model-cache",
    volumeType: "cloud-storage",
    bucket: "reeditpro-staging-reeditpro-generated-assets",
    mountPath: "/models/qwen2.5-vl-7b-instruct",
    onlyDir:
      "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    mountOptions: [
      "only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
      "implicit-dirs"
    ],
    readOnly: true,
    modelFilesVisibleAtMountRootExpected: true,
    requestTimeModelDownloadFallback: false,
    signedUrlSourceFallback: false,
    publicModelSourceFallback: false,
    modelBakedIntoImage: false,
    cloudRunMountCreatedNow: false
  },
  futureCommandShape: {
    command: "gcloud run deploy",
    executableNow: false,
    image: "APPROVED_FUTURE_QWEN_IMAGE_PLACEHOLDER",
    serviceAccount:
      "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    noAllowUnauthenticated: true,
    ingress: "internal-and-cloud-load-balancing",
    executionEnvironment: "gen2",
    gpuZonalRedundancy: "disabled_for_first_cost_focused_proof",
    addVolume:
      "name=qwen-model-cache,type=cloud-storage,bucket=reeditpro-staging-reeditpro-generated-assets,readonly=true,mount-options=only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/;implicit-dirs",
    addVolumeMount:
      "volume=qwen-model-cache,mount-path=/models/qwen2.5-vl-7b-instruct"
  },
  environmentDefaults: {
    HF_HUB_OFFLINE: "1",
    TRANSFORMERS_OFFLINE: "1",
    HF_HUB_DISABLE_TELEMETRY: "1",
    MODEL_DOWNLOADS_ENABLED: "false",
    RAW_VLM_PROMPT_ENABLED: "false",
    PROVIDER_EXECUTION_ENABLED: "false",
    MEDIA_PROCESSING_ENABLED: "false",
    REAL_MEDIA_INPUT_ENABLED: "false",
    ARBITRARY_MEDIA_INPUT_ENABLED: "false",
    PUBLIC_OUTPUT_ENABLED: "false",
    TRACK_A_EXECUTION_ENABLED: "false",
    QWEN_APPROVED_SNAPSHOT_REQUIRED: "true",
    QWEN_QUEUE_LEASE_REQUIRED: "true",
    QWEN_MODEL_IMPORT_ON_STARTUP: "false",
    QWEN_INFERENCE_ENABLED: "false",
    QWEN_MODEL_CACHE_MOUNT: "/models/qwen2.5-vl-7b-instruct",
    QWEN_MODEL_REVISION: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    QWEN_MODEL_AGGREGATE_SHA256:
      "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
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
    backendOnlyInvocationRequired: true,
    intendedScaleToZeroWhenIdle: true
  },
  startupVerificationRequirements: {
    serviceStartsWithMinInstancesZero: true,
    runtimeIdentityReadsConfigJsonThroughMount: true,
    modelFilesVisibleAtMountRoot: true,
    expectedObjectCount: 16,
    expectedTotalBytes: 16595981281,
    aggregateSha256BeforeImport: true,
    healthCheckLoadsFullModel: false,
    postRequestsRejectedWhileInferenceDisabled: true,
    requestTimeModelDownloadAllowed: false
  },
  runtimeFlags: {
    noDeployMountSpecCreated: true,
    mountUsesCompletedPrivateCache: true,
    mountUsesOnlyDir: true,
    mountReadOnly: true,
    runtimeIdentitySelected: true,
    prefixScopedReadIamBindingRequired: true,
    prefixScopedReadIamBindingPresent: true,
    futureRuntimeReadProofRequired: true,
    cloudRunVolumeMountCreated: false,
    cloudRunDeployCommandExecuted: false,
    cloudRunServiceCreated: false,
    cloudRunJobCreated: false,
    artifactRegistryImageCreated: false,
    reservationCreated: false,
    vmCreated: false,
    dockerBuildRun: false,
    dockerPushRun: false,
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
    "QWEN2_5_VL_STACK_TOOL_23-CLOUD-RUN-GPU-FAIL-CLOSED-IMAGE-BUILD: build and push the fail-closed Qwen Cloud Run image, no deploy/no inference"
} as const;

export type Qwen25VlCloudRunGpuNoDeployMountSpec =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_NO_DEPLOY_MOUNT_SPEC;
