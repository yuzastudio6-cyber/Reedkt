import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt_result_review_accepted_transport_dependency_enablement_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CG-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-PLAN: plan controlled Qwen real-dispatch lease adapter and private invoke transport dependencies, no generated assets/no beta'

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
    'unsafe real runtime true claim',
    /\b(readyForRealWorkerDispatch|privateInvokeReady|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRequired',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-smoke.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.md')
for (const phrase of [
  DECISION,
  'real-dispatch execution attempt result accepted: true',
  'approved fixture only accepted: true',
  'real-dispatch default lease boundary accepted: `blocked_real_lease_backend_required`',
  'real-dispatch adapter-preview boundary accepted: `blocked_qwen_dispatch_adapter_fail_closed`',
  'real-dispatch transport-preview boundary accepted: `blocked_private_invoke_transport_preview_only`',
  'transport-preview runtime boundary coverage accepted: true',
  'NVIDIA L4 accepted: true',
  'scale-to-zero cost posture accepted: true',
  'min instances zero accepted: true',
  'initial max instances one accepted: true',
  'CPU fallback disabled accepted: true',
  'generated asset non-creation accepted: true',
  'real job non-creation accepted: true',
  'real lease non-claim accepted: true',
  'Cloud Run non-invocation accepted: true',
  'inference non-execution accepted: true',
  'Supabase non-mutation accepted: true',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired=true`',
  '`readyForRealWorkerDispatch=false`',
  '`workersDispatched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.ts',
]) {
  assertNoForbiddenText(file)
}

const review =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(review.nextPrompt, NEXT_PROMPT)
assert.equal(
  review.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT.decision,
)
assert.equal(review.acceptedEvidence.realDispatchExecutionAttemptResultAccepted, true)
assert.equal(review.acceptedEvidence.approvedFixtureOnlyAccepted, true)
assert.equal(review.acceptedEvidence.realDispatchDefaultLeaseBoundaryAccepted, true)
assert.equal(review.acceptedEvidence.realDispatchAdapterPreviewBoundaryAccepted, true)
assert.equal(review.acceptedEvidence.realDispatchTransportPreviewBoundaryAccepted, true)
assert.equal(review.acceptedEvidence.transportPreviewRuntimeBoundaryCoverageAccepted, true)
assert.equal(review.acceptedEvidence.selectedGpuL4Accepted, true)
assert.equal(review.acceptedEvidence.scaleToZeroCostPostureAccepted, true)
assert.equal(review.acceptedEvidence.minInstancesZeroAccepted, true)
assert.equal(review.acceptedEvidence.initialMaxInstancesOneAccepted, true)
assert.equal(review.acceptedEvidence.cpuFallbackDisabledAccepted, true)
assert.equal(review.acceptedEvidence.signedUrlsRemainNonSourceOfTruth, true)
assert.equal(review.acceptedEvidence.publicUrlsRemainNonSourceOfTruth, true)
assert.equal(review.acceptedEvidence.generatedAssetNonCreationAccepted, true)
assert.equal(review.acceptedEvidence.realJobNonCreationAccepted, true)
assert.equal(review.acceptedEvidence.realLeaseNonClaimAccepted, true)
assert.equal(review.acceptedEvidence.cloudRunNonInvocationAccepted, true)
assert.equal(review.acceptedEvidence.inferenceNonExecutionAccepted, true)
assert.equal(review.acceptedEvidence.supabaseNonMutationAccepted, true)
assert.equal(
  review.remainingBlockers
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired,
  true,
)
assert.equal(review.remainingBlockers.readyForRealWorkerDispatch, false)
assert.equal(review.remainingBlockers.realWorkerDispatchAccepted, false)
assert.equal(review.remainingBlockers.privateInvokeReady, false)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRecorded,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewAccepted,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRecorded,
  true,
)
assert.equal(
  review.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptPassedFailClosed,
  true,
)
assertFalseRuntimeFlags(review.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ review })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted runtime real-dispatch attempt result review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  realDispatchExecutionAttemptResultAccepted:
    review.acceptedEvidence.realDispatchExecutionAttemptResultAccepted,
  transportDependencyEnablementPlanRequired:
    review.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired,
  readyForRealWorkerDispatch: review.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: review.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: review.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: review.runtimeFlags.inferenceRun,
  generatedAssetsCreated: review.runtimeFlags.generatedAssetsCreated,
  nextPrompt: review.nextPrompt,
}, null, 2))
