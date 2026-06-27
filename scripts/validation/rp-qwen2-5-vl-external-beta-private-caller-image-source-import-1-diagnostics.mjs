#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRIVATE_CALLER_IMAGE_SOURCE_IMPORT_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  `${packetDir}/source-import.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-private-caller-image-source-import-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-structured-output-smoke-retry-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
  'package.json',
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
  ...followOnStructuredOutputSmokeRetryFiles,
  ...followOnVllmL4KvCacheTuningFiles,
  ...followOnRuntimeGateIntegrationFiles,
])

const requiredText = [
  packet,
  'completed_qwen2_5_vl_private_caller_image_source_import_ready_for_guarded_structured_output_smoke_retry',
  'completed_fail_closed_image_source_import_no_build_or_runtime_execution',
  '01791cb9b6c2465708fe6551d5efadcf262f005e',
  '#1241',
  '#1294',
  'QWEN_CPU_CALLER_EXECUTION_ENABLED=false',
  'QWEN runtime: `blocked_pending_guarded_structured_output_smoke_retry`',
  'ready_for_guarded_rebuild_update_before_smoke_retry',
  'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1',
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
  'dockerBuild',
  'dockerPush',
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

const forbiddenClaims = [
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed)\b/i,
  /\bQWEN runtime:\s*`?(ready|enabled|completed|production_ready)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run invocation:\s*`?(true|enabled|completed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed)\b/i,
  /\bmodel import\/load:\s*`?(true|enabled|completed)\b/i,
  /\bvLLM initialization:\s*`?(true|enabled|completed)\b/i,
  /\bDocker build:\s*`?(true|enabled|completed)\b/i,
  /\bDocker push:\s*`?(true|enabled|completed)\b/i,
  /\bDocker execution:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
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
  `${packetDir}/qwen2-5-vl-private-caller-image-source-import-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-structured-output-smoke-retry-1.md',
].map((file) => read(file)).join('\n')

const fullCorpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!fullCorpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched: ${pattern}`)
}

const dockerfile = read('docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile')
for (const text of [
  'FROM python:3.12-slim',
  'QWEN_CPU_CALLER_EXECUTION_ENABLED=false',
  'QWEN_PRIVATE_INVOKE_TARGET_URL=',
  'QWEN_PRIVATE_INVOKE_AUDIENCE=',
  'QWEN_MODEL_IMPORT_ON_STARTUP=false',
  'QWEN_INFERENCE_ENABLED=false',
  'PROVIDER_EXECUTION_ENABLED=false',
  'MEDIA_PROCESSING_ENABLED=false',
  'PUBLIC_OUTPUT_ENABLED=false',
  'TRACK_A_EXECUTION_ENABLED=false',
  'COPY server/workers/qwen2_5_vl_private_invoke_cpu_caller/',
  'CMD ["python", "/app/server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py"]',
]) {
  if (!dockerfile.includes(text)) fail(`Dockerfile missing ${text}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-private-caller-image-source-import-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_private_caller_image_source_import_ready_for_guarded_structured_output_smoke_retry') fail('decision mismatch')
if (record.execution !== 'completed_fail_closed_image_source_import_no_build_or_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '01791cb9b6c2465708fe6551d5efadcf262f005e') fail('integration base mismatch')
if (record.sourceEvidence?.structuredOutputSourceImportPr !== 1294) fail('source import PR mismatch')
if (record.sourceEvidence?.callerDockerfileSourcePr !== 1241) fail('caller Dockerfile PR mismatch')
if (record.readiness?.cpuCallerImageSource !== 'ready_for_guarded_rebuild_update_before_smoke_retry') fail('caller readiness mismatch')
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
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock changed')
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_private_caller_image_source_import_ready_for_guarded_structured_output_smoke_retry')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1')
