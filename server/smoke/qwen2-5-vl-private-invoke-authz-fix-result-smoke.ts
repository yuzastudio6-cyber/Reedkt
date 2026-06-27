import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-authz-fix-result'

const MODE = 'qwen2_5_vl_private_invoke_authz_fix_result'
const DECISION =
  'qwen2_5_vl_private_invoke_authz_fixed_blocked_unexpected_404_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_53-PRIVATE-INVOKE-ROUTING-FIX: fix controlled private invoke route/ingress contract response, no inference'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return readFileSync(relativePath, 'utf8')
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

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe inference true claim', /\b(modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe asset true claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
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

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-authz-fix-result.md')
const runnerSource = read('server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }

assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-authz-fix-result'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-authz-fix-result-smoke.ts',
)

for (const phrase of [
  MODE,
  DECISION,
  '`qwen25-private-invoke-smoke-20260627T113052`',
  '`qwen25-private-invoke-smoke-20260627T111828`',
  '`roles/iam.serviceAccountTokenCreator`',
  '`roles/run.invoker`',
  '`identity_token_fetched=true`',
  '`identityTokenFetched=true`',
  '`identityTokenPrinted=false`',
  '`identityTokenValueStored=false`',
  '`cloudRunInvocationAttempted=true`',
  '`serviceRuntimeRequestSent=true`',
  '`private_invoke_response_unexpected`',
  '`blocked_unexpected_runtime_response`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.ok(runnerSource.includes('QWEN2_5_VL_STACK_TOOL_53-PRIVATE-INVOKE-ROUTING-FIX'))
assert.ok(runnerSource.includes('private_invoke_response_unexpected'))
assert.ok(runnerSource.includes('cloud_run_contract_post_blocked'))

const result = QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.status, 'blocked')
assert.equal(result.decision, DECISION)
assert.equal(result.runId, 'qwen25-private-invoke-smoke-20260627T113052')
assert.equal(result.tokenPathFixRunId, 'qwen25-private-invoke-smoke-20260627T111828')
assert.deepEqual(result.blockers, ['private_invoke_response_unexpected'])
assert.equal(result.iamChangesApplied.serviceAccountTokenCreatorBindingAdded, true)
assert.equal(result.iamChangesApplied.cloudRunInvokerBindingAdded, true)
assert.equal(result.iamChangesApplied.broadProjectRoleAdded, false)
assert.equal(result.iamChangesApplied.serviceAccountKeyCreated, false)
assert.equal(result.iamChangesApplied.publicInvokerAdded, false)
assert.equal(result.tokenPathFinding.identityTokenFetched, true)
assert.equal(result.tokenPathFinding.identityTokenPrinted, false)
assert.equal(result.tokenPathFinding.identityTokenValueStored, false)
assert.equal(result.tokenPathFinding.serviceAccountImpersonationAttempted, true)
assert.equal(result.tokenPathFinding.serviceAccountKeyCreated, false)
assert.equal(result.tokenPathFinding.authHeaderCreated, true)
assert.equal(result.smokeRequest.retryAttempted, false)
assert.equal(result.smokeResponse.received, true)
assert.equal(result.smokeResponse.httpStatus, 404)
assert.equal(result.smokeResponse.contractSatisfiedForFutureRuntime, false)
assert.equal(result.smokeResponse.modelInferenceEnabled, false)
assert.equal(result.smokeResponse.runtimeContractExecutesNow, false)
assert.equal(result.smokeResponse.classificationStatus, 'blocked_unexpected_runtime_response')
assert.equal(result.routingFinding.serviceContractReached, false)
assert.equal(result.routingFinding.cloudRunRevisionLogsObserved, false)
assert.equal(result.observedCostPosture.selectedGpu, 'nvidia_l4')
assert.equal(result.observedCostPosture.singleRequestNoRetry, true)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const [key, value] of Object.entries(result.runtimeFlags as JsonRecord)) {
  if ([
    'privateInvokeSmokeRunnerDefined',
    'requiresExplicitExecutionFlag',
    'requiresConfirmationEnv',
    'authReverifyPassed',
    'costGuardReviewedBeforeInvoke',
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
    'serviceAccountImpersonationConfigured',
    'serviceAccountImpersonationAttempted',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'responseClassifiedLocally',
  ].includes(key)) {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-authz-fix-result.md',
  'server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-authz-fix-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen private invoke authz fix result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  runId: result.runId,
  status: result.status,
  blockers: result.blockers,
  identityTokenFetched: result.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  serviceRuntimeRequestSent: result.runtimeFlags.serviceRuntimeRequestSent,
  httpStatus: result.smokeResponse.httpStatus,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
