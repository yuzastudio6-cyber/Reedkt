#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-runtime-gate-integration-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-gate-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-runtime-gate-integration-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-runtime-gate-integration-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-backend-runtime-adapter-1.md',
  'server/config/qwen2-5-vl-external-beta-runtime-gate-contract.ts',
  'server/smoke/qwen2-5-vl-external-beta-runtime-gate-integration-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-runtime-gate-integration-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
  'package.json',
]

const allowedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_qwen2_5_vl_external_beta_runtime_gate_integration_source_contract',
  'completed_source_contract_no_qwen_runtime_execution',
  '#1294',
  '#1297',
  '#1305',
  '#1312',
  '76353668c50a3720db6ae73302f6935368347fd2',
  'reeditpro-qwen2-5-vl-private-caller-pdvgn',
  'parsedJson=true',
  'schemaValid=true',
  'objectCount=3',
  'textLikeRegionCount=1',
  'structuredMetadataOutputAccepted=true',
  'Fail-closed restore: `passed`',
  'QWEN_VLLM_MAX_MODEL_LEN=2048',
  'QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024',
  'QWEN_VLLM_MAX_NUM_SEQS=1',
  'QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92',
  'approved snapshot reference',
  'credit reservation reference',
  'queue lease reference',
  'idempotency key',
  'private artifact manifest reference',
  'private artifact checksum reference',
  'ready_backend_only_qwen_structured_metadata_runtime_gate',
  'ready_for_backend_only_external_beta_runtime_gate_adapter',
  'QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1',
  'External beta unlocked in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /externalBetaUnlock(?:ed|AppliedToEnvironment)?"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /paidProductionAllowed"?\s*:\s*true/i,
  /publicArtifactsAllowed"?\s*:\s*true/i,
  /signedUrlsAllowed"?\s*:\s*true/i,
  /finalRenderExportAllowed"?\s*:\s*true/i,
  /frontendProviderCallsAllowed"?\s*:\s*true/i,
  /frontendModelCallsAllowed"?\s*:\s*true/i,
  /rawPromptExecutionAllowed"?\s*:\s*true/i,
  /arbitraryUserMediaAllowed"?\s*:\s*true/i,
  /qwenRuntimeExecuted"?\s*:\s*true/i,
  /cloudRunServiceUpdated"?\s*:\s*true/i,
  /cloudRunJobExecuted"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
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
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-runtime-gate-integration-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_external_beta_runtime_gate_integration_source_contract') fail('decision mismatch')
if (record.execution !== 'completed_source_contract_no_qwen_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '76353668c50a3720db6ae73302f6935368347fd2') fail('integration base mismatch')
if (record.sourceEvidence?.vllmL4KvCacheTuningPr !== 1312) fail('missing #1312 source evidence')
if (record.sourceEvidence?.vllmL4KvCacheTuningMergeSha !== '76353668c50a3720db6ae73302f6935368347fd2') fail('missing #1312 merge SHA')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.acceptedRuntimeEvidence?.parsedJson !== true) fail('parsedJson mismatch')
if (record.acceptedRuntimeEvidence?.schemaValid !== true) fail('schemaValid mismatch')
if (record.acceptedRuntimeEvidence?.objectCount !== 3) fail('object count mismatch')
if (record.acceptedRuntimeEvidence?.textLikeRegionCount !== 1) fail('text-like region count mismatch')
if (record.acceptedRuntimeEvidence?.structuredMetadataOutputAccepted !== true) fail('structured output acceptance mismatch')
if (record.acceptedRuntimeEvidence?.rawOutputStoredInRepo !== false) fail('raw output status mismatch')
if (record.acceptedRuntimeEvidence?.failClosedRestorePassed !== true) fail('fail-closed restore mismatch')
if (record.requiredL4VllmConfig?.QWEN_VLLM_MAX_MODEL_LEN !== 2048) fail('max model len mismatch')
if (record.requiredL4VllmConfig?.QWEN_VLLM_MAX_NUM_BATCHED_TOKENS !== 1024) fail('max batched tokens mismatch')
if (record.requiredL4VllmConfig?.QWEN_VLLM_MAX_NUM_SEQS !== 1) fail('max seqs mismatch')
if (record.requiredL4VllmConfig?.QWEN_VLLM_GPU_MEMORY_UTILIZATION !== 0.92) fail('gpu memory utilization mismatch')
for (const key of [
  'approvedSnapshotRequired',
  'creditReservationRequired',
  'queueLeaseRequired',
  'idempotencyKeyRequired',
  'privateArtifactManifestRequired',
  'privateArtifactChecksumRequired',
  'backendOnlyAdapterRequired',
  'structuredMetadataOnly',
]) {
  if (record.runtimeGate?.[key] !== true) fail(`runtime gate flag must be true: ${key}`)
}
for (const key of [
  'frontendProviderCallsAllowed',
  'frontendModelCallsAllowed',
  'rawPromptExecutionAllowed',
  'arbitraryUserMediaAllowed',
  'publicArtifactsAllowed',
  'signedUrlsAllowed',
  'broadExternalBetaAllowed',
  'paidProductionAllowed',
  'productionAllowed',
  'finalRenderExportAllowed',
]) {
  if (record.runtimeGate?.[key] !== false) fail(`runtime gate flag must be false: ${key}`)
}
if (record.readiness?.qwenStructuredOutputRuntime !== 'ready_for_backend_only_external_beta_runtime_gate_adapter') fail('QWEN readiness mismatch')
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta unlock must remain false')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1') fail('next milestone mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'sourceOnlyContract') {
    if (value !== true) fail('sourceOnlyContract must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const contract = read('server/config/qwen2-5-vl-external-beta-runtime-gate-contract.ts')
for (const text of [
  'evaluateQwen25VlExternalBetaRuntimeGate',
  'assertQwen25VlExternalBetaRuntimeGateResult',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE',
  'approved_snapshot_structured_metadata_only',
  'blocked_missing_approved_snapshot_reference',
  'blocked_frontend_provider_or_model_call_attempt',
  'blocked_public_or_signed_artifact_request',
  'ready_backend_only_qwen_structured_metadata_runtime_gate',
]) {
  if (!contract.includes(text)) fail(`contract missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-runtime-gate-integration-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-runtime-gate-integration-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-runtime-gate-integration-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-runtime-gate-integration-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
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
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_external_beta_runtime_gate_integration_source_contract')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1')
