import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildQwen25VlPrivateInvokeEnvelope,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import { createQwen25VlPrivateInvokeConfigCandidate } from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_envelope_contract_defined_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_46-GCLOUD-REAUTH-USER: refresh local gcloud auth outside Codex, no token/no invocation'

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
  ['execution true claim', /\b(serviceUrlResolvedNow|audienceResolvedNow|authHeaderCreated|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

function assertAllFalse(flags: JsonRecord, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-envelope-contract.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/index.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope-contract-smoke.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md',
  'docs/qwen2-5-vl-7b-private-invoke-auth-verify-result.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-envelope-contract'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope-contract-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-envelope-contract.md')
for (const phrase of [
  DECISION,
  'backend-only private invocation envelope',
  '`POST`',
  '`/`',
  '`application/json`',
  '`65536`',
  '`qwen2_5_vl_cloud_run_gpu_runtime_request_v1`',
  '`validQueueFixtureAcceptedForEnvelope=true`',
  '`validConfigCandidateAcceptedForEnvelope=true`',
  '`envelopeAcceptedForFutureTransport=true`',
  '`invocationAllowedNow=false`',
  '`cloudRunInvocationAttempted=false`',
  '`identityTokenFetched=false`',
  '`inferenceRun=false`',
  'interactive reauthentication',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const evidence = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE
const contract = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT
const validResult = buildQwen25VlPrivateInvokeEnvelope()

assert.equal(evidence.decision, DECISION)
assert.equal(evidence.nextPrompt, NEXT_PROMPT)
assert.equal(contract.decision, DECISION)
assert.equal(contract.method, 'POST')
assert.equal(contract.path, '/')
assert.equal(contract.contentType, 'application/json')
assert.equal(contract.maxBodyBytes, 65536)
assert.equal(contract.derivesBodyFromApprovedSnapshotQueuePayload, true)
assert.equal(contract.serviceUrlStoredInRepo, false)
assert.equal(contract.serviceUrlResolvedNow, false)
assert.equal(contract.audienceResolvedNow, false)
assert.equal(contract.authHeaderCreated, false)
assert.equal(contract.identityTokenFetched, false)
assert.equal(contract.invokesCloudRun, false)
assert.equal(contract.sendsRequest, false)
assert.equal(contract.enablesInference, false)
assert.equal(contract.acceptedForFutureBackendTransportOnly, true)

assert.equal(validResult.ok, false)
assert.equal(validResult.status, 'blocked_private_invocation_disabled')
assert.equal(validResult.decision, DECISION)
assert.equal(validResult.queueContractValidated, true)
assert.equal(validResult.configContractValidated, true)
assert.equal(validResult.envelopeAcceptedForFutureTransport, true)
assert.equal(validResult.invocationAllowedNow, false)
check(validResult.envelope, 'valid result must expose an envelope')
assert.equal(validResult.envelope.method, 'POST')
assert.equal(validResult.envelope.path, '/')
assert.equal(validResult.envelope.contentType, 'application/json')
assert.equal(validResult.envelope.maxBodyBytes, 65536)
assert.equal(validResult.envelope.schemaVersion, QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion)
assert.equal(validResult.envelope.approvedPlanSnapshotId, 'aps_mock_qwen_queue_001')
assert.equal(validResult.envelope.jobId, 'job_mock_qwen_queue_001')
assert.equal(validResult.envelope.idempotencyKey, 'idem_mock_qwen_queue_001')
assert.equal(validResult.envelope.authHeaderRequiredForFutureRuntime, true)
assert.equal(validResult.envelope.authHeaderPresentNow, false)
assert.equal(validResult.envelope.serviceUrlResolvedNow, false)
assert.equal(validResult.envelope.audienceResolvedNow, false)
assert.ok(validResult.envelope.bodyByteLength > 0, 'body must not be empty')
assert.ok(
  validResult.envelope.bodyByteLength <= validResult.envelope.maxBodyBytes,
  'body must fit max body bytes',
)
assert.deepEqual(validResult.queueIssues, [])
assert.deepEqual(validResult.configIssues, [])

const invalidQueueFixture = clone(
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
) as JsonRecord
delete invalidQueueFixture.approvedPlanSnapshotId
const invalidQueueResult = buildQwen25VlPrivateInvokeEnvelope({
  queueFixture: invalidQueueFixture,
})
assert.equal(invalidQueueResult.status, 'blocked_invalid_queue_contract')
assert.equal(invalidQueueResult.queueContractValidated, false)
assert.equal(invalidQueueResult.envelopeAcceptedForFutureTransport, false)
assert.equal(invalidQueueResult.envelope, undefined)
assert.ok(invalidQueueResult.queueIssues.includes('missing_approved_snapshot'))

const invalidConfigResult = buildQwen25VlPrivateInvokeEnvelope({
  configCandidate: createQwen25VlPrivateInvokeConfigCandidate({
    invocationEnabledNow: true,
  }),
})
assert.equal(invalidConfigResult.status, 'blocked_invalid_private_invoke_config')
assert.equal(invalidConfigResult.queueContractValidated, true)
assert.equal(invalidConfigResult.configContractValidated, false)
assert.equal(invalidConfigResult.envelopeAcceptedForFutureTransport, false)
assert.equal(invalidConfigResult.envelope, undefined)
assert.ok(invalidConfigResult.configIssues.includes('invocation_must_stay_disabled'))

assert.equal(evidence.validationResults.validEnvelopeResult.status, 'blocked_private_invocation_disabled')
assert.equal(evidence.validationResults.blockedInvalidQueueResult.status, 'blocked_invalid_queue_contract')
assert.equal(evidence.validationResults.blockedInvalidConfigResult.status, 'blocked_invalid_private_invoke_config')
assert.equal(evidence.requestShape.bodyDerivedFromApprovedSnapshotQueuePayload, true)
assert.equal(evidence.requestShape.serviceUrlIncluded, false)
assert.equal(evidence.requestShape.authHeaderIncluded, false)
assert.equal(evidence.requestShape.identityTokenIncluded, false)
assert.equal(
  evidence.currentBlocker,
  'local_gcloud_session_requires_interactive_reauthentication_before_private_invoke_verify',
)

assert.equal(validResult.runtimeFlags.envelopeContractDefined, true)
assert.equal(validResult.runtimeFlags.validQueueFixtureAcceptedForEnvelope, true)
assert.equal(validResult.runtimeFlags.validConfigCandidateAcceptedForEnvelope, true)
assert.equal(validResult.runtimeFlags.envelopeAcceptedForFutureTransport, true)

const falseRuntimeFlags = [
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
]
assertAllFalse(validResult.runtimeFlags as JsonRecord, falseRuntimeFlags)
assertAllFalse(evidence.runtimeFlags as JsonRecord, falseRuntimeFlags)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-envelope-contract.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  contract,
  evidence,
  validEnvelope: validResult.envelope,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in private invoke envelope data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  status: validResult.status,
  bodyByteLength: validResult.envelope.bodyByteLength,
  maxBodyBytes: validResult.envelope.maxBodyBytes,
  validQueueFixtureAcceptedForEnvelope:
    validResult.runtimeFlags.validQueueFixtureAcceptedForEnvelope,
  validConfigCandidateAcceptedForEnvelope:
    validResult.runtimeFlags.validConfigCandidateAcceptedForEnvelope,
  envelopeAcceptedForFutureTransport: validResult.envelopeAcceptedForFutureTransport,
  invocationAllowedNow: validResult.invocationAllowedNow,
  cloudRunInvocationAttempted: validResult.runtimeFlags.cloudRunInvocationAttempted,
  identityTokenFetched: validResult.runtimeFlags.identityTokenFetched,
  inferenceRun: validResult.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
