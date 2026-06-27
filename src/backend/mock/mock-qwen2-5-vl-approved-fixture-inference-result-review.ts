import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT } from './mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result'

export const QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_approved_fixture_inference_result_review',
  decision:
    'qwen2_5_vl_approved_fixture_inference_result_review_invocation_passed_structured_output_blocked',
  upstreamSmokeFixDecision: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.decision,
  reviewedRun: {
    runId: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.retry.runId,
    cpuCallerExecution:
      QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.retry.cpuCallerExecution,
    selectedGpu: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.retry.selectedGpu,
    observedHttpStatus:
      QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.retry.observedHttpStatus,
    serviceReason: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.retry.serviceReason,
    elapsedMs: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.retry.elapsedMs,
  },
  reviewedMetadataOutput: {
    ...QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.metadataOutput,
  },
  acceptedEvidence: {
    invocationProofAccepted: true,
    privateModelCacheLoadAccepted: true,
    l4FixtureProfileAccepted: true,
    scaleToZeroPosturePreserved: true,
    failClosedRestoreAccepted: true,
    metadataOnlyEvidenceAccepted: true,
  },
  blockedEvidence: {
    structuredJsonOutputAccepted: false,
    productQaMetadataAccepted: false,
    runtimeReadinessAdvanced: false,
    reasons: [
      'parsed_json_false',
      'schema_keys_empty',
      'object_count_zero',
      'text_like_region_count_zero',
      'raw_output_not_committed_for_policy_safety',
    ],
  },
  requiredFix: {
    owner: 'AI_VIDEO_BROLL_GENERATION',
    action:
      'Tune the fixture prompt, parser, or output schema guard so the controlled fixture path returns compact structured JSON metadata.',
    mayRunAnotherApprovedFixtureSmokeInFuture: true,
    mustRestoreFailClosedAfterRetry: true,
    rawPromptFieldsStillBlocked: true,
    generatedAssetsAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
    betaAllowed: false,
    productionAllowed: false,
  },
  runtimeFlags: {
    resultReviewRecorded: true,
    invocationProofAccepted: true,
    privateModelCacheLoadAccepted: true,
    l4FixtureProfileAccepted: true,
    scaleToZeroPosturePreserved: true,
    failClosedRestoreAccepted: true,
    metadataOnlyEvidenceAccepted: true,
    structuredJsonOutputAccepted: false,
    productQaMetadataAccepted: false,
    runtimeReadinessAdvanced: false,
    privateInvokeReady: false,
    betaReady: false,
    productionReady: false,
    inferenceRunNow: false,
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
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58E-STRUCTURED-FIXTURE-OUTPUT-FIX: tune Qwen fixture prompt/parser for structured JSON metadata, no beta/no generated assets',
} as const

export type Qwen25VlApprovedFixtureInferenceResultReview =
  typeof QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW
