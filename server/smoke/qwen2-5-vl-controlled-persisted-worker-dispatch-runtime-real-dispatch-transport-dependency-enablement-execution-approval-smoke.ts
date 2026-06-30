import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_approval_accepted_preflight_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CM-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-PREFLIGHT: verify controlled Qwen real-dispatch transport dependency enablement execution preflight, no Cloud Run invocation/no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|transportDependenciesEnabledNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan-smoke.ts',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval.md')
for (const phrase of [
  DECISION,
  'transport dependency enablement execution plan accepted for controlled preflight: true',
  'controlled transport dependency enablement execution approval recorded: true',
  'controlled transport dependency enablement execution preflight required: true',
  'dependency enablement approved now: false',
  'real backend lease claim approved now: false',
  'injected private invoke dependencies approved now: false',
  'service URL resolution approved now: false',
  'audience resolution approved now: false',
  'identity token fetch approved now: false',
  'private request send approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'approved snapshot and private source precheck',
  'no-spend credit and cost precheck',
  'backend lease and claim enablement',
  'idempotency runtime message enablement',
  'Qwen adapter and envelope enablement',
  'private invoke transport dependency enablement',
  'Cloud Run L4 dependency enablement',
  'response classification and result handoff',
  'QA audit cost credit cleanup handoff',
  'beta production public artifact lock',
  '`resolveServiceUrl`',
  '`resolveAudience`',
  '`fetchIdentityToken`',
  '`sendRequest`',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalAcceptedForPreflight=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightRequired=true`',
  '`readyForRealWorkerDispatch=false`',
  '`transportDependenciesEnabledNow=false`',
  '`workersDispatched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`serviceUrlResolvedNow=false`',
  '`audienceResolvedNow=false`',
  '`identityTokenFetched=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_APPROVAL
const executionPlan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PLAN

assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanDecision,
  executionPlan.decision,
)
assert.equal(approval.executionApproval.decisionRecorded, true)
assert.equal(
  approval.executionApproval
    .acceptsExecutionPlanForFutureControlledTransportDependencyEnablementPreflight,
  true,
)
assert.equal(
  approval.executionApproval.controlledTransportDependencyEnablementExecutionPreflightRequired,
  true,
)
assert.equal(approval.executionApproval.approvesExecutionNow, false)
assert.equal(approval.executionApproval.approvesDependencyEnablementNow, false)
assert.equal(approval.executionApproval.approvesRealBackendLeaseClaimNow, false)
assert.equal(approval.executionApproval.approvesInjectedPrivateInvokeDependenciesNow, false)
assert.equal(approval.executionApproval.approvesServiceUrlResolutionNow, false)
assert.equal(approval.executionApproval.approvesAudienceResolutionNow, false)
assert.equal(approval.executionApproval.approvesIdentityTokenFetchNow, false)
assert.equal(approval.executionApproval.approvesPrivateRequestSendNow, false)
assert.equal(approval.executionApproval.approvesCloudRunInvocationNow, false)
assert.equal(approval.executionApproval.approvesQwenInferenceNow, false)
assert.equal(approval.executionApproval.approvesGeneratedAssetsNow, false)

assert.equal(approval.acceptedTransportDependencyEnablementPlanEvidence.length, 10)
for (const id of [
  'approved_snapshot_and_private_source_precheck',
  'no_spend_credit_and_cost_precheck',
  'backend_lease_and_claim_enablement',
  'idempotency_runtime_message_enablement',
  'qwen_adapter_and_envelope_enablement',
  'private_invoke_transport_dependency_enablement',
  'cloud_run_l4_dependency_enablement',
  'response_classification_and_result_handoff',
  'qa_audit_cost_credit_cleanup_handoff',
  'beta_production_public_artifact_lock',
]) {
  const entry = approval.acceptedTransportDependencyEnablementPlanEvidence.find((item) => item.id === id)
  check(entry, `Missing transport dependency enablement approval evidence entry ${id}`)
  assert.equal(entry.acceptedForPreflight, true)
  assert.equal(entry.dependencyEnablementAllowedNow, false)
  assert.equal(entry.executionAllowedNow, false)
  check(entry.requiredInputs.length >= 6, `${id} must preserve detailed inputs`)
}

assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(approval.controlledTransportDependencyEnablementExecutionPreflightRequirements.length, 8)
assert.equal(approval.localContractPreview.dispatchAdapterStatus, 'blocked_fail_closed_cloud_run_invocation_disabled')
assert.equal(approval.localContractPreview.privateInvokeEnvelopeStatus, 'blocked_private_invocation_disabled')
for (const dependencyName of [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
] as const) {
  assert.ok(
    approval.transportDependencyShape.requiredInjectedDependencies.includes(dependencyName),
    `Missing injected dependency requirement: ${dependencyName}`,
  )
}
assert.equal(approval.transportDependencyShape.injectedDependencyCallsAllowedNow, false)
assert.equal(approval.transportDependencyShape.serviceUrlResolutionAllowedNow, false)
assert.equal(approval.transportDependencyShape.audienceResolutionAllowedNow, false)
assert.equal(approval.transportDependencyShape.identityTokenFetchAllowedNow, false)
assert.equal(approval.transportDependencyShape.requestSendAllowedNow, false)
assert.equal(approval.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(approval.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(approval.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(approval.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(approval.sourceOfTruthRules.frontendMayCallCloudRun, false)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired,
  false,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRecorded,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalAcceptedForPreflight,
  true,
)
assert.equal(
  approval.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightRequired,
  true,
)
assertFalseRuntimeFlags(approval.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ approval })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled transport dependency enablement execution approval data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: approval.decision,
  acceptedEvidenceAreas: approval.acceptedTransportDependencyEnablementPlanEvidence.length,
  executionApprovalRecorded:
    approval.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRecorded,
  executionPreflightRequired:
    approval.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightRequired,
  readyForRealWorkerDispatch: approval.runtimeFlags.readyForRealWorkerDispatch,
  transportDependenciesEnabledNow: approval.runtimeFlags.transportDependenciesEnabledNow,
  cloudRunInvocationAttempted: approval.runtimeFlags.cloudRunInvocationAttempted,
  serviceRuntimeRequestSent: approval.runtimeFlags.serviceRuntimeRequestSent,
  inferenceRun: approval.runtimeFlags.inferenceRun,
  generatedAssetsCreated: approval.runtimeFlags.generatedAssetsCreated,
  nextPrompt: approval.nextPrompt,
}, null, 2))
