#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1'
const dir = 'docs/external-beta/job-queue-lease-event-guarded-remote-write-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/validation-results.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/runtime-validation-record.json`,
  'docs/activation-phase-rp-external-beta-job-queue-lease-event-guarded-remote-write-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-credit-reservation-ledger-guarded-remote-write-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-main-supabase-service-role-runtime-validation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)
for (const file of [
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/source-audit.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/validation-results.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/readiness-gate.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/safety-boundary.md',
  'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1/runtime-validation-record.json',
  'docs/activation-phase-rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-results.md',
  'scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_job_queue_lease_event_guarded_remote_write_readback',
  'completed_guarded_transaction_rolled_back_job_queue_lease_event_write_readback',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  '2026-06-27T00-29-52-739Z-c91f8249',
  'set local role service_role',
  'Job batch status read back: `queued`',
  'Job status read back: `queued`',
  'Job event type read back: `queued`',
  'Worker lease status read back: `claimed`',
  'Job claim attempt result read back: `claimed`',
  'persistent validation rows created: `false`',
  'residue counts as `0`',
  '351db63b480fd32c8afa731df50f8b8332fdaa42b23ff32296d1b6bcf8a51d42',
  'b283940e84c41ca159bae48c4021d6d2b250cc72aacafeeadfa0cd58bea3507b',
  '462662a3a23f947d245a791671727b81f422197670e7980aa9d763b7de33f0a7',
  '10cefbad91d0b5e80a05f77b3888e0865f45e171bde89c82a90daf9ab283d02c',
  'blocked_external_product_beta_pending_remaining_runtime_gates_after_private_artifact_storage_access_remote_write_readback',
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
  /persistentCreditMutation"?\s*:\s*true/i,
  /persistentCreditReservationCreation"?\s*:\s*true/i,
  /persistentJobEnqueue"?\s*:\s*true/i,
  /persistentJobEventWrite"?\s*:\s*true/i,
  /persistentWorkerLeaseClaim"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
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
if (record.decision !== 'completed_job_queue_lease_event_guarded_remote_write_readback') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_transaction_rolled_back_job_queue_lease_event_write_readback') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.run?.runId !== '2026-06-27T00-29-52-739Z-c91f8249') fail('run id mismatch')
if (record.run?.reportSha256 !== '462662a3a23f947d245a791671727b81f422197670e7980aa9d763b7de33f0a7') fail('report checksum mismatch')
if (record.run?.manifestSha256 !== '10cefbad91d0b5e80a05f77b3888e0865f45e171bde89c82a90daf9ab283d02c') fail('manifest checksum mismatch')
if (record.run?.writeReadbackSha256 !== '351db63b480fd32c8afa731df50f8b8332fdaa42b23ff32296d1b6bcf8a51d42') fail('write readback checksum mismatch')
if (record.run?.rollbackResidueSha256 !== 'b283940e84c41ca159bae48c4021d6d2b250cc72aacafeeadfa0cd58bea3507b') fail('rollback residue checksum mismatch')
for (const key of [
  'approvedSnapshotInserted',
  'creditReservationInserted',
  'creditLedgerEntryInserted',
  'jobBatchInserted',
  'jobInserted',
  'jobEventInserted',
  'workerLeaseInserted',
  'jobClaimAttemptInserted',
  'auditEventInserted',
]) {
  if (record.validation?.[key] !== 1) fail(`${key} readback mismatch`)
}
if (record.validation?.jobBatchStatus !== 'queued') fail('job batch status mismatch')
if (record.validation?.jobStatus !== 'queued') fail('job status mismatch')
if (record.validation?.jobType !== 'render_preview') fail('job type mismatch')
if (record.validation?.workerTarget !== 'render_worker') fail('worker target mismatch')
if (record.validation?.runtimeType !== 'cloud_run_job') fail('runtime type mismatch')
if (record.validation?.jobEventType !== 'queued') fail('job event type mismatch')
if (record.validation?.workerLeaseStatus !== 'claimed') fail('worker lease status mismatch')
if (record.validation?.workerLeaseWorkerKind !== 'render_worker') fail('worker lease kind mismatch')
if (record.validation?.jobClaimAttemptResult !== 'claimed') fail('job claim attempt result mismatch')
for (const [key, value] of Object.entries(record.validation?.rollbackResidueCounts ?? {})) {
  if (value !== 0) fail(`rollback residue count not zero: ${key}`)
}
if (record.readiness?.privateArtifactStorageAccess !== 'ready_for_guarded_remote_write_readback_validation') fail('private artifact readiness mismatch')
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
  'persistentWorkerLeaseClaim',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'persistentCreditMutation',
  'persistentCreditReservationCreation',
  'persistentJobEnqueue',
  'persistentJobEventWrite',
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
if (safety.remoteSupabaseMutation !== 'guarded_transaction_rolled_back_generated_job_queue_lease_event_fixture_only') fail('remote Supabase mutation scope mismatch')
if (safety.sqlMutation !== 'guarded_transaction_rolled_back_generated_job_queue_lease_event_fixture_only') fail('SQL mutation scope mismatch')
if (safety.creditMutation !== 'transaction_rolled_back_generated_credit_fixture_only') fail('credit mutation scope mismatch')
if (safety.creditReservationCreation !== 'transaction_rolled_back_generated_credit_fixture_only') fail('credit reservation scope mismatch')
if (safety.jobEnqueue !== 'transaction_rolled_back_generated_job_fixture_only') fail('job enqueue scope mismatch')
if (safety.jobEventWrite !== 'transaction_rolled_back_generated_job_event_fixture_only') fail('job event scope mismatch')
if (safety.workerLeaseClaim !== 'transaction_rolled_back_generated_worker_lease_fixture_only') fail('worker lease scope mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_remaining_runtime_gates_after_private_artifact_storage_access_remote_write_readback') fail('rollup decision mismatch')
if (rollup.mainSupabaseTarget?.jobQueueLeaseEvents !== 'completed_job_queue_lease_event_guarded_remote_write_readback') fail('rollup job gate status mismatch')
if (rollup.mainSupabaseTarget?.jobQueueLeaseEventPersistentRowsCreated !== false) fail('rollup persistent job rows flag mismatch')
if (rollup.mainSupabaseTarget?.jobQueueLeaseEventRollbackResidueCount !== 0) fail('rollup job residue count mismatch')
if (rollup.mainSupabaseTarget?.jobQueueJobStatus !== 'queued') fail('rollup job status mismatch')
if (rollup.mainSupabaseTarget?.jobQueueJobEventType !== 'queued') fail('rollup job event type mismatch')
if (rollup.mainSupabaseTarget?.jobQueueWorkerLeaseStatus !== 'claimed') fail('rollup worker lease status mismatch')
if (!rollup.requiredNextOwnerDecision?.includes('RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1')) fail('rollup next milestone mismatch')
if (rollup.safety?.jobEnqueue !== 'transaction_rolled_back_generated_job_fixture_only') fail('rollup job enqueue scope mismatch')
if (rollup.safety?.persistentJobEnqueue !== false) fail('rollup persistent job enqueue flag mismatch')
if (rollup.safety?.jobEventWrite !== 'transaction_rolled_back_generated_job_event_fixture_only') fail('rollup job event scope mismatch')
if (rollup.safety?.persistentJobEventWrite !== false) fail('rollup persistent job event flag mismatch')
if (rollup.safety?.workerLeaseClaim !== 'transaction_rolled_back_generated_worker_lease_fixture_only') fail('rollup worker lease scope mismatch')
if (rollup.safety?.persistentWorkerLeaseClaim !== false) fail('rollup persistent worker lease flag mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-job-queue-lease-event-guarded-remote-write-1-confirmed'] !==
  'node scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-confirmed.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-job-queue-lease-event-guarded-remote-write-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-diagnostics.mjs'
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
console.log('Decision: completed_job_queue_lease_event_guarded_remote_write_readback')
console.log('Next: RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1')
