import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_gate_alignment_accepted_explicit_tool_prompt_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-PRIVATE-INFERENCE-BOUNDED-RETRY-PROMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation' as const

const retryAttemptResult =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_RESULT

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_gate_alignment',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceRetryAttemptResultDecision:
    retryAttemptResult.decision,
  alignmentOutcome: {
    retryAttemptResultRecorded: true,
    failClosedMismatchIdentified: true,
    externalAgentGateAlignedForFutureBoundedQwenRetryPrompt: true,
    qwenMayBeMarkedReadyForExplicitToolGate: true,
    directRuntimeActionFromThisPacketAllowed: false,
    explicitToolSpecificBoundedExecutionPromptRequiredBeforeRuntime: true,
    rawChatExecutionAllowed: false,
    generatedAssetsAllowed: false,
    supabaseMutationAllowed: false,
    storageWritesAllowed: false,
    signedUrlsAllowed: false,
    publicArtifactsAllowed: false,
    creditMutationAllowed: false,
    betaProductionUnlockAllowed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  gateAlignmentRules: {
    qwenCanBecomeOnlyReadyExternalAgentToolLane: true,
    requireGoPassMeansNextPromptOnly: true,
    requireGoPassRunsRuntimeByItself: false,
    retryPromptMustRepeatLiveAuthServiceJobChecks: true,
    retryPromptMustUseOneApprovedFixtureOnly: true,
    retryPromptMustUsePersistedJobLeaseBridge: true,
    retryPromptMustKeepGeneratedAssetsBlocked: true,
    retryPromptMustKeepStorageWritesBlocked: true,
    retryPromptMustKeepSignedUrlsBlocked: true,
    retryPromptMustKeepPublicArtifactsBlocked: true,
    retryPromptMustKeepSupabaseMutationBlocked: true,
    retryPromptMustKeepCreditMutationBlocked: true,
    retryPromptMustKeepBetaProductionBlocked: true,
    brollRemainsIndependentlyQuotaBlocked: true,
  },
  sourceOfTruthRules: retryAttemptResult.sourceOfTruthRules,
  runtimeFlags: {
    externalAgentGateAlignmentRecorded: true,
    qwenReadyForExplicitToolGate: true,
    requiresToolSpecificBoundedExecutionPrompt: true,
    runtimeRunNow: false,
    serviceTargetResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    identityTokenPrinted: false,
    identityTokenValueStored: false,
    authHeaderCreated: false,
    authHeaderValueStored: false,
    cloudRunInvocationAttempted: false,
    cloudRunJobExecuted: false,
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
    mediaProcessingRun: false,
    renderExportRun: false,
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceGateAlignment =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT
