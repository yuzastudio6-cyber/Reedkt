#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/route-readback-validation-gate.md`,
  `${packetDir}/required-readback-references.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-readback-validation-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-readback-validation-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1.md',
  'server/services/qwen2-5-vl-external-beta-product-route-readback-validation.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-route-readback-validation-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-binding-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs',
  'package.json',
]

const readbackFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation',
  'completed_source_only_product_route_readback_validation_gate_no_remote_execution',
  '#1321',
  '#1328',
  '#1333',
  '#1339',
  '0350f42c1cda721d890cdd90155b0c948060686a',
  'e0cae42a25f1b7d390654fcc8b610f30b86c8358',
  'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d',
  'qwen_fixture_inference_smoke_completed',
  'Parsed JSON: `true`',
  'Schema valid: `true`',
  'Structured metadata output accepted: `true`',
  'Raw output stored in repo: `false`',
  'Fail-closed restore `passed`',
  '#577 remains open/draft/blocked/excluded',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  '/api/providers/qwen2-5-vl/structured-visual-metadata',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true',
  'Current phase confirmation present: `false`',
  'Current phase remote readback executed: `false`',
  'Named target required before remote readback: `true`',
  'Actual remote readback allowed now: `false`',
  'Route handler execution allowed now: `false`',
  'Supabase readback execution allowed now: `false`',
  'Service-role readback execution allowed now: `false`',
  'Secret payload access allowed now: `false`',
  'SQL mutation allowed now: `false`',
  'Supabase mutation allowed now: `false`',
  'Worker dispatch allowed now: `false`',
  'Provider/model call allowed now: `false`',
  'Media processing allowed now: `false`',
  'Signed URL creation allowed now: `false`',
  'Public artifact allowed now: `false`',
  'Final render/export allowed now: `false`',
  'External beta unlock allowed now: `false`',
  'Paid production unlock allowed now: `false`',
  'Production unlock allowed now: `false`',
  'approved snapshot readback reference',
  'credit reservation readback reference',
  'queue lease readback reference',
  'private input manifest readback reference',
  'private artifact manifest readback reference',
  'private artifact checksum readback reference',
  'source sequence map readback reference',
  'compiled intent readback reference',
  'model routing policy readback reference',
  'QA policy readback reference',
  'authenticated user reference',
  'workspace membership reference',
  'route idempotency key',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRMED_1',
  'External beta unlocked in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /(?:Actual remote readback|Route handler execution|Supabase readback execution|Service-role readback execution|Secret payload access|SQL mutation|Supabase mutation|Worker dispatch|Provider\/model call|Media processing|Signed URL creation|Public artifact|Final render\/export|External beta unlock|Paid production unlock|Production unlock) allowed now:\s*`?true`?/i,
  /Current phase remote readback executed:\s*`?true`?/i,
  /routeReadbackExecution"?\s*:\s*true/i,
  /routeHandlerExecution"?\s*:\s*true/i,
  /supabaseReadbackExecution"?\s*:\s*true/i,
  /serviceRoleReadbackExecution"?\s*:\s*true/i,
  /remoteRuntimeExecution"?\s*:\s*true/i,
  /qwenRuntimeExecuted(?:InThisPhase)?"?\s*:\s*true/i,
  /cloudRunServiceUpdated"?\s*:\s*true/i,
  /cloudRunJobExecuted"?\s*:\s*true/i,
  /identityTokenFetch"?\s*:\s*true/i,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-readback-validation-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_source_only_product_route_readback_validation_gate_no_remote_execution') {
  fail('execution mismatch')
}
if (record.integrationBase !== '0350f42c1cda721d890cdd90155b0c948060686a') fail('integration base mismatch')
if (record.sourceEvidence?.backendRuntimeAdapterPr !== 1321) fail('missing #1321 source evidence')
if (record.sourceEvidence?.confirmedAdapterRuntimeFixturePr !== 1328) fail('missing #1328 source evidence')
if (record.sourceEvidence?.productWorkflowBindingPr !== 1333) fail('missing #1333 source evidence')
if (record.sourceEvidence?.productWorkflowRouteIntegrationPr !== 1339) fail('missing #1339 source evidence')
if (record.sourceEvidence?.productWorkflowRouteIntegrationMergeSha !== '0350f42c1cda721d890cdd90155b0c948060686a') {
  fail('route integration merge SHA mismatch')
}
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.sourceEvidence?.rawOutputStoredInRepo !== false) fail('raw output policy mismatch')
if (record.sourceEvidence?.failClosedRestorePassed !== true) fail('restore mismatch')

if (record.confirmationGate?.env !== 'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION') {
  fail('confirmation env mismatch')
}
if (record.confirmationGate?.requiredValue !== 'true') fail('confirmation value mismatch')
if (record.confirmationGate?.confirmationPresent !== false) fail('confirmation must be absent in this packet')
if (record.confirmationGate?.currentPhaseRemoteReadbackExecuted !== false) fail('remote readback must not execute')
if (record.target?.targetRef !== null) fail('target must remain unnamed in this packet')
if (record.target?.namedTargetRequiredBeforeRemoteReadback !== true) fail('named target requirement missing')

if (record.routeContract?.routeId !== 'providers.qwen25Vl.structuredVisualMetadataPlan') fail('route id mismatch')
if (record.routeContract?.path !== '/api/providers/qwen2-5-vl/structured-visual-metadata') fail('route path mismatch')
if (record.routeContract?.requiresSupabase !== true) fail('route contract must require Supabase boundary')
if (record.routeContract?.requiresServiceRole !== true) fail('route contract must require service-role boundary')
if (record.routeContract?.requiresProviderSecret !== true) fail('route contract must require provider secret boundary')
if (record.routeContract?.routeContractReady !== true) fail('route contract must be source-ready')

for (const required of [
  'approved_snapshot_readback_reference',
  'credit_reservation_readback_reference',
  'queue_lease_readback_reference',
  'private_input_manifest_readback_reference',
  'private_artifact_manifest_readback_reference',
  'private_artifact_checksum_readback_reference',
  'source_sequence_map_readback_reference',
  'compiled_intent_readback_reference',
  'model_routing_policy_readback_reference',
  'qa_policy_readback_reference',
  'authenticated_user_reference',
  'workspace_membership_reference',
  'route_idempotency_key',
]) {
  if (!record.requiredReadbackRefs?.includes(required)) fail(`missing readback reference: ${required}`)
}

for (const [key, value] of Object.entries(record.blockedNow ?? {})) {
  if (value !== 'blocked') fail(`blockedNow status must be blocked: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'sourceOnlyProductRouteReadbackValidation') {
    if (value !== true) fail('sourceOnlyProductRouteReadbackValidation must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (
  record.readiness?.qwenProductRouteReadbackValidation !==
  'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation'
) {
  fail('route readback readiness mismatch')
}
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRMED_1') {
  fail('next milestone mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const service = read('server/services/qwen2-5-vl-external-beta-product-route-readback-validation.ts')
for (const text of [
  'buildQwen25VlExternalBetaProductRouteReadbackValidation',
  'assertQwen25VlExternalBetaProductRouteReadbackValidationResult',
  'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation',
  'completed_source_only_product_route_readback_validation_gate_no_remote_execution',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION',
  'routeReadbackExecution: false',
  'supabaseReadbackExecution: false',
  'serviceRoleReadbackExecution: false',
  'secretPayloadAccess: false',
  'sqlExecution: false',
]) {
  if (!service.includes(text)) fail(`service source missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-route-readback-validation-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-route-readback-validation-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-readback-validation-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!readbackFiles.has(file)) fail(`unexpected changed file: ${file}`)
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
console.log('Decision: blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRMED_1')
