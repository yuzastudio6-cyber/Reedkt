import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_approval_accepted_preflight_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CZ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-PREFLIGHT: verify one controlled Qwen approved-fixture inference preflight through persisted worker dispatch, no generated assets/no beta'

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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan-smoke.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.md',
)
for (const phrase of [
  DECISION,
  'future preflight only',
  'approved-fixture inference approval required: false',
  'approved-fixture inference approval recorded: true',
  'approved-fixture inference accepted for preflight: true',
  'approved-fixture inference preflight required: true',
  'future single approved-fixture inference preflight approved: true',
  'inference approved now: false',
  'model import approved now: false',
  'model load approved now: false',
  'vLLM initialization approved now: false',
  'Cloud Run invocation approved now: false',
  'worker dispatch approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAcceptedForPreflight=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRequired=true`',
  '`approvedSnapshotAndFixtureScopeAccepted=true`',
  '`persistedWorkerDispatchRefsAccepted=true`',
  '`privateSourceOfTruthRefsAccepted=true`',
  '`qwenRequestEnvelopeAccepted=true`',
  '`privateInvokeTransportDependenciesAccepted=true`',
  '`qwenRuntimeInferenceBoundaryAccepted=true`',
  '`responseSchemaAndResultHandlingAccepted=true`',
  '`qaAuditCostAndCreditNoSpendAccepted=true`',
  '`cleanupRetryAndBetaLockAccepted=true`',
  '`selectedGpuL4Accepted=true`',
  '`scaleToZeroCostPostureAccepted=true`',
  '`minInstancesZeroAccepted=true`',
  '`initialMaxInstancesOneAccepted=true`',
  '`cpuFallbackDisabledAccepted=true`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_APPROVAL
const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PLAN

assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanDecision,
  plan.decision,
)
assert.equal(approval.approvalScope.decisionRecorded, true)
assert.equal(approval.approvalScope.acceptsApprovedFixtureInferencePlanForFuturePreflight, true)
assert.equal(approval.approvalScope.approvedFixtureInferenceApprovalRequired, false)
assert.equal(approval.approvalScope.approvedFixtureInferenceApprovalRecorded, true)
assert.equal(approval.approvalScope.approvedFixtureInferenceAcceptedForPreflight, true)
assert.equal(approval.approvalScope.approvedFixtureInferencePreflightRequired, true)
assert.equal(approval.approvalScope.approvesFutureSingleApprovedFixtureInferencePreflight, true)
assert.equal(approval.approvalScope.approvesFutureModelImportPreflightCheck, true)
assert.equal(approval.approvalScope.approvesFutureModelLoadPreflightCheck, true)
assert.equal(approval.approvalScope.approvesFutureVllmPreflightCheck, true)
assert.equal(approval.approvalScope.approvesFuturePrivateInvokePreflightCheck, true)
assert.equal(approval.approvalScope.approvesFutureResponseSchemaPreflightCheck, true)
assert.equal(approval.approvalScope.approvesInferenceNow, false)
assert.equal(approval.approvalScope.approvesModelImportNow, false)
assert.equal(approval.approvalScope.approvesModelLoadNow, false)
assert.equal(approval.approvalScope.approvesVllmInitializationNow, false)
assert.equal(approval.approvalScope.approvesPromptProcessingNow, false)
assert.equal(approval.approvalScope.approvesForwardPassNow, false)
assert.equal(approval.approvalScope.approvesWorkerDispatchNow, false)
assert.equal(approval.approvalScope.approvesCloudRunInvocationNow, false)
assert.equal(approval.approvalScope.approvesGeneratedAssetsNow, false)
assert.equal(approval.approvalScope.approvesSupabaseMutationNow, false)
assert.equal(approval.approvalScope.approvesCreditSpendNow, false)
assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(approval.acceptedApprovedFixtureInferencePlanEvidence.length, 9)
assert.equal(
  approval.acceptedApprovedFixtureInferencePlanEvidence.every(
    (entry) => entry.acceptedForFuturePreflight && !entry.executionAllowedNow,
  ),
  true,
)
assert.equal(approval.approvedFutureInferenceAttemptBoundaries.maxApprovedFixtureRequests, 1)
assert.equal(approval.approvedFutureInferenceAttemptBoundaries.approvalRecordedBeforePreflight, true)
assert.equal(
  approval.approvedFutureInferenceAttemptBoundaries.futurePreflightMayVerifyInferenceEnvelopeOnly,
  true,
)
assert.equal(approval.approvedFutureInferenceAttemptBoundaries.futurePreflightMayImportModelNow, false)
assert.equal(approval.approvedFutureInferenceAttemptBoundaries.futurePreflightMayLoadModelNow, false)
assert.equal(approval.approvedFutureInferenceAttemptBoundaries.futurePreflightMayInitializeVllmNow, false)
assert.equal(approval.approvedFutureInferenceAttemptBoundaries.futurePreflightMayInvokeCloudRunNow, false)
assert.equal(approval.approvedFutureInferenceAttemptBoundaries.futurePreflightMayRunForwardPassNow, false)
assert.equal(approval.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(
  approval.sourceOfTruthRules.privateStorageManifestChecksumApprovedSnapshotRefsRequired,
  true,
)
assert.equal(approval.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(approval.sourceOfTruthRules.rawWorkerPromptAllowed, false)
assert.equal(approval.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(approval.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(approval.sourceOfTruthRules.frontendMayResolvePrivateInvokeCredentials, false)
assert.equal(approval.sourceOfTruthRules.frontendMayCallCloudRun, false)
assert.equal(approval.sourceOfTruthRules.frontendMayCreateGeneratedAssets, false)
assertFalseRuntimeFlags(approval.runtimeFlags)

const expectedTrueRuntimeFlags: Array<keyof typeof approval.runtimeFlags> = [
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRecorded',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRecorded',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAcceptedForPreflight',
  'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRequired',
  'approvedSnapshotAndFixtureScopeAccepted',
  'persistedWorkerDispatchRefsAccepted',
  'privateSourceOfTruthRefsAccepted',
  'qwenRequestEnvelopeAccepted',
  'privateInvokeTransportDependenciesAccepted',
  'qwenRuntimeInferenceBoundaryAccepted',
  'responseSchemaAndResultHandlingAccepted',
  'qaAuditCostAndCreditNoSpendAccepted',
  'cleanupRetryAndBetaLockAccepted',
  'selectedGpuL4Accepted',
  'scaleToZeroCostPostureAccepted',
  'minInstancesZeroAccepted',
  'initialMaxInstancesOneAccepted',
  'cpuFallbackDisabledAccepted',
]

for (const key of expectedTrueRuntimeFlags) {
  assert.equal(approval.runtimeFlags[key], true, `${key} must be true`)
}
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired,
  false,
)

const valueFindings = scanValues(approval, ['approval'])
assert.deepEqual(valueFindings, [], `Forbidden values in approval data: ${valueFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: approval.decision,
      approvedRuntimeGpu: approval.approvedRuntimePosture.gpu,
      costPosture: approval.approvedRuntimePosture.costPosture,
      acceptedRows: approval.acceptedApprovedFixtureInferencePlanEvidence.length,
      inferenceRun: approval.runtimeFlags.inferenceRun,
      approvedFixtureInferencePreflightExecuted:
        approval.runtimeFlags.approvedFixtureInferencePreflightExecuted,
      nextPrompt: approval.nextPrompt,
    },
    null,
    2,
  ),
)
