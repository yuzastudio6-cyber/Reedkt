import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_preflight_verified_attempt_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DP-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INFERENCE-ATTEMPT-APPROVAL: approve one bounded approved-fixture private Qwen inference attempt through the persisted job and lease bridge, no Cloud Run invocation/no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInferencePreflightExecuted|approvedFixturePrivateInferenceAttemptExecuted|approvedFixturePrivateInferenceAcceptedForPersistedDispatch|approvedFixturePrivateInferenceApprovedNow|qwenInferenceAcceptedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceTargetResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'approvedFixturePrivateInferencePreflightExecuted',
    'approvedFixturePrivateInferenceAttemptExecuted',
    'approvedFixturePrivateInferenceAcceptedForPersistedDispatch',
    'approvedFixturePrivateInferenceApprovedNow',
    'qwenInferenceAcceptedNow',
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
    'serviceTargetResolvedNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval-smoke.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight-smoke.ts',
  'package script mismatch',
)

const docPath =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight.md'
const doc = read(docPath)
for (const phrase of [
  DECISION,
  'preflight verification only',
  'approved-fixture private inference approval recorded: true',
  'approved-fixture private inference preflight required: false',
  'approved-fixture private inference preflight recorded: true',
  'approved-fixture private inference preflight passed: true',
  'approved-fixture private inference attempt approval required: true',
  'static envelope verified only: true',
  'service target resolution approved now: false',
  'audience resolution approved now: false',
  'identity token fetch approved now: false',
  'auth header creation approved now: false',
  'private request send approved now: false',
  'Cloud Run invocation approved now: false',
  'model import approved now: false',
  'model load approved now: false',
  'vLLM initialization approved now: false',
  'prompt processing approved now: false',
  'forward pass approved now: false',
  'Qwen inference approved now: false',
  'result persistence approved now: false',
  'generated asset creation approved now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  '`approvedFixturePrivateInferencePreflightRequired=false`',
  '`approvedFixturePrivateInferencePreflightRecorded=true`',
  '`approvedFixturePrivateInferencePreflightPassed=true`',
  '`approvedFixturePrivateInferenceAttemptApprovalRequired=true`',
  '`approvedSnapshotAndFixtureScopePreflightVerified=true`',
  '`persistedJobLeaseAndIdempotencyRefsPreflightVerified=true`',
  '`privateSourceOfTruthRefsPreflightVerified=true`',
  '`qwenPrivateInferenceRequestEnvelopePreflightVerified=true`',
  '`privateInvokeTransportAndCredentialHandlingPreflightVerified=true`',
  '`modelRuntimeBoundaryPreflightVerified=true`',
  '`metadataOnlyResponseContractPreflightVerified=true`',
  '`qaAuditCostCreditNoSpendPreflightVerified=true`',
  '`cleanupRetryRollbackReviewPreflightVerified=true`',
  '`readyForApprovedFixturePrivateInferenceAttemptApproval=true`',
  '`approvedFixturePrivateInferencePreflightExecuted=false`',
  '`approvedFixturePrivateInferenceAttemptExecuted=false`',
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
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight.ts',
]) {
  assertNoForbiddenText(file)
}

const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_PREFLIGHT
const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_APPROVAL

assert.equal(preflight.decision, DECISION)
assert.equal(preflight.nextPrompt, NEXT_PROMPT)
assert.equal(
  preflight.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceApprovalDecision,
  approval.decision,
)
assert.equal(preflight.preflightDecision.decisionRecorded, true)
assert.equal(
  preflight.preflightDecision.acceptsApprovedFixturePrivateInferenceApprovalForFutureAttemptApproval,
  true,
)
assert.equal(preflight.preflightDecision.approvedFixturePrivateInferencePreflightRequired, false)
assert.equal(preflight.preflightDecision.approvedFixturePrivateInferencePreflightRecorded, true)
assert.equal(preflight.preflightDecision.approvedFixturePrivateInferencePreflightPassed, true)
assert.equal(preflight.preflightDecision.approvedFixturePrivateInferenceAttemptApprovalRequired, true)
assert.equal(preflight.preflightDecision.staticEnvelopeVerifiedOnly, true)
assert.equal(preflight.preflightDecision.approvesServiceTargetResolutionNow, false)
assert.equal(preflight.preflightDecision.approvesAudienceResolutionNow, false)
assert.equal(preflight.preflightDecision.approvesIdentityTokenFetchNow, false)
assert.equal(preflight.preflightDecision.approvesAuthHeaderCreationNow, false)
assert.equal(preflight.preflightDecision.approvesPrivateRequestSendNow, false)
assert.equal(preflight.preflightDecision.approvesCloudRunInvocationNow, false)
assert.equal(preflight.preflightDecision.approvesModelImportNow, false)
assert.equal(preflight.preflightDecision.approvesModelLoadNow, false)
assert.equal(preflight.preflightDecision.approvesVllmInitializationNow, false)
assert.equal(preflight.preflightDecision.approvesPromptProcessingNow, false)
assert.equal(preflight.preflightDecision.approvesForwardPassNow, false)
assert.equal(preflight.preflightDecision.approvesQwenInferenceNow, false)
assert.equal(preflight.preflightDecision.approvesResultPersistenceNow, false)
assert.equal(preflight.preflightDecision.approvesGeneratedAssetsNow, false)
assert.equal(preflight.preflightDecision.approvesSupabaseMutationNow, false)
assert.equal(preflight.preflightDecision.approvesCreditSpendNow, false)
assert.equal(preflight.preflightDecision.approvesBetaNow, false)
assert.equal(preflight.preflightDecision.approvesProductionNow, false)

