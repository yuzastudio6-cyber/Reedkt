import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_plan_recorded_implementation_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DD-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-PERSISTED-JOB-LEASE-BRIDGE-IMPLEMENTATION: implement the persisted job and lease bridge fail-closed, no inference/no generated assets/no beta'

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
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  [
    'unsafe runtime true claim',
    /\b(bridgeImplementedNow|privateInvokeHandoffAllowedNow|readyForRealWorkerDispatch|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'bridgeImplementedNow',
    'privateInvokeHandoffAllowedNow',
    'readyForRealWorkerDispatch',
    'approvedFixtureInferenceAcceptedForPersistedDispatch',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'src/backend/runtime/idempotency-service.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'intent-led-edit-planning.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.md',
)
for (const phrase of [
  DECISION,
  'persisted job / lease bridge plan recorded: true',
  'persisted job / lease bridge implementation required: true',
  'real worker dispatch ready: false',
  'private invoke handoff allowed now: false',
  'Cloud Run invocation now: false',
  'Qwen inference now: false',
  'Approved Job Intake',
  'Persisted Idempotency Guard',
  'Transactional Job And Lease Claim',
  'Job Event, Runtime Message, And Worker Claim',
  'Private Source-Of-Truth Refs',
  'Private Invoke Handoff Boundary',
  'QA, Audit, Cost, And Credit Boundary',
  'Cleanup, Retry, And Result Review',
  'one active lease per job: true',
  'duplicate source mismatch blocked: true',
  'backend-only mutation required for future implementation: true',
  'private invoke handoff allowed by this plan now: false',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationRequired=true`',
  '`approvedJobIntakePlanned=true`',
  '`persistedIdempotencyGuardPlanned=true`',
  '`transactionalJobAndLeaseClaimPlanned=true`',
  '`jobEventRuntimeMessageWorkerClaimPlanned=true`',
  '`bridgeImplementedNow=false`',
  '`realJobCreated=false`',
  '`realLeaseClaimed=false`',
  '`idempotencyRowCreated=false`',
  '`jobEventCreated=false`',
  '`backendRuntimeMessageCreated=false`',
  '`workerClaimCreated=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT.decision,
)
assert.equal(plan.bridgeScope.approvedFixtureInferenceAttemptResultRecorded, true)
assert.equal(plan.bridgeScope.persistedJobLeaseBridgePlanRecorded, true)
assert.equal(plan.bridgeScope.persistedJobLeaseBridgeImplementationRequired, true)
assert.equal(plan.bridgeScope.mayImplementBridgeNow, false)
assert.equal(plan.bridgeScope.mayCreateRealJobNow, false)
assert.equal(plan.bridgeScope.mayClaimRealLeaseNow, false)
assert.equal(plan.bridgeScope.mayRecordIdempotencyNow, false)
assert.equal(plan.bridgeScope.mayCreateJobEventNow, false)
assert.equal(plan.bridgeScope.mayCreateRuntimeMessageNow, false)
assert.equal(plan.bridgeScope.mayCreateWorkerClaimNow, false)
assert.equal(plan.bridgeScope.mayInvokeCloudRunNow, false)
assert.equal(plan.bridgeScope.mayRunInferenceNow, false)
assert.equal(plan.bridgeScope.mayPersistQwenResultNow, false)
assert.equal(plan.bridgePlan.length, 8)

for (const id of [
  'approved_job_intake',
  'persisted_idempotency_guard',
  'transactional_job_and_lease_claim',
  'job_event_runtime_message_worker_claim',
  'private_source_of_truth_refs',
  'private_invoke_handoff_boundary',
  'qa_audit_cost_credit_boundary',
  'cleanup_retry_and_result_review',
]) {
  assert.equal(plan.bridgePlan.some((item) => item.id === id), true, `${id} must exist`)
}

assert.equal(plan.futureBridgeImplementationShape.oneActiveLeasePerJobRequired, true)
assert.equal(plan.futureBridgeImplementationShape.duplicateSourceMismatchBlocked, true)
assert.equal(plan.futureBridgeImplementationShape.privateInvokeHandoffAllowedByPlanNow, false)
assert.equal(plan.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(plan.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(plan.sourceOfTruthRules.rawWorkerPromptAllowed, false)
assert.equal(plan.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.frontendMayClaimLease, false)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationRequired, true)

const forbiddenDataFindings = scanValues(plan)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in bridge plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  bridgePlanRecorded: plan.bridgeScope.persistedJobLeaseBridgePlanRecorded,
  implementationRequired: plan.bridgeScope.persistedJobLeaseBridgeImplementationRequired,
  bridgeAreaCount: plan.bridgePlan.length,
  realJobCreated: plan.runtimeFlags.realJobCreated,
  realLeaseClaimed: plan.runtimeFlags.realLeaseClaimed,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
