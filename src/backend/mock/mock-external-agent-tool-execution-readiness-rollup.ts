export type ExternalAgentToolReadinessStatus =
  | 'blocked_external_state'
  | 'auth_verified_runtime_blocked'
  | 'ready_for_explicit_tool_gate'
  | 'metadata_only'
  | 'supporting_evidence_only'

export type ExternalAgentToolReadinessEntry = {
  toolId: string
  lane: string
  status: ExternalAgentToolReadinessStatus
  currentStage: string
  selectedModelOrTool: string
  selectedGpu: 'nvidia_l4' | 'not_applicable'
  scaleToZeroRequired: boolean
  readyForExternalAgentExecutionNow: boolean
  readyForBoundedRetryAfterBlockerClears: boolean
  primaryBlocker: string
  evidence: string[]
  nextAction: string
  manualBlockerActions?: ExternalAgentManualBlockerAction[]
  noIdleLifecycleGate?: ExternalAgentToolNoIdleLifecycleGate
}

export type ExternalAgentManualBlockerAction = {
  id: string
  label: string
  runInsideCodex: false
  mutatesRuntime: false
  runsModel: false
  createsAssets: false
  mutatesCloud: boolean
  mutatesLocalGcloudAuth: boolean
  mutatesLocalGcloudConfig: boolean
  changesQuotaRequest: boolean
  purpose: string
  afterCompletionCommand: string
}

export type ExternalAgentToolNoIdleLifecycleGate = {
  proofVmName: string
  selectedGpu: 'nvidia_l4'
  machineType: 'g2-standard-4'
  targetRegion: 'us-central1' | 'us-west1' | 'us-east4' | 'us-east1' | 'us-west4'
  targetZone:
    | 'us-central1-a'
    | 'us-central1-b'
    | 'us-central1-c'
    | 'us-west1-a'
    | 'us-west1-b'
    | 'us-west1-c'
    | 'us-east4-a'
    | 'us-east4-c'
    | 'us-east1-b'
    | 'us-east1-c'
    | 'us-east1-d'
    | 'us-west4-a'
    | 'us-west4-c'
  minimumGlobalGpusAllRegionsQuota: 1
  minimumRegionalL4Quota: 1
  noPublicIpRequired: true
  externalIpAllowed: false
  bootDiskAutoDeleteRequired: true
  preExistingResourceCheckRequired: true
  deleteOnlyResourcesCreatedByPrompt: true
  cleanupVerificationRequired: true
  idleGpuAllowed: false
  vmCreateAllowedNow: false
  modelInferenceAllowedNow: false
  runtimePromptRequiredBeforeVmCreate: true
  cacheReadinessCommand: 'npm run ai-video-broll-wan-fast-cache-readiness:check'
  quotaVerificationCommand: 'npm run ai-video-broll-wan-gpu-global-quota:verify'
  nextActionAfterQuotaClears: string
}

export type ExternalAgentToolSafeNextCommand = {
  id: string
  command: string
  liveReadOnly: boolean
  mutatesRuntime: false
  runsModel: false
  createsAssets: false
  purpose: string
}

export const QWEN2_5_VL_58DW_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-PRIVATE-INFERENCE-BOUNDED-RETRY-PROMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation' as const
export const QWEN2_5_VL_58DW_FIX_STRUCTURED_OUTPUT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-FIX: tighten Qwen fixture structured-output generation after schema-invalid bounded retry, no generated assets/no mutation' as const
export const QWEN2_5_VL_58DW_RETRY_2_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-RETRY-2: run one bounded approved-fixture private inference retry after strict structured-output fix, no generated assets/no mutation' as const
export const QWEN2_5_VL_58DX_RESULT_REVIEW_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DX-PRIVATE-INFERENCE-RESULT-REVIEW: review bounded Qwen private inference retry metadata, no generated assets/no beta' as const
export const EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT =
  'EXTERNAL-AGENT-TOOL-EXECUTION-READY-QWEN: Qwen controlled approved-fixture private inference is ready for the explicit external-agent gate; keep beta/production blocked' as const
