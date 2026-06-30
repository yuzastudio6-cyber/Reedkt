import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_EXECUTION_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_EXECUTION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_execution_approval_accepted_preflight_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DI-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-PREFLIGHT: verify one bounded approved-fixture private invoke preflight through the persisted job and lease bridge, no Cloud Run invocation/no inference/no generated assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInvokeApprovedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'privateInvokeReady',
    'approvedFixturePrivateInvokeApprovedNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'async-edit-work-graph.md',
  'editing-asset-manifest.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval-smoke.ts',
  'package script mismatch',
)

const docPath =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.md'
const doc = read(docPath)
for (const phrase of [
  DECISION,
  'future preflight only',
  'approved-fixture private invoke execution approval recorded: true',
  'approved-fixture private invoke accepted for preflight: true',
  'approved-fixture private invoke preflight required: true',
  'private invoke approved now: false',
  'worker dispatch approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'generated assets approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'future preflight may verify private invoke envelope only: true',
  'future preflight may invoke Cloud Run now: false',
  'future preflight may import model now: false',
  'future preflight may load model now: false',
  'future preflight may initialize vLLM now: false',
  'future preflight may run forward pass now: false',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAcceptedForPreflight=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRequired=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRecorded=false`',
  '`readyForApprovedFixturePrivateInvokePreflight=true`',
  '`privateInvokeReady=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
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
  check(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assertNoForbiddenText(docPath)
assertNoForbiddenText(
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.ts',
)

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_EXECUTION_APPROVAL
const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_EXECUTION_PLAN

assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanDecision,
  plan.decision,
)
assert.equal(approval.approvalScope.decisionRecorded, true)
assert.equal(approval.approvalScope.acceptsApprovedFixturePrivateInvokeExecutionPlanForFuturePreflight, true)
assert.equal(approval.approvalScope.approvedFixturePrivateInvokeExecutionApprovalRequired, false)
assert.equal(approval.approvalScope.approvedFixturePrivateInvokeExecutionApprovalRecorded, true)
assert.equal(approval.approvalScope.approvedFixturePrivateInvokeAcceptedForPreflight, true)
assert.equal(approval.approvalScope.approvedFixturePrivateInvokePreflightRequired, true)
assert.equal(approval.approvalScope.approvesFutureSingleApprovedFixturePrivateInvokePreflight, true)
assert.equal(approval.approvalScope.approvesFutureApprovedSnapshotBindingPreflightCheck, true)
assert.equal(approval.approvalScope.approvesFuturePersistedJobIdempotencyLeasePreflightCheck, true)
assert.equal(approval.approvalScope.approvesFuturePrivateInvokeTransportPreflightCheck, true)
assert.equal(approval.approvalScope.approvesFutureQwenRuntimeBoundaryPreflightCheck, true)
assert.equal(approval.approvalScope.approvesPrivateInvokeNow, false)
assert.equal(approval.approvalScope.approvesWorkerDispatchNow, false)
assert.equal(approval.approvalScope.approvesCloudRunInvocationNow, false)
assert.equal(approval.approvalScope.approvesModelImportNow, false)
assert.equal(approval.approvalScope.approvesModelLoadNow, false)
assert.equal(approval.approvalScope.approvesVllmInitializationNow, false)
assert.equal(approval.approvalScope.approvesPromptProcessingNow, false)
assert.equal(approval.approvalScope.approvesForwardPassNow, false)
assert.equal(approval.approvalScope.approvesQwenInferenceNow, false)
assert.equal(approval.approvalScope.approvesGeneratedAssetsNow, false)
assert.equal(approval.approvalScope.approvesSupabaseMutationNow, false)
assert.equal(approval.approvalScope.approvesCreditSpendNow, false)
assert.equal(approval.approvalScope.approvesBetaNow, false)
assert.equal(approval.approvalScope.approvesProductionNow, false)

assert.equal(approval.acceptedPlanEvidence.length, 13)
for (const entry of approval.acceptedPlanEvidence) {
  assert.equal(entry.acceptedForFuturePreflight, true)
  assert.equal(entry.executionAllowedNow, false)
  assert.ok(entry.requiredEvidence.length > 0)
}

assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(approval.approvedFuturePreflightBoundaries.approvalRecordedBeforePreflight, true)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayVerifyPrivateInvokeEnvelopeOnly, true)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayResolveServiceUrlNow, false)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayFetchIdentityTokenNow, false)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayCreateAuthHeaderNow, false)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayInvokeCloudRunNow, false)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayImportModelNow, false)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayLoadModelNow, false)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayInitializeVllmNow, false)
assert.equal(approval.approvedFuturePreflightBoundaries.futurePreflightMayRunForwardPassNow, false)
assert.equal(approval.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(approval.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(approval.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(approval.sourceOfTruthRules.frontendMayCallCloudRun, false)
assert.equal(approval.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)

assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRequired,
  false,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAcceptedForPreflight,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRequired,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRecorded,
  false,
)
assert.equal(approval.runtimeFlags.readyForApprovedFixturePrivateInvokePreflight, true)
assertFalseRuntimeFlags(approval.runtimeFlags as JsonRecord)

const forbiddenFindings = scanValues(approval)
assert.deepEqual(forbiddenFindings, [], `Forbidden values in approval spec: ${forbiddenFindings.join('; ')}`)

console.log(JSON.stringify({
  ok: true,
  decision: approval.decision,
  acceptedPlanEvidenceCount: approval.acceptedPlanEvidence.length,
  selectedGpu: approval.approvedRuntimePosture.gpu,
  costPosture: approval.approvedRuntimePosture.costPosture,
  executionApprovalRecorded:
    approval.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded,
  preflightRequired:
    approval.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRequired,
  readyForApprovedFixturePrivateInvokePreflight:
    approval.runtimeFlags.readyForApprovedFixturePrivateInvokePreflight,
  cloudRunInvocationAttempted: approval.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: approval.runtimeFlags.inferenceRun,
  generatedAssetsCreated: approval.runtimeFlags.generatedAssetsCreated,
  nextPrompt: approval.nextPrompt,
}))
