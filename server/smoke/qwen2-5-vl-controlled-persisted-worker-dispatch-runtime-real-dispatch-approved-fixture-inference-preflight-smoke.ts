import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_preflight_verified_attempt_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DA-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-ATTEMPT-APPROVAL: approve one controlled Qwen approved-fixture inference attempt through persisted worker dispatch, no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|approvedFixtureInferencePreflightExecuted|approvedFixtureInferenceAttemptExecuted|approvedFixtureInferenceAcceptedForPersistedDispatch|approvedFixtureInferenceApprovedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'approvedFixtureInferencePreflightExecuted',
    'approvedFixtureInferenceAttemptExecuted',
    'approvedFixtureInferenceAcceptedForPersistedDispatch',
    'approvedFixtureInferenceApprovedNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval-smoke.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.md',
)
for (const phrase of [
  DECISION,
  'preflight verification only',
  'controlled approved-fixture inference preflight recorded: true',
  'controlled approved-fixture inference preflight passed: true',
  'controlled approved-fixture inference attempt approval required: true',
  'static envelope verified only: true',
  'model import approved now: false',
  'model load approved now: false',
  'vLLM initialization approved now: false',
  'prompt processing approved now: false',
  'forward pass approved now: false',
  'Cloud Run invocation approved now: false',
  'worker dispatch approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightPassed=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRequired=true`',
  '`approvedSnapshotAndFixtureScopePreflightVerified=true`',
  '`persistedWorkerDispatchRefsPreflightVerified=true`',
  '`privateSourceOfTruthRefsPreflightVerified=true`',
  '`qwenRequestEnvelopePreflightVerified=true`',
  '`privateInvokeTransportDependenciesPreflightVerified=true`',
  '`qwenRuntimeInferenceBoundaryPreflightVerified=true`',
  '`responseSchemaAndResultHandlingPreflightVerified=true`',
  '`qaAuditCostAndCreditNoSpendPreflightVerified=true`',
  '`cleanupRetryAndBetaLockPreflightVerified=true`',
  '`approvedFixtureInferencePreflightExecuted=false`',
  '`approvedFixtureInferenceAttemptExecuted=false`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.ts',
]) {
  assertNoForbiddenText(file)
}

const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PREFLIGHT
const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_APPROVAL

assert.equal(preflight.decision, DECISION)
assert.equal(preflight.nextPrompt, NEXT_PROMPT)
assert.equal(
  preflight.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalDecision,
  approval.decision,
)
assert.equal(preflight.preflightDecision.decisionRecorded, true)
assert.equal(
  preflight.preflightDecision.acceptsApprovedFixtureInferenceApprovalForFutureAttemptApproval,
  true,
)
assert.equal(preflight.preflightDecision.controlledApprovedFixtureInferencePreflightRecorded, true)
assert.equal(preflight.preflightDecision.controlledApprovedFixtureInferencePreflightPassed, true)
assert.equal(preflight.preflightDecision.controlledApprovedFixtureInferenceAttemptApprovalRequired, true)
assert.equal(preflight.preflightDecision.staticEnvelopeVerifiedOnly, true)
assert.equal(preflight.preflightDecision.approvesModelImportNow, false)
assert.equal(preflight.preflightDecision.approvesModelLoadNow, false)
assert.equal(preflight.preflightDecision.approvesVllmInitializationNow, false)
assert.equal(preflight.preflightDecision.approvesPromptProcessingNow, false)
assert.equal(preflight.preflightDecision.approvesForwardPassNow, false)
assert.equal(preflight.preflightDecision.approvesCloudRunInvocationNow, false)
assert.equal(preflight.preflightDecision.approvesWorkerDispatchNow, false)
assert.equal(preflight.preflightDecision.approvesGeneratedAssetsNow, false)
assert.equal(preflight.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(preflight.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(preflight.approvedRuntimePosture.minInstances, 0)
assert.equal(preflight.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(preflight.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(preflight.verifiedApprovedFixtureInferencePreflightAreas.length, 9)
assert.equal(
  preflight.verifiedApprovedFixtureInferencePreflightAreas.every(
    (entry) =>
      entry.prerequisiteCategoryVerified &&
      entry.staticEnvelopeVerifiedOnly &&
      !entry.runtimeValueResolvedNow &&
      !entry.modelOrServiceTouchedNow &&
      !entry.requestSentNow &&
      !entry.executionAllowedNow,
  ),
  true,
)
assert.equal(preflight.futureAttemptRules.workersExecuteApprovedSnapshots, true)
assert.equal(preflight.futureAttemptRules.rawChatWorkerExecutionAllowed, false)
assert.equal(preflight.futureAttemptRules.rawWorkerPromptAllowed, false)
assert.equal(preflight.futureAttemptRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(preflight.futureAttemptRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(preflight.futureAttemptRules.staticEnvelopeVerifiedOnlyNow, true)
assert.equal(preflight.futureAttemptRules.modelImportRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.inferenceRequiresAttemptApproval, true)
assertFalseRuntimeFlags(preflight.runtimeFlags)

const expectedTrueRuntimeFlags: Array<keyof typeof preflight.runtimeFlags> = [
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRecorded',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRecorded',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAcceptedForPreflight',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRecorded',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightPassed',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRequired',
  'approvedSnapshotAndFixtureScopePreflightVerified',
  'persistedWorkerDispatchRefsPreflightVerified',
  'privateSourceOfTruthRefsPreflightVerified',
  'qwenRequestEnvelopePreflightVerified',
  'privateInvokeTransportDependenciesPreflightVerified',
  'qwenRuntimeInferenceBoundaryPreflightVerified',
  'responseSchemaAndResultHandlingPreflightVerified',
  'qaAuditCostAndCreditNoSpendPreflightVerified',
  'cleanupRetryAndBetaLockPreflightVerified',
  'selectedGpuL4Accepted',
  'scaleToZeroCostPostureAccepted',
  'minInstancesZeroAccepted',
  'initialMaxInstancesOneAccepted',
  'cpuFallbackDisabledAccepted',
]

for (const key of expectedTrueRuntimeFlags) {
  assert.equal(preflight.runtimeFlags[key], true, `${key} must be true`)
}
assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired,
  false,
)
assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRequired,
  false,
)

const valueFindings = scanValues(preflight, ['preflight'])
assert.deepEqual(valueFindings, [], `Forbidden values in preflight data: ${valueFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: preflight.decision,
      approvedRuntimeGpu: preflight.approvedRuntimePosture.gpu,
      costPosture: preflight.approvedRuntimePosture.costPosture,
      verifiedRows: preflight.verifiedApprovedFixtureInferencePreflightAreas.length,
      approvedFixtureInferencePreflightExecuted:
        preflight.runtimeFlags.approvedFixtureInferencePreflightExecuted,
      inferenceRun: preflight.runtimeFlags.inferenceRun,
      nextPrompt: preflight.nextPrompt,
    },
    null,
    2,
  ),
)
