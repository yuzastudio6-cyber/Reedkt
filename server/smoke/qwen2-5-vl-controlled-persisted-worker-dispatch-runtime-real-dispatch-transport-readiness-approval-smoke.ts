import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_approval_accepted_preflight_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CR-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-PREFLIGHT-PLAN: plan controlled Qwen real-dispatch transport preflight, no Cloud Run invocation/no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|transportDependenciesEnabledNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRequired',
    'readyForRealWorkerDispatch',
    'transportDependenciesEnabledNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan-smoke.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.md')
for (const phrase of [
  DECISION,
  'transport readiness plan recorded upstream: true',
  'transport readiness approval recorded: true',
  'transport readiness accepted for future preflight planning: true',
  'transport preflight plan required: true',
  'service URL resolution approved now: false',
  'audience resolution approved now: false',
  'identity-token fetch approved now: false',
  'auth-header creation approved now: false',
  'private request send approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'generated asset creation approved now: false',
  'approved snapshot transport scope',
  'service URL and audience resolution',
  'identity token and auth header',
  'private request send',
  'response classification and persistence',
  'QA, audit, cost, and credit readiness',
  'billing credit no-spend boundary',
  'retry, timeout, cleanup, and rollback',
  'beta and production public-artifact lock',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Workers execute approved snapshots, not raw chat.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalAcceptedForPreflightPlanning=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired=true`',
  '`serviceUrlResolvedNow=false`',
  '`audienceResolvedNow=false`',
  '`identityTokenFetched=false`',
  '`authHeaderCreated=false`',
  '`privateRequestSendAllowedNow=false`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_APPROVAL
assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessPlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_PLAN.decision,
)
assert.equal(approval.readinessApproval.decisionRecorded, true)
assert.equal(
  approval.readinessApproval.acceptsTransportReadinessPlanForFuturePreflightPlanning,
  true,
)
assert.equal(approval.readinessApproval.controlledTransportPreflightPlanRequired, true)
assert.equal(approval.readinessApproval.approvesServiceUrlResolutionNow, false)
assert.equal(approval.readinessApproval.approvesAudienceResolutionNow, false)
assert.equal(approval.readinessApproval.approvesIdentityTokenFetchNow, false)
assert.equal(approval.readinessApproval.approvesAuthHeaderCreationNow, false)
assert.equal(approval.readinessApproval.approvesPrivateRequestSendNow, false)
assert.equal(approval.readinessApproval.approvesCloudRunInvocationNow, false)
assert.equal(approval.readinessApproval.approvesQwenInferenceNow, false)
assert.equal(approval.acceptedReadinessEvidence.length, 9)
assert.deepEqual(
  approval.acceptedReadinessEvidence.map((entry) => entry.id),
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_PLAN.readinessPlan.map(
    (entry) => entry.id,
  ),
)
assert.equal(
  approval.acceptedReadinessEvidence.every(
    (entry) => entry.acceptedForPreflightPlanning === true && entry.executionAllowedNow === false,
  ),
  true,
)
assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(approval.futurePreflightPlanningScope.mayExecutePreflightNow, false)
assert.equal(approval.futurePreflightPlanningScope.mayExecuteTransportNow, false)
assert.equal(approval.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(approval.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(approval.sourceOfTruthRules.rawWorkerPromptAllowed, false)
assert.equal(approval.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(approval.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRecorded,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalAcceptedForPreflightPlanning,
  true,
)
assert.equal(
  approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired,
  true,
)
assertFalseRuntimeFlags(approval.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ approval })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in real-dispatch transport readiness approval data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: approval.decision,
  acceptedReadinessEvidenceCount: approval.acceptedReadinessEvidence.length,
  transportReadinessApprovalRecorded:
    approval.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRecorded,
  transportPreflightPlanRequired:
    approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired,
  readyForRealWorkerDispatch: approval.runtimeFlags.readyForRealWorkerDispatch,
  serviceUrlResolvedNow: approval.runtimeFlags.serviceUrlResolvedNow,
  identityTokenFetched: approval.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: approval.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: approval.runtimeFlags.inferenceRun,
  generatedAssetsCreated: approval.runtimeFlags.generatedAssetsCreated,
  nextPrompt: approval.nextPrompt,
}, null, 2))
