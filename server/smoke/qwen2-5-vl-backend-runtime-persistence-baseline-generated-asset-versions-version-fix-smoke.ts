import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATED_ASSET_VERSIONS_VERSION_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_8_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_baseline_generated_asset_versions_version_fix_recorded'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AL-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-9: retry Qwen local harness validation after generated_asset_versions version baseline fix, no deploy/no cloud/no assets/no beta'

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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-8-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result.ts',
  'supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix-smoke.ts',
  'package script mismatch',
)

const sql = read('supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql')
for (const phrase of [
  'alter table if exists public.generated_asset_versions',
  'add column if not exists version integer',
  'comment on column public.generated_asset_versions.version',
  'no backfill from version_number is invented here',
  'idx_generated_asset_versions_asset_version on public.generated_asset_versions(generated_asset_id, version)',
]) {
  check(sql.includes(phrase), `Baseline migration missing repair phrase: ${phrase}`)
}

const guardIndex = sql.indexOf('add column if not exists version integer')
const indexIndex = sql.indexOf('idx_generated_asset_versions_asset_version')
check(guardIndex >= 0 && indexIndex > guardIndex, 'Compatibility column guard must appear before generated asset version index.')

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.md')
for (const phrase of [
  DECISION,
  '`202605180005_reeditpro_generation_assets_jobs.sql`',
  '`idx_generated_asset_versions_asset_version`',
  '`column "version" does not exist (SQLSTATE 42703)`',
  '`public.generated_asset_versions.version`',
  '`public.generated_asset_versions.version_number`',
  '`no_backfill_because_migration_must_not_invent_generated_asset_versions_storage_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records`',
  '`baselineGeneratedAssetVersionsVersionFixRecorded=true`',
  '`activeBaselineGenerationAssetsJobsMigrationEdited=true`',
  '`generatedAssetVersionsVersionColumnGuarded=true`',
  '`generatedAssetVersionsVersionBackfillSkipped=true`',
  '`generatedAssetVersionsAssetVersionIndexUnblocked=true`',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const fix = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATED_ASSET_VERSIONS_VERSION_FIX
assert.equal(fix.decision, DECISION)
assert.equal(
  fix.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry8ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_8_RESULT.decision,
)
assert.equal(fix.repairedMigration.path, 'supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql')
assert.equal(fix.repairedMigration.repair, 'add_idempotent_generated_asset_versions_version_compatibility_column')
assert.deepEqual(fix.repairedMigration.compatibilityColumns, [
  'public.generated_asset_versions.version',
])
assert.deepEqual(fix.repairedMigration.olderBaselineColumnsObserved, [
  'public.generated_asset_versions.version_number',
])
assert.deepEqual(fix.repairedMigration.compatibilityBackfills, [])
assert.equal(
  fix.repairedMigration.backfillPolicy,
  'no_backfill_because_migration_must_not_invent_generated_asset_versions_storage_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records',
)
assert.deepEqual(fix.repairedMigration.indexesUnblocked, [
  'idx_generated_asset_versions_asset_version',
])
assert.equal(fix.nextPrompt, NEXT_PROMPT)
assertFalseFlags(fix.runtimeFlags)
assert.equal(fix.runtimeFlags.baselineGeneratedAssetVersionsVersionFixRecorded, true)
assert.equal(fix.runtimeFlags.activeBaselineGenerationAssetsJobsMigrationEdited, true)
assert.equal(fix.runtimeFlags.generatedAssetVersionsVersionColumnGuarded, true)
assert.equal(fix.runtimeFlags.generatedAssetVersionsVersionBackfillSkipped, true)
assert.equal(fix.runtimeFlags.generatedAssetVersionsAssetVersionIndexUnblocked, true)

const forbiddenDataFindings = scanValues({ fix })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in baseline generated asset versions version fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  repairedMigration: fix.repairedMigration.path,
  compatibilityColumns: fix.repairedMigration.compatibilityColumns,
  generatedAssetVersionsVersionBackfillSkipped:
    fix.runtimeFlags.generatedAssetVersionsVersionBackfillSkipped,
  qwenDraftSqlApplied: fix.runtimeFlags.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: fix.runtimeFlags.qwenLocalSqlTestsExecuted,
  generatedLocalFixturePassedClaimed: fix.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: fix.nextPrompt,
}, null, 2))
