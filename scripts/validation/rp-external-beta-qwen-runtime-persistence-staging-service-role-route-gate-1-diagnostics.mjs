#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/route-gate-contract.md`,
  `${packetDir}/confirmation-gate.md`,
  `${packetDir}/service-role-secret-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-runtime-persistence-staging-service-role-route-gate-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-confirmed.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/qwen-runtime-persistence-staging-rls-storage-readback-record.json',
  'docs/external-beta/qwen-runtime-persistence-staging-migration-apply-1/qwen-runtime-persistence-staging-migration-apply-record.json',
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'server/services/qwen2-5-vl-external-beta-product-workflow-route-integration.ts',
  'server/services/qwen2-5-vl-external-beta-product-route-readback-validation.ts',
]

const requiredText = [
  packet,
  'blocked_pending_explicit_qwen_runtime_persistence_staging_service_role_route_gate_confirmation',
  'completed_docs_only_qwen_service_role_route_gate_plan_no_remote_execution',
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  '#1499',
  '#1500',
  '#1495',
  '#577',
  '10f9ee71e7d4ccd8f7750cc3d4983b13541f8467',
  '2be9148cc92e658718101f14f84f045ce50f8cde',
  'completed_qwen_runtime_persistence_staging_rls_storage_readback_validation',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  'POST /api/providers/qwen2-5-vl/structured-visual-metadata',
  'backend_required',
  'workspace_editor',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_QWEN_RUNTIME_PERSISTENCE_STAGING_SERVICE_ROLE_ROUTE_GATE=true',
  'Current confirmation: `not_present_in_this_docs_only_phase`',
  'Route execution: `not_run`',
  'Service-role route execution: `not_run`',
  'QWEN runtime execution: `false`',
  'Worker dispatch: `false`',
  'Provider/model call: `false`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Service-role secret payload access in this phase: `none`',
  'Frontend service-role exposure: `forbidden`',
  'Secret Manager payload access: `none`',
  'ready_for_confirmed_qwen_runtime_persistence_staging_service_role_route_gate',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1-CONFIRMED',
  'No remote Supabase mutation, SQL execution, migration execution, service-role route execution',
]

const allowedChangedFiles = new Set(requiredFiles)
for (const file of [
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation/source-audit.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation/reconciliation.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation/safety-boundary.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation/validation-results.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation/qwen-route-gate-1r-reconciliation-record.json',
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-confirmed.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const forbiddenChangedFilePatterns = [
  /^package-lock\.json$/,
  /^supabase\/migrations\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild/,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^src\//,
  /^server\/routes\//,
  /^server\/workers\//,
  /^server\/providers\//,
  /^media\//,
  /^public\//,
  /(?:^|\/)(?:dist|node_modules)\//,
  /\.(mp4|mov|mkv|webm|srt|mp3|wav|png|jpg|jpeg)$/i,
]

const forbiddenPatterns = [
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Remote Supabase mutation|SQL execution|Migration execution|Service-role route execution|Route handler execution|QWEN runtime execution|Worker execution|Worker dispatch|Worker lease claim|Provider\/model call|Provider call|Model call|Cloud Run invocation|Cloud Run deployment|Google Cloud IAM mutation|Browser capture|Remotion execution|FFmpeg execution|FFprobe execution|Media processing|Private media processing|User media processing|Signed URL creation|Public artifact creation|Credit mutation|Credit reservation creation|Credit spend|Job enqueue|Job event write|Stripe checkout\/webhook\/payment processing|Dependency mutation|Package-lock mutation|Internal beta broad unlock|External beta broad audience unlock|Paid production unlock|Production unlock|Final render\/export|Preview artifact creation)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"remoteSupabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"migrationExecution"\s*:\s*true/i,
  /"serviceRoleRouteExecution"\s*:\s*true/i,
  /"routeHandlerExecution"\s*:\s*true/i,
  /"serviceRoleSecretPayloadAccess"\s*:\s*true/i,
  /"frontendServiceRoleCredentialExposure"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"qwenRuntimeExecution"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"cloudRunInvocation"\s*:\s*true/i,
  /"cloudRunDeployment"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
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

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
const packetSafetyCorpus = requiredFiles
  .filter((file) => file !== 'docs/production-beta-blocker-inventory.md')
  .map((file) => read(file))
  .join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(packetSafetyCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-staging-service-role-route-gate-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'blocked_pending_explicit_qwen_runtime_persistence_staging_service_role_route_gate_confirmation') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_qwen_service_role_route_gate_plan_no_remote_execution') fail('execution mismatch')
if (record.integrationBase !== '2be9148cc92e658718101f14f84f045ce50f8cde') fail('integration base mismatch')
if (record.sourceMigrationApplyPr !== 1499) fail('missing #1499 source')
if (record.sourceMigrationApplyMergeSha !== '10f9ee71e7d4ccd8f7750cc3d4983b13541f8467') fail('source migration apply SHA mismatch')
if (record.sourceRlsStorageReadbackPr !== 1500) fail('missing #1500 source')
if (record.sourceRlsStorageReadbackMergeSha !== '2be9148cc92e658718101f14f84f045ce50f8cde') fail('source readback SHA mismatch')
if (record.sourceAlignmentPr !== 1495) fail('missing #1495 source')
if (record.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectName !== 'Reeditpro') fail('target project name mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target project ref mismatch')
if (record.target?.environment !== 'staging') fail('target environment mismatch')

if (record.route?.routeId !== 'providers.qwen25Vl.structuredVisualMetadataPlan') fail('route id mismatch')
if (record.route?.method !== 'POST') fail('route method mismatch')
if (record.route?.path !== '/api/providers/qwen2-5-vl/structured-visual-metadata') fail('route path mismatch')
if (record.route?.runtimeMode !== 'backend_required') fail('route runtime mode mismatch')
if (record.route?.securityLevel !== 'workspace_editor') fail('route security mismatch')
if (record.route?.requiresSupabase !== true) fail('route Supabase requirement mismatch')
if (record.route?.requiresServiceRole !== true) fail('route service-role requirement mismatch')
if (record.route?.requiresProviderSecretBeforeFutureProviderCalls !== true) fail('provider secret boundary mismatch')
if (record.route?.routeExecution !== 'not_run') fail('route execution must be not_run')
if (record.route?.serviceRoleRouteExecution !== 'not_run') fail('service-role route execution must be not_run')

if (record.confirmationGate?.env !== 'REEDITPRO_CONFIRM_EXTERNAL_BETA_QWEN_RUNTIME_PERSISTENCE_STAGING_SERVICE_ROLE_ROUTE_GATE') fail('confirmation env mismatch')
if (record.confirmationGate?.requiredValue !== 'true') fail('confirmation value mismatch')
if (record.confirmationGate?.presentInThisPhase !== false) fail('confirmation must be absent in this packet')
if (record.readiness !== 'ready_for_confirmed_qwen_runtime_persistence_staging_service_role_route_gate') fail('readiness mismatch')
if (record.blocker !== 'blocked_pending_explicit_qwen_runtime_persistence_staging_service_role_route_gate_confirmation') fail('blocker mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1-CONFIRMED') fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

for (const ref of [
  'approved_snapshot_readback_ref',
  'credit_reservation_readback_ref',
  'queue_lease_readback_ref',
  'private_input_manifest_readback_ref',
  'private_artifact_manifest_readback_ref',
  'private_artifact_checksum_readback_ref',
  'source_sequence_map_readback_ref',
  'compiled_intent_readback_ref',
  'edit_plan_version_readback_ref',
  'model_routing_policy_readback_ref',
  'qa_policy_readback_ref',
  'authenticated_user_ref',
  'workspace_membership_ref',
  'route_idempotency_key',
]) {
  if (!record.requiredFutureReadbackRefs?.includes(ref)) fail(`missing future readback ref: ${ref}`)
}

const safety = record.safety ?? {}
for (const key of [
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationExecution',
  'serviceRoleRouteExecution',
  'routeHandlerExecution',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'providerCall',
  'modelCall',
  'qwenRuntimeExecution',
  'workerExecution',
  'workerDispatch',
  'workerLeaseClaim',
  'cloudRunInvocation',
  'cloudRunDeployment',
  'iamMutation',
  'browserCapture',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'creditReservationCreation',
  'creditSpend',
  'jobEnqueue',
  'jobEventWrite',
  'stripePaymentProcessing',
  'dependencyMutation',
  'packageLockMutation',
  'internalBetaBroadUnlock',
  'externalBetaBroadAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
]) {
  if (safety[key] !== false) fail(`safety flag must be false: ${key}`)
}

const readbackRecord = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/qwen-runtime-persistence-staging-rls-storage-readback-record.json'))
if (readbackRecord.decision !== 'completed_qwen_runtime_persistence_staging_rls_storage_readback_validation') fail('readback source decision mismatch')
if (readbackRecord.nextMilestone !== packet) fail('readback source must route to this packet')
if (readbackRecord.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('readback source target mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside service-role route gate scope: ${file}`)
  for (const pattern of forbiddenChangedFilePatterns) {
    if (pattern.test(file)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_pending_explicit_qwen_runtime_persistence_staging_service_role_route_gate_confirmation')
console.log('Execution: completed_docs_only_qwen_service_role_route_gate_plan_no_remote_execution')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1-CONFIRMED')
