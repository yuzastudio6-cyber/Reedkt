import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const forbiddenRuntimeActions = [
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
] as const

const externalAgentPreExecutionActions = [
  'npm run external-agent-tool-next-command',
  'npm run external-agent-tool-execution-gate',
] as const

function actionForTool(toolId: string) {
  if (toolId === 'qwen2_5_vl_7b_instruct') {
    return {
      immediateSafeActions: [
        ...externalAgentPreExecutionActions,
        'npm run external-agent-tool-blockers:preflight',
      ],
      externalManualBlocker:
        'Qwen 58DX result review accepted the bounded approved-fixture private inference result for the explicit external-agent gate; live preflight is still required before any runtime attempt',
      afterBlockerClears:
        'run npm run external-agent-tool-next-command to combine the prepared static gate with live read-only Qwen preflight',
    }
  }

  if (toolId === 'ai_video_broll_generation_wan') {
    return {
      immediateSafeActions: [
        ...externalAgentPreExecutionActions,
        'npm run ai-video-broll-wan-fast-cache-readiness:check',
        'npm run ai-video-broll-wan-gpu-global-quota:verify',
        'npm run external-agent-tool-blockers:preflight',
      ],
      externalManualBlocker:
        'bounded no-idle L4 proof prompt is prepared, but the lifecycle execution prompt is still required before any VM or inference path; do not create VMs from this rollup',
      afterBlockerClears:
        'run a separate bounded no-idle L4 lifecycle execution prompt with mandatory cleanup before any inference path',
    }
  }

  if (toolId === 'sound_music_audio') {
    return {
      immediateSafeActions: [...externalAgentPreExecutionActions, 'npm run external-agent-tool-execute-sound'],
      externalManualBlocker: 'runtime owner handoffs still required',
      afterBlockerClears: 'continue only after real provider, worker, storage, QA, billing, and export paths are accepted',
    }
  }

  if (toolId === 'supabase_local_fixture_harness') {
    return {
      immediateSafeActions: [
        ...externalAgentPreExecutionActions,
        'npm run external-agent-tool-execute-supabase-harness',
      ],
      externalManualBlocker: 'not a model or media execution lane on this branch',
      afterBlockerClears: 'use a dedicated Supabase prompt before any local harness, SQL, migration, or cloud path',
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
    (tool) => String(tool.status) === 'ready_for_explicit_tool_gate',
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
      manualBlockerActions: tool.manualBlockerActions ?? [],
      ...actionForTool(tool.toolId),
      forbiddenRuntimeActions,
    })),
    manualBlockers: blockedTools.map((tool) => ({
      toolId: tool.toolId,
      blocker: tool.primaryBlocker,
      nextAction: tool.nextAction,
      manualBlockerActions: tool.manualBlockerActions ?? [],
    })),
    sourceRules: rollup.sourceRules,
    runtimeSideEffects: rollup.runtimeSideEffects,
    recommendedNextPrompt: rollup.recommendedNextPrompt,
  }

  console.log(JSON.stringify(actionPlan, null, 2))
}

main()
