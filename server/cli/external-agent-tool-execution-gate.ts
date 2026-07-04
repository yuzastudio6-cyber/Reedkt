import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_EXECUTION_GATE } from '../../src/backend/mock/mock-external-agent-tool-execution-gate'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

type JsonRecord = Record<string, unknown>

const GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX'

function readArgValue(names: string[]): string | undefined {
  for (const name of names) {
    const equalsPrefix = `${name}=`
    const equalsMatch = process.argv.find((arg) => arg.startsWith(equalsPrefix))
    if (equalsMatch) return equalsMatch.slice(equalsPrefix.length).trim()

    const index = process.argv.indexOf(name)
    if (index >= 0) {
      const next = process.argv[index + 1]?.trim()
      if (next && !next.startsWith('--')) return next
    }
  }

  return undefined
}

function resolveAccountIndexOverride(): {
  cliAccountIndexProvided: boolean
  cliAccountIndex?: number
  cliAccountIndexValid: boolean
  childEnv: NodeJS.ProcessEnv
} {
  const rawIndex = readArgValue(['--account-index', '--gcloud-account-index'])
  if (!rawIndex) {
    return {
      cliAccountIndexProvided: false,
      cliAccountIndexValid: false,
      childEnv: process.env,
    }
  }

  const parsedIndex = Number(rawIndex)
  const cliAccountIndexValid = Number.isInteger(parsedIndex) && parsedIndex > 0
  return {
    cliAccountIndexProvided: true,
    cliAccountIndex: Number.isFinite(parsedIndex) ? parsedIndex : undefined,
    cliAccountIndexValid,
    childEnv: cliAccountIndexValid
      ? {
          ...process.env,
          [GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV]: String(parsedIndex),
        }
      : process.env,
  }
}

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

function nestedNumber(document: JsonRecord | undefined, keys: string[]): number | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return typeof value === 'number' ? value : undefined
}

function nestedRecord(document: JsonRecord | undefined, keys: string[]): JsonRecord | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined
}

