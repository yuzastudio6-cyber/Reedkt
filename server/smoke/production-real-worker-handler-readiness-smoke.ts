import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildProductionRealWorkerHandlerReadinessReport } from '../cli/production-real-worker-handler-readiness'

const report = buildProductionRealWorkerHandlerReadinessReport()

assert.equal(report.backendCallsAttempted, false, 'real worker handler readiness must not call backend routes')
assert.equal(report.toolExecutionAttempted, false, 'real worker handler readiness must not run tools')
assert.equal(report.mediaProcessingAttempted, false, 'real worker handler readiness must not process media')
assert.equal(report.readyForRealToolExecution, false, 'current production worker handlers should remain blocked until mock-only routes are replaced')
assert.equal(
  report.decision,
  'production_real_worker_handler_readiness_blocked_by_mock_safe_placeholder_dispatch',
  'current decision should name the placeholder dispatch blocker',
)
assert.ok(
  report.blockers.some((blocker) => blocker.includes('route_output_type_allows_real_handlers')),
  'report should identify the mock-only route output type blocker',
)
assert.ok(
  report.blockers.some((blocker) => blocker.includes('gateway_adapters_are_real_not_placeholder')),
  'report should identify placeholder gateway adapters',
)
assert.ok(
  report.blockers.some((blocker) => blocker.includes('gateway_smoke_no_longer_expects_mock_only_production_ready')),
  'report should identify production_ready smoke coverage accepting mock-only output',
)

const packageJson = readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
const productionGateDoc = readFileSync(new URL('../../docs/production-tool-execution-readiness-gate.md', import.meta.url), 'utf8')

assert.ok(
  packageJson.includes('"smoke:production-real-worker-handler-readiness"'),
  'package.json should expose the real worker handler readiness smoke command',
)
assert.ok(
  packageJson.includes('"prod:readiness:real-worker-handler-readiness"'),
  'package.json should expose the operator real worker handler readiness command',
)
assert.ok(
  productionGateDoc.includes('prod:readiness:real-worker-handler-readiness'),
  'production readiness docs should include the real worker handler readiness command',
)
assert.ok(
  productionGateDoc.includes('production_real_worker_handler_readiness_blocked_by_mock_safe_placeholder_dispatch'),
  'production readiness docs should name the current real-worker-handler blocker decision',
)

console.log(JSON.stringify({
  ok: true,
  status: report.status,
  decision: report.decision,
  blockerCount: report.blockers.length,
  backendCallsAttempted: report.backendCallsAttempted,
  toolExecutionAttempted: report.toolExecutionAttempted,
  mediaProcessingAttempted: report.mediaProcessingAttempted,
}, null, 2))
