import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_plan_recorded_execution_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CL-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-APPROVAL: approve controlled Qwen real-dispatch transport dependency enablement execution plan, no Cloud Run invocation/no inference/no generated assets/no beta'

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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight-smoke.ts',
  'approved-plan-snapshot-policy.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.md')
for (const phrase of [
  DECISION,
  'transport dependency enablement preflight accepted for execution planning: true',
  'transport dependency enablement execution plan recorded: true',
  'transport dependency enablement execution approval required: true',
  'dependencies enabled now: false',
  'real backend lease claim approved now: false',
  'injected private invoke dependencies approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
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
  '`qwen_fixture_visual_metadata_v1`',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired=true`',
  '`readyForRealWorkerDispatch=false`',
  '`transportDependenciesEnabledNow=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PLAN
const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PREFLIGHT

assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightDecision,
  preflight.decision,
)
assert.equal(plan.executionScope.preflightAcceptedForExecutionPlanning, true)
assert.equal(plan.executionScope.executionPlanRecorded, true)
assert.equal(plan.executionScope.executionApprovalRequired, true)
assert.equal(plan.executionScope.approvesDependencyEnablementNow, false)
assert.equal(plan.executionScope.approvesRealBackendLeaseClaimNow, false)
assert.equal(plan.executionScope.approvesInjectedPrivateInvokeDependenciesNow, false)
assert.equal(plan.executionScope.approvesServiceUrlResolutionNow, false)
assert.equal(plan.executionScope.approvesAudienceResolutionNow, false)
assert.equal(plan.executionScope.approvesIdentityTokenFetchNow, false)
assert.equal(plan.executionScope.approvesPrivateRequestSendNow, false)
assert.equal(plan.executionScope.approvesCloudRunInvocationNow, false)
assert.equal(plan.executionScope.approvesQwenInferenceNow, false)
assert.equal(plan.executionScope.approvesGeneratedAssetsNow, false)
assert.equal(plan.executionScope.approvesBetaNow, false)
assert.equal(plan.executionScope.approvesProductionNow, false)

assert.equal(plan.controlledDependencyEnablementSequence.length, 10)
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
  const entry = plan.controlledDependencyEnablementSequence.find((item) => item.id === id)
  check(entry, `Missing dependency enablement step ${id}`)
  assert.equal(entry.enablementAllowedNow, false)
  check(entry.requiredInputs.length >= 6, `${id} must include detailed required inputs`)
}

assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(plan.selectedRuntime.minInstances, 0)
assert.equal(plan.selectedRuntime.initialMaxInstances, 1)
assert.equal(plan.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(plan.executionApprovalPreconditions.length, 8)
assert.equal(plan.localContractPreview.dispatchAdapterStatus, 'blocked_fail_closed_cloud_run_invocation_disabled')
assert.equal(plan.localContractPreview.privateInvokeEnvelopeStatus, 'blocked_private_invocation_disabled')
assert.equal(plan.localContractPreview.privateInvokeTransportPreviewStatus, 'blocked_transport_disabled')
assert.equal(
  plan.localContractPreview.responseClassificationStatus,
  'blocked_contract_valid_inference_disabled',
)
assert.deepEqual(plan.transportDependencyShape.requiredInjectedDependencies, [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
])
assert.equal(plan.transportDependencyShape.injectedDependencyCallsAllowedNow, false)
assert.equal(plan.transportDependencyShape.serviceUrlResolutionAllowedNow, false)
assert.equal(plan.transportDependencyShape.audienceResolutionAllowedNow, false)
assert.equal(plan.transportDependencyShape.identityTokenFetchAllowedNow, false)
assert.equal(plan.transportDependencyShape.requestSendAllowedNow, false)
assert.equal(plan.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(plan.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(plan.sourceOfTruthRules.rawWorkerPromptAllowed, false)
assert.equal(plan.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(plan.sourceOfTruthRules.frontendMayCallCloudRun, false)

assert.equal(
  plan.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightPassed,
  true,
)
assert.equal(
  plan.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired,
  false,
)
assert.equal(
  plan.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRecorded,
  true,
)
assert.equal(
  plan.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired,
  true,
)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

const forbiddenFindings = scanValues(plan, ['plan'])
assert.deepEqual(
  forbiddenFindings,
  [],
  `Forbidden values in real-dispatch transport dependency enablement execution-plan data: ${forbiddenFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  enablementStepCount: plan.controlledDependencyEnablementSequence.length,
  executionPlanRecorded:
    plan.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRecorded,
  executionApprovalRequired:
    plan.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired,
  dependenciesEnabledNow: plan.runtimeFlags.transportDependenciesEnabledNow,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
