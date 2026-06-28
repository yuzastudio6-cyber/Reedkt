import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_BUCKETS_COMMENT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_12_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_baseline_storage_buckets_comment_fix_recorded'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AT-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-13: retry Qwen local harness validation after storage.buckets comment baseline fix, no deploy/no cloud/no assets/no beta'

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
    'storageBucketPolicySemanticsChanged',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-buckets-comment-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-12-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result.ts',
  'supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql',
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
check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix-smoke.ts',
  'package script mismatch',
)

const migration = read('supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql')
for (const phrase of [
  'insert into storage.buckets',
  "'source-media'",
  "'generated-assets'",
  "'processed-media'",
  "'previews'",
  "'exports'",
  "'thumbnails'",
  "'qa-artifacts'",
  "'worker-temp'",
  'on conflict (id) do update',
  'do $$',
  'comment on table storage.buckets is',
  'exception',
  'when insufficient_privilege then',
  'Skipping storage.buckets table comment because the local migration role does not own the Supabase platform table.',
  'create policy "reeditpro_project_members_read_project_objects" on storage.objects',
  'create policy "reeditpro_project_editors_upload_source_and_thumbnails" on storage.objects',
  'create policy "reeditpro_project_editors_update_source_and_thumbnails" on storage.objects',
]) {
  assert.ok(migration.includes(phrase), `Migration missing phrase: ${phrase}`)
}

check(
  (migration.match(/comment on table storage\.buckets is/g) ?? []).length === 1,
  'storage.buckets table comment should exist only once inside the guarded block.',
)
check(
  migration.indexOf('do $$') < migration.indexOf('comment on table storage.buckets is') &&
    migration.indexOf('comment on table storage.buckets is') < migration.indexOf('exception'),
  'storage.buckets table comment must be guarded before the insufficient_privilege handler.',
)
check(!/insert\s+into\s+storage\.objects/i.test(migration), 'Migration must not insert storage objects.')
check(!/storage\.googleapis\.com/i.test(migration), 'Migration must not include public storage endpoints.')
check(!/create\s+policy\s+.*anon/i.test(migration), 'Migration must not add anonymous storage policy.')

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-buckets-comment-fix.md')
for (const phrase of [
  DECISION,
  '`202605180008_reeditpro_storage_buckets_policies.sql`',
  '`storage_buckets_comment_ownership`',
  '`must be owner of table buckets (SQLSTATE 42501)`',
  '`comment on table storage.buckets`',
  '`guard_storage_buckets_table_comment_with_insufficient_privilege_notice`',
  '`baselineStorageBucketsCommentFixRecorded=true`',
  '`activeBaselineStorageBucketsPoliciesMigrationEdited=true`',
  '`storageBucketsTableCommentInsufficientPrivilegeGuarded=true`',
  '`storageBucketsTableCommentSkippedWhenNotOwner=true`',
  '`storageBucketPolicySemanticsChanged=false`',
  '`qwenDraftSqlApplied=false`',
  '`qwenLocalSqlTestsExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-buckets-comment-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const fix = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_BUCKETS_COMMENT_FIX
assert.equal(fix.decision, DECISION)
assert.equal(
  fix.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry12ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_12_RESULT.decision,
)
assert.equal(fix.repairedMigration.path, 'supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql')
assert.equal(fix.repairedMigration.failedStatementCategory, 'storage_buckets_comment_ownership')
assert.equal(fix.repairedMigration.failedStatement, 'comment on table storage.buckets')
assert.equal(fix.repairedMigration.bucketPrivacySemanticsChanged, false)
assert.equal(fix.repairedMigration.storageObjectPolicySemanticsChanged, false)
assert.equal(fix.repairedMigration.bucketRowsSeeded, false)
assert.equal(fix.repairedMigration.storageObjectsSeeded, false)
assert.equal(fix.nextPrompt, NEXT_PROMPT)
assertFalseFlags(fix.runtimeFlags)
assert.equal(fix.runtimeFlags.baselineStorageBucketsCommentFixRecorded, true)
assert.equal(fix.runtimeFlags.activeBaselineStorageBucketsPoliciesMigrationEdited, true)
assert.equal(fix.runtimeFlags.storageBucketsTableCommentInsufficientPrivilegeGuarded, true)
assert.equal(fix.runtimeFlags.storageBucketsTableCommentSkippedWhenNotOwner, true)

const forbiddenDataFindings = scanValues({ fix })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in storage buckets comment fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  repairedMigration: fix.repairedMigration.path,
  failedStatementCategory: fix.repairedMigration.failedStatementCategory,
  storageBucketsTableCommentInsufficientPrivilegeGuarded:
    fix.runtimeFlags.storageBucketsTableCommentInsufficientPrivilegeGuarded,
  storageBucketPolicySemanticsChanged: fix.runtimeFlags.storageBucketPolicySemanticsChanged,
  qwenDraftSqlApplied: fix.runtimeFlags.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: fix.runtimeFlags.qwenLocalSqlTestsExecuted,
  generatedLocalFixturePassedClaimed: fix.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: fix.nextPrompt,
}, null, 2))
