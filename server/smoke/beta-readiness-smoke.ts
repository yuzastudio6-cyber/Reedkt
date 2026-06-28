import assert from 'node:assert/strict'
import { buildBetaReadinessReport, buildBetaScenarioReadinessMatrix } from '../beta-readiness'

const report = buildBetaReadinessReport()

assert.ok(report.reportId.startsWith('beta-readiness-'), 'beta readiness report should build')
assert.equal(report.goNoGo.externalBetaAllowed, true, 'bounded external beta scorecard may be allowed')
assert.equal(report.goNoGo.internalDryRunTestingAllowed, true, 'internal dry-run testing may be allowed after E2E and safety docs')
assert.equal(report.goNoGo.realUserMediaBetaAllowed, false, 'real user media beta must be blocked')
assert.equal(report.goNoGo.paidProductionAllowed, false, 'paid production must be blocked')

const matrix = buildBetaScenarioReadinessMatrix()
assert.equal(matrix.length, 9, 'scenario readiness matrix should include all nine M16B scenarios')
assert.ok(matrix.every((scenario) => scenario.productionReady === false), 'productionReady should remain false for every scenario')
assert.ok(report.nextActions.length > 0, 'next actions should be present')
assert.ok(!report.nextActions.join(' ').toLowerCase().includes('revideo production dependency'), 'Revideo must not be a beta-ready production dependency')
assert.ok(report.blockers.some((blocker) => blocker.includes('Production readiness')), 'production readiness blockers should remain present')
assert.ok(report.nextActions.some((action) => action.includes('no-runtime')), 'bounded external beta scope should stay no-runtime')

console.log('beta-readiness-smoke passed')
