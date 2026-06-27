#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-result.md`,
  `${packetDir}/artifact-manifest-summary.md`,
  `${packetDir}/fail-closed-restore.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-confirmed-adapter-runtime-fixture-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-workflow-binding-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs',
  'package.json',
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

const followOnProductWorkflowRouteIntegrationFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-route-integration-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-route-integration-1/product-route-integration-contract.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-route-integration-1/readiness-gate.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-route-integration-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-route-integration-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-route-integration-1/qwen2-5-vl-product-workflow-route-integration-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-readback-validation-1.md',
  'server/services/qwen2-5-vl-external-beta-product-workflow-route-integration.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-workflow-route-integration-1-smoke.ts',
  'src/backend/api/routes/provider-api-routes.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnProductWorkflowBindingFiles,
  ...followOnProductWorkflowRouteIntegrationFiles,
])

const requiredText = [
  packet,
  'completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture',
  'completed_confirmed_backend_adapter_runtime_fixture_with_fail_closed_restore',
  '#1312',
  '#1315',
  '#1321',
  '02cfeab7d8f98c8bbe915b3da15a95c5542f224f',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE=true',
  'QWEN_VLLM_MAX_MODEL_LEN=2048',
  'QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024',
  'QWEN_VLLM_MAX_NUM_SEQS=1',
  'QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92',
  'QWEN_FIXTURE_MAX_TOKENS=180',
  'qwen_fixture_inference_smoke_completed',
  'parsedJson=true',
  'schemaValid=true',
  'structuredMetadataOutputAccepted=true',
  'rawOutputStoredInRepo=false',
  'Fail-closed restore: `passed`',
  'External beta unlocked in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /productionUnlock"?\s*:\s*true/i,
  /broadExternalBetaUnlock"?\s*:\s*true/i,
  /paidProductionUnlock"?\s*:\s*true/i,
  /publicArtifact(?:s|Creation|Created)?"?\s*:\s*true/i,
  /signedUrl(?:s|Creation|Created)?"?\s*:\s*true/i,
  /generatedAsset(?:s|Creation|Created)?"?\s*:\s*true/i,
  /supabase(?:Mutation|Touched)"?\s*:\s*true/i,
  /sql(?:Execution|Executed)?"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /frontendProviderCall"?\s*:\s*true/i,
  /productRouteExecution"?\s*:\s*true/i,
  /creditMutation(?:Created)?"?\s*:\s*true/i,
  /stripeProcessing"?\s*:\s*true/i,
  /rawPromptExecution"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /arbitrary(?:Private|User)MediaProcessing"?\s*:\s*true/i,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-confirmed-adapter-runtime-fixture-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture') fail('decision mismatch')
if (record.execution !== 'completed_confirmed_backend_adapter_runtime_fixture_with_fail_closed_restore') {
  fail('execution mismatch')
}
if (record.integrationBase !== '02cfeab7d8f98c8bbe915b3da15a95c5542f224f') fail('integration base mismatch')
if (record.sourceEvidence?.backendRuntimeAdapterPr !== 1321) fail('missing #1321 source evidence')
if (record.runtimeEvidence?.httpStatus !== 200) fail('HTTP status mismatch')
if (record.runtimeEvidence?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.runtimeEvidence?.fixtureInferenceSmokePassed !== true) fail('fixture smoke mismatch')
if (record.runtimeEvidence?.structuredMetadataOutputAccepted !== true) fail('structured metadata acceptance mismatch')
if (record.runtimeEvidence?.runtimeContractExecutesNow !== true) fail('runtime contract execution mismatch')
if (record.metadataOutput?.parsedJson !== true) fail('parsed JSON mismatch')
if (record.metadataOutput?.schemaValid !== true) fail('schema valid mismatch')
if (record.metadataOutput?.objectCount !== 3) fail('object count mismatch')
if (record.metadataOutput?.textLikeRegionCount !== 1) fail('text-like region count mismatch')
if (record.metadataOutput?.rawOutputStoredInRepo !== false) fail('raw output repo status mismatch')
for (const key of [
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'supabaseTouched',
  'sqlExecuted',
  'workersDispatched',
  'creditMutationCreated',
]) {
  if (record.runtimeSideEffects?.[key] !== false) fail(`runtime side effect must be false: ${key}`)
}
if (record.failClosedRestore?.passed !== true) fail('fail-closed restore mismatch')
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta unlock must remain false')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs'
) {
  fail('missing confirmed runner script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-diagnostics.mjs'
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
console.log('Decision: completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1')
