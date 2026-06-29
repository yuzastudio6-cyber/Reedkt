import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_plan_recorded_runtime_implementation_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BO-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-IMPLEMENTATION: implement controlled persisted Qwen worker dispatch runtime fail-closed, no Cloud Run invocation/no inference/no assets/no beta'

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
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'controlledPersistedWorkerDispatchRuntimePlanRequired',
    'controlledPersistedWorkerDispatchRuntimeImplemented',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan-smoke.ts',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'src/backend/runtime/idempotency-service.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'src/backend/runtime/backend-runtime-transport-service.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-plan.md')
for (const phrase of [
  DECISION,
  'NVIDIA L4',
  'scale_to_zero_required',
  'structured agent findings',
  'edit intents',
  'approved plan snapshot',
  'persisted Qwen worker job',
  'backend-only idempotency check',
  'backend-only transactional lease claim',
  'private invoke envelope',
  'signed URL source of truth',
  'public URL source of truth',
  'blocked_private_invoke_transport_dependencies',
  'blocked_qa_audit_cost_evidence_required',
  '`controlledPersistedWorkerDispatchRuntimePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimePlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeImplementationRequired=true`',
  '`controlledPersistedWorkerDispatchRuntimeImplemented=false`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchSmokeResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_RESULT_REVIEW.decision,
)
assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(plan.selectedRuntime.minInstances, 0)
assert.equal(plan.selectedRuntime.maxInstancesForInitialRuntime, 1)
assert.equal(plan.acceptedPrerequisites.smokeResultReviewAccepted, true)
assert.equal(plan.acceptedPrerequisites.runtimePersistenceRemoteSatisfied, true)
assert.equal(plan.readinessDecision.controlledPersistedWorkerDispatchRuntimePlanRecorded, true)
assert.equal(plan.readinessDecision.controlledPersistedWorkerDispatchRuntimeImplementationRequired, true)
assert.equal(plan.readinessDecision.readyForRealWorkerDispatch, false)
assert.equal(plan.implementationInputs.rawPromptAllowed, false)
assert.equal(plan.implementationInputs.signedUrlSourceOfTruthAllowed, false)
assert.equal(plan.implementationInputs.publicUrlSourceOfTruthAllowed, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimePlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplementationRequired, true)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

for (const area of [
  'approved_snapshot_intake',
  'idempotency_and_job_claim',
  'lease_lifecycle',
  'qwen_adapter_and_envelope',
  'private_invoke_transport_boundary',
  'qa_audit_cost_credit',
  'result_and_cleanup',
]) {
  assert.ok(plan.runtimeImplementationPlan.some((row) => row.id === area), `missing area ${area}`)
}

for (const status of [
  'queued_approved_snapshot_job',
  'blocked_invalid_worker_job_schema',
  'blocked_missing_approved_snapshot',
  'blocked_missing_credit_reservation',
  'blocked_missing_source_of_truth_refs',
  'blocked_idempotency_conflict',
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_dependencies',
  'blocked_private_invoke_transport_preview_only',
  'blocked_runtime_approval_missing',
  'blocked_cleanup_required',
  'blocked_qa_audit_cost_evidence_required',
]) {
  assert.ok(
    (plan.requiredRuntimeStatuses as readonly string[]).includes(status),
    `missing status ${status}`,
  )
}

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted dispatch runtime plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  selectedGpu: plan.selectedRuntime.gpu,
  costPosture: plan.selectedRuntime.costPosture,
  runtimeImplementationRequired:
    plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplementationRequired,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
