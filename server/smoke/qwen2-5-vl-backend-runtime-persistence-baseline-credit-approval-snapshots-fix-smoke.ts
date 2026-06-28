import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_APPROVAL_SNAPSHOTS_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_5_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-5-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_baseline_credit_approval_snapshots_fix_recorded'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AF-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-6: retry Qwen local harness validation after credit approval snapshots baseline fix, no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched|supabaseCloudTouched|stagingTouched|productionTouched)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential-looking value', /\b(sk-[A-Za-z0-9]{12,}|hf_[A-Za-z0-9]{12,}|ya29\.[A-Za-z0-9._-]+)/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenTextPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenValuePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'newActiveMigrationCreated',
    'qwenActiveMigrationCreated',
    'supabaseCliExecuted',
    'dockerStarted',
    'sqlExecuted',
    'migrationDeployed',
    'qwenDraftSqlApplied',
    'qwenLocalSqlTestsExecuted',
    'localHarnessStarted',
    'localHarnessValidationAttemptedAfterFix',
    'localHarnessValidationPassedAfterFix',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'realJobCreated',
    'realLeaseClaimed',
    'idempotencyRowCreated',
    'jobEventCreated',
    'backendRuntimeMessageCreated',
    'workerClaimCreated',
    'storageObjectRecordCreated',
    'signedUrlEventCreated',
    'qaReportCreated',
    'auditEventCreated',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'identityTokenFetched',
    'authHeaderCreated',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'promptProcessed',
    'forwardPassRun',
    'inferenceRun',
    'providerCallsMade',
    'workersDispatched',
    'supabaseCloudTouched',
    'stagingTouched',
    'productionTouched',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
    'creditMutationCreated',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-5-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-5-result.ts',
  'supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/024_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)
check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/999_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix-smoke.ts',
  'package script mismatch',
)

const sql = read('supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql')
for (const phrase of [
  'alter table if exists public.credit_reservations',
  'add column if not exists approved_plan_snapshot_id uuid',
  'alter table if exists public.credit_ledger_entries',
  'alter table if exists public.approval_records',
  'add column if not exists approved_snapshot_id uuid',
  'do not backfill or',
  'comment on column public.credit_reservations.approved_plan_snapshot_id',
  'comment on column public.credit_ledger_entries.approved_plan_snapshot_id',
  'comment on column public.approval_records.approved_snapshot_id',
  'credit_reservations_approved_plan_snapshot_id_fkey',
  'credit_ledger_entries_approved_plan_snapshot_id_fkey',
  'approval_records_approved_snapshot_id_fkey',
]) {
  check(sql.includes(phrase), `Baseline migration missing repair phrase: ${phrase}`)
}

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.md')
for (const phrase of [
  DECISION,
  '`202605180004_reeditpro_credits_approval_snapshots.sql`',
  '`credit_reservations_approved_plan_snapshot_id_fkey`',
  '`column "approved_plan_snapshot_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)`',
  '`public.credit_reservations.approved_plan_snapshot_id`',
  '`public.credit_ledger_entries.approved_plan_snapshot_id`',
  '`public.approval_records.approved_snapshot_id`',
  '`no_backfill_because_migration_must_not_invent_approved_plan_snapshot_or_credit_records`',
  '`baselineCreditApprovalSnapshotsFixRecorded=true`',
  '`activeBaselineMigrationEdited=true`',
  '`creditReservationsApprovedPlanSnapshotColumnGuarded=true`',
  '`creditLedgerEntriesApprovedPlanSnapshotColumnGuarded=true`',
  '`approvalRecordsApprovedSnapshotColumnGuarded=true`',
  '`approvedSnapshotReferenceBackfillSkipped=true`',
  '`creditApprovalSnapshotForeignKeysUnblocked=true`',
  '`newActiveMigrationCreated=false`',
  '`qwenActiveMigrationCreated=false`',
  '`sqlExecuted=false`',
  '`qwenDraftSqlApplied=false`',
  '`qwenLocalSqlTestsExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const fix = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_APPROVAL_SNAPSHOTS_FIX
assert.equal(fix.decision, DECISION)
assert.equal(
  fix.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry5ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_5_RESULT.decision,
)
assert.equal(fix.repairedMigration.path, 'supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql')
assert.equal(fix.repairedMigration.repair, 'add_idempotent_credit_approval_snapshot_compatibility_columns')
assert.deepEqual(fix.repairedMigration.compatibilityColumns, [
  'public.credit_reservations.approved_plan_snapshot_id',
  'public.credit_ledger_entries.approved_plan_snapshot_id',
  'public.approval_records.approved_snapshot_id',
])
assert.deepEqual(fix.repairedMigration.compatibilityBackfills, [])
assert.equal(
  fix.repairedMigration.backfillPolicy,
  'no_backfill_because_migration_must_not_invent_approved_plan_snapshot_or_credit_records',
)
assert.deepEqual(fix.repairedMigration.constraintsUnblocked, [
  'credit_reservations_approved_plan_snapshot_id_fkey',
  'credit_ledger_entries_approved_plan_snapshot_id_fkey',
  'approval_records_approved_snapshot_id_fkey',
])
assert.equal(fix.nextPrompt, NEXT_PROMPT)
assertFalseFlags(fix.runtimeFlags)
assert.equal(fix.runtimeFlags.baselineCreditApprovalSnapshotsFixRecorded, true)
assert.equal(fix.runtimeFlags.activeBaselineMigrationEdited, true)
assert.equal(fix.runtimeFlags.creditReservationsApprovedPlanSnapshotColumnGuarded, true)
assert.equal(fix.runtimeFlags.creditLedgerEntriesApprovedPlanSnapshotColumnGuarded, true)
assert.equal(fix.runtimeFlags.approvalRecordsApprovedSnapshotColumnGuarded, true)
assert.equal(fix.runtimeFlags.approvedSnapshotReferenceBackfillSkipped, true)
assert.equal(fix.runtimeFlags.creditApprovalSnapshotForeignKeysUnblocked, true)

const forbiddenDataFindings = scanValues({ fix })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in baseline credit approval snapshots fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  repairedMigration: fix.repairedMigration.path,
  compatibilityColumns: fix.repairedMigration.compatibilityColumns,
  approvedSnapshotReferenceBackfillSkipped: fix.runtimeFlags.approvedSnapshotReferenceBackfillSkipped,
  qwenDraftSqlApplied: fix.runtimeFlags.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: fix.runtimeFlags.qwenLocalSqlTestsExecuted,
  generatedLocalFixturePassedClaimed: fix.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: fix.nextPrompt,
}, null, 2))
