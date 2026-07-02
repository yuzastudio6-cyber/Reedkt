import {
  EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
  EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP,
  type ExternalAgentToolNoIdleLifecycleGate,
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
    'npm run ai-video-broll-wan-gpu-global-quota:verify',
    'npm run external-agent-tool-execute-broll-wan',
    'npm run external-agent-tool-execute-sound',
    'npm run external-agent-tool-execute-supabase-harness',
  ],
  toolRows: [
    {
      toolId: 'qwen2_5_vl_7b_instruct',
      executionAllowedNow: false,
      staticExplicitToolGateReady: true,
      requiredBeforeExecution: [
        '58DW bounded retry result must remain recorded as schema-invalid runtime evidence',
        '58DW structured-output fix must remain recorded and locally validated',
        '58DW-RETRY-2 bounded runtime result must remain recorded as passed evidence',
        '58DX result review must remain recorded and accepted for the explicit external-agent gate',
        'bounded approved-fixture private inference retry plan must remain recorded',
        'bounded approved-fixture private inference retry gate must remain recorded and passed',
        'bounded approved-fixture private inference retry attempt approval must remain recorded',
        'bounded approved-fixture private inference retry attempt result must remain recorded as historical blocked evidence',
        'private inference gate alignment must remain recorded and accepted',
        'approved fixture private inference attempt must remain bounded and fail-closed',
        'live read-only auth/service/job preflight must pass immediately before any bounded runtime attempt',
      ],
      currentBlocker: 'live_preflight_required_before_runtime',
      safeNextCommand: 'npm run external-agent-tool-next-command',
    },
    {
      toolId: 'ai_video_broll_generation_wan',
      executionAllowedNow: false,
      requiredBeforeExecution: [
        'auth-readable live preflight must verify GPUS_ALL_REGIONS quota at or above 1',
        'auth-readable live preflight must verify regional NVIDIA_L4 quota at or above 1',
        'Wan private cache readiness must pass without model import or inference',
        '9K no-idle proof prompt must remain recorded and validated before any VM lifecycle action',
        '9L lifecycle proof result must remain recorded as blocked by us-central1-b L4 resource pool exhaustion with cleanup verified',
        '9L stockout fix result must remain recorded with us-central1-a selected as the next no-idle retry target',
        '9M lifecycle proof result must remain recorded as blocked by us-central1-a L4 resource pool exhaustion with cleanup verified',
        '9N lifecycle proof result must remain recorded as passed in us-central1-c with cleanup verified',
        '9O IAP wheelhouse transfer proof result must remain recorded as blocked by us-central1-c resource pool exhaustion before VM creation with cleanup verified',
        '9O retry IAP wheelhouse transfer proof result must remain recorded as blocked by repeated us-central1-c resource pool exhaustion before VM creation with cleanup verified',
        '9P stockout fix result must remain recorded with us-west1-a selected as the next no-idle IAP wheelhouse transfer proof target',
        '9Q us-west1-a transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '9R stockout fix result must remain recorded with us-west1-b selected as the next no-idle IAP wheelhouse transfer proof target',
        '9S us-west1-b transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '9T stockout fix result must remain recorded with us-west1-c selected as the next no-idle IAP wheelhouse transfer proof target',
        '9U us-west1-c transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '9V stockout fix result must remain recorded with us-east4-a selected as the next bounded no-idle IAP wheelhouse transfer proof target',
        '9W us-east4-a transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '9X stockout fix result must remain recorded with us-east4-c selected as the next bounded no-idle IAP wheelhouse transfer proof target',
        '9Y us-east4-c transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '9Z stockout fix result must remain recorded with us-east1-b selected as the next bounded no-idle IAP wheelhouse transfer proof target',
        '10A us-east1-b transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '10B stockout fix result must remain recorded with us-east1-c selected as the next bounded no-idle IAP wheelhouse transfer proof target',
        '10C us-east1-c transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '10D stockout fix result must remain recorded with us-east1-d selected as the next bounded no-idle IAP wheelhouse transfer proof target',
        '10E us-east1-d transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '10F stockout fix result must remain recorded with us-west4-a selected as the next bounded no-idle IAP wheelhouse transfer proof target',
        '10G us-west4-a transfer proof result must remain recorded as blocked by resource pool exhaustion before VM creation with cleanup verified',
        '10H stockout fix result must remain recorded with us-west4-c selected as the next bounded no-idle IAP wheelhouse transfer proof target',
        '10I us-west4-c transfer proof result must remain recorded as passed with IAP manifest transfer, remote readability, and cleanup verified',
        'controlled GPU proof must use the future 10J bounded payload/install readiness prompt before full wheelhouse payload transfer, dependency install, model import, or inference',
        'controlled L4 proof must be no-idle: no public IP, prompt-scoped VM only, delete VM and verify cleanup before completion',
      ],
      currentBlocker:
        'bounded_no_idle_l4_iap_wheelhouse_payload_install_proof_us_west4_c_future_prompt_required',
      safeNextCommand:
        'npm run smoke:ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result',
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
      safeNextCommand: 'npm run external-agent-tool-execute-sound',
    },
    {
      toolId: 'supabase_local_fixture_harness',
      executionAllowedNow: false,
      requiredBeforeExecution: [
        'must be handled only by a dedicated Supabase local harness prompt',
        'must not mutate live Supabase from the external-agent tool rollup',
      ],
      currentBlocker: 'not_a_model_or_media_execution_lane_on_this_branch',
      safeNextCommand: 'npm run external-agent-tool-execute-supabase-harness',
    },
  ] satisfies ExternalAgentToolExecutionGateRow[],
  forbiddenRuntimeActions: [
    'do not invoke Cloud Run without the explicit Qwen tool gate and live preflight',
    'do not execute Cloud Run jobs without the explicit Qwen tool gate and live preflight',
    'do not create Compute Engine VMs',
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
  runtimeSideEffects: ROLLUP.runtimeSideEffects,
  recommendedNextPrompt: EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
} as const

export type ExternalAgentToolExecutionGate = typeof EXTERNAL_AGENT_TOOL_EXECUTION_GATE
