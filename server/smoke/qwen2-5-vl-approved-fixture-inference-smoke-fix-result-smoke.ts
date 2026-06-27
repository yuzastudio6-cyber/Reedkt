import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result'

const ROOT = process.cwd()
const DECISION = 'qwen2_5_vl_approved_fixture_inference_smoke_fix_passed_result_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58D-APPROVED-FIXTURE-INFERENCE-RESULT-REVIEW: review sanitized Qwen fixture output metadata, no beta/no generated assets'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(betaUnlocked|productionUnlocked|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
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

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'serviceUrlValueStoredInRepo',
    'serviceUrlValuePersistedOnCpuCallerJob',
    'audienceValueStoredInRepo',
    'audienceValuePersistedOnCpuCallerJob',
    'identityTokenPrinted',
    'identityTokenValueStored',
    'metadataOutputAcceptedForRuntime',
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
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-fix-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-execute-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-fix-result-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-approved-fixture-inference-smoke-fix-result'],
  'tsx server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-fix-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-fix-result.md')
for (const phrase of [
  DECISION,
  '`qwen25-approved-fixture-smoke-fix-20260627t184430z`',
  '`reeditpro-qwen2-5-vl-l4-worker-00008-z6q`',
  '`reeditpro-qwen2-5-vl-l4-worker-00009-s5b`',
  '`reeditpro-qwen2-5-vl-private-caller-csr98`',
  '`reeditpro-qwen2-5-vl-l4-worker-00010-rth`',
  'observed HTTP status: `200`',
  'CPU caller exit code: `0`',
  'smoke passed: true',
  '`QWEN_FIXTURE_IMAGE_SIZE_PX=224`',
  '`QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`',
  '`parsedJson=false`',
  '`outputTextLength=187`',
  '`outputTextSha256=6534c929cddcb28fdfdc75a4e8d5ff656ac7741d669b8faa2560132e6b8a648f`',
  '`generatedAssetsCreated=false`',
  '`publicArtifactsCreated=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const serviceText = read('server/workers/qwen2_5_vl_cloud_run_gpu/service.py')
for (const phrase of [
  '_env_int("QWEN_FIXTURE_IMAGE_SIZE_PX", 384, 128, 384)',
  'QWEN_VLLM_MAX_MODEL_LEN',
  'QWEN_VLLM_GPU_MEMORY_UTILIZATION',
  'qwen_fixture_inference_smoke_completed',
  'metadataOutput',
]) {
  assert.ok(serviceText.includes(phrase), `Service source missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.retry.expectedHttpStatus, 200)
assert.equal(result.retry.observedHttpStatus, 200)
assert.equal(result.retry.cpuCallerExitCode, 0)
assert.equal(result.retry.fixtureInferenceSmokePassed, true)
assert.equal(result.retry.serviceReason, 'qwen_fixture_inference_smoke_completed')
assert.equal(result.fixEnvelope.maxModelLen, 1024)
assert.equal(result.fixEnvelope.gpuMemoryUtilization, 0.92)
assert.equal(result.fixEnvelope.fixtureImageSizePx, 224)
assert.equal(result.fixEnvelope.fixtureImageSizeMinimumPx, 128)
assert.equal(result.fixEnvelope.fixtureImageSizeMaximumPx, 384)
assert.equal(result.metadataOutput.parsedJson, false)
assert.equal(result.metadataOutput.outputTextLength, 187)
assert.equal(
  result.metadataOutput.outputTextSha256,
  '6534c929cddcb28fdfdc75a4e8d5ff656ac7741d669b8faa2560132e6b8a648f',
)
assert.equal(result.metadataOutput.rawOutputStoredInRepo, false)
assert.equal(result.restoreVerification.serviceRestoredFailClosed, true)
assert.equal(result.restoreVerification.cpuCallerPersistentExecutionEnabled, false)
assert.equal(result.restoreVerification.cpuCallerPersistentTargetUrl, false)
assert.equal(result.runtimeFlags.approvedFixtureInferenceSmokeFixAttempted, true)
assert.equal(result.runtimeFlags.approvedFixtureInferenceSmokeFixPassed, true)
assert.equal(result.runtimeFlags.vllmEngineInitialized, true)
assert.equal(result.runtimeFlags.controlledFixtureInferenceCompleted, true)
assert.equal(result.runtimeFlags.metadataOutputCreated, true)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-fix-result.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen fixture smoke fix result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  runId: result.retry.runId,
  observedHttpStatus: result.retry.observedHttpStatus,
  fixtureInferenceSmokePassed: result.retry.fixtureInferenceSmokePassed,
  metadataOutputCreated: result.runtimeFlags.metadataOutputCreated,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  publicArtifactsCreated: result.runtimeFlags.publicArtifactsCreated,
  signedUrlsCreated: result.runtimeFlags.signedUrlsCreated,
  serviceRestoredFailClosed: result.runtimeFlags.serviceRestoredFailClosed,
  nextPrompt: result.nextPrompt,
}, null, 2))
