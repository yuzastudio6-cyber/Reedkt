import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  buildBetaReadinessReport,
  buildBetaScenarioReadinessMatrix,
  evaluateBetaGoNoGo,
  launchReadinessGatePolicy,
} from '../beta-readiness'

const repoRoot = process.cwd()

const report = buildBetaReadinessReport()

assert.ok(report.reportId.startsWith('beta-readiness-'), 'beta readiness report should build')
assert.equal(report.goNoGo.externalBetaAllowed, false, 'external beta must be blocked by default when evidence is missing')
assert.equal(report.goNoGo.internalDryRunTestingAllowed, true, 'internal dry-run testing may be allowed after E2E and safety docs')
assert.equal(report.goNoGo.realUserMediaBetaAllowed, false, 'real user media beta must be blocked by default')
assert.equal(report.goNoGo.paidProductionAllowed, false, 'paid production must be blocked by default')

const matrix = buildBetaScenarioReadinessMatrix()
assert.equal(matrix.length, 9, 'scenario readiness matrix should include all nine M16B scenarios')
assert.ok(matrix.every((scenario) => scenario.productionReady === false), 'productionReady should remain false for every scenario')
assert.ok(report.nextActions.length > 0, 'next actions should be present')
assert.ok(!report.nextActions.join(' ').toLowerCase().includes('revideo production dependency'), 'Revideo must not be a beta-ready production dependency')
assert.ok(report.blockers.some((blocker) => blocker.includes('Production readiness')), 'production readiness blockers should remain present')
assert.deepEqual(
  launchReadinessGatePolicy.map((item) => item.stage),
  ['internal_dry_run', 'bounded_tool_execution', 'external_beta', 'real_user_media_beta', 'paid_production'],
)

const passedChecklist = [
  { id: 'architecture_docs_complete', label: 'Architecture docs complete', status: 'passed' as const, requiredForExternalBeta: true, notes: [] },
  { id: 'contracts_schema_complete', label: 'Contracts/schema complete', status: 'passed' as const, requiredForExternalBeta: true, notes: [] },
]
const externalAllowed = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
})
assert.equal(externalAllowed.externalBetaAllowed, true, 'external beta should become allowed when all external beta gates pass')
assert.equal(externalAllowed.realUserMediaBetaAllowed, false, 'real-user-media beta should not pass before private media gates')

const realUserMediaAllowed = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  privateMediaApproved: true,
  artifactPrivacyEvidenceApproved: true,
})
assert.equal(realUserMediaAllowed.realUserMediaBetaAllowed, true, 'real-user-media beta should pass after external beta plus media/privacy gates')
assert.equal(realUserMediaAllowed.paidProductionAllowed, false, 'paid production should not pass before production/billing gates')

const paidProductionAllowed = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  privateMediaApproved: true,
  artifactPrivacyEvidenceApproved: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  costControlsApproved: true,
  incidentRunbookApproved: true,
  observabilityApproved: true,
  noHardLaunchBlockers: true,
})
assert.equal(paidProductionAllowed.paidProductionAllowed, true, 'paid production should pass only with every required gate')

const hardSafetyBlocked = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  rawPromptSafetyPassed: false,
})
assert.equal(hardSafetyBlocked.externalBetaAllowed, false, 'raw prompt safety failure should hard-block external beta')
assert.ok(hardSafetyBlocked.blockers.some((blocker) => blocker.includes('Raw prompt')), 'raw prompt blocker should be explicit')

const goNoGoSource = readFileSync(path.join(repoRoot, 'server/beta-readiness/beta-go-no-go-policy.ts'), 'utf8')
const reportBuilderSource = readFileSync(path.join(repoRoot, 'server/beta-readiness/beta-readiness-report-builder.ts'), 'utf8')
assert.equal(goNoGoSource.includes('externalBetaAllowed: false'), false, 'go/no-go policy must not hardcode externalBetaAllowed false')
assert.equal(goNoGoSource.includes('paidProductionAllowed: false'), false, 'go/no-go policy must not hardcode paidProductionAllowed false')
assert.equal(reportBuilderSource.includes('productionReadinessBlocked: true'), false, 'report builder must not hardcode productionReadinessBlocked true')

console.log('beta-readiness-smoke passed')
