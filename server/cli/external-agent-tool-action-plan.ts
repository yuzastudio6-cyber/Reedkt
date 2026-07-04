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
        'npm run external-agent-tool-execute-broll-wan',
      ],
      externalManualBlocker:
        'B-roll 10ZB proved the no-idle L4 payload/install path with cleanup verified. 11A selected the Wan-AI/Wan2.1-T2V-1.3B-Diffusers model import target, 11E staged the private GCS Wan model cache with the ready marker, 11B executed the bounded no-idle L4 model import/load proof, 11C accepts that passed proof as external-agent evidence, 11F records the bounded Wan inference boundary plan, 11G implements the fail-closed inference-proof runner shell, 11H attempted the bounded latent inference proof with cleanup verified, and 11H-FIX updates the retry shape to g2-standard-8 with early pipeline-load markers. The wrapper can call the 11H runner, but generated video remains blocked until a separate bounded retry passes.',
      afterBlockerClears:
        'run AI-VIDEO-BROLL-GEN-11H-RETRY-INFERENCE-PROOF as a separate explicit bounded retry; the current fix only prepares the runner and does not create video',
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
    (tool) =>
      String(tool.status) === 'ready_for_explicit_tool_gate' ||
      String(tool.status) === 'ready_for_bounded_model_import_proof_after_private_cache_staging' ||
      String(tool.status) === 'bounded_model_import_load_proof_reviewed_inference_boundary_plan_required' ||
      String(tool.status) === 'bounded_inference_boundary_planned_runner_required' ||
      String(tool.status) === 'bounded_inference_proof_execution_attempted_failed_cleanup_verified_fix_required' ||
      String(tool.status) === 'bounded_inference_proof_fix_implemented_retry_required',
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
