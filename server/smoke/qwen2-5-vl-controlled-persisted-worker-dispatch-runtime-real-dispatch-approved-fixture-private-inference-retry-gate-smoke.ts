import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_GATE } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_gate_verified_attempt_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DT-PRIVATE-INFERENCE-RETRY-ATTEMPT-APPROVAL: approve one bounded approved-fixture private inference retry after gate verification, no inference/no mutation'

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
    /\b(retryGateRunNow|readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInferenceApprovedNow|qwenInferenceAcceptedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|cloudRunJobExecuted|serviceRuntimeRequestSent|serviceTargetResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'retryGateRunNow',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'model-routing-policy.md',
  'intent-led-edit-planning.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate-smoke.ts',
  'package script mismatch',
)

const docPath =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md'
const doc = read(docPath)
for (const phrase of [
  DECISION,
  'retry plan recorded: true',
  'auth refresh result accepted: true',
  'access token refresh passed: true',
  'Cloud Run service describe passed: true',
  'Cloud Run caller job describe passed: true',
  'read-only preflight repeated for gate: true',
  'downstream probe skipped: false',
  'blocker: `cleared`',
  'token value printed: false',
  'token value stored: false',
  'raw gcloud output stored: false',
  'approved-fixture private inference retry gate required: false',
  'approved-fixture private inference retry gate recorded: true',
  'approved-fixture private inference retry gate passed: true',
  'approved-fixture private inference retry attempt approval required: true',
  'caller job execution approved now: false',
  'service target resolution approved now: false',
  'audience resolution approved now: false',
  'identity token fetch approved now: false',
  'auth header creation approved now: false',
  'private request send approved now: false',
  'Cloud Run invocation approved now: false',
  'model import approved now: false',
  'model load approved now: false',
  'vLLM initialization approved now: false',
  'prompt processing approved now: false',
  'forward pass approved now: false',
  'Qwen inference approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Auth-Refreshed Gate Recheck',
  'Approved Snapshot And Fixture Lock',
  'Persisted Worker Dispatch Refs',
  'Private Source-Of-Truth Refs',
  'Private Inference Request Envelope',
  'Transport, Credential, And Cloud Run Boundary',
  'Model Runtime One-Fixture Boundary',
  'Sanitized Response Result Review',
  'Workers execute approved snapshots, not raw chat.',
  '`approvedFixturePrivateInferenceRetryGateRequired=false`',
  '`approvedFixturePrivateInferenceRetryGateRecorded=true`',
  '`approvedFixturePrivateInferenceRetryGatePassed=true`',
  '`approvedFixturePrivateInferenceRetryAttemptApprovalRequired=true`',
  '`readyForApprovedFixturePrivateInferenceRetryAttemptApproval=true`',
  '`retryGateRunNow=false`',
  '`cloudRunInvocationAttempted=false`',
  '`cloudRunJobExecuted=false`',
  '`identityTokenFetched=false`',
  '`authHeaderCreated=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'What This Advances',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assertNoForbiddenText(docPath)
assertNoForbiddenText(
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts',
)

const result =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_GATE
const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_PLAN
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceRetryPlanDecision,
  plan.decision,
)
assert.equal(result.liveReadOnlyGateEvidence.retryPlanRecorded, true)
assert.equal(result.liveReadOnlyGateEvidence.authRefreshResultAccepted, true)
assert.equal(result.liveReadOnlyGateEvidence.accessTokenRefreshPassed, true)
assert.equal(result.liveReadOnlyGateEvidence.serviceDescribePassed, true)
assert.equal(result.liveReadOnlyGateEvidence.jobDescribePassed, true)
assert.equal(result.liveReadOnlyGateEvidence.readOnlyPreflightRepeatedForGate, true)
assert.equal(result.liveReadOnlyGateEvidence.downstreamProbeSkipped, false)
assert.equal(result.liveReadOnlyGateEvidence.blocker, 'cleared')
assert.equal(result.liveReadOnlyGateEvidence.tokenValuePrinted, false)
assert.equal(result.liveReadOnlyGateEvidence.tokenValueStored, false)
assert.equal(result.liveReadOnlyGateEvidence.rawGcloudOutputStored, false)

assert.equal(result.retryGateDecision.decisionRecorded, true)
assert.equal(result.retryGateDecision.acceptsRetryPlanForFutureAttemptApproval, true)
assert.equal(result.retryGateDecision.approvedFixturePrivateInferenceRetryGateRequired, false)
assert.equal(result.retryGateDecision.approvedFixturePrivateInferenceRetryGateRecorded, true)
assert.equal(result.retryGateDecision.approvedFixturePrivateInferenceRetryGatePassed, true)
assert.equal(result.retryGateDecision.approvedFixturePrivateInferenceRetryAttemptApprovalRequired, true)
assert.equal(result.retryGateDecision.staticAndReadOnlyGateVerifiedOnly, true)
assert.equal(result.retryGateDecision.approvesCallerJobExecutionNow, false)
assert.equal(result.retryGateDecision.approvesIdentityTokenFetchNow, false)
assert.equal(result.retryGateDecision.approvesAuthHeaderCreationNow, false)
assert.equal(result.retryGateDecision.approvesCloudRunInvocationNow, false)
assert.equal(result.retryGateDecision.approvesModelImportNow, false)
assert.equal(result.retryGateDecision.approvesModelLoadNow, false)
assert.equal(result.retryGateDecision.approvesQwenInferenceNow, false)
assert.equal(result.retryGateDecision.approvesGeneratedAssetsNow, false)
assert.equal(result.retryGateDecision.approvesSupabaseMutationNow, false)
assert.equal(result.retryGateDecision.approvesCreditSpendNow, false)

assert.equal(result.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(result.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(result.selectedRuntime.minInstances, 0)
assert.equal(result.selectedRuntime.initialMaxInstances, 1)
assert.equal(result.selectedRuntime.cpuFallbackAllowed, false)

assert.equal(result.verifiedRetryGateAreas.length, 8)
for (const row of result.verifiedRetryGateAreas) {
  assert.equal(row.retryGateVerified, true, `${row.id} must be gate-verified`)
  assert.equal(row.staticAndReadOnlyGateVerifiedOnly, true, `${row.id} must be read-only/static`)
  assert.equal(row.executionAllowedNow, false, `${row.id} must not allow execution now`)
  assert.equal(row.requiredEvidence.length >= 3, true, `${row.id} must include evidence requirements`)
}

assert.equal(result.futureAttemptApprovalRequirements.length, 9)
assert.equal(result.futureRetryAttemptBoundaries.maxApprovedFixturePrivateInferenceAttempts, 1)
assert.equal(result.futureRetryAttemptBoundaries.rawChatWorkerExecutionAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.rawWorkerPromptAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.signedUrlSourceOfTruthAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.generatedAssetsAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.retryGateRequiredBeforeAttempt, true)
assert.equal(result.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(result.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(result.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(result.sourceOfTruthRules.qwenMayRenderExport, false)

for (const [key, value] of Object.entries(result.runtimeFlags)) {
  if (
    [
      'retryPlanAccepted',
      'authRefreshResultAccepted',
      'accessTokenRefreshPassed',
      'serviceDescribePassed',
      'jobDescribePassed',
      'readOnlyPreflightRepeatedForGate',
      'approvedFixturePrivateInferenceRetryPlanRecorded',
      'approvedFixturePrivateInferenceRetryGateRecorded',
      'approvedFixturePrivateInferenceRetryGatePassed',
      'approvedFixturePrivateInferenceRetryAttemptApprovalRequired',
      'readyForApprovedFixturePrivateInferenceRetryAttemptApproval',
      'authRefreshedGateRecheckVerified',
      'approvedSnapshotAndFixtureLockVerified',
      'persistedWorkerDispatchRefsVerified',
      'privateSourceOfTruthRefsVerified',
      'privateInferenceRequestEnvelopeVerified',
      'transportCredentialAndCloudRunBoundaryVerified',
      'modelRuntimeOneFixtureBoundaryVerified',
      'sanitizedResponseResultReviewVerified',
      'selectedGpuL4Accepted',
      'scaleToZeroCostPostureAccepted',
      'minInstancesZeroAccepted',
      'initialMaxInstancesOneAccepted',
      'cpuFallbackDisabledAccepted',
    ].includes(key)
  ) {
    assert.equal(value, true, `${key} must be true`)
  }
}
assert.equal(result.runtimeFlags.approvedFixturePrivateInferenceRetryGateRequired, false)
assertFalseRuntimeFlags(result.runtimeFlags)

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in private inference retry gate data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  retryGateRecorded: result.runtimeFlags.approvedFixturePrivateInferenceRetryGateRecorded,
  retryGatePassed: result.runtimeFlags.approvedFixturePrivateInferenceRetryGatePassed,
  attemptApprovalRequired: result.runtimeFlags.approvedFixturePrivateInferenceRetryAttemptApprovalRequired,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  cloudRunJobExecuted: result.runtimeFlags.cloudRunJobExecuted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
