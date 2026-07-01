import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from './mock-external-agent-tool-next-command'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_bounded_retry_prompt_blocked_live_gcloud_reauthentication_required' as const
const BLOCKER = 'local_gcloud_reauthentication_required_before_58dw_runtime' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight' as const

const gateAlignment =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_bounded_retry_prompt_result',
  decision: DECISION,
  upstreamGateAlignmentDecision: gateAlignment.decision,
  nextCommandDecision: EXTERNAL_AGENT_TOOL_NEXT_COMMAND.decision,
  boundedRetryPromptResult: {
    staticExternalAgentGateAllowsQwenPrompt: true,
    liveNextCommandRequiresQwenPreflight: true,
    qwenLivePreflightPassed: false,
    qwenAuthRefreshPassed: false,
    qwenServiceDescribePassed: false,
    qwenJobDescribePassed: false,
    qwenDownstreamProbeSkipped: true,
    downstreamProbeSkipReason: 'auth_refresh_failed_before_downstream_probe',
    blocker: BLOCKER,
    blockedBeforeRuntimeMutation: true,
    blockedBeforeGpuSpend: true,
    boundedRetryPromptExecuted: false,
    generatedLocalFixturePassedClaimed: false,
  },
  inspectedCommands: [
    'npm run external-agent-tool-next-command',
    'npm run smoke:external-agent-tool-next-command',
    'npm run external-agent-tool-blockers:preflight',
  ],
  sanitizedDiagnosticSummary: {
    gcloudPathObserved: '/usr/local/bin/gcloud',
    configuredProjectObserved: 'reeditpro',
    activeAccountDomainObserved: 'reeditpro.com',
    tokenRefreshValueCaptured: false,
    tokenPrinted: false,
    credentialPrinted: false,
    serviceUrlPrinted: false,
    rawRuntimeOutputStored: false,
  },
  sourceOfTruthRules: gateAlignment.sourceOfTruthRules,
  runtimeFlags: {
    boundedRetryPromptResultRecorded: true,
    liveNextCommandAuthGuardRecorded: true,
    staticExternalAgentGateInspected: true,
    staticExternalAgentGateAllowsQwenPrompt: true,
    qwenLivePreflightPassed: false,
    qwenAuthRefreshPassed: false,
    qwenServiceDescribePassed: false,
    qwenJobDescribePassed: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceBoundedRetryPromptResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT_RESULT
