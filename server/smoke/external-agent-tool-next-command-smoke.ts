import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

const ROOT = process.cwd()
const SPEC_PATH = 'src/backend/mock/mock-external-agent-tool-next-command.ts'
const CLI_PATH = 'server/cli/external-agent-tool-next-command.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-next-command-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-next-command'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-next-command'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'nextCommand'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

for (const file of [SPEC_PATH, CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-next-command.ts',
  'package next command script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-next-command-smoke.ts',
  'package next command smoke script mismatch',
)

const spec = EXTERNAL_AGENT_TOOL_NEXT_COMMAND
assert.equal(spec.decision, 'external_agent_live_next_command_read_only_decision_defined')
assert.equal(spec.mode, 'read_only_external_agent_tool_next_command_decision')
assert.equal(spec.paidProductionInScope, false)
assert.equal(spec.dryRunPassedClaimed, false)
assert.equal(spec.generatedLocalFixturePassedClaimed, false)
assert.equal(spec.allowedProbeScripts.length, 3)

for (const probe of spec.allowedProbeScripts) {
  assert.equal(probe.mutatesRuntime, false, `${probe.id} must not mutate runtime`)
  assert.equal(probe.runsModel, false, `${probe.id} must not run models`)
  assert.equal(probe.createsAssets, false, `${probe.id} must not create assets`)
}

const cliSource = read(CLI_PATH)
assert.equal(cliSource.includes('spawnSync'), true)
for (const forbidden of [
  'gcloud ',
  'docker ',
  'psql',
  'run deploy',
  'jobs execute',
  'instances create',
  'from_pretrained',
  'torch.',
]) {
  assert.equal(cliSource.includes(forbidden), false, `Next command CLI must not contain runtime marker: ${forbidden}`)
}

const output = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 8,
})
const decision = JSON.parse(output)
assert.equal(decision.ok, true)
assert.equal(decision.mode, spec.mode)
assert.equal(decision.liveReadOnlyChecksRun, true)
assert.equal(decision.readyForAnyExternalAgentExecutionNow, false)
assert.equal(decision.runtimeGatesAllFalse, true)
assert.equal(Array.isArray(decision.probeSummaries), true)
assert.equal(decision.probeSummaries.length >= 2, true)
assert.equal(typeof decision.liveBlockerSummary, 'object')
assert.equal(typeof decision.liveBlockerSummary.qwen, 'object')
assert.equal(typeof decision.liveBlockerSummary.broll, 'object')
assert.equal(typeof decision.chosenManualAction, 'string')
assert.equal(typeof decision.chosenNextCommand === 'string' || decision.chosenNextCommand === undefined, true)
if (decision.gcloudDiagnosticRun) {
  assert.equal(decision.manualActionRequired, true)
  assert.equal(decision.manualActionReason, 'gcloud_auth_refresh_required_before_downstream_probes')
  assert.equal(decision.manualActionBlocksRuntime, true)
  assert.equal(decision.rerunAfterManualAction, 'npm run external-agent-tool-blockers:preflight')
  assert.equal(typeof decision.gcloudDiagnosticSummary, 'object')
  assert.equal(typeof decision.gcloudDiagnosticSummary.path, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.installationSdkRoot, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.globalConfigDir, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.activeConfigPath, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.configuredProject, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.activeAccountDomain, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.accessTokenRefreshPassed, 'boolean')
  assert.equal(decision.chosenManualAction.includes('active local gcloud account/configuration'), true)
  assert.equal(decision.liveBlockerSummary.qwen.blocker, 'local_gcloud_reauthentication_required')
  assert.equal(decision.liveBlockerSummary.qwen.downstreamProbeSkipped, true)
  assert.equal(decision.liveBlockerSummary.broll.blocker, 'quota_probe_skipped_auth_refresh_failed')
  assert.equal(decision.liveBlockerSummary.broll.quotaProbeSkipped, true)
  assert.equal(decision.liveBlockerSummary.broll.nextAction, decision.chosenManualAction)
}

for (const [flag, value] of Object.entries(decision.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ spec, decision })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      mode: decision.mode,
      executionAllowedNow: decision.executionAllowedNow,
      qwenAuthRefreshPassed: decision.qwenAuthRefreshPassed,
      brollQuotaSufficientForOneL4Vm: decision.brollQuotaSufficientForOneL4Vm,
      liveBlockerSummary: decision.liveBlockerSummary,
      gcloudDiagnosticRun: decision.gcloudDiagnosticRun,
      gcloudDiagnosticSummary: decision.gcloudDiagnosticSummary,
      chosenNextCommand: decision.chosenNextCommand,
      chosenManualAction: decision.chosenManualAction,
      manualActionRequired: decision.manualActionRequired,
      manualActionReason: decision.manualActionReason,
      rerunAfterManualAction: decision.rerunAfterManualAction,
      runtimeGatesAllFalse: decision.runtimeGatesAllFalse,
    },
    null,
    2,
  ),
)
