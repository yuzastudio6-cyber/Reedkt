import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_IMPLEMENTATION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_result_review_accepted_approved_fixture_private_invoke_readiness_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DF-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-READINESS-REVIEW: review readiness for one approved-fixture private invoke through the persisted job and lease bridge, no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInvokeAcceptedForPersistedDispatch|qwenInferenceAcceptedNow|generatedAssetCreationAccepted|supabasePersistenceAccepted|creditSpendAccepted|reviewRanCloudRunInvocation|reviewRanPrivateServiceRequest|reviewFetchedIdentityToken|reviewCreatedAuthHeader|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRequired',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'approvedFixturePrivateInvokeAcceptedForPersistedDispatch',
    'qwenInferenceAcceptedNow',
    'generatedAssetCreationAccepted',
    'supabasePersistenceAccepted',
    'creditSpendAccepted',
    'reviewRanCloudRunInvocation',
    'reviewRanPrivateServiceRequest',
    'reviewFetchedIdentityToken',
    'reviewCreatedAuthHeader',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation-smoke.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md',
)
for (const phrase of [
  DECISION,
  'bridge implementation accepted: true',
  'bridge plan recorded: true',
  'bridge result review accepted: true',
  'approved queue fixture accepted: true',
  'default bridge status accepted: `blocked_private_invoke_transport_preview_only`',
  'idempotency conflict status accepted: `blocked_idempotency_conflict`',
  'required runtime statuses accepted: true',
  'persisted job reference accepted: true',
  'persisted lease reference accepted: true',
  'sanitized job event reference accepted: true',
  'backend runtime message reference accepted: true',
  'worker claim reference accepted: true',
  'private source-of-truth refs accepted: true',
  'private invoke envelope accepted: true',
  'private invoke transport preview accepted: true',
  'QA/audit/cost/credit boundary accepted: true',
  'NVIDIA L4 accepted: true',
  'scale-to-zero cost posture accepted: true',
  'minimum instances zero accepted: true',
  'initial max instances one accepted: true',
  'CPU fallback disabled accepted: true',
  'mock records stored in memory only accepted: true',
  'real side effects remain blocked: true',
  'runtime execution remains blocked: true',
  'storage, public artifacts, credits, beta, and production remain blocked: true',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewRequired=true`',
  '`readyForRealWorkerDispatch=false`',
  '`privateInvokeReady=false`',
  '`reviewRanCloudRunInvocation=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`vllmEngineInitialized=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.ts',
]) {
  assertNoForbiddenText(file)
}

const review =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_RESULT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(review.nextPrompt, NEXT_PROMPT)
assert.equal(
  review.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_IMPLEMENTATION.decision,
)
assert.equal(review.acceptedEvidence.bridgeImplementationAccepted, true)
assert.equal(review.acceptedEvidence.bridgePlanRecorded, true)
assert.equal(review.acceptedEvidence.bridgeResultReviewAccepted, true)
assert.equal(review.acceptedEvidence.approvedQueueFixtureAccepted, true)
assert.equal(review.acceptedEvidence.defaultBridgeStatusAccepted, true)
assert.equal(review.acceptedEvidence.idempotencyConflictStatusAccepted, true)
assert.equal(review.acceptedEvidence.requiredRuntimeStatusesAccepted, true)
assert.equal(review.acceptedEvidence.persistedJobReferenceAccepted, true)
assert.equal(review.acceptedEvidence.persistedLeaseReferenceAccepted, true)
assert.equal(review.acceptedEvidence.sanitizedJobEventReferenceAccepted, true)
assert.equal(review.acceptedEvidence.backendRuntimeMessageReferenceAccepted, true)
assert.equal(review.acceptedEvidence.workerClaimReferenceAccepted, true)
assert.equal(review.acceptedEvidence.privateSourceOfTruthRefsAccepted, true)
assert.equal(review.acceptedEvidence.privateInvokeEnvelopeAccepted, true)
assert.equal(review.acceptedEvidence.privateInvokeTransportPreviewAccepted, true)
assert.equal(review.acceptedEvidence.qaAuditCostCreditBoundaryAccepted, true)
assert.equal(review.acceptedEvidence.selectedGpuL4Accepted, true)
assert.equal(review.acceptedEvidence.scaleToZeroCostPostureAccepted, true)
assert.equal(review.acceptedEvidence.minInstancesZeroAccepted, true)
assert.equal(review.acceptedEvidence.initialMaxInstancesOneAccepted, true)
assert.equal(review.acceptedEvidence.cpuFallbackDisabledAccepted, true)
assert.equal(review.acceptedEvidence.mockRecordsStoredInMemoryOnlyAccepted, true)
assert.equal(review.acceptedEvidence.realSideEffectsRemainBlocked, true)
assert.equal(review.acceptedEvidence.runtimeExecutionRemainBlocked, true)
assert.equal(review.acceptedEvidence.storagePublicCreditBetaProductionRemainBlocked, true)
assert.equal(
  review.remainingBlockers
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewRequired,
  true,
)
assert.equal(review.remainingBlockers.readyForRealWorkerDispatch, false)
assert.equal(review.remainingBlockers.privateInvokeReady, false)
assert.equal(review.remainingBlockers.qwenInferenceAcceptedNow, false)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRecorded,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewAccepted,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewRequired,
  true,
)
assert.equal(review.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePassedFailClosed, true)
assert.equal(review.runtimeFlags.defaultBridgeStatusAccepted, true)
assert.equal(review.runtimeFlags.idempotencyConflictStatusAccepted, true)
assert.equal(review.runtimeFlags.requiredRuntimeStatusesAccepted, true)
assertFalseRuntimeFlags(review.runtimeFlags as unknown as JsonRecord)
assert.equal(review.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(review.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(review.sourceOfTruthRules.rawWorkerPromptAllowed, false)

const forbiddenDataFindings = scanValues(review)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in persisted job lease bridge result review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  bridgeResultReviewAccepted: review.acceptedEvidence.bridgeResultReviewAccepted,
  nextPrompt: review.nextPrompt,
}, null, 2))
