import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_migration_draft_recorded_local_validation_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58P-BACKEND-RUNTIME-PERSISTENCE-LOCAL-VALIDATION: validate Qwen persistence draft against an approved local database, no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenConcretePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['concrete URL', /https?:\/\//i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
]

const unsafeTrueClaimPatterns: Array<[string, RegExp]> = [
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|workerClaimCreated|jobEventCreated|backendRuntimeMessageCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|activeMigrationCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(privateInvokeReady|betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = [...forbiddenConcretePatterns, ...unsafeTrueClaimPatterns]
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenConcretePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertNoUncommentedInsert(relativePath: string) {
  const lines = read(relativePath).split(/\r?\n/)
  const findings = lines
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => /^\s*insert\s+into\b/i.test(line))
    .map(({ number }) => number)
  assert.deepEqual(findings, [], `Uncommented insert statements in ${relativePath}: ${findings.join(', ')}`)
}

function assertFalseRuntimeSideEffects(flags: JsonRecord) {
  for (const key of [
    'activeMigrationCreated',
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
    'supabaseTouched',
    'sqlExecuted',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-migration-draft'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-migration-draft-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft.md')
for (const phrase of [
  DECISION,
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'No `supabase/migrations/*` file is created by this packet.',
  '`approved_plan_snapshots`',
  '`credit_reservations`',
  '`jobs`',
  '`job_events`',
  '`worker_runtime_configs`',
  '`worker_leases`',
  '`backend_runtime_messages`',
  '`job_claim_attempts`',
  '`api_idempotency_keys`',
  '`worker_job_claims`',
  '`storage_object_records`',
  '`signed_url_events`',
  '`tool_runtime_checks`',
  '`qwen_vl`',
  '`backendRuntimePersistenceMigrationDraftRecorded=true`',
  '`backendRuntimePersistenceMigrationDraftRequired=false`',
  '`backendRuntimePersistenceLocalValidationRequired=true`',
  '`draftSqlCreated=true`',
  '`localSqlTestsCreated=true`',
  '`activeMigrationCreated=false`',
  '`sqlExecuted=false`',
  '`supabaseTouched=false`',
  '`readyForRealWorkerDispatch=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const draftSql = read('database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql')
for (const phrase of [
  'ReeditPro SQL MIGRATION DRAFT ONLY.',
  'DO NOT RUN.',
  'DO NOT APPLY TO SUPABASE.',
  'QWEN2_5_VL_DRAFT_REQUIRES_REEDITPRO_RUNTIME_BASELINE',
  'qwen25_vl_jobs_payload_refs_check',
  'qwen25_vl_job_events_sanitized_payload_check',
  'qwen25_vl_worker_runtime_config_check',
  'qwen25_vl_worker_leases_refs_check',
  'qwen25_vl_backend_runtime_messages_sanitized_check',
  'qwen25_vl_job_claim_attempts_sanitized_check',
  'tool_runtime_checks_tool_name_check',
  "'qwen_vl'",
  'jobs_qwen_worker_type_idx',
  'jobs_qwen_approved_snapshot_ref_idx',
  'backend_runtime_messages_qwen_target_idx',
  'worker_leases_qwen_active_idx',
  'api_idempotency_keys_qwen_request_path_idx',
]) {
  assert.ok(draftSql.includes(phrase), `Draft SQL missing phrase: ${phrase}`)
}

const testSql = read('database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql')
for (const phrase of [
  'Do not run in production.',
  '024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'qwen25_vl_jobs_payload_refs_check',
  'qwen25_vl_job_events_sanitized_payload_check',
  'qwen25_vl_worker_runtime_config_check',
  'tool_runtime_checks_tool_name_check',
  'qwen_vl',
  'jobs_qwen_worker_type_idx',
  'worker_job_claims_active_job_uidx',
  'worker_leases_active_job_uidx',
  'qwen_runtime_surfaces_have_no_raw_prompt_columns',
  '-- insert into public.jobs',
  '-- insert into public.backend_runtime_messages',
]) {
  assert.ok(testSql.includes(phrase), `Test SQL missing phrase: ${phrase}`)
}

assertNoUncommentedInsert('database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql')
assertNoUncommentedInsert('database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql')

const draft = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT
assert.equal(draft.decision, DECISION)
assert.equal(
  draft.upstreamBackendRuntimePersistenceSchemaDraftReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW.decision,
)
assert.equal(draft.draftFiles.activeMigrationCreated, false)
assert.equal(draft.draftDecision.extendsExistingRuntimeSurfaces, true)
assert.equal(draft.draftDecision.createsParallelQwenQueue, false)
assert.equal(draft.draftDecision.createsActiveMigration, false)
assert.equal(draft.draftDecision.executesSqlNow, false)
assert.equal(draft.draftDecision.localValidationRequired, true)
assert.equal(draft.readinessDecision.backendRuntimePersistenceMigrationDraftRecorded, true)
assert.equal(draft.readinessDecision.backendRuntimePersistenceMigrationDraftRequired, false)
assert.equal(draft.readinessDecision.backendRuntimePersistenceLocalValidationRequired, true)
assert.equal(draft.nextPrompt, NEXT_PROMPT)

for (const surface of [
  'approved_plan_snapshots',
  'credit_reservations',
  'jobs',
  'job_events',
  'worker_runtime_configs',
  'worker_leases',
  'backend_runtime_messages',
  'job_claim_attempts',
  'api_idempotency_keys',
  'worker_job_claims',
  'storage_object_records',
  'signed_url_events',
  'tool_runtime_checks',
]) {
  assert.ok(draft.draftedSurfaceActions.some((item) => item.id === surface), `Missing drafted surface ${surface}`)
}

for (const coverage of [
  'runtime_baseline_tables_exist',
  'media_analysis_job_type_exists',
  'qwen_jobs_payload_refs_constraint_exists',
  'qwen_job_events_sanitized_payload_constraint_exists',
  'qwen_worker_runtime_config_constraint_exists',
  'tool_runtime_checks_allows_qwen_vl',
  'qwen_specific_indexes_exist',
  'one_active_claim_and_lease_indexes_exist',
  'negative_examples_are_commented_only',
]) {
  assert.ok(draft.localSqlTestCoverage.includes(coverage as never), `Missing coverage ${coverage}`)
}

assert.equal(draft.qwenDraftConstraints.workerType, 'qwen2_5_vl_cloud_run_gpu_worker')
assert.equal(draft.qwenDraftConstraints.jobType, 'media_analysis')
assert.equal(draft.qwenDraftConstraints.selectedGpu, 'nvidia_l4')
assert.equal(draft.qwenDraftConstraints.servingProfile, 'bounded_preview_scale_to_zero')
assertFalseRuntimeSideEffects(draft.runtimeFlags)
assert.equal(draft.runtimeFlags.backendRuntimePersistenceMigrationDraftRecorded, true)
assert.equal(draft.runtimeFlags.backendRuntimePersistenceLocalValidationRequired, true)
assert.equal(draft.runtimeFlags.draftSqlCreated, true)
assert.equal(draft.runtimeFlags.localSqlTestsCreated, true)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft.ts',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  draft,
  schemaDraftReview: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen migration draft data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  draftedSurfaceCount: draft.draftedSurfaceActions.length,
  draftSqlCreated: draft.runtimeFlags.draftSqlCreated,
  localSqlTestsCreated: draft.runtimeFlags.localSqlTestsCreated,
  activeMigrationCreated: draft.runtimeFlags.activeMigrationCreated,
  sqlExecuted: draft.runtimeFlags.sqlExecuted,
  supabaseTouched: draft.runtimeFlags.supabaseTouched,
  readyForRealWorkerDispatch: draft.runtimeFlags.readyForRealWorkerDispatch,
  generatedLocalFixturePassedClaimed: draft.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: draft.nextPrompt,
}, null, 2))
