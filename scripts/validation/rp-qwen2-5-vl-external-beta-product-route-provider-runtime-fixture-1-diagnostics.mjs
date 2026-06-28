#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/product-route-runtime-fixture-blocker.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1/backend-job-handoff-contract.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1/qwen2-5-vl-product-route-backend-job-handoff-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-results.md',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-handler-fail-closed-runtime-validation-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_pending_backend_job_handoff_wiring_for_product_route_provider_runtime_fixture',
  'completed_docs_only_product_route_provider_runtime_fixture_blocker_no_provider_or_model_execution',
  '12b52c2f7fb33bee5dc391a9131a1f19576071e1',
  'd9f214786b40acef7664c1904130f0e4ac6bfc00',
  '#1368',
  '#1370',
  '#577 remains open/draft/blocked/excluded',
  'source_derived_repo_evidence',
  'Generic owner approval blocker: `closed`',
  'blocked_product_route_provider_runtime_fixture_requires_backend_job_handoff_wiring',
  'fail_closed_before_provider_runtime',
  'backend job handoff wiring',
  'Provider/model calls executed in this phase: `none`',
  'Route behavior changed in this phase: `false`',
  'Product route provider runtime fixture: `not_run_product_route_missing_backend_job_handoff`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /Route behavior changed in this phase:\s*`?true`?/i,
  /backendJobHandoffWiringPresent"?\s*:\s*true/i,
  /providerRuntimeFixtureThroughProductRoute"?\s*:\s*"(?!not_run_product_route_missing_backend_job_handoff)/i,
  /qwenRuntimeExecuted(?:InThisPhase)?"?\s*:\s*true/i,
  /remoteRouteExecution"?\s*:\s*true/i,
  /productRouteProviderRuntimeExecution"?\s*:\s*true/i,
  /cloudRunServiceUpdate"?\s*:\s*true/i,
  /cloudRunJobExecution"?\s*:\s*true/i,
  /identityTokenFetch"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /frontendProviderModelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
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
  /routeBehaviorChange"?\s*:\s*true/i,
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
  /^server\/services\/(?!qwen2-5-vl-external-beta-product-route-handler-source\.ts$)/,
  /^server\/workers\//,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_pending_backend_job_handoff_wiring_for_product_route_provider_runtime_fixture') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_docs_only_product_route_provider_runtime_fixture_blocker_no_provider_or_model_execution') {
  fail('execution mismatch')
}
if (record.integrationBase !== '12b52c2f7fb33bee5dc391a9131a1f19576071e1') fail('integration base mismatch')
if (record.sourceEvidence?.productRouteReadbackRuntimeValidationPr !== 1368) fail('missing #1368 evidence')
if (record.sourceEvidence?.productRouteProviderRuntimeEnablementReviewPr !== 1370) fail('missing #1370 evidence')
if (record.sourceEvidence?.productRouteProviderRuntimeEnablementReviewMergeSha !== '12b52c2f7fb33bee5dc391a9131a1f19576071e1') {
  fail('missing #1370 merge SHA')
}
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.sourceEvidence?.confirmedAdapterRuntimeFixtureAccepted !== true) fail('adapter runtime fixture evidence missing')
if (record.ownerDecision?.source !== 'source_derived_repo_evidence') fail('owner decision source mismatch')
if (record.ownerDecision?.genericOwnerApprovalBlockerClosed !== true) fail('owner approval blocker should be closed')
if (record.ownerDecision?.result !== 'approved_to_continue_to_backend_job_handoff_wiring') fail('owner decision result mismatch')
if (record.route?.currentStatus !== 'fail_closed_before_provider_runtime') fail('route status mismatch')
if (record.route?.routeBehaviorChangedInThisPhase !== false) fail('route behavior must not change')
if (record.route?.backendJobHandoffWiringPresent !== false) fail('backend handoff must remain absent')
if (record.route?.providerRuntimeFixtureThroughProductRoute !== 'not_run_product_route_missing_backend_job_handoff') {
  fail('provider runtime fixture result mismatch')
}
if (record.blocker !== 'blocked_product_route_provider_runtime_fixture_requires_backend_job_handoff_wiring') fail('blocker mismatch')
if (record.allowedNextStep !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1') fail('next step mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyProductRouteProviderRuntimeFixtureBlocker') {
    if (value !== true) fail('docs-only blocker flag must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.readiness?.qwenProductRouteProviderRuntimeFixture !== 'blocked_pending_backend_job_handoff_wiring') {
  fail('readiness status mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1-diagnostics.mjs'
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
console.log('Decision: blocked_pending_backend_job_handoff_wiring_for_product_route_provider_runtime_fixture')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1')
