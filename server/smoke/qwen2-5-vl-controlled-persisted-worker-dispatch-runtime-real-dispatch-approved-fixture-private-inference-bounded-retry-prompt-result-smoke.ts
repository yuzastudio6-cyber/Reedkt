import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_bounded_retry_prompt_blocked_live_gcloud_reauthentication_required'
const BLOCKER = 'local_gcloud_reauthentication_required_before_58dw_runtime'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight'

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
  ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
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
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.ts',
  'server/cli/external-agent-tool-next-command.ts',
  'server/smoke/external-agent-tool-next-command-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result-smoke.ts',
  'package script mismatch',
)

const cliSource = read('server/cli/external-agent-tool-next-command.ts')
for (const phrase of [
  'staticExecutionGateAllowed',
  'qwenLivePreflightPassed',
  'qwenServiceDescribePassed',
  'qwenJobDescribePassed',
  'whenStaticGateAllowsButQwenLivePreflightFails',
]) {
  assert.ok(cliSource.includes(phrase), `Next-command CLI missing live preflight guard phrase: ${phrase}`)
}

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
)
for (const phrase of [
  DECISION,
  '58DW bounded retry prompt boundary',
  'static external-agent gate allows Qwen prompt: true',
  'Qwen live preflight passed: false',
  'Qwen auth refresh passed: false',
  'Qwen service describe passed: false',
  'Qwen job describe passed: false',
  'bounded retry prompt executed: false',
  BLOCKER,
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(result.upstreamGateAlignmentDecision, QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT.decision)
assert.equal(result.boundedRetryPromptResult.staticExternalAgentGateAllowsQwenPrompt, true)
assert.equal(result.boundedRetryPromptResult.liveNextCommandRequiresQwenPreflight, true)
assert.equal(result.boundedRetryPromptResult.qwenLivePreflightPassed, false)
assert.equal(result.boundedRetryPromptResult.qwenAuthRefreshPassed, false)
assert.equal(result.boundedRetryPromptResult.qwenServiceDescribePassed, false)
assert.equal(result.boundedRetryPromptResult.qwenJobDescribePassed, false)
assert.equal(result.boundedRetryPromptResult.qwenDownstreamProbeSkipped, true)
assert.equal(result.boundedRetryPromptResult.blocker, BLOCKER)
assert.equal(result.boundedRetryPromptResult.blockedBeforeRuntimeMutation, true)
assert.equal(result.boundedRetryPromptResult.blockedBeforeGpuSpend, true)
assert.equal(result.boundedRetryPromptResult.boundedRetryPromptExecuted, false)
assert.equal(result.sanitizedDiagnosticSummary.tokenRefreshValueCaptured, false)
assert.equal(result.sanitizedDiagnosticSummary.tokenPrinted, false)
assert.equal(result.sanitizedDiagnosticSummary.credentialPrinted, false)
assert.equal(result.sanitizedDiagnosticSummary.serviceUrlPrinted, false)

for (const [key, value] of Object.entries(result.runtimeFlags)) {
  if ([
    'boundedRetryPromptResultRecorded',
    'liveNextCommandAuthGuardRecorded',
    'staticExternalAgentGateInspected',
    'staticExternalAgentGateAllowsQwenPrompt',
  ].includes(key)) {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must be false`)
  }
}

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in bounded retry prompt result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      blocker: result.boundedRetryPromptResult.blocker,
      staticExternalAgentGateAllowsQwenPrompt:
        result.boundedRetryPromptResult.staticExternalAgentGateAllowsQwenPrompt,
      qwenLivePreflightPassed: result.boundedRetryPromptResult.qwenLivePreflightPassed,
      boundedRetryPromptExecuted: result.boundedRetryPromptResult.boundedRetryPromptExecuted,
      inferenceRun: result.runtimeFlags.inferenceRun,
      generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
