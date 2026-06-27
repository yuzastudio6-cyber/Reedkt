import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_EXECUTE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-execute-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-plan'

const ROOT = process.cwd()
const MODE = 'qwen2_5_vl_approved_fixture_inference_smoke_execute_result'
const DECISION =
  'qwen2_5_vl_approved_fixture_inference_smoke_attempt_blocked_vllm_kv_cache_memory'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58C-APPROVED-FIXTURE-INFERENCE-SMOKE-FIX: tune Qwen fixture inference memory envelope after failed L4 smoke, no generated assets/no beta'

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
  ['unsafe runtime true claim', /\b(vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|metadataOutputCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(approvedFixtureInferenceSmokePassed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'serviceUrlValueStored',
    'audienceValueStored',
    'identityTokenPrinted',
    'identityTokenValueStored',
    'vllmEngineInitialized',
    'promptProcessed',
    'forwardPassRun',
    'inferenceRun',
    'metadataOutputCreated',
    'providerCallsMade',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
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
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-execute-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-plan.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-deploy-result.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-execute-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-execute-result-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-approved-fixture-inference-smoke-execute-result'],
  'tsx server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-execute-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-execute-result.md')
for (const phrase of [
  DECISION,
  '`qwen25-approved-fixture-smoke-20260627t1756z`',
  '`reeditpro-qwen2-5-vl-private-caller-f2xtb`',
  '`reeditpro-qwen2-5-vl-l4-worker-00006-rr8`',
  '`reeditpro-qwen2-5-vl-l4-worker-00007-kpp`',
  'NVIDIA L4',
  'observed HTTP status: `500`',
  'CPU caller exit code: `3`',
  '`vllm_kv_cache_memory_exhausted_before_inference`',
  '`100% Completed | 5/5`',
  '`15.6269 GiB`',
  '`-0.96 GiB`',
  '`approvedFixtureInferenceSmokeAttempted=true`',
  '`approvedFixtureInferenceSmokePassed=false`',
  '`temporaryFixtureInferenceServiceRestored=true`',
  '`serviceRestoredFailClosed=true`',
  '`modelLoadAttempted=true`',
  '`modelLoadCompleted=true`',
  '`vllmEngineInitialized=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_EXECUTE_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamApprovedFixtureInferenceSmokePlanDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN.decision,
)
assert.equal(
  result.upstreamApprovedFixtureInferenceServiceDeployDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT.decision,
)
assert.equal(result.attempt.selectedGpu, 'nvidia_l4')
assert.equal(result.attempt.expectedHttpStatus, 200)
assert.equal(result.attempt.observedHttpStatus, 500)
assert.equal(result.attempt.cpuCallerExitCode, 3)
assert.equal(result.attempt.fixtureInferenceSmokePassed, false)
assert.equal(result.attempt.failureClass, 'vllm_kv_cache_memory_exhausted_before_inference')
assert.equal(result.temporaryServiceGateDelta.fixtureInferenceEnabledOnlyForSmoke, true)
assert.equal(result.temporaryServiceGateDelta.inferenceEnabledOnlyForSmoke, true)
assert.equal(result.temporaryServiceGateDelta.modelDownloadsEnabled, false)
assert.equal(result.temporaryServiceGateDelta.serviceUrlValueStored, false)
assert.equal(result.vllmFailureEvidence.checkpointShardsLoadedPercent, 100)
assert.equal(result.vllmFailureEvidence.modelLoadCompleted, true)
assert.equal(result.vllmFailureEvidence.availableKvCacheMemoryGiB, -0.96)
assert.equal(result.vllmFailureEvidence.promptProcessed, false)
assert.equal(result.vllmFailureEvidence.forwardPassRun, false)
assert.equal(result.vllmFailureEvidence.inferenceCompleted, false)
assert.equal(result.restoreVerification.restoreSucceeded, true)
assert.equal(result.restoreVerification.serviceRestoredFailClosed, true)
assert.equal(result.restoreVerification.persistentFixtureInferenceEnabled, false)
assert.equal(result.restoreVerification.persistentInferenceEnabled, false)
assert.equal(result.restoreVerification.cpuCallerPersistentExecutionEnabled, false)
assert.equal(result.restoreVerification.cpuCallerPersistentFixtureExpectationEnabled, false)
assert.equal(result.runtimeFlags.approvedFixtureInferenceSmokeAttempted, true)
assert.equal(result.runtimeFlags.approvedFixtureInferenceSmokePassed, false)
assert.equal(result.runtimeFlags.temporaryFixtureInferenceServiceRevisionDeployed, true)
assert.equal(result.runtimeFlags.temporaryFixtureInferenceServiceRestored, true)
assert.equal(result.runtimeFlags.serviceRestoredFailClosed, true)
assert.equal(result.runtimeFlags.cpuCallerJobExecuted, true)
assert.equal(result.runtimeFlags.identityTokenFetched, true)
assert.equal(result.runtimeFlags.cloudRunInvocationAttempted, true)
assert.equal(result.runtimeFlags.serviceRuntimeRequestSent, true)
assert.equal(result.runtimeFlags.modelImportAttempted, true)
assert.equal(result.runtimeFlags.modelLoadAttempted, true)
assert.equal(result.runtimeFlags.modelLoadCompleted, true)
assertFalseRuntimeFlags(result.runtimeFlags as JsonRecord)
assert.deepEqual(result.remainingBlockers.map((blocker) => blocker.id), [
  'qwen_vllm_kv_cache_memory_fix_required',
  'approved_fixture_inference_result_still_required',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-execute-result.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-execute-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen approved fixture smoke execute result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  selectedGpu: result.attempt.selectedGpu,
  observedHttpStatus: result.attempt.observedHttpStatus,
  failureClass: result.attempt.failureClass,
  modelLoadCompleted: result.runtimeFlags.modelLoadCompleted,
  vllmEngineInitialized: result.runtimeFlags.vllmEngineInitialized,
  inferenceRun: result.runtimeFlags.inferenceRun,
  serviceRestoredFailClosed: result.runtimeFlags.serviceRestoredFailClosed,
  nextPrompt: result.nextPrompt,
}, null, 2))
