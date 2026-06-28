#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-handler-source-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/route-handler-contract.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-handler-source-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-handler-source-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-handler-fail-closed-runtime-validation-1.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1.md',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-route-handler-source-1-smoke.ts',
  'server/routes/provider-gateway-routes.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-handler-source-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-binding-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract',
  'completed_backend_route_handler_source_no_provider_or_remote_execution',
  '#1321',
  '#1328',
  '#1333',
  '#1339',
  '#1343',
  '9d7a3b67ad77279291b0fe0cd9caa766af95797b',
  '#577 remains open/draft/blocked/excluded',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  '/api/providers/qwen2-5-vl/structured-visual-metadata',
  'Route handler registered now: `true`',
  'Route handler fail-closed: `true`',
  'Idempotency database mutation in this source phase: `false`',
  'PROVIDER_ROUTE_BLOCKED',
  'HTTP `424`',
  'ready_for_guarded_qwen2_5_vl_product_route_handler_fail_closed_runtime_validation',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_FAIL_CLOSED_RUNTIME_VALIDATION_1',
  'Route execution accepted now: `false`',
  'Route readback execution allowed now: `false`',
  'Provider/model call allowed now: `false`',
  'Worker dispatch allowed now: `false`',
  'Media processing allowed now: `false`',
  'Signed URL creation allowed now: `false`',
  'Public artifact allowed now: `false`',
  'Final render/export allowed now: `false`',
  'External beta unlock allowed now: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /(?:Route execution accepted|Route readback execution|Provider\/model call|Worker dispatch|Media processing|Signed URL creation|Public artifact|Final render\/export|External beta unlock|Paid production unlock|Production unlock) allowed now:\s*`?true`?/i,
  /Route execution in this phase:\s*`?true`?/i,
  /routeExecutionInThisPhase"?\s*:\s*true/i,
  /routeReadbackExecution"?\s*:\s*true/i,
  /supabaseReadbackExecution"?\s*:\s*true/i,
  /serviceRoleReadbackExecution"?\s*:\s*true/i,
  /qwenRuntimeExecuted(?:InThisPhase)?"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch(?:AllowedNow)?"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /signedUrlCreation(?:AllowedNow)?"?\s*:\s*true/i,
  /publicArtifact(?:Creation|AllowedNow)?"?\s*:\s*true/i,
  /mediaProcessing(?:AllowedNow)?"?\s*:\s*true/i,
  /privateUserMediaProcessing"?\s*:\s*true/i,
  /rawPromptExecution"?\s*:\s*true/i,
  /finalRenderExport(?:AllowedNow)?"?\s*:\s*true/i,
  /externalBetaUnlock(?:AllowedNow|AppliedToEnvironment)?"?\s*:\s*true/i,
  /paidProductionUnlock(?:AllowedNow)?"?\s*:\s*true/i,
  /productionUnlock(?:AllowedNow)?"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
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
  /(?:^|\/)(?:dist|node_modules)\//,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-handler-source-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract') fail('decision mismatch')
if (record.execution !== 'completed_backend_route_handler_source_no_provider_or_remote_execution') fail('execution mismatch')
if (record.integrationBase !== '9d7a3b67ad77279291b0fe0cd9caa766af95797b') fail('integration base mismatch')
if (record.sourceEvidence?.productRouteReadbackValidationPr !== 1343) fail('missing #1343 source evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.route?.routeHandlerRegisteredNow !== true) fail('route handler must be registered')
if (record.route?.routeHandlerFailClosed !== true) fail('route handler must fail closed')
if (record.route?.idempotencyDatabaseMutationInThisSourcePhase !== false) fail('idempotency DB mutation must be false')
for (const [key, value] of Object.entries(record.allowedExecution ?? {})) {
  if (key === 'routeHandlerRegisteredNow') {
    if (value !== true) fail('routeHandlerRegisteredNow must be true')
    continue
  }
  if (value !== false) fail(`allowed execution flag must be false: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'backendRouteHandlerSourceOnly' || key === 'routeHandlerRegisteredNow') {
    if (value !== true) fail(`safety flag must be true: ${key}`)
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (
  record.readiness?.qwenProductRouteHandlerSource !==
  'ready_for_guarded_qwen2_5_vl_product_route_handler_fail_closed_runtime_validation'
) {
  fail('readiness status mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_FAIL_CLOSED_RUNTIME_VALIDATION_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const routeSource = read('server/routes/provider-gateway-routes.ts')
for (const text of [
  "router.post('/api/providers/qwen2-5-vl/structured-visual-metadata'",
  'requireAuth',
  'idempotency-key',
  'createQwen25VlExternalBetaProductRouteHandlerSource',
  'throwFailClosed',
]) {
  if (!routeSource.includes(text)) fail(`provider route source missing ${text}`)
}

const serviceSource = read('server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts')
for (const text of [
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_1',
  'completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract',
  'completed_backend_route_handler_source_no_provider_or_remote_execution',
  'routeHandlerRegisteredNow: true',
  'routeExecutionAcceptedNow: false',
  'routeReadbackExecutionAllowedNow: false',
  'providerModelCallAllowedNow: false',
  'routeExecutionInThisPhase: false',
  'providerCall: false',
  'modelCall: false',
  'supabaseMutation: false',
  'sqlExecution: false',
]) {
  if (!serviceSource.includes(text)) fail(`handler service source missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-route-handler-source-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-route-handler-source-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-handler-source-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-handler-source-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set(requiredFiles)
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
console.log('Decision: completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_FAIL_CLOSED_RUNTIME_VALIDATION_1')
