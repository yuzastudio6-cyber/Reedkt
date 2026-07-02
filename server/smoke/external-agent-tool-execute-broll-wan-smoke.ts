import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-execute-broll-wan.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execute-broll-wan-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-execute-broll-wan'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-execute-broll-wan'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function runCli(args: string[] = []) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 4,
    env: {
      ...process.env,
      [CONFIRM_ENV]: '',
    },
  })

  return JSON.parse(output) as Record<string, unknown>
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentBrollExecute'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
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

for (const file of [CLI_PATH, SMOKE_PATH, 'package.json', 'src/backend/mock/mock-external-agent-tool-next-command.ts']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-execute-broll-wan.ts',
  'package external-agent B-roll execute script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execute-broll-wan-smoke.ts',
  'package external-agent B-roll execute smoke script mismatch',
)

const source = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  'ai-video-broll-wan-gpu-global-quota-verify.ts',
  'ai-video-broll-wan-fast-cache-readiness-check.ts',
  'broll_gpus_all_regions_quota_not_sufficient',
  'broll_vm_lifecycle_requires_future_no_idle_execute_prompt',
  'parseJsonOutput',
  'runtimeRunNow: false',
  'computeVmCreated: false',
  'modelInferenceRun: false',
  'generatedAssetsCreated: false',
  'generatedLocalFixturePassedClaimed: false',
]) {
  assert.equal(source.includes(required), true, `B-roll wrapper missing ${required}`)
}
for (const forbidden of [
  'compute instances create',
  'compute instances delete',
  'ssh ',
  'docker ',
  'psql',
  'createdb',
  'dropdb',
  'supabase ',
  'from_pretrained',
  'torch.',
]) {
  assert.equal(source.includes(forbidden), false, `B-roll wrapper must not include runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'external_agent_broll_wan_execution_static_guard')
assert.equal(staticReport.executeRequired, true)
assert.equal(staticReport.confirmationEnv, CONFIRM_ENV)
assert.equal(staticReport.confirmationEnvRequiredValue, 'true')
assert.deepEqual(
  staticReport.canonicalCommand,
  EXTERNAL_AGENT_TOOL_NEXT_COMMAND.brollWanExternalAgentProofCommand,
)
assert.equal(staticReport.runtimeRunNow, false)
assert.equal(staticReport.computeVmCreated, false)
assert.equal(staticReport.dockerRun, false)
assert.equal(staticReport.modelImportRun, false)
assert.equal(staticReport.modelInferenceRun, false)
assert.equal(staticReport.generatedVideoCreated, false)
assert.equal(staticReport.generatedAssetsCreated, false)
assert.equal(staticReport.supabaseTouched, false)
assert.equal(staticReport.sqlExecuted, false)
assert.equal(staticReport.creditMutationCreated, false)
assert.equal(staticReport.betaUnlocked, false)
assert.equal(staticReport.productionUnlocked, false)
assert.equal(staticReport.generatedLocalFixturePassedClaimed, false)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'external_agent_broll_wan_execution_confirmation_blocked')
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])
assert.equal(confirmationBlocked.runtimeRunNow, false)
assert.equal(confirmationBlocked.computeVmCreated, false)
assert.equal(confirmationBlocked.modelInferenceRun, false)
assert.equal(confirmationBlocked.generatedAssetsCreated, false)
assert.equal(confirmationBlocked.supabaseTouched, false)
assert.equal(confirmationBlocked.sqlExecuted, false)
assert.equal(confirmationBlocked.creditMutationCreated, false)
assert.equal(confirmationBlocked.betaUnlocked, false)
assert.equal(confirmationBlocked.productionUnlocked, false)
assert.equal(confirmationBlocked.generatedLocalFixturePassedClaimed, false)

const forbiddenFindings = scanForbiddenValues({ staticReport, confirmationBlocked })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_broll_wan_execution_wrapper_smoke',
      staticGuardMode: staticReport.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      confirmationEnv: CONFIRM_ENV,
      runtimeRunNow: false,
      computeVmCreated: false,
      generatedAssetsCreated: false,
      generatedLocalFixturePassedClaimed: false,
    },
    null,
    2,
  ),
)