assert.equal(preflight.verifiedApprovedFixturePrivateInferencePreflightAreas.length, 9)
for (const entry of preflight.verifiedApprovedFixturePrivateInferencePreflightAreas) {
  assert.equal(entry.prerequisiteCategoryVerified, true)
  assert.equal(entry.staticEnvelopeVerifiedOnly, true)
  assert.equal(entry.runtimeValueResolvedNow, false)
  assert.equal(entry.modelOrServiceTouchedNow, false)
  assert.equal(entry.requestSentNow, false)
  assert.equal(entry.executionAllowedNow, false)
  assert.ok(entry.requiredEvidence.length > 0)
}

assert.equal(preflight.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(preflight.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(preflight.approvedRuntimePosture.minInstances, 0)
assert.equal(preflight.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(preflight.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(preflight.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(preflight.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(preflight.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(preflight.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(preflight.futureAttemptRules.staticEnvelopeVerifiedOnlyNow, true)
assert.equal(preflight.futureAttemptRules.serviceTargetResolutionRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.audienceResolutionRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.identityTokenFetchRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.authHeaderCreationRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.privateRequestSendRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.cloudRunInvocationRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.modelImportRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.modelLoadRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.vllmInitializationRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.promptProcessingRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.forwardPassRequiresAttemptApproval, true)
assert.equal(preflight.futureAttemptRules.inferenceRequiresAttemptApproval, true)
assertFalseRuntimeFlags(preflight.runtimeFlags)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferencePlanRecorded, true)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferenceApprovalRequired, false)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferenceApprovalRecorded, true)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferenceApprovalAccepted, true)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferencePreflightRequired, false)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferencePreflightRecorded, true)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferencePreflightPassed, true)
assert.equal(preflight.runtimeFlags.approvedFixturePrivateInferenceAttemptApprovalRequired, true)
assert.equal(preflight.runtimeFlags.readyForApprovedFixturePrivateInferenceAttemptApproval, true)
assert.equal(preflight.runtimeFlags.selectedGpuL4Accepted, true)
assert.equal(preflight.runtimeFlags.scaleToZeroCostPostureAccepted, true)
assert.equal(preflight.runtimeFlags.minInstancesZeroAccepted, true)
assert.equal(preflight.runtimeFlags.initialMaxInstancesOneAccepted, true)
assert.equal(preflight.runtimeFlags.cpuFallbackDisabledAccepted, true)

const findings = scanValues(preflight)
assert.deepEqual(findings, [], `Forbidden runtime value in preflight data: ${findings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: preflight.decision,
      verifiedAreaCount: preflight.verifiedApprovedFixturePrivateInferencePreflightAreas.length,
      selectedGpu: preflight.approvedRuntimePosture.gpu,
      costPosture: preflight.approvedRuntimePosture.costPosture,
      approvedFixturePrivateInferencePreflightRecorded:
        preflight.runtimeFlags.approvedFixturePrivateInferencePreflightRecorded,
      approvedFixturePrivateInferencePreflightPassed:
        preflight.runtimeFlags.approvedFixturePrivateInferencePreflightPassed,
      approvedFixturePrivateInferenceAttemptApprovalRequired:
        preflight.runtimeFlags.approvedFixturePrivateInferenceAttemptApprovalRequired,
      readyForApprovedFixturePrivateInferenceAttemptApproval:
        preflight.runtimeFlags.readyForApprovedFixturePrivateInferenceAttemptApproval,
      inferenceRun: preflight.runtimeFlags.inferenceRun,
      generatedAssetsCreated: preflight.runtimeFlags.generatedAssetsCreated,
      nextPrompt: preflight.nextPrompt,
    },
    null,
    2,
  ),
)
