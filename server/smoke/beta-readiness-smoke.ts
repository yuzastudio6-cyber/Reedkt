import assert from 'node:assert/strict'
import {
  buildBetaReadinessReport,
  buildBetaScenarioReadinessMatrix,
  evaluateBetaGoNoGo,
  type BetaReadinessChecklistEvidence,
  type ToolBetaAcceptedExecutionEvidence,
  type ToolBetaPlatformReadinessEvidence,
} from '../beta-readiness'
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
assert.ok(report.toolExecutionReadiness.platformBlockers.length > 0, 'tool execution readiness must surface platform blockers')
assert.ok(report.toolExecutionReadiness.tools.some((tool) => tool.toolId === 'ffmpeg'), 'tool execution readiness must include ffmpeg')
assert.ok(report.toolExecutionReadiness.tools.some((tool) => tool.toolId === 'remotion'), 'tool execution readiness must include remotion')
assert.ok(
  report.toolExecutionReadiness.platformBlockers.some((blocker) => blocker.blockerId === 'production_billing_deployment_unverified'),
  'tool execution readiness must require durable billing deployment validation before external beta',
)
assert.ok(
  !report.toolExecutionReadiness.blockers.some((blocker) => blocker.blockerId === 'production_billing_persistence_missing'),
  'billing deployment validation must not be duplicated across every tool after persistence is implemented',
)

const completePlatformEvidence: ToolBetaPlatformReadinessEvidence = {
  sourceId: 'beta-readiness-smoke:complete-platform-evidence',
  sourceSha: '3333333333333333333333333333333333333333',
  environment: 'staging',
  toolCostEventsMigrationDeployed: true,
  serviceRoleWritePathVerified: true,
  rlsMemberReadPathVerified: true,
  idempotentReplayVerified: true,
  walletSettlementVerified: true,
  stripeBoundaryVerified: true,
  monitoringVerified: true,
  billingQaVerified: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  legalApproved: true,
  supportApproved: true,
  notes: ['Smoke fixture for evidence-driven top-level beta gate.'],
}
const completeToolEvidence: ToolBetaAcceptedExecutionEvidence[] = PRODUCTION_TOOL_IDS.map((toolId) => ({
  toolId,
  sourceId: `beta-readiness-smoke:${toolId}:complete-tool-evidence`,
  sourceSha: '4444444444444444444444444444444444444444',
  readinessStatus: 'passed',
  realExecutionVerified: true,
  productionReadinessAccepted: true,
  productReadyLocalOss: true,
  modelWeightsApproved: true,
  notes: [`Smoke fixture for ${toolId} accepted tool evidence.`],
}))
const checklistEvidence: BetaReadinessChecklistEvidence[] = [
  {
    itemId: 'model_weights_not_approved',
    sourceId: 'beta-readiness-smoke:model-license-approval',
    sourceSha: '5555555555555555555555555555555555555555',
    status: 'passed',
    notes: ['Smoke fixture proves checklist blockers can be cleared by explicit source evidence.'],
  },
  {
    itemId: 'gcp_deployment_not_done',
    sourceId: 'beta-readiness-smoke:deployment-approval',
    sourceSha: '6666666666666666666666666666666666666666',
    status: 'passed',
    notes: ['Smoke fixture proves deployment blockers can be cleared by explicit source evidence.'],
  },
]
const evidenceDrivenReport = buildBetaReadinessReport({
  checklistEvidence,
  acceptedToolEvidence: completeToolEvidence,
  platformEvidence: completePlatformEvidence,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  legalApproved: true,
  monitoringApproved: true,
  supportApproved: true,
})
assert.equal(evidenceDrivenReport.toolExecutionReadiness.externalBetaToolExecutionAllowed, true, 'complete evidence should open the tool execution external beta gate')
assert.equal(evidenceDrivenReport.toolExecutionReadiness.productionToolExecutionAllowed, true, 'complete evidence should open the tool execution production gate')
assert.equal(evidenceDrivenReport.goNoGo.externalBetaAllowed, true, 'top-level external beta gate should accept complete evidence and approvals')
assert.equal(evidenceDrivenReport.goNoGo.realUserMediaBetaAllowed, false, 'real user media beta still needs explicit approval')
assert.equal(evidenceDrivenReport.goNoGo.paidProductionAllowed, false, 'paid production still needs real user media and paid production approval')
assert.throws(() => buildBetaReadinessReport({
  checklistEvidence: [
    { ...checklistEvidence[0] },
    { ...checklistEvidence[0], sourceId: 'beta-readiness-smoke:duplicate-model-license-approval' },
  ],
}), /Duplicate beta checklist evidence/, 'duplicate checklist evidence should fail closed')

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
