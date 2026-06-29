import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { runQwen25VlRealDispatchPreflight1 } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1'

const ROOT = process.cwd()
const PACKET = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-CONFIRMED-PREFLIGHT-1'
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_confirmed_preflight_passed_runtime_invocation_still_blocked'
const SOURCE_DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_preflight_passed_runtime_invocation_still_blocked'
const EXECUTION = 'completed_confirmed_source_preflight_no_runtime_invocation'
const NEXT_PROMPT = 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function exists(relativePath: string) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `Missing required file: ${relativePath}`)
}

assert.equal(process.env.REEDITPRO_CONFIRM_QWEN_REAL_DISPATCH_PREFLIGHT, 'true')

for (const file of [
  'docs/external-beta/qwen-real-dispatch-preflight-1/qwen-real-dispatch-preflight-record.json',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/confirmed-preflight-result.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/qwen-real-dispatch-confirmed-preflight-record.json',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-confirmed-preflight-1-smoke.ts',
  'package.json',
]) {
  exists(file)
}

const result = runQwen25VlRealDispatchPreflight1(process.env)
assert.equal(result.decision, SOURCE_DECISION)
assert.equal(result.execution, 'completed_qwen_real_dispatch_preflight_gate_source_no_runtime_execution')
assert.equal(result.confirmationProvided, true)
assert.equal(result.status, 'passed')
assert.equal(result.blocker, null)
assert.equal(result.validatedEnvelopeStepCount, 10)
assert.deepEqual(result.missingRequiredFields, [])
assert.equal(result.runtimeInvocationStillBlocked, true)

for (const [key, value] of Object.entries(result.runtimeFlags)) {
  assert.equal(value, false, `${key} must remain false`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-confirmed-preflight-1'],
  'REEDITPRO_CONFIRM_QWEN_REAL_DISPATCH_PREFLIGHT=true tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-confirmed-preflight-1-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-confirmed-preflight-1:diagnostics'],
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-confirmed-preflight-1-diagnostics.mjs',
)

const docs = [
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/confirmed-preflight-result.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/runtime-boundary.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/validation-results.md',
].map(read).join('\n')

for (const phrase of [
  PACKET,
  DECISION,
  EXECUTION,
  'Confirmation provided: `true`',
  'validated envelope steps: `10`',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'Runtime invocation still blocked: `true`',
  'Product-ready end-to-end local OSS tools: `0`',
  NEXT_PROMPT,
]) {
  assert.ok(docs.includes(phrase), `Missing docs phrase: ${phrase}`)
}

console.log('QWEN2.5-VL confirmed source preflight smoke passed')
