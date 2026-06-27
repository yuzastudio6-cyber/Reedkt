#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/runtime-result.md`,
  `${packetDir}/fail-closed-restore.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-vllm-l4-kv-cache-tuning-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-runtime-gate-integration-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
  'package.json',
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

const allowedFiles = new Set([...requiredFiles, ...followOnRuntimeGateIntegrationFiles, ...followOnBackendRuntimeAdapterFiles])

const requiredText = [
  packet,
  'completed_qwen2_5_vl_l4_vllm_kv_cache_tuning_structured_output_smoke_passed',
  'completed_guarded_private_structured_output_smoke_with_tuned_l4_vllm_config_and_fail_closed_restore',
  '#1294',
  '#1297',
  '#1305',
  'QWEN_VLLM_MAX_MODEL_LEN=2048',
  'QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024',
  'QWEN_VLLM_MAX_NUM_SEQS=1',
  'QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92',
  'reeditpro-qwen2-5-vl-private-caller-pdvgn',
  'qwen_fixture_inference_smoke_completed',
  'parsedJson=true',
  'schemaValid=true',
  'objectCount=3',
  'textLikeRegionCount=1',
  'rawOutputStoredInRepo=false',
  'f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4',
  'Fail-closed restore: `passed`',
  'ready_for_external_beta_runtime_gate_integration',
  'QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenClaims = [
  /\bbroad external beta unlock:\s*`?(true|enabled|completed|unlocked)/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed|unlocked)/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed)/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)/i,
  /\bSQL execution:\s*`?(true|enabled|completed)/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)/i,
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
  if (pattern.test(corpus)) fail(`forbidden unlock/readiness claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-vllm-l4-kv-cache-tuning-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_l4_vllm_kv_cache_tuning_structured_output_smoke_passed') fail('decision mismatch')
if (record.execution !== 'completed_guarded_private_structured_output_smoke_with_tuned_l4_vllm_config_and_fail_closed_restore') fail('execution mismatch')
if (record.integrationBase !== '0de95eef8d41a55704ade915d774d988584c3ab8') fail('integration base mismatch')
if (record.sourceEvidence?.structuredOutputSourceImportPr !== 1294) fail('missing #1294 reference')
if (record.sourceEvidence?.privateCallerImageSourceImportPr !== 1297) fail('missing #1297 reference')
if (record.sourceEvidence?.structuredOutputSmokeRetryBlockerPr !== 1305) fail('missing #1305 reference')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.tuningConfig?.QWEN_VLLM_MAX_MODEL_LEN !== 2048) fail('max model len mismatch')
if (record.tuningConfig?.QWEN_VLLM_MAX_NUM_BATCHED_TOKENS !== 1024) fail('max batched tokens mismatch')
if (record.tuningConfig?.QWEN_VLLM_MAX_NUM_SEQS !== 1) fail('max seqs mismatch')
if (record.tuningConfig?.QWEN_VLLM_GPU_MEMORY_UTILIZATION !== 0.92) fail('gpu memory utilization mismatch')
if (record.runtimeEvidence?.execution !== 'reeditpro-qwen2-5-vl-private-caller-pdvgn') fail('execution mismatch')
if (record.runtimeEvidence?.fixtureInferenceSmokePassed !== true) fail('fixture smoke did not pass')
if (record.runtimeEvidence?.structuredMetadataOutputAccepted !== true) fail('structured metadata not accepted')
if (record.metadataOutput?.parsedJson !== true) fail('parsedJson mismatch')
if (record.metadataOutput?.schemaValid !== true) fail('schemaValid mismatch')
if (record.metadataOutput?.objectCount !== 3) fail('object count mismatch')
if (record.metadataOutput?.textLikeRegionCount !== 1) fail('text-like region count mismatch')
if (record.metadataOutput?.rawOutputStoredInRepo !== false) fail('raw output status mismatch')
if (record.runtimeSideEffects?.generatedAssetsCreated !== false) fail('generated assets must be false')
if (record.runtimeSideEffects?.publicArtifactsCreated !== false) fail('public artifacts must be false')
if (record.runtimeSideEffects?.signedUrlsCreated !== false) fail('signed URLs must be false')
if (record.runtimeSideEffects?.supabaseTouched !== false) fail('Supabase must be false')
if (record.runtimeSideEffects?.sqlExecuted !== false) fail('SQL must be false')
if (record.failClosedRestore?.passed !== true) fail('fail-closed restore did not pass')
if (record.failClosedRestore?.jobTaskTimeoutSeconds !== 60) fail('job timeout was not restored')
if (record.failClosedRestore?.temporaryTuningEnvRemoved !== true) fail('temporary tuning env was not removed')
if (record.readiness?.qwenRuntime !== 'ready_for_external_beta_runtime_gate_integration') fail('runtime readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1') fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-diagnostics.mjs'
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
console.log('Decision: completed_qwen2_5_vl_l4_vllm_kv_cache_tuning_structured_output_smoke_passed')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1')
