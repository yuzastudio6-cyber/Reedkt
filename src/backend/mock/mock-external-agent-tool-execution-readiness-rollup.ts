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
  targetRegion: 'us-central1'
  targetZone: 'us-central1-b'
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

export const EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP = {
  decision:
    'external_agent_tool_execution_readiness_qwen_ready_for_explicit_gate_broll_quota_verified_no_idle_prompt_prepared',
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
        'controlled_l4_private_proof_quota_verified_no_idle_prompt_prepared_after_private_cache_runner_fast_cache_readiness',
      selectedModelOrTool: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
      selectedGpu: 'nvidia_l4',
      scaleToZeroRequired: true,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker: 'bounded_no_idle_l4_lifecycle_execute_prompt_required_before_vm_or_inference',
      evidence: [
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
        'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts',
        'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
        'server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts',
        'server/cli/external-agent-tool-blocker-preflight.ts',
        'server/smoke/ai-video-broll-wan-external-agent-wrapper-blocked-result-smoke.ts',
        'server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts',
        'server/smoke/ai-video-broll-wan-gpu-global-quota-verify-smoke.ts',
        'server/smoke/ai-video-broll-gen-9k-no-idle-l4-proof-prompt-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md',
        'server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
        'server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py',
      ],
      nextAction: AI_VIDEO_BROLL_GEN_9L_NO_IDLE_L4_PROOF_EXECUTE_PROMPT,
      manualBlockerActions: [],
      noIdleLifecycleGate: {
        proofVmName: 'reeditpro-ai-broll-wan-l4-proof',
        selectedGpu: 'nvidia_l4',
        machineType: 'g2-standard-4',
        targetRegion: 'us-central1',
        targetZone: 'us-central1-b',
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
        nextActionAfterQuotaClears: AI_VIDEO_BROLL_GEN_9L_NO_IDLE_L4_PROOF_EXECUTE_PROMPT,
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
  recommendedNextPrompt: AI_VIDEO_BROLL_GEN_9L_NO_IDLE_L4_PROOF_EXECUTE_PROMPT,
} as const

export type ExternalAgentToolExecutionReadinessRollup =
  typeof EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
