#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/implementation-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/service-role-persistence-implementation-record.json`,
  'docs/activation-phase-rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1-results.md',
  'docs/activation-phase-rp-internal-beta-supabase-credential-context-contract-1-results.md',
  'docs/activation-phase-rp-internal-beta-supabase-target-credential-context-preflight-1-results.md',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/internal-beta/rp-internal-beta-supabase-credential-context-contract-1/alias-matrix.md',
  'docs/internal-beta/rp-internal-beta-supabase-credential-context-contract-1/credential-context-contract-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-credential-context-preflight-1/alias-matrix.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-credential-context-preflight-1/credential-context-preflight-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-credential-context-preflight-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1.md',
  'server/config/internal-beta-supabase-credential-context-contract.ts',
  'server/services/internal-beta-approved-snapshot-service-role-persistence-implementation.ts',
  'server/smoke/internal-beta-supabase-credential-context-contract-smoke.ts',
  'server/smoke/internal-beta-approved-snapshot-service-role-persistence-implementation-smoke.ts',
  'scripts/validation/rp-internal-beta-supabase-credential-context-contract-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1-diagnostics.mjs',
  'package.json',
]

const allowedFollowOnDiagnostics = [
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, ...allowedFollowOnDiagnostics])

const requiredText = [
  packet,
  'completed_service_role_persistence_envelope_validated_no_remote_write',
  'completed_backend_service_role_persistence_envelope_no_remote_execution',
  'SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1',
  'c3136f22bef5bc2e8b437b5310c72f0e6540608e',
  'approved_plan_snapshots',
  'Single active Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'single_active_reeditpro_supabase_project_for_internal_and_external_beta_readiness',
  'historical_sandbox_evidence_only_not_active_beta_target',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'approval_records',
  'api_idempotency_keys',
  'audit_events',
  'persistedToSupabase: false',
  'remoteSupabaseMutation: false',
  'serviceRoleRouteExecution: false',
  'workerExecution: false',
  'internalBetaUnlock: false',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded',
  'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-GUARDED-REMOTE-WRITE-1',
]

const forbiddenClaims = [
  /Supabase persistence:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL mutation:\s*`?true/i,
  /RPC execution:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Job enqueue:\s*`?true/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Internal beta unlocked:\s*`?true/i,
  /External beta unlocked:\s*`?true/i,
  /Production unlocked:\s*`?true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /rpcExecution"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Package-lock:\s*`?(changed|mutated)/i,
]

