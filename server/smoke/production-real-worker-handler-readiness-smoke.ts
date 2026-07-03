import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildProductionRealWorkerHandlerReadinessReport } from '../cli/production-real-worker-handler-readiness'

const report = buildProductionRealWorkerHandlerReadinessReport()

assert.equal(report.backendCallsAttempted, false, 'real worker handler readiness must not call backend routes')
assert.equal(report.toolExecutionAttempted, false, 'real worker handler readiness must not run tools')
assert.equal(report.mediaProcessingAttempted, false, 'real worker handler readiness must not process media')
assert.equal(report.readyForRealToolExecution, true, 'reviewed real backend adapters should be ready for scoped production gates')
assert.equal(report.boundedRealHandlerReady, true, 'bounded real handler coverage should be recognized as ready')
assert.equal(report.scopedReviewedHandlerReady, true, 'scoped reviewed real handler coverage should be ready')
assert.equal(report.allProductionHandlerCoverageReady, false, 'broad all-route production handler coverage should remain incomplete while placeholder routes remain')
assert.equal(report.productionScope, 'reviewed_real_backend_adapters_only', 'readiness should be scoped to reviewed real backend adapters')
assert.ok(report.reviewedRealAdapterIds.length >= 13, 'report should list reviewed real backend adapters')
assert.ok(report.blockedPlaceholderAdapterIds.length >= 5, 'report should list placeholder adapters that remain blocked for production_ready dispatch')
assert.equal(
  report.decision,
  'production_real_worker_handler_readiness_passed_scoped_reviewed_handler_gate',
  'current decision should name scoped reviewed handler readiness',
)
assert.ok(
  report.status === 'ready_for_scoped_real_tool_execution',
  'report should identify scoped real handler readiness status',
)
assert.deepEqual(report.blockers, [], 'scoped readiness should not treat dry-run placeholder routes as production blockers')

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
  productionGateDoc.includes('production_real_worker_handler_readiness_passed_scoped_reviewed_handler_gate'),
  'production readiness docs should name the current scoped real-handler readiness decision',
)

console.log(JSON.stringify({
  ok: true,
  status: report.status,
  decision: report.decision,
  boundedRealHandlerReady: report.boundedRealHandlerReady,
  scopedReviewedHandlerReady: report.scopedReviewedHandlerReady,
  allProductionHandlerCoverageReady: report.allProductionHandlerCoverageReady,
  productionScope: report.productionScope,
  blockerCount: report.blockers.length,
  backendCallsAttempted: report.backendCallsAttempted,
  toolExecutionAttempted: report.toolExecutionAttempted,
  mediaProcessingAttempted: report.mediaProcessingAttempted,
}, null, 2))
