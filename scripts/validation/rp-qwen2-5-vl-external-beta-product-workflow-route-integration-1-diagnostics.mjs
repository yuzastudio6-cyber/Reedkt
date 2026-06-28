#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-workflow-route-integration-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/product-route-integration-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-workflow-route-integration-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-readback-validation-1.md',
  'server/services/qwen2-5-vl-external-beta-product-workflow-route-integration.ts',
  'server/smoke/qwen2-5-vl-external-beta-product-workflow-route-integration-1-smoke.ts',
  'src/backend/api/routes/provider-api-routes.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-binding-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_external_beta_product_workflow_route_integration_source_contract',
  'completed_backend_route_integration_source_no_runtime_execution',
  '#1321',
  '#1328',
  '#1333',
  'e0cae42a25f1b7d390654fcc8b610f30b86c8358',
  'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d',
  'qwen_fixture_inference_smoke_completed',
  'parsedJson=true',
  'schemaValid=true',
  'structuredMetadataOutputAccepted=true',
  'rawOutputStoredInRepo=false',
  'Fail-closed restore `passed`',
  '#577 remains open/draft/blocked/excluded',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  '/api/providers/qwen2-5-vl/structured-visual-metadata',
  'workspace_editor',
  'backend_required',
  'Requires Supabase: `true`',
  'Requires service role: `true`',
  'Requires provider secret boundary: `true`',
  'Route contract registered: `true`',
  'Route handler registered now: `false`',
  'Mock handler registered now: `false`',
  'Authenticated backend-only route: `true`',
  'Service-role-safe readback required: `true`',
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
  'ready_for_guarded_qwen2_5_vl_external_beta_product_route_readback_validation',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1',
  'Route execution allowed now: `false`',
  'Remote runtime allowed now: `false`',
  'Worker dispatch allowed now: `false`',
  'Provider/model call allowed now: `false`',
  'Raw prompt execution allowed now: `false`',
  'Arbitrary user media allowed now: `false`',
  'Signed URL creation allowed now: `false`',
  'Public artifact allowed now: `false`',
  'Final render/export allowed now: `false`',
  'External beta unlock allowed now: `false`',
  'Paid production unlock allowed now: `false`',
  'Production unlock allowed now: `false`',
  'External beta unlocked in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /(?:route|Route) execution (?:allowed now|in this phase):\s*`?true`?/i,
  /Remote runtime allowed now:\s*`?true`?/i,
  /Worker dispatch allowed now:\s*`?true`?/i,
  /Provider\/model call allowed now:\s*`?true`?/i,
  /Raw prompt execution allowed now:\s*`?true`?/i,
  /Arbitrary user media allowed now:\s*`?true`?/i,
  /Signed URL creation allowed now:\s*`?true`?/i,
  /Public artifact allowed now:\s*`?true`?/i,
  /Final render\/export allowed now:\s*`?true`?/i,
  /Production unlock allowed now:\s*`?true`?/i,
  /routeHandlerRegistered(?:Now)?"?\s*:\s*true/i,
  /mockHandlerRegistered(?:Now)?"?\s*:\s*true/i,
  /routeExecution(?:AllowedNow)?"?\s*:\s*true/i,
  /remoteRuntime(?:Execution|AllowedNow)?"?\s*:\s*true/i,
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
  /mediaProcessing"?\s*:\s*true/i,
  /privateUserMediaProcessing"?\s*:\s*true/i,
  /rawPromptExecution(?:AllowedNow)?"?\s*:\s*true/i,
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-workflow-route-integration-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_external_beta_product_workflow_route_integration_source_contract') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_backend_route_integration_source_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'e0cae42a25f1b7d390654fcc8b610f30b86c8358') fail('integration base mismatch')
if (record.sourceEvidence?.backendRuntimeAdapterPr !== 1321) fail('missing #1321 source evidence')
if (record.sourceEvidence?.confirmedAdapterRuntimeFixturePr !== 1328) fail('missing #1328 source evidence')
if (record.sourceEvidence?.productWorkflowBindingPr !== 1333) fail('missing #1333 source evidence')
if (record.sourceEvidence?.productWorkflowBindingMergeSha !== 'e0cae42a25f1b7d390654fcc8b610f30b86c8358') {
  fail('product workflow binding merge SHA mismatch')
}
if (record.sourceEvidence?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.sourceEvidence?.parsedJson !== true) fail('parsed JSON mismatch')
if (record.sourceEvidence?.schemaValid !== true) fail('schema valid mismatch')
if (record.sourceEvidence?.structuredMetadataOutputAccepted !== true) fail('structured metadata mismatch')
if (record.sourceEvidence?.rawOutputStoredInRepo !== false) fail('raw output policy mismatch')
if (record.sourceEvidence?.failClosedRestorePassed !== true) fail('restore mismatch')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')

