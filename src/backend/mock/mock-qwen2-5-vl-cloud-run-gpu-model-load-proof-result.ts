export const QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_LOAD_PROOF_RESULT = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_model_load_proof_result",
  decision: "qwen2_5_vl_7b_cloud_run_gpu_model_load_proof_passed_no_inference",
  proofExecution: {
    jobName: "qwen25vl-model-load-proof-0627013557",
    executionName: "qwen25vl-model-load-proof-0627013557-t9d4z",
    createdAt: "2026-06-27T01:36:00.777613Z",
    startedAt: "2026-06-27T01:36:06.245079Z",
    completedAt: "2026-06-27T01:44:58.004667Z",
    completedSuccessfully: true,
    duration: "8m51.75s",
    scriptElapsedSeconds: 440.926,
    loadElapsedSeconds: 46.239,
    gpuType: "nvidia-l4",
    gpuCount: 1,
    cpu: 8,
    memory: "32Gi",
    maxRetries: 0,
    proofJobDeleted: true,
    remainingProofJobsObserved: false
  },
  runtimeImageAndMount: {
    imageDigest: "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630",
    runtimeIdentity: "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    bucket: "reeditpro-staging-reeditpro-model-cache",
    mountPath: "/models/qwen2.5-vl-7b-instruct",
    modelRevision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    expectedAggregateSha256:
      "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    readOnlyMount: true
  },
  loadStrategy: {
    loader: "Qwen2_5_VLForConditionalGeneration.from_pretrained",
    loadDtype: "bfloat16",
    attnImplementation: "eager",
    accelerateImported: false,
    accelerateImportErrorType: "ModuleNotFoundError",
    accelerateImportErrorMessage: "No module named 'accelerate'",
    strategy: "transformers_from_pretrained_then_to_cuda",
    modelMovedToCuda: true,
    modelEvalSet: true,
    modelDeletedBeforeExit: true,
    cudaCacheClearedBeforeExit: true
  },
  cudaAndModelMetrics: {
    torchImported: true,
    torchVersion: "2.8.0+cu128",
    transformersImported: true,
    transformersVersion: "4.57.1",
    cudaAvailable: true,
    cudaDeviceCount: 1,
    cudaDeviceName: "NVIDIA L4",
    cudaTotalMemoryBytes: 23583784960,
    parameterCount: 8292166656,
    cudaParameterCount: 8292166656,
    dtypeParameterCounts: {
      "torch.bfloat16": 8292166656
    },
    deviceParameterCounts: {
      "cuda:0": 8292166656
    },
    cudaMemoryAllocatedBeforeLoad: 0,
    cudaMemoryReservedBeforeLoad: 0,
    cudaMemoryAllocatedAfterLoad: 16584369664,
    cudaMemoryReservedAfterLoad: 16590569472,
    cudaMemoryAllocatedAfterCleanup: 1089994752,
    cudaMemoryReservedAfterCleanup: 1111490560
  },
  runtimeFlags: {
    cloudRunGpuJobCreated: true,
    cloudRunGpuJobDeleted: true,
    gpuRequested: true,
    torchImported: true,
    transformersImported: true,
    cudaAvailable: true,
    cudaL4Visible: true,
    modelWeightsLoaded: true,
    modelLoadRun: true,
    modelMovedToCuda: true,
    modelEvalSet: true,
    parameterCountComputed: true,
    modelDeletedBeforeExit: true,
    cudaCacheClearedBeforeExit: true,
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
  nextPrompt:
    "QWEN2_5_VL_STACK_TOOL_29-CLOUD-RUN-GPU-VLLM-ENGINE-PROOF: verify vLLM engine initialization from private mount on L4, no inference"
} as const;

export type Qwen25VlCloudRunGpuModelLoadProofResult =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_LOAD_PROOF_RESULT;
