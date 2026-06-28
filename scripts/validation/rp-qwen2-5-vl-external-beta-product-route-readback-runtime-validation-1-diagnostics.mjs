#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_RUNTIME_VALIDATION_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/readback-runtime-result.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-readback-runtime-validation-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1.md',
  'server/smoke/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-handler-fail-closed-runtime-validation-1-diagnostics.mjs',
  'package.json',
]

const followOnProviderRuntimeEnablementReviewFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1/provider-runtime-enablement-review.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1/qwen2-5-vl-product-route-provider-runtime-enablement-review-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_product_route_readback_runtime_validation_fail_closed',
  'completed_local_in_process_route_readback_runtime_validation_no_provider_or_remote_execution',
  '1eb45f3ec695d827de26ab4bec06e5bd7442235d',
  '#1358',
  '#1361',
  '#577 remains open/draft/blocked/excluded',
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  '/api/providers/qwen2-5-vl/structured-visual-metadata',
  'local_in_process_express_app',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true',
  'PROVIDER_ROUTE_BLOCKED',
  'HTTP `424`',
  'blocked_provider_runtime_not_enabled',
  'ready_for_confirmed_qwen2_5_vl_product_route_readback_validation_runtime_packet',
  'IDEMPOTENCY_KEY_REQUIRED',
  'blocked_product_route_handler_unsafe_runtime_request',
  'Local product route readback runtime validation: `passed`',
  'Route handler fail-closed: `true`',
  'Readback validation gate observed by route: `true`',
  'Actual remote readback allowed now: `false`',
  'Supabase readback execution allowed now: `false`',
  'Service-role readback execution allowed now: `false`',
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
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_ENABLEMENT_REVIEW_1',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /(?:Actual remote readback|Supabase readback execution|Service-role readback execution|Provider\/model call|Worker dispatch|Media processing|Signed URL creation|Public artifact|Final render\/export|External beta unlock|Paid production unlock|Production unlock) allowed now:\s*`?true`?/i,
  /remoteRouteExecution"?\s*:\s*true/i,
  /routeReadbackExecution"?\s*:\s*true/i,
  /supabaseReadbackExecution"?\s*:\s*true/i,
  /serviceRoleReadbackExecution"?\s*:\s*true/i,
  /qwenRuntimeExecuted(?:InThisPhase)?"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /frontendProviderModelCall"?\s*:\s*true/i,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-readback-runtime-validation-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_product_route_readback_runtime_validation_fail_closed') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_local_in_process_route_readback_runtime_validation_no_provider_or_remote_execution') {
  fail('execution mismatch')
}
if (record.integrationBase !== '1eb45f3ec695d827de26ab4bec06e5bd7442235d') fail('integration base mismatch')
if (record.sourceEvidence?.productRouteHandlerFailClosedRuntimeValidationPr !== 1358) fail('missing #1358 evidence')
if (record.sourceEvidence?.productRouteReadbackValidationConfirmedPr !== 1361) fail('missing #1361 evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectName !== 'Reeditpro') fail('target name mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.class !== 'staging') fail('target class mismatch')
if (record.target?.secretMetadataOnly !== true) fail('target must remain non-secret metadata only')
if (record.route?.localRuntimeTarget !== 'local_in_process_express_app') fail('runtime target mismatch')
if (record.route?.routeHandlerRegisteredNow !== true) fail('route handler must be registered')
if (record.route?.routeHandlerFailClosed !== true) fail('route handler must fail closed')
if (record.route?.validatedProviderRouteBlocked !== true) fail('PROVIDER_ROUTE_BLOCKED must be validated')
if (record.route?.validatedHttpStatus !== 424) fail('HTTP 424 must be validated')
if (record.route?.idempotencyDatabaseMutationInThisPhase !== false) fail('idempotency DB mutation must be false')

if (record.confirmationGate?.env !== 'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION') {
  fail('confirmation env mismatch')
}
if (record.confirmationGate?.requiredValue !== 'true') fail('confirmation value mismatch')
if (record.confirmationGate?.confirmationPresentInRuntime !== true) fail('confirmation must be present')
if (record.confirmationGate?.remoteReadbackExecuted !== false) fail('remote readback must not execute')

if (record.runtimeValidation?.missingIdempotencyHeader?.status !== 400) fail('missing idempotency status mismatch')
if (record.runtimeValidation?.missingIdempotencyHeader?.code !== 'IDEMPOTENCY_KEY_REQUIRED') {
  fail('missing idempotency code mismatch')
}
const confirmed = record.runtimeValidation?.confirmedReadbackGateWithGeneratedRefs
if (confirmed?.status !== 424) fail('confirmed readback route status mismatch')
if (confirmed?.code !== 'PROVIDER_ROUTE_BLOCKED') fail('confirmed readback route code mismatch')
if (confirmed?.handlerStatus !== 'blocked_provider_runtime_not_enabled') fail('confirmed handler status mismatch')
if (confirmed?.readbackValidationOk !== true) fail('readback validation ok mismatch')
if (confirmed?.readbackValidationStatus !== 'ready_for_confirmed_qwen2_5_vl_product_route_readback_validation_runtime_packet') {
  fail('readback validation status mismatch')
}
const unsafe = record.runtimeValidation?.unsafeRemoteReadbackRequestFlag
if (unsafe?.status !== 424) fail('unsafe remote readback status mismatch')
if (unsafe?.code !== 'PROVIDER_ROUTE_BLOCKED') fail('unsafe remote readback code mismatch')
if (unsafe?.handlerStatus !== 'blocked_product_route_handler_unsafe_runtime_request') fail('unsafe handler status mismatch')

for (const [key, value] of Object.entries(record.allowedExecution ?? {})) {
  if (key === 'localProductRouteReadbackRuntimeValidation' || key === 'routeHandlerFailClosed') {
    if (value !== true) fail(`${key} must be true`)
    continue
  }
  if (value !== false) fail(`allowed execution flag must be false: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'localInProcessRouteReadbackRuntimeValidation') {
    if (value !== true) fail('local in-process route readback validation must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.readiness?.qwenProductRouteReadbackRuntimeValidation !== 'completed_fail_closed_ready_for_provider_runtime_enablement_review') {
  fail('readiness status mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_ENABLEMENT_REVIEW_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const smoke = read('server/smoke/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-smoke.ts')
for (const text of [
  'createReeditProApiApp',
  "const targetRef = 'wmyyttnynmteqgcdishd'",
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV',
  "assert.equal(result.body.error?.details?.status, 'blocked_provider_runtime_not_enabled')",
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS',
  "assert.equal(unsafeRemoteReadbackRequest.body.error?.details?.status, 'blocked_product_route_handler_unsafe_runtime_request')",
  "assert.equal(result.body.error?.details?.safety?.providerCall, false)",
  "assert.equal(result.body.error?.details?.safety?.modelCall, false)",
  "assert.equal(result.body.error?.details?.safety?.supabaseMutation, false)",
  "assert.equal(result.body.error?.details?.safety?.sqlExecution, false)",
]) {
  if (!smoke.includes(text)) fail(`smoke source missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-smoke.ts'
) {
  fail('missing runtime smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-diagnostics.mjs'
) {
  fail('missing runtime diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set(requiredFiles)
for (const file of followOnProviderRuntimeEnablementReviewFiles) allowedFiles.add(file)
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
console.log('Decision: completed_qwen2_5_vl_product_route_readback_runtime_validation_fail_closed')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_ENABLEMENT_REVIEW_1')
