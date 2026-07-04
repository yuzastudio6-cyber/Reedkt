import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_EXECUTION_GATE } from '../../src/backend/mock/mock-external-agent-tool-execution-gate'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

type JsonRecord = Record<string, unknown>

function nestedBoolean(document: JsonRecord | undefined, keys: string[]): boolean {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return false
    value = (value as JsonRecord)[key]
  }
  return value === true
}

function nestedString(document: JsonRecord | undefined, keys: string[]): string | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return typeof value === 'string' ? value : undefined
}

function runLiveVerifier() {
  const result = spawnSync('npx', ['tsx', 'server/cli/external-agent-gcp-access-verify.ts'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stdout = String(result.stdout ?? '')

  let json: JsonRecord | undefined
  try {
    json = JSON.parse(stdout) as JsonRecord
  } catch {
    json = undefined
  }

  return {
    exitCode: result.status,
    ok: result.status === 0 && Boolean(json),
    json,
  }
}

function main() {
  const gate = EXTERNAL_AGENT_TOOL_EXECUTION_GATE
  const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
  const readyTools = rollup.tools.filter((tool) => tool.readyForExternalAgentExecutionNow)
  const staticExplicitGateTools = gate.toolRows.filter((tool) => tool.staticExplicitToolGateReady)
  const blockedTools = rollup.tools.filter((tool) => !tool.readyForExternalAgentExecutionNow)
  const rollupToolsById = new Map(rollup.tools.map((tool) => [tool.toolId, tool]))
  const toolRows = gate.toolRows.map((tool) => ({
    ...tool,
    manualBlockerActions: rollupToolsById.get(tool.toolId)?.manualBlockerActions ?? [],
  }))
  const runtimeGatesAllFalse = Object.values(gate.runtimeSideEffects).every((value) => value === false)
  const executionAllowedNow =
    gate.readyForAnyExternalAgentExecutionNow && readyTools.length > 0 && runtimeGatesAllFalse
  const staticExplicitToolGateReady =
    gate.staticExplicitToolGateReady && staticExplicitGateTools.length > 0 && runtimeGatesAllFalse
  const requireGo = process.argv.includes('--require-go')
  const liveMode = process.argv.includes('--live') || process.argv.includes('--use-live-verify')
  const liveVerifierResult = liveMode ? runLiveVerifier() : undefined
  const liveVerifierJson = liveVerifierResult?.json
  const liveVerifierReady =
    liveVerifierResult?.ok === true &&
    nestedBoolean(liveVerifierJson, ['readyForAnyExternalAgentExecutionNow']) &&
    nestedBoolean(liveVerifierJson, ['runtimeGatesAllFalse'])
  const liveAwareExecutionAllowedNow = liveMode
    ? staticExplicitToolGateReady && liveVerifierReady
    : executionAllowedNow

  const report = {
    ok: true,
    mode: gate.mode,
    decision: liveAwareExecutionAllowedNow
      ? 'external_agent_execution_go_after_explicit_tool_gate'
      : liveMode
        ? 'external_agent_execution_no_go_live_preflight_blocked'
        : gate.decision,
    sourceRollupDecision: gate.sourceRollupDecision,
    paidProductionInScope: gate.paidProductionInScope,
    dryRunPassedClaimed: gate.dryRunPassedClaimed,
    generatedLocalFixturePassedClaimed: gate.generatedLocalFixturePassedClaimed,
    requireGoMode: requireGo,
    liveMode,
    staticExplicitToolGateReady,
    staticExplicitToolGateReadyToolIds: staticExplicitGateTools.map((tool) => tool.toolId),
    requiresLivePreflightBeforeRuntime: gate.requiresLivePreflightBeforeRuntime,
    liveVerifierAvailableCommand: 'npm run external-agent-gcp-access:verify',
    liveVerifierRun: liveMode,
    liveVerifier: liveMode
      ? {
          ok: liveVerifierResult?.ok === true,
          exitCode: liveVerifierResult?.exitCode ?? null,
          allRequiredReadAccessVerified: nestedBoolean(liveVerifierJson, ['allRequiredReadAccessVerified']),
          readyForAnyExternalAgentExecutionNow: nestedBoolean(liveVerifierJson, [
            'readyForAnyExternalAgentExecutionNow',
          ]),
          qwenReadAccessPassed: nestedBoolean(liveVerifierJson, ['qwen', 'readAccessPassed']),
          brollQuotaReadAccessPassed: nestedBoolean(liveVerifierJson, ['broll', 'quotaReadAccessPassed']),
          brollQuotaSufficientForOneL4Vm: nestedBoolean(liveVerifierJson, [
            'broll',
            'quotaSufficientForOneL4Vm',
          ]),
          nextCommandExecutionAllowedNow: nestedBoolean(liveVerifierJson, [
            'nextCommand',
            'executionAllowedNow',
          ]),
          chosenNextCommand: nestedString(liveVerifierJson, ['nextCommand', 'chosenNextCommand']),
          manualActionReason: nestedString(liveVerifierJson, ['nextCommand', 'manualActionReason']),
          recommendedNextPrompt: nestedString(liveVerifierJson, ['recommendedNextPrompt']),
        }
      : undefined,
    executionAllowedNow: liveAwareExecutionAllowedNow,
    readyForAnyExternalAgentExecutionNow: liveAwareExecutionAllowedNow,
    readyToolIds: liveMode && !liveAwareExecutionAllowedNow ? [] : readyTools.map((tool) => tool.toolId),
    blockedToolIds:
      liveMode && !liveAwareExecutionAllowedNow
        ? rollup.tools.map((tool) => tool.toolId)
        : blockedTools.map((tool) => tool.toolId),
    requiresApprovedSnapshotBeforeExecution: gate.requiresApprovedSnapshotBeforeExecution,
    requiresStructuredToolEnvelopeBeforeExecution: gate.requiresStructuredToolEnvelopeBeforeExecution,
    rawChatExecutionAllowed: gate.rawChatExecutionAllowed,
    runtimeGatesAllFalse,
    toolRows,
    safeCommandsBeforeExecution: gate.safeCommandsBeforeExecution,
    forbiddenRuntimeActions: gate.forbiddenRuntimeActions,
    runtimeSideEffects: gate.runtimeSideEffects,
    recommendedNextPrompt:
      liveMode && nestedString(liveVerifierJson, ['recommendedNextPrompt'])
        ? nestedString(liveVerifierJson, ['recommendedNextPrompt'])
        : gate.recommendedNextPrompt,
  }

  console.log(JSON.stringify(report, null, 2))

  if (requireGo && !liveAwareExecutionAllowedNow) {
    process.exitCode = gate.requireGoExitCodeWhenBlocked
  }
}

main()
