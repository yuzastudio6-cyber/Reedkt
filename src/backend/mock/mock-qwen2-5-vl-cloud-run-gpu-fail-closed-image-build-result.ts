export const QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_IMAGE_BUILD_RESULT = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_fail_closed_image_build_result",
  decision:
    "qwen2_5_vl_7b_cloud_run_gpu_fail_closed_image_build_succeeded_no_deploy_no_inference",
  failedAttempt: {
    buildId: "44b88195-e498-4737-93dd-d9fc04367cd7",
    status: "FAILURE",
    reason:
      "vllm 0.11.0 requires torch 2.8.0 while bundled sglang 0.4.10.post2 requires torch 2.7.1"
  },
  dependencyCorrection: {
    qwenImageRuntime: "vllm_focused",
    vllmVersion: "0.11.0",
    transformersVersion: "4.57.1",
    qwenVlUtilsVersion: "0.0.11",
    sglangBundledIntoQwenImage: false,
    sglangLane: "separate_existing_runtime_lane"
  },
  successfulAttempt: {
    buildId: "8626edb5-1275-4fbe-b56f-332b8087037c",
    status: "SUCCESS",
    duration: "16M35S",
    sourceBundleFileCount: 7,
    sourceBundleBytesBeforeCompression: "7.2 KiB",
    dockerContext: "17.41 KiB"
  },
  image: {
    package:
      "us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/qwen2-5-vl-7b-cloud-run-gpu",
    tag: "fail-closed-vllm-fc1f95fb-20260627t000018z",
    digest: "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630",
    fullyQualifiedDigest:
      "us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/qwen2-5-vl-7b-cloud-run-gpu@sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630",
    imageSizeBytes: 8395344201,
    imageSizeGiB: "7.82",
    mediaType: "application/vnd.docker.distribution.manifest.v2+json",
    modelWeightsInImage: false,
    serviceWrapperInImage: true,
    failClosedEnvDefaultsInImage: true
  },
  cloudBuildSourceBundle: {
    fileCount: 7,
    bytesBeforeCompression: "7.2 KiB",
    dockerContext: "17.41 KiB",
    modelWeightsIncluded: false,
    mediaIncluded: false,
    secretsIncluded: false
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
    dockerBuildRun: true,
    dockerPushRun: true,
    artifactRegistryImageCreated: true,
    cloudRunDeployCommandExecuted: false,
    cloudRunServiceCreated: false,
    cloudRunJobCreated: false,
    cloudRunVolumeMountCreated: false,
    gpuServiceStarted: false,
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
    "QWEN2_5_VL_STACK_TOOL_24-CLOUD-RUN-GPU-FAIL-CLOSED-DEPLOY: deploy fail-closed Cloud Run GPU service with private cache mount, no model import/no inference"
} as const;

export type Qwen25VlCloudRunGpuFailClosedImageBuildResult =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_IMAGE_BUILD_RESULT;
