import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result'
import { QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR } from '../../src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator'
import { runQwen25VlFailClosedBackendRuntimeDispatchCoordinator } from '../../src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_backend_dispatch_dry_run_reviewed_persistence_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58M-BACKEND-RUNTIME-PERSISTENCE-PLAN: plan Qwen queue lease idempotency persistence, no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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
    'realJobCreated',
    'realLeaseClaimed',
    'idempotencyRowCreated',
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

function fixtureWithMutation(mutate: (fixture: JsonRecord) => void): JsonRecord {
  const fixture = clone(
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
  ) as JsonRecord
  mutate(fixture)
  return fixture
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md',
  'docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator.ts',
  'server/smoke/qwen2-5-vl-controlled-backend-dispatch-dry-run-smoke.ts',
  'server/smoke/qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-backend-dispatch-dry-run'],
  'tsx server/smoke/qwen2-5-vl-controlled-backend-dispatch-dry-run-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md')
for (const phrase of [
  DECISION,
  'blocked_invalid_worker_job_schema',
  'blocked_missing_approved_snapshot',
  'blocked_missing_credit_reservation',
  'blocked_missing_source_of_truth_refs',
  'blocked_idempotency_conflict',
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_preview_only',
  '`controlledBackendDispatchDryRunReviewed=true`',
  '`allCoordinatorOutcomesCovered=true`',
  '`backendRuntimePersistencePlanRequired=true`',
  '`readyForRealWorkerDispatch=false`',
  '`privateInvokeReady=false`',
  '`realJobCreated=false`',
  '`realLeaseClaimed=false`',
  '`cloudRunInvocationAttempted=false`',
  '`identityTokenFetched=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const outcomes = {
  invalidSchema: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    queueFixture: fixtureWithMutation((fixture) => {
      delete fixture.workspaceId
    }),
  }),
  missingSnapshot: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    queueFixture: fixtureWithMutation((fixture) => {
      delete fixture.approvedPlanSnapshotId
      delete asRecord(fixture.payloadJson).approvedPlanSnapshotId
    }),
  }),
  missingCredit: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    queueFixture: fixtureWithMutation((fixture) => {
      delete fixture.creditReservationId
      delete asRecord(fixture.payloadJson).creditReservationId
    }),
  }),
  missingSource: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    queueFixture: fixtureWithMutation((fixture) => {
      asRecord(asRecord(fixture.payloadJson).sourceOfTruthRefs).privateManifestRefs = []
    }),
  }),
  idempotencyConflict: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    forceIdempotencyConflict: true,
  }),
  realLeaseRequired: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator(),
  adapterFailClosed: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    continueAfterLeaseBackendRequirementForPreview: true,
  }),
  transportPreviewOnly: runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    continueAfterLeaseBackendRequirementForPreview: true,
    continueAfterDispatchAdapterForPreview: true,
  }),
}

assert.equal(outcomes.invalidSchema.status, 'blocked_invalid_worker_job_schema')
assert.equal(outcomes.missingSnapshot.status, 'blocked_missing_approved_snapshot')
assert.equal(outcomes.missingCredit.status, 'blocked_missing_credit_reservation')
assert.equal(outcomes.missingSource.status, 'blocked_missing_source_of_truth_refs')
assert.equal(outcomes.idempotencyConflict.status, 'blocked_idempotency_conflict')
assert.equal(outcomes.realLeaseRequired.status, 'blocked_real_lease_backend_required')
assert.equal(outcomes.adapterFailClosed.status, 'blocked_qwen_dispatch_adapter_fail_closed')
assert.equal(outcomes.transportPreviewOnly.status, 'blocked_private_invoke_transport_preview_only')

for (const [label, result] of Object.entries(outcomes)) {
  assert.equal(result.ok, false, `${label} must stay blocked`)
  assertFalseRuntimeSideEffects(result.runtimeFlags)
}

const result = QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamFailClosedBackendRuntimeDispatchCoordinatorDecision,
  QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR.decision,
)
assert.equal(result.dryRunReview.controlledBackendDispatchDryRunReviewed, true)
assert.equal(result.dryRunReview.allCoordinatorOutcomesCovered, true)
assert.equal(result.dryRunReview.noRuntimeSideEffectsObserved, true)
assert.equal(result.dryRunReview.backendRuntimePersistencePlanRequired, true)
assert.equal(result.dryRunReview.readyForRealWorkerDispatch, false)
assert.equal(result.dryRunReview.privateInvokeReady, false)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assertFalseRuntimeSideEffects(result.runtimeFlags)

for (const outcome of Object.values(outcomes).map((item) => item.status)) {
  assert.ok(result.reviewedCoordinatorOutcomes.includes(outcome as never), `missing reviewed outcome ${outcome}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result, outcomes })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen controlled backend dispatch dry-run data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  reviewedOutcomeCount: result.reviewedCoordinatorOutcomes.length,
  controlledBackendDispatchDryRunReviewed:
    result.runtimeFlags.controlledBackendDispatchDryRunReviewed,
  backendRuntimePersistencePlanRequired:
    result.runtimeFlags.backendRuntimePersistencePlanRequired,
  readyForRealWorkerDispatch: result.runtimeFlags.readyForRealWorkerDispatch,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  workersDispatched: result.runtimeFlags.workersDispatched,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  nextPrompt: result.nextPrompt,
}, null, 2))
