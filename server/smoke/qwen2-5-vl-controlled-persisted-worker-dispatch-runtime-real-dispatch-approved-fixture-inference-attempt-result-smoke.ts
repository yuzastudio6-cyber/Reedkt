import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result'
import { runQwen25VlControlledPersistedWorkerDispatchRuntime } from '../../src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_attempt_blocked_persisted_job_lease_bridge_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DC-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-PERSISTED-JOB-LEASE-BRIDGE-PLAN: plan the missing persisted job and lease bridge before another Qwen inference attempt, no generated assets/no beta'

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
    'unsafe execution true claim',
    /\b(approvedFixtureInferenceAttemptExecuted|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptExecuted',
    'cpuCallerInferencePathReused',
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
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'identityTokenFetched',
    'authHeaderCreated',
    'privateRequestSendAllowedNow',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-smoke-retry-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.md',
)
for (const phrase of [
  DECISION,
  'approved-fixture inference attempt executed: false',
  'persisted worker dispatch runtime default status: `blocked_real_lease_backend_required`',
  'persisted worker dispatch adapter preview status: `blocked_qwen_dispatch_adapter_fail_closed`',
  'persisted worker dispatch transport preview status: `blocked_private_invoke_transport_preview_only`',
  'older CPU caller inference path reused: false',
  'cpu_caller_does_not_prove_persisted_worker_dispatch_job_lease_bridge',
  'What Went Wrong',
  'The missing piece is the bridge between those two layers.',
  '`persistedJobLeaseBridgeRequired=true`',
  '`cloudRunInvocationAttempted=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`vllmEngineInitialized=false`',
  '`promptProcessed=false`',
  '`forwardPassRun=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL.decision,
)
assert.equal(result.attemptResult.attemptApprovalRecorded, true)
assert.equal(result.attemptResult.approvedFixtureInferenceAttemptInspected, true)
assert.equal(result.attemptResult.approvedFixtureInferenceAttemptExecuted, false)
assert.equal(result.attemptResult.approvedFixtureInferenceAttemptBlocked, true)
assert.equal(result.attemptResult.blocker, 'persisted_job_lease_bridge_required')
assert.equal(result.attemptResult.persistedWorkerDispatchDefaultStatus, 'blocked_real_lease_backend_required')
assert.equal(result.attemptResult.persistedWorkerDispatchAdapterPreviewStatus, 'blocked_qwen_dispatch_adapter_fail_closed')
assert.equal(result.attemptResult.persistedWorkerDispatchTransportPreviewStatus, 'blocked_private_invoke_transport_preview_only')
assert.equal(result.attemptResult.cpuCallerInferencePathReused, false)
assert.equal(
  result.attemptResult.cpuCallerReuseBlockedReason,
  'cpu_caller_does_not_prove_persisted_worker_dispatch_job_lease_bridge',
)
assert.equal(result.priorRuntimeEvidence.structuredFixtureOutputPreviouslyPassed, true)
assert.equal(result.priorRuntimeEvidence.structuredFixtureOutputSchemaValid, true)
assert.equal(result.priorRuntimeEvidence.structuredFixtureOutputParsedJson, true)
assert.equal(result.requiredBridgeBeforeNextInferenceAttempt.persistedJobCreationRequired, true)
assert.equal(result.requiredBridgeBeforeNextInferenceAttempt.realLeaseClaimRequired, true)
assert.equal(result.requiredBridgeBeforeNextInferenceAttempt.rawResponseBodyStorageAllowed, false)
assert.equal(result.requiredBridgeBeforeNextInferenceAttempt.generatedAssetCreationAllowed, false)
assertFalseRuntimeFlags(result.runtimeFlags as unknown as JsonRecord)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptBlocked, true)
assert.equal(result.runtimeFlags.persistedJobLeaseBridgeRequired, true)
assert.equal(result.runtimeFlags.persistedWorkerDispatchDefaultLeaseBoundaryBlocked, true)
assert.equal(result.runtimeFlags.persistedWorkerDispatchAdapterPreviewBlocked, true)
assert.equal(result.runtimeFlags.persistedWorkerDispatchTransportPreviewBlocked, true)
assert.equal(result.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(result.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)

const defaultAttempt = runQwen25VlControlledPersistedWorkerDispatchRuntime()
assert.equal(defaultAttempt.status, 'blocked_real_lease_backend_required')
assert.equal(defaultAttempt.runtimeFlags.realJobCreated, false)
assert.equal(defaultAttempt.runtimeFlags.realLeaseClaimed, false)
assert.equal(defaultAttempt.runtimeFlags.cloudRunInvocationAttempted, false)

const adapterPreviewAttempt = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  continueAfterLeaseBoundaryForPreview: true,
})
assert.equal(adapterPreviewAttempt.status, 'blocked_qwen_dispatch_adapter_fail_closed')
assert.equal(adapterPreviewAttempt.runtimeFlags.cloudRunInvocationAttempted, false)

const transportPreviewAttempt = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  continueAfterLeaseBoundaryForPreview: true,
  continueAfterAdapterBoundaryForPreview: true,
})
assert.equal(transportPreviewAttempt.status, 'blocked_private_invoke_transport_preview_only')
assert.equal(transportPreviewAttempt.runtimeFlags.privateInvokeTransportPreviewChecked, true)
assert.equal(transportPreviewAttempt.runtimeFlags.cloudRunInvocationAttempted, false)

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in attempt result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  attemptedInference: result.attemptResult.approvedFixtureInferenceAttemptExecuted,
  blocker: result.attemptResult.blocker,
  defaultRuntimeStatus: defaultAttempt.status,
  adapterPreviewStatus: adapterPreviewAttempt.status,
  transportPreviewStatus: transportPreviewAttempt.status,
  inferenceRun: result.runtimeFlags.inferenceRun,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  nextPrompt: result.nextPrompt,
}, null, 2))
