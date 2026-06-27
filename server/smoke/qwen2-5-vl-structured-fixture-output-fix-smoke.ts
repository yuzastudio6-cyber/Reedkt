import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-fix'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_structured_fixture_output_source_fix_ready_smoke_retry_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58F-STRUCTURED-FIXTURE-OUTPUT-SMOKE-RETRY: deploy fixed Qwen fixture source and run controlled private structured output smoke, no beta/no generated assets'

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
  ['unsafe runtime true claim', /\b(cloudRunInvocationAttempted|identityTokenFetched|modelImportRun|modelLoadRun|vllmEngineInitialized|inferenceRun|structuredOutputSmokeRetried|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe output true claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
    'cloudRunServiceDeployed',
    'cloudRunInvocationAttempted',
    'identityTokenFetched',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'inferenceRun',
    'structuredOutputSmokeRetried',
    'structuredOutputAcceptedForRuntime',
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
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

function runParserValidation() {
  const python = String.raw`
import importlib.util
import json

spec = importlib.util.spec_from_file_location("qsvc", "server/workers/qwen2_5_vl_cloud_run_gpu/service.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

valid = {
  "schema_version": "qwen_fixture_visual_metadata_v1",
  "fixture_id": "fixture_mock_qwen_approved_private_frame_001",
  "use_case": "visual_understanding",
  "objects": [{"label": "red_rectangle", "region": "left", "confidence": "high"}],
  "text_like_regions": [{"text": "TIMELINE", "region": "bottom_center", "confidence": "medium"}],
  "spatial_relations": ["red_rectangle_left_of_blue_circle"],
  "uncertainty": [],
  "blocked_actions": ["no_generated_assets"]
}
direct = module._summarize_output(json.dumps(valid, separators=(",", ":"), sort_keys=True), "visual_understanding")
fence = chr(96) * 3
fenced = module._summarize_output("Here is the requested JSON:\n" + fence + "json\n" + json.dumps(valid) + "\n" + fence, "visual_understanding")
wrapped = module._summarize_output("Result follows. " + json.dumps(valid) + " End.", "visual_understanding")
invalid = module._summarize_output("The image shows a rectangle, a circle, and TIMELINE text.", "visual_understanding")
print(json.dumps({"direct": direct, "fenced": fenced, "wrapped": wrapped, "invalid": invalid}, sort_keys=True))
`
  const result = spawnSync('python3', ['-c', python], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return JSON.parse(result.stdout) as Record<string, JsonRecord>
}

for (const file of [
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review.ts',
  'server/smoke/qwen2-5-vl-structured-fixture-output-fix-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-structured-fixture-output-fix'],
  'tsx server/smoke/qwen2-5-vl-structured-fixture-output-fix-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-structured-fixture-output-fix.md')
for (const phrase of [
  DECISION,
  '`parsedJson=false`',
  '`schemaKeys=[]`',
  '`objectCount=0`',
  '`textLikeRegionCount=0`',
  '`FIXTURE_OUTPUT_SCHEMA_VERSION=qwen_fixture_visual_metadata_v1`',
  '`schema_version`',
  '`objects`',
  '`text_like_regions`',
  '`schemaValid=true`',
  '`rawOutputStoredInRepo=false`',
  '`structuredFixtureOutputSourceFixDefined=true`',
  '`structuredOutputSmokeRetried=false`',
  '`inferenceRun=false`',
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
  'FIXTURE_OUTPUT_SCHEMA_VERSION = "qwen_fixture_visual_metadata_v1"',
  'FIXTURE_OUTPUT_REQUIRED_KEYS',
  'Return exactly one minified JSON object and nothing else.',
  '_extract_json_object',
  '_normalize_fixture_metadata',
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
  'structured_metadata_output_ok',
  'metadata_output.get("parsedJson") is True',
  'metadata_output.get("schemaValid") is True',
  'metadata_output.get("objectCount", 0) > 0',
  'metadata_output.get("textLikeRegionCount", 0) > 0',
  'structuredMetadataOutputAccepted',
]) {
  assert.ok(callerText.includes(phrase), `CPU caller source missing phrase: ${phrase}`)
}

const parserResults = runParserValidation()
for (const key of ['direct', 'fenced', 'wrapped']) {
  assert.equal(parserResults[key]?.parsedJson, true, `${key} JSON must parse`)
  assert.equal(parserResults[key]?.schemaValid, true, `${key} schema must be valid`)
  assert.equal(parserResults[key]?.objectCount, 1, `${key} object count must be preserved`)
  assert.equal(parserResults[key]?.textLikeRegionCount, 1, `${key} text-like region count must be preserved`)
  assert.deepEqual(parserResults[key]?.missingSchemaKeys, [], `${key} must not miss schema keys`)
  assert.equal(parserResults[key]?.rawOutputStoredInRepo, false, `${key} raw output must stay unstored`)
}
assert.equal(parserResults.invalid?.parsedJson, false, 'invalid prose must not parse as JSON')
assert.equal(parserResults.invalid?.schemaValid, false, 'invalid prose must not be schema-valid')

const fix = QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_FIX
assert.equal(fix.decision, DECISION)
assert.equal(
  fix.upstreamResultReviewDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW.decision,
)
assert.equal(fix.fixtureOutputSchema.schemaVersion, 'qwen_fixture_visual_metadata_v1')
assert.equal(fix.fixtureOutputSchema.rawOutputStoredInRepo, false)
assert.deepEqual(fix.fixtureOutputSchema.objectRowShape, ['label', 'region', 'confidence'])
assert.deepEqual(fix.fixtureOutputSchema.textLikeRegionRowShape, ['text', 'region', 'confidence'])
assert.equal(fix.sourceFixes.fixturePromptSchemaTargetDefined, true)
assert.equal(fix.sourceFixes.jsonObjectExtractionDefined, true)
assert.equal(fix.sourceFixes.fencedJsonRecoveryDefined, true)
assert.equal(fix.sourceFixes.proseWrappedJsonRecoveryDefined, true)
assert.equal(fix.sourceFixes.cpuCallerRequiresStructuredMetadata, true)
assert.equal(fix.localParserValidation.localParserValidationPassed, true)
assert.equal(fix.futureSmokeRequirements.parsedJsonRequired, true)
assert.equal(fix.futureSmokeRequirements.schemaValidRequired, true)
assert.equal(fix.futureSmokeRequirements.generatedAssetsAllowed, false)
assertFalseFlags(fix.runtimeFlags)
assert.equal(fix.runtimeFlags.structuredFixtureOutputSourceFixDefined, true)
assert.equal(fix.runtimeFlags.fixturePromptSchemaTargetDefined, true)
assert.equal(fix.runtimeFlags.jsonObjectExtractionDefined, true)
assert.equal(fix.runtimeFlags.fixtureMetadataNormalizationDefined, true)
assert.equal(fix.runtimeFlags.cpuCallerRequiresStructuredMetadata, true)
assert.equal(fix.runtimeFlags.localParserValidationPassed, true)
assert.equal(fix.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ fix })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen structured fixture output fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: fix.decision,
  schemaVersion: fix.fixtureOutputSchema.schemaVersion,
  localParserValidationPassed: fix.runtimeFlags.localParserValidationPassed,
  structuredOutputSmokeRetried: fix.runtimeFlags.structuredOutputSmokeRetried,
  inferenceRun: fix.runtimeFlags.inferenceRun,
  generatedAssetsCreated: fix.runtimeFlags.generatedAssetsCreated,
  publicArtifactsCreated: fix.runtimeFlags.publicArtifactsCreated,
  signedUrlsCreated: fix.runtimeFlags.signedUrlsCreated,
  nextPrompt: fix.nextPrompt,
}, null, 2))
