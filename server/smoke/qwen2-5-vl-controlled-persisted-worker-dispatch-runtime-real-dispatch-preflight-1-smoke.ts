import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1,
  buildDefaultQwen25VlRealDispatchPreflightFixture,
  evaluateQwen25VlRealDispatchPreflightFixture,
  runQwen25VlRealDispatchPreflight1,
} from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1'

const ROOT = process.cwd()
const PACKET = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-PREFLIGHT-1'
const BLOCKED_DECISION = 'blocked_pending_qwen_real_dispatch_preflight_confirmation'
const PASSED_DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_preflight_passed_runtime_invocation_still_blocked'
const EXECUTION = 'completed_qwen_real_dispatch_preflight_gate_source_no_runtime_execution'
const NEXT_PROMPT = 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_CONFIRMED_PREFLIGHT_1'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function exists(relativePath: string) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `Missing required file: ${relativePath}`)
}

for (const file of [
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/qwen-real-dispatch-mock-only-source-import-record.json',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1-smoke.ts',
  'docs/external-beta/qwen-real-dispatch-preflight-1/preflight-gate.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/qwen-real-dispatch-preflight-record.json',
  'package.json',
]) {
  exists(file)
}

const record = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1
assert.equal(record.packet, PACKET)
assert.equal(record.decision, BLOCKED_DECISION)
assert.equal(record.execution, EXECUTION)
assert.equal(record.confirmationGate.env, 'REEDITPRO_CONFIRM_QWEN_REAL_DISPATCH_PREFLIGHT')
assert.equal(record.confirmationGate.requiredValue, 'true')
assert.equal(record.sourceChain.mockOnlySourceImportMerge, '135999b39498688da2002c2f5dbc68acda3b1bb0')
assert.equal(record.preflightEnvelope.length, 10)
for (const step of record.preflightEnvelope) {
  assert.equal(step.executionAllowedNow, false, `${step.id} must not execute in this packet`)
}

const blockedResult = runQwen25VlRealDispatchPreflight1({})
assert.equal(blockedResult.decision, BLOCKED_DECISION)
assert.equal(blockedResult.execution, EXECUTION)
assert.equal(blockedResult.confirmationProvided, false)
assert.equal(blockedResult.status, 'blocked')
assert.equal(blockedResult.blocker, BLOCKED_DECISION)
assert.equal(blockedResult.validatedEnvelopeStepCount, 0)
assert.equal(blockedResult.runtimeInvocationStillBlocked, true)
assert.equal(blockedResult.nextPrompt, NEXT_PROMPT)

const fixture = buildDefaultQwen25VlRealDispatchPreflightFixture()
const localEvaluation = evaluateQwen25VlRealDispatchPreflightFixture(fixture)
assert.equal(localEvaluation.decision, PASSED_DECISION)
assert.equal(localEvaluation.status, 'passed')
assert.equal(localEvaluation.blocker, null)
assert.equal(localEvaluation.validatedEnvelopeStepCount, 10)
assert.deepEqual(localEvaluation.missingRequiredFields, [])
assert.equal(localEvaluation.runtimeInvocationStillBlocked, true)

for (const result of [blockedResult, localEvaluation]) {
  for (const [key, value] of Object.entries(result.runtimeFlags)) {
    assert.equal(value, false, `${key} must remain false`)
  }
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-preflight-1:diagnostics'],
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-preflight-1-diagnostics.mjs',
)

const docs = [
  'docs/external-beta/qwen-real-dispatch-preflight-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/preflight-gate.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/runtime-boundary.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/validation-results.md',
].map(read).join('\n')

for (const phrase of [
  PACKET,
  BLOCKED_DECISION,
  EXECUTION,
  'Confirmation provided: `false`',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  NEXT_PROMPT,
]) {
  assert.ok(docs.includes(phrase), `Missing docs phrase: ${phrase}`)
}

console.log('QWEN2.5-VL real-dispatch preflight source gate smoke passed')
