import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_plan_recorded_smoke_execution_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BQ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-EXECUTION: run controlled persisted Qwen worker dispatch runtime smoke, no Cloud Run invocation/no inference/no assets/no beta'
const PLAN_DOC =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-plan.md'
const PLAN_SPEC =
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan.ts'
const PLAN_SMOKE =
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan-smoke.ts'

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
    /\b(controlledPersistedWorkerDispatchRuntimeSmokeExecuted|readyForRealWorkerDispatch|privateInvokeReady|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeSmokeExecuted',
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
  PLAN_DOC,
  PLAN_SPEC,
  PLAN_SMOKE,
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-implementation.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'src/backend/runtime/idempotency-service.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'server/validation/worker-schemas.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan-smoke.ts',
  'package script mismatch',
)

const doc = read(PLAN_DOC)
for (const phrase of [
  DECISION,
  'runtime_smoke_plan_recorded',
  'NVIDIA L4',
  'scale_to_zero_required',
  'Minimum instances: `0`',
  'structured agent findings',
  'edit intents',
  'approved plan snapshot',
  'credit reservation',
  'private manifest refs',
  'persisted worker job',
  '| Default runtime path | `blocked_real_lease_backend_required` |',
  '| Adapter preview path | `blocked_qwen_dispatch_adapter_fail_closed` |',
  '| Transport preview path | `blocked_private_invoke_transport_preview_only` |',
  '| Idempotency conflict path | `blocked_idempotency_conflict` |',
  '| Missing approved snapshot path | `blocked_missing_approved_snapshot` |',
  '| Missing credit reservation path | `blocked_missing_credit_reservation` |',
  '| Missing source-of-truth path | `blocked_missing_source_of_truth_refs` |',
  '| Invalid worker job schema path | `blocked_invalid_worker_job_schema` |',
  '`controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeExecuted=false`',
  '`readyForRealWorkerDispatch=false`',
  '`cloudRunInvocationAttempted=false`',
  '`workersDispatched=false`',
  '`sqlExecuted=false`',
  '`generatedAssetsCreated=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [PLAN_DOC, PLAN_SPEC]) {
  assertNoForbiddenText(file)
}

const plan = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeImplementationDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION.decision,
)
assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplementationRequired, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplemented, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePlanRequired, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired, true)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

const assertionIds = plan.runtimeSmokeAssertions.map((assertion) => assertion.id)
assert.deepEqual(assertionIds, [
  'default_runtime_path',
  'adapter_preview_path',
  'transport_preview_path',
  'idempotency_conflict_path',
  'missing_approved_snapshot_path',
  'missing_credit_reservation_path',
  'missing_source_of_truth_refs_path',
  'invalid_worker_job_schema_path',
  'runtime_step_coverage',
  'side_effect_gate_coverage',
])

for (const status of [
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
    (plan.requiredRuntimeStatuses as readonly string[]).includes(status),
    `missing runtime status ${status}`,
  )
}

for (const required of [
  'raw_chat_worker_input',
  'raw_prompt_payload_fields',
  'signed_url_source_of_truth',
  'direct_cloud_run_service_url_exposure',
  'token_or_bearer_header_persistence',
  'service_role_key_value_persistence',
  'missing_credit_reservation',
  'missing_approved_snapshot',
  'missing_private_storage_checksum_manifest',
  'beta_or_production_readiness_claim',
] as const) {
  assert.ok(plan.blockedBypasses.includes(required), `Missing bypass: ${required}`)
}

const forbiddenDataFindings = scanValues(plan)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in runtime smoke plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  selectedGpu: plan.selectedRuntime.gpu,
  costPosture: plan.selectedRuntime.costPosture,
  runtimeAssertionCount: plan.runtimeSmokeAssertions.length,
  runtimeSmokeExecutionRequired:
    plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired,
  runtimeSmokeExecuted:
    plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecuted,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
