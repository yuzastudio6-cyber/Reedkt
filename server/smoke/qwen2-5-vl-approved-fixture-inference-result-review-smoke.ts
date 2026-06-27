import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_approved_fixture_inference_result_review_invocation_passed_structured_output_blocked'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58E-STRUCTURED-FIXTURE-OUTPUT-FIX: tune Qwen fixture prompt/parser for structured JSON metadata, no beta/no generated assets'

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
    'structuredJsonOutputAccepted',
    'productQaMetadataAccepted',
    'runtimeReadinessAdvanced',
    'privateInvokeReady',
    'betaReady',
    'productionReady',
    'inferenceRunNow',
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
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-fix-result.md',
  'model-routing-policy.md',
  'open-source-tool-registry.md',
  'intent-led-edit-planning.md',
  'provider-prompt-architecture.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-result-review-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-approved-fixture-inference-result-review'],
  'tsx server/smoke/qwen2-5-vl-approved-fixture-inference-result-review-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md')
for (const phrase of [
  DECISION,
  '`parsedJson=false`',
  '`schemaKeys=[]`',
  '`objectCount=0`',
  '`textLikeRegionCount=0`',
  'invocation proof accepted: true',
  'structured JSON output accepted: false',
  'runtime readiness advanced: false',
  '`outputTextSha256=6534c929cddcb28fdfdc75a4e8d5ff656ac7741d669b8faa2560132e6b8a648f`',
  '`generatedAssetsCreated=false`',
  '`publicArtifactsCreated=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const review = QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(review.reviewedRun.observedHttpStatus, 200)
assert.equal(review.reviewedRun.serviceReason, 'qwen_fixture_inference_smoke_completed')
assert.equal(review.reviewedMetadataOutput.parsedJson, false)
assert.equal(review.reviewedMetadataOutput.outputTextLength, 187)
assert.equal(
  review.reviewedMetadataOutput.outputTextSha256,
  '6534c929cddcb28fdfdc75a4e8d5ff656ac7741d669b8faa2560132e6b8a648f',
)
assert.equal(review.reviewedMetadataOutput.objectCount, 0)
assert.equal(review.reviewedMetadataOutput.textLikeRegionCount, 0)
assert.deepEqual(review.reviewedMetadataOutput.schemaKeys, [])
assert.equal(review.acceptedEvidence.invocationProofAccepted, true)
assert.equal(review.acceptedEvidence.privateModelCacheLoadAccepted, true)
assert.equal(review.acceptedEvidence.scaleToZeroPosturePreserved, true)
assert.equal(review.blockedEvidence.structuredJsonOutputAccepted, false)
assert.ok(review.blockedEvidence.reasons.includes('parsed_json_false'))
assert.equal(review.requiredFix.generatedAssetsAllowed, false)
assert.equal(review.requiredFix.publicArtifactsAllowed, false)
assert.equal(review.requiredFix.signedUrlsAllowed, false)
assert.equal(review.requiredFix.betaAllowed, false)
assert.equal(review.requiredFix.productionAllowed, false)
assert.equal(review.runtimeFlags.resultReviewRecorded, true)
assert.equal(review.runtimeFlags.invocationProofAccepted, true)
assertFalseFlags(review.runtimeFlags)
assert.equal(review.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ review })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen fixture inference result review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  invocationProofAccepted: review.runtimeFlags.invocationProofAccepted,
  structuredJsonOutputAccepted: review.runtimeFlags.structuredJsonOutputAccepted,
  privateInvokeReady: review.runtimeFlags.privateInvokeReady,
  generatedAssetsCreated: review.runtimeFlags.generatedAssetsCreated,
  publicArtifactsCreated: review.runtimeFlags.publicArtifactsCreated,
  signedUrlsCreated: review.runtimeFlags.signedUrlsCreated,
  nextPrompt: review.nextPrompt,
}, null, 2))
