import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_CURRENT_IMPORT_1,
  buildDefaultQwen25VlTransportDependencyFixture,
  evaluateQwen25VlTransportDependencyFixture,
  runQwen25VlTransportDependencyCurrentImport1,
} from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1'

const ROOT = process.cwd()
const PACKET = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ENABLEMENT-CURRENT-IMPORT-1'
const DECISION = 'completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required'
const EXECUTION = 'completed_fail_closed_transport_dependency_contract_no_runtime_invocation'
const NEXT_PROMPT = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function exists(relativePath: string) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `Missing required file: ${relativePath}`)
}

for (const file of [
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1-smoke.ts',
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/qwen-transport-dependency-enablement-current-import-record.json',
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/transport-dependency-contract.md',
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/runtime-boundary.md',
  'package.json',
]) {
  exists(file)
}

const contract =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_CURRENT_IMPORT_1
assert.equal(contract.packet, PACKET)
assert.equal(contract.decision, DECISION)
assert.equal(contract.execution, EXECUTION)
assert.equal(contract.selectedRuntime.account, 'aiediting@reeditpro.com')
assert.equal(contract.selectedRuntime.project, 'reeditpro')
assert.equal(contract.selectedRuntime.service, 'reeditpro-staging-api')
assert.equal(contract.dependencyNames.length, 10)
assert.equal(contract.requiredInjectedBoundaries.length, 4)
assert.equal(contract.nextPrompt, NEXT_PROMPT)

for (const dependency of contract.dependencyContract) {
  assert.equal(dependency.enabledNow, false, `${dependency.id} must remain disabled`)
}

const fixture = buildDefaultQwen25VlTransportDependencyFixture()
const evaluation = evaluateQwen25VlTransportDependencyFixture(fixture)
assert.equal(evaluation.packet, PACKET)
assert.equal(evaluation.decision, DECISION)
assert.equal(evaluation.execution, EXECUTION)
assert.equal(evaluation.status, 'passed_contract_preflight_required')
assert.deepEqual(evaluation.missingDependencies, [])
assert.deepEqual(evaluation.missingInjectedBoundaries, [])
assert.deepEqual(evaluation.missingRequiredFields, [])
assert.equal(evaluation.dependenciesEnabledNow, false)
assert.equal(evaluation.readyForRealWorkerDispatch, false)
assert.equal(evaluation.nextPrompt, NEXT_PROMPT)

const runResult = runQwen25VlTransportDependencyCurrentImport1()
assert.deepEqual(runResult, evaluation)

for (const [key, value] of Object.entries(evaluation.runtimeFlags)) {
  assert.equal(value, false, `${key} must remain false`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-current-import-1-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['rp-external-beta-qwen-transport-dependency-enablement-current-import-1:diagnostics'],
  'node scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs',
)

const docs = [
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/source-audit.md',
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/transport-dependency-contract.md',
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/runtime-boundary.md',
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/validation-results.md',
].map(read).join('\n')

for (const phrase of [
  PACKET,
  DECISION,
  EXECUTION,
  'service-role lease and claim dependency',
  'private invoke transport dependency',
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
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

console.log('QWEN2.5-VL transport dependency enablement current import smoke passed')
