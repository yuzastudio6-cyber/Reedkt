import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT } from './mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result'

export const QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_structured_fixture_output_result_review',
  decision:
    'qwen2_5_vl_structured_fixture_output_result_review_accepted_private_runtime_readiness_review_required',
  upstreamStructuredFixtureOutputSmokeRetryDecision:
    QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT.decision,
  reviewedRetry: {
    runId: 'qwen25-structured-fixture-output-retry-20260627t204453z',
    fixtureUseCase: 'visual_understanding',
    selectedGpu: 'nvidia_l4',
    selectedRuntime: 'google_cloud_run_gpu_vllm',
    observedHttpStatus: 200,
    serviceReason: 'qwen_fixture_inference_smoke_completed',
    rawOutputStoredInRepo: false,
  },
  acceptedMetadataEvidence: {
    parsedJson: true,
    parseStrategy: 'json_object_extracted',
    schemaVersion: 'qwen_fixture_visual_metadata_v1',
    schemaValid: true,
    outputTextLength: 645,
    outputTextSha256: 'f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4',
    normalizedMetadataSha256:
      'f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4',
    objectCount: 3,
    textLikeRegionCount: 1,
    spatialRelationCount: 2,
    blockedActionCount: 4,
    schemaKeys: [
      'blocked_actions',
      'fixture_id',
      'objects',
      'schema_version',
      'spatial_relations',
      'text_like_regions',
      'uncertainty',
      'use_case',
    ],
    missingSchemaKeys: [] as string[],
    normalizationWarnings: [] as string[],
  },
  acceptance: {
    schemaVersionAccepted: true,
    requiredSchemaKeysAccepted: true,
    jsonExtractionAccepted: true,
    objectRowsAccepted: true,
    textLikeRegionRowsAccepted: true,
    spatialRelationRowsAccepted: true,
    blockedActionRowsAccepted: true,
    normalizedMetadataHashAccepted: true,
    rawOutputExclusionAccepted: true,
    acceptedForPrivateRuntimeReadinessReview: true,
    acceptedForBeta: false,
    acceptedForProduction: false,
    acceptedForGeneratedAssets: false,
    acceptedForPublicArtifacts: false,
    acceptedForSignedUrls: false,
  },
  runtimeFlags: {
    structuredFixtureOutputResultReviewRecorded: true,
    structuredFixtureMetadataAccepted: true,
    structuredFixtureOutputResultReviewRequired: false,
    privateRuntimeReadinessReviewRequired: true,
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
  remainingBlockers: [
    {
      id: 'private_runtime_readiness_review_required',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredBeforeRuntimeAdvance:
        'Review private runtime readiness after structured fixture metadata acceptance, including worker, storage, billing, QA, and product boundaries.',
    },
    {
      id: 'beta_and_production_approval_required',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredBeforeRuntimeAdvance:
        'No beta or production workflow can use Qwen until product, QA, billing, worker, storage, and runtime gates are accepted.',
    },
  ],
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58H-PRIVATE-RUNTIME-READINESS-REVIEW: review Qwen private runtime readiness after structured fixture output acceptance, no beta/no generated assets',
} as const

export type Qwen25VlStructuredFixtureOutputResultReview =
  typeof QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW
