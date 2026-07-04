import {
  EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
  QWEN2_5_VL_58DX_RESULT_REVIEW_PROMPT,
} from './mock-external-agent-tool-execution-readiness-rollup'

export type ExternalAgentToolNextCommandAllowedProbe = {
  id: string
  script: string
  liveReadOnly: boolean
  mutatesRuntime: false
  runsModel: false
  createsAssets: false
  purpose: string
}

export type ExternalAgentToolQwenBoundedExecutionCommand = {
  toolId: 'qwen2_5_vl_7b_instruct'
  command: 'npm'
  args: readonly [
    'run',
    'qwen2-5-vl-58dw-bounded-private-inference-retry',
    '--',
    '--execute',
    '--json',
  ]
  confirmationEnv: 'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY'
  confirmationEnvRequiredValue: 'true'
  requiresLivePreflightPassed: true
  requiresStaticExplicitToolGateReady: true
  boundedApprovedFixtureOnly: true
  createsGeneratedAssets: false
  touchesSupabase: false
  touchesSql: false
  unlocksBetaOrProduction: false
}

export type ExternalAgentToolQwenExternalAgentExecutionCommand = {
  toolId: 'qwen2_5_vl_7b_instruct'
  command: 'npm'
  args: readonly ['run', 'external-agent-tool-execute-qwen', '--', '--execute', '--json']
  confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION'
  confirmationEnvRequiredValue: 'true'
  verifiesLiveNextCommandBeforeDelegating: true
  delegatesToBoundedCommand: true
  boundedApprovedFixtureOnly: true
  createsGeneratedAssets: false
  touchesSupabase: false
  touchesSql: false
  unlocksBetaOrProduction: false
}

export type ExternalAgentToolBrollWanExternalAgentProofCommand = {
  toolId: 'ai_video_broll_generation_wan'
  command: 'npm'
  args: readonly ['run', 'external-agent-tool-execute-broll-wan', '--', '--execute', '--json']
  confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF'
  confirmationEnvRequiredValue: 'true'
  verifiesLiveQuotaBeforeAnyVmAction: true
  verifiesPrivateCacheBeforeAnyVmAction: true
  requiresNoIdleLifecycleGate: true
  blocksWhenGpusAllRegionsQuotaInsufficient: true
  createsComputeVm: true
  deletesComputeVmAndVerifiesCleanup: true
  dependencyInstallOnly: false
  modelImportLoadProofOnly: true
  runsModel: true
  runsModelInference: false
  createsGeneratedAssets: false
  touchesSupabase: false
  touchesSql: false
  unlocksBetaOrProduction: false
}

export type ExternalAgentToolBrollWanInferenceProofCommand = {
  toolId: 'ai_video_broll_generation_wan'
  command: 'npm'
  args: readonly ['run', 'external-agent-tool-execute-broll-wan', '--', '--inference-proof', '--execute', '--json']
  confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF'
  confirmationEnvRequiredValue: 'true'
  delegatesTo11hRunner: true
  executionRequiresSeparatePrompt: false
  requiresNoIdleLifecycleGate: true
  createsComputeVm: true
  deletesComputeVmAndVerifiesCleanup: true
  runsModel: true
  runsModelInference: true
  outputType: 'latent'
  persistsInferenceOutput: false
  createsVideoFrames: false
  encodesVideo: false
  createsGeneratedAssets: false
  touchesSupabase: false
  touchesSql: false
  unlocksBetaOrProduction: false
}

export type ExternalAgentToolBrollWanPrivateCachePrepareCommand = {
  toolId: 'ai_video_broll_generation_wan'
  command: 'npm'
  args: readonly ['run', 'external-agent-tool-prepare-broll-wan-cache', '--', '--execute', '--json']
  confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_CACHE_FILL'
  confirmationEnvRequiredValue: 'true'
  delegatesTo11eCloudSideCacheStagingRunner: true
  stagesPrivateGcsModelCacheOnly: true
  createsCloudRunJob: true
  deletesCloudRunJobAndVerifiesCleanup: true
  createsComputeVm: false
  runsModel: false
  runsModelInference: false
  createsGeneratedAssets: false
  touchesSupabase: false
  touchesSql: false
  unlocksBetaOrProduction: false
}

export type ExternalAgentToolSoundMusicAudioEvidenceCommand = {
  toolId: 'sound_music_audio'
  command: 'npm'
  args: readonly ['run', 'external-agent-tool-execute-sound', '--', '--execute', '--json']
  confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW'
  confirmationEnvRequiredValue: 'true'
  verifiesSoundOssArchiveDiagnosticsBeforeAnyRuntime: true
  verifiesSoundRuntimeRouteSourceDiagnosticsBeforeAnyRuntime: true
  safeEvidenceReviewExecutableNow: true
  runtimeExecutionAllowedNow: false
  blocksRealProviderWorkerStorageExport: true
  runsProvider: false
  dispatchesWorker: false
  runsMediaProcessing: false
  createsGeneratedAudio: false
  createsGeneratedAssets: false
  touchesSupabase: false
  touchesSql: false
  unlocksBetaOrProduction: false
}

export type ExternalAgentToolSupabaseHarnessEvidenceCommand = {
  toolId: 'supabase_local_fixture_harness'
  command: 'npm'
  args: readonly ['run', 'external-agent-tool-execute-supabase-harness', '--', '--execute', '--json']
  confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW'
  confirmationEnvRequiredValue: 'true'
  verifiesLocalConfigBeforeAnyRuntime: true
  verifiesLocalHarnessRetryEvidenceBeforeAnyRuntime: true
  safeEvidenceReviewExecutableNow: true
  runtimeExecutionAllowedNow: false
  blocksLiveSupabaseMutation: true
  runsSupabaseCli: false
  runsDocker: false
  executesSql: false
  createsRows: false
  createsStorageObjects: false
  createsSignedUrls: false
  touchesSupabaseCloud: false
  unlocksBetaOrProduction: false
}

export const EXTERNAL_AGENT_TOOL_NEXT_COMMAND = {
  decision: 'external_agent_live_next_command_read_only_decision_defined',
  mode: 'read_only_external_agent_tool_next_command_decision',
  defaultDecision: 'external_agent_execution_no_go_runtime_blocked',
  paidProductionInScope: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  accountSelection: {
    overrideEnv: 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT',
    overrideIndexEnv: 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX',
    overrideIndexCliFlag: '--account-index',
    overrideIndexCliFlagAlias: '--gcloud-account-index',
    mapsToCloudSdkCoreAccount: true,
    mutatesLocalGcloudConfig: false,
    printsAccountValue: false,
    tokenStdoutSuppressed: true,
  },
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
    {
      id: 'gcloud_account_access_diagnostic',
      script: 'server/cli/external-agent-gcloud-account-access-diagnostic.ts',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'read local gcloud account token refresh and ReEditPro read-access status across redacted local accounts',
    },
  ] satisfies ExternalAgentToolNextCommandAllowedProbe[],
  nextCommandRules: {
    whenExecutionGateAllowsRuntime: EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
    whenStaticGateAllowsButQwenLivePreflightFails: 'npm run external-agent-tool-blockers:preflight',
    whenGcpReadAccessRepairRequired: 'npm run external-agent-gcp-access:repair-plan',
    whenQwenAuthRefreshFails: 'npm run external-agent-gcloud-session:diagnostic',
    whenQwenLivePreflightPassesButExecutionGateBlocked: QWEN2_5_VL_58DX_RESULT_REVIEW_PROMPT,
    whenQwenAuthClearsAndBrollQuotaBlocked: 'npm run external-agent-tool-execution-gate -- --require-go',
    whenBrollQuotaNeedsVerification: 'npm run ai-video-broll-wan-gpu-global-quota:verify',
    whenWanCacheNeedsStaticRefresh: 'npm run ai-video-broll-wan-fast-cache-readiness:check',
  },
  manualActionRules: {
    whenQwenAuthRefreshFails: {
      required: true,
      reason: 'gcloud_auth_refresh_required_before_downstream_probes',
      blocksRuntime: true,
      rerunAfterManualAction: 'npm run external-agent-tool-blockers:preflight',
    },
    whenQwenPermissionOrResourceReadFails: {
      required: true,
      reason: 'gcloud_account_or_resource_read_access_required_before_runtime',
      blocksRuntime: true,
      rerunAfterManualAction: 'npm run external-agent-tool-blockers:preflight',
    },
  },
  qwenBoundedExecutionCommand: {
    toolId: 'qwen2_5_vl_7b_instruct',
    command: 'npm',
    args: [
      'run',
      'qwen2-5-vl-58dw-bounded-private-inference-retry',
      '--',
      '--execute',
      '--json',
    ],
    confirmationEnv: 'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY',
    confirmationEnvRequiredValue: 'true',
    requiresLivePreflightPassed: true,
    requiresStaticExplicitToolGateReady: true,
    boundedApprovedFixtureOnly: true,
    createsGeneratedAssets: false,
    touchesSupabase: false,
    touchesSql: false,
    unlocksBetaOrProduction: false,
  } satisfies ExternalAgentToolQwenBoundedExecutionCommand,
  qwenExternalAgentExecutionCommand: {
    toolId: 'qwen2_5_vl_7b_instruct',
    command: 'npm',
    args: ['run', 'external-agent-tool-execute-qwen', '--', '--execute', '--json'],
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION',
    confirmationEnvRequiredValue: 'true',
    verifiesLiveNextCommandBeforeDelegating: true,
    delegatesToBoundedCommand: true,
    boundedApprovedFixtureOnly: true,
    createsGeneratedAssets: false,
    touchesSupabase: false,
    touchesSql: false,
    unlocksBetaOrProduction: false,
  } satisfies ExternalAgentToolQwenExternalAgentExecutionCommand,
  brollWanExternalAgentProofCommand: {
    toolId: 'ai_video_broll_generation_wan',
    command: 'npm',
    args: ['run', 'external-agent-tool-execute-broll-wan', '--', '--execute', '--json'],
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF',
    confirmationEnvRequiredValue: 'true',
    verifiesLiveQuotaBeforeAnyVmAction: true,
    verifiesPrivateCacheBeforeAnyVmAction: true,
    requiresNoIdleLifecycleGate: true,
    blocksWhenGpusAllRegionsQuotaInsufficient: true,
    createsComputeVm: true,
    deletesComputeVmAndVerifiesCleanup: true,
    dependencyInstallOnly: false,
    modelImportLoadProofOnly: true,
    runsModel: true,
    runsModelInference: false,
    createsGeneratedAssets: false,
    touchesSupabase: false,
    touchesSql: false,
    unlocksBetaOrProduction: false,
  } satisfies ExternalAgentToolBrollWanExternalAgentProofCommand,
  brollWanInferenceProofCommand: {
    toolId: 'ai_video_broll_generation_wan',
    command: 'npm',
    args: ['run', 'external-agent-tool-execute-broll-wan', '--', '--inference-proof', '--execute', '--json'],
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF',
    confirmationEnvRequiredValue: 'true',
    delegatesTo11hRunner: true,
    executionRequiresSeparatePrompt: false,
    requiresNoIdleLifecycleGate: true,
    createsComputeVm: true,
    deletesComputeVmAndVerifiesCleanup: true,
    runsModel: true,
    runsModelInference: true,
    outputType: 'latent',
    persistsInferenceOutput: false,
    createsVideoFrames: false,
    encodesVideo: false,
    createsGeneratedAssets: false,
    touchesSupabase: false,
    touchesSql: false,
    unlocksBetaOrProduction: false,
  } satisfies ExternalAgentToolBrollWanInferenceProofCommand,
  brollWanPrivateCachePrepareCommand: {
    toolId: 'ai_video_broll_generation_wan',
    command: 'npm',
    args: ['run', 'external-agent-tool-prepare-broll-wan-cache', '--', '--execute', '--json'],
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_CACHE_FILL',
    confirmationEnvRequiredValue: 'true',
    delegatesTo11eCloudSideCacheStagingRunner: true,
    stagesPrivateGcsModelCacheOnly: true,
    createsCloudRunJob: true,
    deletesCloudRunJobAndVerifiesCleanup: true,
    createsComputeVm: false,
    runsModel: false,
    runsModelInference: false,
    createsGeneratedAssets: false,
    touchesSupabase: false,
    touchesSql: false,
    unlocksBetaOrProduction: false,
  } satisfies ExternalAgentToolBrollWanPrivateCachePrepareCommand,
  soundMusicAudioEvidenceCommand: {
    toolId: 'sound_music_audio',
    command: 'npm',
    args: ['run', 'external-agent-tool-execute-sound', '--', '--execute', '--json'],
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW',
    confirmationEnvRequiredValue: 'true',
    verifiesSoundOssArchiveDiagnosticsBeforeAnyRuntime: true,
    verifiesSoundRuntimeRouteSourceDiagnosticsBeforeAnyRuntime: true,
    safeEvidenceReviewExecutableNow: true,
    runtimeExecutionAllowedNow: false,
    blocksRealProviderWorkerStorageExport: true,
    runsProvider: false,
    dispatchesWorker: false,
    runsMediaProcessing: false,
    createsGeneratedAudio: false,
    createsGeneratedAssets: false,
    touchesSupabase: false,
    touchesSql: false,
    unlocksBetaOrProduction: false,
  } satisfies ExternalAgentToolSoundMusicAudioEvidenceCommand,
  supabaseLocalHarnessEvidenceCommand: {
    toolId: 'supabase_local_fixture_harness',
    command: 'npm',
    args: ['run', 'external-agent-tool-execute-supabase-harness', '--', '--execute', '--json'],
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW',
    confirmationEnvRequiredValue: 'true',
    verifiesLocalConfigBeforeAnyRuntime: true,
    verifiesLocalHarnessRetryEvidenceBeforeAnyRuntime: true,
    safeEvidenceReviewExecutableNow: true,
    runtimeExecutionAllowedNow: false,
    blocksLiveSupabaseMutation: true,
    runsSupabaseCli: false,
    runsDocker: false,
    executesSql: false,
    createsRows: false,
    createsStorageObjects: false,
    createsSignedUrls: false,
    touchesSupabaseCloud: false,
    unlocksBetaOrProduction: false,
  } satisfies ExternalAgentToolSupabaseHarnessEvidenceCommand,
  forbiddenRuntimeActions: [
    'do not invoke Cloud Run without the explicit Qwen tool gate and live preflight',
    'do not execute Cloud Run jobs without the explicit Qwen tool gate and live preflight',
    'do not create Compute Engine VMs except the bounded B-roll no-idle proof VM through the explicit wrapper gate',
    'do not request quota',
    'do not run Docker',
    'do not import models outside the bounded approved-fixture Qwen gate',
    'do not run inference outside the bounded approved-fixture Qwen gate',
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
