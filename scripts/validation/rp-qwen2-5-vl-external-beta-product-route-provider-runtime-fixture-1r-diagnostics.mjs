#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/product-route-runtime-fixture-1r.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-1r-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-diagnostics.mjs',
  'server/smoke/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-diagnostics.mjs',
  'package.json',
]

const followupAllowedFiles = [
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed/confirmed-runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed/fail-closed-restore.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed/qwen2-5-vl-product-route-provider-runtime-fixture-1r-confirmed-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed/runtime-evidence.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed/validation-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed-diagnostics.mjs',
]

const requiredText = [
  packet,
  'blocked_pending_product_route_provider_runtime_fixture_confirmation',
  'completed_guarded_runner_source_no_provider_or_model_execution',
  '8b4ebd66cbf634311b9acd1cc512ef77a5ce1333',
  '#1376',
  '#1380',
  '#577 remains open/draft/blocked/excluded',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs',
  'Product route provider runtime fixture: `not_run_confirmation_absent`',
  'Provider/model calls executed in this phase: `none`',
  'Cloud Run execution in this phase: `none`',
  'Route behavior changed in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /Route behavior changed in this phase:\s*`?true`?/i,
  /providerRuntimeExecutedInThisPhase"?\s*:\s*true/i,
  /modelRuntimeExecutedInThisPhase"?\s*:\s*true/i,
  /cloudRunExecutionInThisPhase"?\s*:\s*true/i,
  /routeExecutionInThisPhase"?\s*:\s*true/i,
  /frontendProviderModelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /privateUserMediaProcessing"?\s*:\s*true/i,
  /rawPromptExecution"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /externalBetaUnlock(?:AppliedToEnvironment)?"?\s*:\s*true/i,
  /paidProductionUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
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
  /^server\/routes\//,
  /^server\/workers\//,
  /^server\/services\/(?!qwen2-5-vl-external-beta-product-route-handler-source\.ts$)/,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-1r-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_pending_product_route_provider_runtime_fixture_confirmation') fail('decision mismatch')
if (record.execution !== 'completed_guarded_runner_source_no_provider_or_model_execution') fail('execution mismatch')
if (record.integrationBase !== '8b4ebd66cbf634311b9acd1cc512ef77a5ce1333') fail('integration base mismatch')
if (record.sourceEvidence?.productRouteProviderRuntimeFixturePr !== 1376) fail('missing #1376 evidence')
if (record.sourceEvidence?.backendJobHandoffPr !== 1380) fail('missing #1380 evidence')
if (record.sourceEvidence?.backendJobHandoffMergeSha !== '8b4ebd66cbf634311b9acd1cc512ef77a5ce1333') {
  fail('missing #1380 merge SHA')
}
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.confirmationGate?.env !== 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE') {
  fail('confirmation env mismatch')
}
if (record.confirmationGate?.defaultConfirmed !== false) fail('default confirmation must be false')
if (record.confirmationGate?.currentImplementationEnvironmentConfirmed !== false) {
  fail('current implementation must record absent confirmation')
}
if (record.runner?.delegatesToExistingAdapterFixture !== true) fail('runner must delegate to existing adapter fixture')
if (record.route?.routeBehaviorChangedInThisPhase !== false) fail('route behavior must not change')
if (record.route?.productRouteProviderRuntimeFixture !== 'not_run_confirmation_absent') fail('fixture status mismatch')
if (record.blocker !== 'blocked_pending_product_route_provider_runtime_fixture_confirmation') fail('blocker mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'guardedRunnerSource') {
    if (value !== true) fail('guarded runner source flag must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.readiness?.backendJobHandoff !== 'ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture') {
  fail('backend handoff readiness mismatch')
}
if (record.readiness?.qwenProductRouteProviderRuntimeFixture1r !== 'blocked_pending_product_route_provider_runtime_fixture_confirmation') {
  fail('1R readiness mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const runner = read('scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.mjs')
for (const text of [
  "const confirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE'",
  "const backendHandoffEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF'",
  "const adapterFixtureConfirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE'",
  'blocked_pending_product_route_provider_runtime_fixture_confirmation',
  'smoke:qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r',
  'rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs',
  'finalize(report, 2)',
]) {
  if (!runner.includes(text)) fail(`runner missing ${text}`)
}

const smoke = read('server/smoke/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-smoke.ts')
for (const text of [
  'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE',
  'buildQwen25VlExternalBetaProductRouteBackendJobHandoff',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_READY_STATUS',
  'assert.equal(handoff.backendHandoff.providerRuntimeExecutedNow, false)',
  'assert.equal(handoff.allowedExecution.cloudRunJobExecutionAllowedNow, false)',
  'blocked_product_route_handler_unsafe_runtime_request',
]) {
  if (!smoke.includes(text)) fail(`smoke missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-smoke.ts'
) {
  fail('missing 1R smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.mjs'
) {
  fail('missing 1R runner script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-diagnostics.mjs'
) {
  fail('missing 1R diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([...requiredFiles, ...followupAllowedFiles])
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
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_pending_product_route_provider_runtime_fixture_confirmation')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED')
