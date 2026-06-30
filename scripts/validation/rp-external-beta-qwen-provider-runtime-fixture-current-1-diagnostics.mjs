#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1'
const packetDir = 'docs/external-beta/qwen-provider-runtime-fixture-current-1'
const decision = 'blocked_native_staging_api_missing_verified_user_context_for_backend_handoff'
const execution = 'completed_native_staging_api_backend_handoff_selection_no_provider_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/route-handoff-bridge.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-provider-runtime-fixture-current-1-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-provider-runtime-fixture-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-provider-runtime-fixture-current-1-confirmed-run.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-native-api-auth-context-bridge-1.md',
  'src/server/server-router.ts',
  'server/smoke/rp-external-beta-qwen-provider-runtime-fixture-current-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-provider-runtime-fixture-current-1-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-staging-api-route-deployment-alignment-1/qwen-staging-api-route-deployment-alignment-1-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-backend-job-handoff-1/qwen2-5-vl-product-route-backend-job-handoff-record.json',
  'docs/external-beta/qwen2-5-vl-product-route-runtime-readiness-rollup-1/qwen2-5-vl-product-route-runtime-readiness-rollup-record.json',
  'scripts/validation/rp-external-beta-qwen-staging-api-route-deployment-alignment-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/rp-external-beta-qwen-staging-api-route-deployment-alignment-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  'da97293c4a9fcbed7a1824994c26922cbd7603f7',
  '#1782',
  '#577 remains open/draft/blocked/conflicting and excluded',
  'POST /api/providers/qwen2-5-vl/structured-visual-metadata',
  'src/server/server-router.ts',
  'buildBlockedResult(routeInput)',
  'buildBackendJobHandoff(routeInput)',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF=true',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only',
  'fail_closed_http_424',
  'backend_only_handoff_contract_selected_but_blocked_without_verified_user_context',
  'blocked_native_staging_api_missing_verified_user_context_for_backend_handoff',
  'Provider/model runtime execution: `not_run_in_this_phase`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenPatterns = [
  /\bQWEN provider\/model execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run job execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bexternal beta unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"cloudRunServiceUpdate"\s*:\s*true/i,
  /"cloudRunJobExecution"\s*:\s*true/i,
  /"identityTokenFetch"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"privateUserMediaProcessing"\s*:\s*true/i,
  /"rawPromptExecution"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaUnlockAppliedToEnvironment"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"creditMutation"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
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

function parseJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...requiredFiles, ...requiredExistingFiles]) read(file)

const corpus = [...requiredFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
const currentPacketCorpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(currentPacketCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-provider-runtime-fixture-current-1-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceBase !== 'da97293c4a9fcbed7a1824994c26922cbd7603f7') fail('source base mismatch')
if (record.sourceEvidence?.stagingApiRouteDeploymentAlignmentPr !== 1782) fail('missing #1782 evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.route?.nativeServerRouterBridge !== 'src/server/server-router.ts') fail('native router bridge mismatch')
if (record.route?.defaultMode !== 'fail_closed_http_424') fail('default route mode mismatch')
if (record.route?.confirmedMode !== 'backend_only_handoff_contract_selected_but_blocked_without_verified_user_context') {
  fail('confirmed route mode mismatch')
}
if (record.route?.routeBehaviorFailClosedByDefault !== true) fail('route must remain fail-closed by default')
if (
  record.route?.verifiedNativeApiUserContext !== 'blocked_native_staging_api_missing_verified_user_context_for_backend_handoff'
) {
  fail('verified native API auth context blocker mismatch')
}
if (record.runtime?.qwenProviderModelExecution !== 'not_run_in_this_phase') fail('provider runtime status mismatch')
if (
  record.readiness?.qwenProviderRuntimeFixtureCurrent !==
  'blocked_native_staging_api_missing_verified_user_context_for_backend_handoff'
) {
  fail('readiness mismatch')
}
if (record.readiness?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const safety = record.safety ?? {}
for (const [key, value] of Object.entries(safety)) {
  if (key === 'routeBackendHandoffBridge' || key === 'failClosedByDefault') {
    if (value !== true) fail(`safety flag must be true: ${key}`)
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

const routeSource = read('src/server/server-router.ts')
for (const text of [
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE',
  'isQwenBackendJobHandoffConfirmed()',
  'handlerSource.buildBackendJobHandoff(routeInput)',
  'handlerSource.buildBlockedResult(routeInput)',
]) {
  if (!routeSource.includes(text)) fail(`native server router missing ${text}`)
}
if (/execFileSync|spawnSync|gcloud|run jobs execute|identity token/i.test(routeSource)) {
  fail('native server router must not shell out or execute Cloud Run')
}

const smoke = read('server/smoke/rp-external-beta-qwen-provider-runtime-fixture-current-1-smoke.ts')
for (const text of [
  'completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract',
  'blocked_pending_route_readback_validation_gate',
  'blocked_pending_route_readback_validation_gate',
  'blocked_missing_authenticated_backend_route_reference',
  'assert.equal(missingVerifiedAuthContext.body.backendHandoff.handoffPrepared, false)',
  'assert.equal(missingVerifiedAuthContext.body.backendHandoff.providerRuntimeExecutedNow, false)',
  'assert.equal(missingVerifiedAuthContext.body.allowedExecution.cloudRunJobExecutionAllowedNow, false)',
  'assert.equal(missingVerifiedAuthContext.body.safety.providerCall, false)',
  'assert.equal(missingVerifiedAuthContext.body.safety.modelCall, false)',
]) {
  if (!smoke.includes(text)) fail(`smoke missing ${text}`)
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-qwen-provider-runtime-fixture-current-1'] !==
  'tsx server/smoke/rp-external-beta-qwen-provider-runtime-fixture-current-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-provider-runtime-fixture-current-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-provider-runtime-fixture-current-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

const changedFiles = new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (!fs.existsSync(file)) continue
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')

console.log(`${packet} diagnostics passed.`)
console.log(`Decision: ${decision}`)
console.log(`Next milestone: ${nextMilestone}`)
