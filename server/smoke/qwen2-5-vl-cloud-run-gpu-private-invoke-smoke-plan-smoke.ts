import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_cloud_run_gpu_private_invoke_smoke_plan_defined_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_52-PRIVATE-INVOKE-SMOKE-EXECUTE: run controlled private invoke contract smoke, no inference'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['runtime execution true claim', /\b(smokeExecutedNow|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential-looking value', /\b(sk-[A-Za-z0-9]{12,}|hf_[A-Za-z0-9]{12,}|ya29\.[A-Za-z0-9._-]+)/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
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

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'futureIdentityTokenFetchMayBeRequested',
    'futureCloudRunRequestMayBeRequested',
    'smokeExecutedNow',
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'forwardPassRun',
    'inferenceRun',
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
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-plan.md',
  'docs/qwen2-5-vl-7b-private-invoke-auth-reverify-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-transport-adapter.md',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-plan'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-plan.md')
for (const phrase of [
  DECISION,
  '`qwen_inference_disabled_after_contract_check`',
  '`contractSatisfiedForFutureRuntime`',
  '`modelInferenceEnabled`',
  '`serviceRuntimeRequestSent=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'observed service max scale: `3`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const serviceSource = read('server/workers/qwen2_5_vl_cloud_run_gpu/service.py')
for (const phrase of [
  'qwen_inference_disabled_after_contract_check',
  'contractSatisfiedForFutureRuntime',
  'modelInferenceEnabled',
  'MAX_REQUEST_BYTES = 65536',
  'QWEN_INFERENCE_ENABLED',
]) {
  assert.ok(serviceSource.includes(phrase), `Service source missing phrase: ${phrase}`)
}

const plan = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.authReverifyRunId, QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT.runId)
assert.equal(plan.targetService.project, 'reeditpro')
assert.equal(plan.targetService.region, 'us-central1')
assert.equal(plan.targetService.service, 'reeditpro-qwen2-5-vl-l4-worker')
assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.scaleToZeroRequired, true)
assert.equal(plan.selectedRuntime.minInstancesRequired, 0)
assert.equal(plan.selectedRuntime.observedTemplateMaxScale, '1')
assert.equal(plan.selectedRuntime.observedServiceMaxScale, '3')
assert.equal(plan.selectedRuntime.costGuardReviewRequiredBeforeInvoke, true)
assert.equal(plan.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(plan.verifiedPreconditions.authIamReverifyPassed, true)
assert.equal(plan.verifiedPreconditions.identityTokenFetched, false)
assert.equal(plan.verifiedPreconditions.cloudRunInvocationAttempted, false)
assert.equal(plan.futureSmokeShape.backendOnly, true)
assert.equal(plan.futureSmokeShape.allowHealthReadinessGet, true)
assert.equal(plan.futureSmokeShape.allowContractPost, true)
assert.equal(plan.futureSmokeShape.requestPath, '/')
assert.equal(plan.futureSmokeShape.requestMethod, 'POST')
assert.equal(plan.futureSmokeShape.maxBodyBytes, 65536)
assert.equal(plan.futureSmokeShape.expectedHttpStatus, 403)
assert.equal(plan.futureSmokeShape.expectedReason, 'qwen_inference_disabled_after_contract_check')
assert.equal(plan.futureSmokeShape.expectedContractSatisfiedForFutureRuntime, true)
assert.equal(plan.futureSmokeShape.expectedModelInferenceEnabled, false)
assert.equal(plan.futureSmokeShape.expectedRuntimeCanAdvanceNow, false)
assert.equal(plan.requiredRuntimeApprovalForFutureExecution.invocationEnabledNow, true)
assert.equal(plan.requiredRuntimeApprovalForFutureExecution.authReverifyPassed, true)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(plan.runtimeFlags.privateInvokeSmokePlanDefined, true)
assert.equal(plan.runtimeFlags.authIamReverifyPassed, true)
assertFalseRuntimeFlags(plan.runtimeFlags)

const requiredForbiddenSmokeBehavior = [
  'raw_worker_prompt',
  'model_import',
  'model_load',
  'inference',
  'supabase_mutation',
  'credit_mutation',
  'public_unauthenticated_invocation',
  'service_url_value_stored',
  'identity_token_value_stored',
  'beta_unlock',
  'production_unlock',
] as const

for (const blocked of requiredForbiddenSmokeBehavior) {
  assert.ok(
    (plan.forbiddenSmokeBehavior as readonly string[]).includes(blocked),
    `Missing forbidden behavior ${blocked}`,
  )
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen private invoke smoke plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  authReverifyRunId: plan.authReverifyRunId,
  selectedGpu: plan.selectedRuntime.gpu,
  observedServiceMaxScale: plan.selectedRuntime.observedServiceMaxScale,
  expectedHttpStatus: plan.futureSmokeShape.expectedHttpStatus,
  expectedReason: plan.futureSmokeShape.expectedReason,
  identityTokenFetched: plan.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  nextPrompt: plan.nextPrompt,
}, null, 2))
