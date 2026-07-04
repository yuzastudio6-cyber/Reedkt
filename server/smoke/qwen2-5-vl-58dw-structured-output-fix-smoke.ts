import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_58DW_STRUCTURED_OUTPUT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-58dw-structured-output-fix'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_58dw_structured_output_fix_ready_for_bounded_retry_2'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-RETRY-2: run one bounded approved-fixture private inference retry after strict structured-output fix, no generated assets/no mutation'

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
  ['unsafe runtime true claim', /\b(cloudRunServiceDeployed|cloudRunInvocationAttempted|cloudRunJobExecuted|identityTokenFetched|modelImportRun|modelLoadRun|vllmEngineInitialized|inferenceRun|boundedRetry2Run|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'cloudRunServiceDeployed',
    'cloudRunInvocationAttempted',
    'cloudRunJobExecuted',
    'identityTokenFetched',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'inferenceRun',
    'boundedRetry2Run',
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
  "objects": [
    {"label": "red_rectangle", "region": "left", "confidence": "high"},
    {"label": "blue_circle", "region": "right", "confidence": "high"},
    {"label": "timeline_bar", "region": "bottom", "confidence": "medium"}
  ],
  "text_like_regions": [{"text": "TIMELINE", "region": "bottom_center", "confidence": "medium"}],
  "spatial_relations": ["red_rectangle_left_of_blue_circle", "timeline_bar_below_shapes"],
  "uncertainty": [],
  "blocked_actions": ["no_generated_assets", "no_public_artifacts", "no_signed_urls", "no_raw_prompt_execution"]
}
generic_row = {"label": "red rectangle", "region": "left", "confidence": "high"}
missing_text = {**valid, "text_like_regions": []}
missing_blocked = {**valid, "blocked_actions": ["no_generated_assets"]}

print(json.dumps({
  "valid": module._summarize_output(json.dumps(valid, separators=(",", ":"), sort_keys=True), "visual_understanding"),
  "generic_row": module._summarize_output(json.dumps(generic_row, separators=(",", ":"), sort_keys=True), "visual_understanding"),
  "missing_text": module._summarize_output(json.dumps(missing_text, separators=(",", ":"), sort_keys=True), "visual_understanding"),
  "missing_blocked": module._summarize_output(json.dumps(missing_blocked, separators=(",", ":"), sort_keys=True), "visual_understanding"),
  "invalid_prose": module._summarize_output("The fixture has red and blue shapes.", "visual_understanding")
}, sort_keys=True))
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
  'docs/qwen2-5-vl-7b-58dw-structured-output-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-58dw-structured-output-fix.ts',
  'server/smoke/qwen2-5-vl-58dw-structured-output-fix-smoke.ts',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-58dw-structured-output-fix'],
  'tsx server/smoke/qwen2-5-vl-58dw-structured-output-fix-smoke.ts',
  'package smoke script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-58dw-structured-output-fix.md')
