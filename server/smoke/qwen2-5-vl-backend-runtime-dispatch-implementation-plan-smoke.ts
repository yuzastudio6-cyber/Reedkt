import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-approved-worker-integration-readiness-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_dispatch_implementation_plan_recorded_fail_closed_coordinator_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58K-FAIL-CLOSED-BACKEND-RUNTIME-DISPATCH-COORDINATOR: implement Qwen backend dispatch coordinator fail-closed, no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
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
  ['unsafe runtime true claim', /\b(privateInvokeReady|readyForRealWorkerDispatch|workersDispatched|supabaseTouched|sqlExecuted|cloudRunInvocationAttempted|serviceRuntimeRequestSent|identityTokenFetched|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'backendRuntimeDispatchCoordinatorImplemented',
    'realJobCreated',
    'realLeaseClaimed',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'identityTokenFetched',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
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

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-dispatch-implementation-plan.md',
  'docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md',
  'src/backend/services/job-queue-runtime-service.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'src/backend/runtime/idempotency-service.ts',
  'server/validation/worker-schemas.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-dispatch-implementation-plan-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-dispatch-implementation-plan'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-dispatch-implementation-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-dispatch-implementation-plan.md')
for (const phrase of [
  DECISION,
  '`runWorkerJobSchema`',
  '`queueMockJob`',
  '`claimWorkerLeaseMock`',
  '`claimWorkerLease()`',
  '`checkIdempotencyConflictMock`',
  'Qwen fail-closed dispatch adapter',
  'Qwen private invoke envelope',
  'Qwen private invoke config',
  'Qwen private invoke transport preview',
  'blocked_invalid_worker_job_schema',
  'blocked_real_lease_backend_required',
  'blocked_private_invoke_transport_preview_only',
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

for (const [file, phrase] of [
  ['src/backend/services/job-queue-runtime-service.ts', 'queueMockJob'],
  ['src/backend/runtime/worker-lease-service.ts', 'claimWorkerLeaseMock'],
  ['src/backend/runtime/worker-lease-service.ts', 'Real worker lease claim requires backend/service-role runtime.'],
  ['src/backend/runtime/idempotency-service.ts', 'checkIdempotencyConflictMock'],
  ['src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts', 'blocked_fail_closed_cloud_run_invocation_disabled'],
  ['src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts', 'previewQwen25VlPrivateInvokeTransportAdapter'],
] as const) {
  assert.ok(read(file).includes(phrase), `${file} missing ${phrase}`)
}

const plan = QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(
  plan.upstreamApprovedWorkerIntegrationReadinessReviewDecision,
  QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW.decision,
)
assert.equal(plan.readinessDecision.backendRuntimeDispatchImplementationPlanRecorded, true)
assert.equal(plan.readinessDecision.failClosedBackendRuntimeDispatchCoordinatorRequired, true)
assert.equal(plan.readinessDecision.backendRuntimeDispatchCoordinatorImplemented, false)
assert.equal(plan.readinessDecision.readyForRealWorkerDispatch, false)
assertFalseFlags(plan.runtimeFlags)

for (const surfaceId of [
  'run_worker_job_schema',
  'job_queue_runtime_service',
  'worker_lease_service',
  'idempotency_service',
  'qwen_fail_closed_dispatch_adapter',
  'qwen_private_invoke_envelope',
  'qwen_private_invoke_config',
  'qwen_private_invoke_transport_preview',
]) {
  assert.ok(plan.existingBackendSurfaces.some((row) => row.id === surfaceId), `missing surface ${surfaceId}`)
}

for (const outcome of [
  'blocked_invalid_worker_job_schema',
  'blocked_missing_approved_snapshot',
  'blocked_missing_credit_reservation',
  'blocked_missing_source_of_truth_refs',
  'blocked_idempotency_conflict',
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_preview_only',
]) {
  assert.ok(
    (plan.requiredCoordinatorOutcomes as readonly string[]).includes(outcome),
    `missing outcome ${outcome}`,
  )
}

assert.equal(plan.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-dispatch-implementation-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen backend runtime dispatch implementation plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  surfaceCount: plan.existingBackendSurfaces.length,
  requiredCoordinatorOutcomeCount: plan.requiredCoordinatorOutcomes.length,
  backendRuntimeDispatchImplementationPlanRecorded:
    plan.runtimeFlags.backendRuntimeDispatchImplementationPlanRecorded,
  failClosedBackendRuntimeDispatchCoordinatorRequired:
    plan.runtimeFlags.failClosedBackendRuntimeDispatchCoordinatorRequired,
  backendRuntimeDispatchCoordinatorImplemented:
    plan.runtimeFlags.backendRuntimeDispatchCoordinatorImplemented,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
