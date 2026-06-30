import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_ATTEMPT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_attempt_result_review_accepted_private_fixture_inference_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DM-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INFERENCE-PLAN: plan one bounded approved-fixture private Qwen inference attempt through the persisted job and lease bridge, no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|approvedFixturePrivateInferenceAcceptedForPersistedDispatch|qwenInferenceAcceptedNow|generatedAssetCreationAccepted|supabasePersistenceAccepted|creditSpendAccepted|reviewRanCloudRunInvocation|reviewRanPrivateServiceRequest|reviewFetchedIdentityToken|reviewCreatedAuthHeader|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'approvedFixturePrivateInvokeAttemptResultReviewRequired',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'approvedFixturePrivateInferenceAcceptedForPersistedDispatch',
    'qwenInferenceAcceptedNow',
    'generatedAssetCreationAccepted',
    'supabasePersistenceAccepted',
    'creditSpendAccepted',
    'reviewRanCloudRunInvocation',
    'reviewRanPrivateServiceRequest',
    'reviewFetchedIdentityToken',
    'reviewCreatedAuthHeader',
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
    'creditMutationCreated',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-smoke.ts',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.md',
)
for (const phrase of [
  DECISION,
  'approved-fixture private invoke attempt result accepted: true',
  'fail-closed response accepted: true',
  'HTTP status accepted: 403',
  'service reason accepted: `qwen_inference_disabled_after_contract_check`',
  'response classification accepted: `blocked_contract_valid_inference_disabled`',
  'persisted dispatch reference envelope accepted: true',
  'private service request evidence accepted: true',
  'Cloud Run Job execution evidence accepted: true',
  'identity token runtime scope accepted: true',
  'auth header runtime scope accepted: true',
  'target URL redaction accepted: true',
  'log payload URL value absent accepted: true',
  'log payload token value absent accepted: true',
  'raw response body non-persistence accepted: true',
  'metadata output non-persistence accepted: true',
  'credit spend blocked accepted: true',
  'inference non-execution accepted: true',
  'model import non-execution accepted: true',
  'model load non-execution accepted: true',
  'vLLM non-initialization accepted: true',
  'forward pass non-execution accepted: true',
  'generated asset non-creation accepted: true',
  'Supabase non-mutation accepted: true',
  '`approvedFixturePrivateInvokeAttemptResultReviewRequired=false`',
  '`approvedFixturePrivateInvokeAttemptResultReviewRecorded=true`',
  '`approvedFixturePrivateInvokeAttemptResultReviewAccepted=true`',
  '`approvedFixturePrivateInferencePlanRequired=true`',
  '`privateContractReachabilityAcceptedForFutureInferencePlan=true`',
  '`targetUrlRedactionAccepted=true`',
  '`reviewRanCloudRunInvocation=false`',
  '`reviewFetchedIdentityToken=false`',
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
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.ts',
]) {
  assertNoForbiddenText(file)
}

const review =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_ATTEMPT_RESULT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(review.nextPrompt, NEXT_PROMPT)
assert.equal(
  review.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INVOKE_ATTEMPT_RESULT.decision,
)
assert.equal(review.acceptedEvidence.approvedFixturePrivateInvokeAttemptResultAccepted, true)
assert.equal(review.acceptedEvidence.attemptApprovalRecorded, true)
assert.equal(review.acceptedEvidence.attemptRecorded, true)
assert.equal(review.acceptedEvidence.failClosedResponseAccepted, true)
assert.equal(review.acceptedEvidence.contractSatisfiedForFutureRuntimeAccepted, true)
assert.equal(review.acceptedEvidence.persistedDispatchReferenceEnvelopeAccepted, true)
assert.equal(review.acceptedEvidence.privateServiceRequestEvidenceAccepted, true)
assert.equal(review.acceptedEvidence.cloudRunJobExecutionEvidenceAccepted, true)
assert.equal(review.acceptedEvidence.singleTaskExecutionAccepted, true)
assert.equal(review.acceptedEvidence.identityTokenRuntimeScopeAccepted, true)
assert.equal(review.acceptedEvidence.authHeaderRuntimeScopeAccepted, true)
assert.equal(review.acceptedEvidence.targetUrlRedactionAccepted, true)
assert.equal(review.acceptedEvidence.logPayloadUrlValueAbsentAccepted, true)
assert.equal(review.acceptedEvidence.logPayloadTokenValueAbsentAccepted, true)
assert.equal(review.acceptedEvidence.responsePersistenceBlockedAccepted, true)
assert.equal(review.acceptedEvidence.creditSpendBlockedAccepted, true)
assert.equal(review.acceptedEvidence.selectedGpuL4Accepted, true)
assert.equal(review.acceptedEvidence.scaleToZeroCostPostureAccepted, true)
assert.equal(review.acceptedEvidence.maxScaleOneAccepted, true)
assert.equal(review.acceptedEvidence.signedUrlsRemainNonSourceOfTruth, true)
assert.equal(review.acceptedEvidence.publicUrlsRemainNonSourceOfTruth, true)
assert.equal(review.acceptedEvidence.inferenceNonExecutionAccepted, true)
assert.equal(review.acceptedEvidence.modelImportNonExecutionAccepted, true)
assert.equal(review.acceptedEvidence.modelLoadNonExecutionAccepted, true)
assert.equal(review.acceptedEvidence.vllmNonInitializationAccepted, true)
assert.equal(review.acceptedEvidence.forwardPassNonExecutionAccepted, true)
assert.equal(review.acceptedEvidence.generatedAssetNonCreationAccepted, true)
assert.equal(review.acceptedEvidence.supabaseNonMutationAccepted, true)
assert.equal(review.acceptedEvidence.storageAndPublicArtifactNonCreationAccepted, true)
assert.equal(review.acceptedEvidence.creditMutationNonCreationAccepted, true)
assert.equal(
  review.remainingBlockers
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferencePlanRequired,
  true,
)
assert.equal(review.remainingBlockers.readyForRealWorkerDispatch, false)
assert.equal(review.remainingBlockers.qwenInferenceAcceptedNow, false)
assert.equal(review.runtimeFlags.approvedFixturePrivateInvokeAttemptResultReviewRecorded, true)
assert.equal(review.runtimeFlags.approvedFixturePrivateInvokeAttemptResultReviewAccepted, true)
assert.equal(review.runtimeFlags.approvedFixturePrivateInferencePlanRequired, true)
assert.equal(review.runtimeFlags.privateContractReachabilityAcceptedForFutureInferencePlan, true)
assert.equal(review.runtimeFlags.failClosedResponseAccepted, true)
assertFalseRuntimeFlags(review.runtimeFlags as unknown as JsonRecord)
assert.equal(review.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(review.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)

const forbiddenDataFindings = scanValues(review)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in approved-fixture private invoke attempt result review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  acceptedAttemptResult: review.acceptedEvidence.approvedFixturePrivateInvokeAttemptResultAccepted,
  acceptedFailClosedResponse: review.acceptedEvidence.failClosedResponseAccepted,
  approvedFixturePrivateInferencePlanRequired:
    review.remainingBlockers
      .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferencePlanRequired,
  inferenceRun: review.runtimeFlags.inferenceRun,
  generatedAssetsCreated: review.runtimeFlags.generatedAssetsCreated,
  nextPrompt: review.nextPrompt,
}, null, 2))
