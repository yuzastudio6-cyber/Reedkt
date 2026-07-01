import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_GATE_ALIGNMENT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_bounded_retry_prompt_blocked_structured_metadata_schema_invalid'
const BLOCKER = 'structured_metadata_schema_invalid_after_bounded_58dw_retry'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-FIX: tighten Qwen fixture structured-output generation after schema-invalid bounded retry, no generated assets/no mutation'

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
  ['unsafe output true claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|supabaseTouched|sqlExecuted|creditMutationCreated|betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
  'server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts',
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
  'package result smoke script mismatch',
)
assert.equal(
  packageJson.scripts?.['qwen2-5-vl-58dw-bounded-private-inference-retry'],
  'tsx server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts',
  'package bounded retry runner script mismatch',
)

const runnerSource = read('server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts')
for (const phrase of [
  'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY',
  'external-agent-tool-next-command.ts',
  'QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED',
  'QWEN_CPU_CALLER_EXECUTION_ENABLED',
  'QWEN_PRIVATE_INVOKE_TARGET_URL',
  'redacted_not_stored',
  'restore_service_fail_closed',
  'generatedLocalFixturePassedClaimed',
]) {
  assert.ok(runnerSource.includes(phrase), `Runner missing safety phrase: ${phrase}`)
}

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
)
for (const phrase of [
  DECISION,
  '58DW bounded retry prompt result',
  'Qwen live preflight passed: true',
  'Qwen auth refresh passed: true',
  'Qwen service describe passed: true',
  'Qwen job describe passed: true',
  'bounded retry prompt executed: true',
  'CPU caller exit code: `3`',
  BLOCKER,
  '`parsedJson=true`',
  '`schemaValid=false`',
  '`schemaKeys=["confidence","label","region"]`',
  '`rawOutputStoredInRepo=false`',
  '`modelImportRun=true`',
  '`modelLoadRun=true`',
  '`vllmEngineInitialized=true`',
  '`inferenceRun=true`',
  '`serviceRestoredFailClosed=true`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.ts',
  'server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts',
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
assert.equal(result.boundedRetryPromptResult.qwenLivePreflightPassed, true)
assert.equal(result.boundedRetryPromptResult.qwenAuthRefreshPassed, true)
assert.equal(result.boundedRetryPromptResult.qwenServiceDescribePassed, true)
assert.equal(result.boundedRetryPromptResult.qwenJobDescribePassed, true)
assert.equal(result.boundedRetryPromptResult.qwenDownstreamProbeSkipped, false)
assert.equal(result.boundedRetryPromptResult.blocker, BLOCKER)
assert.equal(result.boundedRetryPromptResult.boundedRetryPromptExecuted, true)
assert.equal(result.boundedRetryPromptResult.boundedRetryPassed, false)
assert.equal(result.boundedRetryPromptResult.serviceRestoredFailClosed, true)
assert.equal(result.sanitizedMetadataOutput.parsedJson, true)
assert.equal(result.sanitizedMetadataOutput.schemaValid, false)
assert.deepEqual(result.sanitizedMetadataOutput.schemaKeys, ['confidence', 'label', 'region'])
assert.equal(result.sanitizedMetadataOutput.rawOutputStoredInRepo, false)
assert.equal(result.sanitizedDiagnosticSummary.tokenRefreshValueCaptured, false)
assert.equal(result.sanitizedDiagnosticSummary.tokenPrinted, false)
assert.equal(result.sanitizedDiagnosticSummary.credentialPrinted, false)
assert.equal(result.sanitizedDiagnosticSummary.serviceUrlPrinted, false)
assert.equal(result.sanitizedDiagnosticSummary.rawModelOutputStored, false)

for (const key of [
  'runtimeRunNow',
  'temporaryFixtureInferenceServiceRevisionDeployed',
  'cloudRunJobExecuted',
  'serviceTargetResolvedAtRuntimeOnly',
  'audienceResolvedAtRuntimeOnly',
  'identityTokenFetched',
  'authHeaderCreated',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
  'modelImportRun',
  'modelLoadRun',
  'vllmEngineInitialized',
  'promptProcessed',
  'forwardPassRun',
  'inferenceRun',
  'temporaryFixtureInferenceServiceRestored',
  'serviceRestoredFailClosed',
] as const) {
  assert.equal(result.runtimeFlags[key], true, `${key} must be true`)
}

for (const key of [
  'structuredMetadataAccepted',
  'schemaValid',
  'rawModelOutputStored',
  'serviceTargetValueStoredInRepo',
  'audienceValueStoredInRepo',
  'identityTokenPrinted',
  'identityTokenValueStored',
  'authHeaderValueStored',
  'providerCallsMade',
  'workersDispatched',
  'supabaseTouched',
  'sqlExecuted',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'creditMutationCreated',
  'mediaProcessingRun',
  'renderExportRun',
  'betaReady',
  'productionReady',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
] as const) {
  assert.equal(result.runtimeFlags[key], false, `${key} must be false`)
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
      qwenLivePreflightPassed: result.boundedRetryPromptResult.qwenLivePreflightPassed,
      boundedRetryPromptExecuted: result.boundedRetryPromptResult.boundedRetryPromptExecuted,
      inferenceRun: result.runtimeFlags.inferenceRun,
      schemaValid: result.sanitizedMetadataOutput.schemaValid,
      serviceRestoredFailClosed: result.runtimeFlags.serviceRestoredFailClosed,
      generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
