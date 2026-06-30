import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PACKET = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-DRY-RUN-ATTEMPT-1'
const DECISION = 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt'
const EXECUTION = 'completed_transport_readback_attempt_no_runtime_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function exists(relativePath: string) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `Missing required file: ${relativePath}`)
}

for (const file of [
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/qwen-real-dispatch-confirmed-preflight-record.json',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/dry-run-blocker.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-dry-run-attempt-1-smoke.ts',
  'package.json',
]) {
  exists(file)
}

const record = JSON.parse(read('docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json')) as {
  packet: string
  decision: string
  execution: string
  transportReadback: Record<string, unknown>
  runtimePosture: Record<string, unknown>
  readiness: Record<string, unknown>
  nextMilestone: string
  packageLock: string
  generatedArtifactsCommitted: string
}

assert.equal(record.packet, PACKET)
assert.equal(record.decision, DECISION)
assert.equal(record.execution, EXECUTION)
assert.equal(record.transportReadback.account, 'aiediting@reeditpro.com')
assert.equal(record.transportReadback.project, 'reeditpro')
assert.equal(record.transportReadback.service, 'reeditpro-staging-api')
assert.equal(record.transportReadback.region, 'us-central1')
assert.equal(record.transportReadback.result, 'blocked_reauthentication_required')
assert.equal(record.transportReadback.remoteRequestSent, false)
assert.equal(record.runtimePosture.cloudRunInvocation, false)
assert.equal(record.runtimePosture.identityTokenFetch, false)
assert.equal(record.runtimePosture.qwen25VlExecution, false)
assert.equal(record.runtimePosture.workerDispatch, false)
assert.equal(record.runtimePosture.supabaseMutation, false)
assert.equal(record.runtimePosture.creditMutation, false)
assert.equal(record.readiness.productReadyEndToEndLocalOssTools, 0)
assert.equal(record.nextMilestone, NEXT_PROMPT)
assert.equal(record.packageLock, 'unchanged')
assert.equal(record.generatedArtifactsCommitted, 'none')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-dry-run-attempt-1'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-dry-run-attempt-1-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-dry-run-attempt-1:diagnostics'],
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1-diagnostics.mjs',
)

const docs = [
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/dry-run-blocker.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/transport-readback.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/runtime-boundary.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/validation-results.md',
].map(read).join('\n')

for (const phrase of [
  PACKET,
  DECISION,
  EXECUTION,
  'Current account: `aiediting@reeditpro.com`',
  'Current project: `reeditpro`',
  'Transport readback result: `blocked_reauthentication_required`',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  NEXT_PROMPT,
]) {
  assert.ok(docs.includes(phrase), `Missing docs phrase: ${phrase}`)
}

console.log('QWEN2.5-VL dry-run attempt blocker smoke passed')
