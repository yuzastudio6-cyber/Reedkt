import assert from 'node:assert/strict'
import { buildBetaReadinessReport, buildBetaScenarioReadinessMatrix, evaluateBetaGoNoGo } from '../beta-readiness'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

const report = buildBetaReadinessReport()

assert.ok(report.reportId.startsWith('beta-readiness-'), 'beta readiness report should build')
assert.equal(report.goNoGo.externalBetaAllowed, false, 'external beta must be blocked')
assert.equal(report.goNoGo.internalDryRunTestingAllowed, true, 'internal dry-run testing may be allowed after E2E and safety docs')
assert.equal(report.goNoGo.realUserMediaBetaAllowed, false, 'real user media beta must be blocked')
assert.equal(report.goNoGo.paidProductionAllowed, false, 'paid production must be blocked')

const matrix = buildBetaScenarioReadinessMatrix()
assert.equal(matrix.length, 9, 'scenario readiness matrix should include all nine M16B scenarios')
assert.ok(matrix.every((scenario) => scenario.productionReady === false), 'productionReady should remain false for every scenario')
assert.ok(report.nextActions.length > 0, 'next actions should be present')
assert.ok(!report.nextActions.join(' ').toLowerCase().includes('revideo production dependency'), 'Revideo must not be a beta-ready production dependency')
assert.ok(report.blockers.some((blocker) => blocker.includes('Production readiness')), 'production readiness blockers should remain present')
assert.equal(report.toolExecutionReadiness.totalTools, PRODUCTION_TOOL_IDS.length, 'tool execution readiness must cover the production registry')
assert.equal(report.toolExecutionReadiness.ownerCoverageToolCount, PRODUCTION_TOOL_IDS.length, 'tool execution readiness must include every owner coverage case')
assert.equal(report.toolExecutionReadiness.readinessSpecToolCount, PRODUCTION_TOOL_IDS.length, 'tool execution readiness must include every readiness spec')
assert.equal(report.toolExecutionReadiness.productReadyLocalOssCount, 0, 'tool execution readiness must not claim product-ready tools')
assert.equal(report.toolExecutionReadiness.serviceFeeIncluded, false, 'tool execution readiness must preserve tool-event service fee exclusion')
assert.equal(report.toolExecutionReadiness.internalDryRunMonitoringAllowed, true, 'tool execution readiness should allow internal dry-run monitoring once coverage exists')
assert.equal(report.toolExecutionReadiness.externalBetaToolExecutionAllowed, false, 'tool execution readiness must block external beta execution')
assert.equal(report.toolExecutionReadiness.productionToolExecutionAllowed, false, 'tool execution readiness must block production execution')
assert.ok(report.toolExecutionReadiness.blockers.length > 0, 'tool execution readiness must surface blockers')
assert.ok(report.toolExecutionReadiness.tools.some((tool) => tool.toolId === 'ffmpeg'), 'tool execution readiness must include ffmpeg')
assert.ok(report.toolExecutionReadiness.tools.some((tool) => tool.toolId === 'remotion'), 'tool execution readiness must include remotion')
assert.ok(
  report.toolExecutionReadiness.blockers.some((blocker) => blocker.blockerId === 'production_billing_persistence_missing'),
  'tool execution readiness must require durable billing persistence before external beta',
)

const approvalOnlyGate = evaluateBetaGoNoGo({
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  legalApproved: true,
  monitoringApproved: true,
  supportApproved: true,
  realUserMediaBetaApproved: true,
  paidProductionApproved: true,
  checklist: [],
})
assert.equal(approvalOnlyGate.externalBetaAllowed, true, 'external beta gate should be evidence-driven, not hardcoded false')
assert.equal(approvalOnlyGate.realUserMediaBetaAllowed, true, 'real user media beta should be evidence-driven, not hardcoded false')
assert.equal(approvalOnlyGate.paidProductionAllowed, true, 'paid production should be evidence-driven, not hardcoded false')

console.log('beta-readiness-smoke passed')
