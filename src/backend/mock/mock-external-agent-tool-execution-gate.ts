import {
  EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP,
  QWEN2_5_VL_58DQ_AUTH_USER_PROMPT,
} from './mock-external-agent-tool-execution-readiness-rollup'

export type ExternalAgentToolExecutionGateDecision =
  | 'external_agent_execution_no_go_runtime_blocked'
  | 'external_agent_execution_no_go_live_preflight_required'
  | 'external_agent_execution_go_after_explicit_tool_gate'

export type ExternalAgentToolExecutionGateRow = {
  toolId: string
  executionAllowedNow: boolean
  staticExplicitToolGateReady?: boolean
  requiredBeforeExecution: string[]
  currentBlocker: string
  safeNextCommand: string
}

const ROLLUP = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP

export const EXTERNAL_AGENT_TOOL_EXECUTION_GATE = {
  decision: 'external_agent_execution_no_go_live_preflight_required' satisfies ExternalAgentToolExecutionGateDecision,
  mode: 'fail_closed_external_agent_tool_execution_gate',
  sourceRollupDecision: ROLLUP.decision,
  paidProductionInScope: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  requiresApprovedSnapshotBeforeExecution: true,
  requiresStructuredToolEnvelopeBeforeExecution: true,
  rawChatExecutionAllowed: false,
  readyForAnyExternalAgentExecutionNow: false,
  staticExplicitToolGateReady: true,
  requiresLivePreflightBeforeRuntime: true,
  requireGoExitCodeWhenBlocked: 2,
  safeCommandsBeforeExecution: [
    'npm run external-agent-tool-action-plan',
    'npm run external-agent-tool-readiness:check',
    'npm run external-agent-tool-execution-gate',
    'npm run external-agent-tool-next-command',
    'npm run external-agent-tool-blockers:preflight',
    'npm run external-agent-gcloud-session:diagnostic',
    'npm run ai-video-broll-wan-fast-cache-readiness:check',
  ],
  toolRows: [
    {
      toolId: 'qwen2_5_vl_7b_instruct',
      executionAllowedNow: false,
      staticExplicitToolGateReady: true,
      requiredBeforeExecution: [
        'non-interactive gcloud token refresh must pass in this shell',
        'Cloud Run service and caller job visibility must remain verified via read-only describe',
        'bounded approved-fixture private inference retry plan must remain recorded',
        'bounded approved-fixture private inference retry gate must remain recorded and passed',
        'bounded approved-fixture private inference retry attempt approval must remain recorded',
        'bounded approved-fixture private inference retry attempt result must remain recorded as historical blocked evidence',
        'private inference gate alignment must remain recorded and accepted',
        'the exact 58DW bounded retry prompt must be used before any runtime action',
        '58DW must rerun live auth/service/job checks immediately before execution',
        '58DW must use approved fixture, persisted job, lease bridge, and private source-of-truth refs',
        'approved fixture private inference attempt must remain bounded and fail-closed',
      ],
      currentBlocker: 'local_gcloud_reauthentication_required_before_58dw_runtime',
      safeNextCommand: QWEN2_5_VL_58DQ_AUTH_USER_PROMPT,
    },
    {
      toolId: 'ai_video_broll_generation_wan',
      executionAllowedNow: false,
      requiredBeforeExecution: [
        'auth-readable live preflight must verify GPUS_ALL_REGIONS quota at or above 1',
        'auth-readable live preflight must verify regional NVIDIA_L4 quota at or above 1',
        'Wan private cache readiness must pass without model import or inference',
        'controlled GPU proof must use a future bounded execution gate',
        'controlled L4 proof must be no-idle: no public IP, prompt-scoped VM only, delete VM and verify cleanup before completion',
      ],
      currentBlocker: 'gpus_all_regions_quota_zero_or_unverified',
      safeNextCommand: 'npm run external-agent-tool-blockers:preflight',
    },
    {
      toolId: 'sound_music_audio',
      executionAllowedNow: false,
      requiredBeforeExecution: [
        'provider gateway handoff must accept real transport',
        'worker runtime must accept dispatch',
        'Supabase/storage/private artifact handoffs must accept mutation path',
        'Track A/B, QA, observability, and billing owners must accept real execution',
      ],
      currentBlocker: 'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
      safeNextCommand: 'inspect mock evidence only',
    },
    {
      toolId: 'supabase_local_fixture_harness',
      executionAllowedNow: false,
      requiredBeforeExecution: [
        'must be handled only by a dedicated Supabase local harness prompt',
        'must not mutate live Supabase from the external-agent tool rollup',
      ],
      currentBlocker: 'not_a_model_or_media_execution_lane_on_this_branch',
      safeNextCommand: 'use as source-of-truth evidence only',
    },
  ] satisfies ExternalAgentToolExecutionGateRow[],
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
  runtimeSideEffects: ROLLUP.runtimeSideEffects,
  recommendedNextPrompt: ROLLUP.recommendedNextPrompt,
} as const

export type ExternalAgentToolExecutionGate = typeof EXTERNAL_AGENT_TOOL_EXECUTION_GATE
