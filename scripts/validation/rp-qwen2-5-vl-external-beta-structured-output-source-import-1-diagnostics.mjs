#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1'

const requiredFiles = [
  'server/workers/qwen2_5_vl_cloud_run_gpu/__init__.py',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/__init__.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'server/smoke/qwen2-5-vl-external-beta-structured-output-source-import-1-smoke.ts',
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md',
  `${packetDir}/source-import.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-structured-output-source-import-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-structured-output-source-import-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-structured-output-smoke-retry-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
  'package.json',
]

const followOnPrivateCallerImageSourceImportFiles = [
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/source-import.md',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/runtime-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/qwen2-5-vl-private-caller-image-source-import-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-results.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
]

const followOnStructuredOutputSmokeRetryFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/fail-closed-restore.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/qwen2-5-vl-structured-output-smoke-retry-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs',
]

const followOnVllmL4KvCacheTuningFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/fail-closed-restore.md',
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/qwen2-5-vl-vllm-l4-kv-cache-tuning-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-runtime-gate-integration-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-diagnostics.mjs',
]

const followOnRuntimeGateIntegrationFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-runtime-gate-integration-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-runtime-gate-integration-1/runtime-gate-contract.md',
  'docs/external-beta/qwen2-5-vl-external-beta-runtime-gate-integration-1/readiness-gate.md',
  'docs/external-beta/qwen2-5-vl-external-beta-runtime-gate-integration-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-runtime-gate-integration-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-runtime-gate-integration-1/qwen2-5-vl-runtime-gate-integration-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-runtime-gate-integration-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-backend-runtime-adapter-1.md',
  'server/config/qwen2-5-vl-external-beta-runtime-gate-contract.ts',
  'server/smoke/qwen2-5-vl-external-beta-runtime-gate-integration-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-runtime-gate-integration-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnPrivateCallerImageSourceImportFiles,
  ...followOnStructuredOutputSmokeRetryFiles,
  ...followOnVllmL4KvCacheTuningFiles,
  ...followOnRuntimeGateIntegrationFiles,
])

const requiredText = [
  packet,
  'completed_qwen2_5_vl_fail_closed_structured_output_source_import_ready_for_guarded_smoke_retry',
  'completed_fail_closed_source_import_no_runtime_execution',
  '5ee54acde1641dadcabf965703f4ad7e7207f2e3',
  '46e43a0dcbe7de602a9403caf96f1b7693a74eb5',
  'qwen_fixture_visual_metadata_v1',
  'QWEN runtime: `blocked_pending_guarded_structured_output_smoke_retry`',
  'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1',
  'parsedJson=true',
  'schemaValid=true',
  'rawOutputStoredInRepo=false',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const falseSafetyKeys = [
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'routeExecution',
  'cloudRunDeployment',
  'cloudRunInvocation',
  'identityTokenFetch',
  'qwenExecution',
  'modelImportLoad',
  'vllmInitialization',
  'dockerExecution',
  'mediaProcessing',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'deployment',
  'productionUnlock',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
]

const blockedFiles = [
  'package-lock.json',
  '.dockerignore',
]

const blockedPrefixes = [
  'supabase/',
  'database/',
  'docker/',
  'cloudbuild/',
  '.github/',
  'requirements',
  '.env',
]

const docsForbiddenClaims = [
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed)\b/i,
  /\bQWEN runtime:\s*`?(ready|enabled|completed|production_ready)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run invocation:\s*`?(true|enabled|completed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed)\b/i,
  /\bmodel import\/load:\s*`?(true|enabled|completed)\b/i,
  /\bvLLM initialization:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bdeployment:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bpackage installation:\s*`?(true|enabled|completed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const packetCorpus = [
  `${packetDir}/source-import.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-structured-output-source-import-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-structured-output-source-import-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-structured-output-smoke-retry-1.md',
].map((file) => read(file)).join('\n')

const fullCorpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!fullCorpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of docsForbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched: ${pattern}`)
}

const serviceSource = read('server/workers/qwen2_5_vl_cloud_run_gpu/service.py')
for (const text of [
  'FIXTURE_OUTPUT_SCHEMA_VERSION = "qwen_fixture_visual_metadata_v1"',
  'def _extract_json_object',
  'def _normalize_fixture_metadata',
  'def _summarize_output',
  '"rawOutputStoredInRepo": False',
  '"QWEN_INFERENCE_ENABLED": "false"',
]) {
  if (!serviceSource.includes(text)) fail(`service source missing ${text}`)
}

const callerSource = read('server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py')
for (const text of [
  'QWEN_CPU_CALLER_EXECUTION_ENABLED',
  'if args.print_status or not _env_bool("QWEN_CPU_CALLER_EXECUTION_ENABLED", False):',
  'structured_metadata_output_ok',
  'metadata_output.get("parsedJson") is True',
  'metadata_output.get("schemaValid") is True',
  'metadata_output.get("objectCount", 0) > 0',
  'metadata_output.get("textLikeRegionCount", 0) > 0',
]) {
  if (!callerSource.includes(text)) fail(`caller source missing ${text}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-structured-output-source-import-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_fail_closed_structured_output_source_import_ready_for_guarded_smoke_retry') fail('decision mismatch')
if (record.execution !== 'completed_fail_closed_source_import_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '5ee54acde1641dadcabf965703f4ad7e7207f2e3') fail('integration base mismatch')
if (record.importedSource?.structuredOutputSchemaVersion !== 'qwen_fixture_visual_metadata_v1') fail('schema version mismatch')
if (record.readiness?.qwenRuntime !== 'blocked_pending_guarded_structured_output_smoke_retry') fail('runtime readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1') fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-structured-output-source-import-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-structured-output-source-import-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-structured-output-source-import-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedFiles.includes(file)) fail(`blocked file changed: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(`${blocked}/`)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_fail_closed_structured_output_source_import_ready_for_guarded_smoke_retry')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1')
