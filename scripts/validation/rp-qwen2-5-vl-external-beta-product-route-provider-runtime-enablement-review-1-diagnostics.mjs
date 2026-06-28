#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_ENABLEMENT_REVIEW_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/provider-runtime-enablement-review.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-provider-runtime-enablement-review-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_source_derived_qwen2_5_vl_product_route_provider_runtime_enablement_review_ready_for_guarded_provider_runtime_fixture',
  'completed_docs_only_provider_runtime_enablement_review_no_provider_or_model_execution',
  'd9f214786b40acef7664c1904130f0e4ac6bfc00',
  '#1368',
  '#577 remains open/draft/blocked/excluded',
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  'source_derived_repo_evidence',
  'approved_for_next_guarded_provider_runtime_fixture_packet',
  'future_guarded_qwen_product_route_provider_runtime_fixture_only',
  'fail_closed_before_provider_runtime',
  'Provider/model calls executed in this phase: `none`',
  'Route behavior changed in this phase: `false`',
  'Provider runtime enablement review: `passed_for_next_guarded_fixture_packet`',
  'Current route status: `fail_closed_before_provider_runtime`',
  'No frontend provider/model call',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /Route behavior changed in this phase:\s*`?true`?/i,
  /providerRuntimeEnabledInThisPhase"?\s*:\s*true/i,
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
  /^server\/services\/(?!qwen2-5-vl-external-beta-product-route-readback-validation)/,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-provider-runtime-enablement-review-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_source_derived_qwen2_5_vl_product_route_provider_runtime_enablement_review_ready_for_guarded_provider_runtime_fixture') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_docs_only_provider_runtime_enablement_review_no_provider_or_model_execution') {
  fail('execution mismatch')
}
if (record.integrationBase !== 'd9f214786b40acef7664c1904130f0e4ac6bfc00') fail('integration base mismatch')
if (record.sourceEvidence?.productRouteReadbackRuntimeValidationPr !== 1368) fail('missing #1368 evidence')
if (record.sourceEvidence?.productRouteReadbackRuntimeValidationMergeSha !== 'd9f214786b40acef7664c1904130f0e4ac6bfc00') {
  fail('missing #1368 merge SHA')
}
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.secretMetadataOnly !== true) fail('target must remain non-secret metadata')
if (record.ownerDecision?.source !== 'source_derived_repo_evidence') fail('owner decision source mismatch')
if (record.ownerDecision?.genericOwnerApprovalBlockerClosed !== true) fail('generic owner blocker must be closed')
if (record.ownerDecision?.result !== 'approved_for_next_guarded_provider_runtime_fixture_packet') fail('owner decision result mismatch')
if (record.ownerDecision?.scope !== 'future_guarded_qwen_product_route_provider_runtime_fixture_only') fail('owner decision scope mismatch')
if (record.route?.currentStatus !== 'fail_closed_before_provider_runtime') fail('route status mismatch')
if (record.route?.routeBehaviorChangedInThisPhase !== false) fail('route behavior must not change')
if (record.providerRuntimeEnablement?.reviewStatus !== 'passed_for_next_guarded_fixture_packet') fail('review status mismatch')
if (record.providerRuntimeEnablement?.providerRuntimeEnabledInThisPhase !== false) fail('provider runtime must not be enabled')
if (record.providerRuntimeEnablement?.providerModelCallsExecuted !== 'none') fail('provider calls must be none')
for (const required of [
  'nextFixtureMustRequireExplicitConfirmation',
  'nextFixtureMustUseApprovedSnapshotReadbackRefs',
  'nextFixtureMustUseGeneratedOrApprovedBoundedInputOnly',
  'nextFixtureMustPreserveFailClosedUnsafeRequests',
  'nextFixtureMustKeepFrontendProviderCallsForbidden',
]) {
  if (record.providerRuntimeEnablement?.[required] !== true) fail(`${required} must be true`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyProviderRuntimeEnablementReview') {
    if (value !== true) fail('docs-only review flag must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.readiness?.qwenProductRouteProviderRuntimeEnablementReview !== 'ready_for_guarded_provider_runtime_fixture_packet') {
  fail('readiness status mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1-diagnostics.mjs'
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
console.log('Decision: completed_source_derived_qwen2_5_vl_product_route_provider_runtime_enablement_review_ready_for_guarded_provider_runtime_fixture')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1')
