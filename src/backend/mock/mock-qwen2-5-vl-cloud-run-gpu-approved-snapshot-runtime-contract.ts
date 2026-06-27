export const QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_approved_snapshot_runtime_contract",
  decision: "qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_runtime_contract_defined_no_inference",
  contract: {
    schemaVersion: "qwen2_5_vl_cloud_run_gpu_runtime_request_v1",
    status: "contract_defined_execution_disabled",
    approvedSnapshotRequired: true,
    queueLeaseRequired: true,
    idempotencyKeyRequired: true,
    creditReservationRequired: true,
    maxRequestBytes: 65536,
    contractEndpoint: "/contract",
    postExecutionAllowed: false
  },
  requiredRequestFields: [
    "schemaVersion",
    "requestId",
    "approvedPlanSnapshotId",
    "approvedPlanSnapshotHash",
    "approvalRecordId",
    "creditReservationId",
    "jobId",
    "queueLease",
    "idempotencyKey",
    "sourceOfTruthRefs",
    "modelPolicy",
    "runtimeGates",
    "task"
  ],
  sourceOfTruthRequired: [
    "supabaseRowRefs",
    "privateManifestRefs",
    "checksumRefs",
    "approvedPlanSnapshotRefs"
  ],
  allowedTaskUseCases: [
    "visual_understanding",
    "broll_candidate_review",
    "frame_asset_qa",
    "caption_visual_consistency_qa"
  ],
  blockedPayloadFields: [
    "prompt",
    "raw_prompt",
    "rawPrompt",
    "rawWorkerPrompt",
    "raw_worker_prompt",
    "rawPromptPayload",
    "workerPrompt"
  ],
  modelPolicyRequired: {
    modelId: "Qwen/Qwen2.5-VL-7B-Instruct",
    modelRevision: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    modelAggregateSha256:
      "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    runtime: "vllm",
    gpu: "nvidia-l4",
    servingProfile: "bounded_preview_scale_to_zero"
  },
  runtimeGatesRequired: {
    rawVlmPromptAllowed: false,
    providerExecutionAllowed: false,
    mediaProcessingAllowed: false,
    publicOutputAllowed: false,
    trackAExecutionAllowed: false,
    modelInferenceEnabled: false
  },
  serviceBehavior: {
    getContractReturnsMetadata: true,
    invalidJsonPostStatus: 400,
    oversizedPostStatus: 413,
    contractInvalidPostStatus: 403,
    contractValidPostStatus: 403,
    contractValidPostReason: "qwen_inference_disabled_after_contract_check",
    contractInvalidPostReason: "qwen_runtime_contract_rejected"
  },
  runtimeFlags: {
    runtimeContractDefined: true,
    runtimeContractEndpointAdded: true,
    postBodyBounded: true,
    approvedSnapshotRequired: true,
    queueLeaseRequired: true,
    idempotencyKeyRequired: true,
    creditReservationRequired: true,
    sourceOfTruthRefsRequired: true,
    rawPromptFieldsRejected: true,
    contractValidRequestStillExecutes: false,
    modelImportOnStartup: false,
    modelInferenceEnabled: false,
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
    "QWEN2_5_VL_STACK_TOOL_31-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-CONTRACT-SMOKE: run local contract handler smoke for valid/invalid request fixtures, no inference"
} as const;

export type Qwen25VlCloudRunGpuApprovedSnapshotRuntimeContract =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT;
