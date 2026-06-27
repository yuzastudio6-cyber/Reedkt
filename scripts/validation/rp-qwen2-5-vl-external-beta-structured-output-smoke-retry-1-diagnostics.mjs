#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/runtime-result.md`,
  `${packetDir}/fail-closed-restore.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-structured-output-smoke-retry-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs',
  'package.json',
]

const followOnVllmL4KvCacheTuningFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/fail-closed-restore.md',
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1/qwen2-5-vl-vllm-l4-kv-cache-tuning-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-runtime-gate-integration-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
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

const followOnBackendRuntimeAdapterFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-backend-runtime-adapter-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-backend-runtime-adapter-1/backend-runtime-adapter-contract.md',
  'docs/external-beta/qwen2-5-vl-external-beta-backend-runtime-adapter-1/readiness-gate.md',
  'docs/external-beta/qwen2-5-vl-external-beta-backend-runtime-adapter-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-backend-runtime-adapter-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-backend-runtime-adapter-1/qwen2-5-vl-backend-runtime-adapter-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1.md',
  'server/services/qwen2-5-vl-external-beta-backend-runtime-adapter.ts',
  'server/smoke/qwen2-5-vl-external-beta-backend-runtime-adapter-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnVllmL4KvCacheTuningFiles,
  ...followOnRuntimeGateIntegrationFiles,
  ...followOnBackendRuntimeAdapterFiles,
])

const requiredText = [
  packet,
  'blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable_after_timeout_repair',
  'completed_guarded_private_structured_output_smoke_retry_with_fail_closed_restore_blocked',
  '#1294',
  '#1297',
  '97663a1e3681d5e5fb1a8092ee2c1bd36cb38688',
  'reeditpro-qwen2-5-vl-private-caller-gx29k',
  'blocked_cloud_run_job_task_timeout_60s_before_structured_output_response',
  'reeditpro-qwen2-5-vl-private-caller-wz4nx',
  'blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable',
  'qwen_fixture_inference_smoke_failed',
  'No available memory for the cache blocks',
  'available KV cache memory as `-0.08 GiB`',
  'Structured output accepted: `false`',
  'Fail-closed restore: `passed`',
  'QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenClaims = [
  /\bStructured output accepted:\s*`?true\b/i,
  /\bQWEN runtime:\s*`?(ready|enabled|production_ready)\b/i,
  /\bbroad external beta unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
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

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden readiness/unlock claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-structured-output-smoke-retry-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable_after_timeout_repair') fail('decision mismatch')
if (record.execution !== 'completed_guarded_private_structured_output_smoke_retry_with_fail_closed_restore_blocked') fail('execution mismatch')
if (record.integrationBase !== '97663a1e3681d5e5fb1a8092ee2c1bd36cb38688') fail('integration base mismatch')
if (record.sourceEvidence?.structuredOutputSourceImportPr !== 1294) fail('missing #1294 reference')
if (record.sourceEvidence?.privateCallerImageSourceImportPr !== 1297) fail('missing #1297 reference')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.attempts?.[0]?.result !== 'blocked_cloud_run_job_task_timeout_60s_before_structured_output_response') fail('attempt 1 blocker mismatch')
if (record.attempts?.[1]?.result !== 'blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable') fail('attempt 2 blocker mismatch')
if (record.attempts?.[1]?.httpStatus !== 500) fail('expected final HTTP 500')
if (record.attempts?.[1]?.structuredMetadataOutputAccepted !== false) fail('structured metadata must be unaccepted')
if (record.acceptance?.parsedJson !== false) fail('parsedJson must be false')
if (record.acceptance?.schemaValid !== false) fail('schemaValid must be false')
if (record.acceptance?.objectCount !== 0) fail('object count must be zero')
if (record.acceptance?.textLikeRegionCount !== 0) fail('text-like region count must be zero')
if (record.acceptance?.rawOutputStoredInRepo !== false) fail('raw output storage status mismatch')
if (record.failClosedRestore?.passed !== true) fail('fail-closed restore did not pass')
if (record.failClosedRestore?.jobTaskTimeoutSeconds !== 60) fail('job timeout was not restored')
if (record.failClosedRestore?.serviceGatesDisabled !== true) fail('service gates not disabled')
if (record.failClosedRestore?.jobGatesDisabled !== true) fail('job gates not disabled')
if (record.readiness?.qwenRuntime !== 'blocked_pending_qwen2_5_vl_l4_vllm_kv_cache_tuning') fail('runtime readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1') fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs'
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
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable_after_timeout_repair')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1')
