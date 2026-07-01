import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCLOUD_SESSION_DIAGNOSTIC } from '../../src/backend/mock/mock-external-agent-gcloud-session-diagnostic'

const ROOT = process.cwd()
const SPEC_PATH = 'src/backend/mock/mock-external-agent-gcloud-session-diagnostic.ts'
const CLI_PATH = 'server/cli/external-agent-gcloud-session-diagnostic.ts'
const SMOKE_PATH = 'server/smoke/external-agent-gcloud-session-diagnostic-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-gcloud-session:diagnostic'
const SMOKE_SCRIPT = 'smoke:external-agent-gcloud-session-diagnostic'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'gcloudSessionDiagnostic'): string[] {
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
  'tsx server/cli/external-agent-gcloud-session-diagnostic.ts',
  'package gcloud session diagnostic script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-gcloud-session-diagnostic-smoke.ts',
  'package gcloud session diagnostic smoke script mismatch',
)

const spec = EXTERNAL_AGENT_GCLOUD_SESSION_DIAGNOSTIC
assert.equal(spec.decision, 'external_agent_gcloud_session_diagnostic_read_only_probe_defined')
assert.equal(spec.mode, 'read_only_external_agent_gcloud_session_diagnostic')
assert.equal(spec.projectId, 'reeditpro')
assert.equal(spec.qwen.blockerIfFailed, 'local_gcloud_reauthentication_required')
assert.equal(spec.qwen.manualOnlyRepairActions.length, 3)
assert.equal(spec.qwen.postRepairCodexVerificationCommand, 'npm run external-agent-tool-blockers:preflight')
assert.equal(spec.allowedReadOnlyCommands.length >= 10, true)

for (const action of spec.qwen.manualOnlyRepairActions) {
  assert.equal(action.runInsideCodex, false, `${action.id} must be manual-only outside Codex`)
  assert.equal(action.mutatesCloud, false, `${action.id} must not mutate cloud resources`)
  assert.equal(action.runsRuntime, false, `${action.id} must not run runtime actions`)
}

for (const command of spec.allowedReadOnlyCommands) {
  assert.equal(command.capturesTokenValue, false, `${command.id} must not capture token values`)
  assert.equal(command.mutatesCloud, false, `${command.id} must not mutate cloud state`)
  assert.equal(command.runsInference, false, `${command.id} must not run inference`)
}

const renderedCommands = spec.allowedReadOnlyCommands.map((command) => [command.command, ...command.args].join(' '))
assert.equal(renderedCommands.includes('which -a gcloud'), true)
assert.equal(renderedCommands.includes('gcloud info --format=json'), true)
assert.equal(renderedCommands.includes('gcloud auth login'), false)
assert.equal(renderedCommands.includes('gcloud config set account ACCOUNT'), false)
assert.equal(renderedCommands.includes('gcloud config set project reeditpro'), false)
for (const forbiddenPattern of [
  /\bgcloud\s+auth\s+login\b/i,
  /\bgcloud\s+config\s+set\b/i,
  /\bgcloud\s+run\s+deploy\b/i,
  /\bgcloud\s+run\s+jobs\s+execute\b/i,
  /\bgcloud\s+compute\s+instances\s+(create|delete|start|stop)\b/i,
  /\bgcloud\s+services\s+enable\b/i,
  /\bgcloud\s+storage\s+(cp|mv|rm)\b/i,
  /\bdocker\s+/i,
  /\bpsql\b/i,
  /\bfrom_pretrained\b/i,
  /\btorch\./i,
]) {
  assert.equal(
    renderedCommands.some((command) => forbiddenPattern.test(command)),
    false,
    `Allowed command list contains forbidden runtime command: ${forbiddenPattern}`,
  )
}

const cliSource = read(CLI_PATH)
assert.equal(cliSource.includes('spawnSync'), true)
for (const forbiddenSource of [
  'execSync',
  'execFileSync',
  'run deploy',
  'jobs execute',
  'instances create',
  'services enable',
  'storage cp',
  'from_pretrained',
  'modelInferenceRun: true',
]) {
  assert.equal(cliSource.includes(forbiddenSource), false, `CLI source contains forbidden marker: ${forbiddenSource}`)
}

const planOutput = execFileSync('npx', ['tsx', CLI_PATH, '--plan'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const plan = JSON.parse(planOutput)
assert.equal(plan.ok, true)
assert.equal(plan.liveReadOnlyChecksRun, false)
assert.equal(plan.allowedReadOnlyCommands.length, spec.allowedReadOnlyCommands.length)

const liveOutput = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 5,
})
const live = JSON.parse(liveOutput)
assert.equal(live.ok, true)
assert.equal(live.mode, spec.mode)
assert.equal(live.liveReadOnlyChecksRun, true)
assert.equal(live.runtimeGatesAllFalse, true)
assert.equal(live.readyForAnyExternalAgentExecutionNow, false)
assert.equal(live.qwen.readyForExternalAgentExecutionNow, false)
assert.equal(typeof live.gcloud.accessTokenRefreshPassed, 'boolean')
assert.equal(typeof live.gcloud.path, 'string')
assert.equal(Array.isArray(live.gcloud.pathCandidates), true)
assert.equal(typeof live.gcloud.pathCandidateCount, 'number')
assert.equal(live.gcloud.pathCandidateCount >= 1, true)
assert.equal(Array.isArray(live.gcloud.pathToolSearchEntries), true)
assert.equal(typeof live.gcloud.pathPrefersAppleSiliconHomebrew, 'boolean')
assert.equal(typeof live.gcloud.appleSiliconHomebrewPrecedesUsrLocal, 'boolean')
assert.equal(typeof live.gcloud.expectedAppleSiliconHomebrewPath, 'string')
assert.equal(typeof live.gcloud.expectedAppleSiliconHomebrewGcloudPresent, 'boolean')
assert.equal(typeof live.gcloud.usrLocalGcloudPath, 'string')
assert.equal(typeof live.gcloud.usrLocalGcloudPresent, 'boolean')
assert.equal(typeof live.gcloud.installationSdkRoot, 'string')
assert.equal(typeof live.gcloud.globalConfigDir, 'string')
assert.equal(typeof live.gcloud.activeConfigPath, 'string')
assert.equal(typeof live.gcloud.universeDomain, 'string')
assert.equal(typeof live.recommendedNextPrompt, 'string')
assert.equal(Array.isArray(live.manualOnlyRepairActions), true)
assert.equal(live.postRepairCodexVerificationCommand, spec.qwen.postRepairCodexVerificationCommand)
assert.equal(Array.isArray(live.commandSummaries), true)
assert.equal(live.commandSummaries.length > 0, true)
if (!live.gcloud.accessTokenRefreshPassed) {
  assert.equal(typeof live.gcloud.authFailure, 'object')
  assert.equal(live.manualOnlyRepairActions.length, spec.qwen.manualOnlyRepairActions.length)
  assert.equal(live.manualOnlyRepairActions.every((action: { runInsideCodex: boolean }) => action.runInsideCodex === false), true)
}

for (const [flag, value] of Object.entries(live.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ spec, plan, live })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: live.decision,
      mode: live.mode,
      liveReadOnlyChecksRun: live.liveReadOnlyChecksRun,
      gcloudAvailable: live.gcloud.available,
      configuredProject: live.gcloud.configuredProject,
      projectMatches: live.gcloud.projectMatches,
      accessTokenRefreshPassed: live.gcloud.accessTokenRefreshPassed,
      authBlocker: live.qwen.authBlocker,
      runtimeGatesAllFalse: live.runtimeGatesAllFalse,
      recommendedNextPrompt: live.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
