import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_attempt_approval_accepted_attempt_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CV-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-ATTEMPT: run controlled Qwen real-dispatch transport attempt, no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|transportAttemptExecutedNow|transportDependenciesEnabledNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRequired',
    'readyForRealWorkerDispatch',
    'transportAttemptExecutedNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-smoke.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.md')
for (const phrase of [
  DECISION,
  'transport preflight recorded: true',
  'transport preflight passed: true',
  'controlled transport attempt approval required: false',
  'controlled transport attempt approval recorded: true',
  'controlled transport attempt approved for future bounded attempt: true',
  'controlled transport attempt required: true',
  'future service URL resolution during attempt approved: true',
  'future audience resolution during attempt approved: true',
  'future identity-token fetch during attempt approved: true',
  'future auth-header creation during attempt approved: true',
  'future private request send during attempt approved: true',
  'future Cloud Run contract invocation during attempt approved: true',
  'service URL resolution approved now: false',
  'audience resolution approved now: false',
  'identity-token fetch approved now: false',
  'auth-header creation approved now: false',
  'private request send approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'approved snapshot transport attempt scope',
  'backend-only service URL resolution',
  'backend-only audience resolution',
  'identity-token dependency',
  'auth-header redaction',
  'bounded private request envelope',
  'inference-disabled contract',
  'response classification',
  'persistence without generated assets',
  'cleanup rollback beta production lock',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovedForFutureBoundedAttempt=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRequired=true`',
  '`transportAttemptExecutedNow=false`',
  '`serviceUrlResolvedNow=false`',
  '`audienceResolvedNow=false`',
  '`identityTokenFetched=false`',
  '`authHeaderCreated=false`',
  '`privateRequestSendAllowedNow=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_APPROVAL
const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT

assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightDecision,
  preflight.decision,
)
assert.equal(approval.transportAttemptApproval.decisionRecorded, true)
assert.equal(approval.transportAttemptApproval.acceptsTransportPreflightForFutureBoundedAttempt, true)
assert.equal(approval.transportAttemptApproval.controlledTransportAttemptApprovalRequired, false)
assert.equal(approval.transportAttemptApproval.controlledTransportAttemptApprovalRecorded, true)
assert.equal(
  approval.transportAttemptApproval.controlledTransportAttemptApprovedForFutureBoundedAttempt,
  true,
)
assert.equal(approval.transportAttemptApproval.controlledTransportAttemptRequired, true)
assert.equal(approval.transportAttemptApproval.approvesFutureServiceUrlResolutionDuringAttempt, true)
assert.equal(approval.transportAttemptApproval.approvesFutureAudienceResolutionDuringAttempt, true)
assert.equal(approval.transportAttemptApproval.approvesFutureIdentityTokenFetchDuringAttempt, true)
assert.equal(approval.transportAttemptApproval.approvesFutureAuthHeaderCreationDuringAttempt, true)
assert.equal(approval.transportAttemptApproval.approvesFuturePrivateRequestSendDuringAttempt, true)
assert.equal(approval.transportAttemptApproval.approvesFutureCloudRunContractInvocationDuringAttempt, true)
assert.equal(approval.transportAttemptApproval.approvesServiceUrlResolutionNow, false)
assert.equal(approval.transportAttemptApproval.approvesAudienceResolutionNow, false)
assert.equal(approval.transportAttemptApproval.approvesIdentityTokenFetchNow, false)
assert.equal(approval.transportAttemptApproval.approvesAuthHeaderCreationNow, false)
assert.equal(approval.transportAttemptApproval.approvesPrivateRequestSendNow, false)
assert.equal(approval.transportAttemptApproval.approvesCloudRunInvocationNow, false)
assert.equal(approval.transportAttemptApproval.approvesQwenInferenceNow, false)
assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(approval.acceptedTransportAttemptApprovalAreas.length, 10)
assert.equal(
  approval.acceptedTransportAttemptApprovalAreas.every((entry) => entry.acceptedForFutureAttempt),
  true,
)
assert.equal(
  approval.acceptedTransportAttemptApprovalAreas.every((entry) => !entry.runtimeValueResolvedNow),
  true,
)
assert.equal(
  approval.acceptedTransportAttemptApprovalAreas.every((entry) => !entry.requestSentNow),
  true,
)
assert.equal(
  approval.acceptedTransportAttemptApprovalAreas.every((entry) => !entry.executionAllowedNow),
  true,
)
assert.equal(approval.futureTransportAttemptExecutionRules.transportAttemptApprovalRecordedBeforeAttempt, true)
assert.equal(approval.futureTransportAttemptExecutionRules.futureAttemptMayResolveRuntimeValues, true)
assert.equal(approval.futureTransportAttemptExecutionRules.futureAttemptMayFetchIdentityToken, true)
assert.equal(approval.futureTransportAttemptExecutionRules.futureAttemptMayCreateAuthHeader, true)
assert.equal(approval.futureTransportAttemptExecutionRules.futureAttemptMaySendOneBoundedPrivateRequest, true)
assert.equal(approval.futureTransportAttemptExecutionRules.futureAttemptMayInvokeCloudRunContractEndpoint, true)
assert.equal(approval.futureTransportAttemptExecutionRules.futureAttemptMustKeepInferenceDisabled, true)
assert.equal(approval.futureTransportAttemptExecutionRules.futureAttemptMustNotCreateGeneratedAssets, true)
assert.equal(approval.futureTransportAttemptExecutionRules.inferenceRequiresSeparateApproval, true)
assertFalseRuntimeFlags(approval.runtimeFlags)
assert.equal(approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRecorded, true)
assert.equal(approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPassed, true)
assert.equal(
  approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRecorded,
  true,
)
assert.equal(
  approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovedForFutureBoundedAttempt,
  true,
)
assert.equal(
  approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRequired,
  true,
)
assert.equal(approval.runtimeFlags.selectedGpuL4Accepted, true)
assert.equal(approval.runtimeFlags.scaleToZeroCostPostureAccepted, true)
assert.equal(approval.runtimeFlags.minInstancesZeroAccepted, true)
assert.equal(approval.runtimeFlags.initialMaxInstancesOneAccepted, true)
assert.equal(approval.runtimeFlags.cpuFallbackDisabledAccepted, true)

const forbiddenDataFindings = scanValues({ approval, preflight })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen transport attempt approval data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: approval.decision,
  acceptedAttemptApprovalAreaCount: approval.acceptedTransportAttemptApprovalAreas.length,
  futureAttemptMaySendOneBoundedPrivateRequest:
    approval.futureTransportAttemptExecutionRules.futureAttemptMaySendOneBoundedPrivateRequest,
  inferenceRun: approval.runtimeFlags.inferenceRun,
  generatedAssetsCreated: approval.runtimeFlags.generatedAssetsCreated,
  selectedGpu: approval.approvedRuntimePosture.gpu,
  costPosture: approval.approvedRuntimePosture.costPosture,
  nextPrompt: approval.nextPrompt,
}, null, 2))
