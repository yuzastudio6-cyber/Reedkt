import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_structured_fixture_output_result_review_accepted_private_runtime_readiness_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58H-PRIVATE-RUNTIME-READINESS-REVIEW: review Qwen private runtime readiness after structured fixture output acceptance, no beta/no generated assets'

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
  ['unsafe unlock claim', /\b(betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe runtime ready claim', /\b(privateInvokeReady|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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
    'privateInvokeReady',
    'betaReady',
    'productionReady',
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
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-structured-fixture-output-result-review.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-smoke-retry-result.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result.ts',
  'server/smoke/qwen2-5-vl-structured-fixture-output-result-review-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-structured-fixture-output-result-review'],
  'tsx server/smoke/qwen2-5-vl-structured-fixture-output-result-review-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-structured-fixture-output-result-review.md')
for (const phrase of [
  DECISION,
  '`qwen25-structured-fixture-output-retry-20260627t204453z`',
  '`qwen_fixture_inference_smoke_completed`',
  '`parsedJson=true`',
  '`parseStrategy=json_object_extracted`',
  '`schemaVersion=qwen_fixture_visual_metadata_v1`',
  '`schemaValid=true`',
  '`outputTextLength=645`',
  '`outputTextSha256=f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`',
  '`normalizedMetadataSha256=f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`',
  '`objectCount=3`',
  '`textLikeRegionCount=1`',
  '`spatialRelationCount=2`',
  '`blockedActionCount=4`',
  '`missingSchemaKeys=[]`',
  '`normalizationWarnings=[]`',
  '`rawOutputStoredInRepo=false`',
  '`structuredFixtureOutputResultReviewRequired=false`',
  '`privateRuntimeReadinessReviewRequired=true`',
  '`privateInvokeReady=false`',
  '`betaReady=false`',
  '`productionReady=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`publicArtifactsCreated=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const review = QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW
const retry = QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT
assert.equal(review.decision, DECISION)
assert.equal(review.upstreamStructuredFixtureOutputSmokeRetryDecision, retry.decision)
assert.equal(review.reviewedRetry.runId, retry.retry.runId)
assert.equal(review.reviewedRetry.fixtureUseCase, 'visual_understanding')
assert.equal(review.reviewedRetry.observedHttpStatus, 200)
assert.equal(review.reviewedRetry.rawOutputStoredInRepo, false)
assert.equal(review.acceptedMetadataEvidence.parsedJson, true)
assert.equal(review.acceptedMetadataEvidence.parseStrategy, 'json_object_extracted')
assert.equal(review.acceptedMetadataEvidence.schemaVersion, 'qwen_fixture_visual_metadata_v1')
assert.equal(review.acceptedMetadataEvidence.schemaValid, true)
assert.equal(review.acceptedMetadataEvidence.outputTextLength, 645)
assert.equal(
  review.acceptedMetadataEvidence.outputTextSha256,
  'f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4',
)
assert.equal(
  review.acceptedMetadataEvidence.normalizedMetadataSha256,
  review.acceptedMetadataEvidence.outputTextSha256,
)
assert.equal(review.acceptedMetadataEvidence.objectCount, 3)
assert.equal(review.acceptedMetadataEvidence.textLikeRegionCount, 1)
assert.equal(review.acceptedMetadataEvidence.spatialRelationCount, 2)
assert.equal(review.acceptedMetadataEvidence.blockedActionCount, 4)
assert.deepEqual(review.acceptedMetadataEvidence.missingSchemaKeys, [])
assert.deepEqual(review.acceptedMetadataEvidence.normalizationWarnings, [])
assert.equal(review.acceptance.schemaVersionAccepted, true)
assert.equal(review.acceptance.requiredSchemaKeysAccepted, true)
assert.equal(review.acceptance.objectRowsAccepted, true)
assert.equal(review.acceptance.textLikeRegionRowsAccepted, true)
assert.equal(review.acceptance.spatialRelationRowsAccepted, true)
assert.equal(review.acceptance.blockedActionRowsAccepted, true)
assert.equal(review.acceptance.normalizedMetadataHashAccepted, true)
assert.equal(review.acceptance.rawOutputExclusionAccepted, true)
assert.equal(review.acceptance.acceptedForPrivateRuntimeReadinessReview, true)
assert.equal(review.acceptance.acceptedForBeta, false)
assert.equal(review.acceptance.acceptedForProduction, false)
assertFalseFlags(review.runtimeFlags)
assert.equal(review.runtimeFlags.structuredFixtureOutputResultReviewRecorded, true)
assert.equal(review.runtimeFlags.structuredFixtureMetadataAccepted, true)
assert.equal(review.runtimeFlags.structuredFixtureOutputResultReviewRequired, false)
assert.equal(review.runtimeFlags.privateRuntimeReadinessReviewRequired, true)
assert.deepEqual(review.remainingBlockers.map((blocker) => blocker.id), [
  'private_runtime_readiness_review_required',
  'beta_and_production_approval_required',
])
assert.equal(review.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-structured-fixture-output-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ review })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen structured fixture output result review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  schemaValid: review.acceptedMetadataEvidence.schemaValid,
  objectCount: review.acceptedMetadataEvidence.objectCount,
  textLikeRegionCount: review.acceptedMetadataEvidence.textLikeRegionCount,
  privateRuntimeReadinessReviewRequired:
    review.runtimeFlags.privateRuntimeReadinessReviewRequired,
  privateInvokeReady: review.runtimeFlags.privateInvokeReady,
  betaReady: review.runtimeFlags.betaReady,
  productionReady: review.runtimeFlags.productionReady,
  generatedAssetsCreated: review.runtimeFlags.generatedAssetsCreated,
  publicArtifactsCreated: review.runtimeFlags.publicArtifactsCreated,
  signedUrlsCreated: review.runtimeFlags.signedUrlsCreated,
  nextPrompt: review.nextPrompt,
}, null, 2))
