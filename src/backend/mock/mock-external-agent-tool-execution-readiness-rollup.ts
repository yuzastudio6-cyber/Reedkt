export type ExternalAgentToolReadinessStatus =
  | 'blocked_external_state'
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

export const EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP = {
  decision: 'external_agent_tool_execution_readiness_partial_blocked_qwen_auth_and_broll_quota',
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
  ] satisfies ExternalAgentToolSafeNextCommand[],
  tools: [
    {
      toolId: 'qwen2_5_vl_7b_instruct',
      lane: 'video_understanding_vlm',
      status: 'blocked_external_state',
      currentStage:
        'controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_auth_refresh_result',
      selectedModelOrTool: 'Qwen/Qwen2.5-VL-7B-Instruct',
      selectedGpu: 'nvidia_l4',
      scaleToZeroRequired: true,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: true,
      primaryBlocker: 'local_gcloud_reauthentication_required',
      evidence: [
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md',
        'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
        'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts',
        'src/backend/mock/mock-external-agent-gcloud-session-diagnostic.ts',
        'server/cli/external-agent-tool-blocker-preflight.ts',
        'server/cli/external-agent-gcloud-session-diagnostic.ts',
        'server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
        'server/smoke/external-agent-gcloud-session-diagnostic-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result-smoke.ts',
        'pull_request_1914_open_draft_clean',
      ],
      nextAction:
        'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh local gcloud auth interactively outside Codex, no repo changes/no Cloud Run mutation/no inference/no generated assets/no beta',
    },
    {
      toolId: 'ai_video_broll_generation_wan',
      lane: 'open_source_generated_broll',
      status: 'blocked_external_state',
      currentStage:
        'controlled_l4_private_proof_quota_blocked_after_private_cache_runner_and_fast_cache_readiness_evidence',
      selectedModelOrTool: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
      selectedGpu: 'nvidia_l4',
      scaleToZeroRequired: true,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: true,
      primaryBlocker: 'gpus_all_regions_quota_zero',
      evidence: [
        'docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md',
        'docs/ai-video-broll-generation-gpu-global-quota-fix-result.md',
        'docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md',
        'docs/ai-video-broll-generation-gcp-private-cache-validate-result.md',
        'docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md',
        'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
        'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts',
        'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
        'server/cli/external-agent-tool-blocker-preflight.ts',
        'server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts',
        'server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
        'server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py',
      ],
      nextAction:
        'AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes',
    },
    {
      toolId: 'sound_music_audio',
      lane: 'sound_music_audio_planning',
      status: 'metadata_only',
      currentStage: 'mock_dry_run_local_fixture_handoff_evidence',
      selectedModelOrTool: 'planning_metadata_only',
      selectedGpu: 'not_applicable',
      scaleToZeroRequired: false,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker: 'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
      evidence: [
        'docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md',
        'docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md',
      ],
      nextAction: 'continue only after runtime owner evidence accepts real execution paths',
    },
    {
      toolId: 'supabase_local_fixture_harness',
      lane: 'source_of_truth_and_private_artifact_support',
      status: 'supporting_evidence_only',
      currentStage: 'supporting_local_fixture_harness_evidence_in_related_branches',
      selectedModelOrTool: 'not_applicable',
      selectedGpu: 'not_applicable',
      scaleToZeroRequired: false,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker: 'not_a_model_or_media_execution_lane_on_this_branch',
      evidence: ['approved_snapshot_private_path_manifest_checksum_policy_referenced_by_tool_rollups'],
      nextAction: 'use as source-of-truth evidence only; do not mutate live Supabase from this rollup',
    },
  ] satisfies ExternalAgentToolReadinessEntry[],
  recommendedNextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh local gcloud auth interactively outside Codex, no repo changes/no Cloud Run mutation/no inference/no generated assets/no beta',
} as const

export type ExternalAgentToolExecutionReadinessRollup =
  typeof EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
