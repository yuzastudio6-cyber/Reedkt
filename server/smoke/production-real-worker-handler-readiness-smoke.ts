import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildProductionRealWorkerHandlerReadinessReport } from '../cli/production-real-worker-handler-readiness'

const report = buildProductionRealWorkerHandlerReadinessReport()

assert.equal(report.backendCallsAttempted, false, 'real worker handler readiness must not call backend routes')
assert.equal(report.toolExecutionAttempted, false, 'real worker handler readiness must not run tools')
assert.equal(report.mediaProcessingAttempted, false, 'real worker handler readiness must not process media')
assert.equal(report.readyForRealToolExecution, false, 'current production worker handlers should remain blocked until mock-only routes are replaced')
assert.equal(report.boundedRealHandlerReady, true, 'bounded ffprobe handler coverage should be recognized as ready')
assert.equal(report.allProductionHandlerCoverageReady, false, 'all-up production handler coverage should remain blocked while placeholders remain')
assert.equal(
  report.decision,
  'production_real_worker_handler_readiness_blocked_by_partial_handler_coverage',
  'current decision should name partial real handler coverage',
)
assert.ok(
  report.status === 'partial_real_handler_coverage',
  'report should identify partial real handler coverage status',
)
assert.ok(
  report.blockers.some((blocker) => blocker.includes('placeholder_handler_coverage_retired')),
  'report should identify remaining placeholder handler coverage blocker',
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
  productionGateDoc.includes('production_real_worker_handler_readiness_blocked_by_partial_handler_coverage'),
  'production readiness docs should name the current partial real-handler coverage decision',
)

console.log(JSON.stringify({
  ok: true,
  status: report.status,
  decision: report.decision,
  boundedRealHandlerReady: report.boundedRealHandlerReady,
  allProductionHandlerCoverageReady: report.allProductionHandlerCoverageReady,
  blockerCount: report.blockers.length,
  backendCallsAttempted: report.backendCallsAttempted,
  toolExecutionAttempted: report.toolExecutionAttempted,
  mediaProcessingAttempted: report.mediaProcessingAttempted,
}, null, 2))
