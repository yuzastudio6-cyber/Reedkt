import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_VERIFY } from '../../src/backend/mock/mock-external-agent-gcp-access-verify'

const ROOT = process.cwd()
const SPEC_PATH = 'src/backend/mock/mock-external-agent-gcp-access-verify.ts'
const CLI_PATH = 'server/cli/external-agent-gcp-access-verify.ts'
const SMOKE_PATH = 'server/smoke/external-agent-gcp-access-verify-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-gcp-access:verify'
const SMOKE_SCRIPT = 'smoke:external-agent-gcp-access-verify'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentGcpAccessVerify'): string[] {
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
      ['iam mutation command', /\bgcloud\s+projects\s+add-iam-policy-binding\b/i],
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
  'tsx server/cli/external-agent-gcp-access-verify.ts',
  'package external-agent GCP access verify script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-gcp-access-verify-smoke.ts',
  'package external-agent GCP access verify smoke script mismatch',
)

const spec = EXTERNAL_AGENT_GCP_ACCESS_VERIFY
assert.equal(spec.decision, 'external_agent_gcp_access_verify_read_only_probe_defined')
assert.equal(spec.mode, 'read_only_external_agent_gcp_access_verify')
assert.equal(spec.projectId, 'reeditpro')
assert.deepEqual(spec.qwen.requiredReadPermissions, ['run.services.get', 'run.jobs.get'])
assert.deepEqual(spec.broll.requiredReadPermissions, ['compute.projects.get', 'compute.regions.get'])
assert.equal(spec.accountSelection.overrideIndexCliFlag, '--account-index')
assert.equal(spec.accountSelection.overrideIndexCliFlagAlias, '--gcloud-account-index')
assert.equal(spec.requiredRepairPlanCommand, 'npm run external-agent-gcp-access:repair-plan')
assert.equal(spec.livePreflightCommand, 'npm run external-agent-tool-blockers:preflight')
assert.equal(spec.liveNextCommand, 'npm run external-agent-tool-next-command')
assert.equal(spec.accountAccessDiagnosticCommand, 'npm run external-agent-gcloud-account-access:diagnostic')

for (const [flag, value] of Object.entries(spec.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

const source = read(CLI_PATH)
for (const required of [
  'server/cli/external-agent-tool-blocker-preflight.ts',
  'server/cli/external-agent-tool-next-command.ts',
  'server/cli/external-agent-gcloud-account-access-diagnostic.ts',
  'allRequiredReadAccessVerified',
  'accountAccessDiagnostic',
  'wrapperMayBeCalledAfterConfirmation',
  'runtimeGatesAllFalse',
  '--account-index',
  '--gcloud-account-index',
  'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX',
]) {
  assert.equal(source.includes(required), true, `Verifier missing ${required}`)
}
for (const forbidden of [
  'gcloud projects add-iam-policy-binding',
  'run deploy',
  'jobs execute',
  'compute instances create',
  'docker ',
  'from_pretrained',
  'torch.',
]) {
  assert.equal(source.includes(forbidden), false, `Verifier must not contain runtime marker: ${forbidden}`)
}

const cliOutput = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 16,
})
const cli = JSON.parse(cliOutput)
assert.equal(cli.ok, true)
assert.equal(cli.decision, spec.decision)
assert.equal(cli.mode, spec.mode)
assert.equal(cli.liveReadOnlyChecksRun, true)
assert.equal(typeof cli.qwen.readAccessPassed, 'boolean')
assert.equal(typeof cli.qwen.wrapperMayBeCalledAfterConfirmation, 'boolean')
assert.equal(typeof cli.broll.quotaReadAccessPassed, 'boolean')
assert.equal(typeof cli.broll.quotaSufficientForOneL4Vm, 'boolean')
assert.equal(typeof cli.broll.wrapperMayBeCalledAfterConfirmation, 'boolean')
assert.equal(typeof cli.nextCommand.executionAllowedNow, 'boolean')
assert.equal(typeof cli.allRequiredReadAccessVerified, 'boolean')
assert.equal(cli.readyForAnyExternalAgentExecutionNow, cli.nextCommand.executionAllowedNow)
assert.equal(cli.runtimeGatesAllFalse, true)
if (!cli.allRequiredReadAccessVerified) {
  assert.equal(typeof cli.accountAccessDiagnostic.ok, 'boolean')
  assert.equal(typeof cli.accountAccessDiagnostic.accountCount, 'number')
  assert.equal(typeof cli.accountAccessDiagnostic.qwenReadyAccountCount, 'number')
  assert.equal(typeof cli.accountAccessDiagnostic.brollQuotaReadAccountCount, 'number')
  assert.equal(typeof cli.accountAccessDiagnostic.brollQuotaReadyAccountCount, 'number')
  assert.equal(typeof cli.accountAccessDiagnostic.anyAccountReadyForBoth, 'boolean')
  assert.equal(typeof cli.accountAccessDiagnostic.recommendedNextPrompt, 'string')
}

const forbiddenFindings = scanForbiddenValues({ spec, cli })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: cli.decision,
      mode: cli.mode,
      qwenReadAccessPassed: cli.qwen.readAccessPassed,
      brollQuotaReadAccessPassed: cli.broll.quotaReadAccessPassed,
      brollQuotaSufficientForOneL4Vm: cli.broll.quotaSufficientForOneL4Vm,
      allRequiredReadAccessVerified: cli.allRequiredReadAccessVerified,
      accountAccessDiagnostic: cli.accountAccessDiagnostic,
      readyForAnyExternalAgentExecutionNow: cli.readyForAnyExternalAgentExecutionNow,
      runtimeGatesAllFalse: cli.runtimeGatesAllFalse,
      recommendedNextPrompt: cli.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
