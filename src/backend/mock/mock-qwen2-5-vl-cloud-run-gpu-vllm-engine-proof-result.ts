export const QWEN2_5_VL_CLOUD_RUN_GPU_VLLM_ENGINE_PROOF_RESULT = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_vllm_engine_proof_result",
  decision: "qwen2_5_vl_7b_cloud_run_gpu_vllm_engine_proof_passed_bounded_l4_no_inference",
  compilerReadyImage: {
    rebuildReason: "vLLM/Triton required a C compiler for engine initialization",
    cloudBuildId: "b7ea9d0e-b95c-4fa5-8590-14cb11165cc7",
    buildDuration: "16m36s",
    imageTag: "fail-closed-vllm-compiler-5f6cb91e-20260627t022658z",
    imageDigest: "sha256:35a7265a40272ac66938499f4f2c33f03855810d1677a49e9531b4f3740c4c39",
    buildEssentialAdded: true,
    libnumaKept: true,
    modelWeightsBundledInImage: false,
    secretsBundledInImage: false,
    generatedMediaBundledInImage: false
  },
  priorAttemptFindings: {
    unboundedDefaultContextFailedWithOom: true,
    boundedAttemptFailedMissingCompiler: true,
    compilerReady2048AttemptFailedNoKvCache: true,
    compilerReady2048AvailableKvCacheGiB: -0.9
  },
  proofExecution: {
    jobName: "qwen25vl-vllm-engine-proof-0627030150",
    executionName: "qwen25vl-vllm-engine-proof-0627030150-7b7gv",
    createdAt: "2026-06-27T03:01:54.671934Z",
    startedAt: "2026-06-27T03:02:00.432044Z",
    completedAt: "2026-06-27T03:09:24.452636Z",
    completedSuccessfully: true,
    duration: "7m24.02s",
    scriptElapsedSeconds: 354.45,
    vllmEngineInitializationSeconds: 314.8,
    gpuType: "nvidia-l4",
    gpuCount: 1,
    cpu: 8,
    memory: "32Gi",
    maxRetries: 0,
    proofJobDeleted: true,
    remainingProofJobsObserved: false
  },
  runtimeImageAndMount: {
    imageDigest: "sha256:35a7265a40272ac66938499f4f2c33f03855810d1677a49e9531b4f3740c4c39",
    runtimeIdentity: "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    bucket: "reeditpro-staging-reeditpro-model-cache",
    mountPath: "/models/qwen2.5-vl-7b-instruct",
    modelRevision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    expectedAggregateSha256:
      "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    readOnlyMount: true
  },
  engineConfig: {
    runtime: "vllm",
    vllmVersion: "0.11.0",
    torchVersion: "2.8.0+cu128",
    dtype: "bfloat16",
    tensorParallelSize: 1,
    maxModelLen: 1024,
    maxNumSeqs: 1,
    maxNumBatchedTokens: 1024,
    gpuMemoryUtilization: 0.95,
    kvCacheMemoryBytes: 536870912,
    limitMmPerPrompt: {
      image: 1,
      video: 0
    },
    enforceEager: true,
    enablePrefixCaching: false,
    disableLogStats: true
  },
  cudaAndEngineMetrics: {
    cudaAvailable: true,
    cudaDeviceCount: 1,
    cudaDeviceName: "NVIDIA L4",
    cudaTotalMemoryBytes: 23583784960,
    vllmImported: true,
    vllmEngineInitializationAttempted: true,
    vllmEngineInitialized: true,
    vllmEngineDeletedBeforeExit: true,
    cudaCacheClearedBeforeExit: true,
    cudaMemoryAllocatedAfterCleanup: 0,
    cudaMemoryReservedAfterCleanup: 0
  },
  serviceUpdate: {
    service: "reeditpro-qwen2-5-vl-l4-worker",
    previousReadyRevision: "reeditpro-qwen2-5-vl-l4-worker-00002-r2s",
    updatedReadyRevision: "reeditpro-qwen2-5-vl-l4-worker-00003-9qh",
    imageDigest: "sha256:35a7265a40272ac66938499f4f2c33f03855810d1677a49e9531b4f3740c4c39",
    trafficToLatestRevisionPercent: 100,
    serviceReady: true,
    publicUnauthenticatedAccessAllowed: false,
    ingress: "internal-and-cloud-load-balancing",
    runtimeRequestSent: false
  },
  runtimeFlags: {
    compilerReadyImageBuilt: true,
    compilerReadyImageUsed: true,
    cloudRunGpuJobCreated: true,
    cloudRunGpuJobDeleted: true,
    gpuRequested: true,
    torchImported: true,
    vllmImported: true,
    cudaAvailable: true,
    cudaL4Visible: true,
    vllmEngineInitializationAttempted: true,
    vllmEngineInitialized: true,
    vllmEngineDeletedBeforeExit: true,
    cudaCacheClearedBeforeExit: true,
    cloudRunServiceUpdated: true,
    cloudRunRevisionReady: true,
    minInstancesZero: true,
    maxInstancesOne: true,
    boundedPreviewConfigUsed: true,
    forwardPassRun: false,
    promptProcessed: false,
    inferenceRun: false,
    serviceRuntimeRequestSent: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false
  },
  gpuDecision: {
    selectedCostFriendlyGpu: "cloud_run_nvidia_l4",
    selectedServingProfile: "bounded_preview_scale_to_zero",
    cloudRunScaleToZeroKept: true,
    largerGpuStillNeededForBroadLongContextOrVideoHeavyTraffic: true
  },
  nextPrompt:
    "QWEN2_5_VL_STACK_TOOL_30-CLOUD-RUN-GPU-VLLM-APPROVED-SNAPSHOT-RUNTIME-CONTRACT: define the approved-snapshot request contract for the fail-closed Cloud Run service, no inference"
} as const;

export type Qwen25VlCloudRunGpuVllmEngineProofResult =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_VLLM_ENGINE_PROOF_RESULT;
