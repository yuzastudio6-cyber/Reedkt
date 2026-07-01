import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_AUTH_REFRESH_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_plan_recorded_gate_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DS-PRIVATE-INFERENCE-RETRY-GATE: verify bounded approved-fixture private inference retry gate after auth refresh, no inference/no mutation'

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
    /\b(retryGateRunNow|approvedFixturePrivateInferenceRetryGateRecorded|readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInferenceApprovedNow|qwenInferenceAcceptedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|cloudRunJobExecuted|serviceRuntimeRequestSent|serviceTargetResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'approvedFixturePrivateInferenceRetryGateRecorded',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result-smoke.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts',
  'package script mismatch',
)

const docPath =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md'
const doc = read(docPath)
for (const phrase of [
  DECISION,
  'access token refresh passed: true',
  'Cloud Run service describe passed: true',
  'Cloud Run caller job describe passed: true',
  'auth blocker: `cleared`',
  'approved-fixture private inference retry plan recorded: true',
  'approved-fixture private inference retry gate required: true',
  'ready for approved-fixture private inference retry gate: true',
  'retry gate now: false',
  'service identity token fetch now: false',
  'auth header creation now: false',
  'caller job execution now: false',
  'Cloud Run invocation now: false',
  'private request send now: false',
  'model import now: false',
  'model load now: false',
  'vLLM initialization now: false',
  'prompt processing now: false',
  'forward pass now: false',
  'inference now: false',
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
  'max approved fixture private inference attempts: 1',
  'arbitrary user media allowed: false',
  'raw chat worker execution allowed: false',
  'raw worker prompt allowed: false',
  'signed URLs as source of truth allowed: false',
  'public URLs as source of truth allowed: false',
  'retry gate required before attempt: true',
  'read-only auth preflight required before attempt: true',
  'Workers execute approved snapshots, not raw chat.',
  '`approvedFixturePrivateInferenceRetryPlanRecorded=true`',
  '`approvedFixturePrivateInferenceRetryGateRequired=true`',
  '`readyForApprovedFixturePrivateInferenceRetryGate=true`',
  '`retryGateRunNow=false`',
  '`approvedFixturePrivateInferenceRetryGateRecorded=false`',
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
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts',
)

const result =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_PLAN
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceAuthRefreshResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_AUTH_REFRESH_RESULT.decision,
)
assert.equal(result.authRefreshEvidence.accessTokenRefreshPassed, true)
assert.equal(result.authRefreshEvidence.serviceDescribePassed, true)
assert.equal(result.authRefreshEvidence.jobDescribePassed, true)
assert.equal(result.authRefreshEvidence.blocker, 'cleared')
assert.equal(result.authRefreshEvidence.tokenValuePrinted, false)
assert.equal(result.authRefreshEvidence.tokenValueStored, false)
assert.equal(result.authRefreshEvidence.rawGcloudOutputStored, false)

assert.equal(result.retryPlanScope.authRefreshVerified, true)
assert.equal(result.retryPlanScope.approvedFixturePrivateInferenceRetryPlanRecorded, true)
assert.equal(result.retryPlanScope.approvedFixturePrivateInferenceRetryGateRequired, true)
assert.equal(result.retryPlanScope.readyForApprovedFixturePrivateInferenceRetryGate, true)
assert.equal(result.retryPlanScope.mayRunRetryGateNow, false)
assert.equal(result.retryPlanScope.mayExecuteCallerJobNow, false)
assert.equal(result.retryPlanScope.mayInvokeCloudRunNow, false)
assert.equal(result.retryPlanScope.mayRunInferenceNow, false)
assert.equal(result.retryPlanScope.mayCreateGeneratedAssetsNow, false)

assert.equal(result.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(result.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(result.selectedRuntime.minInstances, 0)
assert.equal(result.selectedRuntime.initialMaxInstances, 1)
assert.equal(result.selectedRuntime.cpuFallbackAllowed, false)

assert.equal(result.approvedFixtureRetryPlan.length, 8)
for (const row of result.approvedFixtureRetryPlan) {
  assert.equal(row.retryGateRequired, true, `${row.id} must require the retry gate`)
  assert.equal(row.currentExecutionAllowed, false, `${row.id} must not allow execution now`)
  assert.equal(row.requiredEvidence.length >= 3, true, `${row.id} must include evidence requirements`)
}

assert.equal(result.futureRetryAttemptBoundaries.maxApprovedFixturePrivateInferenceAttempts, 1)
assert.equal(result.futureRetryAttemptBoundaries.arbitraryUserMediaAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.rawChatWorkerExecutionAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.rawWorkerPromptAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.signedUrlSourceOfTruthAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.generatedAssetsAllowed, false)
assert.equal(result.futureRetryAttemptBoundaries.retryGateRequiredBeforeAttempt, true)
assert.equal(result.futureRetryAttemptBoundaries.resultReviewRequiredAfterAttempt, true)

assert.equal(result.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(result.sourceOfTruthRules.structuredFindingsAndEditIntentsRequired, true)
assert.equal(result.sourceOfTruthRules.persistedWorkerDispatchRefsRequired, true)
assert.equal(result.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(result.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(result.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(result.sourceOfTruthRules.qwenMayRenderExport, false)

for (const [key, value] of Object.entries(result.runtimeFlags)) {
  if (
    [
      'authRefreshResultAccepted',
      'accessTokenRefreshPassed',
      'serviceDescribePassed',
      'jobDescribePassed',
      'approvedFixturePrivateInferenceRetryPlanRecorded',
      'approvedFixturePrivateInferenceRetryGateRequired',
      'readyForApprovedFixturePrivateInferenceRetryGate',
      'authRefreshedGateRecheckPlanned',
      'approvedSnapshotAndFixtureLockPlanned',
      'persistedWorkerDispatchRefsPlanned',
      'privateSourceOfTruthRefsPlanned',
      'privateInferenceRequestEnvelopePlanned',
      'transportCredentialAndCloudRunBoundaryPlanned',
      'modelRuntimeOneFixtureBoundaryPlanned',
      'sanitizedResponseResultReviewPlanned',
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
assertFalseRuntimeFlags(result.runtimeFlags)

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in private inference retry plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  authRefreshAccepted: result.runtimeFlags.authRefreshResultAccepted,
  retryPlanRecorded: result.runtimeFlags.approvedFixturePrivateInferenceRetryPlanRecorded,
  retryGateRequired: result.runtimeFlags.approvedFixturePrivateInferenceRetryGateRequired,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  cloudRunJobExecuted: result.runtimeFlags.cloudRunJobExecuted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
