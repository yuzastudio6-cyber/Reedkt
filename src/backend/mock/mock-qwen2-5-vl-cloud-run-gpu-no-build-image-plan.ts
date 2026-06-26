export const QWEN2_5_VL_CLOUD_RUN_GPU_NO_BUILD_IMAGE_PLAN = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_no_build_image_plan_only",
  decision: "qwen2_5_vl_7b_cloud_run_gpu_no_build_image_plan_ready_for_dockerfile_source_spec",
  imageBuildStrategy: {
    imageBuildStatus: "no_build_plan_only",
    dockerfileSourceCreatedNow: false,
    dockerBuildRun: false,
    dockerPushRun: false,
    artifactRegistryImageCreated: false,
    runtimeBase: "cuda_pytorch_runtime_aligned_with_existing_vlm_sglang_lane",
    existingVlmLaneBoundaryReused: true,
    duplicateRuntimeStackRejected: true,
    qwenServiceWrapperPlanned: true,
    modelWeightsInFirstProofImageRejected: true,
    runtimeDependencyInstallAtRequestTimeRejected: true,
    packageSourceBuildDuringStartupRejected: true,
    dependencyInstallTiming: "image_build_time_only"
  },
  privateModelCacheStrategy: {
    bakeModelIntoFirstProofImage: "rejected",
    huggingFaceDownloadAtRequestTime: "rejected",
    publicUrlModelSource: "rejected",
    privateGcsReadOnlyModelCacheMount: "selected_for_next_review",
    copyFromPrivateGcsMountToLocalEphemeralPathAtStartup: "candidate",
    ephemeralComputeEngineL4Fallback: "available"
  },
  privateModelCache: {
    model: "Qwen/Qwen2.5-VL-7B-Instruct",
    revision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    localPrivateCachePath:
      "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5",
    totalBytes: 16595981281,
    aggregateSha256: "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    cloudRunPrivateCacheCreated: false,
    cloudRunVolumeMountCreated: false,
    gcsObjectUploaded: false,
    modelHubAutoDownloadRejected: true,
    publicModelArtifactRejected: true
  },
  wheelhouse: {
    path: "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64",
    wheelCount: 158,
    totalBytes: 4960843100,
    aggregateSha256: "d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c",
    offlineNoIndexInstallRequired: true,
    runtimeDependencyInstallAtRequestTimeRejected: true,
    packageSourceBuildInCloudRunStartupRejected: true
  },
  proposedFutureImageContents: {
    cudaPytorchRuntimeBaseRequired: true,
    qwenServiceWrapperCodeOnly: true,
    startupHealthEndpointWithoutFullModelLoad: true,
    separateNoInferenceModelImportProofCommand: true,
    failClosedEnvironmentDefaults: true,
    modelWeightsIncluded: false,
    secretsIncluded: false,
    serviceAccountKeyFilesIncluded: false,
    generatedMediaIncluded: false,
    providerTransportIncluded: false
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
    imageBuildPlanCreated: true,
    dockerfileSourceCreated: false,
    dockerBuildRun: false,
    dockerPushRun: false,
    cloudRunDeployCommandExecuted: false,
    cloudRunServiceCreated: false,
    cloudRunJobCreated: false,
    artifactRegistryImageCreated: false,
    gcsBucketCreated: false,
    gcsObjectUploaded: false,
    cloudRunVolumeMountCreated: false,
    reservationCreated: false,
    vmCreated: false,
    dependencyInstallRun: false,
    modelImportRun: false,
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
    "QWEN2_5_VL_STACK_TOOL_16-CLOUD-RUN-GPU-DOCKERFILE-SOURCE-SPEC: author Qwen Cloud Run Dockerfile source and private cache mount spec, no build/no deploy/no inference"
} as const;

export type Qwen25VlCloudRunGpuNoBuildImagePlan =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_NO_BUILD_IMAGE_PLAN;
