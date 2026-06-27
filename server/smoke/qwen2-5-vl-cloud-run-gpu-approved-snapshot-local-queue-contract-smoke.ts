import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { runWorkerJobSchema } from '../validation/worker-schemas'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT,
  validateQwen25VlLocalQueueFixture
} from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_local_queue_contract_defined_no_dispatch_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_33-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-DISPATCH-READINESS: audit Worker Runtime dispatch readiness for Qwen approved-snapshot jobs, no dispatch'
const SCHEMA_VERSION = 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function parseBlock(relativePath: string, label: string) {
  const text = read(relativePath)
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp('```json\\s+' + escaped + '\\n([\\s\\S]*?)\\n```'))
  check(match, `Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1]) as JsonRecord
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['non-local URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(inferenceRun|forwardPassRun|promptProcessed|cloudRunInvocationAllowedNow|serviceRuntimeRequestSent|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['non-local URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential-looking value', /\b(api[_-]?key|hf[_-]?token|access[_-]?token|service[_-]?role)\b/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i]
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

function expectInvalidMutation(
  id: string,
  mutate: (fixture: JsonRecord) => void,
  expectedIssue: string
) {
  const fixture = clone(QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture) as JsonRecord
  mutate(fixture)
  const result = validateQwen25VlLocalQueueFixture(fixture)
  assert.equal(result.ok, false, `${id} should fail validation`)
  assert.equal(result.acceptedForFutureDispatch, false, `${id} must not be accepted for future dispatch`)
  assert.equal(result.dispatchAllowedNow, false, `${id} dispatch must stay blocked`)
  assert.ok(result.issues.includes(expectedIssue as never), `${id} missing issue ${expectedIssue}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract-smoke.ts',
  'server/validation/worker-schemas.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md',
  'package.json'
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract-smoke.ts',
  'package script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract-change-log'
)
const contract = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT
const runtimeContract = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT

