import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-execute-qwen.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execute-qwen-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-execute-qwen'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-execute-qwen'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION'
const ACCOUNT_OVERRIDE_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT'
const ACCOUNT_OVERRIDE_INDEX_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX'

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

function scanForbiddenValues(value: unknown, prefix = 'externalAgentQwenExecute'): string[] {
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
  'tsx server/cli/external-agent-tool-execute-qwen.ts',
  'package external-agent Qwen execute script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execute-qwen-smoke.ts',
  'package external-agent Qwen execute smoke script mismatch',
)

const source = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  'external-agent-tool-execution-gate.ts',
  'external-agent-tool-next-command.ts',
  'external_agent_qwen_execution_preflight_only_result',
  'preflightOnlyCommand',
  '--preflight-only',
  'external_agent_qwen_execution_live_gate_blocked',
  'validateLiveGate',
  'summarizeLiveGate',
  'live_execution_gate_execution_allowed_now_false',
  'qwenBoundedExecutionCommand',
  'qwenExternalAgentExecutionCommand',
  ACCOUNT_OVERRIDE_ENV,
  ACCOUNT_OVERRIDE_INDEX_ENV,
  '--account-index',
  '--gcloud-account-index',
  'CLOUDSDK_CORE_ACCOUNT: accountOverride',
  'qwenAccessRepairHint',
  'external-agent-gcp-access:repair-plan',
  'parseJsonOutput',
  "trimmed.indexOf('{')",
  "trimmed.lastIndexOf('}')",
  'runtimeRunNow: false',
  'generatedAssetsCreated: false',
  'generatedLocalFixturePassedClaimed: false',
]) {
  assert.equal(source.includes(required), true, `Wrapper missing ${required}`)
}
for (const forbidden of ['docker ', 'psql', 'createdb', 'dropdb', 'supabase ', 'from_pretrained', 'torch.']) {
  assert.equal(source.includes(forbidden), false, `Wrapper must not include runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'external_agent_qwen_execution_static_guard')
assert.equal(staticReport.executeRequired, true)
assert.equal(staticReport.preflightOnlyCommand, 'npm run external-agent-tool-execute-qwen -- --preflight-only --json')
assert.equal(staticReport.confirmationEnv, CONFIRM_ENV)
assert.equal(staticReport.confirmationEnvRequiredValue, 'true')
assert.equal(staticReport.gcloudAccountOverrideEnv, ACCOUNT_OVERRIDE_ENV)
assert.equal(typeof staticReport.gcloudAccountOverrideProvided, 'boolean')
assert.equal(staticReport.gcloudAccountOverrideIndexEnv, ACCOUNT_OVERRIDE_INDEX_ENV)
assert.equal(staticReport.gcloudAccountOverrideIndexCliFlag, '--account-index')
assert.equal(staticReport.gcloudAccountOverrideIndexCliFlagAlias, '--gcloud-account-index')
assert.equal(typeof staticReport.gcloudAccountOverrideIndexProvided, 'boolean')
assert.equal(typeof staticReport.gcloudAccountOverrideResolved, 'boolean')
assert.equal(staticReport.gcloudAccountOverrideMutatesLocalConfig, false)
assertQwenAccessRepair(staticReport)
assert.deepEqual(
  staticReport.canonicalCommand,
  EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenExternalAgentExecutionCommand,
)
assert.deepEqual(
  staticReport.delegatedBoundedCommand,
  EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenBoundedExecutionCommand,
)
assert.equal(staticReport.runtimeRunNow, false)
assert.equal(staticReport.cloudRunJobExecuted, false)
assert.equal(staticReport.modelInferenceRun, false)
assert.equal(staticReport.generatedAssetsCreated, false)
assert.equal(staticReport.supabaseTouched, false)
assert.equal(staticReport.sqlExecuted, false)
assert.equal(staticReport.creditMutationCreated, false)
assert.equal(staticReport.betaUnlocked, false)
assert.equal(staticReport.productionUnlocked, false)
assert.equal(staticReport.generatedLocalFixturePassedClaimed, false)

const invalidCliIndexReport = runCli(['--account-index=0', '--json'])
assert.equal(invalidCliIndexReport.mode, 'external_agent_qwen_execution_static_guard')
assert.equal(invalidCliIndexReport.gcloudAccountOverrideIndexProvided, true)
assert.equal(invalidCliIndexReport.gcloudAccountOverrideIndexSource, 'cli')
assert.equal(invalidCliIndexReport.gcloudAccountOverrideResolved, false)
assert.equal(invalidCliIndexReport.gcloudAccountOverrideResolutionFailure, 'invalid_account_index')
assert.equal(invalidCliIndexReport.gcloudAccountOverrideMutatesLocalConfig, false)

const preflightOnly = runCli(['--preflight-only', '--json'])
assert.equal(preflightOnly.mode, 'external_agent_qwen_execution_preflight_only_result')
assert.equal(typeof preflightOnly.ok, 'boolean')
assert.equal(typeof preflightOnly.status, 'string')
assert.equal(Array.isArray(preflightOnly.blockers), true)
assert.equal(preflightOnly.confirmationEnv, CONFIRM_ENV)
assert.equal(preflightOnly.confirmationEnvRequiredValue, 'true')
assert.equal(typeof preflightOnly.liveGate, 'object')
assert.equal(typeof preflightOnly.nextCommand, 'object')
assert.equal(typeof preflightOnly.wouldDelegateIfExecuteConfirmed, 'boolean')
assert.deepEqual(
  preflightOnly.delegatedBoundedCommand,
  EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenBoundedExecutionCommand,
)
assertQwenAccessRepair(preflightOnly)
assert.equal(preflightOnly.runtimeRunNow, false)
assert.equal(preflightOnly.cloudRunJobExecuted, false)
assert.equal(preflightOnly.modelInferenceRun, false)
assert.equal(preflightOnly.generatedAssetsCreated, false)
assert.equal(preflightOnly.supabaseTouched, false)
assert.equal(preflightOnly.sqlExecuted, false)
assert.equal(preflightOnly.creditMutationCreated, false)
assert.equal(preflightOnly.betaUnlocked, false)
assert.equal(preflightOnly.productionUnlocked, false)
assert.equal(preflightOnly.generatedLocalFixturePassedClaimed, false)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'external_agent_qwen_execution_confirmation_blocked')
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])
assert.equal(confirmationBlocked.gcloudAccountOverrideEnv, ACCOUNT_OVERRIDE_ENV)
assert.equal(typeof confirmationBlocked.gcloudAccountOverrideProvided, 'boolean')
assert.equal(confirmationBlocked.gcloudAccountOverrideIndexEnv, ACCOUNT_OVERRIDE_INDEX_ENV)
assert.equal(typeof confirmationBlocked.gcloudAccountOverrideIndexProvided, 'boolean')
assert.equal(typeof confirmationBlocked.gcloudAccountOverrideResolved, 'boolean')
assert.equal(confirmationBlocked.gcloudAccountOverrideMutatesLocalConfig, false)
assertQwenAccessRepair(confirmationBlocked)
assert.equal(confirmationBlocked.runtimeRunNow, false)
assert.equal(confirmationBlocked.cloudRunJobExecuted, false)
assert.equal(confirmationBlocked.modelInferenceRun, false)
assert.equal(confirmationBlocked.generatedAssetsCreated, false)
assert.equal(confirmationBlocked.supabaseTouched, false)
assert.equal(confirmationBlocked.sqlExecuted, false)
assert.equal(confirmationBlocked.creditMutationCreated, false)
assert.equal(confirmationBlocked.betaUnlocked, false)
assert.equal(confirmationBlocked.productionUnlocked, false)
assert.equal(confirmationBlocked.generatedLocalFixturePassedClaimed, false)

const forbiddenFindings = scanForbiddenValues({ staticReport, preflightOnly, confirmationBlocked })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_qwen_execution_wrapper_smoke',
      staticGuardMode: staticReport.mode,
      preflightOnlyMode: preflightOnly.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      confirmationEnv: CONFIRM_ENV,
      delegatedCommand: EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenBoundedExecutionCommand.args.join(' '),
      runtimeRunNow: false,
      generatedAssetsCreated: false,
      generatedLocalFixturePassedClaimed: false,
    },
    null,
    2,
  ),
)

function assertQwenAccessRepair(report: Record<string, unknown>) {
  const repair = report.gcpAccessRepair as {
    command?: string
    blocker?: string
    requiredReadPermissions?: Array<{ permission: string }>
    likelyMinimalRole?: string
    verificationCommand?: string
    mutatesGcp?: boolean
    authorizesRuntimeExecution?: boolean
  }
  const qwenRepair = EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.tools.find(
    (tool) => tool.toolId === 'qwen2_5_vl_7b_instruct',
  )

  assert.equal(repair.command, 'npm run external-agent-gcp-access:repair-plan')
  assert.equal(repair.blocker, qwenRepair?.blocker)
  assert.deepEqual(
    repair.requiredReadPermissions?.map((permission) => permission.permission),
    ['run.services.get', 'run.jobs.get'],
  )
  assert.equal(repair.likelyMinimalRole, 'roles/run.viewer')
  assert.equal(repair.verificationCommand, qwenRepair?.verificationCommand)
  assert.equal(repair.mutatesGcp, false)
  assert.equal(repair.authorizesRuntimeExecution, false)
}
