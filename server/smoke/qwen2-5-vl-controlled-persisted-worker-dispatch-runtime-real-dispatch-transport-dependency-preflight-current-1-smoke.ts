import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_PREFLIGHT_CURRENT_1,
  runQwen25VlTransportDependencyPreflightCurrent1,
} from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1'

const ROOT = process.cwd()
const PACKET = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1'
const DECISION = 'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked'
const EXECUTION = 'completed_fail_closed_transport_dependency_preflight_no_runtime_invocation'
const BLOCKER = 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r'
const NEXT_PROMPT =
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function exists(relativePath: string) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `Missing required file: ${relativePath}`)
}

for (const file of [
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1-smoke.ts',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/qwen-transport-dependency-preflight-current-record.json',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/preflight-result.md',
  'package.json',
]) {
  exists(file)
}

const source = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_PREFLIGHT_CURRENT_1
assert.equal(source.packet, PACKET)
assert.equal(source.decision, DECISION)
assert.equal(source.execution, EXECUTION)
assert.equal(source.sourceChain.transportDependencyEnablementMerge, '4875246604aecb8de69e9f44859f73981136db29')
assert.equal(source.sourceChain.qwenRealDispatchAuthPath, BLOCKER)
assert.equal(source.sourceChain.staleDraftDuplicate, '#1736 open/draft/stale_stacked_on_1731_excluded')
assert.equal(source.preflightChecks.dependencySurfaceCount, 10)
assert.equal(source.preflightChecks.injectedBoundaryCount, 4)

const result = runQwen25VlTransportDependencyPreflightCurrent1()
assert.equal(result.packet, PACKET)
assert.equal(result.decision, DECISION)
assert.equal(result.execution, EXECUTION)
assert.equal(result.status, 'passed_preflight_runtime_still_blocked')
assert.equal(result.blocker, BLOCKER)
assert.equal(result.dependencyContractComplete, true)
assert.equal(result.dependencyCount, 10)
assert.equal(result.injectedBoundaryCount, 4)
assert.equal(result.dependenciesEnabledNow, false)
assert.equal(result.readyForRealWorkerDispatch, false)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const [key, value] of Object.entries(result.runtimeFlags)) {
  assert.equal(value, false, `${key} must remain false`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-preflight-current-1-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['rp-external-beta-qwen-transport-dependency-preflight-current-1:diagnostics'],
  'node scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
)

const docs = [
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/source-audit.md',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/preflight-result.md',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/runtime-boundary.md',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/validation-results.md',
].map(read).join('\n')

for (const phrase of [
  PACKET,
  DECISION,
  EXECUTION,
  BLOCKER,
  '#1736 open/draft/stale_stacked_on_1731_excluded',
  'Dependency contract complete: `true`',
  'Dependencies enabled now: `false`',
  'Ready for real worker dispatch: `false`',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'request sent: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  NEXT_PROMPT,
]) {
  assert.ok(docs.includes(phrase), `Missing docs phrase: ${phrase}`)
}

console.log('QWEN2.5-VL transport dependency preflight current smoke passed')
