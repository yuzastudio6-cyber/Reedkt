import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  classifyQwen25VlPrivateInvokeResponse,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-response'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_response_contract_defined_no_runtime_mutation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_47-PRIVATE-INVOKE-REAUTH-VERIFY: rerun guarded private invoke auth verification after user gcloud reauth, no token/no inference'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
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
  ['execution true claim', /\b(runtimeCanAdvanceNow|persistOutputAllowedNow|creditSpendAllowedNow|retryAllowedNow|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

function assertRuntimeCannotAdvance(result: {
  runtimeCanAdvanceNow: boolean
  persistOutputAllowedNow: boolean
  creditSpendAllowedNow: boolean
  retryAllowedNow: boolean
  runtimeFlags: JsonRecord
}) {
  assert.equal(result.runtimeCanAdvanceNow, false, 'runtime cannot advance now')
  assert.equal(result.persistOutputAllowedNow, false, 'persist output must be blocked')
  assert.equal(result.creditSpendAllowedNow, false, 'credit spend must be blocked')
  assert.equal(result.retryAllowedNow, false, 'retry must be blocked')
  for (const key of [
    'serviceRuntimeRequestSent',
    'cloudRunInvocationAttempted',
    'authHeaderCreated',
    'identityTokenFetched',
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-response-contract.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-envelope-contract.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts',
  'src/backend/workers/index.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-response-contract-smoke.ts',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-response-contract'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-response-contract-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-response-contract.md')
for (const phrase of [
  DECISION,
  '`blocked_contract_valid_inference_disabled`',
  '`qwen_inference_disabled_after_contract_check`',
  '`contractSatisfiedForFutureRuntime=true`',
  '`modelInferenceEnabled=false`',
  '`blocked_runtime_contract_rejected`',
  '`metadata_only_visual_understanding`',
  '`generatedAssetCreated=false`',
  '`publicArtifactCreated=false`',
  '`signedUrlCreated=false`',
  '`creditSpendCreated=false`',
  '`runtimeCanAdvanceNow=false`',
  '`persistOutputAllowedNow=false`',
  '`creditSpendAllowedNow=false`',
  '`retryAllowedNow=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const contract = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT
const evidence = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE

assert.equal(contract.decision, DECISION)
assert.equal(contract.runtimeSchemaVersion, QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion)
assert.equal(contract.classifiesCurrentFailClosedServiceResponses, true)
assert.equal(contract.recognizesTransportAuthBlockers, true)
assert.equal(contract.acceptsFutureMetadataOnlyOutputShape, true)
assert.equal(contract.runtimeCanAdvanceNow, false)
assert.equal(contract.persistOutputAllowedNow, false)
assert.equal(contract.creditSpendAllowedNow, false)
assert.equal(contract.retryAllowedNow, false)
assert.equal(contract.mutatesWorkerState, false)
assert.equal(contract.mutatesSupabase, false)
assert.equal(contract.createsGeneratedAsset, false)
assert.equal(contract.createsPublicArtifact, false)
assert.equal(contract.createsSignedUrl, false)

assert.equal(evidence.decision, DECISION)
assert.equal(evidence.nextPrompt, NEXT_PROMPT)

const disabled = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 403,
  bodyJson: {
    ok: false,
    reason: 'qwen_inference_disabled_after_contract_check',
    contractSchemaVersion: contract.runtimeSchemaVersion,
    contractSatisfiedForFutureRuntime: true,
    modelInferenceEnabled: false,
    runtimeContractExecutesNow: false,
  },
})
assert.equal(disabled.ok, false)
assert.equal(disabled.status, 'blocked_contract_valid_inference_disabled')
assert.equal(disabled.contractSatisfiedForFutureRuntime, true)
assert.equal(disabled.serviceReason, 'qwen_inference_disabled_after_contract_check')
assert.equal(disabled.runtimeFlags.currentServiceDisabledResponseRecognized, true)
assertRuntimeCannotAdvance(disabled)

const rejected = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 403,
  bodyJson: {
    ok: false,
    reason: 'qwen_runtime_contract_rejected',
    contractSatisfiedForFutureRuntime: false,
  },
})
assert.equal(rejected.status, 'blocked_runtime_contract_rejected')
assert.equal(rejected.contractSatisfiedForFutureRuntime, false)
assert.equal(rejected.runtimeFlags.runtimeContractRejectedResponseRecognized, true)
assertRuntimeCannotAdvance(rejected)

const tooLarge = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 413,
  bodyJson: {
    ok: false,
    reason: 'request_too_large',
    maxRequestBytes: 65536,
  },
})
assert.equal(tooLarge.status, 'blocked_request_too_large')
assertRuntimeCannotAdvance(tooLarge)

const invalidJson = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 400,
  bodyJson: {
    ok: false,
    reason: 'invalid_json',
  },
})
assert.equal(invalidJson.status, 'blocked_invalid_json')
assertRuntimeCannotAdvance(invalidJson)

const authBlocked = classifyQwen25VlPrivateInvokeResponse({
  transportBlocker: 'auth_session_requires_reauth',
})
assert.equal(authBlocked.status, 'blocked_transport_auth')
assert.equal(authBlocked.runtimeFlags.transportAuthBlockerRecognized, true)
assertRuntimeCannotAdvance(authBlocked)

const futureMetadata = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 200,
  bodyJson: {
    ok: true,
    contractSchemaVersion: contract.runtimeSchemaVersion,
    outputKind: 'metadata_only_visual_understanding',
    generatedAssetCreated: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    creditSpendCreated: false,
    findings: [{ id: 'finding_mock_qwen_response_001' }],
  },
})
assert.equal(futureMetadata.ok, true)
assert.equal(futureMetadata.status, 'accepted_future_metadata_output')
assert.equal(futureMetadata.acceptedForFutureMetadataOnly, true)
assert.equal(futureMetadata.runtimeFlags.futureMetadataOutputShapeRecognized, true)
assertRuntimeCannotAdvance(futureMetadata)

const unexpected = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 500,
  bodyJson: {
    ok: false,
    reason: 'unmapped_runtime_failure',
  },
})
assert.equal(unexpected.status, 'blocked_unexpected_runtime_response')
assertRuntimeCannotAdvance(unexpected)

assert.equal(
  evidence.classificationResults.disabledRuntimeResponse.status,
  'blocked_contract_valid_inference_disabled',
)
assert.equal(
  evidence.classificationResults.rejectedRuntimeContractResponse.status,
  'blocked_runtime_contract_rejected',
)
assert.equal(evidence.classificationResults.requestTooLargeResponse.status, 'blocked_request_too_large')
assert.equal(evidence.classificationResults.authBlockedResponse.status, 'blocked_transport_auth')
assert.equal(
  evidence.classificationResults.futureMetadataOnlyResponse.status,
  'accepted_future_metadata_output',
)
assert.equal(evidence.futureResponseShape.persistsOutputNow, false)
assert.equal(evidence.futureResponseShape.runtimeCanAdvanceNow, false)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-response-contract.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ contract, evidence })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in private invoke response data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  disabledStatus: disabled.status,
  rejectedStatus: rejected.status,
  tooLargeStatus: tooLarge.status,
  authBlockedStatus: authBlocked.status,
  futureMetadataStatus: futureMetadata.status,
  runtimeCanAdvanceNow: disabled.runtimeCanAdvanceNow,
  persistOutputAllowedNow: disabled.persistOutputAllowedNow,
  creditSpendAllowedNow: disabled.creditSpendAllowedNow,
  cloudRunInvocationAttempted: disabled.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: disabled.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
