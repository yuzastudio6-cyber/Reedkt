import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_GATE } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_attempt_approval_accepted_attempt_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DU-PRIVATE-INFERENCE-RETRY-ATTEMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation'

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
    /\b(retryAttemptRunNow|readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInferenceRetryAttemptExecuted|approvedFixturePrivateInferenceAcceptedForPersistedDispatch|approvedFixturePrivateInferenceApprovedNow|qwenInferenceAcceptedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|cloudRunJobExecuted|serviceRuntimeRequestSent|serviceTargetResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'retryAttemptRunNow',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'approvedFixturePrivateInferenceRetryAttemptExecuted',
    'approvedFixturePrivateInferenceAcceptedForPersistedDispatch',
    'approvedFixturePrivateInferenceApprovedNow',
    'qwenInferenceAcceptedNow',
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
    'cloudRunJobExecuted',
    'serviceRuntimeRequestSent',
    'serviceTargetResolvedNow',
    'audienceResolvedNow',
    'identityTokenFetched',
    'authHeaderCreated',
    'privateRequestSendAllowedNow',
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
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'async-edit-work-graph.md',
  'editing-asset-manifest.md',
  'model-routing-policy.md',
  'intent-led-edit-planning.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval-smoke.ts',
  'package script mismatch',
)

