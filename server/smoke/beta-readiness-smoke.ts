import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessReport,
  buildBetaScenarioReadinessMatrix,
  evaluateBetaGoNoGo,
  launchReadinessGatePolicy,
  type BetaReadinessChecklistEvidence,
  type ToolBetaAcceptedExecutionEvidence,
  type ToolBetaPlatformReadinessEvidence,
} from '../beta-readiness'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

const report = buildBetaReadinessReport()

assert.ok(report.reportId.startsWith('beta-readiness-'), 'beta readiness report should build')
assert.equal(report.goNoGo.externalBetaAllowed, false, 'external beta must be blocked by default')
assert.equal(report.goNoGo.internalDryRunTestingAllowed, true, 'internal dry-run may pass with its baseline evidence')
assert.equal(report.goNoGo.realUserMediaBetaAllowed, false, 'real user media beta must be blocked by default')
assert.equal(report.goNoGo.paidProductionAllowed, false, 'paid production must be blocked by default')
assert.deepEqual(
  launchReadinessGatePolicy.map((item) => item.stage),
  ['internal_dry_run', 'bounded_tool_execution', 'external_beta', 'real_user_media_beta', 'paid_production'],
)

const matrix = buildBetaScenarioReadinessMatrix()
assert.equal(matrix.length, 9, 'scenario readiness matrix should include all nine M16B scenarios')
assert.ok(matrix.every((scenario) => scenario.productionReady === false), 'production should remain false without paid-production evidence')
assert.ok(report.nextActions.length > 0, 'next actions should be present')
assert.ok(!report.nextActions.join(' ').toLowerCase().includes('revideo production dependency'), 'Revideo must not be a beta-ready dependency')
assert.ok(report.blockers.some((blocker) => blocker.includes('Production readiness')), 'production readiness blockers should remain visible')
assert.equal(report.toolExecutionReadiness.totalTools, PRODUCTION_TOOL_IDS.length, 'readiness must cover every registered production tool')
assert.equal(report.toolExecutionReadiness.ownerCoverageToolCount, PRODUCTION_TOOL_IDS.length, 'every tool needs owner coverage')
assert.equal(report.toolExecutionReadiness.readinessSpecToolCount, PRODUCTION_TOOL_IDS.length, 'every tool needs a readiness spec')
assert.equal(report.toolExecutionReadiness.productReadyLocalOssCount, 0, 'no tool is product-ready by default')
assert.equal(report.toolExecutionReadiness.serviceFeeIncluded, false, 'tool events must exclude the service fee')
assert.equal(report.toolExecutionReadiness.internalDryRunMonitoringAllowed, true, 'covered tools may be monitored internally')
assert.equal(report.toolExecutionReadiness.externalBetaToolExecutionAllowed, false, 'external tool execution requires accepted evidence')
assert.equal(report.toolExecutionReadiness.productionToolExecutionAllowed, false, 'production tool execution requires accepted evidence')
assert.ok(report.toolExecutionReadiness.tools.some((tool) => tool.toolId === 'ffmpeg'))
assert.ok(report.toolExecutionReadiness.tools.some((tool) => tool.toolId === 'remotion'))

