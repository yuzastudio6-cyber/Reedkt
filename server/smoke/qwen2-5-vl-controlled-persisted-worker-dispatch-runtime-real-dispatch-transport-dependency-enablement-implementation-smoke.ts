import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation'
import { QWEN2_5_VL_CONTROLLED_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION } from '../../src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_implemented_preflight_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CJ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-PREFLIGHT: verify controlled Qwen real-dispatch lease adapter and private invoke transport dependency enablement preflight, no Cloud Run invocation/no inference/no generated assets/no beta'

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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-approval.md',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation-smoke.ts',
  'approved-plan-snapshot-policy.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation.md')
for (const phrase of [
  DECISION,
  'transport dependency enablement approval accepted: true',
  'transport dependency enablement implementation required: false',
  'transport dependency enablement implementation recorded: true',
  'transport dependency enablement preflight required: true',
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
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired=true`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation.md',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-implementation.ts',
]) {
  assertNoForbiddenText(file)
}

const implementation =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION
const workerImplementation =
  QWEN2_5_VL_CONTROLLED_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION

assert.equal(implementation.decision, DECISION)
assert.equal(workerImplementation.decision, DECISION)
assert.equal(implementation.nextPrompt, NEXT_PROMPT)
assert.equal(workerImplementation.nextPrompt, NEXT_PROMPT)
assert.equal(
  implementation.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.decision,
)
assert.equal(implementation.implementationRecorded, true)
assert.equal(implementation.implementationPreflightRequired, true)
assert.equal(implementation.dependenciesEnabledNow, false)
assert.equal(implementation.readyForRealWorkerDispatch, false)
assert.equal(implementation.dependencySurfaces.length, 9)
assert.deepEqual(
  implementation.dependencySurfaces.map((surface) => surface.id),
  [
    'service_role_lease_claim_dependency',
    'idempotency_runtime_message_dependency',
    'qwen_dispatch_adapter_dependency',
    'private_invoke_envelope_dependency',
    'private_invoke_transport_dependency',
    'response_classification_dependency',
    'qa_audit_cost_credit_dependency',
    'cleanup_rollback_dependency',
    'beta_production_public_artifact_lock_dependency',
  ],
)
for (const surface of implementation.dependencySurfaces) {
  assert.equal(surface.implemented, true, `${surface.id} must be implemented`)
  assert.equal(surface.enabledNow, false, `${surface.id} must not be enabled now`)
  assert.equal(surface.executionAllowedNow, false, `${surface.id} must not execute now`)
  assert.equal(surface.acceptedForImplementation, true, `${surface.id} must preserve acceptance`)
  check(surface.requiredEvidence.length >= 3, `${surface.id} must keep evidence detail`)
}

assert.equal(implementation.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(implementation.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(implementation.selectedRuntime.minInstances, 0)
assert.equal(implementation.selectedRuntime.initialMaxInstances, 1)
assert.equal(implementation.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(
  implementation.localContractPreview.dispatchAdapterStatus,
  'blocked_fail_closed_cloud_run_invocation_disabled',
)
assert.equal(implementation.localContractPreview.dispatchAdapterAcceptsValidatedQueue, true)
assert.equal(implementation.localContractPreview.privateInvokeEnvelopeStatus, 'blocked_private_invocation_disabled')
assert.equal(implementation.localContractPreview.privateInvokeEnvelopeAcceptedForFutureTransport, true)
assert.equal(implementation.localContractPreview.privateInvokeTransportPreviewStatus, 'blocked_transport_disabled')
assert.equal(
  implementation.localContractPreview.privateInvokeTransportEnvelopeAcceptedForFutureTransport,
  true,
)
assert.equal(
  implementation.localContractPreview.responseClassificationStatus,
  'blocked_contract_valid_inference_disabled',
)
assert.equal(implementation.localContractPreview.responseClassificationRuntimeCanAdvanceNow, false)
assert.deepEqual(implementation.transportDependencyShape.requiredInjectedDependencies, [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
])
assert.equal(implementation.transportDependencyShape.injectedDependencyCallsAllowedNow, false)
assert.equal(implementation.transportDependencyShape.serviceUrlResolutionAllowedNow, false)
assert.equal(implementation.transportDependencyShape.audienceResolutionAllowedNow, false)
assert.equal(implementation.transportDependencyShape.identityTokenFetchAllowedNow, false)
assert.equal(implementation.transportDependencyShape.requestSendAllowedNow, false)
assert.equal(implementation.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(implementation.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(implementation.sourceOfTruthRules.rawWorkerPromptAllowed, false)
assert.equal(implementation.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(implementation.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(implementation.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(implementation.sourceOfTruthRules.qwenMayRenderExport, false)
assert.equal(implementation.sourceOfTruthRules.frontendMayClaimJobs, false)
assert.equal(implementation.sourceOfTruthRules.frontendMayResolvePrivateInvokeCredentials, false)
assert.equal(implementation.sourceOfTruthRules.frontendMayCallCloudRun, false)
assert.equal(implementation.sourceOfTruthRules.frontendMayCreateGeneratedAssets, false)

assert.equal(
  implementation.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalAccepted,
  true,
)
assert.equal(
  implementation.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRequired,
  false,
)
assert.equal(
  implementation.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRecorded,
  true,
)
assert.equal(
  implementation.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired,
  true,
)
for (const key of [
  'serviceRoleLeaseClaimDependencyImplemented',
  'idempotencyRuntimeMessageDependencyImplemented',
  'qwenDispatchAdapterDependencyImplemented',
  'privateInvokeEnvelopeDependencyImplemented',
  'privateInvokeTransportDependencyImplemented',
  'responseClassificationDependencyImplemented',
  'qaAuditCostCreditDependencyImplemented',
  'cleanupRollbackDependencyImplemented',
  'betaProductionPublicArtifactLockImplemented',
  'selectedGpuL4Accepted',
  'scaleToZeroCostPostureAccepted',
  'minInstancesZeroAccepted',
  'initialMaxInstancesOneAccepted',
  'cpuFallbackDisabledAccepted',
] as const) {
  assert.equal(implementation.runtimeFlags[key], true, `${key} must be true`)
}
assertFalseRuntimeFlags(implementation.runtimeFlags)

const forbiddenFindings = [
  ...scanValues(implementation, ['implementation']),
  ...scanValues(workerImplementation, ['workerImplementation']),
]
assert.deepEqual(
  forbiddenFindings,
  [],
  `Forbidden values in real-dispatch transport dependency enablement implementation data: ${forbiddenFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: implementation.decision,
  dependencySurfaceCount: implementation.dependencySurfaces.length,
  implementationRecorded: implementation.implementationRecorded,
  implementationPreflightRequired: implementation.implementationPreflightRequired,
  dependenciesEnabledNow: implementation.dependenciesEnabledNow,
  readyForRealWorkerDispatch: implementation.readyForRealWorkerDispatch,
  selectedGpu: implementation.selectedRuntime.gpu,
  costPosture: implementation.selectedRuntime.costPosture,
  dispatchAdapterStatus: implementation.localContractPreview.dispatchAdapterStatus,
  privateInvokeTransportPreviewStatus:
    implementation.localContractPreview.privateInvokeTransportPreviewStatus,
  responseClassificationStatus: implementation.localContractPreview.responseClassificationStatus,
  nextPrompt: implementation.nextPrompt,
}, null, 2))
