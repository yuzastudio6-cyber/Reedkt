import {
  EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP,
  type ExternalAgentToolNoIdleLifecycleGate,
  QWEN2_5_VL_58DW_FIX_STRUCTURED_OUTPUT_PROMPT,
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
  noIdleLifecycleGate?: ExternalAgentToolNoIdleLifecycleGate
}

const ROLLUP = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
const BROLL_NO_IDLE_LIFECYCLE_GATE = ROLLUP.tools.find(
  (tool) => tool.toolId === 'ai_video_broll_generation_wan',
)?.noIdleLifecycleGate as ExternalAgentToolNoIdleLifecycleGate

export const EXTERNAL_AGENT_TOOL_EXECUTION_GATE = {
  decision: 'external_agent_execution_no_go_runtime_blocked' satisfies ExternalAgentToolExecutionGateDecision,
  mode: 'fail_closed_external_agent_tool_execution_gate',
  sourceRollupDecision: ROLLUP.decision,
  paidProductionInScope: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  requiresApprovedSnapshotBeforeExecution: true,
  requiresStructuredToolEnvelopeBeforeExecution: true,
  rawChatExecutionAllowed: false,
  readyForAnyExternalAgentExecutionNow: false,
  staticExplicitToolGateReady: false,
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
      staticExplicitToolGateReady: false,
      requiredBeforeExecution: [
        '58DW bounded retry result must remain recorded as schema-invalid runtime evidence',
        'Qwen structured-output generation must be tightened before another runtime attempt',
        'no second bounded runtime retry may run until the 58DW-FIX prompt updates and validates schema constraints',
        'bounded approved-fixture private inference retry plan must remain recorded',
        'bounded approved-fixture private inference retry gate must remain recorded and passed',
        'bounded approved-fixture private inference retry attempt approval must remain recorded',
        'bounded approved-fixture private inference retry attempt result must remain recorded as historical blocked evidence',
        'private inference gate alignment must remain recorded and accepted',
        'approved fixture private inference attempt must remain bounded and fail-closed',
      ],
      currentBlocker: 'structured_metadata_schema_invalid_after_bounded_58dw_retry',
      safeNextCommand: QWEN2_5_VL_58DW_FIX_STRUCTURED_OUTPUT_PROMPT,
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
      noIdleLifecycleGate: BROLL_NO_IDLE_LIFECYCLE_GATE,
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
    'do not invoke Cloud Run until the 58DW-FIX structured-output prompt has been implemented and approved for a new bounded retry',
    'do not execute Cloud Run jobs until the 58DW-FIX structured-output prompt has been implemented and approved for a new bounded retry',
    'do not create Compute Engine VMs',
    'do not request quota',
    'do not run Docker',
    'do not import models until the 58DW-FIX structured-output prompt has been implemented and approved for a new bounded retry',
    'do not run inference until the 58DW-FIX structured-output prompt has been implemented and approved for a new bounded retry',
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
