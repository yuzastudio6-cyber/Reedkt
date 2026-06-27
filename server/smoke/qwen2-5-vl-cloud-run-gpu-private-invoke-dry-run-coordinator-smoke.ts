import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  runQwen25VlPrivateInvokeDryRun,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_CONTRACT,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_coordinator_defined_no_transport'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_48-PRIVATE-INVOKE-DRY-RUN-ROUTE-CONTRACT: define backend route contract for Qwen dry-run invocation, no transport'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['execution true claim', /\b(transportAttemptedNow|serviceUrlResolvedNow|audienceResolvedNow|authHeaderCreated|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
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

function assertNoSideEffects(result: {
  runtimeCanAdvanceNow: boolean
  transportAttemptedNow: boolean
  invocationAllowedNow: boolean
  runtimeFlags: JsonRecord
}) {
  assert.equal(result.runtimeCanAdvanceNow, false)
  assert.equal(result.transportAttemptedNow, false)
  assert.equal(result.invocationAllowedNow, false)
  for (const key of [
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'dispatchSubmitted',
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
    'betaUnlocked',
    'productionUnlocked',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(result.runtimeFlags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-coordinator.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-envelope-contract.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-response-contract.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run.ts',
  'src/backend/workers/index.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-coordinator-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-coordinator'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-coordinator-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-coordinator.md')
for (const phrase of [
  DECISION,
  '`blocked_transport_not_attempted`',
  '`service_unavailable`',
  '`blocked_transport_disabled`',
  '`blocked_envelope_not_accepted`',
  '`blocked_invalid_envelope`',
  '`blocked_response_not_runtime_advanceable`',
  '`transportAdapterPreviewed=true`',
  '`transportAttemptedNow=false`',
  '`serviceUrlResolvedNow=false`',
  '`authHeaderCreated=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const contract = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_CONTRACT
const evidence = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN
assert.equal(contract.decision, DECISION)
assert.equal(contract.coordinatesEnvelopeAndResponseClassification, true)
assert.equal(contract.requiresApprovedSnapshotQueueEnvelope, true)
assert.equal(contract.defaultTransportBlocker, 'service_unavailable')
assert.equal(contract.transportAttemptedNow, false)
assert.equal(contract.invocationAllowedNow, false)
assert.equal(contract.runtimeCanAdvanceNow, false)
assert.equal(contract.resolvesServiceUrl, false)
assert.equal(contract.createsAuthHeader, false)
assert.equal(contract.fetchesIdentityToken, false)
assert.equal(contract.invokesCloudRun, false)
assert.equal(contract.persistsOutput, false)
assert.equal(contract.mutatesWorkerState, false)
assert.equal(contract.mutatesSupabase, false)
assert.equal(contract.spendsCredits, false)
assert.equal(contract.createsGeneratedAsset, false)
assert.equal(contract.createsPublicArtifact, false)
assert.equal(contract.createsSignedUrl, false)

assert.equal(evidence.decision, DECISION)
assert.equal(evidence.nextPrompt, NEXT_PROMPT)

const defaultDryRun = runQwen25VlPrivateInvokeDryRun()
assert.equal(defaultDryRun.status, 'blocked_transport_not_attempted')
assert.equal(defaultDryRun.envelopeResult.envelopeAcceptedForFutureTransport, true)
assert.equal(defaultDryRun.transportAdapterPreview.status, 'blocked_transport_disabled')
assert.equal(defaultDryRun.transportAdapterPreview.envelopeAcceptedForFutureTransport, true)
assert.equal(defaultDryRun.transportAdapterPreview.runtimeFlags.cloudRunInvocationAttempted, false)
assert.equal(defaultDryRun.transportAdapterPreview.runtimeFlags.identityTokenFetched, false)
assert.equal(defaultDryRun.runtimeFlags.transportAdapterPreviewed, true)
assert.equal(defaultDryRun.responseClassification.status, 'blocked_transport_unavailable')
assert.equal(defaultDryRun.runtimeFlags.envelopeAcceptedForFutureTransport, true)
assert.equal(defaultDryRun.runtimeFlags.responseClassifiedLocally, true)
assert.equal(defaultDryRun.runtimeFlags.transportBlockerRecognized, true)
assertNoSideEffects(defaultDryRun)

const invalidQueueFixture = clone(
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
) as JsonRecord
delete invalidQueueFixture.approvedPlanSnapshotId
const invalidDryRun = runQwen25VlPrivateInvokeDryRun({
  queueFixture: invalidQueueFixture,
})
assert.equal(invalidDryRun.status, 'blocked_envelope_not_accepted')
assert.equal(invalidDryRun.envelopeResult.envelopeAcceptedForFutureTransport, false)
assert.equal(invalidDryRun.transportAdapterPreview.status, 'blocked_invalid_envelope')
assert.equal(invalidDryRun.runtimeFlags.transportAdapterPreviewed, true)
assert.equal(invalidDryRun.responseClassification.status, 'blocked_transport_unavailable')
assertNoSideEffects(invalidDryRun)

const futureResponseDryRun = runQwen25VlPrivateInvokeDryRun({
  simulatedResponse: {
    httpStatus: 200,
    bodyJson: {
      ok: true,
      contractSchemaVersion: 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1',
      outputKind: 'metadata_only_visual_understanding',
      generatedAssetCreated: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      creditSpendCreated: false,
      findings: [{ id: 'finding_mock_qwen_dry_run_001' }],
    },
  },
})
assert.equal(futureResponseDryRun.status, 'blocked_response_not_runtime_advanceable')
assert.equal(futureResponseDryRun.transportAdapterPreview.status, 'blocked_transport_disabled')
assert.equal(futureResponseDryRun.responseClassification.status, 'accepted_future_metadata_output')
assert.equal(futureResponseDryRun.responseClassification.acceptedForFutureMetadataOnly, true)
assert.equal(futureResponseDryRun.responseClassification.runtimeCanAdvanceNow, false)
assert.equal(futureResponseDryRun.runtimeFlags.simulatedResponseUsed, true)
assertNoSideEffects(futureResponseDryRun)

assert.equal(
  evidence.dryRunResults.defaultAuthBlockedDryRun.status,
  'blocked_transport_not_attempted',
)
assert.equal(evidence.dryRunResults.invalidEnvelopeDryRun.status, 'blocked_envelope_not_accepted')
assert.equal(
  evidence.dryRunResults.futureMetadataResponseDryRun.status,
  'blocked_response_not_runtime_advanceable',
)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-coordinator.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ contract, evidence })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in private invoke dry-run data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  defaultStatus: defaultDryRun.status,
  invalidStatus: invalidDryRun.status,
  futureResponseStatus: futureResponseDryRun.status,
  transportAttemptedNow: defaultDryRun.transportAttemptedNow,
  invocationAllowedNow: defaultDryRun.invocationAllowedNow,
  cloudRunInvocationAttempted: defaultDryRun.runtimeFlags.cloudRunInvocationAttempted,
  identityTokenFetched: defaultDryRun.runtimeFlags.identityTokenFetched,
  inferenceRun: defaultDryRun.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