const docPath =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.md'
const doc = read(docPath)
for (const phrase of [
  DECISION,
  'private inference retry gate recorded: true',
  'private inference retry gate passed: true',
  'approved-fixture private inference retry attempt approval recorded: true',
  'approved-fixture private inference retry attempt approved for future bounded attempt: true',
  'approved-fixture private inference retry attempt required: true',
  'future Cloud Run invocation during retry attempt approved: true',
  'future model import during retry attempt approved: true',
  'future model load during retry attempt approved: true',
  'future one bounded private inference retry during attempt approved: true',
  'real job creation approved now: false',
  'Cloud Run invocation approved now: false',
  'model import approved now: false',
  'model load approved now: false',
  'vLLM initialization approved now: false',
  'forward pass approved now: false',
  'inference approved now: false',
  'generated assets approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  '`approvedFixturePrivateInferenceRetryAttemptApprovalRequired=false`',
  '`approvedFixturePrivateInferenceRetryAttemptApprovalRecorded=true`',
  '`approvedFixturePrivateInferenceRetryAttemptApprovedForFutureBoundedAttempt=true`',
  '`approvedFixturePrivateInferenceRetryAttemptRequired=true`',
  '`readyForApprovedFixturePrivateInferenceRetryAttempt=true`',
  '`retryAttemptRunNow=false`',
  '`approvedFixturePrivateInferenceRetryAttemptExecuted=false`',
  '`cloudRunInvocationAttempted=false`',
  '`cloudRunJobExecuted=false`',
  '`serviceRuntimeRequestSent=false`',
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
  check(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  docPath,
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_APPROVAL
const retryGate =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_GATE

assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceRetryGateDecision,
  retryGate.decision,
)
assert.equal(approval.retryAttemptApproval.decisionRecorded, true)
assert.equal(approval.retryAttemptApproval.acceptsRetryGateForFutureBoundedAttempt, true)
assert.equal(approval.retryAttemptApproval.approvedFixturePrivateInferenceRetryAttemptApprovalRequired, false)
assert.equal(approval.retryAttemptApproval.approvedFixturePrivateInferenceRetryAttemptApprovalRecorded, true)
assert.equal(
  approval.retryAttemptApproval.approvedFixturePrivateInferenceRetryAttemptApprovedForFutureBoundedAttempt,
  true,
)
assert.equal(approval.retryAttemptApproval.approvedFixturePrivateInferenceRetryAttemptRequired, true)
assert.equal(approval.retryAttemptApproval.approvesFutureCloudRunInvocationDuringAttempt, true)
assert.equal(approval.retryAttemptApproval.approvesFutureModelImportDuringAttempt, true)
assert.equal(approval.retryAttemptApproval.approvesFutureOneBoundedPrivateInferenceRetryDuringAttempt, true)
assert.equal(approval.retryAttemptApproval.approvesCloudRunInvocationNow, false)
assert.equal(approval.retryAttemptApproval.approvesModelImportNow, false)
assert.equal(approval.retryAttemptApproval.approvesInferenceNow, false)
assert.equal(approval.retryAttemptApproval.approvesGeneratedAssetsNow, false)
assert.equal(approval.retryAttemptApproval.approvesSupabaseMutationNow, false)

assert.equal(approval.acceptedApprovedFixturePrivateInferenceRetryAttemptApprovalAreas.length, 8)
for (const row of approval.acceptedApprovedFixturePrivateInferenceRetryAttemptApprovalAreas) {
  assert.equal(row.acceptedForFutureRetryAttempt, true, `${row.id} must be accepted`)
  assert.equal(row.retryGateVerified, true, `${row.id} must be gate-verified`)
  assert.equal(row.runtimeValueResolvedNow, false, `${row.id} must not resolve runtime values now`)
  assert.equal(row.modelOrServiceTouchedNow, false, `${row.id} must not touch runtime now`)
  assert.equal(row.requestSentNow, false, `${row.id} must not send a request now`)
  assert.equal(row.executionAllowedNow, false, `${row.id} must not allow execution now`)
}

assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)

assert.equal(
  approval.futureApprovedFixturePrivateInferenceRetryAttemptRules
    .privateInferenceRetryAttemptApprovalRecordedBeforeAttempt,
  true,
)
assert.equal(
  approval.futureApprovedFixturePrivateInferenceRetryAttemptRules.futureAttemptMayRunOneBoundedPrivateInferenceRetry,
  true,
)
assert.equal(approval.futureApprovedFixturePrivateInferenceRetryAttemptRules.futureAttemptMustUseApprovedFixtureOnly, true)
assert.equal(approval.futureApprovedFixturePrivateInferenceRetryAttemptRules.futureAttemptMustNotCreateGeneratedAssets, true)
assert.equal(approval.futureApprovedFixturePrivateInferenceRetryAttemptRules.futureAttemptMustNotMutateSupabaseRows, true)
assert.equal(approval.futureApprovedFixturePrivateInferenceRetryAttemptRules.futureAttemptMustNotMutateCredits, true)
assert.equal(approval.futureApprovedFixturePrivateInferenceRetryAttemptRules.resultPersistenceRequiresSeparateFutureReview, true)

for (const [key, value] of Object.entries(approval.runtimeFlags)) {
  if (
    [
      'retryGateAccepted',
      'approvedFixturePrivateInferenceRetryPlanRecorded',
      'approvedFixturePrivateInferenceRetryGateRecorded',
      'approvedFixturePrivateInferenceRetryGatePassed',
      'approvedFixturePrivateInferenceRetryAttemptApprovalRecorded',
      'approvedFixturePrivateInferenceRetryAttemptApprovedForFutureBoundedAttempt',
      'approvedFixturePrivateInferenceRetryAttemptRequired',
      'approvedSnapshotAndFixtureScopeRetryAttemptApproved',
      'persistedJobLeaseAndIdempotencyRefsRetryAttemptApproved',
      'privateSourceOfTruthRefsRetryAttemptApproved',
      'qwenPrivateInferenceRequestEnvelopeRetryAttemptApproved',
      'privateInvokeTransportAndCredentialHandlingRetryAttemptApproved',
      'modelRuntimeBoundaryRetryAttemptApproved',
      'metadataOnlyResponseContractRetryAttemptApproved',
      'qaAuditCostCreditNoSpendRetryAttemptApproved',
      'cleanupRetryRollbackReviewRetryAttemptApproved',
      'selectedGpuL4Accepted',
      'scaleToZeroCostPostureAccepted',
      'minInstancesZeroAccepted',
      'initialMaxInstancesOneAccepted',
      'cpuFallbackDisabledAccepted',
      'readyForApprovedFixturePrivateInferenceRetryAttempt',
    ].includes(key)
  ) {
    assert.equal(value, true, `${key} must be true`)
  }
}
assert.equal(approval.runtimeFlags.approvedFixturePrivateInferenceRetryGateRequired, false)
assert.equal(approval.runtimeFlags.approvedFixturePrivateInferenceRetryAttemptApprovalRequired, false)
assertFalseRuntimeFlags(approval.runtimeFlags)

const forbiddenDataFindings = scanValues(approval)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in private inference retry-attempt approval data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: approval.decision,
  retryAttemptApprovalRecorded: approval.runtimeFlags.approvedFixturePrivateInferenceRetryAttemptApprovalRecorded,
  retryAttemptApprovedForFutureBoundedAttempt:
    approval.runtimeFlags.approvedFixturePrivateInferenceRetryAttemptApprovedForFutureBoundedAttempt,
  retryAttemptRequired: approval.runtimeFlags.approvedFixturePrivateInferenceRetryAttemptRequired,
  retryAttemptRunNow: approval.runtimeFlags.retryAttemptRunNow,
  cloudRunInvocationAttempted: approval.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: approval.runtimeFlags.inferenceRun,
  generatedAssetsCreated: approval.runtimeFlags.generatedAssetsCreated,
  generatedLocalFixturePassedClaimed: approval.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: approval.nextPrompt,
}, null, 2))
