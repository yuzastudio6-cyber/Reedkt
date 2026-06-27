import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result'

const ROOT = process.cwd()
const DECISION = 'qwen2_5_vl_structured_fixture_output_smoke_retry_passed_result_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58G-STRUCTURED-FIXTURE-OUTPUT-RESULT-REVIEW: review accepted structured Qwen fixture metadata, no beta/no generated assets'

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
  'docs/qwen2-5-vl-7b-structured-fixture-output-smoke-retry-result.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result.ts',
  'server/smoke/qwen2-5-vl-structured-fixture-output-smoke-retry-result-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-structured-fixture-output-smoke-retry-result'],
  'tsx server/smoke/qwen2-5-vl-structured-fixture-output-smoke-retry-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-structured-fixture-output-smoke-retry-result.md')
for (const phrase of [
  DECISION,
  '`qwen25-structured-fixture-output-retry-20260627t204453z`',
  '`reeditpro-qwen2-5-vl-l4-worker-00011-bxb`',
  '`reeditpro-qwen2-5-vl-l4-worker-00012-7n5`',
  '`reeditpro-qwen2-5-vl-l4-worker-00013-kms`',
  '`reeditpro-qwen2-5-vl-private-caller-hn9sw`',
  '`qwen_fixture_inference_smoke_completed`',
  '`parsedJson=true`',
  '`schemaVersion=qwen_fixture_visual_metadata_v1`',
  '`schemaValid=true`',
  '`outputTextLength=645`',
  '`outputTextSha256=f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`',
  '`objectCount=3`',
  '`textLikeRegionCount=1`',
  '`spatialRelationCount=2`',
  '`blockedActionCount=4`',
  '`missingSchemaKeys=[]`',
  '`normalizationWarnings=[]`',
  '`rawOutputStoredInRepo=false`',
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
  'qwen_fixture_visual_metadata_v1',
  'schemaValid',
  'requiredSchemaKeysPresent',
  'missingSchemaKeys',
  'normalizedMetadataSha256',
  'rawOutputStoredInRepo',
]) {
  assert.ok(serviceText.includes(phrase), `Service source missing phrase: ${phrase}`)
}

const callerText = read('server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py')
for (const phrase of [
  'fixtureInferenceSmokePassed',
  'schemaValid',
  'parsedJson',
  'rawOutputStoredInRepo',
]) {
  assert.ok(callerText.includes(phrase), `CPU caller source missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.retry.expectedHttpStatus, 200)
assert.equal(result.retry.observedHttpStatus, 200)
assert.equal(result.retry.structuredFixtureOutputSmokePassed, true)
assert.equal(result.retry.serviceReason, 'qwen_fixture_inference_smoke_completed')
assert.equal(result.metadataOutput.parsedJson, true)
assert.equal(result.metadataOutput.parseStrategy, 'json_object_extracted')
assert.equal(result.metadataOutput.schemaVersion, 'qwen_fixture_visual_metadata_v1')
assert.equal(result.metadataOutput.schemaValid, true)
assert.equal(result.metadataOutput.outputTextLength, 645)
assert.equal(
  result.metadataOutput.outputTextSha256,
  'f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4',
)
assert.equal(result.metadataOutput.objectCount, 3)
assert.equal(result.metadataOutput.textLikeRegionCount, 1)
assert.equal(result.metadataOutput.spatialRelationCount, 2)
assert.equal(result.metadataOutput.blockedActionCount, 4)
assert.deepEqual(result.metadataOutput.missingSchemaKeys, [])
assert.deepEqual(result.metadataOutput.normalizationWarnings, [])
assert.equal(result.metadataOutput.rawOutputStoredInRepo, false)
assert.equal(result.restoreVerification.serviceRestoredFailClosed, true)
assert.equal(result.restoreVerification.cpuCallerPersistentExecutionEnabled, false)
assert.equal(result.restoreVerification.cpuCallerPersistentTargetUrl, false)
assert.equal(result.runtimeFlags.structuredFixtureOutputSmokeRetryAttempted, true)
assert.equal(result.runtimeFlags.structuredFixtureOutputSmokeRetryPassed, true)
assert.equal(result.runtimeFlags.structuredFixtureOutputAcceptedForReview, true)
assert.equal(result.runtimeFlags.structuredFixtureOutputResultReviewRequired, true)
assert.equal(result.runtimeFlags.schemaValid, true)
assert.equal(result.runtimeFlags.parsedJson, true)
assert.equal(result.runtimeFlags.objectRowsPresent, true)
assert.equal(result.runtimeFlags.textLikeRowsPresent, true)
assert.equal(result.runtimeFlags.vllmEngineInitialized, true)
assert.equal(result.runtimeFlags.boundedFixtureInferenceRun, true)
assert.equal(result.runtimeFlags.metadataOutputAcceptedForReview, true)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-structured-fixture-output-smoke-retry-result.md',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen structured fixture retry result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  runId: result.retry.runId,
  observedHttpStatus: result.retry.observedHttpStatus,
  structuredFixtureOutputSmokePassed: result.retry.structuredFixtureOutputSmokePassed,
  schemaValid: result.metadataOutput.schemaValid,
  objectCount: result.metadataOutput.objectCount,
  textLikeRegionCount: result.metadataOutput.textLikeRegionCount,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  publicArtifactsCreated: result.runtimeFlags.publicArtifactsCreated,
  signedUrlsCreated: result.runtimeFlags.signedUrlsCreated,
  serviceRestoredFailClosed: result.runtimeFlags.serviceRestoredFailClosed,
  nextPrompt: result.nextPrompt,
}, null, 2))
