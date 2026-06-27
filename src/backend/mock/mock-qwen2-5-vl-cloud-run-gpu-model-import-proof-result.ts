export const QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_IMPORT_PROOF_RESULT = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_model_import_proof_result",
  decision:
    "qwen2_5_vl_7b_cloud_run_gpu_model_import_proof_passed_no_weight_load_no_inference",
  proofExecution: {
    jobName: "qwen25vl-model-import-proof-0627012628",
    executionName: "qwen25vl-model-import-proof-0627012628-8x8p9",
    createdAt: "2026-06-27T01:26:32.402408Z",
    startedAt: "2026-06-27T01:26:36.214386Z",
    completedAt: "2026-06-27T01:29:31.386619Z",
    completedSuccessfully: true,
    duration: "2m55.17s",
    scriptElapsedSeconds: 26.443,
    gpuType: "nvidia-l4",
    gpuCount: 1,
    cpu: 4,
    memory: "16Gi",
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
  cudaAndPackageImports: {
    torchImported: true,
    torchVersion: "2.8.0+cu128",
    cudaAvailable: true,
    cudaDeviceCount: 1,
    cudaDeviceName: "NVIDIA L4",
    cudaTotalMemoryBytes: 23583784960,
    transformersImported: true,
    transformersVersion: "4.57.1",
    vllmImported: true,
    vllmVersion: "0.11.0",
    qwenVlUtilsImported: true,
    qwenVlUtilsModule: "qwen_vl_utils"
  },
  localModelMetadataImports: {
    autoConfigImportedFromMount: true,
    autoTokenizerImportedFromMount: true,
    autoProcessorImportedFromMount: true,
    qwenModelClassImported: true,
    modelType: "qwen2_5_vl",
    architectures: ["Qwen2_5_VLForConditionalGeneration"],
    hiddenSize: 3584,
    numHiddenLayers: 28,
    tokenizerClass: "Qwen2TokenizerFast",
    tokenizerVocabSize: 151643,
    processorClass: "Qwen2_5_VLProcessor"
  },
  runtimeFlags: {
    cloudRunGpuJobCreated: true,
    cloudRunGpuJobDeleted: true,
    gpuRequested: true,
    torchImported: true,
    cudaAvailable: true,
    cudaL4Visible: true,
    transformersImported: true,
    qwenVlUtilsImported: true,
    vllmImported: true,
    autoConfigImportedFromMount: true,
    autoTokenizerImportedFromMount: true,
    autoProcessorImportedFromMount: true,
    qwenModelClassImported: true,
    modelWeightsLoaded: false,
    modelLoadRun: false,
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
    "QWEN2_5_VL_STACK_TOOL_28-CLOUD-RUN-GPU-MODEL-LOAD-PROOF: verify Qwen weight load from private mount on L4, no inference"
} as const;

export type Qwen25VlCloudRunGpuModelImportProofResult =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_IMPORT_PROOF_RESULT;
