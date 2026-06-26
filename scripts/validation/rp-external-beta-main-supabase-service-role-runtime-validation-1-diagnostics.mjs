#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1'
const dir = 'docs/external-beta/main-supabase-service-role-runtime-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/grant-hardening.md`,
  `${dir}/validation-results.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/runtime-validation-record.json`,
  'docs/activation-phase-rp-external-beta-main-supabase-service-role-runtime-validation-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql',
  'scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_main_supabase_service_role_runtime_grant_boundary_validation',
  'completed_guarded_main_staging_grant_hardening_and_readonly_runtime_boundary_validation',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  '20260626233000_external_beta_public_grant_hardening.sql',
  '2026-06-26T23-41-52-998Z-818c6ba1',
  'Unsafe public mutation grants: `0`',
  'Unsafe public sequence grants: `0`',
  'public/worker-runtime lint: `passed_no_warnings`',
  'completed_with_managed_storage_warnings_allowed',
  'b0de58258882c2bbe0a7296c58ab3fc44b2f8eb645befe91bdd38adde55a83de',
  'cc7e3b894c2c0fb13fcb2dd0a23da27cccfeab952dc6b2ffcecd0d75b7ed5647',
  'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded',
]

const forbiddenPatterns = [
  /external beta (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /internal beta (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /production (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /serviceRoleSecretPayloadAccess"?\s*:\s*true/i,
  /databaseUrlPrinted"?\s*:\s*true/i,
  /databaseUrlPersistedInRepo"?\s*:\s*true/i,
  /frontendServiceRoleCredentialExposure"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerLeaseClaim"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
  /creditReservationCreation"?\s*:\s*true/i,
  /jobEnqueue"?\s*:\s*true/i,
  /jobEventWrite"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /renderExport"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /dependency mutation:\s*`?true`?/i,
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

const record = JSON.parse(read(`${dir}/runtime-validation-record.json`))
if (record.decision !== 'completed_main_supabase_service_role_runtime_grant_boundary_validation') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_main_staging_grant_hardening_and_readonly_runtime_boundary_validation') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.hardeningMigration !== 'supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql') fail('hardening migration path mismatch')
if (record.run?.runId !== '2026-06-26T23-41-52-998Z-818c6ba1') fail('run id mismatch')
if (record.run?.reportSha256 !== 'b0de58258882c2bbe0a7296c58ab3fc44b2f8eb645befe91bdd38adde55a83de') fail('report checksum mismatch')
if (record.run?.manifestSha256 !== 'cc7e3b894c2c0fb13fcb2dd0a23da27cccfeab952dc6b2ffcecd0d75b7ed5647') fail('manifest checksum mismatch')
if (record.validation?.dryRun !== 'passed_remote_database_is_up_to_date') fail('dry-run status mismatch')
if (record.validation?.publicWorkerRuntimeLint !== 'passed_no_warnings') fail('public/worker-runtime lint mismatch')
if (record.validation?.storageLintReadback !== 'completed_with_managed_storage_warnings_allowed') fail('storage lint readback mismatch')
if (record.validation?.unsafePublicMutationGrantCount !== 0) fail('unsafe public mutation grants not zero')
if (record.validation?.unsafePublicSequenceGrantCount !== 0) fail('unsafe public sequence grants not zero')
if (record.validation?.hardeningMigrationPresent !== true) fail('hardening migration not present')
if (record.readiness?.approvedSnapshotPersistence !== 'ready_for_guarded_remote_write_validation') fail('approved snapshot readiness mismatch')
if (record.readiness?.serviceRoleRouteExecution !== 'not_run_pending_route_specific_guarded_write_validation') fail('service-role route execution readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const safety = record.safety ?? {}
const falseFlags = [
  'databaseUrlPrinted',
  'databaseUrlPersistedInRepo',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'serviceRoleRouteExecution',
  'routeExecution',
  'workerExecution',
  'workerDispatch',
  'workerLeaseClaim',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'creditReservationCreation',
  'jobEnqueue',
  'jobEventWrite',
  'providerCall',
  'modelCall',
  'renderExport',
  'mediaProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]
for (const key of falseFlags) {
  if (safety[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (safety.remoteSupabaseMutation !== 'guarded_main_staging_public_grant_hardening_migration_apply_only') fail('remote Supabase mutation scope mismatch')
if (safety.sqlMutation !== 'guarded_main_staging_public_grant_hardening_migration_apply_only') fail('SQL mutation scope mismatch')
if (safety.migrationApply !== '20260626233000_external_beta_public_grant_hardening') fail('migration apply scope mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_remaining_runtime_gates_after_main_supabase_grant_boundary_validation') fail('rollup decision mismatch')
if (rollup.mainSupabaseTarget?.serviceRoleGrantBoundary !== 'completed_main_supabase_service_role_runtime_grant_boundary_validation') fail('rollup grant boundary mismatch')
if (rollup.mainSupabaseTarget?.unsafePublicMutationGrantCount !== 0) fail('rollup unsafe public mutation grants not zero')
if (rollup.mainSupabaseTarget?.unsafePublicSequenceGrantCount !== 0) fail('rollup unsafe public sequence grants not zero')
if (!rollup.requiredNextOwnerDecision?.includes('RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1')) fail('rollup next milestone mismatch')
if (rollup.safety?.supabaseMutation !== 'guarded_main_staging_migration_apply_and_grant_hardening_only') fail('rollup Supabase mutation scope mismatch')
if (rollup.safety?.sqlMutation !== 'guarded_main_staging_migration_apply_and_grant_hardening_only') fail('rollup SQL mutation scope mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-main-supabase-service-role-runtime-validation-1-confirmed'] !==
  'node scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-confirmed.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-main-supabase-service-role-runtime-validation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const migration = read('supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql')
for (const snippet of [
  'revoke insert, update, delete, truncate, references, trigger',
  'on all tables in schema public',
  'from anon, authenticated',
  'revoke all privileges',
  'on all sequences in schema public',
  'alter default privileges in schema public',
]) {
  if (!migration.includes(snippet)) fail(`hardening migration missing snippet: ${snippet}`)
}

const allowedSqlFiles = new Set(['supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql'])
for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file.endsWith('.sql') && !allowedSqlFiles.has(file)) fail(`unexpected SQL file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.includes('node_modules') || file.startsWith('dist') || file.startsWith('tmp/')) fail(`generated/dependency path changed: ${file}`)
  if (
    (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('supabase/functions/')) &&
    !file.startsWith('scripts/validation/')
  ) {
    fail(`runtime/source path changed: ${file}`)
  }

  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_main_supabase_service_role_runtime_grant_boundary_validation')
console.log('Next: RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1')
