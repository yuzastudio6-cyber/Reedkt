export const QWEN2_5_VL_IDLE_GPU_LIFECYCLE = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "idle_gpu_lifecycle_plan_only",
  decision: "qwen2_5_vl_7b_idle_gpu_lifecycle_plan_ready_for_cloud_run_gpu_scale_to_zero_review",
  selectedGpu: "nvidia_l4_google_cloud_g2",
  modelRole: "visual_understanding_planning_qa_tool",
  claimsRuntimeReady: false,
  claimsBetaReady: false,
  claimsProductionReady: false,
  claimsDryRunPassed: false,
  claimsGeneratedLocalFixturePassed: false,
  lifecycle: {
    alwaysOnGpuRejected: true,
    longHeldIdleReservationRejected: true,
    runOnlyWhenQueuedRequired: true,
    stopWhenIdleRequired: true,
    preferredPath: "cloud_run_gpu_scale_to_zero_review",
    fallbackPath: "ephemeral_compute_engine_l4_worker_idle_teardown",
    minActiveGpuWorkers: 0,
    maxActiveGpuWorkers: 1,
    proofIdleTimeoutSeconds: 600,
    proofMaxRuntimeSeconds: 1800,
    queueDrainAction: "scale_to_zero_or_delete_worker",
    failureAction: "cleanup_before_report",
    operatorStopRequired: true
  },
  gpuShapeRanking: [
    {
      rank: 1,
      shape: "cloud_run_gpu_nvidia_l4",
      useCase: "preferred_beta_candidate_if_container_and_model_cache_fit",
      costReason: "scale_to_zero_when_idle",
      executionAllowedNow: false
    },
    {
      rank: 2,
      shape: "g2-standard-4+nvidia-l4",
      useCase: "minimum_import_smoke_or_short_proof",
      costReason: "lower_cpu_memory_cost_than_g2_standard_8",
      executionAllowedNow: false
    },
    {
      rank: 3,
      shape: "g2-standard-8+nvidia-l4",
      useCase: "beta_candidate_for_smoother_qwen_host_memory_and_serving",
      costReason: "more_headroom_but_no_always_on_default",
      executionAllowedNow: false
    }
  ],
  toolCallRanking: [
    {
      rank: 1,
      useCase: "source_frame_visual_understanding",
      qwenRoute: "primary",
      betterRouteWhenApplicable: "deterministic_metadata"
    },
    {
      rank: 2,
      useCase: "ocr_layout_readability_qa",
      qwenRoute: "primary_advisory",
      betterRouteWhenApplicable: "deterministic_ocr_layout_tool_for_exact_extraction"
    },
    {
      rank: 3,
      useCase: "caption_visual_collision_qa",
      qwenRoute: "primary_advisory",
      betterRouteWhenApplicable: "remotion_layout_validator_for_exact_frame_math"
    },
    {
      rank: 4,
      useCase: "product_demo_step_understanding",
      qwenRoute: "primary_planner_support",
      betterRouteWhenApplicable: "transcript_or_tool_logs"
    },
    {
      rank: 5,
      useCase: "broll_relevance_scoring",
      qwenRoute: "advisory_ranker",
      betterRouteWhenApplicable: "wan_or_hailuo_generation_after_approval"
    },
    {
      rank: 6,
      useCase: "generated_asset_visual_qa",
      qwenRoute: "advisory_reviewer",
      betterRouteWhenApplicable: "deterministic_media_qa_for_exact_measurements"
    },
    {
      rank: 7,
      useCase: "unclear_or_sensitive_visual_claim",
      qwenRoute: "escalate_to_human_review",
      betterRouteWhenApplicable: "documentary_fact_safety_policy"
    },
    {
      rank: 8,
      useCase: "generated_video_creation",
      qwenRoute: "not_allowed",
      betterRouteWhenApplicable: "wan_primary_hailuo_fallback_veo_premium_final_fallback_only"
    }
  ],
  workItemContract: {
    approvedPlanSnapshotRequired: true,
    compiledIntentRequired: true,
    structuredTaskTypeRequired: true,
    sourceAssetReferencesRequired: true,
    idempotencyKeyRequired: true,
    queueLeaseRequired: true,
    rawChatExecutionRejected: true,
    signedUrlSourceOfTruthRejected: true,
    publicArtifactOutputRejected: true,
    expectedOutput: "metadata_and_qa_findings_only"
  },
  costControls: {
    creditEstimateRequiredBeforeProductionUse: true,
    costCapRequired: true,
    oneActiveL4WorkerCapUntilBetaEvidence: true,
    idleGpuBillingTarget: "zero",
    persistentDiskCostMustBeExplicit: true,
    reservationRequiresTimeBoundedApproval: true
  },
  runtimeFlags: {
    gcpMutatingCommandsExecuted: false,
    reservationCreated: false,
    vmCreated: false,
    cloudRunServiceCreated: false,
    cloudRunJobCreated: false,
    dockerBuildRun: false,
    artifactRegistryImageCreated: false,
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
    "QWEN2_5_VL_STACK_TOOL_11-CLOUD-RUN-GPU-SCALE-TO-ZERO-REVIEW: evaluate Qwen Cloud Run GPU scale-to-zero fit, no deploy/no inference"
} as const;

export type Qwen25VlIdleGpuLifecycle = typeof QWEN2_5_VL_IDLE_GPU_LIFECYCLE;
