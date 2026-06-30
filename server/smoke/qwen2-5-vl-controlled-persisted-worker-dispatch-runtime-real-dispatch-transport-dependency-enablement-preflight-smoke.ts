import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_preflight_verified_execution_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CK-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-PLAN: plan controlled Qwen real-dispatch transport dependency enablement execution, no Cloud Run invocation/no inference/no generated assets/no beta'

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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation.ts',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
  'approved-plan-snapshot-policy.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.md')
for (const phrase of [
  DECISION,
  'transport dependency enablement implementation accepted for preflight: true',
  'transport dependency enablement preflight recorded: true',
  'transport dependency enablement preflight passed: true',
  'controlled transport dependency enablement execution plan required: true',
  'dependencies enabled now: false',
  'real worker dispatch ready now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'service-role lease and claim dependency',
  'idempotency and runtime message dependency',
  'Qwen dispatch adapter dependency',
  'private invoke envelope dependency',
  'private invoke transport dependency',
  'response classification dependency',
  'QA, audit, cost, and credit dependency',
  'cleanup and rollback dependency',
  'beta and production lock dependency',
  'implementation record present: verified',
  'dependency surface inventory: verified',
  'local fail-closed contract previews: verified',
  'injected transport dependency shape: verified',
  'approved snapshot source of truth: verified',
  'cost-controlled runtime posture: verified',
  'frontend boundary: verified',
  'fail-closed dispatch adapter status: `blocked_fail_closed_cloud_run_invocation_disabled`',
  'private invoke envelope status: `blocked_private_invocation_disabled`',
  'private invoke transport preview status: `blocked_transport_disabled`',
  'response classification status: `blocked_contract_valid_inference_disabled`',
  '`resolveServiceUrl`',
  '`resolveAudience`',
  '`fetchIdentityToken`',
  '`sendRequest`',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightPassed=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired=true`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.ts',
]) {
  assertNoForbiddenText(file)
}

const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PREFLIGHT
const implementation =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION

assert.equal(preflight.decision, DECISION)
assert.equal(preflight.nextPrompt, NEXT_PROMPT)
assert.equal(
  preflight.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationDecision,
  implementation.decision,
)
assert.equal(preflight.preflightDecision.implementationAcceptedForPreflight, true)
assert.equal(preflight.preflightDecision.transportDependencyEnablementPreflightRecorded, true)
assert.equal(preflight.preflightDecision.transportDependencyEnablementPreflightPassed, true)
assert.equal(
  preflight.preflightDecision.controlledTransportDependencyEnablementExecutionPlanRequired,
  true,
)
assert.equal(preflight.preflightDecision.dependenciesEnabledNow, false)
assert.equal(preflight.preflightDecision.readyForRealWorkerDispatch, false)
assert.equal(preflight.preflightDecision.approvesRealBackendLeaseClaimNow, false)
assert.equal(preflight.preflightDecision.approvesInjectedPrivateInvokeDependenciesNow, false)
assert.equal(preflight.preflightDecision.approvesServiceUrlResolutionNow, false)
assert.equal(preflight.preflightDecision.approvesAudienceResolutionNow, false)
assert.equal(preflight.preflightDecision.approvesIdentityTokenFetchNow, false)
assert.equal(preflight.preflightDecision.approvesPrivateRequestSendNow, false)
assert.equal(preflight.preflightDecision.approvesCloudRunInvocationNow, false)
assert.equal(preflight.preflightDecision.approvesQwenInferenceNow, false)
assert.equal(preflight.preflightDecision.approvesGeneratedAssetsNow, false)
assert.equal(preflight.preflightDecision.approvesBetaNow, false)
assert.equal(preflight.preflightDecision.approvesProductionNow, false)

assert.equal(preflight.verifiedDependencySurfaces.length, 9)
assert.deepEqual(
  preflight.verifiedDependencySurfaces.map((surface) => surface.id),
  implementation.dependencySurfaces.map((surface) => surface.id),
)
for (const surface of preflight.verifiedDependencySurfaces) {
  assert.equal(surface.implementationVerified, true, `${surface.id} must be implementation verified`)
  assert.equal(surface.preflightVerified, true, `${surface.id} must be preflight verified`)
  assert.equal(surface.enabledNow, false, `${surface.id} must not be enabled now`)
  assert.equal(surface.executionAllowedNow, false, `${surface.id} must not execute now`)
  check(surface.requiredEvidence.length >= 3, `${surface.id} must keep evidence detail`)
}

assert.deepEqual(
  preflight.verifiedPreflightChecks.map((checkEntry) => checkEntry.id),
  [
    'implementation_record_present',
    'dependency_surface_inventory',
    'local_fail_closed_contract_previews',
    'injected_transport_dependency_shape',
    'approved_snapshot_source_of_truth',
    'cost_controlled_runtime_posture',
    'frontend_boundary',
    'qa_audit_cost_credit_cleanup',
    'beta_production_public_artifact_lock',
  ],
)
for (const checkEntry of preflight.verifiedPreflightChecks) {
  assert.equal(checkEntry.status, 'verified')
  assert.equal(checkEntry.executionAllowedNow, false)
}

assert.equal(preflight.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(preflight.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(preflight.selectedRuntime.minInstances, 0)
assert.equal(preflight.selectedRuntime.initialMaxInstances, 1)
assert.equal(preflight.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(
  preflight.localContractPreview.dispatchAdapterStatus,
  'blocked_fail_closed_cloud_run_invocation_disabled',
)
assert.equal(preflight.localContractPreview.privateInvokeEnvelopeStatus, 'blocked_private_invocation_disabled')
assert.equal(preflight.localContractPreview.privateInvokeTransportPreviewStatus, 'blocked_transport_disabled')
assert.equal(
  preflight.localContractPreview.responseClassificationStatus,
  'blocked_contract_valid_inference_disabled',
)
assert.deepEqual(preflight.transportDependencyShape.requiredInjectedDependencies, [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
])
assert.equal(preflight.transportDependencyShape.injectedDependencyCallsAllowedNow, false)
assert.equal(preflight.transportDependencyShape.serviceUrlResolutionAllowedNow, false)
assert.equal(preflight.transportDependencyShape.audienceResolutionAllowedNow, false)
assert.equal(preflight.transportDependencyShape.identityTokenFetchAllowedNow, false)
assert.equal(preflight.transportDependencyShape.requestSendAllowedNow, false)
assert.equal(preflight.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(preflight.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(preflight.sourceOfTruthRules.rawWorkerPromptAllowed, false)
assert.equal(preflight.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(preflight.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(preflight.sourceOfTruthRules.frontendMayCallCloudRun, false)

assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalAccepted,
  true,
)
assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRecorded,
  true,
)
assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired,
  false,
)
assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRecorded,
  true,
)
assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightPassed,
  true,
)
assert.equal(
  preflight.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired,
  true,
)
assertFalseRuntimeFlags(preflight.runtimeFlags as unknown as JsonRecord)

const forbiddenFindings = scanValues(preflight, ['preflight'])
assert.deepEqual(
  forbiddenFindings,
  [],
  `Forbidden values in real-dispatch transport dependency enablement preflight data: ${forbiddenFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: preflight.decision,
  dependencySurfaceCount: preflight.verifiedDependencySurfaces.length,
  preflightCheckCount: preflight.verifiedPreflightChecks.length,
  preflightRecorded:
    preflight.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRecorded,
  preflightPassed:
    preflight.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightPassed,
  executionPlanRequired:
    preflight.runtimeFlags
      .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired,
  dependenciesEnabledNow: preflight.runtimeFlags.transportDependenciesEnabledNow,
  readyForRealWorkerDispatch: preflight.runtimeFlags.readyForRealWorkerDispatch,
  cloudRunInvocationAttempted: preflight.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: preflight.runtimeFlags.inferenceRun,
  generatedAssetsCreated: preflight.runtimeFlags.generatedAssetsCreated,
  nextPrompt: preflight.nextPrompt,
}, null, 2))