const completePlatformEvidence: ToolBetaPlatformReadinessEvidence = {
  sourceId: 'beta-readiness-smoke:complete-platform-evidence',
  sourceSha: '3333333333333333333333333333333333333333',
  environment: 'staging',
  toolCostEventsMigrationDeployed: true,
  productionReadinessEvidenceMigrationDeployed: true,
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
  notes: ['Smoke fixture for evidence-driven top-level beta gates.'],
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
    notes: ['Explicit model-license evidence clears the named blocker.'],
  },
  {
    itemId: 'gcp_deployment_not_done',
    sourceId: 'beta-readiness-smoke:deployment-approval',
    sourceSha: '6666666666666666666666666666666666666666',
    status: 'passed',
    notes: ['Explicit deployment evidence clears the named blocker.'],
  },
]
const evidenceDrivenReport = buildBetaReadinessReport({
  checklistEvidence,
  acceptedToolEvidence: completeToolEvidence,
  platformEvidence: completePlatformEvidence,
  boundedToolExecutionReady: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  legalApproved: true,
  monitoringApproved: true,
  supportApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
})
assert.equal(evidenceDrivenReport.toolExecutionReadiness.externalBetaToolExecutionAllowed, true)
assert.equal(evidenceDrivenReport.toolExecutionReadiness.productionToolExecutionAllowed, true)
assert.equal(evidenceDrivenReport.goNoGo.externalBetaAllowed, true, 'complete external-beta evidence should open that gate')
assert.equal(evidenceDrivenReport.goNoGo.realUserMediaBetaAllowed, false, 'user-media beta still needs explicit approval')
assert.equal(evidenceDrivenReport.goNoGo.paidProductionAllowed, false, 'paid production still needs explicit evidence')
assert.throws(
  () => buildBetaReadinessReport({
    checklistEvidence: [
      { ...checklistEvidence[0] },
      { ...checklistEvidence[0], sourceId: 'beta-readiness-smoke:duplicate-model-license-approval' },
    ],
  }),
  /Duplicate beta checklist evidence/,
  'duplicate checklist evidence should fail closed',
)

const completeGateInput = {
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  boundedToolExecutionReady: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  legalApproved: true,
  monitoringApproved: true,
  supportApproved: true,
  realUserMediaBetaApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidenceReady: true,
  paidProductionApproved: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  costControlsApproved: true,
  observabilityApproved: true,
  incidentRunbookApproved: true,
  finalDeliveryShareApproved: true,
  hardLaunchBlockersPresent: false,
  checklist: [],
}
const allGatesAllowed = evaluateBetaGoNoGo(completeGateInput)
assert.equal(allGatesAllowed.externalBetaAllowed, true, 'external beta must be evidence-driven')
assert.equal(allGatesAllowed.realUserMediaBetaAllowed, true, 'real-user-media beta must be evidence-driven')
assert.equal(allGatesAllowed.paidProductionAllowed, true, 'paid production must be evidence-driven')

const realUserMediaWithoutExternal = evaluateBetaGoNoGo({
  ...completeGateInput,
  productionReadinessBlocked: true,
})
assert.equal(realUserMediaWithoutExternal.externalBetaAllowed, false)
assert.equal(realUserMediaWithoutExternal.realUserMediaBetaAllowed, false, 'real-user-media beta cannot pass before external beta')

const paidProductionWithoutBilling = evaluateBetaGoNoGo({
  ...completeGateInput,
  billingLedgerPersistenceApproved: false,
})
assert.equal(paidProductionWithoutBilling.realUserMediaBetaAllowed, true)
assert.equal(paidProductionWithoutBilling.paidProductionAllowed, false)
assert.ok(paidProductionWithoutBilling.blockers.some((blocker) => blocker.includes('Billing ledger persistence approval is missing')))

const hardSafetyBlocked = evaluateBetaGoNoGo({
  ...completeGateInput,
  rawPromptSafetyPassed: false,
})
assert.equal(hardSafetyBlocked.externalBetaAllowed, false, 'raw prompt safety must hard-block external beta')
assert.ok(hardSafetyBlocked.blockers.some((blocker) => blocker.includes('Raw prompt')))

for (const source of [
  'server/beta-readiness/beta-readiness-report-builder.ts',
  'server/beta-readiness/beta-go-no-go-policy.ts',
  'server/beta-readiness/beta-scenario-readiness-matrix.ts',
  'server/beta-readiness/platform-deployed-evidence-verifier.ts',
]) {
  const contents = readFileSync(source, 'utf8')
  assert.equal(contents.includes('externalBetaAllowed: false'), false, `${source} must not hardcode externalBetaAllowed false`)
  assert.equal(contents.includes('paidProductionAllowed: false'), false, `${source} must not hardcode paidProductionAllowed false`)
  assert.equal(contents.includes('productionReadinessBlocked: true'), false, `${source} must not hardcode productionReadinessBlocked true`)
}

console.log('beta-readiness-smoke passed')
