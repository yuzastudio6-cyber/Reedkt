import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildQwen25PrivateInvokeAuthPreflightStaticReport,
  getQwen25PrivateInvokeAuthPreflightPlan,
  QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS,
  sanitizeQwen25AuthProbeOutput,
} from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight'

const ROOT = process.cwd()
const DECISION = 'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_auth_preflight_runner_defined_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_39-GCLOUD-REAUTH-VERIFY: refresh gcloud auth and run guarded read-only auth preflight, no token/no invocation'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function parseBlock(relativePath: string, label: string) {
  const text = read(relativePath)
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp('```json\\s+' + escaped + '\\n([\\s\\S]*?)\\n```'))
  check(match, `Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1]) as JsonRecord
}

const forbiddenDocPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|iamBindingCreated|dispatchSubmitted|inferenceRun|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenDocPatterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

for (const file of [
  'server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight.ts',
  'server/cli/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight-runner-smoke.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner-change-log.md',
  'package.json'
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight:plan'],
  'tsx server/cli/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight.ts --plan',
  'plan package script mismatch'
)
assert.equal(
  packageJson.scripts?.['qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight'],
  'tsx server/cli/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight.ts',
  'runner package script mismatch'
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight-runner-smoke.ts',
  'smoke package script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner-change-log'
)
const plan = getQwen25PrivateInvokeAuthPreflightPlan()
const staticReport = buildQwen25PrivateInvokeAuthPreflightStaticReport()
const sanitizedActiveAccount = sanitizeQwen25AuthProbeOutput('active_account', 'operator@reeditpro.com\n')
const sanitizedEmptyActiveAccount = sanitizeQwen25AuthProbeOutput('active_account', '')

for (const phrase of [
  DECISION,
  'REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT',
  '`reeditpro`',
  '`us-central1`',
  '`reeditpro-qwen2-5-vl-l4-worker`',
  '`reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`',
  '`gcloud_version`',
  '`cloud_run_service_describe`',
  '`cloud_run_service_iam_policy`',
  '`runtime_service_account_describe`',
  '`project_invoker_policy_read`',
  'The active account probe records only whether an account exists and the account domain.',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.equal(changeLog.decision, DECISION)
assert.equal(changeLog.nextPrompt, NEXT_PROMPT)
assert.equal(plan.defaultMode, 'plan_only_no_gcloud')
assert.equal(plan.executeMode, 'read_only_gcloud_describe_only')
assert.equal(plan.requiredConfirmationEnv, 'REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT')
assert.equal(plan.target.service, 'reeditpro-qwen2-5-vl-l4-worker')
assert.equal(staticReport.status, 'blocked')
assert.deepEqual(staticReport.blockers, ['auth_preflight_not_run'])
assert.equal(sanitizedActiveAccount.includes('operator@reeditpro.com'), false)
assert.equal(sanitizedActiveAccount.includes('active_account_present=true'), true)
assert.equal(sanitizedActiveAccount.includes('active_account_value_stored=false'), true)
assert.equal(sanitizedActiveAccount.includes('active_account_domain=reeditpro.com'), true)
assert.equal(sanitizedEmptyActiveAccount.includes('active_account_present=false'), true)

const planProbeIds = new Set<string>(plan.readOnlyProbeIds)
const changeLogProbeIds = new Set<string>(changeLog.readOnlyProbeIds as string[])
for (const probe of [
  'gcloud_version',
  'active_project',
  'active_account',
  'cloud_run_service_describe',
  'cloud_run_service_iam_policy',
  'runtime_service_account_describe',
  'project_invoker_policy_read'
]) {
  assert.ok(planProbeIds.has(probe), `plan missing probe ${probe}`)
  assert.ok(changeLogProbeIds.has(probe), `change log missing probe ${probe}`)
}

const changeLogRuntimeFlags = changeLog.runtimeFlags as Record<string, unknown>
for (const [key, value] of Object.entries(QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS)) {
  assert.equal(changeLogRuntimeFlags[key], value, `change log runtime flag ${key} mismatch`)
}

for (const key of [
  'tokenOutputPrinted',
  'serviceAccountKeyCreated',
  'identityTokenFetched',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
  'iamBindingCreated',
  'dispatchSubmitted',
  'inferenceRun',
  'supabaseTouched',
  'sqlExecuted',
  'generatedLocalFixturePassedClaimed'
]) {
  assert.equal(QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS[key as keyof typeof QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS], false, `${key} must be false`)
}

const activationSource = read('server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight.ts')
assert.equal(activationSource.includes('REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT'), true)
assert.equal(activationSource.includes('CLOUDSDK_CORE_DISABLE_PROMPTS'), true)
assert.equal(activationSource.includes('summarizeActiveAccountOutput'), true)
const forbiddenCommands = new Set<string>(plan.forbiddenCommands)
for (const forbiddenCommand of [
  'gcloud auth login',
  'gcloud auth print-identity-token',
  'gcloud run services proxy',
  'gcloud run services update',
  'gcloud run services add-iam-policy-binding'
]) {
  assert.ok(forbiddenCommands.has(forbiddenCommand), `Plan must forbid ${forbiddenCommand}`)
}
for (const unexpectedProbe of [
  'print_identity_token',
  'print_access_token',
  'service_update',
  'iam_policy_binding_create',
  'service_proxy',
  'cloud_run_invoke'
]) {
  assert.equal(planProbeIds.has(unexpectedProbe), false, `Probe list must not include ${unexpectedProbe}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner-change-log.md'
]) {
  assertNoForbiddenText(file)
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  defaultMode: plan.defaultMode,
  executeMode: plan.executeMode,
  probeCount: plan.readOnlyProbeIds.length,
  staticReportStatus: staticReport.status,
  identityTokenFetched: QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS.identityTokenFetched,
  cloudRunInvocationAttempted: QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS.cloudRunInvocationAttempted,
  nextPrompt: NEXT_PROMPT
}, null, 2))
