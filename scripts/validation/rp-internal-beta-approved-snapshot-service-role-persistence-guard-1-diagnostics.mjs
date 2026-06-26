#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-GUARD-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/guard-contract.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/service-role-persistence-guard-record.json`,
  'docs/activation-phase-rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-results.md',
  'server/services/internal-beta-approved-snapshot-service-role-persistence-guard.ts',
  'server/smoke/internal-beta-approved-snapshot-service-role-persistence-guard-smoke.ts',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-diagnostics.mjs',
  'package.json',
]

const allowedExtra = [
  'scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
]

const followOnApprovedSnapshotServiceRolePersistenceImplementation1Files = [
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/implementation-contract.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1/service-role-persistence-implementation-record.json',
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
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...allowedExtra,
  ...followOnApprovedSnapshotServiceRolePersistenceImplementation1Files,
])

const requiredText = [
  packet,
  'completed_approved_snapshot_service_role_persistence_guard_no_supabase_write',
  'completed_backend_guard_no_route_or_remote_execution',
  'blocked_pending_confirmed_supabase_target_rls_storage_validation',
  'blocked_pending_service_role_persistence_runtime_approval',
  'ready_for_separate_service_role_persistence_implementation_no_supabase_write',
  'Supabase persistence: `false`',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta unlock:\s*`?true/i,
  /External beta unlock:\s*`?true/i,
  /Production unlock:\s*`?true/i,
  /Supabase persistence:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Job enqueue:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of requiredFiles) read(file)

const docsCorpus = requiredFiles
  .filter((file) => file.endsWith('.md') || file.endsWith('.json') || file === 'implementation-status-and-next-phase.md')
  .map(read)
  .join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenClaims) {
  if (docsCorpus.match(pattern)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/service-role-persistence-guard-record.json`))
if (record.decision !== 'completed_approved_snapshot_service_role_persistence_guard_no_supabase_write') fail('record decision mismatch')
if (record.execution !== 'completed_backend_guard_no_route_or_remote_execution') fail('record execution mismatch')
if (record.readyStatus !== 'ready_for_separate_service_role_persistence_implementation_no_supabase_write') fail('ready status mismatch')
if (record.supabasePersistence !== false) fail('supabase persistence must remain false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const key of [
  'routeExecution',
  'serviceRoleRouteExecution',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'creditMutation',
  'creditReservationCreation',
  'jobEnqueue',
  'workerExecution',
  'workerDispatch',
  'signedUrlCreation',
  'publicArtifactCreation',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}

const service = read('server/services/internal-beta-approved-snapshot-service-role-persistence-guard.ts')
for (const token of [
  'evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard',
  'createInternalBetaApprovedSnapshotLocalRuntime',
  'createInternalBetaSupabaseCredentialContextContract',
  'blocked_pending_confirmed_supabase_target_rls_storage_validation',
  'blocked_pending_service_role_persistence_runtime_approval',
  'ready_for_separate_service_role_persistence_implementation_no_supabase_write',
  'persistedToSupabase: false',
  'serviceRoleRouteExecution: false',
  'remoteSupabaseMutation: false',
  'internalBetaUnlock: false',
]) {
  if (!service.includes(token)) fail(`service missing token: ${token}`)
}
if (/from\s+['"]@supabase\/|createClient|fetch\(|execFileSync|spawnSync/.test(service)) fail('service contains forbidden execution signal')

const smoke = read('server/smoke/internal-beta-approved-snapshot-service-role-persistence-guard-smoke.ts')
for (const token of [
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_pending_confirmed_supabase_target_rls_storage_validation',
  'blocked_pending_service_role_persistence_runtime_approval',
  'ready_for_separate_service_role_persistence_implementation_no_supabase_write',
  'internal-beta-approved-snapshot-service-role-persistence-guard-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`smoke missing token: ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-approved-snapshot-service-role-persistence-guard'] !==
  'tsx server/smoke/internal-beta-approved-snapshot-service-role-persistence-guard-smoke.ts'
) {
  fail('missing guard smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-approved-snapshot-service-role-persistence-guard-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-diagnostics.mjs'
) {
  fail('missing guard diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of ['supabase', 'docker', 'src', '.github/workflows', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file.startsWith('server/routes/') || file.startsWith('server/workers/') || file.endsWith('.sql')) {
    fail(`forbidden changed file: ${file}`)
  }
  if (/\.(mp4|mov|mkv|zip|env)$/.test(file) || file.includes('/.env')) fail(`forbidden artifact/env file: ${file}`)
}

console.log(`${packet} diagnostics passed`)
