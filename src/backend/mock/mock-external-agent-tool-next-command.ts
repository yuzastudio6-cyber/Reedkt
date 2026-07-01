import { QWEN2_5_VL_58DW_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT } from './mock-external-agent-tool-execution-readiness-rollup'

export type ExternalAgentToolNextCommandAllowedProbe = {
  id: string
  script: string
  liveReadOnly: boolean
  mutatesRuntime: false
  runsModel: false
  createsAssets: false
  purpose: string
}

export const EXTERNAL_AGENT_TOOL_NEXT_COMMAND = {
  decision: 'external_agent_live_next_command_read_only_decision_defined',
  mode: 'read_only_external_agent_tool_next_command_decision',
  defaultDecision: 'external_agent_execution_no_go_runtime_blocked',
  paidProductionInScope: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  allowedProbeScripts: [
    {
      id: 'execution_gate',
      script: 'server/cli/external-agent-tool-execution-gate.ts',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose: 'read static fail-closed execution gate before considering any runtime action',
    },
    {
      id: 'live_blocker_preflight',
      script: 'server/cli/external-agent-tool-blocker-preflight.ts',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose: 'read live gcloud auth/service/job/quota blocker status without runtime mutation',
    },
    {
      id: 'gcloud_session_diagnostic',
      script: 'server/cli/external-agent-gcloud-session-diagnostic.ts',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose: 'read local gcloud session/config diagnostics when auth refresh is still blocked',
    },
  ] satisfies ExternalAgentToolNextCommandAllowedProbe[],
  nextCommandRules: {
    whenExecutionGateAllowsRuntime: QWEN2_5_VL_58DW_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT,
    whenStaticGateAllowsButQwenLivePreflightFails: 'npm run external-agent-tool-blockers:preflight',
    whenQwenAuthRefreshFails: 'npm run external-agent-gcloud-session:diagnostic',
    whenQwenAuthClearsAndBrollQuotaBlocked: 'npm run external-agent-tool-execution-gate -- --require-go',
    whenBrollQuotaNeedsVerification: 'npm run external-agent-tool-blockers:preflight',
    whenWanCacheNeedsStaticRefresh: 'npm run ai-video-broll-wan-fast-cache-readiness:check',
  },
  manualActionRules: {
    whenQwenAuthRefreshFails: {
      required: true,
      reason: 'gcloud_auth_refresh_required_before_downstream_probes',
      blocksRuntime: true,
      rerunAfterManualAction: 'npm run external-agent-tool-blockers:preflight',
    },
  },
  forbiddenRuntimeActions: [
    'do not invoke Cloud Run outside the approved 58DW bounded Qwen retry prompt',
    'do not execute Cloud Run jobs outside the approved 58DW bounded Qwen retry prompt',
    'do not create Compute Engine VMs',
    'do not request quota',
    'do not run Docker',
    'do not import models outside the approved 58DW bounded Qwen retry prompt',
    'do not run inference outside the approved 58DW bounded Qwen retry prompt',
    'do not create generated assets',
    'do not call providers',
    'do not dispatch workers',
    'do not touch Supabase',
    'do not execute SQL',
    'do not create storage objects',
    'do not create signed URLs',
    'do not mutate credits',
    'do not unlock beta',
    'do not unlock production',
  ],
  runtimeSideEffects: {
    cloudRunServiceMutated: false,
    cloudRunJobExecuted: false,
    computeVmCreated: false,
    quotaRequestCreated: false,
    dockerRun: false,
    modelImportRun: false,
    modelInferenceRun: false,
    generatedVideoCreated: false,
    generatedAssetsCreated: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
  },
} as const

export type ExternalAgentToolNextCommand = typeof EXTERNAL_AGENT_TOOL_NEXT_COMMAND