export const QWEN2_5_VL_58DQ_AUTH_USER_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight' as const
export const AI_VIDEO_BROLL_GEN_9K_NO_IDLE_L4_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-9K-NO-IDLE-L4-PROOF-PROMPT: prepare bounded no-idle L4 proof execution with mandatory cleanup, no VM/no inference in the planning prompt' as const
export const AI_VIDEO_BROLL_GEN_9L_NO_IDLE_L4_PROOF_EXECUTE_PROMPT =
  'AI-VIDEO-BROLL-GEN-9L-NO-IDLE-L4-PROOF-EXECUTE: run bounded no-idle L4 VM lifecycle proof with mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9L_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9L-STOCKOUT-FIX: choose approved alternate no-idle L4 proof zone or retry plan, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9M_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-9M-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-A: run bounded no-idle L4 VM lifecycle proof in us-central1-a with mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9N_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-9N-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-C: run bounded no-idle L4 VM lifecycle proof in us-central1-c with mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9O_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-9O-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9O_RETRY_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-9O-RETRY-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: retry bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-central1-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9P_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9P-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose approved alternate no-idle L4 transfer proof zone or capacity strategy, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9Q_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Q-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-a and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9R_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9R-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-a stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9S_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_B_PROMPT =
  'AI-VIDEO-BROLL-GEN-9S-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-b and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9T_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9T-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-b stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9U_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-9U-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9V_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9V-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west1-c stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9W_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-9W-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-a and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9X_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9X-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-a stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9Y_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Y-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9Z_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Z-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-c stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10A_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST1_B_PROMPT =
  'AI-VIDEO-BROLL-GEN-10A-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-b and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10B_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10B-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-b stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10C_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST1_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-10C-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10D_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10D-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-c stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10E_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST1_D_PROMPT =
  'AI-VIDEO-BROLL-GEN-10E-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-D: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-d and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10F_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10F-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-d stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10G_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-10G-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-a and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10H_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west4-a stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10I_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-10I-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10J_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_US_WEST4_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-10J-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-US-WEST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in us-west4-c with mandatory cleanup, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10K-PAYLOAD-INSTALL-STOCKOUT-FIX: choose next approved no-idle L4 payload/install-readiness proof capacity strategy after us-west4-c stockout, no VM/no inference' as const