for (const phrase of [
  DECISION,
  'runWorkerJobSchema',
  'qwen2_5_vl_cloud_run_gpu_worker',
  '`media_analysis`',
  'approved plan snapshot',
  'credit reservation',
  'queue lease / worker contract',
  'bounded Qwen runtime request',
  '`sourceOfTruthRefs`',
  '`rawVlmPromptAllowed=false`',
  '`modelInferenceEnabled=false`',
  '`dispatchAllowedNow=false`',
  '`cloudRunInvocationAllowedNow=false`',
  '`serviceRuntimeRequestSent=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.equal(contract.decision, DECISION, 'contract decision mismatch')
assert.equal(changeLog.decision, DECISION, 'change log decision mismatch')
assert.equal(contract.nextPrompt, NEXT_PROMPT, 'next prompt mismatch')
assert.equal(changeLog.nextPrompt, NEXT_PROMPT, 'change log next prompt mismatch')
assert.equal(contract.queueEnvelope.schema, 'runWorkerJobSchema')
assert.equal(contract.queueEnvelope.workerType, 'qwen2_5_vl_cloud_run_gpu_worker')
assert.equal(contract.queueEnvelope.jobType, 'media_analysis')
assert.equal(contract.queueEnvelope.dryRun, true)
assert.equal(contract.runtimePayload.schemaVersion, SCHEMA_VERSION)
assert.equal(runtimeContract.contract.schemaVersion, SCHEMA_VERSION)

const parsedQueueFixture = runWorkerJobSchema.safeParse(contract.validQueueFixture)
assert.equal(parsedQueueFixture.success, true, parsedQueueFixture.success ? '' : parsedQueueFixture.error.message)

const queueValidation = validateQwen25VlLocalQueueFixture(contract.validQueueFixture as JsonRecord)
assert.equal(queueValidation.ok, true, 'valid queue fixture must pass local validation')
assert.equal(queueValidation.acceptedForFutureDispatch, true, 'valid fixture should be accepted for future dispatch planning')
assert.equal(queueValidation.dispatchAllowedNow, false, 'valid fixture must not dispatch now')
assert.equal(queueValidation.cloudRunInvocationAllowedNow, false, 'valid fixture must not invoke Cloud Run now')
assert.equal(queueValidation.inferenceAllowedNow, false, 'valid fixture must not infer now')

const payload = asRecord(contract.validQueueFixture.payloadJson)
for (const field of runtimeContract.requiredRequestFields) {
  assert.ok(Object.hasOwn(payload, field), `valid queue payload missing runtime field ${field}`)
  assert.ok(contract.runtimePayload.requiredRequestFields.includes(field), `contract runtime payload missing ${field}`)
}
for (const field of runtimeContract.sourceOfTruthRequired) {
  const refs = asRecord(payload.sourceOfTruthRefs)[field]
  assert.ok(Array.isArray(refs) && refs.length > 0, `valid queue payload missing source ref ${field}`)
}
assert.ok(
  runtimeContract.allowedTaskUseCases.includes(asRecord(payload.task).useCase as never),
  'task use case must be allowed by runtime contract'
)

for (const [gate, expected] of Object.entries(runtimeContract.runtimeGatesRequired)) {
  assert.equal(asRecord(payload.runtimeGates)[gate], expected, `runtime gate ${gate} mismatch`)
}

const falseRuntimeFlags = [
  'dispatchAllowedNow',
  'cloudRunInvocationAllowedNow',
  'serviceRuntimeRequestSent',
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
  'generatedLocalFixturePassedClaimed'
]
assertAllFalse(contract.runtimeFlags as JsonRecord, falseRuntimeFlags)
assertAllFalse(changeLog.runtimeFlags as JsonRecord, falseRuntimeFlags)

const blockedFixtureIds = new Set<string>(contract.blockedQueueFixtures.map((fixture) => fixture.id))
for (const blockedId of [
  'missing_approved_snapshot',
  'missing_credit_reservation',
  'missing_queue_lease',
  'raw_prompt_payload',
  'signed_url_source_of_truth',
  'enabled_runtime_gate',
  'model_policy_mismatch',
  'worker_type_mismatch'
]) {
  assert.ok(blockedFixtureIds.has(blockedId), `missing blocked fixture ${blockedId}`)
  assert.ok((changeLog.blockedFixtures as string[]).includes(blockedId), `change log missing ${blockedId}`)
}

expectInvalidMutation('missing approved snapshot', (fixture) => {
  delete fixture.approvedPlanSnapshotId
  delete asRecord(fixture.payloadJson).approvedPlanSnapshotId
}, 'missing_approved_snapshot')
expectInvalidMutation('missing credit reservation', (fixture) => {
  delete fixture.creditReservationId
  delete asRecord(fixture.payloadJson).creditReservationId
}, 'missing_credit_reservation')
expectInvalidMutation('missing queue lease', (fixture) => {
  delete asRecord(fixture.payloadJson).queueLease
}, 'missing_queue_lease')
expectInvalidMutation('raw prompt payload', (fixture) => {
  asRecord(asRecord(fixture.payloadJson).task)['raw' + '_prompt'] = 'blocked mock raw field'
}, 'raw_prompt_payload')
expectInvalidMutation('signed URL source of truth', (fixture) => {
  asRecord(asRecord(fixture.payloadJson).sourceOfTruthRefs).signedUrlsAreSourceOfTruth = true
}, 'signed_url_source_of_truth')
expectInvalidMutation('enabled runtime gate', (fixture) => {
  asRecord(asRecord(fixture.payloadJson).runtimeGates).modelInferenceEnabled = true
}, 'enabled_runtime_gate')
expectInvalidMutation('model mismatch', (fixture) => {
  asRecord(asRecord(fixture.payloadJson).modelPolicy).modelRevision = 'mock_wrong_revision'
}, 'model_policy_mismatch')
expectInvalidMutation('worker type mismatch', (fixture) => {
  fixture.workerType = 'wrong_worker'
}, 'worker_type_mismatch')

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts'
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  validQueueFixture: contract.validQueueFixture,
  runtimePayload: contract.runtimePayload,
  runtimeFlags: contract.runtimeFlags
})
assert.deepEqual(forbiddenDataFindings, [], `Forbidden values in queue contract: ${forbiddenDataFindings.join('; ')}`)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  queueSchema: contract.queueEnvelope.schema,
  workerType: contract.queueEnvelope.workerType,
  jobType: contract.queueEnvelope.jobType,
  schemaVersion: contract.runtimePayload.schemaVersion,
  acceptedForFutureDispatch: queueValidation.acceptedForFutureDispatch,
  dispatchAllowedNow: queueValidation.dispatchAllowedNow,
  cloudRunInvocationAllowedNow: queueValidation.cloudRunInvocationAllowedNow,
  inferenceAllowedNow: queueValidation.inferenceAllowedNow,
  blockedFixtureCount: contract.blockedQueueFixtures.length,
  nextPrompt: NEXT_PROMPT
}, null, 2))
