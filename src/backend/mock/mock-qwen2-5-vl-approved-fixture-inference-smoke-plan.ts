import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'
import { QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW } from './mock-qwen2-5-vl-private-invoke-runtime-readiness-review'

export type Qwen25VlApprovedFixtureUseCaseRank = {
  rank: number
  useCase: 'visual_understanding' | 'frame_asset_qa' | 'broll_candidate_review' | 'caption_visual_consistency_qa'
  smokePriority: 'first' | 'second' | 'third' | 'fourth'
  reason: string
  requiredBeforeUse: string[]
}

export const QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_approved_fixture_inference_smoke_plan_mock_only',
  decision: 'qwen2_5_vl_approved_fixture_inference_smoke_plan_defined_no_execution',
  upstreamRuntimeReadinessReviewDecision:
    QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW.decision,
  upstreamRuntimeContractDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.decision,
  upstreamLocalQueueContractDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.decision,
  selectedRuntime: {
    platform: 'google_cloud_run_gpu',
    gpu: 'nvidia_l4',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    runtime: 'vllm',
    costPosture: 'scale_to_zero_required',
    runOnUseStopWhenIdle: true,
    minInstancesRequired: 0,
    maxInstancesForFirstFixtureSmoke: 1,
    cpuFallbackAllowedForRealQwenVlm: false,
  },
  modelPolicy: QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.modelPolicyRequired,
  plannedFixture: {
    fixtureId: 'fixture_mock_qwen_approved_private_frame_001',
    fixtureScope: 'private_metadata_only',
    sourceQueueFixtureId:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.payloadJson.task.taskRef,
    approvedPlanSnapshotId:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.approvedPlanSnapshotId,
    approvalRecordId:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.payloadJson.approvalRecordId,
    creditReservationId:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.creditReservationId,
    idempotencyKey:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.idempotencyKey,
    privateMediaAssetRefs:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.payloadJson.task.mediaAssetRefs,
    structuredFindingIds:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.payloadJson.task.structuredFindingIds,
    editIntentIds:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.payloadJson.task.editIntentIds,
    sourceOfTruthRefs:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.payloadJson.sourceOfTruthRefs,
    requestedOutput: 'metadata_only_visual_understanding_summary',
    publicUrlsAreSourceOfTruth: false,
    signedUrlsAreSourceOfTruth: false,
  },
  useCaseRanking: [
    {
      rank: 1,
      useCase: 'visual_understanding',
      smokePriority: 'first',
      reason:
        'Smallest useful private-frame metadata path for proving Qwen VLM execution without generated assets.',
      requiredBeforeUse: [
        'approved_snapshot_reference',
        'private_sampled_frame_reference',
        'metadata_only_output_schema',
      ],
    },
    {
      rank: 2,
      useCase: 'frame_asset_qa',
      smokePriority: 'second',
      reason:
        'Useful after private asset source-of-truth references exist and before composition handoff.',
      requiredBeforeUse: [
        'private_asset_manifest',
        'qa_evidence_schema',
        'no_public_artifact_gate',
      ],
    },
    {
      rank: 3,
      useCase: 'broll_candidate_review',
      smokePriority: 'third',
      reason:
        'Useful after B-roll candidates exist; Qwen reviews relevance and does not generate video.',
      requiredBeforeUse: [
        'broll_candidate_refs',
        'generation_route_owner_boundary',
        'metadata_only_relevance_schema',
      ],
    },
    {
      rank: 4,
      useCase: 'caption_visual_consistency_qa',
      smokePriority: 'fourth',
      reason:
        'Advisory only after deterministic OCR, safe-zone, and caption layout checks.',
      requiredBeforeUse: [
        'ocr_regions',
        'safe_zone_regions',
        'caption_layout_plan',
      ],
    },
  ] satisfies Qwen25VlApprovedFixtureUseCaseRank[],
  futureExecutionPreflight: {
    repeatAuthIamReverify: true,
    verifyPrivateCallerPath: true,
    verifyApprovedQueueFixture: true,
    verifyModelPolicyRevisionAndChecksum: true,
    verifyScaleToZeroPosture: true,
    verifyMaxScaleOne: true,
    verifyNoUserTraffic: true,
    verifyNoBatchTraffic: true,
    verifyNoPublicOrSignedUrlSourceOfTruth: true,
    verifyNoRawPrompt: true,
  },
  futureRuntimeGateDelta: {
    mayEnableModelImportOnlyInsideFutureSmoke: true,
    mayEnableModelLoadOnlyInsideFutureSmoke: true,
    mayEnableInferenceOnlyInsideFutureSmoke: true,
    mayPersistMetadataOnlyResult: true,
    mayCreateGeneratedAsset: false,
    mayCreatePublicArtifact: false,
    mayCreateSignedUrl: false,
    mayRenderExport: false,
    mayUnlockBeta: false,
    mayUnlockProduction: false,
  },
  runtimeFlags: {
    approvedFixtureInferenceSmokePlanDefined: true,
    approvedQueueFixtureAvailable: true,
    privateInvokeContractPathReady: true,
    modelRevisionPinned: true,
    firstApprovedFixtureInferenceSmokeExecuted: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    authHeaderCreated: false,
    identityTokenFetched: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    promptProcessed: false,
    forwardPassRun: false,
    inferenceRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    renderExportRun: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  blockedUses: [
    'raw_chat_execution',
    'raw_prompt_execution',
    'frontend_model_runtime',
    'unbounded_media_input',
    'generated_broll_video',
    'generated_asset_creation',
    'public_artifact_creation',
    'signed_url_creation',
    'render_mux_export',
    'beta_or_production_traffic',
  ],
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58-APPROVED-FIXTURE-INFERENCE-SMOKE-EXECUTE: run first private approved-fixture Qwen inference smoke, no generated assets/no beta',
} as const

export type Qwen25VlApprovedFixtureInferenceSmokePlan =
  typeof QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN
