import { EXTERNAL_AGENT_TOOL_EXECUTION_GATE } from '../../src/backend/mock/mock-external-agent-tool-execution-gate'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

function main() {
  const gate = EXTERNAL_AGENT_TOOL_EXECUTION_GATE
  const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
  const readyTools = rollup.tools.filter((tool) => tool.readyForExternalAgentExecutionNow)
  const staticExplicitGateTools = gate.toolRows.filter((tool) => tool.staticExplicitToolGateReady)
  const blockedTools = rollup.tools.filter((tool) => !tool.readyForExternalAgentExecutionNow)
  const runtimeGatesAllFalse = Object.values(gate.runtimeSideEffects).every((value) => value === false)
  const executionAllowedNow =
    gate.readyForAnyExternalAgentExecutionNow && readyTools.length > 0 && runtimeGatesAllFalse
  const staticExplicitToolGateReady =
    gate.staticExplicitToolGateReady && staticExplicitGateTools.length > 0 && runtimeGatesAllFalse
  const requireGo = process.argv.includes('--require-go')

  const report = {
    ok: true,
    mode: gate.mode,
    decision: executionAllowedNow
      ? 'external_agent_execution_go_after_explicit_tool_gate'
      : gate.decision,
    sourceRollupDecision: gate.sourceRollupDecision,
    paidProductionInScope: gate.paidProductionInScope,
    dryRunPassedClaimed: gate.dryRunPassedClaimed,
    generatedLocalFixturePassedClaimed: gate.generatedLocalFixturePassedClaimed,
    requireGoMode: requireGo,
    staticExplicitToolGateReady,
    staticExplicitToolGateReadyToolIds: staticExplicitGateTools.map((tool) => tool.toolId),
    requiresLivePreflightBeforeRuntime: gate.requiresLivePreflightBeforeRuntime,
    executionAllowedNow,
    readyForAnyExternalAgentExecutionNow: executionAllowedNow,
    readyToolIds: readyTools.map((tool) => tool.toolId),
    blockedToolIds: blockedTools.map((tool) => tool.toolId),
    requiresApprovedSnapshotBeforeExecution: gate.requiresApprovedSnapshotBeforeExecution,
    requiresStructuredToolEnvelopeBeforeExecution: gate.requiresStructuredToolEnvelopeBeforeExecution,
    rawChatExecutionAllowed: gate.rawChatExecutionAllowed,
    runtimeGatesAllFalse,
    toolRows: gate.toolRows,
    safeCommandsBeforeExecution: gate.safeCommandsBeforeExecution,
    forbiddenRuntimeActions: gate.forbiddenRuntimeActions,
    runtimeSideEffects: gate.runtimeSideEffects,
    recommendedNextPrompt: gate.recommendedNextPrompt,
  }

  console.log(JSON.stringify(report, null, 2))

  if (requireGo && !staticExplicitToolGateReady) {
    process.exitCode = gate.requireGoExitCodeWhenBlocked
  }
}

main()
