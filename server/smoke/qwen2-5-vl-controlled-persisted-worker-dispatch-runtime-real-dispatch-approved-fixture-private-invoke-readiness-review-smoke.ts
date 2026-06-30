import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_readiness_review_accepted_approved_fixture_private_invoke_execution_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DG-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-EXECUTION-PLAN: plan one bounded approved-fixture private invoke through the persisted job and lease bridge, no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInvokeAcceptedForPersistedDispatch|approvedFixturePrivateInvokeExecutionPlanAccepted|qwenInferenceAcceptedNow|generatedAssetCreationAccepted|supabasePersistenceAccepted|creditSpendAccepted|reviewRanCloudRunInvocation|reviewRanPrivateServiceRequest|reviewFetchedIdentityToken|reviewCreatedAuthHeader|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'approvedFixturePrivateInvokeAcceptedForPersistedDispatch',
    'approvedFixturePrivateInvokeExecutionPlanAccepted',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review-smoke.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.md',
)
for (const phrase of [
  DECISION,
  'persisted job and lease bridge result review accepted: true',
  'approved snapshot and fixture scope readiness accepted: true',
  'persisted job, lease, idempotency, event, message, and worker-claim readiness accepted: true',
  'private source-of-truth reference readiness accepted: true',
  'private invoke envelope and transport-readiness boundaries accepted: true',
  'runtime value resolution remains backend/runtime-only: true',
  'service URL, audience, identity token, and auth header values remain unprinted and unstored: true',
  'Qwen runtime inference boundary readiness accepted for planning only: true',
  'structured output schema evidence accepted: true',
  'QA/audit/cost/credit no-spend boundary accepted: true',
  'cleanup, rollback, retry, beta, and production locks accepted: true',
  'NVIDIA L4 accepted: true',
  'scale-to-zero cost posture accepted: true',
  'minimum instances zero accepted: true',
  'initial max instances one accepted: true',
  'CPU fallback disabled accepted: true',
  'execution plan now required: true',
  'real execution remains blocked: true',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRequired=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded=false`',
  '`readyForApprovedFixturePrivateInvokeExecutionPlanning=true`',
  '`readyForRealWorkerDispatch=false`',
  '`privateInvokeReady=false`',
  '`approvedFixturePrivateInvokeExecutionPlanAccepted=false`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.ts',
]) {
  assertNoForbiddenText(file)
}

const review =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_READINESS_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(review.nextPrompt, NEXT_PROMPT)
assert.equal(
  review.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_RESULT_REVIEW.decision,
)
assert.equal(
  review.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL.decision,
)
assert.equal(
  review.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT.decision,
)
assert.equal(review.readinessReview.persistedJobLeaseBridgeResultReviewAccepted, true)
assert.equal(review.readinessReview.approvedFixturePrivateInvokeReadinessReviewRequired, false)
assert.equal(review.readinessReview.approvedFixturePrivateInvokeReadinessReviewRecorded, true)
assert.equal(review.readinessReview.approvedFixturePrivateInvokeReadinessReviewAccepted, true)
assert.equal(review.readinessReview.approvedFixturePrivateInvokeExecutionPlanRequired, true)
assert.equal(review.readinessReview.readyForRuntimeExecutionNow, false)
assert.equal(review.acceptedReadinessEvidence.bridgeResultReviewAccepted, true)
assert.equal(review.acceptedReadinessEvidence.bridgeImplementationAccepted, true)
assert.equal(review.acceptedReadinessEvidence.approvedQueueFixtureAccepted, true)
assert.equal(review.acceptedReadinessEvidence.defaultBridgeStatusAccepted, true)
assert.equal(review.acceptedReadinessEvidence.idempotencyConflictStatusAccepted, true)
assert.equal(review.acceptedReadinessEvidence.persistedJobReferenceAccepted, true)
assert.equal(review.acceptedReadinessEvidence.persistedLeaseReferenceAccepted, true)
assert.equal(review.acceptedReadinessEvidence.privateSourceOfTruthRefsAccepted, true)
assert.equal(review.acceptedReadinessEvidence.privateInvokeEnvelopeAccepted, true)
assert.equal(review.acceptedReadinessEvidence.privateInvokeTransportPreviewAccepted, true)
assert.equal(review.acceptedReadinessEvidence.qaAuditCostCreditBoundaryAccepted, true)
assert.equal(review.acceptedReadinessEvidence.attemptApprovalRecorded, true)
assert.equal(review.acceptedReadinessEvidence.attemptResultBlockedBeforeRuntimeExecution, true)
assert.equal(review.acceptedReadinessEvidence.cpuCallerInferencePathNotReused, true)
assert.equal(review.acceptedReadinessEvidence.structuredOutputSchemaEvidenceAccepted, true)
assert.equal(review.acceptedReadinessEvidence.realSideEffectsRemainBlocked, true)
assert.equal(review.acceptedReadinessAreas.length, 9)
assert.deepEqual(
  review.acceptedReadinessAreas.map((area) => area.acceptedForExecutionPlanning),
  Array.from({ length: 9 }, () => true),
)
assert.equal(
  review.remainingBlockers
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRequired,
  true,
)
assert.equal(review.remainingBlockers.readyForRealWorkerDispatch, false)
assert.equal(review.remainingBlockers.privateInvokeReady, false)
assert.equal(review.remainingBlockers.qwenInferenceAcceptedNow, false)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewRequired,
  false,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewRecorded,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewAccepted,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRequired,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded,
  false,
)
assert.equal(review.runtimeFlags.readyForApprovedFixturePrivateInvokeExecutionPlanning, true)
assert.equal(review.runtimeFlags.persistedJobLeaseBridgeResultReviewAccepted, true)
assert.equal(review.runtimeFlags.approvedSnapshotAndFixtureScopeReadinessAccepted, true)
assert.equal(review.runtimeFlags.persistedWorkerDispatchRefsReadinessAccepted, true)
assert.equal(review.runtimeFlags.privateSourceOfTruthRefsReadinessAccepted, true)
assert.equal(review.runtimeFlags.privateInvokeTransportReadinessAccepted, true)
assert.equal(review.runtimeFlags.runtimeCredentialValueHandlingReadinessAccepted, true)
assert.equal(review.runtimeFlags.qwenRuntimeInferenceBoundaryReadinessAccepted, true)
assert.equal(review.runtimeFlags.responseSchemaAndResultHandlingReadinessAccepted, true)
assert.equal(review.runtimeFlags.qaAuditCostAndCreditNoSpendReadinessAccepted, true)
assert.equal(review.runtimeFlags.cleanupRetryAndBetaLockReadinessAccepted, true)
assert.equal(review.runtimeFlags.selectedGpuL4Accepted, true)
assert.equal(review.runtimeFlags.scaleToZeroCostPostureAccepted, true)
assert.equal(review.runtimeFlags.minInstancesZeroAccepted, true)
assert.equal(review.runtimeFlags.initialMaxInstancesOneAccepted, true)
assert.equal(review.runtimeFlags.cpuFallbackDisabledAccepted, true)
assert.equal(review.runtimeFlags.structuredFixtureOutputSchemaValid, true)
assert.equal(review.runtimeFlags.structuredFixtureOutputParsedJson, true)
assert.equal(review.runtimeFlags.structuredFixtureOutputObjectCount, 3)
assert.equal(review.runtimeFlags.structuredFixtureOutputTextLikeRegionCount, 1)
assert.equal(review.runtimeFlags.structuredFixtureOutputRawOutputStoredInRepo, false)
assertFalseRuntimeFlags(review.runtimeFlags as unknown as JsonRecord)
assert.equal(review.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(review.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(review.sourceOfTruthRules.rawWorkerPromptAllowed, false)

const forbiddenDataFindings = scanValues(review)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in approved fixture private invoke readiness review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  readinessReviewAccepted:
    review.readinessReview.approvedFixturePrivateInvokeReadinessReviewAccepted,
  executionPlanRequired:
    review.readinessReview.approvedFixturePrivateInvokeExecutionPlanRequired,
  nextPrompt: review.nextPrompt,
}, null, 2))
