import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-plan'
import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_transport_planned_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_36-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG: define backend-only private invocation config contract, no invocation'

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

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(cloudRunInvocationAttempted|serviceRuntimeRequestSent|identityTokenFetched|gcloudCommandRun|iamBindingCreated|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential-looking value', /\b(api[_-]?key|hf[_-]?token|access[_-]?token|service[_-]?role)\b/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i]
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenTextPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenValuePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertAllFalse(flags: JsonRecord, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-plan.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md',
  'package.json'
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-plan-smoke.ts',
  'package script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan-change-log'
)
const plan = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN

for (const phrase of [
  DECISION,
  'reeditpro-qwen2-5-vl-l4-worker',
  '`us-central1`',
  '`1 x nvidia-l4`',
  '`internal-and-cloud-load-balancing`',
  'Service URL | redacted and backend-only',
  'Google-signed identity token',
  'serverless auth header',
  '`privateInvokePlanDefined=true`',
  '`serviceUrlStoredInRepo=false`',
  '`cloudRunInvocationAttempted=false`',
  '`identityTokenFetched=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.equal(plan.decision, DECISION)
assert.equal(changeLog.decision, DECISION)
assert.equal(plan.upstreamAdapterDecision, QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER.decision)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(changeLog.nextPrompt, NEXT_PROMPT)
assert.equal(plan.targetService.project, 'reeditpro')
assert.equal(plan.targetService.region, 'us-central1')
assert.equal(plan.targetService.service, 'reeditpro-qwen2-5-vl-l4-worker')
assert.equal(plan.targetService.gpu, 'nvidia-l4')
assert.equal(plan.targetService.minInstances, 0)
assert.equal(plan.targetService.maxInstances, 1)
assert.equal(plan.targetService.publicUnauthenticatedAccess, false)
assert.equal(plan.targetService.ingress, 'internal-and-cloud-load-balancing')
assert.equal(plan.targetService.serviceUrlStoredInRepo, false)
assert.equal(plan.targetService.serviceUrlResolvedByBackendOnly, true)

assert.equal(plan.futureRequestShape.method, 'POST')
assert.equal(plan.futureRequestShape.path, 'root_service_handler')
assert.equal(plan.futureRequestShape.maxBodyBytes, 65536)
assert.equal(plan.futureRequestShape.schemaVersion, 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1')
assert.equal(plan.futureRequestShape.retriesEnabledNow, false)

for (const requirement of [
  'backend_controlled_runtime',
  'minimal_cloud_run_invoker_permission',
  'runtime_google_signed_identity_token',
  'audience_matches_receiving_service_or_custom_audience',
  'serverless_auth_header',
  'no_checked_in_keys',
  'no_frontend_tokens',
  'no_unauthenticated_access'
]) {
  assert.ok(plan.futureAuthRequirements.includes(requirement), `missing auth requirement ${requirement}`)
  assert.ok((changeLog.futureAuthRequirements as string[]).includes(requirement), `change log missing ${requirement}`)
}

for (const bypass of [
  'direct_frontend_invocation',
  'unauthenticated_invocation',
  'public_ingress_relaxation',
  'stored_service_account_keys',
  'checked_in_tokens_or_credentials',
  'signed_url_source_of_truth_payloads',
  'public_url_media_inputs',
  'raw_prompt_payloads',
  'generic_mock_dispatch_completion_substitution',
  'retry_without_idempotency',
  'credit_spend_without_verified_response_handling'
]) {
  assert.ok(plan.blockedBypasses.includes(bypass), `missing blocked bypass ${bypass}`)
  assert.ok((changeLog.blockedBypasses as string[]).includes(bypass), `change log missing bypass ${bypass}`)
}

assert.equal(plan.runtimeFlags.privateInvokePlanDefined, true)
assert.equal(plan.runtimeFlags.targetServiceRecorded, true)
assert.equal(plan.runtimeFlags.idTokenAudienceRequirementRecorded, true)
assert.equal(plan.runtimeFlags.ingressRequirementRecorded, true)
assert.equal(plan.runtimeFlags.iamInvokerRequirementRecorded, true)

const falseRuntimeFlags = [
  'serviceUrlStoredInRepo',
  'gcloudCommandRun',
  'iamBindingCreated',
  'identityTokenFetched',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
  'dispatchSubmitted',
  'modelImportRun',
  'modelLoadRun',
  'vllmEngineInitialized',
  'promptProcessed',
  'forwardPassRun',
  'inferenceRun',
  'providerCallsMade',
  'workersDispatched',
  'supabaseTouched',
  'sqlExecuted',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed'
]
assertAllFalse(plan.runtimeFlags as JsonRecord, falseRuntimeFlags)
assertAllFalse(changeLog.runtimeFlags as JsonRecord, falseRuntimeFlags)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-plan.ts'
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(forbiddenDataFindings, [], `Forbidden values in private invoke plan data: ${forbiddenDataFindings.join('; ')}`)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  service: plan.targetService.service,
  region: plan.targetService.region,
  gpu: plan.targetService.gpu,
  minInstances: plan.targetService.minInstances,
  maxInstances: plan.targetService.maxInstances,
  serviceUrlStoredInRepo: plan.targetService.serviceUrlStoredInRepo,
  gcloudCommandRun: plan.runtimeFlags.gcloudCommandRun,
  identityTokenFetched: plan.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2))
