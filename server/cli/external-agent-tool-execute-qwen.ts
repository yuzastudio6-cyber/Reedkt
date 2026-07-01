import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

type JsonRecord = Record<string, unknown>

const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION'
const NEXT_COMMAND_SCRIPT = 'server/cli/external-agent-tool-next-command.ts'

function main() {
  const execute = process.argv.includes('--execute')

  if (!execute) {
    print({
      ok: false,
      mode: 'external_agent_qwen_execution_static_guard',
      executeRequired: true,
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      canonicalCommand: EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenExternalAgentExecutionCommand,
      delegatedBoundedCommand: EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenBoundedExecutionCommand,
      runtimeRunNow: false,
      cloudRunJobExecuted: false,
      modelInferenceRun: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    print({
      ok: false,
      mode: 'external_agent_qwen_execution_confirmation_blocked',
      status: 'blocked',
      blockers: [`confirmation_env_required:${CONFIRM_ENV}=true`],
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      runtimeRunNow: false,
      cloudRunJobExecuted: false,
      modelInferenceRun: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  const nextCommand = runJson('next_command_live_preflight', 'npx', ['tsx', NEXT_COMMAND_SCRIPT])
  const blockers = validateNextCommand(nextCommand.json)
  if (blockers.length) {
    print({
      ok: false,
      mode: 'external_agent_qwen_execution_preflight_blocked',
      status: 'blocked',
      blockers,
      nextCommand: summarizeNextCommand(nextCommand.json),
      runtimeRunNow: false,
      cloudRunJobExecuted: false,
      modelInferenceRun: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  const delegated = EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenBoundedExecutionCommand
  const result = runJson('qwen_bounded_execution', delegated.command, [...delegated.args], {
    [delegated.confirmationEnv]: delegated.confirmationEnvRequiredValue,
  })

  print({
    ok: result.ok && result.json?.ok === true,
    mode: 'external_agent_qwen_execution_delegated_result',
    status: result.ok && result.json?.ok === true ? 'passed' : 'blocked_or_failed',
    delegatedExitCode: result.exitCode,
    nextCommand: summarizeNextCommand(nextCommand.json),
    delegatedResult: result.json,
    stderrSummary: result.stderrSummary,
    generatedLocalFixturePassedClaimed: false,
  })
}

function validateNextCommand(document: JsonRecord | undefined): string[] {
  const blockers: string[] = []
  if (!document) return ['next_command_json_missing']
  if (document.ok !== true) blockers.push('next_command_not_ok')
  if (document.executionAllowedNow !== true) blockers.push('execution_allowed_now_false')
  if (document.readyForAnyExternalAgentExecutionNow !== true) {
    blockers.push('ready_for_any_external_agent_execution_now_false')
  }
  if (document.qwenLivePreflightPassed !== true) blockers.push('qwen_live_preflight_not_passed')
  if (document.staticExplicitToolGateReady !== true) blockers.push('static_explicit_tool_gate_not_ready')
  if (!document.qwenBoundedExecutionCommand) blockers.push('qwen_bounded_execution_command_missing')
  if (!document.qwenExternalAgentExecutionCommand) blockers.push('qwen_external_agent_execution_command_missing')

  return blockers
}

function summarizeNextCommand(document: JsonRecord | undefined) {
  if (!document) return undefined

  return {
    ok: document.ok,
    executionAllowedNow: document.executionAllowedNow,
    readyForAnyExternalAgentExecutionNow: document.readyForAnyExternalAgentExecutionNow,
    staticExplicitToolGateReady: document.staticExplicitToolGateReady,
    qwenLivePreflightPassed: document.qwenLivePreflightPassed,
    chosenManualAction: document.chosenManualAction,
    qwenExternalAgentExecutionCommandPresent: Boolean(document.qwenExternalAgentExecutionCommand),
    qwenBoundedExecutionCommandPresent: Boolean(document.qwenBoundedExecutionCommand),
  }
}

function runJson(
  id: string,
  command: string,
  args: string[],
  env: Record<string, string> = {},
): {
  id: string
  ok: boolean
  exitCode: number | null
  json?: JsonRecord
  stderrSummary?: string
} {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 12,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let json: JsonRecord | undefined
  try {
    json = JSON.parse(String(result.stdout ?? '')) as JsonRecord
  } catch {
    json = undefined
  }

  return {
    id,
    ok: result.status === 0 && Boolean(json),
    exitCode: result.status,
    json,
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function sanitize(value: string): string | undefined {
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .trim()

  return sanitized ? sanitized.slice(0, 1000) : undefined
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
