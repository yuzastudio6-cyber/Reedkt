import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { QWEN25_PRIVATE_INVOKE_SMOKE_EXECUTE_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute-result'

const MODE = 'qwen2_5_vl_private_invoke_smoke_execute_result_blocked_before_request'
const DECISION =
  'qwen2_5_vl_private_invoke_smoke_blocked_identity_token_fetch_no_request'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_52-FIX-PRIVATE-INVOKE-SMOKE: fix controlled private invoke smoke blocker, no inference'

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
  ['unsafe request true claim', /\b(cloudRunInvocationAttempted|serviceRuntimeRequestSent|authHeaderCreated|identityTokenFetched|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-execute-result.md')
const runnerSource = read('server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts')
const cliSource = read('server/cli/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }

assert.equal(
  packageJson.scripts?.['qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-execute'],
  'tsx server/cli/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-smoke-execute-result'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-smoke-execute-result-smoke.ts',
)

for (const phrase of [
  MODE,
  DECISION,
  '`qwen25-private-invoke-smoke-20260627T104058`',
  '`qwen25-private-invoke-auth-20260627T101708`',
  '`identity_token_fetch_blocked`',
  '`identityTokenFetched=false`',
  '`identityTokenPrinted=false`',
  '`identityTokenValueStored=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.ok(runnerSource.includes('REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_SMOKE'))
assert.ok(runnerSource.includes('stripProbeRawOutput'))
assert.ok(runnerSource.includes('redacted_service_url POST / with redacted_identity_token'))
assert.ok(cliSource.includes('Token value printed: false'))

const result = QWEN25_PRIVATE_INVOKE_SMOKE_EXECUTE_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.status, 'blocked')
assert.equal(result.decision, DECISION)
assert.equal(result.runId, 'qwen25-private-invoke-smoke-20260627T104058')
assert.equal(result.preflightRunId, 'qwen25-private-invoke-auth-20260627T101708')
assert.deepEqual(result.blockers, ['identity_token_fetch_blocked'])
assert.equal(result.tokenPathFinding.audienceBoundIdentityTokenRequired, true)
assert.equal(result.tokenPathFinding.identityTokenFetched, false)
assert.equal(result.tokenPathFinding.identityTokenPrinted, false)
assert.equal(result.tokenPathFinding.identityTokenValueStored, false)
assert.equal(result.tokenPathFinding.activeUserAudienceTokenBlocked, true)
assert.equal(result.tokenPathFinding.serviceAccountImpersonationAttempted, false)
assert.equal(result.tokenPathFinding.serviceAccountKeyCreated, false)
assert.equal(result.smokeRequest.retryAttempted, false)
assert.equal(result.smokeResponse.received, false)
assert.equal(result.observedCostPosture.selectedGpu, 'nvidia_l4')
assert.equal(result.observedCostPosture.minScaleAnnotationPresent, false)
assert.equal(result.observedCostPosture.templateMaxScale, '1')
assert.equal(result.observedCostPosture.serviceMaxScale, '3')
assert.equal(result.observedCostPosture.costGuardReviewedBeforeInvoke, true)
assert.equal(result.observedCostPosture.gpuInstanceInvokedByThisSmoke, false)
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
  ].includes(key)) {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-execute-result.md',
  'server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen private invoke smoke result data: ${forbiddenDataFindings.join('; ')}`,
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
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
