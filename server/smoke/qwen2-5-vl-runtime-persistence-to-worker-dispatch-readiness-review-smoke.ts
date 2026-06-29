import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review'
import { QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_runtime_persistence_to_worker_dispatch_readiness_review_accepted_controlled_persisted_dispatch_smoke_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BK-CONTROLLED-PERSISTED-WORKER-DISPATCH-SMOKE-PLAN: plan controlled persisted Qwen worker dispatch smoke, no invocation/no assets/no beta'
const REVIEW_DOC =
  'docs/qwen2-5-vl-7b-runtime-persistence-to-worker-dispatch-readiness-review.md'
const REVIEW_SPEC =
  'src/backend/mock/mock-qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review.ts'
const REVIEW_SMOKE =
  'server/smoke/qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review-smoke.ts'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseCloudTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
  REVIEW_DOC,
  REVIEW_SPEC,
  REVIEW_SMOKE,
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-remote-satisfaction-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md',
  'docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review.ts',
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Superseded duplicate local Qwen active migration must stay removed.',
)
check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be present.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review'],
  'tsx server/smoke/qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review-smoke.ts',
  'package script mismatch',
)

const doc = read(REVIEW_DOC)
for (const phrase of [
  DECISION,
  'controlled persisted worker dispatch smoke',
  'approved snapshot refs, job refs, idempotency refs, lease refs',
  'Current Supabase changelog, row-level security guidance, and storage access-control guidance were checked',
  '| Approved snapshot refs | accepted for controlled smoke planning |',
  '| Job row contract | accepted for controlled smoke planning |',
  '| Worker lease contract | accepted for controlled smoke planning |',
  '| Worker claim contract | accepted for controlled smoke planning |',
  '| Idempotency contract | accepted for controlled smoke planning |',
  '| Backend runtime message contract | accepted for controlled smoke planning |',
  '| Private source-of-truth refs | accepted for controlled smoke planning |',
  '| Signed URL audit | accepted for controlled smoke planning |',
  '| QA and audit evidence | accepted for controlled smoke planning |',
  '| Credit reservation gate | accepted for controlled smoke planning |',
  '`runtimePersistenceToWorkerDispatchReadinessReviewRecorded=true`',
  '`persistedWorkerDispatchReadinessReviewRequired=false`',
  '`persistedWorkerDispatchReadinessAcceptedForControlledSmokePlanning=true`',
  '`controlledPersistedWorkerDispatchSmokePlanRequired=true`',
  '`readyForRealWorkerDispatch=false`',
  '`realJobCreated=false`',
  '`realLeaseClaimed=false`',
  '`idempotencyRowCreated=false`',
  '`jobEventCreated=false`',
  '`backendRuntimeMessageCreated=false`',
  '`workerClaimCreated=false`',
  '`storageObjectRecordCreated=false`',
  '`signedUrlEventCreated=false`',
  '`creditMutationCreated=false`',
  '`cloudRunInvocationAttempted=false`',
  '`workersDispatched=false`',
  '`supabaseCloudTouched=false`',
  '`sqlExecuted=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [REVIEW_DOC, REVIEW_SPEC]) {
  assertNoForbiddenText(file)
}

const review = QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(
  review.upstreamRemoteSatisfactionReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW.decision,
)
assert.equal(
  review.upstreamControlledBackendDispatchDryRunDecision,
  QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT.decision,
)
assert.equal(
  review.upstreamBackendRuntimePersistencePlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN.decision,
)
assert.equal(
  review.upstreamBackendRuntimePersistenceSchemaDraftReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW.decision,
)
assert.equal(review.readinessEvidence.noDeployMigrationSatisfactionAccepted, true)
assert.equal(review.readinessEvidence.remoteQwenMigrationVersion, '20260628000100')
assert.equal(review.readinessEvidence.activeMigrationLocalValidationPassed, true)
assert.equal(review.readinessEvidence.qwenLocalSqlTestsPassed, true)
assert.equal(review.readinessEvidence.reusesExistingRuntimeSurfaces, true)
assert.equal(review.readinessEvidence.parallelQwenQueueSchemaRejected, true)
assert.equal(review.readinessEvidence.controlledDispatchDryRunOutcomesCovered.length, 8)
assert.equal(review.dispatchReadinessAreas.length, 11)
assert.deepEqual(
  review.dispatchReadinessAreas.map((area) => area.status),
  Array.from({ length: 11 }, () => 'accepted_for_controlled_smoke_planning'),
)
assert.ok(review.blockedBypasses.includes('raw_chat_worker_input'))
assert.ok(review.blockedBypasses.includes('signed_url_source_of_truth'))
assert.ok(review.blockedBypasses.includes('duplicate_active_worker_claims'))
assert.equal(review.runtimeFlags.runtimePersistenceToWorkerDispatchReadinessReviewRecorded, true)
assert.equal(review.runtimeFlags.persistedWorkerDispatchReadinessReviewRequired, false)
assert.equal(review.runtimeFlags.persistedWorkerDispatchReadinessAcceptedForControlledSmokePlanning, true)
assert.equal(review.runtimeFlags.controlledPersistedWorkerDispatchSmokePlanRequired, true)
assertFalseRuntimeFlags(review.runtimeFlags)
assert.equal(review.nextPrompt, NEXT_PROMPT)
assert.deepEqual(scanValues(review), [], 'Review spec must not contain forbidden runtime values')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: review.decision,
      dispatchReadinessAreaCount: review.dispatchReadinessAreas.length,
      noDeployMigrationSatisfactionAccepted:
        review.readinessEvidence.noDeployMigrationSatisfactionAccepted,
      persistedWorkerDispatchReadinessReviewRequired:
        review.runtimeFlags.persistedWorkerDispatchReadinessReviewRequired,
      controlledPersistedWorkerDispatchSmokePlanRequired:
        review.runtimeFlags.controlledPersistedWorkerDispatchSmokePlanRequired,
      readyForRealWorkerDispatch: review.runtimeFlags.readyForRealWorkerDispatch,
      workersDispatched: review.runtimeFlags.workersDispatched,
      generatedLocalFixturePassedClaimed: review.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: review.nextPrompt,
    },
    null,
    2,
  ),
)
