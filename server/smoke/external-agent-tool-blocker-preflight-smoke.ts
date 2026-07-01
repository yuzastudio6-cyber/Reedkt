import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_BLOCKER_PREFLIGHT } from '../../src/backend/mock/mock-external-agent-tool-blocker-preflight'

const ROOT = process.cwd()
const SPEC_PATH = 'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts'
const CLI_PATH = 'server/cli/external-agent-tool-blocker-preflight.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-blocker-preflight-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-blockers:preflight'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-blocker-preflight'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'blockerPreflight'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
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
  'tsx server/cli/external-agent-tool-blocker-preflight.ts',
  'package blocker preflight script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
  'package blocker preflight smoke script mismatch',
)

const spec = EXTERNAL_AGENT_TOOL_BLOCKER_PREFLIGHT
assert.equal(spec.decision, 'external_agent_tool_blocker_preflight_read_only_probe_defined')
assert.equal(spec.mode, 'read_only_external_agent_tool_blocker_preflight')
assert.equal(spec.projectId, 'reeditpro')
assert.equal(spec.qwen.blockerIfFailed, 'local_gcloud_reauthentication_required')
assert.equal(spec.broll.blockerIfFailed, 'gpus_all_regions_quota_zero_or_unverified')
assert.equal(spec.broll.minimumGlobalGpusAllRegionsQuota, 1)
assert.equal(spec.broll.minimumRegionalL4Quota, 1)
assert.equal(spec.allowedReadOnlyCommands.length >= 9, true)

for (const command of spec.allowedReadOnlyCommands) {
  assert.equal(command.capturesTokenValue, false, `${command.id} must not capture token values`)
  assert.equal(command.mutatesCloud, false, `${command.id} must not mutate cloud state`)
  assert.equal(command.runsInference, false, `${command.id} must not run inference`)
}

const renderedCommands = spec.allowedReadOnlyCommands.map((command) => [command.command, ...command.args].join(' '))
for (const forbiddenPattern of [
  /\bgcloud\s+run\s+deploy\b/i,
  /\bgcloud\s+run\s+jobs\s+execute\b/i,
  /\bgcloud\s+compute\s+instances\s+(create|delete|start|stop)\b/i,
  /\bgcloud\s+services\s+enable\b/i,
  /\bgcloud\s+storage\s+(cp|mv|rm)\b/i,
  /\bgcloud\s+auth\s+print-identity-token\b/i,
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
assert.equal(
  cliSource.includes('activeAccountDomain(activeAccount?.rawStdout)'),
  true,
  'CLI must derive active account domain before sanitizing account output',
)
assert.equal(cliSource.includes('spawnSync'), true)
for (const forbiddenSource of [
  'execSync',
  'execFileSync',
  'run deploy',
  'jobs execute',
  'instances create',
  'services enable',
  'storage cp',
  'print-identity-token',
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
assert.equal(live.broll.readyForExternalAgentExecutionNow, false)
assert.equal(Array.isArray(live.commandSummaries), true)
assert.equal(live.commandSummaries.length > 0, true)
assert.equal(typeof live.recommendedNextPrompt, 'string')
if (live.gcloud.activeAccountDomain) {
  assert.equal(live.gcloud.activeAccountDomain.includes('@'), false)
  assert.equal(live.gcloud.activeAccountDomain.includes('<redacted'), false)
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
      qwenBlocker: live.qwen.blocker,
      brollBlocker: live.broll.blocker,
      activeAccountDomainPresent: Boolean(live.gcloud.activeAccountDomain),
      runtimeGatesAllFalse: live.runtimeGatesAllFalse,
      readyForAnyExternalAgentExecutionNow: live.readyForAnyExternalAgentExecutionNow,
      recommendedNextPrompt: live.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
