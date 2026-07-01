import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_AUTH_REFRESH_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_auth_refresh_blocked_reauthentication_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(serviceUpdateAttempted|cpuCallerJobExecuted|serviceIdentityTokenFetched|authHeaderCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
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

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-result.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md',
)
for (const phrase of [
  DECISION,
  'access token refresh: blocked',
  'service describe: blocked',
  'job describe: blocked',
  '`gcloud_reauthentication_required`',
  '`authRefreshResultRecorded=true`',
  '`accessTokenRefreshPassed=false`',
  '`manualInteractiveAuthRequired=true`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_AUTH_REFRESH_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_RESULT.decision,
)
assert.equal(result.authRefreshSummary.localGcloudBinaryFound, true)
assert.equal(result.authRefreshSummary.projectConfigured, true)
assert.equal(result.authRefreshSummary.activeAccountConfigured, true)
assert.equal(result.authRefreshSummary.accessTokenRefreshAttempted, true)
assert.equal(result.authRefreshSummary.accessTokenRefreshPassed, false)
assert.equal(result.authRefreshSummary.serviceDescribeAttempted, true)
assert.equal(result.authRefreshSummary.serviceDescribePassed, false)
assert.equal(result.authRefreshSummary.jobDescribeAttempted, true)
assert.equal(result.authRefreshSummary.jobDescribePassed, false)
assert.equal(result.authRefreshSummary.manualInteractiveAuthRequired, true)
assert.equal(result.authRefreshSummary.tokenValuePrinted, false)
assert.equal(result.authRefreshSummary.tokenValueStored, false)
assert.equal(result.authRefreshSummary.rawGcloudOutputStored, false)

for (const [key, value] of Object.entries(result.runtimeFlags)) {
  if ([
    'authRefreshResultRecorded',
    'gcloudInstalled',
    'projectConfigured',
    'activeAccountConfigured',
    'accessTokenRefreshAttempted',
    'serviceDescribeAttempted',
    'jobDescribeAttempted',
    'manualInteractiveAuthRequired',
  ].includes(key)) {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must be false`)
  }
}

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in private inference auth refresh result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  accessTokenRefreshPassed: result.authRefreshSummary.accessTokenRefreshPassed,
  serviceDescribePassed: result.authRefreshSummary.serviceDescribePassed,
  jobDescribePassed: result.authRefreshSummary.jobDescribePassed,
  inferenceRun: result.runtimeFlags.inferenceRun,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  nextPrompt: result.nextPrompt,
}, null, 2))