function runLiveVerifier(childEnv: NodeJS.ProcessEnv) {
  const result = spawnSync('npx', ['tsx', 'server/cli/external-agent-gcp-access-verify.ts'], {
    cwd: process.cwd(),
    env: childEnv,
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

function applyAccountIndex(value: string, accountIndex: number | undefined): string {
  if (!accountIndex) return value

  return value
    .replace(/<account-index>/g, String(accountIndex))
    .replace(/<redacted-index>/g, String(accountIndex))
}

const cliAccountIndexCommands = new Set([
  'npm run external-agent-tool-action-plan',
  'npm run external-agent-tool-readiness:check',
  'npm run external-agent-tool-execution-gate',
  'npm run external-agent-tool-next-command',
  'npm run external-agent-tool-blockers:preflight',
  'npm run external-agent-gcp-access:repair-plan',
  'npm run external-agent-gcp-access:verify',
  'npm run external-agent-tool-runtime-status',
  'npm run external-agent-tool-execute-qwen',
  'npm run external-agent-tool-execute-broll-wan',
  'npm run external-agent-tool-execute-sound',
  'npm run external-agent-tool-execute-supabase-harness',
])

const envAccountIndexCommands = new Set(['npm run ai-video-broll-wan-gpu-global-quota:verify'])

function commandWithAccountIndex(command: string, accountIndex: number | undefined): string {
  if (!accountIndex) return command
  if (
    command.includes('--account-index') ||
    command.includes('--gcloud-account-index') ||
    command.includes('REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=')
  ) {
    return applyAccountIndex(command, accountIndex)
  }

  const runPrefix = command.startsWith('run ')
  const body = runPrefix ? command.slice('run '.length) : command
  const prefix = runPrefix ? 'run ' : ''

  const cliAccountIndexCommand = Array.from(cliAccountIndexCommands).find(
    (candidate) => body === candidate || body.startsWith(`${candidate} -- `),
  )
  if (cliAccountIndexCommand) {
    const separator = body.includes(' -- ') ? '' : ' --'
    return `${prefix}${body}${separator} --account-index ${accountIndex}`
  }

  if (envAccountIndexCommands.has(body)) {
    return `${prefix}REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=${accountIndex} ${body}`
  }

  return applyAccountIndex(command, accountIndex)
}

function gcpAccessRepairGuidance(accountIndex: number | undefined) {
  const repairPlan = EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN

  return {
    ok: true,
    decision: repairPlan.decision,
    mode: repairPlan.mode,
    projectId: repairPlan.projectId,
    currentLiveBlockers: repairPlan.currentLiveBlockers,
    repairScope: repairPlan.repairScope,
    tools: repairPlan.tools.map((tool) => ({
      ...tool,
      verificationCommand: applyAccountIndex(tool.verificationCommand, accountIndex),
    })),
    failureResponsePolicy: repairPlan.failureResponsePolicy,
    safeRetryChecklist: repairPlan.safeRetryChecklist.map((step) => applyAccountIndex(step, accountIndex)),
    postRepairVerificationCommands: repairPlan.postRepairVerificationCommands.map((command) =>
      applyAccountIndex(command, accountIndex),
    ),
    runtimeGatesAllFalse: Object.values(repairPlan.runtimeSideEffects).every((value) => value === false),
    runtimeSideEffects: repairPlan.runtimeSideEffects,
  }
}

function main() {
  const gate = EXTERNAL_AGENT_TOOL_EXECUTION_GATE
  const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
  const accountIndexOverride = resolveAccountIndexOverride()
  const readyTools = rollup.tools.filter((tool) => tool.readyForExternalAgentExecutionNow)
  const staticExplicitGateTools = gate.toolRows.filter((tool) => tool.staticExplicitToolGateReady)
  const rollupToolsById = new Map(rollup.tools.map((tool) => [tool.toolId, tool]))
  const selectedAccountIndex =
    accountIndexOverride.cliAccountIndexValid && typeof accountIndexOverride.cliAccountIndex === 'number'
      ? accountIndexOverride.cliAccountIndex
      : undefined
  const runtimeGatesAllFalse = Object.values(gate.runtimeSideEffects).every((value) => value === false)
  const executionAllowedNow =
    gate.readyForAnyExternalAgentExecutionNow && readyTools.length > 0 && runtimeGatesAllFalse
  const staticExplicitToolGateReady =
    gate.staticExplicitToolGateReady && staticExplicitGateTools.length > 0 && runtimeGatesAllFalse
  const requireGo = process.argv.includes('--require-go')
  const liveMode = process.argv.includes('--live') || process.argv.includes('--use-live-verify')
  const liveVerifierResult = liveMode ? runLiveVerifier(accountIndexOverride.childEnv) : undefined
  const liveVerifierJson = liveVerifierResult?.json
  const staticExplicitToolGateReadyToolIds = staticExplicitGateTools.map((tool) => tool.toolId)
  const liveQwenWrapperReady =
    liveMode &&
    staticExplicitToolGateReadyToolIds.includes('qwen2_5_vl_7b_instruct') &&
    nestedBoolean(liveVerifierJson, ['qwen', 'wrapperMayBeCalledAfterConfirmation'])
  const liveBrollInferenceWrapperReady =
    liveMode &&
    staticExplicitToolGateReadyToolIds.includes('ai_video_broll_generation_wan') &&
    nestedBoolean(liveVerifierJson, ['broll', 'inferenceWrapperMayBeCalledAfterConfirmation'])
  const liveReadyToolIds = liveMode
    ? [
        ...(liveQwenWrapperReady ? ['qwen2_5_vl_7b_instruct'] : []),
        ...(liveBrollInferenceWrapperReady ? ['ai_video_broll_generation_wan'] : []),
      ]
    : readyTools.map((tool) => tool.toolId)
  const liveReadyToolIdSet = new Set(liveReadyToolIds)
  const liveVerifierReady =
    liveVerifierResult?.ok === true &&
    nestedBoolean(liveVerifierJson, ['runtimeGatesAllFalse']) &&
    liveReadyToolIds.length > 0
  const liveAccountAccessDiagnostic = nestedRecord(liveVerifierJson, ['accountAccessDiagnostic'])
  const liveAwareExecutionAllowedNow = liveMode
    ? staticExplicitToolGateReady && liveVerifierReady
    : executionAllowedNow
  const toolRows = gate.toolRows.map((tool) => ({
    ...tool,
    runtimeExecutionAllowedNow: liveMode
      ? liveAwareExecutionAllowedNow && liveReadyToolIdSet.has(tool.toolId)
      : tool.executionAllowedNow === true,
    safeEvidenceReviewExecutableNow:
      rollupToolsById.get(tool.toolId)?.status === 'metadata_only' ||
      rollupToolsById.get(tool.toolId)?.status === 'supporting_evidence_only',
    accountIndexedSafeNextCommand: selectedAccountIndex
      ? commandWithAccountIndex(tool.safeNextCommand, selectedAccountIndex)
      : undefined,
    manualBlockerActions: rollupToolsById.get(tool.toolId)?.manualBlockerActions ?? [],
  }))

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
    accountSelectionGuidance: {
      overrideIndexEnv: GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV,
      cliAccountIndexFlag: '--account-index <account-index>',
      cliGcloudAccountIndexFlagAlias: '--gcloud-account-index <account-index>',
      cliAccountIndexProvided: accountIndexOverride.cliAccountIndexProvided,
      cliAccountIndex: accountIndexOverride.cliAccountIndex,
      cliAccountIndexValid: accountIndexOverride.cliAccountIndexValid,
      cliAccountIndexMapsToChildEnv:
        accountIndexOverride.cliAccountIndexProvided && accountIndexOverride.cliAccountIndexValid,
      mutatesLocalGcloudConfig: false,
      printsAccountValue: false,
    },
    staticExplicitToolGateReady,
    staticExplicitToolGateReadyToolIds,
    staticReadyForAnyExternalAgentExecutionGateNow: readyTools.length > 0,
    staticReadyToolIds: readyTools.map((tool) => tool.toolId),
    requiresLivePreflightBeforeRuntime: gate.requiresLivePreflightBeforeRuntime,
    executionNowBlockedByLivePreflight: staticExplicitToolGateReady && !liveAwareExecutionAllowedNow,
    readyForAnyExternalAgentRuntimeExecutionNow: liveAwareExecutionAllowedNow,
    liveVerifierAvailableCommand: 'npm run external-agent-gcp-access:verify',
    accountIndexedLiveVerifierAvailableCommand: selectedAccountIndex
      ? commandWithAccountIndex('npm run external-agent-gcp-access:verify', selectedAccountIndex)
      : undefined,
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
          brollCacheReady: nestedBoolean(liveVerifierJson, ['broll', 'cacheReady']),
          brollInferenceWrapperMayBeCalledAfterConfirmation: nestedBoolean(liveVerifierJson, [
            'broll',
            'inferenceWrapperMayBeCalledAfterConfirmation',
          ]),
          nextCommandExecutionAllowedNow: nestedBoolean(liveVerifierJson, [
            'nextCommand',
            'executionAllowedNow',
          ]),
          chosenNextCommand: nestedString(liveVerifierJson, ['nextCommand', 'chosenNextCommand']),
          manualActionReason: nestedString(liveVerifierJson, ['nextCommand', 'manualActionReason']),
          accountAccessDiagnostic: liveAccountAccessDiagnostic
            ? {
                ok: nestedBoolean(liveVerifierJson, ['accountAccessDiagnostic', 'ok']),
                accountCount: nestedNumber(liveVerifierJson, ['accountAccessDiagnostic', 'accountCount']),
                qwenReadyAccountCount: nestedNumber(liveVerifierJson, [
                  'accountAccessDiagnostic',
                  'qwenReadyAccountCount',
                ]),
                brollQuotaReadAccountCount: nestedNumber(liveVerifierJson, [
                  'accountAccessDiagnostic',
                  'brollQuotaReadAccountCount',
                ]),
                brollQuotaReadyAccountCount: nestedNumber(liveVerifierJson, [
                  'accountAccessDiagnostic',
                  'brollQuotaReadyAccountCount',
                ]),
                anyAccountReadyForBoth: nestedBoolean(liveVerifierJson, [
                  'accountAccessDiagnostic',
                  'anyAccountReadyForBoth',
                ]),
                selectedAccountRepairRequest: nestedRecord(liveVerifierJson, [
                  'accountAccessDiagnostic',
                  'selectedAccountRepairRequest',
                ]),
                recommendedNextPrompt: nestedString(liveVerifierJson, [
                  'accountAccessDiagnostic',
                  'recommendedNextPrompt',
                ]),
              }
            : undefined,
          recommendedNextPrompt: nestedString(liveVerifierJson, ['recommendedNextPrompt']),
        }
      : undefined,
    gcpAccessRepair: gcpAccessRepairGuidance(
      accountIndexOverride.cliAccountIndexValid ? accountIndexOverride.cliAccountIndex : undefined,
    ),
    executionAllowedNow: liveAwareExecutionAllowedNow,
    readyForAnyExternalAgentExecutionNow: liveAwareExecutionAllowedNow,
    readyToolIds: liveAwareExecutionAllowedNow ? liveReadyToolIds : [],
    blockedToolIds: liveAwareExecutionAllowedNow
      ? rollup.tools
          .filter((tool) => !liveReadyToolIdSet.has(tool.toolId))
          .map((tool) => tool.toolId)
      : rollup.tools.map((tool) => tool.toolId),
    requiresApprovedSnapshotBeforeExecution: gate.requiresApprovedSnapshotBeforeExecution,
    requiresStructuredToolEnvelopeBeforeExecution: gate.requiresStructuredToolEnvelopeBeforeExecution,
    rawChatExecutionAllowed: gate.rawChatExecutionAllowed,
    runtimeGatesAllFalse,
    toolRows,
    safeCommandsBeforeExecution: gate.safeCommandsBeforeExecution,
    accountIndexedSafeCommandsBeforeExecution: selectedAccountIndex
      ? gate.safeCommandsBeforeExecution.map((command) => commandWithAccountIndex(command, selectedAccountIndex))
      : undefined,
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
