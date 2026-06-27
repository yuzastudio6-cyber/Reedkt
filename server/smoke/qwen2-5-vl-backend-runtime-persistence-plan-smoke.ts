import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan'
import { QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_plan_recorded_schema_draft_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58N-BACKEND-RUNTIME-PERSISTENCE-SCHEMA-DRAFT: draft Qwen queue lease idempotency persistence schema review, no deploy/no cloud/no assets/no beta'

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
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(privateInvokeReady|betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseRuntimeSideEffects(flags: JsonRecord) {
  for (const key of [
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md',
  'docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
  'supabase/migration-order.md',
  'supabase/migrations/202605130005_job_orchestration_agent_runs.sql',
  'supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql',
  'supabase/migrations/202605200002_worker_leases_runtime_transport.sql',
  'supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql',
  'database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql',
  'database/test-sql/007_production_worker_runtime_orchestration_tests.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-plan'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md')
for (const phrase of [
  DECISION,
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
  'Workers execute `approved_plan_snapshots`, not raw chat',
  'Signed URLs and public URLs are not source of truth.',
  '`worker_type=qwen2_5_vl_cloud_run_gpu_worker`',
  '`job_type=media_analysis`',
  '`nvidia_l4`',
  '`backendRuntimePersistencePlanRecorded=true`',
  '`backendRuntimePersistenceSchemaDraftRequired=true`',
  '`backendRuntimePersistencePlanRequired=false`',
  '`realJobCreated=false`',
  '`realLeaseClaimed=false`',
  '`idempotencyRowCreated=false`',
  '`jobEventCreated=false`',
  '`backendRuntimeMessageCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const plan = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(
  plan.upstreamControlledBackendDispatchDryRunDecision,
  QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT.decision,
)
assert.equal(plan.persistenceStrategy.mustNotCreateParallelQueueSchema, true)
assert.equal(plan.persistenceStrategy.schemaDraftRequired, true)
assert.equal(plan.readinessDecision.backendRuntimePersistencePlanRecorded, true)
assert.equal(plan.readinessDecision.backendRuntimePersistenceSchemaDraftRequired, true)
assert.equal(plan.readinessDecision.backendRuntimePersistencePlanRequired, false)
assert.equal(plan.readinessDecision.readyForRealWorkerDispatch, false)
assert.equal(plan.nextPrompt, NEXT_PROMPT)

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
]) {
  assert.ok(plan.persistenceSurfaces.some((item) => item.id === surface), `Missing surface ${surface}`)
}

for (const invariant of [
  'workers_execute_approved_snapshots_not_raw_chat',
  'credit_reservation_verified_before_dispatch',
  'private_source_of_truth_refs_verified',
  'signed_urls_never_source_of_truth',
  'public_urls_never_source_of_truth',
  'raw_prompt_fields_rejected',
  'one_active_claim_per_job',
  'idempotency_conflict_checked_before_dispatch',
  'runtime_messages_do_not_store_secrets_or_bearer_tokens',
]) {
  assert.ok(plan.requiredInvariants.includes(invariant as never), `Missing invariant ${invariant}`)
}

assert.deepEqual(plan.futureTransactionOrder.slice(0, 4), [
  'load_approved_plan_snapshot_and_verify_hash',
  'verify_credit_reservation',
  'verify_private_storage_records_and_checksums',
  'check_api_idempotency_key',
])
assert.equal(plan.qwenSpecificPersistenceFields.workerType, 'qwen2_5_vl_cloud_run_gpu_worker')
assert.equal(plan.qwenSpecificPersistenceFields.jobType, 'media_analysis')
assert.equal(plan.qwenSpecificPersistenceFields.selectedGpu, 'nvidia_l4')
assert.equal(plan.qwenSpecificPersistenceFields.rawModelOutputPersisted, false)
assert.equal(plan.qwenSpecificPersistenceFields.publicOutputAllowed, false)
assert.ok(plan.blockedBypasses.includes('raw_chat_worker_input'))
assert.ok(plan.blockedBypasses.includes('signed_url_source_of_truth'))
assertFalseRuntimeSideEffects(plan.runtimeFlags)
assert.equal(plan.runtimeFlags.backendRuntimePersistencePlanRecorded, true)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceSchemaDraftRequired, true)
assert.equal(plan.runtimeFlags.backendRuntimePersistencePlanRequired, false)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen backend runtime persistence plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  persistenceSurfaceCount: plan.persistenceSurfaces.length,
  invariantCount: plan.requiredInvariants.length,
  backendRuntimePersistencePlanRecorded:
    plan.runtimeFlags.backendRuntimePersistencePlanRecorded,
  backendRuntimePersistenceSchemaDraftRequired:
    plan.runtimeFlags.backendRuntimePersistenceSchemaDraftRequired,
  realJobCreated: plan.runtimeFlags.realJobCreated,
  realLeaseClaimed: plan.runtimeFlags.realLeaseClaimed,
  supabaseTouched: plan.runtimeFlags.supabaseTouched,
  sqlExecuted: plan.runtimeFlags.sqlExecuted,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