for (const phrase of [
  DECISION,
  'structured_metadata_schema_invalid_after_bounded_58dw_retry',
  '`qwen_fixture_visual_metadata_v1_strict_after_58dw`',
  '`schemaCompletenessValid`',
  '`topLevelObjectRowRejected`',
  '`schemaValidationReasons`',
  '`sourceFixDefined=true`',
  '`boundedRetry2Run=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const serviceText = read('server/workers/qwen2_5_vl_cloud_run_gpu/service.py')
for (const phrase of [
  'FIXTURE_OUTPUT_STRICTNESS_VERSION = "qwen_fixture_visual_metadata_v1_strict_after_58dw"',
  'FIXTURE_OUTPUT_MIN_OBJECTS = 2',
  'FIXTURE_OUTPUT_REQUIRED_BLOCKED_ACTIONS',
  'A top-level object with only label, region, and confidence is invalid.',
  'topLevelObjectRowRejected',
  'schemaValidationReasons',
  'blocked_action_missing',
  'object_count_below_minimum',
]) {
  assert.ok(serviceText.includes(phrase), `Service source missing phrase: ${phrase}`)
}

const callerText = read('server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py')
for (const phrase of [
  'schemaValidationReasons',
  'schemaCompletenessValid',
  'topLevelObjectRowRejected',
  'minimumObjectCount',
  'minimumTextLikeRegionCount',
  'minimumSpatialRelationCount',
  'minimumBlockedActionCount',
]) {
  assert.ok(callerText.includes(phrase), `CPU caller source missing phrase: ${phrase}`)
}

const runnerText = read('server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts')
for (const phrase of [
  NEXT_PROMPT,
  "QWEN_FIXTURE_MAX_TOKENS: '256'",
  "QWEN_FIXTURE_IMAGE_SIZE_PX: '384'",
  'GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV',
  "const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG = '--account-index'",
  "const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS = '--gcloud-account-index'",
  'accountSelectionOutput()',
  'gcloudAccountEnv()',
  'CLOUDSDK_CORE_ACCOUNT',
  'mutatesLocalGcloudConfig: false',
]) {
  assert.ok(runnerText.includes(phrase), `Runner missing phrase: ${phrase}`)
}

const runnerStatic = spawnSync(
  'npx',
  ['tsx', 'server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts', '--json', '--account-index=2'],
  {
    cwd: ROOT,
    env: {
      ...process.env,
      REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY: '',
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  },
)
assert.equal(runnerStatic.status, 0, runnerStatic.stderr)
const runnerStaticReport = JSON.parse(String(runnerStatic.stdout ?? '{}')) as JsonRecord
const runnerAccountSelection = runnerStaticReport.accountSelection as JsonRecord
assert.equal(runnerStaticReport.mode, 'qwen2_5_vl_58dw_bounded_private_inference_retry_static_guard')
assert.equal(runnerAccountSelection.overrideIndexProvided, true)
assert.equal(runnerAccountSelection.overrideIndexSource, 'cli')
assert.equal(runnerAccountSelection.overrideIndex, 2)
assert.equal(runnerAccountSelection.mutatesLocalGcloudConfig, false)

const parserResults = runParserValidation()
assert.equal(parserResults.valid?.schemaValid, true, 'valid fixture metadata must pass')
assert.equal(parserResults.valid?.strictnessVersion, 'qwen_fixture_visual_metadata_v1_strict_after_58dw')
assert.deepEqual(parserResults.valid?.schemaValidationReasons, [], 'valid fixture metadata must have no schema reasons')
assert.equal(parserResults.valid?.objectCount, 3)
assert.equal(parserResults.valid?.textLikeRegionCount, 1)
assert.equal(parserResults.valid?.spatialRelationCount, 2)
assert.equal(parserResults.valid?.blockedActionCount, 4)
assert.equal(parserResults.generic_row?.schemaValid, false, 'generic top-level object row must fail')
assert.equal(parserResults.generic_row?.topLevelObjectRowRejected, true)
assert.ok(
  Array.isArray(parserResults.generic_row?.schemaValidationReasons) &&
    parserResults.generic_row.schemaValidationReasons.includes('top_level_object_row_rejected'),
)
assert.equal(parserResults.missing_text?.schemaValid, false, 'missing text-like regions must fail')
assert.ok(
  Array.isArray(parserResults.missing_text?.schemaValidationReasons) &&
    parserResults.missing_text.schemaValidationReasons.includes('text_like_region_count_below_minimum'),
)
assert.equal(parserResults.missing_blocked?.schemaValid, false, 'missing blocked actions must fail')
assert.ok(
  Array.isArray(parserResults.missing_blocked?.schemaValidationReasons) &&
    parserResults.missing_blocked.schemaValidationReasons.includes('blocked_action_count_below_minimum'),
)
assert.equal(parserResults.invalid_prose?.parsedJson, false, 'invalid prose must not parse')
assert.equal(parserResults.invalid_prose?.schemaValid, false, 'invalid prose must fail schema')

const fix = QWEN2_5_VL_58DW_STRUCTURED_OUTPUT_FIX
assert.equal(fix.decision, DECISION)
assert.equal(fix.upstreamBlocker, 'structured_metadata_schema_invalid_after_bounded_58dw_retry')
assert.equal(fix.strictFixtureSchema.strictnessVersion, 'qwen_fixture_visual_metadata_v1_strict_after_58dw')
assert.deepEqual(fix.strictFixtureSchema.rejectedTopLevelShape, ['label', 'region', 'confidence'])
assert.equal(fix.strictFixtureSchema.minimumObjectCount, 2)
assert.equal(fix.strictFixtureSchema.minimumTextLikeRegionCount, 1)
assert.equal(fix.strictFixtureSchema.minimumSpatialRelationCount, 1)
assert.equal(fix.strictFixtureSchema.minimumBlockedActionCount, 4)
assert.equal(fix.sourceFixes.promptRejectsTopLevelObjectRow, true)
assert.equal(fix.sourceFixes.schemaValidRequiresMinimumCounts, true)
assert.equal(fix.sourceFixes.cpuCallerRequiresStrictSchemaFields, true)
assert.equal(fix.sourceFixes.retryRunnerTokenBudgetRaised, true)
assert.equal(fix.sourceFixes.retryRunnerFixtureImageRestoredToFullSize, true)
assert.equal(fix.localValidation.genericTopLevelObjectRowRejected, true)
assert.equal(fix.localValidation.localParserValidationPassed, true)
assert.equal(fix.runtimeFlags.sourceFixDefined, true)
assertFalseRuntimeFlags(fix.runtimeFlags)
assert.equal(fix.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-58dw-structured-output-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-58dw-structured-output-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ fix })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in 58DW structured output fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: fix.decision,
  strictnessVersion: fix.strictFixtureSchema.strictnessVersion,
  genericTopLevelObjectRowRejected: fix.localValidation.genericTopLevelObjectRowRejected,
  sourceFixDefined: fix.runtimeFlags.sourceFixDefined,
  inferenceRun: fix.runtimeFlags.inferenceRun,
  generatedAssetsCreated: fix.runtimeFlags.generatedAssetsCreated,
  nextPrompt: fix.nextPrompt,
}, null, 2))
