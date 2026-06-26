#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-4-SERVICE-ROLE-PERSISTENCE-GUARD-INTEGRATION'
const packetDir =
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/orchestrator-service-role-persistence-guard-integration.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/runtime-readiness-orchestrator-4-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration.md',
]

const touchedStatusFiles = [
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/readiness-matrix.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
]

const codeFiles = [
  'server/services/internal-beta-runtime-readiness-orchestrator.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-smoke.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-3-api-route-facade-integration-smoke.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-smoke.ts',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...touchedStatusFiles, ...codeFiles])
for (const file of [
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1/current-environment-closure.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1/current-environment-closure-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1/validation-results.md',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-run.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-current-environment-closure-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_internal_beta_runtime_readiness_orchestrator_service_role_persistence_guard_integration_fail_closed',
  'completed_orchestrator_service_role_persistence_guard_integration_no_supabase_write',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'local_snapshot_persistence_validated_no_supabase_write',
  'approved_snapshot_service_role_persistence_guard',
  'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-LOCAL-RUNTIME-1',
  'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-GUARD-1',
  'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-3-API-ROUTE-FACADE-INTEGRATION',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-DECISION-1',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Service-role persistence guard status: `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`',
  'Local snapshot runtime status: `local_snapshot_persistence_validated_no_supabase_write`',
  'Total disabled runtime component count: `54`',
  'Approved snapshot service-role persistence guard: `1`',
  'Local E2E chain smoke: `1`',
  'Total local evidence count: `2`',
  'Internal beta end-to-end ready: `false`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role route execution, API route handler registration, mock route handler registration, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, package installation beyond dependency validation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenPacketClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Total disabled runtime component count:\s*`?(?!54\b)\d+/i,
  /Total local evidence count:\s*`?(?!2\b)\d+/i,
  /Approved snapshot service-role persistence guard:\s*`?(?!1\b)\d+/i,
  /Local E2E chain smoke:\s*`?(?!1\b)\d+/i,
  /Route handler registration:\s*`?true/i,
  /Mock handler registration:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /Storage (?:write|read):\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Job enqueue:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'server/providers/',
  'src/',
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  '.github/workflows/',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

const docsCorpus = [...packetFiles, ...touchedStatusFiles].map(read).join('\n')
const packetCorpus = packetFiles.map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPacketClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/runtime-readiness-orchestrator-4-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (
  record.decision !==
  'completed_internal_beta_runtime_readiness_orchestrator_service_role_persistence_guard_integration_fail_closed'
) {
  fail('record decision mismatch')
}
if (record.execution !== 'completed_orchestrator_service_role_persistence_guard_integration_no_supabase_write') {
  fail('record execution mismatch')
}
if (record.status !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') fail('record status mismatch')
if (record.baseIntegrationHead !== '7f5f1ccf8bf073957a38a688c3b9916a8c245290') fail('base integration head mismatch')
if (record.componentCounts?.apiRouteRuntimeFacade !== 8) fail('API route facade count mismatch')
if (record.componentCounts?.totalDisabledOperations !== 54) fail('total disabled operation count mismatch')
if (
  record.localEvidenceCounts?.approvedSnapshotServiceRolePersistenceGuard !== 1 ||
  record.localEvidenceCounts?.localE2EChainSmoke !== 1 ||
  record.localEvidenceCounts?.total !== 2
) {
  fail('local evidence count mismatch')
}
if (
  record.serviceRolePersistenceGuardStatus !==
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias'
) {
  fail('service-role persistence guard status mismatch')
}
if (record.localSnapshotRuntimeStatus !== 'local_snapshot_persistence_validated_no_supabase_write') {
  fail('local snapshot runtime status mismatch')
}
if (record.localSnapshotRuntimeOk !== true) fail('local snapshot runtime must pass locally')
if (record.internalBetaEndToEndReady !== false) fail('internal beta readiness must remain false')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must remain not_ready')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (!['pending_validation', 'full_validation_passed'].includes(record.validationStatus)) fail('validation status mismatch')
if (record.nextMilestone !== 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN') {
  fail('next milestone mismatch')
}
for (const requiredGate of [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'approved_snapshot_service_role_persistence_guard',
]) {
  if (!record.requiredBeforeEnablement?.includes(requiredGate)) fail(`record missing gate ${requiredGate}`)
}
for (const requiredPersistenceGate of [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'service_role_persistence_runtime_approval',
  'remote_persistence_confirmation',
]) {
  if (!record.requiredBeforePersistence?.includes(requiredPersistenceGate)) {
    fail(`record missing persistence gate ${requiredPersistenceGate}`)
  }
}

for (const key of [
  'routeHandlerRegistration',
  'mockHandlerRegistration',
  'routeExecution',
  'serviceRoleRouteExecution',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'storageWrite',
  'storageRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'jobEnqueue',
  'workerDispatch',
  'workerExecution',
  'providerModelCall',
  'modelCall',
  'rawPromptExecution',
  'renderExportExecution',
  'mediaProcessing',
  'remotionExecution',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must be false`)
}

const orchestrator = read('server/services/internal-beta-runtime-readiness-orchestrator.ts')
for (const token of [
  'evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard',
  'serviceRolePersistenceGuard',
  'approved_snapshot_service_role_persistence_guard',
  'hasUnsafeServiceRolePersistenceGuardBoolean',
  'buildRuntimeReadinessSnapshotPayload',
  'approvedSnapshotServiceRolePersistenceGuard: 1',
  'localEvidenceCounts: {',
]) {
  if (!orchestrator.includes(token)) fail(`orchestrator missing token ${token}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
]) {
  if (pattern.test(orchestrator)) fail(`orchestrator contains forbidden runtime signal ${pattern}`)
}

const smoke = read('server/smoke/internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-smoke.ts')
for (const token of [
  'service-role persistence guard status mismatch',
  'service-role guard local runtime must pass',
  'approved snapshot service-role persistence guard evidence count mismatch',
  'internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`packet smoke missing token ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration'] !==
  'tsx server/smoke/internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-smoke.ts'
) {
  fail('missing packet smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-diagnostics.mjs'
) {
  fail('missing packet diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const path of [
  'supabase',
  'database',
  '.dockerignore',
  'docker',
  'server/routes',
  'server/workers',
  'server/providers',
  'src',
  'tests',
]) {
  gitQuiet(['diff', '--quiet', '--', path], `${path} changed`)
}

const changedFiles = [
  ...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard'])]),
]
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    file.endsWith('.sql') ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.srt') ||
    file.endsWith('.zip') ||
    file.endsWith('.tar') ||
    file.endsWith('.tgz')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  if (file.startsWith('scripts/validation/')) continue
  if (touchedStatusFiles.includes(file)) continue
  const text = read(file)
  for (const pattern of forbiddenPacketClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
