#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1'
const dir = 'docs/external-beta/approved-snapshot-persistence-guarded-remote-write-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/validation-results.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/runtime-validation-record.json`,
  'docs/activation-phase-rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const followOnCreditReservationLedgerGuardedRemoteWriteFiles = [
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/source-audit.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/validation-results.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/readiness-gate.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/safety-boundary.md',
  'docs/external-beta/credit-reservation-ledger-guarded-remote-write-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-credit-reservation-ledger-guarded-remote-write-1-results.md',
  'scripts/validation/rp-external-beta-credit-reservation-ledger-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-credit-reservation-ledger-guarded-remote-write-1-diagnostics.mjs',
]
for (const file of followOnCreditReservationLedgerGuardedRemoteWriteFiles) allowedChangedFiles.add(file)

const followOnJobQueueLeaseEventGuardedRemoteWriteFiles = [
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/source-audit.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/validation-results.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/readiness-gate.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/safety-boundary.md',
  'docs/external-beta/job-queue-lease-event-guarded-remote-write-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-job-queue-lease-event-guarded-remote-write-1-results.md',
  'scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-diagnostics.mjs',
]
for (const file of followOnJobQueueLeaseEventGuardedRemoteWriteFiles) allowedChangedFiles.add(file)

const requiredText = [
  packet,
  'completed_approved_snapshot_persistence_guarded_remote_write_readback',
  'completed_guarded_transaction_rolled_back_approved_snapshot_persistence_write_readback',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  '2026-06-27T00-00-12-289Z-7f5e51bd',
  'set local role service_role',
  'Immutable snapshot update rejection: `passed`',
  'persistent validation rows',
  'residue counts as `0`',
  'aa4d16b57305072242427398a5f2c3fadf6637490d08f4a76466087b269cb865',
  '36edc2f5c48567da9ccd5860ce6b634858465933e974c9bec64bc2d59bfd73ed',
  '2a5cdc3a3c9a7c3f9f16a28da05efd35084297a26304842f8a79d34c0656a339',
  '588ba11c60afcda8836a181ef392e45133067a987c13734298f18618a8b51d79',
  'RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1',
  'completed_job_queue_lease_event_guarded_remote_write_readback',
  'RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1',
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
  /persistentRowsCreated"?\s*:\s*true/i,
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
if (record.decision !== 'completed_approved_snapshot_persistence_guarded_remote_write_readback') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_transaction_rolled_back_approved_snapshot_persistence_write_readback') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.run?.runId !== '2026-06-27T00-00-12-289Z-7f5e51bd') fail('run id mismatch')
if (record.run?.reportSha256 !== 'aa4d16b57305072242427398a5f2c3fadf6637490d08f4a76466087b269cb865') fail('report checksum mismatch')
if (record.run?.manifestSha256 !== '36edc2f5c48567da9ccd5860ce6b634858465933e974c9bec64bc2d59bfd73ed') fail('manifest checksum mismatch')
if (record.validation?.approvedSnapshotInserted !== 1) fail('approved snapshot insert readback mismatch')
if (record.validation?.approvalRecordInserted !== 1) fail('approval record insert readback mismatch')
if (record.validation?.idempotencyKeyInserted !== 1) fail('idempotency key insert readback mismatch')
if (record.validation?.auditEventInserted !== 1) fail('audit event insert readback mismatch')
if (record.validation?.snapshotImmutable !== true) fail('immutable snapshot flag mismatch')
if (record.validation?.immutableUpdateRejection !== 'passed') fail('immutability rejection mismatch')
for (const [key, value] of Object.entries(record.validation?.rollbackResidueCounts ?? {})) {
  if (value !== 0) fail(`rollback residue count not zero: ${key}`)
}
if (record.readiness?.creditReservationLedger !== 'ready_for_guarded_remote_write_readback_validation') fail('credit ledger readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const safety = record.safety ?? {}
const falseFlags = [
  'databaseUrlPrinted',
  'databaseUrlPersistedInRepo',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'persistentRowsCreated',
  'migrationApply',
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
if (safety.remoteSupabaseMutation !== 'guarded_transaction_rolled_back_generated_approved_snapshot_fixture_only') fail('remote Supabase mutation scope mismatch')
if (safety.sqlMutation !== 'guarded_transaction_rolled_back_generated_approved_snapshot_fixture_only') fail('SQL mutation scope mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_remaining_runtime_gates_after_job_queue_lease_event_remote_write_readback') fail('rollup decision mismatch')
if (rollup.mainSupabaseTarget?.approvedSnapshotPersistence !== 'completed_approved_snapshot_persistence_guarded_remote_write_readback') fail('rollup approved snapshot status mismatch')
if (rollup.mainSupabaseTarget?.approvedSnapshotPersistentRowsCreated !== false) fail('rollup persistent rows flag mismatch')
if (rollup.mainSupabaseTarget?.approvedSnapshotRollbackResidueCount !== 0) fail('rollup residue count mismatch')
if (rollup.mainSupabaseTarget?.creditReservationLedger !== 'completed_credit_reservation_ledger_guarded_remote_write_readback') fail('rollup credit ledger status mismatch')
if (rollup.mainSupabaseTarget?.jobQueueLeaseEvents !== 'completed_job_queue_lease_event_guarded_remote_write_readback') fail('rollup job queue status mismatch')
if (rollup.mainSupabaseTarget?.jobQueueLeaseEventPersistentRowsCreated !== false) fail('rollup job persistent rows flag mismatch')
if (rollup.mainSupabaseTarget?.jobQueueLeaseEventRollbackResidueCount !== 0) fail('rollup job residue count mismatch')
if (!rollup.requiredNextOwnerDecision?.includes('RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1')) fail('rollup next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-confirmed'] !==
  'node scripts/validation/rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-confirmed.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.includes('node_modules') || file.startsWith('dist') || file.startsWith('tmp/')) fail(`generated/dependency path changed: ${file}`)
  if (
    (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('supabase/')) &&
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
console.log('Decision: completed_approved_snapshot_persistence_guarded_remote_write_readback')
console.log('Next: RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1')
