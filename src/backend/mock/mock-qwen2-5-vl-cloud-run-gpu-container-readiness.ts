export const QWEN2_5_VL_CLOUD_RUN_GPU_CONTAINER_READINESS = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_container_readiness_spec_only",
  decision: "qwen2_5_vl_7b_cloud_run_gpu_container_readiness_spec_ready_for_no_build_image_plan",
  containerDecision: {
    existingVlmRuntimeLaneFound: true,
    existingVlmRuntimePath: "docker/prod/vlm-sglang-runtime",
    duplicateRuntimeStackRejected: true,
    selectedContainerDirection: "qwen_specific_cloud_run_service_wrapper_extending_existing_vlm_boundary",
    existingSglangLaneReuseAllowedAfterReview: true,
    immediateContainerBuildAllowed: false,
    immediateCloudRunDeployAllowed: false,
    modelWeightsInImageRejectedForFirstProof: true,
    runtimeDependencyInstallAtRequestTimeRejected: true,
    offlineWheelhouseUseRequired: true
  },
  privateModelCache: {
    model: "Qwen/Qwen2.5-VL-7B-Instruct",
    revision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    privateCachePath:
      "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5",
    totalBytes: 16595981281,
    aggregateSha256: "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    runtimeMountCreated: false,
    cloudRunModelCacheStrategyApproved: false,
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
  requiredRuntimeDefaults: {
    HF_HUB_OFFLINE: "1",
    TRANSFORMERS_OFFLINE: "1",
    HF_HUB_DISABLE_TELEMETRY: "1",
    MODEL_DOWNLOADS_ENABLED: "false",
    RAW_VLM_PROMPT_ENABLED: "false",
    PROVIDER_EXECUTION_ENABLED: "false",
    MEDIA_PROCESSING_ENABLED: "false",
    PUBLIC_OUTPUT_ENABLED: "false",
    TRACK_A_EXECUTION_ENABLED: "false",
    QWEN_APPROVED_SNAPSHOT_REQUIRED: "true",
    QWEN_QUEUE_LEASE_REQUIRED: "true"
  },
  checksRequiredBeforeBuild: [
    "vllm_vs_sglang_decision",
    "existing_runtime_extension_or_qwen_wrapper_decision",
    "private_model_cache_source_of_truth",
    "offline_wheelhouse_copy_install_path",
    "startup_health_endpoint_without_full_model_import",
    "separate_model_import_proof_command",
    "timeout_and_startup_probe_values",
    "private_invocation_service_account",
    "safe_log_fields",
    "queue_lease_idempotency_contract"
  ],
  runtimeFlags: {
    containerReadinessSpecCreated: true,
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
    "QWEN2_5_VL_STACK_TOOL_15-CLOUD-RUN-GPU-NO-BUILD-IMAGE-PLAN: define Qwen Cloud Run image build plan and private model-cache strategy, no build/no deploy/no inference"
} as const;

export type Qwen25VlCloudRunGpuContainerReadiness =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_CONTAINER_READINESS;
