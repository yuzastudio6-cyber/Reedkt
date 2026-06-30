import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_preflight_verified_attempt_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CU-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-ATTEMPT-APPROVAL: approve controlled Qwen real-dispatch transport attempt, no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|transportDependenciesEnabledNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRequired',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval-smoke.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.md')
for (const phrase of [
  DECISION,
  'transport preflight approval accepted for future preflight: true',
  'controlled transport preflight recorded: true',
  'controlled transport preflight passed: true',
  'controlled transport attempt approval required: true',
  'static envelope verified only: true',
  'service URL resolution approved now: false',
  'audience resolution approved now: false',
  'identity-token fetch approved now: false',
  'auth-header creation approved now: false',
  'private request send approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'approved snapshot and private source refs',
  'service URL resolver',
  'audience resolver',
  'identity-token dependency',
  'auth-header redaction',
  'private request envelope',
  'timeout retry idempotency',
  'response classification',
  'persistence QA audit cost credit',
  'cleanup rollback beta production lock',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPassed=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRequired=true`',
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
  'what went wrong',
  NEXT_PROMPT,
]) {
  assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.ts',
]) {
  assertNoForbiddenText(file)
}

const preflight =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT
const approval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_APPROVAL

assert.equal(preflight.decision, DECISION)
assert.equal(preflight.nextPrompt, NEXT_PROMPT)
assert.equal(
  preflight.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalDecision,
  approval.decision,
)
assert.equal(preflight.preflightDecision.decisionRecorded, true)
assert.equal(
  preflight.preflightDecision.acceptsTransportPreflightApprovalForFutureTransportAttemptApproval,
  true,
)
assert.equal(preflight.preflightDecision.controlledTransportPreflightRecorded, true)
assert.equal(preflight.preflightDecision.controlledTransportPreflightPassed, true)
assert.equal(preflight.preflightDecision.controlledTransportAttemptApprovalRequired, true)
assert.equal(preflight.preflightDecision.staticEnvelopeVerifiedOnly, true)
assert.equal(preflight.preflightDecision.approvesServiceUrlResolutionNow, false)
assert.equal(preflight.preflightDecision.approvesAudienceResolutionNow, false)
assert.equal(preflight.preflightDecision.approvesIdentityTokenFetchNow, false)
assert.equal(preflight.preflightDecision.approvesAuthHeaderCreationNow, false)
assert.equal(preflight.preflightDecision.approvesPrivateRequestSendNow, false)
assert.equal(preflight.preflightDecision.approvesCloudRunInvocationNow, false)
assert.equal(preflight.preflightDecision.approvesQwenInferenceNow, false)
assert.equal(preflight.approvedRuntimePosture.gpu, 'nvidia_l4')
assert.equal(preflight.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(preflight.approvedRuntimePosture.minInstances, 0)
assert.equal(preflight.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(preflight.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.deepEqual(
  preflight.verifiedTransportPreflightAreas.map((entry) => entry.id),
  approval.acceptedPreflightEvidence.map((entry) => entry.id),
)
assert.equal(
  preflight.verifiedTransportPreflightAreas.every((entry) => entry.prerequisiteCategoryVerified),
  true,
)
assert.equal(
  preflight.verifiedTransportPreflightAreas.every((entry) => entry.staticEnvelopeVerifiedOnly),
  true,
)
assert.equal(
  preflight.verifiedTransportPreflightAreas.every((entry) => !entry.runtimeValueResolvedNow),
  true,
)
assert.equal(preflight.verifiedTransportPreflightAreas.every((entry) => !entry.requestSentNow), true)
assert.equal(preflight.verifiedTransportPreflightAreas.every((entry) => !entry.executionAllowedNow), true)
assert.equal(preflight.futureTransportAttemptRules.workersExecuteApprovedSnapshots, true)
assert.equal(preflight.futureTransportAttemptRules.rawChatWorkerExecutionAllowed, false)
assert.equal(preflight.futureTransportAttemptRules.rawWorkerPromptAllowed, false)
assert.equal(preflight.futureTransportAttemptRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(preflight.futureTransportAttemptRules.frontendMayCallCloudRun, false)
assert.equal(preflight.futureTransportAttemptRules.staticEnvelopeVerifiedOnlyNow, true)
assert.equal(preflight.futureTransportAttemptRules.serviceUrlResolutionRequiresAttemptApproval, true)
assert.equal(preflight.futureTransportAttemptRules.cloudRunInvocationRequiresAttemptApproval, true)
assert.equal(preflight.futureTransportAttemptRules.inferenceRequiresSeparateApproval, true)
assert.equal(
  preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRecorded,
  true,
)
assert.equal(
  preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPassed,
  true,
)
assert.equal(
  preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRequired,
  true,
)
assertFalseRuntimeFlags(preflight.runtimeFlags)

const forbiddenFindings = scanValues(preflight)
assert.deepEqual(forbiddenFindings, [], `Forbidden value in preflight: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: preflight.decision,
      verifiedPreflightAreaCount: preflight.verifiedTransportPreflightAreas.length,
      staticEnvelopeVerifiedOnly: preflight.preflightDecision.staticEnvelopeVerifiedOnly,
      runtimeFlagsFalse: true,
      selectedGpu: preflight.approvedRuntimePosture.gpu,
      costPosture: preflight.approvedRuntimePosture.costPosture,
      nextPrompt: preflight.nextPrompt,
    },
    null,
    2,
  ),
)
