import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_ATTEMPT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_attempt_approval_accepted_attempt_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DK-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-ATTEMPT: run one bounded approved-fixture private invoke attempt through the persisted job and lease bridge, no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInvokeAttemptExecutedNow|approvedFixturePrivateInvokeAcceptedForPersistedDispatch|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'approvedFixturePrivateInvokeAttemptExecutedNow',
    'approvedFixturePrivateInvokeAcceptedForPersistedDispatch',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-preflight.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'async-edit-work-graph.md',
  'editing-asset-manifest.md',
  'model-routing-policy.md',
  'intent-led-edit-planning.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval-smoke.ts',
  'package script mismatch',
)

const docPath =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval.md'
const doc = read(docPath)
for (const phrase of [
  DECISION,
  'approved-fixture private invoke attempt approval recorded: true',
  'approved-fixture private invoke approved for future bounded attempt: true',
  'approved-fixture private invoke attempt required: true',
  'future persisted worker dispatch envelope during attempt approved: true',
  'future service URL resolution during attempt approved: true',
  'future identity token fetch during attempt approved: true',
  'future Cloud Run contract invocation during attempt approved: true',
  'future sanitized metadata evidence during attempt approved: true',
  'real job creation approved now: false',
  'Cloud Run invocation approved now: false',
  'model import approved now: false',
  'model load approved now: false',
  'vLLM initialization approved now: false',
  'forward pass approved now: false',
  'inference approved now: false',
  'generated assets approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovedForFutureBoundedAttempt=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptRequired=true`',
  '`readyForApprovedFixturePrivateInvokeAttempt=true`',
  '`approvedFixturePrivateInvokeAttemptExecutedNow=false`',
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

for (const file of [
  docPath,
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_ATTEMPT_APPROVAL
const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_PREFLIGHT

assert.equal(approval.decision, DECISION)
assert.equal(approval.nextPrompt, NEXT_PROMPT)
assert.equal(
  approval.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightDecision,
  preflight.decision,
)
assert.equal(approval.privateInvokeAttemptApproval.decisionRecorded, true)
assert.equal(approval.privateInvokeAttemptApproval.acceptsPrivateInvokePreflightForFutureBoundedAttempt, true)
assert.equal(approval.privateInvokeAttemptApproval.controlledApprovedFixturePrivateInvokeAttemptApprovalRequired, false)
assert.equal(approval.privateInvokeAttemptApproval.controlledApprovedFixturePrivateInvokeAttemptApprovalRecorded, true)
assert.equal(
  approval.privateInvokeAttemptApproval.controlledApprovedFixturePrivateInvokeAttemptApprovedForFutureBoundedAttempt,
  true,
)
assert.equal(approval.privateInvokeAttemptApproval.controlledApprovedFixturePrivateInvokeAttemptRequired, true)
assert.equal(approval.privateInvokeAttemptApproval.approvesFuturePersistedWorkerDispatchEnvelopeDuringAttempt, true)
assert.equal(approval.privateInvokeAttemptApproval.approvesFutureServiceUrlResolutionDuringAttempt, true)
assert.equal(approval.privateInvokeAttemptApproval.approvesFutureCloudRunContractInvocationDuringAttempt, true)
assert.equal(approval.privateInvokeAttemptApproval.approvesFutureResponseClassificationDuringAttempt, true)
assert.equal(approval.privateInvokeAttemptApproval.approvesRealJobCreationNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesPrivateRequestSendNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesCloudRunInvocationNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesModelImportNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesModelLoadNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesVllmInitializationNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesPromptProcessingNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesForwardPassNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesInferenceNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesGeneratedAssetsNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesSupabaseMutationNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesCreditSpendNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesBetaNow, false)
assert.equal(approval.privateInvokeAttemptApproval.approvesProductionNow, false)

assert.equal(approval.acceptedApprovedFixturePrivateInvokeAttemptApprovalAreas.length, 9)
for (const entry of approval.acceptedApprovedFixturePrivateInvokeAttemptApprovalAreas) {
  assert.equal(entry.acceptedForFutureAttempt, true)
  assert.equal(entry.runtimeValueResolvedNow, false)
  assert.equal(entry.requestSentNow, false)
  assert.equal(entry.executionAllowedNow, false)
  assert.ok(entry.requiredEvidence.length > 0)
}

assert.equal(approval.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(approval.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(approval.approvedRuntimePosture.minInstances, 0)
assert.equal(approval.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(approval.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.privateInvokeAttemptApprovalRecordedBeforeAttempt, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMayCreateOnePersistedWorkerDispatchEnvelope, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMaySendOneBoundedPrivateRequest, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMayInvokeCloudRunContractEndpoint, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMustKeepInferenceDisabled, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMustNotImportModel, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMustNotLoadModel, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMustNotRunInference, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMustNotCreateGeneratedAssets, true)
assert.equal(approval.futureApprovedFixturePrivateInvokeAttemptRules.futureAttemptMustNotMutateCredits, true)

const flags = approval.runtimeFlags
assert.equal(flags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRecorded, true)
assert.equal(flags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightPassed, true)
assert.equal(flags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRequired, false)
assert.equal(flags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRecorded, true)
assert.equal(
  flags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovedForFutureBoundedAttempt,
  true,
)
assert.equal(flags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptRequired, true)
assert.equal(flags.approvedFixtureAndSnapshotScopeAttemptApproved, true)
assert.equal(flags.persistedJobIdempotencyAndLeaseAttemptApproved, true)
assert.equal(flags.privateInvokeTransportRuntimeValuesAttemptApproved, true)
assert.equal(flags.cloudRunL4ContractInvocationAttemptApproved, true)
assert.equal(flags.qwenRuntimeInferenceLockAttemptApproved, true)
assert.equal(flags.responseClassificationAndMetadataEvidenceAttemptApproved, true)
assert.equal(flags.readyForApprovedFixturePrivateInvokeAttempt, true)
assertFalseRuntimeFlags(flags)

const findings = scanValues(approval)
assert.deepEqual(findings, [], `Forbidden values in attempt approval spec: ${findings.join('; ')}`)

console.log(
  JSON.stringify({
    ok: true,
    decision: approval.decision,
    acceptedAttemptAreaCount: approval.acceptedApprovedFixturePrivateInvokeAttemptApprovalAreas.length,
    selectedGpu: approval.approvedRuntimePosture.gpu,
    costPosture: approval.approvedRuntimePosture.costPosture,
    attemptApprovalRecorded:
      approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRecorded,
    attemptRequired:
      approval.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptRequired,
    readyForApprovedFixturePrivateInvokeAttempt:
      approval.runtimeFlags.readyForApprovedFixturePrivateInvokeAttempt,
    cloudRunInvocationAttempted: approval.runtimeFlags.cloudRunInvocationAttempted,
    inferenceRun: approval.runtimeFlags.inferenceRun,
    generatedAssetsCreated: approval.runtimeFlags.generatedAssetsCreated,
    nextPrompt: approval.nextPrompt,
  }),
)