export const EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP = {
  decision:
    'external_agent_tool_execution_readiness_qwen_ready_for_explicit_gate_broll_10j_payload_install_stockout_10k_strategy_required',
  mode: 'external_agent_tool_execution_readiness_rollup_only',
  paidProductionInScope: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  runtimeSideEffects: {
    modelInferenceRun: false,
    generatedVideoCreated: false,
    generatedAudioCreated: false,
    generatedAssetsCreated: false,
    cloudRunServiceMutated: false,
    cloudRunJobExecuted: false,
    computeVmCreated: false,
    dockerRun: false,
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
  sourceRules: {
    approvedSnapshotRequired: true,
    rawChatExecutionAllowed: false,
    aiVideoOwnsFinalCanvas: false,
    remotionOwnsFinalComposition: true,
    paidProductionReady: false,
  },
  safeNextCommands: [
    {
      id: 'static_action_plan',
      command: 'npm run external-agent-tool-action-plan',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Static ordered action plan for external agents, including per-tool safe actions, blockers, and forbidden runtime actions.',
    },
    {
      id: 'static_readiness_check',
      command: 'npm run external-agent-tool-readiness:check',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose: 'Fast static readiness and evidence presence check for all tracked external-agent tool lanes.',
    },
    {
      id: 'surface_consistency_smoke',
      command: 'npm run smoke:external-agent-tool-surface-consistency',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only smoke that compares external-agent readiness surfaces for shared manual blockers, fail-closed gates, and drift.',
    },
    {
      id: 'fail_closed_execution_gate',
      command: 'npm run external-agent-tool-execution-gate',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed static go/no-go gate for external agents before any runtime execution attempt.',
    },
    {
      id: 'live_next_command_decision',
      command: 'npm run external-agent-tool-next-command',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only live decision that combines the fail-closed gate and blocker probes into the next safe command.',
    },
    {
      id: 'live_blocker_preflight',
      command: 'npm run external-agent-tool-blockers:preflight',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only live preflight to see whether Qwen gcloud auth/service/job visibility and B-roll GPU quota blockers have cleared.',
    },
    {
      id: 'broll_gpu_global_quota_verify',
      command: 'npm run ai-video-broll-wan-gpu-global-quota:verify',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'B-roll-specific read-only verifier for GPUS_ALL_REGIONS and regional L4 quota after the manual quota request path.',
    },
    {
      id: 'gcloud_session_diagnostic',
      command: 'npm run external-agent-gcloud-session:diagnostic',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only local gcloud session diagnostic for auth/config mismatches when refreshed auth is not visible to this shell.',
    },
    {
      id: 'broll_fast_cache_readiness',
      command: 'npm run ai-video-broll-wan-fast-cache-readiness:check',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Stat-only Wan private cache layout check that avoids 29GB hashing, model imports, GPU work, and inference.',
    },
    {
      id: 'broll_wan_external_agent_wrapper_static_guard',
      command: 'npm run external-agent-tool-execute-broll-wan',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed B-roll Wan wrapper static guard; execution mode only runs read-only quota/cache checks and blocks before VM or model work.',
    },
    {
      id: 'sound_music_audio_external_agent_wrapper_static_guard',
      command: 'npm run external-agent-tool-execute-sound',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed Sound/Music/Audio wrapper static guard; execution mode only runs static evidence diagnostics and blocks before provider, worker, storage, or media work.',
    },
    {
      id: 'supabase_local_harness_external_agent_wrapper_static_guard',
      command: 'npm run external-agent-tool-execute-supabase-harness',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed Supabase local harness wrapper static guard; execution mode only runs no-execution config and local-harness evidence smokes before blocking live mutation.',
    },
  ] satisfies ExternalAgentToolSafeNextCommand[],
  tools: [
    {
      toolId: 'qwen2_5_vl_7b_instruct',
      lane: 'video_understanding_vlm',
      status: 'ready_for_explicit_tool_gate',
      currentStage:
        'controlled_persisted_worker_dispatch_runtime_external_agent_wrapper_rerun_result_recorded',
      selectedModelOrTool: 'Qwen/Qwen2.5-VL-7B-Instruct',
      selectedGpu: 'nvidia_l4',
      scaleToZeroRequired: true,
      readyForExternalAgentExecutionNow: true,
      readyForBoundedRetryAfterBlockerClears: true,
      primaryBlocker: 'none_explicit_gate_ready_live_preflight_required',
      evidence: [
        'docs/qwen2-5-vl-7b-58ea-external-agent-wrapper-execution-result.md',
        'docs/qwen2-5-vl-7b-58dz-external-agent-wrapper-rerun-result.md',
        'docs/external-agent-tool-live-next-command-result.md',
        'docs/qwen2-5-vl-7b-58dy-external-agent-wrapper-execution-result.md',
        'docs/qwen2-5-vl-7b-58dx-private-inference-result-review.md',
        'docs/qwen2-5-vl-7b-58dw-retry-2-result.md',
        'docs/qwen2-5-vl-7b-58dw-structured-output-fix.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md',
        'src/backend/mock/mock-qwen2-5-vl-58ea-external-agent-wrapper-execution-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dz-external-agent-wrapper-rerun-result.ts',
        'src/backend/mock/mock-external-agent-tool-live-next-command-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dy-external-agent-wrapper-execution-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dx-private-inference-result-review.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dw-retry-2-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dw-structured-output-fix.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts',
        'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
        'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts',
        'src/backend/mock/mock-external-agent-gcloud-session-diagnostic.ts',
        'server/cli/external-agent-tool-blocker-preflight.ts',
        'server/cli/external-agent-gcloud-session-diagnostic.ts',
        'server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
        'server/smoke/external-agent-gcloud-session-diagnostic-smoke.ts',
        'server/smoke/qwen2-5-vl-58ea-external-agent-wrapper-execution-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dz-external-agent-wrapper-rerun-result-smoke.ts',
        'server/smoke/external-agent-tool-live-next-command-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dy-external-agent-wrapper-execution-result-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dx-private-inference-result-review-smoke.ts',
        'server/smoke/qwen2-5-vl-58dw-retry-2-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dw-structured-output-fix-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result-smoke.ts',
        'pull_request_1914_open_draft_clean',
      ],
      nextAction: EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
      manualBlockerActions: [],
    },
    {
      toolId: 'ai_video_broll_generation_wan',
      lane: 'open_source_generated_broll',
      status: 'auth_verified_runtime_blocked',
      currentStage:
        'controlled_l4_no_idle_payload_install_proof_us_west4_c_stockout_before_vm_cleanup_verified_10k_strategy_required',
      selectedModelOrTool: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
      selectedGpu: 'nvidia_l4',
      scaleToZeroRequired: true,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker:
        'bounded_no_idle_l4_payload_install_proof_us_west4_c_stockout_10k_strategy_required',
      evidence: [
        'docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md',
        'docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md',
        'docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md',
        'docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.md',
        'docs/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md',
        'docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md',
        'docs/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.md',
        'docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md',
        'docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md',
        'docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md',
        'docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md',
        'docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
        'docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
        'docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md',
        'docs/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.md',
        'docs/ai-video-broll-gen-9l-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10k-payload-install-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9n-no-idle-l4-proof-execute-us-central1-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9m-no-idle-l4-proof-execute-us-central1-a.md',
        'docs/ai-video-broll-wan-gpu-global-quota-verify-result.md',
        'docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md',
        'docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md',
        'docs/ai-video-broll-generation-gpu-global-quota-fix-result.md',
        'docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md',
        'docs/ai-video-broll-generation-gcp-private-cache-validate-result.md',
        'docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md',
        'src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-blocked-result.ts',
        'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
        'src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify.ts',
        'src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9k-no-idle-l4-proof-prompt.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9l-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.ts',
        'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts',
        'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
        'server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts',
        'server/cli/external-agent-tool-blocker-preflight.ts',
        'server/smoke/ai-video-broll-wan-external-agent-wrapper-blocked-result-smoke.ts',
        'server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts',
        'server/smoke/ai-video-broll-wan-gpu-global-quota-verify-smoke.ts',
        'server/smoke/ai-video-broll-gen-9k-no-idle-l4-proof-prompt-smoke.ts',
        'server/smoke/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9l-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md',
        'server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
        'server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py',
      ],
      nextAction: AI_VIDEO_BROLL_GEN_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_PROMPT,
      manualBlockerActions: [],
      noIdleLifecycleGate: {
        proofVmName: 'reeditpro-ai-broll-wan-l4-proof',
        selectedGpu: 'nvidia_l4',
        machineType: 'g2-standard-4',
        targetRegion: 'us-west4',
        targetZone: 'us-west4-c',
        minimumGlobalGpusAllRegionsQuota: 1,
        minimumRegionalL4Quota: 1,
        noPublicIpRequired: true,
        externalIpAllowed: false,
        bootDiskAutoDeleteRequired: true,
        preExistingResourceCheckRequired: true,
        deleteOnlyResourcesCreatedByPrompt: true,
        cleanupVerificationRequired: true,
        idleGpuAllowed: false,
        vmCreateAllowedNow: false,
        modelInferenceAllowedNow: false,
        runtimePromptRequiredBeforeVmCreate: true,
        cacheReadinessCommand: 'npm run ai-video-broll-wan-fast-cache-readiness:check',
        quotaVerificationCommand: 'npm run ai-video-broll-wan-gpu-global-quota:verify',
        nextActionAfterQuotaClears:
          AI_VIDEO_BROLL_GEN_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_PROMPT,
      },
    },
    {
      toolId: 'sound_music_audio',
      lane: 'sound_music_audio_planning',
      status: 'metadata_only',
      currentStage: 'mock_dry_run_local_fixture_handoff_evidence_external_agent_wrapper_blocked_result_recorded',
      selectedModelOrTool: 'planning_metadata_only',
      selectedGpu: 'not_applicable',
      scaleToZeroRequired: false,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker: 'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
      evidence: [
        'docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md',
        'docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md',
        'docs/sound-oss-tools-15-post-archive-handoff-review.md',
        'docs/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result.md',
        'docs/sound-music-audio-external-agent-wrapper-blocked-result.md',
        'src/backend/mock/mock-sound-music-audio-external-agent-wrapper-blocked-result.ts',
        'server/smoke/sound-music-audio-external-agent-wrapper-blocked-result-smoke.ts',
        'server/cli/external-agent-tool-execute-sound.ts',
        'server/smoke/external-agent-tool-execute-sound-smoke.ts',
      ],
      nextAction: 'continue only after runtime owner evidence accepts real execution paths',
    },
    {
      toolId: 'supabase_local_fixture_harness',
      lane: 'source_of_truth_and_private_artifact_support',
      status: 'supporting_evidence_only',
      currentStage: 'supporting_local_fixture_harness_evidence_external_agent_wrapper_blocked_result_recorded',
      selectedModelOrTool: 'not_applicable',
      selectedGpu: 'not_applicable',
      scaleToZeroRequired: false,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker: 'not_a_model_or_media_execution_lane_on_this_branch',
      evidence: [
        'approved_snapshot_private_path_manifest_checksum_policy_referenced_by_tool_rollups',
        'supabase/config.toml',
        'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
        'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
        'docs/supabase-local-harness-external-agent-wrapper-blocked-result.md',
        'src/backend/mock/mock-supabase-local-harness-external-agent-wrapper-blocked-result.ts',
        'server/smoke/supabase-local-harness-external-agent-wrapper-blocked-result-smoke.ts',
        'server/cli/external-agent-tool-execute-supabase-harness.ts',
        'server/smoke/external-agent-tool-execute-supabase-harness-smoke.ts',
      ],
      nextAction: 'use as source-of-truth evidence only; do not mutate live Supabase from this rollup',
    },
  ] satisfies ExternalAgentToolReadinessEntry[],
  recommendedNextPrompt: AI_VIDEO_BROLL_GEN_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_PROMPT,
} as const

export type ExternalAgentToolExecutionReadinessRollup =
  typeof EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