const secretPatterns = [
  /postgres(ql)?:\/\/(?!\[redacted\])[^\\s`"']+/i,
  /service[_-]?role[_-]?key\\s*[:=]\\s*['"][^'"]+['"]/i,
  /SUPABASE_SERVICE_ROLE_KEY\\s*=/i,
  /eyJ[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}/,
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
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')

for (const token of requiredText) {
  if (!corpus.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

for (const pattern of secretPatterns) {
  if (pattern.test(corpus)) fail(`secret-like payload matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/service-role-persistence-implementation-record.json`))
if (record.decision !== 'completed_service_role_persistence_envelope_validated_no_remote_write') fail('record decision mismatch')
if (record.execution !== 'completed_backend_service_role_persistence_envelope_no_remote_execution') fail('record execution mismatch')
if (record.sourceServiceRoleBoundaryMergeSha !== 'c3136f22bef5bc2e8b437b5310c72f0e6540608e') fail('source merge SHA mismatch')
if (record.envelopeStatus !== 'completed_service_role_persistence_envelope_validated_no_remote_write') fail('envelope status mismatch')
if (record.readyStatus !== 'ready_for_guarded_remote_persistence_execution_packet_only_after_explicit_confirmation') fail('ready status mismatch')
if (record.targetName !== 'Reeditpro') fail('active target name mismatch')
if (record.targetRef !== 'wmyyttnynmteqgcdishd') fail('active target ref mismatch')
if (record.targetClass !== 'staging') fail('active target class mismatch')
if (record.targetPolicy !== 'single_active_reeditpro_supabase_project_for_internal_and_external_beta_readiness') fail('active target policy mismatch')
if (record.historicalSandboxProject?.status !== 'historical_sandbox_evidence_only_not_active_beta_target') fail('historical sandbox status mismatch')
if (record.approvedSecretMetadata?.dbUrlSecret !== 'REEDITPRO_STAGING_SUPABASE_DB_URL') fail('active DB URL secret alias mismatch')
if (record.persistedToSupabase !== false) fail('persistedToSupabase must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const table of ['approved_plan_snapshots', 'approval_records', 'api_idempotency_keys', 'audit_events']) {
  if (!record.envelopeTables.includes(table)) fail(`missing envelope table: ${table}`)
}
for (const key of [
  'routeExecution',
  'serviceRoleRouteExecution',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'creditMutation',
  'jobEnqueue',
  'workerExecution',
  'workerDispatch',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}

const service = read('server/services/internal-beta-approved-snapshot-service-role-persistence-implementation.ts')
for (const token of [
  'createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation',
  'approvedPlanSnapshotInsert',
  'approvalRecordPatch',
  'apiIdempotencyKeyInsert',
  'auditEventInsert',
  'completed_service_role_persistence_envelope_validated_no_remote_write',
  'persistedToSupabase: false',
  'remoteSupabaseMutation: false',
  'serviceRoleRouteExecution: false',
  'internalBetaUnlock: false',
]) {
  if (!service.includes(token)) fail(`service missing token: ${token}`)
}

const credentialContract = read('server/config/internal-beta-supabase-credential-context-contract.ts')
if (!credentialContract.includes("name: 'Reeditpro'") || !credentialContract.includes("projectRef: 'wmyyttnynmteqgcdishd'")) {
  fail('credential contract must target Reeditpro staging')
}
if (credentialContract.includes('REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL')) {
  fail('credential contract must not accept clean-staging DB URL alias')
}

const confirmedRunner = read('scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs')
if (confirmedRunner.includes('REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL')) {
  fail('confirmed target runner must not accept clean-staging DB URL alias')
}

const preflightRunner = read('scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1.mjs')
if (preflightRunner.includes('REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL')) {
  fail('credential preflight runner must not accept clean-staging DB URL alias')
}
if (
  service.includes("from '@supabase/") ||
  service.includes('from "@supabase/') ||
  service.includes('createClient') ||
  service.includes('fetch(') ||
  service.includes('execFileSync') ||
  service.includes('spawnSync') ||
  service.includes('child_process')
) {
  fail('service contains forbidden remote/execution signal')
}

const smoke = read('server/smoke/internal-beta-approved-snapshot-service-role-persistence-implementation-smoke.ts')
for (const token of [
  'completed_service_role_persistence_envelope_validated_no_remote_write',
  'approved_plan_snapshots',
  'approval_records',
  'api_idempotency_keys',
  'audit_events',
  'blocked_pending_service_role_persistence_runtime_approval',
  'blocked_invalid_approved_snapshot_persistence_input',
  'internal-beta-approved-snapshot-service-role-persistence-implementation-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`smoke missing token: ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-approved-snapshot-service-role-persistence-implementation'] !==
  'tsx server/smoke/internal-beta-approved-snapshot-service-role-persistence-implementation-smoke.ts'
) {
  fail('missing implementation smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1-diagnostics.mjs'
) {
  fail('missing implementation diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
execFileSync('git', ['diff', '--cached', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file.startsWith('supabase/') || file.startsWith('server/routes/') || file.startsWith('server/workers/')) {
    fail(`forbidden changed file: ${file}`)
  }
  if (file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('.github/workflows/')) {
    fail(`forbidden changed path: ${file}`)
  }
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (/\\.(mp4|mov|mkv|zip|env)$/.test(file) || file.includes('/.env')) fail(`forbidden artifact/env file: ${file}`)
}

console.log(`${packet} diagnostics passed`)
