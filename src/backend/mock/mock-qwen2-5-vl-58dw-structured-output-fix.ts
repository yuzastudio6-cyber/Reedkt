import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result'

export const QWEN2_5_VL_58DW_STRUCTURED_OUTPUT_FIX_NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-RETRY-2: run one bounded approved-fixture private inference retry after strict structured-output fix, no generated assets/no mutation' as const

export const QWEN2_5_VL_58DW_STRUCTURED_OUTPUT_FIX = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_58dw_structured_output_fix_only',
  decision:
    'qwen2_5_vl_58dw_structured_output_fix_ready_for_bounded_retry_2',
  upstreamBoundedRetryDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT_RESULT.decision,
  upstreamBlocker: 'structured_metadata_schema_invalid_after_bounded_58dw_retry',
  sourceFiles: {
    gpuService: 'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
    cpuCaller: 'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
    boundedRetryRunner: 'server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts',
  },
  strictFixtureSchema: {
    schemaVersion: 'qwen_fixture_visual_metadata_v1',
    strictnessVersion: 'qwen_fixture_visual_metadata_v1_strict_after_58dw',
    fixtureId: 'fixture_mock_qwen_approved_private_frame_001',
    requiredTopLevelKeys: [
      'schema_version',
      'fixture_id',
      'use_case',
      'objects',
      'text_like_regions',
      'spatial_relations',
      'uncertainty',
      'blocked_actions',
    ],
    rejectedTopLevelShape: ['label', 'region', 'confidence'],
    minimumObjectCount: 2,
    minimumTextLikeRegionCount: 1,
    minimumSpatialRelationCount: 1,
    minimumBlockedActionCount: 4,
    requiredBlockedActions: [
      'no_generated_assets',
      'no_public_artifacts',
      'no_signed_urls',
      'no_raw_prompt_execution',
    ],
  },
  sourceFixes: {
    promptRejectsTopLevelObjectRow: true,
    promptIncludesExactKeySet: true,
    promptIncludesMinimumRowCounts: true,
    promptIncludesRequiredBlockedActions: true,
    schemaValidRequiresNoValidationReasons: true,
    schemaValidRequiresMinimumCounts: true,
    schemaValidRejectsTopLevelObjectRow: true,
    cpuCallerRequiresStrictSchemaFields: true,
    retryRunnerTokenBudgetRaised: true,
    retryRunnerFixtureImageRestoredToFullSize: true,
  },
  localValidation: {
    validFixtureObjectAccepted: true,
    genericTopLevelObjectRowRejected: true,
    missingTextLikeRegionRejected: true,
    missingBlockedActionsRejected: true,
    invalidProseRejected: true,
    localParserValidationPassed: true,
  },
  runtimeFlags: {
    sourceFixDefined: true,
    cloudRunServiceDeployed: false,
    cloudRunInvocationAttempted: false,
    cloudRunJobExecuted: false,
    identityTokenFetched: false,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    inferenceRun: false,
    boundedRetry2Run: false,
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
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: QWEN2_5_VL_58DW_STRUCTURED_OUTPUT_FIX_NEXT_PROMPT,
} as const

export type Qwen25Vl58dwStructuredOutputFix =
  typeof QWEN2_5_VL_58DW_STRUCTURED_OUTPUT_FIX
