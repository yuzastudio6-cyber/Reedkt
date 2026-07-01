import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const forbiddenRuntimeActions = [
  'do not invoke Cloud Run',
  'do not execute Cloud Run jobs',
  'do not create Compute Engine VMs',
  'do not request quota',
  'do not run Docker',
  'do not import models',
  'do not run inference',
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
  'npm run external-agent-tool-execution-gate -- --require-go',
] as const

function actionForTool(toolId: string) {
  if (toolId === 'qwen2_5_vl_7b_instruct') {
    return {
      immediateSafeActions: [
        ...externalAgentPreExecutionActions,
        'npm run external-agent-tool-blockers:preflight',
      ],
      externalManualBlocker:
        'bounded approved-fixture private inference retry attempt approval is required after the retry gate; no direct inference is allowed from this action plan',
      afterBlockerClears:
        'record one bounded approved-fixture private inference retry attempt approval before any future private request or inference retry',
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
      primaryBlocker: tool.primaryBlocker,
      nextAction: tool.nextAction,
      ...actionForTool(tool.toolId),
      forbiddenRuntimeActions,
    })),
    manualBlockers: blockedTools.map((tool) => ({
      toolId: tool.toolId,
      blocker: tool.primaryBlocker,
      nextAction: tool.nextAction,
    })),
    sourceRules: rollup.sourceRules,
    runtimeSideEffects: rollup.runtimeSideEffects,
    recommendedNextPrompt: rollup.recommendedNextPrompt,
  }

  console.log(JSON.stringify(actionPlan, null, 2))
}

main()
