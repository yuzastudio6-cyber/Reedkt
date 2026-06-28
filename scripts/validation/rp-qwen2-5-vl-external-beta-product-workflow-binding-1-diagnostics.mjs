#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-binding-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/product-workflow-binding-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-workflow-binding-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-workflow-binding-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-workflow-route-integration-1.md',
  'server/services/qwen2-5-vl-external-beta-product-workflow-binding.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-workflow-binding-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-binding-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs',
  'package.json',
]

const allowedFiles = new Set(requiredFiles)

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

const followOnProductRouteReadbackValidationFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-1/route-readback-validation-gate.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-1/required-readback-references.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-1/qwen2-5-vl-product-route-readback-validation-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-readback-validation-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1.md',
  'server/services/qwen2-5-vl-external-beta-product-route-readback-validation.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-route-readback-validation-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-1-diagnostics.mjs',
]

for (const file of followOnProductWorkflowRouteIntegrationFiles) allowedFiles.add(file)
for (const file of followOnProductRouteReadbackValidationFiles) allowedFiles.add(file)

const requiredText = [
  packet,
  'completed_qwen2_5_vl_external_beta_product_workflow_binding_source_contract',
  'completed_product_workflow_binding_source_no_runtime_execution',
  '#1321',
  '#1328',
  '012f436a38b6a525246c673923105b14ae36c727',
  'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d',
  'qwen_fixture_inference_smoke_completed',
  'parsedJson=true',
  'schemaValid=true',
  'structuredMetadataOutputAccepted=true',
  'rawOutputStoredInRepo=false',
  'fail-closed restore `passed`',
  'source sequence map reference',
  'compiled intent snapshot reference',
  'approved snapshot reference',
  'credit reservation reference',
  'queue lease reference',
  'idempotency key',
  'private artifact manifest reference',
  'private artifact checksum reference',
  'model routing policy reference',
  'QA policy reference',
  'ready_for_guarded_qwen2_5_vl_external_beta_product_workflow_route_integration',
  'Product route execution allowed now: `false`',
  'Worker dispatch allowed now: `false`',
  'Provider/model call allowed now: `false`',
  'Final render/export allowed now: `false`',
  'Broad external beta unlock allowed now: `false`',
  'External beta unlocked in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /Product route execution (?:allowed|in this phase):\s*`?true`?/i,
  /Worker dispatch (?:allowed|in this phase):\s*`?true`?/i,
  /Provider\/model call (?:allowed|in this phase):\s*`?true`?/i,
  /QWEN runtime execution in this phase:\s*`?true`?/i,
  /Final render\/export (?:allowed|in this phase):\s*`?true`?/i,
  /Broad external beta unlock allowed now:\s*`?true`?/i,
  /productionUnlock"?\s*:\s*true/i,
  /publicArtifact(?:s|Creation|Created)?"?\s*:\s*true/i,
  /signedUrl(?:s|Creation|Created)?"?\s*:\s*true/i,
  /supabase(?:Mutation|Touched)"?\s*:\s*true/i,
  /sql(?:Execution|Executed)?"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /creditMutation(?:Created)?"?\s*:\s*true/i,
  /rawPromptExecution"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /arbitrary(?:Private|User)MediaProcessing"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const forbiddenFilePatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-workflow-binding-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_external_beta_product_workflow_binding_source_contract') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_product_workflow_binding_source_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '012f436a38b6a525246c673923105b14ae36c727') fail('integration base mismatch')
if (record.sourceEvidence?.backendRuntimeAdapterPr !== 1321) fail('missing #1321 source evidence')
if (record.sourceEvidence?.confirmedAdapterRuntimeFixturePr !== 1328) fail('missing #1328 source evidence')
if (record.sourceEvidence?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.sourceEvidence?.parsedJson !== true) fail('parsed JSON mismatch')
if (record.sourceEvidence?.schemaValid !== true) fail('schema valid mismatch')
if (record.sourceEvidence?.structuredMetadataOutputAccepted !== true) fail('structured metadata mismatch')
if (record.sourceEvidence?.rawOutputStoredInRepo !== false) fail('raw output policy mismatch')
if (record.sourceEvidence?.failClosedRestorePassed !== true) fail('restore mismatch')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (
  record.productWorkflowBinding?.readyStatus !==
  'ready_for_guarded_qwen2_5_vl_external_beta_product_workflow_route_integration'
) {
  fail('ready status mismatch')
}
for (const required of [
  'approved_snapshot_reference',
  'credit_reservation_reference',
  'queue_lease_reference',
  'idempotency_key',
  'private_input_manifest_reference',
  'private_artifact_manifest_reference',
  'private_artifact_checksum_reference',
]) {
  if (!record.productWorkflowBinding?.requiredReferences?.includes(required)) fail(`missing required reference: ${required}`)
}
for (const key of [
  'productRouteExecution',
  'workerDispatch',
  'providerModelCall',
  'rawPromptExecution',
  'arbitraryUserMedia',
  'publicArtifacts',
  'signedUrls',
  'finalRenderExport',
  'broadExternalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
]) {
  if (record.blockedNow?.[key] !== 'blocked') fail(`blockedNow status must be blocked: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'sourceOnlyContract') {
    if (value !== true) fail('sourceOnlyContract must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const service = read('server/services/qwen2-5-vl-external-beta-product-workflow-binding.ts')
for (const text of [
  'buildQwen25VlExternalBetaProductWorkflowBinding',
  'assertQwen25VlExternalBetaProductWorkflowBindingResult',
  'ready_for_guarded_qwen2_5_vl_external_beta_product_workflow_route_integration',
  'completed_product_workflow_binding_source_no_runtime_execution',
  'productRouteExecutionAllowedNow: false',
  'workerDispatchAllowedNow: false',
  'providerModelCallAllowedNow: false',
  'finalRenderExportAllowedNow: false',
  'broadExternalBetaUnlockAllowedNow: false',
]) {
  if (!service.includes(text)) fail(`service source missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-workflow-binding-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-workflow-binding-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-workflow-binding-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-binding-1-diagnostics.mjs'
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
console.log('Decision: completed_qwen2_5_vl_external_beta_product_workflow_binding_source_contract')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1')
