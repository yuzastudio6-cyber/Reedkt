import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_EXECUTION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_execution_plan_recorded_execution_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DH-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-EXECUTION-APPROVAL: approve one bounded approved-fixture private invoke execution plan through the persisted job and lease bridge, no Cloud Run invocation/no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInvokeApprovedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan-smoke.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan-smoke.ts',
  'package script mismatch',
)

const docPath =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.md'
const doc = read(docPath)
for (const phrase of [
  DECISION,
  'approved-fixture private invoke readiness review accepted: true',
  'approved-fixture private invoke execution plan recorded: true',
  'approved-fixture private invoke execution approval required: true',
  'ready for execution approval planning: true',
  'private invoke approved now: false',
  'worker dispatch approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'generated asset creation approved now: false',
  '| approved fixture selection |',
  '| approved snapshot binding |',
  '| persisted job reference |',
  '| idempotency guard |',
  '| transactional lease claim |',
  '| sanitized runtime event |',
  '| worker claim handoff |',
  '| private invoke transport |',
  '| Cloud Run L4 request |',
  '| Qwen runtime boundary |',
  '| response schema handling |',
  '| QA/audit/cost/credit |',
  'max approved fixture private invoke attempts: 1',
  'raw chat worker execution allowed: false',
  'raw worker prompt allowed: false',
  'frontend invocation allowed: false',
  'signed URLs as source of truth allowed: false',
  'public URLs as source of truth allowed: false',
  'NVIDIA L4 remains the cost-controlled target',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRequired=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded=false`',
  '`readyForApprovedFixturePrivateInvokeExecutionApproval=true`',
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
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.ts',
)

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_EXECUTION_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_READINESS_REVIEW.decision,
)
assert.equal(plan.planScope.approvedFixturePrivateInvokeReadinessReviewAccepted, true)
assert.equal(plan.planScope.approvedFixturePrivateInvokeExecutionPlanRecorded, true)
assert.equal(plan.planScope.approvedFixturePrivateInvokeExecutionApprovalRequired, true)
assert.equal(plan.planScope.readyForApprovedFixturePrivateInvokeExecutionApproval, true)
assert.equal(plan.planScope.approvesExecutionNow, false)
assert.equal(plan.planScope.approvesCloudRunInvocationNow, false)
assert.equal(plan.planScope.approvesQwenInferenceNow, false)
assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(plan.selectedRuntime.minInstances, 0)
assert.equal(plan.selectedRuntime.initialMaxInstances, 1)
assert.equal(plan.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(plan.boundedFutureInvokeEnvelope.length, 13)
assert.deepEqual(
  plan.boundedFutureInvokeEnvelope.map((area) => area.currentExecutionAllowed),
  Array.from({ length: 13 }, () => false),
)
assert.equal(plan.futureAttemptBoundaries.maxApprovedFixturePrivateInvokeAttempts, 1)
assert.equal(plan.futureAttemptBoundaries.rawChatWorkerExecutionAllowed, false)
assert.equal(plan.futureAttemptBoundaries.rawWorkerPromptAllowed, false)
assert.equal(plan.futureAttemptBoundaries.frontendInvocationAllowed, false)
assert.equal(plan.futureAttemptBoundaries.executionApprovalRequiredBeforePreflight, true)
assert.equal(plan.futureAttemptBoundaries.preflightRequiredBeforeAttempt, true)
assert.equal(plan.futureAttemptBoundaries.attemptResultReviewRequired, true)
assert.equal(plan.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(plan.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(plan.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.frontendMayCallCloudRun, false)
assert.equal(plan.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRequired, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRequired, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded, false)
assert.equal(plan.runtimeFlags.readyForApprovedFixturePrivateInvokeExecutionApproval, true)
assert.equal(plan.runtimeFlags.approvedFixtureSelectionPlanned, true)
assert.equal(plan.runtimeFlags.approvedSnapshotBindingPlanned, true)
assert.equal(plan.runtimeFlags.persistedJobReferencePlanned, true)
assert.equal(plan.runtimeFlags.idempotencyGuardPlanned, true)
assert.equal(plan.runtimeFlags.transactionalLeaseClaimPlanned, true)
assert.equal(plan.runtimeFlags.privateInvokeTransportPlanned, true)
assert.equal(plan.runtimeFlags.cloudRunL4RequestPlanned, true)
assert.equal(plan.runtimeFlags.qwenRuntimeBoundaryPlanned, true)
assert.equal(plan.runtimeFlags.responseSchemaHandlingPlanned, true)
assert.equal(plan.runtimeFlags.qaAuditCostCreditNoSpendPlanned, true)
assert.equal(plan.runtimeFlags.cleanupRollbackRetryPlanned, true)
assertFalseRuntimeFlags(plan.runtimeFlags)

const forbiddenDataFindings = scanValues({
  plan,
  readinessReview:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_READINESS_REVIEW,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen approved-fixture private invoke execution plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: plan.decision,
      executionPlanRecorded: plan.planScope.approvedFixturePrivateInvokeExecutionPlanRecorded,
      executionApprovalRequired: plan.planScope.approvedFixturePrivateInvokeExecutionApprovalRequired,
      envelopeStepCount: plan.boundedFutureInvokeEnvelope.length,
      selectedGpu: plan.selectedRuntime.gpu,
      costPosture: plan.selectedRuntime.costPosture,
      privateInvokeReady: plan.runtimeFlags.privateInvokeReady,
      inferenceRun: plan.runtimeFlags.inferenceRun,
      generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
      nextPrompt: plan.nextPrompt,
    },
    null,
    2,
  ),
)
