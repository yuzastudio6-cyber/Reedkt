import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_gate_alignment_accepted_explicit_tool_prompt_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-PRIVATE-INFERENCE-BOUNDED-RETRY-PROMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation'

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
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(runtimeRunNow|serviceTargetResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|cloudRunInvocationAttempted|cloudRunJobExecuted|serviceRuntimeRequestSent|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
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

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
)
for (const phrase of [
  DECISION,
  'aligns the external-agent execution gate',
  'does not run the retry',
  'Qwen may be marked ready for explicit tool gate: true',
  'explicit tool-specific bounded execution prompt required before runtime: true',
  'raw chat execution allowed: false',
  'generated assets allowed: false',
  'B-roll remains independently quota-blocked',
  '`runtimeRunNow=false`',
  '`cloudRunInvocationAttempted=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`inferenceRun=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.ts',
]) {
  assertNoForbiddenText(file)
}

const alignment =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT
assert.equal(alignment.decision, DECISION)
assert.equal(alignment.nextPrompt, NEXT_PROMPT)
assert.equal(
  alignment.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceRetryAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_RETRY_ATTEMPT_RESULT.decision,
)
assert.equal(alignment.alignmentOutcome.retryAttemptResultRecorded, true)
assert.equal(alignment.alignmentOutcome.failClosedMismatchIdentified, true)
assert.equal(alignment.alignmentOutcome.externalAgentGateAlignedForFutureBoundedQwenRetryPrompt, true)
assert.equal(alignment.alignmentOutcome.qwenMayBeMarkedReadyForExplicitToolGate, true)
assert.equal(alignment.alignmentOutcome.directRuntimeActionFromThisPacketAllowed, false)
assert.equal(
  alignment.alignmentOutcome.explicitToolSpecificBoundedExecutionPromptRequiredBeforeRuntime,
  true,
)
assert.equal(alignment.gateAlignmentRules.requireGoPassMeansNextPromptOnly, true)
assert.equal(alignment.gateAlignmentRules.requireGoPassRunsRuntimeByItself, false)
assert.equal(alignment.gateAlignmentRules.retryPromptMustRepeatLiveAuthServiceJobChecks, true)
assert.equal(alignment.gateAlignmentRules.brollRemainsIndependentlyQuotaBlocked, true)

for (const [key, value] of Object.entries(alignment.runtimeFlags)) {
  if ([
    'externalAgentGateAlignmentRecorded',
    'qwenReadyForExplicitToolGate',
    'requiresToolSpecificBoundedExecutionPrompt',
  ].includes(key)) {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must be false`)
  }
}

const forbiddenDataFindings = scanValues(alignment)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in gate alignment data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: alignment.decision,
  qwenReadyForExplicitToolGate: alignment.runtimeFlags.qwenReadyForExplicitToolGate,
  runtimeRunNow: alignment.runtimeFlags.runtimeRunNow,
  cloudRunInvocationAttempted: alignment.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: alignment.runtimeFlags.inferenceRun,
  generatedAssetsCreated: alignment.runtimeFlags.generatedAssetsCreated,
  nextPrompt: alignment.nextPrompt,
}, null, 2))