if (record.routeContract?.routeId !== 'providers.qwen25Vl.structuredVisualMetadataPlan') fail('route id mismatch')
if (record.routeContract?.path !== '/api/providers/qwen2-5-vl/structured-visual-metadata') fail('route path mismatch')
if (record.routeContract?.securityLevel !== 'workspace_editor') fail('route security level mismatch')
if (record.routeContract?.runtimeMode !== 'backend_required') fail('route runtime mode mismatch')
if (record.routeContract?.status !== 'backend_required') fail('route status mismatch')
for (const key of [
  'requiresSupabase',
  'requiresServiceRole',
  'requiresProviderSecret',
  'routeContractRegistered',
  'authenticatedBackendOnlyRoute',
  'serviceRoleSafeReadbackRequired',
]) {
  if (record.routeContract?.[key] !== true) fail(`route contract flag must be true: ${key}`)
}
for (const key of ['routeHandlerRegisteredNow', 'mockHandlerRegisteredNow']) {
  if (record.routeContract?.[key] !== false) fail(`route contract flag must be false: ${key}`)
}
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
]) {
  if (!record.requiredServiceRoleSafeReadback?.includes(required)) fail(`missing readback reference: ${required}`)
}
for (const key of [
  'routeExecution',
  'remoteRuntime',
  'workerDispatch',
  'providerModelCall',
  'frontendProviderModelCall',
  'rawPromptExecution',
  'arbitraryUserMedia',
  'signedUrlCreation',
  'publicArtifacts',
  'finalRenderExport',
  'broadExternalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
]) {
  if (record.blockedNow?.[key] !== 'blocked') fail(`blockedNow status must be blocked: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'sourceOnlyRouteIntegration') {
    if (value !== true) fail('sourceOnlyRouteIntegration must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (
  record.readiness?.qwenProductWorkflowRouteIntegration !==
  'ready_for_guarded_qwen2_5_vl_external_beta_product_route_readback_validation'
) {
  fail('readiness status mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const routeRegistry = read('src/backend/api/routes/provider-api-routes.ts')
for (const text of [
  "id: 'providers.qwen25Vl.structuredVisualMetadataPlan'",
  "path: '/api/providers/qwen2-5-vl/structured-visual-metadata'",
  "securityLevel: 'workspace_editor'",
  "runtimeMode: 'backend_required'",
  "status: 'backend_required'",
  'requiresSupabase: true',
  'requiresServiceRole: true',
  'requiresProviderSecret: true',
  'Source-only route registry integration; no handler is registered or executed in this phase.',
]) {
  if (!routeRegistry.includes(text)) fail(`route registry missing ${text}`)
}

const service = read('server/services/qwen2-5-vl-external-beta-product-workflow-route-integration.ts')
for (const text of [
  'buildQwen25VlExternalBetaProductWorkflowRouteIntegration',
  'assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult',
  'ready_for_guarded_qwen2_5_vl_external_beta_product_route_readback_validation',
  'completed_backend_route_integration_source_no_runtime_execution',
  'routeHandlerRegisteredNow: false',
  'mockHandlerRegisteredNow: false',
  'routeExecutionAllowedNow: false',
  'remoteRuntimeAllowedNow: false',
  'providerModelCallAllowedNow: false',
  'signedUrlCreationAllowedNow: false',
  'publicArtifactAllowedNow: false',
  'finalRenderExportAllowedNow: false',
  'externalBetaUnlockAllowedNow: false',
]) {
  if (!service.includes(text)) fail(`service source missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-workflow-route-integration-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-workflow-route-integration-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-workflow-route-integration-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

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

const allowedFiles = new Set([...requiredFiles, ...followOnProductRouteReadbackValidationFiles])
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
console.log('Decision: completed_qwen2_5_vl_external_beta_product_workflow_route_integration_source_contract')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1')
