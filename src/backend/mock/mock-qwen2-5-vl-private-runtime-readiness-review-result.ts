import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER } from './mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-plan'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW } from './mock-qwen2-5-vl-structured-fixture-output-result-review'

export const QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_private_runtime_readiness_review_result',
  decision:
    'qwen2_5_vl_private_runtime_readiness_review_accepted_worker_integration_review_required',
  upstreamStructuredFixtureOutputResultReviewDecision:
    QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW.decision,
  upstreamFailClosedDispatchAdapterDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER.decision,
  upstreamPrivateInvokePlanDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN.decision,
  upstreamPrivateInvokeConfigDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG.decision,
  selectedRuntime: {
    platform: 'google_cloud_run_gpu',
    gpu: 'nvidia_l4',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    costPosture: 'scale_to_zero_required',
    runOnUseStopWhenIdle: true,
    minInstancesRequired: 0,
    maxInstancesForControlledFixture: 1,
    cpuFallbackAllowedForRealQwenVlm: false,
  },
  acceptedRuntimeEvidence: [
    {
      id: 'selected_l4_scale_to_zero_runtime',
      status: 'accepted',
      evidence:
        'NVIDIA L4 on Cloud Run GPU remains the cost-friendly run-on-use target with min instances 0 and max instances 1.',
    },
    {
      id: 'controlled_private_fixture_inference',
      status: 'accepted',
      evidence:
        'Controlled structured-output retry loaded Qwen2.5-VL 7B, initialized vLLM under the bounded fixture profile, ran one approved fixture request, and restored fail-closed configuration.',
    },
    {
      id: 'structured_metadata_output',
      status: 'accepted',
      evidence:
        'Result review accepted parsedJson=true, schemaValid=true, objectCount=3, textLikeRegionCount=1, spatialRelationCount=2, and blockedActionCount=4.',
    },
    {
      id: 'raw_output_exclusion',
      status: 'accepted',
      evidence:
        'Raw model output text is not stored in the repo; evidence is limited to schema, counts, and hashes.',
    },
    {
      id: 'fail_closed_dispatch_adapter',
      status: 'accepted_for_boundary',
      evidence:
        'Qwen dispatch adapter exists and refuses local queue fixtures before Cloud Run invocation.',
    },
    {
      id: 'backend_only_private_invoke_config',
      status: 'accepted_for_boundary',
      evidence:
        'Private invocation plan and config contract exist without storing service URL values or enabling invocation.',
    },
  ],
  workerIntegrationRequirements: [
    'backend_dispatch_route_for_qwen2_5_vl_cloud_run_gpu_worker',
    'service_role_transactional_job_create_claim_lease_heartbeat_completion_failure_and_stale_recovery',
    'approved_plan_snapshot_hash_and_immutable_version_verification',
    'credit_reservation_verification_and_failure_release_or_refund',
    'private_source_of_truth_refs_with_manifests_and_checksums',
    'backend_only_cloud_run_target_and_audience_resolution',
    'idempotent_invocation_and_retry_policy',
    'observability_for_dispatch_attempt_response_failure_and_retry_decision',
    'no_raw_chat_raw_prompt_signed_url_public_url_provider_response_or_frontend_bypass',
  ],
  readinessDecision: {
    controlledPrivateFixtureRuntimeEvidenceAccepted: true,
    privateRuntimeReadinessReviewRecorded: true,
    privateRuntimeEvidenceAcceptedForMetadataOnlyFixtureReview: true,
    privateInvokeReadyForControlledFixtureMetadata: true,
    privateInvokeReadyForUserFacingWorkerDispatch: false,
    privateInvokeReadyForBeta: false,
    privateInvokeReadyForProduction: false,
    approvedWorkerIntegrationReviewRequired: true,
  },
  runtimeFlags: {
    privateRuntimeReadinessReviewRecorded: true,
    controlledPrivateFixtureRuntimeEvidenceAccepted: true,
    privateFixtureStructuredMetadataAccepted: true,
    privateInvokeReadyForControlledFixtureMetadata: true,
    approvedWorkerIntegrationReviewRequired: true,
    privateInvokeReady: false,
    betaReady: false,
    productionReady: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    mediaProcessingRun: false,
    renderExportRun: false,
    creditMutationCreated: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  blockedUses: [
    'user_facing_worker_dispatch',
    'live_supabase_queue_or_storage_mutation',
    'credit_reservation_spend_release_or_refund',
    'generated_asset_creation',
    'public_artifact_or_signed_url_delivery',
    'frontend_or_raw_prompt_invocation',
    'arbitrary_media_or_long_video_runtime',
    'beta_or_production_traffic',
  ],
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58I-APPROVED-WORKER-INTEGRATION-READINESS: review Qwen approved worker integration after private runtime acceptance, no beta/no generated assets',
} as const

export type Qwen25VlPrivateRuntimeReadinessReviewResult =
  typeof QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT
