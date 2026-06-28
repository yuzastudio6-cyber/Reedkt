#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/backend-job-handoff-contract.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-backend-job-handoff-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.md',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_product_route_backend_job_handoff_source_contract',
  'completed_backend_only_handoff_source_no_provider_or_model_execution',
  'c0f7d05020dedc0d63e43d293d68a6fb893ff3e8',
  '#1368',
  '#1370',
  '#1376',
  '#577 remains open/draft/blocked/excluded',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF',
  'ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture',
  'qwen2_5_vl_confirmed_private_adapter_runtime_fixture',
  'Default route behavior remains fail-closed',
  'Route behavior changed in this phase: `false`',
  'Provider/model runtime execution: `not_run`',
  'Backend handoff source: `implemented`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /Route behavior changed in this phase:\s*`?true`?/i,
  /routeBehaviorChanged(?:InThisPhase)?"?\s*:\s*true/i,
  /qwenRuntimeExecuted(?:InThisPhase)?"?\s*:\s*true/i,
  /productRouteProviderRuntimeExecution"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /frontendProviderModelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /cloudRunServiceUpdate"?\s*:\s*true/i,
  /cloudRunJobExecution"?\s*:\s*true/i,
  /identityTokenFetch"?\s*:\s*true/i,
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

const service = read('server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts')
for (const text of [
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_PACKET',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV',
  'buildQwen25VlExternalBetaProductRouteBackendJobHandoff',
  'assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult',
  'buildBackendJobHandoff(input: Qwen25VlExternalBetaProductRouteHandlerSourceInput)',
  'providerRuntimeExecutedNow: false',
  'cloudRunExecutionAllowedNow: false',
  'routeBehaviorChangedInThisPhase: false',
]) {
  if (!service.includes(text)) fail(`service source missing ${text}`)
}
if (/execFileSync|spawnSync|gcloud|run jobs execute|identity token/i.test(service)) {
  fail('service source must not shell out or execute Cloud Run')
}

const smoke = read('server/smoke/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-smoke.ts')
for (const text of [
  'blocked_pending_backend_job_handoff_confirmation',
  'blocked_pending_route_readback_validation_gate',
  'blocked_product_route_handler_unsafe_runtime_request',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_READY_STATUS',
  'assert.equal(ready.backendHandoff.handoffPrepared, true)',
  'assert.equal(ready.backendHandoff.providerRuntimeExecutedNow, false)',
  'assert.equal(ready.allowedExecution.cloudRunJobExecutionAllowedNow, false)',
  'assert.equal(ready.safety.providerCall, false)',
  'assert.equal(ready.safety.modelCall, false)',
]) {
  if (!smoke.includes(text)) fail(`smoke source missing ${text}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-backend-job-handoff-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_product_route_backend_job_handoff_source_contract') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_backend_only_handoff_source_no_provider_or_model_execution') fail('execution mismatch')
if (record.integrationBase !== 'c0f7d05020dedc0d63e43d293d68a6fb893ff3e8') fail('integration base mismatch')
if (record.sourceEvidence?.productRouteProviderRuntimeFixturePr !== 1376) fail('missing #1376 evidence')
if (record.sourceEvidence?.productRouteProviderRuntimeFixtureMergeSha !== 'c0f7d05020dedc0d63e43d293d68a6fb893ff3e8') {
  fail('missing #1376 merge SHA')
}
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.confirmationGate?.env !== 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF') fail('confirm env mismatch')
if (record.confirmationGate?.defaultConfirmed !== false) fail('default confirmation must be false')
if (record.route?.routeBehaviorChangedInThisPhase !== false) fail('route behavior must not change')
if (record.backendHandoff?.sourceContractImplemented !== true) fail('handoff source contract missing')
if (record.backendHandoff?.backendOnly !== true) fail('handoff must be backend-only')
if (record.backendHandoff?.handoffEnvelopeValidatedBySmoke !== true) fail('handoff smoke evidence missing')
if (record.backendHandoff?.providerRuntimeExecutedNow !== false) fail('provider runtime must not execute')
if (record.backendHandoff?.workerDispatchAllowedNow !== false) fail('worker dispatch must remain false')
if (record.backendHandoff?.cloudRunExecutionAllowedNow !== false) fail('Cloud Run execution must remain false')
for (const requiredRef of [
  'approvedSnapshotReadbackRef',
  'creditReservationReadbackRef',
  'queueLeaseReadbackRef',
  'routeIdempotencyKey',
  'privateInputManifestReadbackRef',
  'privateArtifactManifestReadbackRef',
  'privateArtifactChecksumReadbackRef',
  'sourceSequenceMapReadbackRef',
  'compiledIntentReadbackRef',
  'editPlanVersionReadbackRef',
  'modelRoutingPolicyReadbackRef',
  'qaPolicyReadbackRef',
]) {
  if (!record.backendHandoff?.requiredRefs?.includes(requiredRef)) fail(`missing required ref: ${requiredRef}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'backendOnlyHandoffSource' || key === 'sourceContractOnly') {
    if (value !== true) fail(`safety flag must be true: ${key}`)
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.readiness?.qwenProductRouteBackendJobHandoff !== 'ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture') {
  fail('readiness status mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-route-backend-job-handoff-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-diagnostics.mjs'
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
console.log('Decision: completed_qwen2_5_vl_product_route_backend_job_handoff_source_contract')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R')
