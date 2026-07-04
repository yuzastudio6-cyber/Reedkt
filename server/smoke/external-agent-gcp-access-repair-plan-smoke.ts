import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'

const ROOT = process.cwd()
const DOC_PATH = 'docs/external-agent-gcp-access-repair-plan.md'
const SPEC_PATH = 'src/backend/mock/mock-external-agent-gcp-access-repair-plan.ts'
const CLI_PATH = 'server/cli/external-agent-gcp-access-repair-plan.ts'
const SMOKE_PATH = 'server/smoke/external-agent-gcp-access-repair-plan-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-gcp-access:repair-plan'
const SMOKE_SCRIPT = 'smoke:external-agent-gcp-access-repair-plan'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentGcpAccessRepairPlan'): string[] {
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
      ['service account key command', /\bgcloud\s+iam\s+service-accounts\s+keys\s+create\b/i],
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

for (const file of [DOC_PATH, SPEC_PATH, CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-gcp-access-repair-plan.ts',
  'package external-agent GCP access repair script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-gcp-access-repair-plan-smoke.ts',
  'package external-agent GCP access repair smoke script mismatch',
)

const spec = EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN
assert.equal(spec.decision, 'external_agent_gcp_access_repair_plan_defined_no_mutation')
assert.equal(spec.mode, 'external_agent_gcp_access_repair_plan_only')
assert.equal(spec.projectId, 'reeditpro')
assert.equal(spec.accountSelection.overrideEnv, 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT')
assert.equal(spec.accountSelection.overrideIndexEnv, 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX')
assert.equal(spec.accountSelection.overrideIndexCliFlag, '--account-index')
assert.equal(spec.accountSelection.overrideIndexCliFlagAlias, '--gcloud-account-index')
assert.equal(spec.accountSelection.mutatesLocalGcloudConfig, false)
assert.equal(spec.accountSelection.printsAccountValue, false)
assert.equal(spec.repairScope.doesNotGrantIam, true)
assert.equal(spec.repairScope.doesNotMutateGcp, true)
assert.equal(spec.repairScope.doesNotAuthorizeRuntimeExecution, true)
assert.equal(
  spec.failureResponsePolicy.ifReadAccessFails,
  'treat it as external GCP access or resource visibility work; do not weaken wrapper gates or mark runtime executable',
)
assert.equal(
  spec.failureResponsePolicy.ifResourcesAreMissing,
  'stop at diagnosis and hand off to the owning infrastructure path; do not create replacement resources from this repair plan',
)
assert.equal(
  spec.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index <redacted-index>',
  ),
  true,
)
assert.equal(
  spec.postRepairVerificationCommands.includes(
    'npm run external-agent-gcp-access:verify -- --account-index <redacted-index>',
  ),
  true,
)
assert.equal(spec.tools.length, 2)

const qwen = spec.tools.find((tool) => tool.toolId === 'qwen2_5_vl_7b_instruct')
assert.ok(qwen)
assert.equal(qwen.blocker, 'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing')
assert.deepEqual(
  qwen.requiredReadPermissions.map((permission) => permission.permission),
  ['run.services.get', 'run.jobs.get'],
)
assert.equal(qwen.likelyMinimalRole, 'roles/run.viewer')
assert.equal(qwen.failureMeaning.includes('Token refresh can pass'), true)
assert.equal(qwen.safeRepairChecklist.includes('ask the GCP owner to confirm the Qwen service and private caller job exist in us-central1'), true)
assert.equal(qwen.unsafeBypasses.includes('do not skip Cloud Run service/job describe checks'), true)
assert.equal(qwen.runtimeExecutionStillRequiresWrapperGate, true)

const broll = spec.tools.find((tool) => tool.toolId === 'ai_video_broll_generation_wan')
assert.ok(broll)
assert.equal(broll.blocker, 'gcloud_account_lacks_compute_quota_read_access')
assert.deepEqual(
  broll.requiredReadPermissions.map((permission) => permission.permission),
  ['compute.projects.get', 'compute.regions.get'],
)
assert.equal(broll.likelyMinimalRole, 'roles/compute.viewer')
assert.equal(broll.failureMeaning.includes('cannot read project or regional Compute quota'), true)
assert.equal(broll.safeRepairChecklist.includes('verify GPUS_ALL_REGIONS and regional NVIDIA_L4_GPUS quota before any VM create path'), true)
assert.equal(broll.unsafeBypasses.includes('do not switch to an always-on GPU instance to bypass no-idle gating'), true)
assert.equal(broll.runtimeExecutionStillRequiresWrapperGate, true)

for (const [flag, value] of Object.entries(spec.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

const doc = read(DOC_PATH)
for (const phrase of [
  '# External Agent GCP Access Repair Plan',
  'run.services.get',
  'run.jobs.get',
  'compute.projects.get',
  'compute.regions.get',
  'roles/run.viewer',
  'roles/compute.viewer',
  '## Failure Meanings',
  '## Safe Repair Checklist',
  'token refresh can pass',
  'not as permission to weaken the wrapper gate',
  'not as permission to create a VM',
  'do not use an always-on GPU instance to bypass no-idle gating',
  'executionAllowedNow',
  'does not grant IAM',
  'does not authorize runtime execution',
  'npm run external-agent-gcloud-account-access:diagnostic',
  'npm run external-agent-gcp-access:verify -- --account-index <redacted-index>',
  'npm run external-agent-tool-blockers:preflight -- --account-index <redacted-index>',
  'npm run external-agent-tool-next-command -- --account-index <redacted-index>',
]) {
  assert.equal(doc.includes(phrase), true, `Repair doc missing phrase: ${phrase}`)
}

const cliOutput = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const cli = JSON.parse(cliOutput)
assert.equal(cli.ok, true)
assert.equal(cli.decision, spec.decision)
assert.equal(cli.runtimeGatesAllFalse, true)
assert.deepEqual(cli.tools, spec.tools)
assert.deepEqual(cli.failureResponsePolicy, spec.failureResponsePolicy)
assert.deepEqual(cli.safeRetryChecklist, spec.safeRetryChecklist)

const forbiddenFindings = scanForbiddenValues({ spec, cli, doc })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: cli.decision,
      mode: cli.mode,
      toolCount: cli.tools.length,
      runtimeGatesAllFalse: cli.runtimeGatesAllFalse,
      recommendedNextPrompt: cli.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
