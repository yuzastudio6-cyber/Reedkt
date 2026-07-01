import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

type ProbeResult = {
  id: string
  ok: boolean
  exitCode: number | null
  json?: Record<string, unknown>
  stderrSummary?: string
}

const TOKEN_LIKE_PATTERNS: Array<[string, RegExp]> = [
  ['url', /\bhttps?:\/\/\S+/gi],
  ['access token', /\bya29\.[A-Za-z0-9._-]+/g],
  ['authorization header', /\bAuthorization\s*:\s*Bearer\s+\S+/gi],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
]

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined

  let output = value
  for (const [label, pattern] of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, `<redacted ${label}>`)
  }

  return output.trim().slice(0, 700) || undefined
}

function runProbe(id: string, script: string): ProbeResult {
  const result = spawnSync('npx', ['tsx', script], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 6,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stdout = String(result.stdout ?? '')

  let json: Record<string, unknown> | undefined
  try {
    json = JSON.parse(stdout) as Record<string, unknown>
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

function nestedBoolean(document: Record<string, unknown> | undefined, keys: string[]): boolean {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return false
    value = (value as Record<string, unknown>)[key]
  }
  return value === true
}

function nestedString(document: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return typeof value === 'string' ? value : undefined
}

function main() {
  const spec = EXTERNAL_AGENT_TOOL_NEXT_COMMAND
  const probeById = new Map(spec.allowedProbeScripts.map((probe) => [probe.id, probe]))
  const executionGateProbe = probeById.get('execution_gate')
  const liveBlockerProbe = probeById.get('live_blocker_preflight')
  const gcloudDiagnosticProbe = probeById.get('gcloud_session_diagnostic')

  if (!executionGateProbe || !liveBlockerProbe || !gcloudDiagnosticProbe) {
    throw new Error('Missing required external-agent next-command probe')
  }

  const executionGate = runProbe(executionGateProbe.id, executionGateProbe.script)
  const liveBlocker = runProbe(liveBlockerProbe.id, liveBlockerProbe.script)
  const qwenAuthRefreshPassed = nestedBoolean(liveBlocker.json, ['qwen', 'accessTokenRefreshPassed'])
  const brollQuotaSufficient = nestedBoolean(liveBlocker.json, ['broll', 'quotaSufficientForOneL4Vm'])
  const executionAllowedNow = nestedBoolean(executionGate.json, ['executionAllowedNow'])
  const shouldRunGcloudDiagnostic = !qwenAuthRefreshPassed
  const gcloudDiagnostic = shouldRunGcloudDiagnostic
    ? runProbe(gcloudDiagnosticProbe.id, gcloudDiagnosticProbe.script)
    : undefined

  const chosenNextCommand = executionAllowedNow
    ? undefined
    : !qwenAuthRefreshPassed
      ? spec.nextCommandRules.whenQwenAuthRefreshFails
      : !brollQuotaSufficient
        ? spec.nextCommandRules.whenBrollQuotaNeedsVerification
        : spec.nextCommandRules.whenQwenAuthClearsAndBrollQuotaBlocked
  const chosenManualAction = executionAllowedNow
    ? spec.nextCommandRules.whenExecutionGateAllowsRuntime
    : nestedString(liveBlocker.json, ['recommendedNextPrompt']) ?? spec.defaultDecision
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)
  const probeSummaries = [executionGate, liveBlocker, gcloudDiagnostic]
    .filter((probe): probe is ProbeResult => Boolean(probe))
    .map((probe) => ({
      id: probe.id,
      ok: probe.ok,
      exitCode: probe.exitCode,
      decision: nestedString(probe.json, ['decision']),
      mode: nestedString(probe.json, ['mode']),
      stderrSummary: probe.stderrSummary,
    }))

  console.log(
    JSON.stringify(
      {
        ok: executionGate.ok && liveBlocker.ok && (!gcloudDiagnostic || gcloudDiagnostic.ok) && runtimeGatesAllFalse,
        decision: spec.decision,
        mode: spec.mode,
        liveReadOnlyChecksRun: true,
        paidProductionInScope: spec.paidProductionInScope,
        dryRunPassedClaimed: spec.dryRunPassedClaimed,
        generatedLocalFixturePassedClaimed: spec.generatedLocalFixturePassedClaimed,
        executionAllowedNow,
        readyForAnyExternalAgentExecutionNow: false,
        qwenAuthRefreshPassed,
        brollQuotaSufficientForOneL4Vm: brollQuotaSufficient,
        gcloudDiagnosticRun: shouldRunGcloudDiagnostic,
        chosenNextCommand,
        chosenManualAction,
        probeSummaries,
        forbiddenRuntimeActions: spec.forbiddenRuntimeActions,
        runtimeSideEffects: spec.runtimeSideEffects,
        runtimeGatesAllFalse,
      },
      null,
      2,
    ),
  )
}

main()
