import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review'
import { QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan'
import { QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR } from '../../src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator'
import { QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_plan_recorded_smoke_execution_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BL-CONTROLLED-PERSISTED-WORKER-DISPATCH-SMOKE-EXECUTION: run controlled persisted Qwen worker dispatch smoke, no Cloud Run invocation/no inference/no assets/no beta'
const PLAN_DOC =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-plan.md'
const PLAN_SPEC =
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan.ts'
const PLAN_SMOKE =
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan-smoke.ts'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  [
    'signed URL token',
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i,
  ],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  [
    'unsafe runtime true claim',
    /\b(controlledPersistedWorkerDispatchSmokeExecuted|readyForRealWorkerDispatch|privateInvokeReady|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseCloudTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
  ],
  [
    'unsafe pass claim',
    /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i,
  ],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  [
    'signed URL token',
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i,
  ],
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

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'controlledPersistedWorkerDispatchSmokeExecuted',
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
    'creditMutationCreated',
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
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  PLAN_DOC,
  PLAN_SPEC,
  PLAN_SMOKE,
  'docs/qwen2-5-vl-7b-runtime-persistence-to-worker-dispatch-readiness-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-remote-satisfaction-review.md',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan-smoke.ts',
  'package script mismatch',
)

const doc = read(PLAN_DOC)
for (const phrase of [
  DECISION,
  'controlled persisted Qwen worker dispatch smoke',
  'approved snapshots, credit reservations, private source-of-truth references, idempotency, jobs, job events, worker runtime configs, worker leases, worker claims',
  '| Area | Planned assertion | Required future evidence | Still blocked |',
  '| Approved snapshot | Require immutable approved snapshot id, checksum, plan version, and source intent refs. |',
  '| Credit reservation | Require credit reservation reference before dispatch shape is accepted. |',
  '| Private source of truth | Require private storage path reference, manifest reference, checksum, and approved snapshot. |',
  '| Idempotency | Require workspace/job/snapshot/request hash scope and deterministic conflict handling. |',
  '| Worker lease | Require one-active-lease semantics, stale recovery boundary, and cleanup expectation. |',
  '| Signed URL audit | Require signed URL audit-only semantics and source-of-truth rejection. |',
  '`controlledPersistedWorkerDispatchSmokePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchSmokeExecutionRequired=true`',
  '`controlledPersistedWorkerDispatchSmokeExecuted=false`',
  '`readyForRealWorkerDispatch=false`',
  '`cloudRunInvocationAttempted=false`',
  '`workersDispatched=false`',
  '`sqlExecuted=false`',
  '`generatedAssetsCreated=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [PLAN_DOC, PLAN_SPEC]) {
  assertNoForbiddenText(file)
}

const plan = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamRuntimePersistenceToWorkerDispatchReadinessReviewDecision,
  QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW.decision,
)
assert.equal(
  plan.upstreamRemoteSatisfactionReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW.decision,
)
assert.equal(
  plan.upstreamControlledBackendDispatchDryRunDecision,
  QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT.decision,
)
assert.equal(
  plan.upstreamFailClosedBackendRuntimeDispatchCoordinatorDecision,
  QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR.decision,
)

assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchSmokePlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchSmokeExecutionRequired, true)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

const handoffIds = plan.persistedHandoffExpectations.map((expectation) => expectation.id)
assert.deepEqual(handoffIds, [
  'approved_snapshot_refs',
  'credit_reservation_refs',
  'private_source_of_truth_refs',
  'api_idempotency_keys',
  'jobs',
  'job_events',
  'worker_runtime_configs',
  'worker_leases',
  'worker_job_claims',
  'backend_runtime_messages',
  'signed_url_events',
  'qa_audit_cost_credit',
  'failure_cleanup',
])
assert.ok(
  plan.persistedHandoffExpectations.every(
    (expectation) => expectation.status === 'planned_for_future_controlled_smoke_execution',
  ),
)
const requiredBlockedBypasses = [
  'raw_chat_worker_input',
  'raw_prompt_payload_fields',
  'signed_url_source_of_truth',
  'direct_cloud_run_service_url_exposure',
  'token_or_bearer_header_persistence',
  'service_role_key_value_persistence',
  'missing_credit_reservation',
  'missing_approved_snapshot',
  'missing_private_storage_checksum_manifest',
  'beta_or_production_readiness_claim',
] as const
for (const required of requiredBlockedBypasses) {
  assert.ok(plan.blockedBypasses.includes(required), `Missing bypass: ${required}`)
}

const forbiddenDataFindings = scanValues(plan)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted dispatch smoke plan: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  handoffExpectationCount: plan.persistedHandoffExpectations.length,
  controlledPersistedWorkerDispatchSmokeExecutionRequired:
    plan.runtimeFlags.controlledPersistedWorkerDispatchSmokeExecutionRequired,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
