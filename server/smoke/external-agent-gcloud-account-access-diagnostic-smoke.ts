import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCLOUD_ACCOUNT_ACCESS_DIAGNOSTIC } from '../../src/backend/mock/mock-external-agent-gcloud-account-access-diagnostic'

const ROOT = process.cwd()
const SPEC_PATH = 'src/backend/mock/mock-external-agent-gcloud-account-access-diagnostic.ts'
const CLI_PATH = 'server/cli/external-agent-gcloud-account-access-diagnostic.ts'
const SMOKE_PATH = 'server/smoke/external-agent-gcloud-account-access-diagnostic-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-gcloud-account-access:diagnostic'
const SMOKE_SCRIPT = 'smoke:external-agent-gcloud-account-access-diagnostic'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'gcloudAccountAccessDiagnostic'): string[] {
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
  'tsx server/cli/external-agent-gcloud-account-access-diagnostic.ts',
  'package gcloud account access diagnostic script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-gcloud-account-access-diagnostic-smoke.ts',
  'package gcloud account access diagnostic smoke script mismatch',
)

const spec = EXTERNAL_AGENT_GCLOUD_ACCOUNT_ACCESS_DIAGNOSTIC
assert.equal(spec.decision, 'external_agent_gcloud_account_access_diagnostic_read_only_probe_defined')
assert.equal(spec.mode, 'read_only_external_agent_gcloud_account_access_diagnostic')
assert.equal(spec.projectId, 'reeditpro')
assert.deepEqual(spec.qwen.requiredReadAccess, ['run.services.get', 'run.jobs.get'])
assert.deepEqual(spec.broll.requiredReadAccess, ['compute.projects.get', 'compute.regions.get'])
assert.equal(spec.broll.minimumGlobalGpusAllRegionsQuota, 1)
assert.equal(spec.broll.minimumRegionalL4Quota, 1)
assert.equal(spec.postRepairCodexVerificationCommand, 'npm run external-agent-tool-blockers:preflight')

for (const command of spec.allowedReadOnlyCommands) {
  assert.equal(command.capturesTokenValue, false, `${command.id} must not capture token values`)
  assert.equal(command.mutatesCloud, false, `${command.id} must not mutate cloud state`)
  assert.equal(command.runsInference, false, `${command.id} must not run inference`)
}

const renderedCommands = spec.allowedReadOnlyCommands.map((command) => [command.command, ...command.args].join(' '))
assert.equal(renderedCommands.includes('gcloud auth list --format=json'), true)
assert.equal(renderedCommands.includes('gcloud config get-value project'), true)
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
assert.equal(cliSource.includes('suppressStdout: true'), true)
assert.equal(cliSource.includes('perAccountGcloudArgs'), true)
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
assert.equal(Array.isArray(plan.perAccountReadOnlyProbeTemplates), true)

const liveOutput = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 8,
})
const live = JSON.parse(liveOutput)
assert.equal(live.ok, true)
assert.equal(live.mode, spec.mode)
assert.equal(live.liveReadOnlyChecksRun, true)
assert.equal(live.runtimeGatesAllFalse, true)
assert.equal(live.readyForAnyExternalAgentExecutionNow, false)
assert.equal(typeof live.gcloud.path, 'string')
assert.equal(typeof live.gcloud.projectMatches, 'boolean')
assert.equal(typeof live.accountCount, 'number')
assert.equal(Array.isArray(live.accountDiagnostics), true)
assert.equal(live.accountDiagnostics.length, live.accountCount)
assert.equal(typeof live.qwenReadyAccountCount, 'number')
assert.equal(typeof live.brollQuotaReadAccountCount, 'number')
assert.equal(typeof live.brollQuotaReadyAccountCount, 'number')
assert.equal(typeof live.anyAccountReadyForBoth, 'boolean')
assert.equal(live.postRepairCodexVerificationCommand, spec.postRepairCodexVerificationCommand)

for (const account of live.accountDiagnostics as Array<{
  accountIndex: number
  accountRedacted: string
  accountDomain?: string
  tokenRefreshPassed: boolean
  qwenReadAccessPassed: boolean
  brollQuotaReadAccessPassed: boolean
  brollQuotaSufficient: boolean
  blockers: { token: string; qwen: string; broll: string }
}>) {
  assert.equal(typeof account.accountIndex, 'number')
  assert.equal(account.accountRedacted, '<redacted email>')
  assert.equal(typeof account.tokenRefreshPassed, 'boolean')
  assert.equal(typeof account.qwenReadAccessPassed, 'boolean')
  assert.equal(typeof account.brollQuotaReadAccessPassed, 'boolean')
  assert.equal(typeof account.brollQuotaSufficient, 'boolean')
  assert.equal(typeof account.blockers.token, 'string')
  assert.equal(typeof account.blockers.qwen, 'string')
  assert.equal(typeof account.blockers.broll, 'string')
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
      accountCount: live.accountCount,
      qwenReadyAccountCount: live.qwenReadyAccountCount,
      brollQuotaReadAccountCount: live.brollQuotaReadAccountCount,
      brollQuotaReadyAccountCount: live.brollQuotaReadyAccountCount,
      anyAccountReadyForBoth: live.anyAccountReadyForBoth,
      runtimeGatesAllFalse: live.runtimeGatesAllFalse,
      recommendedNextPrompt: live.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
