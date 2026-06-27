import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_schema_draft_review_recorded_migration_draft_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58O-BACKEND-RUNTIME-PERSISTENCE-MIGRATION-DRAFT: draft Qwen runtime persistence constraints and local SQL tests, no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
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
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|workerClaimCreated|jobEventCreated|backendRuntimeMessageCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|activeMigrationCreated|draftSqlCreated|localSqlTestsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(privateInvokeReady|betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['concrete URL', /https?:\/\//i],
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
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseRuntimeSideEffects(flags: JsonRecord) {
  for (const key of [
    'draftSqlCreated',
    'localSqlTestsCreated',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan.ts',
  'supabase/migration-order.md',
  'supabase/migrations/202605130005_job_orchestration_agent_runs.sql',
  'supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql',
  'supabase/migrations/202605200002_worker_leases_runtime_transport.sql',
  'supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql',
  'database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql',
  'database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql',
  'database/test-sql/007_production_worker_runtime_orchestration_tests.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/999_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist in this review step.',
)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-schema-draft-review'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-schema-draft-review-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md')
for (const phrase of [
  DECISION,
  'Qwen should not create a parallel runtime queue.',
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
  '`qa_reports`',
  '`audit_events`',
  '`production_worker_jobs` draft family',
  '`worker_type` is `qwen2_5_vl_cloud_run_gpu_worker`',
  '`job_type` is `media_analysis`',
  '`Qwen/Qwen2.5-VL-7B-Instruct`',
  '`cc594898137f460bfe9f0759e9844b3ce807cfb5`',
  '`nvidia_l4`',
  '`bounded_preview_scale_to_zero`',
  '`backendRuntimePersistenceSchemaDraftReviewRecorded=true`',
  '`backendRuntimePersistenceSchemaDraftRequired=false`',
  '`backendRuntimePersistenceMigrationDraftRequired=true`',
  '`draftSqlCreated=false`',
  '`activeMigrationCreated=false`',
  '`sqlExecuted=false`',
  '`supabaseTouched=false`',
  '`realJobCreated=false`',
  '`readyForRealWorkerDispatch=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const review = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(
  review.upstreamBackendRuntimePersistencePlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN.decision,
)
assert.equal(review.schemaReview.mustReuseExistingRuntimeSurfaces, true)
assert.equal(review.schemaReview.mustNotCreateParallelQueueSchema, true)
assert.equal(review.schemaReview.activeMigrationCreated, false)
assert.equal(review.schemaReview.draftSqlCreated, false)
assert.equal(review.schemaReview.localSqlTestsCreated, false)
assert.equal(review.schemaReview.migrationDraftRequired, true)
assert.equal(review.readinessDecision.backendRuntimePersistenceSchemaDraftReviewRecorded, true)
assert.equal(review.readinessDecision.backendRuntimePersistenceSchemaDraftRequired, false)
assert.equal(review.readinessDecision.backendRuntimePersistenceMigrationDraftRequired, true)
assert.equal(review.readinessDecision.readyForRealWorkerDispatch, false)
assert.equal(review.nextPrompt, NEXT_PROMPT)

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
  'qa_reports',
  'audit_events',
  'production_worker_jobs_draft_family',
]) {
  assert.ok(review.reviewedSurfaces.some((item) => item.id === surface), `Missing surface ${surface}`)
}

for (const expectedRejectedMarker of [
  'raw_chat_worker_input',
  'raw_prompt_payload_fields',
  'raw_model_output_text',
  'public_url_source_of_truth',
  'signed_url_source_of_truth',
  'service_url_value',
  'bearer_header_value',
  'identity_token_value',
  'provider_secret_value',
  'service_role_key_value',
  'database_url_value',
  'generated_asset_claim',
  'beta_ready_claim',
  'production_ready_claim',
]) {
  assert.ok(
    review.qwenConstraintDraftRequirements.rejectedPayloadMarkers.includes(expectedRejectedMarker as never),
    `Missing rejected payload marker ${expectedRejectedMarker}`,
  )
}

for (const expectedTest of [
  'required_reuse_surfaces_exist',
  'qwen_worker_type_and_job_type_constraints_present',
  'unsafe_json_payload_markers_rejected',
  'signed_urls_never_source_of_truth',
  'public_urls_never_source_of_truth',
  'one_active_claim_per_job',
  'one_active_lease_per_job',
  'idempotency_conflict_deterministic',
  'rls_enabled_on_public_runtime_surfaces',
  'service_role_backend_write_boundary_preserved',
  'no_qwen_seed_rows_required_for_execution',
]) {
  assert.ok(
    review.futureDraftTestExpectations.includes(expectedTest as never),
    `Missing future draft test expectation ${expectedTest}`,
  )
}

assert.equal(review.qwenConstraintDraftRequirements.workerType, 'qwen2_5_vl_cloud_run_gpu_worker')
assert.equal(review.qwenConstraintDraftRequirements.jobType, 'media_analysis')
assert.equal(review.qwenConstraintDraftRequirements.selectedGpu, 'nvidia_l4')
assert.equal(review.qwenConstraintDraftRequirements.servingProfile, 'bounded_preview_scale_to_zero')
assertFalseRuntimeSideEffects(review.runtimeFlags)
assert.equal(review.runtimeFlags.backendRuntimePersistencePlanRecorded, true)
assert.equal(review.runtimeFlags.backendRuntimePersistenceSchemaDraftReviewRecorded, true)
assert.equal(review.runtimeFlags.backendRuntimePersistenceMigrationDraftRequired, true)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  review,
  persistencePlan: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen schema review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  reviewedSurfaceCount: review.reviewedSurfaces.length,
  migrationDraftRequired: review.schemaReview.migrationDraftRequired,
  activeMigrationCreated: review.schemaReview.activeMigrationCreated,
  sqlExecuted: review.runtimeFlags.sqlExecuted,
  supabaseTouched: review.runtimeFlags.supabaseTouched,
  readyForRealWorkerDispatch: review.runtimeFlags.readyForRealWorkerDispatch,
  generatedLocalFixturePassedClaimed: review.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: review.nextPrompt,
}, null, 2))
