import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SERVICE_PATH = 'server/workers/qwen2_5_vl_cloud_run_gpu/service.py'
const CALLER_PATH = 'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py'
const DECISION = 'completed_qwen2_5_vl_fail_closed_structured_output_source_import_ready_for_guarded_smoke_retry'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function run(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    env: { ...process.env, ...options.env },
  })
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
  return result
}

for (const file of [
  SERVICE_PATH,
  CALLER_PATH,
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1/source-import.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1/validation-results.md',
]) {
  assert.ok(fs.existsSync(path.join(ROOT, file)), `missing required file: ${file}`)
}

const syntaxCheckProgram = String.raw`
import pathlib

for path in [
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py",
  "server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py",
]:
  source = pathlib.Path(path).read_text()
  compile(source, path, "exec")
`
run('python3', ['-B', '-c', syntaxCheckProgram])

const serviceSource = read(SERVICE_PATH)
for (const phrase of [
  'FIXTURE_OUTPUT_SCHEMA_VERSION = "qwen_fixture_visual_metadata_v1"',
  'FIXTURE_OUTPUT_REQUIRED_KEYS',
  'Return exactly one minified JSON object and nothing else.',
  'def _extract_json_object',
  'def _normalize_fixture_metadata',
  'def _summarize_output',
  '"rawOutputStoredInRepo": False',
  '"QWEN_INFERENCE_ENABLED": "false"',
  '"QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED": "true"',
  'NetworkGuard',
]) {
  assert.ok(serviceSource.includes(phrase), `service source missing: ${phrase}`)
}

const callerSource = read(CALLER_PATH)
for (const phrase of [
  'QWEN_CPU_CALLER_EXECUTION_ENABLED',
  'if args.print_status or not _env_bool("QWEN_CPU_CALLER_EXECUTION_ENABLED", False):',
  'structured_metadata_output_ok',
  'metadata_output.get("parsedJson") is True',
  'metadata_output.get("schemaValid") is True',
  'metadata_output.get("objectCount", 0) > 0',
  'metadata_output.get("textLikeRegionCount", 0) > 0',
  'metadata_output.get("rawOutputStoredInRepo") is False',
]) {
  assert.ok(callerSource.includes(phrase), `caller source missing: ${phrase}`)
}

const parserProgram = String.raw`
import importlib.util
import json

spec = importlib.util.spec_from_file_location("qwen_service", "server/workers/qwen2_5_vl_cloud_run_gpu/service.py")
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
fenced = module._summarize_output("Evidence:\n" + fence + "json\n" + json.dumps(valid) + "\n" + fence, "visual_understanding")
wrapped = module._summarize_output("Before " + json.dumps(valid) + " after.", "visual_understanding")
invalid = module._summarize_output("The image has a rectangle and TIMELINE text.", "visual_understanding")
print(json.dumps({"direct": direct, "fenced": fenced, "wrapped": wrapped, "invalid": invalid}, sort_keys=True))
`

const parserResult = JSON.parse(run('python3', ['-B', '-c', parserProgram]).stdout) as Record<string, Record<string, unknown>>
for (const key of ['direct', 'fenced', 'wrapped']) {
  assert.equal(parserResult[key]?.parsedJson, true, `${key} parsedJson`)
  assert.equal(parserResult[key]?.schemaValid, true, `${key} schemaValid`)
  assert.equal(parserResult[key]?.objectCount, 1, `${key} objectCount`)
  assert.equal(parserResult[key]?.textLikeRegionCount, 1, `${key} textLikeRegionCount`)
  assert.deepEqual(parserResult[key]?.missingSchemaKeys, [], `${key} missingSchemaKeys`)
  assert.equal(parserResult[key]?.rawOutputStoredInRepo, false, `${key} rawOutputStoredInRepo`)
}
assert.equal(parserResult.invalid?.parsedJson, false, 'invalid prose must stay unparsed')

const status = JSON.parse(
  run('python3', [CALLER_PATH, '--print-status'], {
    env: {
      QWEN_CPU_CALLER_EXECUTION_ENABLED: 'false',
      QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE: 'false',
    },
  }).stdout,
) as {
  ok: boolean
  executionEnabled: boolean
  runtimeSideEffects: Record<string, boolean>
}
assert.equal(status.ok, true, 'CPU caller fail-closed status must be valid')
assert.equal(status.executionEnabled, false, 'CPU caller execution must be disabled')
for (const [key, value] of Object.entries(status.runtimeSideEffects)) {
  assert.equal(value, false, `runtime side effect must be false: ${key}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-structured-output-source-import-1'],
  'tsx server/smoke/qwen2-5-vl-external-beta-structured-output-source-import-1-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-structured-output-source-import-1:diagnostics'],
  'node scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
)

const packetText = read('docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1/source-import.md')
for (const phrase of [
  DECISION,
  'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1',
  'QWEN runtime: `blocked_pending_guarded_structured_output_smoke_retry`',
  'Product-ready end-to-end local OSS tools: `0`',
]) {
  assert.ok(packetText.includes(phrase), `packet missing: ${phrase}`)
}

console.log('QWEN2.5-VL external beta structured output source import smoke passed')
