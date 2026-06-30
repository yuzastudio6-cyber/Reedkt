import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_attempt_passed_fail_closed_result_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CW-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-ATTEMPT-RESULT-REVIEW: review controlled Qwen real-dispatch transport attempt result, no inference/no generated assets/no beta'

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
    'unsafe false-side-effect true claim',
    /\b(modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'serviceUrlValueStored',
    'audienceValueStored',
    'identityTokenPrinted',
    'identityTokenValueStored',
    'authHeaderValueStored',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.ts',
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
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.md',
)
for (const phrase of [
  DECISION,
  'It created one Cloud Run Job execution and one internal service request.',
  '`qwen25-persisted-real-dispatch-transport-attempt-20260630T073537Z`',
  '`reeditpro-qwen2-5-vl-private-caller-fwrgv`',
  'HTTP status: 403',
  'service reason: `qwen_inference_disabled_after_contract_check`',
  'classification status: `blocked_contract_valid_inference_disabled`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptPassedFailClosed=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReviewRequired=true`',
  '`cloudRunJobExecutionCreated=true`',
  '`cloudRunInvocationAttempted=true`',
  '`serviceRuntimeRequestSent=true`',
  '`identityTokenPrinted=false`',
  '`authHeaderValueStored=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`vllmEngineInitialized=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`creditMutationCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_APPROVAL.decision,
)
assert.equal(result.attemptSummary.approvalRecorded, true)
assert.equal(result.attemptSummary.attemptRequired, false)
assert.equal(result.attemptSummary.attemptRecorded, true)
assert.equal(result.attemptSummary.attemptPassedFailClosed, true)
assert.equal(result.attemptSummary.resultReviewRequired, true)
assert.equal(
  result.attemptSummary.runId,
  'qwen25-persisted-real-dispatch-transport-attempt-20260630T073537Z',
)
assert.equal(result.attemptSummary.executionName, 'reeditpro-qwen2-5-vl-private-caller-fwrgv')
assert.equal(result.attemptSummary.completed, true)
assert.equal(result.attemptSummary.exitCode, 0)
assert.equal(result.attemptSummary.succeededCount, 1)
assert.equal(result.transportAttempt.selectedPath, 'cpu_only_internal_caller_cloud_run_job')
assert.equal(result.transportAttempt.targetUrlResolvedInMemory, true)
assert.equal(result.transportAttempt.targetUrlPrinted, false)
assert.equal(result.transportAttempt.targetUrlStored, false)
assert.equal(result.transportAttempt.audienceResolvedInMemory, true)
assert.equal(result.transportAttempt.audiencePrinted, false)
assert.equal(result.transportAttempt.audienceStored, false)
assert.equal(result.transportAttempt.identityTokenFetchedInsideCaller, true)
assert.equal(result.transportAttempt.identityTokenPrinted, false)
assert.equal(result.transportAttempt.authHeaderCreatedInsideCaller, true)
assert.equal(result.transportAttempt.authHeaderPrinted, false)
assert.equal(result.transportAttempt.cloudRunJobExecutionCreated, true)
assert.equal(result.transportAttempt.cloudRunInvocationAttempted, true)
assert.equal(result.transportAttempt.serviceRuntimeRequestSent, true)
assert.equal(result.transportAttempt.retryAttempted, false)
assert.equal(result.response.httpStatus, 403)
assert.equal(result.response.expectedHttpStatus, 403)
assert.equal(result.response.serviceReason, 'qwen_inference_disabled_after_contract_check')
assert.equal(result.response.contractSatisfiedForFutureRuntime, true)
assert.equal(result.response.runtimeContractExecutesNow, false)
assert.equal(result.response.modelInferenceEnabled, false)
assert.equal(result.response.classificationStatus, 'blocked_contract_valid_inference_disabled')
assert.equal(result.response.runtimeCanAdvanceNow, false)
assert.equal(result.response.metadataOutputStored, false)
assert.equal(result.response.rawResponseBodyStored, false)
assert.equal(result.postAttemptState.cpuCallerDefaultExecutionGateFalse, true)
assert.equal(result.postAttemptState.gpuServiceRevisionUnchanged, true)
assert.equal(result.postAttemptState.failClosedEnvStillFalse, true)
assert.equal(result.runtimeFlags.serviceUrlResolvedNow, true)
assert.equal(result.runtimeFlags.audienceResolvedNow, true)
assert.equal(result.runtimeFlags.identityTokenFetched, true)
assert.equal(result.runtimeFlags.authHeaderCreated, true)
assert.equal(result.runtimeFlags.cloudRunJobExecutionCreated, true)
assert.equal(result.runtimeFlags.cloudRunInvocationAttempted, true)
assert.equal(result.runtimeFlags.serviceRuntimeRequestSent, true)
assert.equal(result.runtimeFlags.responseClassifiedLocally, true)
assert.equal(result.runtimeFlags.failClosedResponseObserved, true)
assertFalseRuntimeFlags(result.runtimeFlags as unknown as JsonRecord)
assert.equal(result.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(result.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in transport attempt result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  runId: result.attemptSummary.runId,
  executionName: result.attemptSummary.executionName,
  httpStatus: result.response.httpStatus,
  serviceReason: result.response.serviceReason,
  attemptPassedFailClosed: result.attemptSummary.attemptPassedFailClosed,
  inferenceRun: result.runtimeFlags.inferenceRun,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  nextPrompt: result.nextPrompt,
}, null, 2))
