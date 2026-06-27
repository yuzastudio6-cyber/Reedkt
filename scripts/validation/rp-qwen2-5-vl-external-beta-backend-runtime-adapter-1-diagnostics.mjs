#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-backend-runtime-adapter-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/backend-runtime-adapter-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-backend-runtime-adapter-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1.md',
  'server/services/qwen2-5-vl-external-beta-backend-runtime-adapter.ts',
  'server/smoke/qwen2-5-vl-external-beta-backend-runtime-adapter-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-runtime-gate-integration-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
  'package.json',
]

const followOnConfirmedAdapterRuntimeFixtureFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/artifact-manifest-summary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/fail-closed-restore.md',
  'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/qwen2-5-vl-confirmed-adapter-runtime-fixture-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-workflow-binding-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-diagnostics.mjs',
]

const followOnProductWorkflowBindingFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-binding-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-binding-1/product-workflow-binding-contract.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-binding-1/readiness-gate.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-binding-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-binding-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-binding-1/qwen2-5-vl-product-workflow-binding-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-workflow-binding-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-workflow-route-integration-1.md',
  'server/services/qwen2-5-vl-external-beta-product-workflow-binding.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-workflow-binding-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-binding-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnConfirmedAdapterRuntimeFixtureFiles,
  ...followOnProductWorkflowBindingFiles,
])

const requiredText = [
  packet,
  'completed_qwen2_5_vl_external_beta_backend_runtime_adapter_source_contract',
  'completed_backend_only_adapter_source_no_qwen_runtime_execution',
  '#1294',
  '#1297',
  '#1305',
  '#1312',
  '#1315',
  '#577 remains open/draft/blocked/excluded',
  '76353668c50a3720db6ae73302f6935368347fd2',
  '8beda22122829f7bd202a73b5816d13db827203b',
  'reeditpro-qwen2-5-vl-private-caller-pdvgn',
  'parsedJson=true',
  'schemaValid=true',
  'objectCount=3',
  'textLikeRegionCount=1',
  'structuredMetadataOutputAccepted=true',
  'rawOutputStoredInRepo=false',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only',
  'approved snapshot reference',
  'credit reservation reference',
  'queue lease reference',
  'idempotency key',
  'private artifact manifest reference',
  'private artifact checksum reference',
  'QWEN_VLLM_MAX_MODEL_LEN=2048',
  'QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024',
  'QWEN_VLLM_MAX_NUM_SEQS=1',
  'QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92',
  'reeditpro-qwen2-5-vl-l4-worker',
  'reeditpro-qwen2-5-vl-private-caller',
  'ready_for_confirmed_qwen2_5_vl_external_beta_adapter_runtime_fixture',
  'QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1',
  'QWEN runtime execution in this phase: `false`',
  'External beta unlocked in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /QWEN runtime execution in this phase:\s*`?true`?/i,
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
  /identityTokenFetch"?\s*:\s*true/i,
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

const forbiddenFilePatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^src\//,
  /^docker\//,
  /^cloudbuild\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^requirements/i,
  /^\.env/,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-backend-runtime-adapter-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_external_beta_backend_runtime_adapter_source_contract') fail('decision mismatch')
if (record.execution !== 'completed_backend_only_adapter_source_no_qwen_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '8beda22122829f7bd202a73b5816d13db827203b') fail('integration base mismatch')
if (record.sourceEvidence?.vllmL4KvCacheTuningPr !== 1312) fail('missing #1312 source evidence')
if (record.sourceEvidence?.runtimeGateIntegrationPr !== 1315) fail('missing #1315 source evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.adapter?.backendOnly !== true) fail('adapter must remain backend-only')
if (record.adapter?.sourceOnlyContract !== true) fail('adapter must remain source-only')
if (record.adapter?.executeNow !== false) fail('adapter executeNow must be false')
if (record.adapter?.futureConfirmedRuntimePacketRequired !== true) fail('future confirmed runtime packet must be required')
if (record.adapter?.targetRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.adapter?.runtimeScope !== 'approved_snapshot_structured_metadata_only') fail('runtime scope mismatch')
if (record.adapter?.adapterReadiness !== 'ready_for_confirmed_qwen2_5_vl_external_beta_adapter_runtime_fixture') {
  fail('adapter readiness mismatch')
}
if (record.requiredL4VllmConfig?.QWEN_VLLM_MAX_MODEL_LEN !== 2048) fail('max model len mismatch')
if (record.requiredL4VllmConfig?.QWEN_VLLM_MAX_NUM_BATCHED_TOKENS !== 1024) fail('max batched tokens mismatch')
if (record.requiredL4VllmConfig?.QWEN_VLLM_MAX_NUM_SEQS !== 1) fail('max seqs mismatch')
if (record.requiredL4VllmConfig?.QWEN_VLLM_GPU_MEMORY_UTILIZATION !== 0.92) fail('gpu memory utilization mismatch')
if (record.cloudRunPlan?.gpuService !== 'reeditpro-qwen2-5-vl-l4-worker') fail('gpu service mismatch')
if (record.cloudRunPlan?.cpuCallerJob !== 'reeditpro-qwen2-5-vl-private-caller') fail('cpu caller job mismatch')
for (const key of ['serviceUpdateAllowed', 'jobExecutionAllowedInThisPhase', 'identityTokenFetchAllowedInThisPhase', 'secretPayloadAccessAllowed']) {
  if (record.cloudRunPlan?.[key] !== false) fail(`Cloud Run plan flag must be false: ${key}`)
}
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
if (record.artifactPolicy?.privateArtifactsOnly !== true) fail('private artifact policy mismatch')
if (record.artifactPolicy?.publicArtifactsAllowed !== false) fail('public artifact policy mismatch')
if (record.artifactPolicy?.signedUrlsAllowed !== false) fail('signed URL policy mismatch')
if (record.artifactPolicy?.rawOutputStoredInRepo !== false) fail('raw output policy mismatch')
if (record.readiness?.backendAdapter !== 'ready_for_confirmed_qwen2_5_vl_external_beta_adapter_runtime_fixture') {
  fail('readiness backend adapter mismatch')
}
if (record.readiness?.qwenRuntimeExecutionInThisPhase !== false) fail('QWEN runtime execution must be false')
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta unlock must remain false')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1') {
  fail('next milestone mismatch')
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'sourceOnlyContract') {
    if (value !== true) fail('sourceOnlyContract must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const service = read('server/services/qwen2-5-vl-external-beta-backend-runtime-adapter.ts')
for (const text of [
  'buildQwen25VlExternalBetaBackendRuntimeAdapterContract',
  'assertQwen25VlExternalBetaBackendRuntimeAdapterResult',
  'evaluateQwen25VlExternalBetaRuntimeGate',
  'assertQwen25VlExternalBetaRuntimeGateResult',
  'ready_for_confirmed_qwen2_5_vl_external_beta_adapter_runtime_fixture',
  'reeditpro-qwen2-5-vl-l4-worker',
  'reeditpro-qwen2-5-vl-private-caller',
  'futureConfirmedRuntimePacketRequired: true',
  'executeNow: false',
  'jobExecutionAllowedInThisPhase: false',
]) {
  if (!service.includes(text)) fail(`adapter source missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-backend-runtime-adapter-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-backend-runtime-adapter-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenFilePatterns.some((pattern) => pattern.test(file))) fail(`forbidden file changed: ${file}`)
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
console.log('Decision: completed_qwen2_5_vl_external_beta_backend_runtime_adapter_source_contract')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1')
