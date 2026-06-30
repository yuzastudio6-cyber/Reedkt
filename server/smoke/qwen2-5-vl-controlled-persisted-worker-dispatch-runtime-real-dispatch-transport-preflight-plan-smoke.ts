import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_preflight_plan_recorded_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CS-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-PREFLIGHT-APPROVAL: approve controlled Qwen real-dispatch transport preflight, no Cloud Run invocation/no inference/no generated assets/no beta'

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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval-smoke.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'model-routing-policy.md',
  'intent-led-edit-planning.md',
  'tool-usage-planning-ui.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.md')
for (const phrase of [
  DECISION,
  'transport readiness approval recorded upstream: true',
  'transport preflight plan recorded: true',
  'transport preflight approval required: true',
  'service URL resolution planned for future preflight: true',
  'audience resolution planned for future preflight: true',
  'identity-token dependency planned for future preflight: true',
  'auth-header redaction planned for future preflight: true',
  'private request envelope planned for future preflight: true',
  'timeout, retry, and idempotency planned for future preflight: true',
  'response classification planned for future preflight: true',
  'service URL resolution executed now: false',
  'audience resolution executed now: false',
  'identity-token fetch executed now: false',
  'auth-header creation executed now: false',
  'private request send executed now: false',
  'Cloud Run invocation executed now: false',
  'Qwen inference executed now: false',
  'approved snapshot and private source refs',
  'service URL resolver',
  'audience resolver',
  'identity-token dependency',
  'auth-header redaction',
  'private request envelope',
  'timeout retry idempotency',
  'response classification',
  'persistence QA audit cost credit',
  'cleanup rollback beta production lock',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Workers execute approved snapshots, not raw chat.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRequired=true`',
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
  'what went wrong',
  NEXT_PROMPT,
]) {
  assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_APPROVAL.decision,
)
assert.equal(plan.preflightPlan.decisionRecorded, true)
assert.equal(plan.preflightPlan.controlledTransportPreflightPlanRecorded, true)
assert.equal(plan.preflightPlan.controlledTransportPreflightApprovalRequired, true)
assert.equal(plan.preflightPlan.mayExecutePreflightNow, false)
assert.equal(plan.preflightPlan.mayResolveServiceUrlNow, false)
assert.equal(plan.preflightPlan.mayResolveAudienceNow, false)
assert.equal(plan.preflightPlan.mayFetchIdentityTokenNow, false)
assert.equal(plan.preflightPlan.mayCreateAuthHeaderNow, false)
assert.equal(plan.preflightPlan.maySendPrivateRequestNow, false)
assert.equal(plan.preflightPlan.mayInvokeCloudRunNow, false)
assert.equal(plan.preflightPlan.mayRunQwenInferenceNow, false)
assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(plan.selectedRuntime.minInstances, 0)
assert.equal(plan.selectedRuntime.initialMaxInstances, 1)
assert.equal(plan.selectedRuntime.cpuFallbackAllowed, false)
assert.deepEqual(
  plan.preflightChecks.map((checkEntry) => checkEntry.id),
  [
    'approved_snapshot_and_private_source_refs',
    'service_url_resolver',
    'audience_resolver',
    'identity_token_dependency',
    'auth_header_redaction',
    'private_request_envelope',
    'timeout_retry_idempotency',
    'response_classification',
    'persistence_qa_audit_cost_credit',
    'cleanup_rollback_beta_production_lock',
  ],
)
assert.equal(plan.preflightChecks.every((checkEntry) => checkEntry.plannedForFuturePreflight), true)
assert.equal(plan.preflightChecks.every((checkEntry) => !checkEntry.currentExecutionAllowed), true)
assert.equal(plan.futurePreflightExecutionRules.workersExecuteApprovedSnapshots, true)
assert.equal(plan.futurePreflightExecutionRules.rawChatWorkerExecutionAllowed, false)
assert.equal(plan.futurePreflightExecutionRules.rawWorkerPromptAllowed, false)
assert.equal(plan.futurePreflightExecutionRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(plan.futurePreflightExecutionRules.frontendMayCallCloudRun, false)
assert.equal(plan.futurePreflightExecutionRules.noCallPreflightApprovalRequiredBeforeExecution, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRequired, true)
assert.equal(plan.runtimeFlags.approvedSnapshotTransportPreflightPlanned, true)
assert.equal(plan.runtimeFlags.serviceUrlResolutionPreflightPlanned, true)
assert.equal(plan.runtimeFlags.audienceResolutionPreflightPlanned, true)
assert.equal(plan.runtimeFlags.identityTokenDependencyPreflightPlanned, true)
assert.equal(plan.runtimeFlags.authHeaderRedactionPreflightPlanned, true)
assert.equal(plan.runtimeFlags.privateRequestEnvelopePreflightPlanned, true)
assert.equal(plan.runtimeFlags.timeoutRetryIdempotencyPreflightPlanned, true)
assert.equal(plan.runtimeFlags.responseClassificationPreflightPlanned, true)
assert.equal(plan.runtimeFlags.persistenceQaAuditCostCreditPreflightPlanned, true)
assert.equal(plan.runtimeFlags.cleanupRollbackBetaProductionLockPreflightPlanned, true)
assertFalseRuntimeFlags(plan.runtimeFlags as JsonRecord)

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen transport preflight plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(
  JSON.stringify(
    {
      mode: plan.mode,
      decision: plan.decision,
      preflightCheckCount: plan.preflightChecks.length,
      selectedGpu: plan.selectedRuntime.gpu,
      scaleToZero: plan.selectedRuntime.costPosture,
      serviceUrlResolvedNow: plan.runtimeFlags.serviceUrlResolvedNow,
      identityTokenFetched: plan.runtimeFlags.identityTokenFetched,
      privateRequestSendAllowedNow: plan.runtimeFlags.privateRequestSendAllowedNow,
      cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
      inferenceRun: plan.runtimeFlags.inferenceRun,
      generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
      nextPrompt: plan.nextPrompt,
    },
    null,
    2,
  ),
)
