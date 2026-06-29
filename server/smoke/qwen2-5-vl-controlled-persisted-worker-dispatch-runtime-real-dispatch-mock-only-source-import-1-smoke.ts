import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1 } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_mock_only_source_import_recorded_preflight_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function exists(relativePath: string) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `Missing required file: ${relativePath}`)
}

for (const file of [
  'docs/external-beta/qwen-real-dispatch-source-import-scope-1/qwen-real-dispatch-source-import-scope-record.json',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1-smoke.ts',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/mock-only-source-import.md',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/qwen-real-dispatch-mock-only-source-import-record.json',
  'package.json',
]) {
  exists(file)
}

const record = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1

assert.equal(record.decision, DECISION)
assert.equal(record.execution, 'completed_mock_only_source_import_no_runtime_execution')
assert.equal(record.nextPrompt, NEXT_PROMPT)
assert.equal(record.sourceChain.sourceImportScopeMerge, '6dce0272d56fb83a90e3ced99d1ee0d811a7c52c')
assert.equal(record.importScope.fullDraftStackImportRejected, true)
assert.equal(record.importScope.workerRuntimeSourceImported, false)
assert.equal(record.importScope.mockOnlyPlanApprovalPreflightRecordImported, true)
assert.equal(record.importScope.runtimePreflightRequiredBeforeAnyDispatch, true)
assert.equal(record.firstRealDispatchPreflightEnvelope.length, 10)
for (const step of record.firstRealDispatchPreflightEnvelope) {
  assert.equal(step.executionAllowedNow, false, `${step.id} must not execute now`)
}

for (const key of [
  'readyForRealWorkerDispatch',
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
] as const) {
  assert.equal(record.runtimeFlags[key], false, `${key} must be false`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1-smoke.ts',
)

const docs = [
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/mock-only-source-import.md',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/preflight-envelope.md',
].map(read).join('\n')

for (const phrase of [
  'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-MOCK-ONLY-SOURCE-IMPORT-1',
  DECISION,
  'completed_mock_only_source_import_no_runtime_execution',
  'worker runtime source imported: `false`',
  'Cloud Run invocation: `false`',
  'QWEN2.5-VL execution: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  NEXT_PROMPT,
]) {
  assert.ok(docs.includes(phrase), `Missing docs phrase: ${phrase}`)
}

console.log('QWEN2.5-VL mock-only real-dispatch source import smoke passed')
