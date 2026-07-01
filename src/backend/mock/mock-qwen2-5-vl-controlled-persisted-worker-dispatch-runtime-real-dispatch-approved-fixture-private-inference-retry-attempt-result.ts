import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_APPROVAL } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_attempt_blocked_fail_closed_external_agent_gate' as const
const BLOCKER = 'fail_closed_external_agent_execution_gate_blocks_58du_retry_attempt' as const
const HISTORICAL_EXTERNAL_AGENT_GATE_DECISION = 'external_agent_execution_no_go_runtime_blocked' as const
const HISTORICAL_QWEN_GATE_SAFE_NEXT_COMMAND = 'npm run external-agent-tool-blockers:preflight' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DV-PRIVATE-INFERENCE-GATE-ALIGNMENT: align the fail-closed external-agent gate with the approved bounded retry attempt, no Cloud Run invocation/no inference/no generated assets' as const

const attemptApproval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_APPROVAL

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_attempt_result',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceRetryAttemptApprovalDecision:
    attemptApproval.decision,
  externalAgentExecutionGateDecision: HISTORICAL_EXTERNAL_AGENT_GATE_DECISION,
  attemptSummary: {
    retryAttemptApprovalRecorded: true,
    retryAttemptApprovedForFutureBoundedAttempt:
      attemptApproval.retryAttemptApproval
        .approvedFixturePrivateInferenceRetryAttemptApprovedForFutureBoundedAttempt,
    retryAttemptRequired: true,
    executionGateInspected: true,
    externalAgentExecutionAllowedNow: false,
    readyForAnyExternalAgentExecutionNow: false,
    qwenGateRowExecutionAllowedNow: false,
    qwenGateCurrentBlocker: BLOCKER,
    qwenGateSafeNextCommand: HISTORICAL_QWEN_GATE_SAFE_NEXT_COMMAND,
    blocker: BLOCKER,
    blockedBeforeRuntimeMutation: true,
    blockedBeforeGpuSpend: true,
    blockedBeforeCloudRunInvocation: true,
    blockedBeforeModelImportOrLoad: true,
    privateInferenceRetryAttemptExecuted: false,
    generatedLocalFixturePassedClaimed: false,
  },
  inspectedCommands: [
    'npm run external-agent-tool-next-command',
    'npm run external-agent-tool-execution-gate',
    'npm run external-agent-tool-execution-gate -- --require-go',
    'npm run external-agent-tool-blockers:preflight',
  ],
  sanitizedBlocker: {
    id: BLOCKER,
    failClosedExternalAgentGate: true,
    externalGateAllowsExecutionNow: false,
    qwenGateAllowsExecutionNow: false,
    runtimeCommandSkipped: true,
    credentialsPrinted: false,
    tokenPrinted: false,
    serviceUrlPrinted: false,
    rawRuntimeOutputStored: false,
  },
  sourceOfTruthRules: attemptApproval.sourceOfTruthRules,
  runtimeFlags: {
    approvedFixturePrivateInferenceRetryAttemptApprovalRecorded: true,
    approvedFixturePrivateInferenceRetryAttemptResultRecorded: true,
    approvedFixturePrivateInferenceRetryAttemptBlockedByExternalAgentGate: true,
    externalAgentExecutionGateInspected: true,
    externalAgentExecutionAllowedNow: false,
    readyForAnyExternalAgentExecutionNow: false,
    privateInferenceRetryAttemptExecuted: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceRetryAttemptResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_RESULT
