#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-LOCAL-RUNTIME-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-approved-snapshot-persistence-local-runtime-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-contract.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/approved-snapshot-local-runtime-record.json`,
  'docs/activation-phase-rp-internal-beta-approved-snapshot-persistence-local-runtime-1-results.md',
]

const requiredFiles = [
  ...packetFiles,
  'server/services/internal-beta-approved-snapshot-persistence-local-runtime.ts',
  'server/smoke/internal-beta-approved-snapshot-persistence-local-runtime-smoke.ts',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'package.json',
]

const serviceRolePersistenceGuardFiles = [
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1/guard-contract.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1/service-role-persistence-guard-record.json',
  'docs/activation-phase-rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-results.md',
  'server/services/internal-beta-approved-snapshot-service-role-persistence-guard.ts',
  'server/smoke/internal-beta-approved-snapshot-service-role-persistence-guard-smoke.ts',
  'scripts/validation/rp-internal-beta-approved-snapshot-service-role-persistence-guard-1-diagnostics.mjs',
]

const creditReservationLocalRuntimeFiles = [
  'docs/internal-beta/rp-internal-beta-credit-reservation-local-runtime-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-credit-reservation-local-runtime-1/runtime-contract.md',
  'docs/internal-beta/rp-internal-beta-credit-reservation-local-runtime-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-credit-reservation-local-runtime-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-credit-reservation-local-runtime-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-credit-reservation-local-runtime-1/credit-reservation-local-runtime-record.json',
  'docs/activation-phase-rp-internal-beta-credit-reservation-local-runtime-1-results.md',
  'server/services/internal-beta-credit-reservation-local-runtime.ts',
  'server/smoke/internal-beta-credit-reservation-local-runtime-smoke.ts',
  'scripts/validation/rp-internal-beta-credit-reservation-local-runtime-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

for (const file of serviceRolePersistenceGuardFiles) {
  allowedChangedFiles.add(file)
}

for (const file of creditReservationLocalRuntimeFiles) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_local_approved_snapshot_persistence_runtime_no_supabase_write',
  'completed_backend_local_snapshot_validation_no_route_or_remote_execution',
  'local_snapshot_persistence_validated_no_supabase_write',
  'blocked_invalid_approved_snapshot_persistence_input',
  'Immutable snapshot record created locally: `true`',
  'Supabase persistence: `false`',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-GUARD-1',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta unlock:\s*`?true/i,
  /External beta unlock:\s*`?true/i,
  /Production unlock:\s*`?true/i,
  /Supabase persistence:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Credit reservation creation:\s*`?true/i,
  /Job enqueue:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'supabase/',
  'docker/',
  'src/',
  '.github/workflows/',
  'server/routes/',
  'server/workers/',
  'server/config/',
]

const allowedServerFiles = new Set([
  'server/services/internal-beta-approved-snapshot-persistence-local-runtime.ts',
  'server/smoke/internal-beta-approved-snapshot-persistence-local-runtime-smoke.ts',
])

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

const docsCorpus = [
  ...packetFiles,
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
].map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

const docsOnlyCorpus = packetFiles.map(read).join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(docsOnlyCorpus)) fail(`forbidden docs claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/approved-snapshot-local-runtime-record.json`))
if (record.decision !== 'completed_local_approved_snapshot_persistence_runtime_no_supabase_write') fail('record decision mismatch')
if (record.execution !== 'completed_backend_local_snapshot_validation_no_route_or_remote_execution') fail('record execution mismatch')
if (record.localRuntimeStatus !== 'local_snapshot_persistence_validated_no_supabase_write') fail('local runtime status mismatch')
if (record.invalidInputBlocker !== 'blocked_invalid_approved_snapshot_persistence_input') fail('invalid input blocker mismatch')
if (record.immutableSnapshotRecordCreatedLocally !== true) fail('local immutable snapshot flag mismatch')
if (record.supabasePersistence !== false) fail('supabase persistence must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const key of [
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'serviceRoleRouteExecution',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'creditMutation',
  'creditReservationCreation',
  'jobEnqueue',
  'workerExecution',
  'workerDispatch',
  'providerModelCall',
  'rawPromptExecution',
  'renderExportExecution',
  'previewArtifactCreation',
  'finalExportCreation',
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

const service = read('server/services/internal-beta-approved-snapshot-persistence-local-runtime.ts')
for (const token of [
  'createInternalBetaApprovedSnapshotLocalRuntime',
  'validateApprovedPlanSnapshotForWorker',
  'findForbiddenInputKeys',
  'rawChat',
  'rawPrompt',
  'signedUrl',
  'serviceRoleKey',
  'persistedToSupabase: false',
  'routeExecution: false',
  'creditReservationCreation: false',
  'workerDispatch: false',
  'internalBetaUnlock: false',
  'stableStringify',
  'sha256Hex',
]) {
  if (!service.includes(token)) fail(`service missing token: ${token}`)
}
if (/from\s+['"]@supabase\/|createClient|fetch\(|execFileSync|spawnSync/.test(service)) {
  fail('service must not import Supabase clients, fetch, or spawn commands')
}

const smoke = read('server/smoke/internal-beta-approved-snapshot-persistence-local-runtime-smoke.ts')
for (const token of [
  'missing credit reservation must block local snapshot readiness',
  'raw chat fields must be rejected',
  'signed URL fields must be rejected',
  'internal-beta-approved-snapshot-persistence-local-runtime-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`smoke missing token: ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-approved-snapshot-persistence-local-runtime'] !==
  'tsx server/smoke/internal-beta-approved-snapshot-persistence-local-runtime-smoke.ts'
) {
  fail('missing approved snapshot local runtime smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-approved-snapshot-persistence-local-runtime-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs'
) {
  fail('missing approved snapshot local runtime diagnostics script')
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
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    if (!allowedServerFiles.has(file)) fail(`forbidden changed file: ${file}`)
  }
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.mkv') || file.endsWith('.zip')) {
    fail(`generated/media artifact changed: ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
