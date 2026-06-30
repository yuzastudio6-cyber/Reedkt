import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_attempt_approval_accepted_attempt_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DB-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-ATTEMPT: run one controlled Qwen approved-fixture inference attempt through persisted worker dispatch, no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|approvedFixtureInferenceAttemptExecutedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRequired',
    'readyForRealWorkerDispatch',
    'approvedFixtureInferenceAttemptExecutedNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight-smoke.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.md',
)
for (const phrase of [
  DECISION,
  'approved-fixture inference preflight recorded: true',
  'approved-fixture inference preflight passed: true',
  'controlled approved-fixture inference attempt approval required: false',
  'controlled approved-fixture inference attempt approval recorded: true',
  'controlled approved-fixture inference attempt approved for future bounded attempt: true',
  'controlled approved-fixture inference attempt required: true',
  'future real job creation during attempt approved: true',
  'future lease claim during attempt approved: true',
  'future idempotency record during attempt approved: true',
  'future private invoke runtime values during attempt approved: true',
  'future Cloud Run invocation during attempt approved: true',
  'future model import during attempt approved: true',
  'future model load during attempt approved: true',
  'future vLLM initialization during attempt approved: true',
  'future prompt processing during attempt approved: true',
  'future forward pass during attempt approved: true',
  'future single fixture inference during attempt approved: true',
  'real job creation approved now: false',
  'lease claim approved now: false',
  'idempotency record approved now: false',
  'private invoke runtime values approved now: false',
  'Cloud Run invocation approved now: false',
  'model import approved now: false',
  'model load approved now: false',
  'vLLM initialization approved now: false',
  'prompt processing approved now: false',
  'forward pass approved now: false',
  'inference approved now: false',
  'generated asset creation approved now: false',
  'signed URL creation approved now: false',
  'approved snapshot and fixture scope',
  'persisted worker dispatch refs',
  'private source-of-truth refs',
  'Qwen request envelope',
  'private invoke transport dependencies',
  'Qwen runtime inference boundary',
  'response schema and result handling',
  'QA audit cost and credit no-spend',
  'cleanup retry and beta lock',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovedForFutureBoundedAttempt=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptRequired=true`',
  '`approvedFixtureInferenceAttemptExecutedNow=false`',
  '`realJobCreated=false`',
  '`realLeaseClaimed=false`',
  '`idempotencyRowCreated=false`',
  '`cloudRunInvocationAttempted=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`vllmEngineInitialized=false`',
  '`promptProcessed=false`',
  '`forwardPassRun=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'what this approval fixes',
  NEXT_PROMPT,
]) {
  assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL
const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PREFLIGHT

assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightDecision,
  preflight.decision,
)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.decisionRecorded, true)
assert.equal(
  approval.approvedFixtureInferenceAttemptApproval
    .acceptsPreflightForFutureControlledApprovedFixtureInferenceAttempt,
  true,
)
assert.equal(
  approval.approvedFixtureInferenceAttemptApproval
    .controlledApprovedFixtureInferenceAttemptApprovalRequired,
  false,
)
assert.equal(
  approval.approvedFixtureInferenceAttemptApproval
    .controlledApprovedFixtureInferenceAttemptApprovalRecorded,
  true,
)
assert.equal(
  approval.approvedFixtureInferenceAttemptApproval
    .controlledApprovedFixtureInferenceAttemptApprovedForFutureBoundedAttempt,
  true,
)
assert.equal(
  approval.approvedFixtureInferenceAttemptApproval.controlledApprovedFixtureInferenceAttemptRequired,
  true,
)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureRealJobCreationDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureLeaseClaimDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureIdempotencyRecordDuringAttempt, true)
assert.equal(
  approval.approvedFixtureInferenceAttemptApproval.approvesFuturePrivateInvokeRuntimeValuesDuringAttempt,
  true,
)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureCloudRunInvocationDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureModelImportDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureModelLoadDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureVllmInitializationDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFuturePromptProcessingDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureForwardPassDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesFutureSingleFixtureInferenceDuringAttempt, true)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesCloudRunInvocationNow, false)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesModelImportNow, false)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesModelLoadNow, false)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesVllmInitializationNow, false)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesPromptProcessingNow, false)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesForwardPassNow, false)
assert.equal(approval.approvedFixtureInferenceAttemptApproval.approvesInferenceNow, false)
assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(approval.acceptedApprovedFixtureInferenceAttemptApprovalAreas.length, 9)
assert.equal(
  approval.acceptedApprovedFixtureInferenceAttemptApprovalAreas.every(
    (entry) => entry.acceptedForFutureAttempt,
  ),
  true,
)
assert.equal(
  approval.acceptedApprovedFixtureInferenceAttemptApprovalAreas.every(
    (entry) => !entry.runtimeValueResolvedNow,
  ),
  true,
)
assert.equal(
  approval.acceptedApprovedFixtureInferenceAttemptApprovalAreas.every(
    (entry) => !entry.modelRuntimeTouchedNow,
  ),
  true,
)
assert.equal(
  approval.acceptedApprovedFixtureInferenceAttemptApprovalAreas.every((entry) => !entry.requestSentNow),
  true,
)
assert.equal(
  approval.acceptedApprovedFixtureInferenceAttemptApprovalAreas.every(
    (entry) => !entry.executionAllowedNow,
  ),
  true,
)
assert.equal(
  approval.futureApprovedFixtureInferenceAttemptRules
    .approvedFixtureInferenceAttemptApprovalRecordedBeforeAttempt,
  true,
)
assert.equal(
  approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayCreateOnePersistedWorkerDispatchEnvelope,
  true,
)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayInvokeCloudRunOnce, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayImportModel, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayLoadModel, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayInitializeVllm, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayProcessBoundedPrompt, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayRunOneForwardPass, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayRunOneFixtureInference, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMustUseApprovedFixtureOnly, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMustNotCreateGeneratedAssets, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMustNotCreateSignedUrls, true)
assert.equal(approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMustNotCreatePublicArtifacts, true)
assertFalseRuntimeFlags(approval.runtimeFlags)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRecorded,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightPassed,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRecorded,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovedForFutureBoundedAttempt,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptRequired,
  true,
)
assert.equal(approval.runtimeFlags.approvedSnapshotAndFixtureScopeAttemptApproved, true)
assert.equal(approval.runtimeFlags.persistedWorkerDispatchRefsAttemptApproved, true)
assert.equal(approval.runtimeFlags.privateSourceOfTruthRefsAttemptApproved, true)
assert.equal(approval.runtimeFlags.qwenRequestEnvelopeAttemptApproved, true)
assert.equal(approval.runtimeFlags.privateInvokeTransportDependenciesAttemptApproved, true)
assert.equal(approval.runtimeFlags.qwenRuntimeInferenceBoundaryAttemptApproved, true)
assert.equal(approval.runtimeFlags.responseSchemaAndResultHandlingAttemptApproved, true)
assert.equal(approval.runtimeFlags.qaAuditCostAndCreditNoSpendAttemptApproved, true)
assert.equal(approval.runtimeFlags.cleanupRetryAndBetaLockAttemptApproved, true)
assert.equal(approval.runtimeFlags.selectedGpuL4Accepted, true)
assert.equal(approval.runtimeFlags.scaleToZeroCostPostureAccepted, true)
assert.equal(approval.runtimeFlags.minInstancesZeroAccepted, true)
assert.equal(approval.runtimeFlags.initialMaxInstancesOneAccepted, true)
assert.equal(approval.runtimeFlags.cpuFallbackDisabledAccepted, true)

const forbiddenDataFindings = scanValues({ approval, preflight })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen approved-fixture inference attempt approval data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: approval.decision,
  acceptedAttemptApprovalAreaCount:
    approval.acceptedApprovedFixtureInferenceAttemptApprovalAreas.length,
  futureAttemptMayRunOneFixtureInference:
    approval.futureApprovedFixtureInferenceAttemptRules.futureAttemptMayRunOneFixtureInference,
  inferenceRun: approval.runtimeFlags.inferenceRun,
  generatedAssetsCreated: approval.runtimeFlags.generatedAssetsCreated,
  selectedGpu: approval.approvedRuntimePosture.gpu,
  costPosture: approval.approvedRuntimePosture.costPosture,
  nextPrompt: approval.nextPrompt,
}, null, 2))
