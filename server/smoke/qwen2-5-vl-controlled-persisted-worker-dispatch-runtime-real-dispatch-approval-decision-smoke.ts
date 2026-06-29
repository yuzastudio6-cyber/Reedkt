import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_decision_accepted_execution_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CB-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-PLAN: plan first real persisted Qwen worker dispatch attempt, no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan-smoke.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md')
for (const phrase of [
  DECISION,
  'real-dispatch approval plan accepted: true',
  'real-dispatch approval decision recorded: true',
  'accepted for execution planning only: true',
  'controlled real-dispatch execution plan required: true',
  'real worker dispatch approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'generated asset creation approved now: false',
  'approved snapshot fixture scope',
  'credit reservation no-spend precondition',
  'service-role job lease claim scope',
  'idempotency duplicate source guard',
  'private invoke transport execution conditions',
  'Qwen request and response schema',
  'result persistence without generated assets',
  'QA, audit, cost, and observability',
  'rollback, cleanup, and credit release',
  'beta, production, and public artifact lock',
  '`qwen_fixture_visual_metadata_v1`',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAcceptedForExecutionPlanning=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired=true`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.ts',
]) {
  assertNoForbiddenText(file)
}

const decision =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION
assert.equal(decision.decision, DECISION)
assert.equal(decision.nextPrompt, NEXT_PROMPT)
assert.equal(
  decision.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN.decision,
)
assert.equal(decision.approvalDecision.realDispatchApprovalPlanAccepted, true)
assert.equal(decision.approvalDecision.decisionRecorded, true)
assert.equal(decision.approvalDecision.acceptedForExecutionPlanningOnly, true)
assert.equal(decision.approvalDecision.controlledRealDispatchExecutionPlanRequired, true)
assert.equal(decision.approvalDecision.approvesRealDispatchNow, false)
assert.equal(decision.approvalDecision.approvesWorkerLeaseClaimNow, false)
assert.equal(decision.approvalDecision.approvesCloudRunInvocationNow, false)
assert.equal(decision.approvalDecision.approvesQwenInferenceNow, false)
assert.equal(decision.approvalDecision.approvesGeneratedAssetsNow, false)
assert.equal(decision.approvalDecision.approvesBetaNow, false)
assert.equal(decision.approvalDecision.approvesProductionNow, false)
assert.equal(decision.acceptedRealDispatchApprovalEvidence.length, 10)
for (const entry of decision.acceptedRealDispatchApprovalEvidence) {
  assert.equal(entry.acceptedForExecutionPlanning, true)
  assert.equal(entry.executionAllowedNow, false)
  check(entry.requiredEvidence.length >= 3, `${entry.id} must preserve approval evidence detail`)
}
assert.equal(decision.requiredControlledRealDispatchExecutionPlan.length, 6)
for (const entry of decision.requiredControlledRealDispatchExecutionPlan) {
  assert.equal(entry.executionAllowedNow, false)
  check(entry.requiredPlan.length >= 2, `${entry.id} must include execution-plan details`)
}
assert.equal(decision.approvedRuntimePosture.selectedGpu, 'nvidia_l4')
assert.equal(decision.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(decision.approvedRuntimePosture.minInstances, 0)
assert.equal(decision.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(decision.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(decision.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanAccepted, true)
assert.equal(decision.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired, false)
assert.equal(decision.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRecorded, true)
assert.equal(
  decision.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAcceptedForExecutionPlanning,
  true,
)
assert.equal(decision.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired, true)
assertFalseRuntimeFlags(decision.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ decision })
assert.deepEqual(forbiddenDataFindings, [], `Forbidden data values: ${forbiddenDataFindings.join('; ')}`)

console.log(JSON.stringify({
  ok: true,
  decision: decision.decision,
  approvalPlanAccepted: decision.approvalDecision.realDispatchApprovalPlanAccepted,
  acceptedForExecutionPlanningOnly: decision.approvalDecision.acceptedForExecutionPlanningOnly,
  controlledRealDispatchExecutionPlanRequired:
    decision.approvalDecision.controlledRealDispatchExecutionPlanRequired,
  readyForRealWorkerDispatch: decision.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: decision.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: decision.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: decision.runtimeFlags.inferenceRun,
  generatedAssetsCreated: decision.runtimeFlags.generatedAssetsCreated,
  nextPrompt: decision.nextPrompt,
}))
