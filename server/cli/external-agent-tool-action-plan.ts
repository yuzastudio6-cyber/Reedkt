import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

type ExternalAgentManualBlockerAction = {
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

const forbiddenRuntimeActions = [
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
] as const

const externalAgentPreExecutionActions = [
  'npm run external-agent-tool-next-command',
  'npm run external-agent-tool-execution-gate',
] as const

function manualBlockerActionsForTool(toolId: string): ExternalAgentManualBlockerAction[] {
  if (toolId === 'qwen2_5_vl_7b_instruct') {
    return [
      {
        id: 'refresh_active_gcloud_login',
        label: 'Refresh the active local gcloud login outside Codex',
        runInsideCodex: false,
        mutatesRuntime: false,
        runsModel: false,
        createsAssets: false,
        mutatesCloud: false,
        mutatesLocalGcloudAuth: true,
        mutatesLocalGcloudConfig: false,
        changesQuotaRequest: false,
        purpose:
          'Make the same local gcloud account/configuration used by this shell able to refresh tokens before any Qwen service/job preflight can be trusted.',
        afterCompletionCommand: 'npm run external-agent-tool-blockers:preflight',
      },
      {
        id: 'select_authenticated_gcloud_account_if_needed',
        label: 'Select an already-authenticated gcloud account outside Codex if needed',
        runInsideCodex: false,
        mutatesRuntime: false,
        runsModel: false,
        createsAssets: false,
        mutatesCloud: false,
        mutatesLocalGcloudAuth: false,
        mutatesLocalGcloudConfig: true,
        changesQuotaRequest: false,
        purpose:
          'Align the local gcloud active account with the refreshed credentials when auth succeeded under a different local account.',
        afterCompletionCommand: 'npm run external-agent-tool-blockers:preflight',
      },
    ]
  }

  if (toolId === 'ai_video_broll_generation_wan') {
    return [
      {
        id: 'request_gpus_all_regions_quota_in_console',
        label: 'Request GPUS_ALL_REGIONS quota increase outside Codex',
        runInsideCodex: false,
        mutatesRuntime: false,
        runsModel: false,
        createsAssets: false,
        mutatesCloud: true,
        mutatesLocalGcloudAuth: false,
        mutatesLocalGcloudConfig: false,
        changesQuotaRequest: true,
        purpose:
          'Raise GPUS_ALL_REGIONS to at least 1 through the cloud owner/user path before any bounded no-idle L4 VM proof can be planned.',
        afterCompletionCommand: 'npm run external-agent-tool-blockers:preflight',
      },
    ]
  }

  return []
}

function actionForTool(toolId: string) {
  if (toolId === 'qwen2_5_vl_7b_instruct') {
    return {
      immediateSafeActions: [
        ...externalAgentPreExecutionActions,
        'npm run external-agent-tool-blockers:preflight',
      ],
      externalManualBlocker:
        'live Qwen auth/service/job preflight must clear before the bounded 58DW execution prompt; no direct or unbounded inference is allowed from this action plan',
      afterBlockerClears:
        'run npm run external-agent-tool-next-command again and only use the approved 58DW bounded retry prompt if that live selector returns it',
    }
  }

  if (toolId === 'ai_video_broll_generation_wan') {
    return {
      immediateSafeActions: [
        ...externalAgentPreExecutionActions,
        'npm run ai-video-broll-wan-fast-cache-readiness:check',
        'npm run external-agent-tool-blockers:preflight',
      ],
      externalManualBlocker:
        'request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console; do not create VMs or request quota from this repo',
      afterBlockerClears:
        'verify quota increase, then require bounded no-idle L4 proof cleanup before any inference path',
    }
  }

  if (toolId === 'sound_music_audio') {
    return {
      immediateSafeActions: [...externalAgentPreExecutionActions, 'inspect mock evidence only'],
      externalManualBlocker: 'runtime owner handoffs still required',
      afterBlockerClears: 'continue only after real provider, worker, storage, QA, billing, and export paths are accepted',
    }
  }

  return {
    immediateSafeActions: [...externalAgentPreExecutionActions, 'use as source-of-truth evidence only'],
    externalManualBlocker: 'not a model or media execution lane',
    afterBlockerClears: 'do not mutate live Supabase from this external-agent rollup',
  }
}

function main() {
  const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
  const readyTools = rollup.tools.filter((tool) => tool.readyForExternalAgentExecutionNow)
  const explicitToolGateReadyTools = rollup.tools.filter(
    (tool) => tool.status === 'ready_for_explicit_tool_gate',
  )
  const blockedTools = rollup.tools.filter((tool) => !tool.readyForExternalAgentExecutionNow)
  const runtimeGatesAllFalse = Object.values(rollup.runtimeSideEffects).every((value) => value === false)
  const preferredNextSafeCommand =
    rollup.safeNextCommands.find((command) => command.id === 'live_next_command_decision') ??
    rollup.safeNextCommands[0]

  const actionPlan = {
    ok: runtimeGatesAllFalse,
    mode: 'static_external_agent_tool_action_plan',
    decision: rollup.decision,
    paidProductionInScope: rollup.paidProductionInScope,
    dryRunPassedClaimed: rollup.dryRunPassedClaimed,
    generatedLocalFixturePassedClaimed: rollup.generatedLocalFixturePassedClaimed,
    readyForAnyExternalAgentExecutionNow: readyTools.length > 0,
    readyToolIds: readyTools.map((tool) => tool.toolId),
    staticExplicitToolGateReadyToolIds: explicitToolGateReadyTools.map((tool) => tool.toolId),
    livePreflightRequiredBeforeRuntime: explicitToolGateReadyTools.length > 0,
    blockedToolCount: blockedTools.length,
    runtimeGatesAllFalse,
    safeCommandQueue: rollup.safeNextCommands.map((command) => ({
      id: command.id,
      command: command.command,
      liveReadOnly: command.liveReadOnly,
      mutatesRuntime: command.mutatesRuntime,
      runsModel: command.runsModel,
      createsAssets: command.createsAssets,
      purpose: command.purpose,
    })),
    preferredNextSafeCommand,
    toolActions: rollup.tools.map((tool) => ({
      toolId: tool.toolId,
      lane: tool.lane,
      status: tool.status,
      currentStage: tool.currentStage,
      selectedModelOrTool: tool.selectedModelOrTool,
      selectedGpu: tool.selectedGpu,
      scaleToZeroRequired: tool.scaleToZeroRequired,
      readyForExternalAgentExecutionNow: tool.readyForExternalAgentExecutionNow,
      readyForBoundedRetryAfterBlockerClears: tool.readyForBoundedRetryAfterBlockerClears,
      noIdleLifecycleGate: tool.noIdleLifecycleGate ?? null,
      primaryBlocker: tool.primaryBlocker,
      nextAction: tool.nextAction,
      manualBlockerActions: manualBlockerActionsForTool(tool.toolId),
      ...actionForTool(tool.toolId),
      forbiddenRuntimeActions,
    })),
    manualBlockers: blockedTools.map((tool) => ({
      toolId: tool.toolId,
      blocker: tool.primaryBlocker,
      nextAction: tool.nextAction,
      manualBlockerActions: manualBlockerActionsForTool(tool.toolId),
    })),
    sourceRules: rollup.sourceRules,
    runtimeSideEffects: rollup.runtimeSideEffects,
    recommendedNextPrompt: rollup.recommendedNextPrompt,
  }

  console.log(JSON.stringify(actionPlan, null, 2))
}

main()
