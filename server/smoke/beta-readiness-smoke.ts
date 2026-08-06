import assert from 'node:assert/strict'
import { buildBetaReadinessReport, buildBetaScenarioReadinessMatrix, evaluateBetaGoNoGo } from '../beta-readiness'

const report = buildBetaReadinessReport()
const passingChecklist = report.checklist.map((item) => ({
  ...item,
  status: 'passed' as const,
  notes: [...item.notes, 'Smoke-supplied approval evidence accepted for readiness regression.'],
}))

assert.ok(report.reportId.startsWith('beta-readiness-'), 'beta readiness report should build')
assert.equal(report.goNoGo.externalBetaAllowed, false, 'external beta must be blocked by default')
assert.equal(report.goNoGo.internalDryRunTestingAllowed, true, 'internal dry-run testing may be allowed after E2E and safety docs')
assert.equal(report.goNoGo.realUserMediaBetaAllowed, false, 'real user media beta must be blocked')
assert.equal(report.goNoGo.paidProductionAllowed, false, 'paid production must be blocked')
assert.equal(report.productionReady, false, 'production readiness must be blocked by default')
assert.equal(report.productionReadinessBlocked, true, 'default readiness report should expose the current production blocker')
assert.ok(report.goNoGo.launchStageGates.length >= 5, 'launch stage gates should be explicit')
assert.ok(report.goNoGo.blockers.some((blocker) => /Model weight and license approval/i.test(blocker)), 'model/license approval should remain a blocker by default')

const matrix = buildBetaScenarioReadinessMatrix()
assert.equal(matrix.length, 9, 'scenario readiness matrix should include all nine M16B scenarios')
assert.ok(matrix.every((scenario) => scenario.productionReady === false), 'productionReady should remain false for every scenario')
assert.ok(report.nextActions.length > 0, 'next actions should be present')
assert.ok(!report.nextActions.join(' ').toLowerCase().includes('revideo production dependency'), 'Revideo must not be a beta-ready production dependency')
assert.ok(report.blockers.some((blocker) => blocker.includes('Production readiness')), 'production readiness blockers should remain present')

const externalBetaAllowed = evaluateBetaGoNoGo({
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  approvedPlanSnapshotGatePresent: true,
  creditEstimateGatePresent: true,
  creditReservationGatePresent: true,
  idempotencyGatePresent: true,
  rawPromptStorageBlocked: true,
  secretScrubbingEnabled: true,
  signedUrlSourceTruthBlocked: true,
  licenseModelWeightReviewApproved: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  checklist: [],
})
assert.equal(externalBetaAllowed.externalBetaAllowed, true, 'external beta should become allowed when every external-beta gate is supplied')
assert.equal(externalBetaAllowed.realUserMediaBetaAllowed, false, 'real user media beta cannot pass before private-media evidence')
assert.equal(externalBetaAllowed.paidProductionAllowed, false, 'paid production cannot pass before real-user-media and billing/deployment gates')

const realUserMediaAllowed = evaluateBetaGoNoGo({
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  approvedPlanSnapshotGatePresent: true,
  creditEstimateGatePresent: true,
  creditReservationGatePresent: true,
  idempotencyGatePresent: true,
  rawPromptStorageBlocked: true,
  secretScrubbingEnabled: true,
  signedUrlSourceTruthBlocked: true,
  licenseModelWeightReviewApproved: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidence: true,
  checklist: [],
})
assert.equal(realUserMediaAllowed.realUserMediaBetaAllowed, true, 'real user media beta should require external beta plus private-media evidence')
assert.equal(realUserMediaAllowed.paidProductionAllowed, false, 'paid production still requires production billing/deployment gates')

const paidProductionAllowed = evaluateBetaGoNoGo({
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  approvedPlanSnapshotGatePresent: true,
  creditEstimateGatePresent: true,
  creditReservationGatePresent: true,
  idempotencyGatePresent: true,
  rawPromptStorageBlocked: true,
  secretScrubbingEnabled: true,
  signedUrlSourceTruthBlocked: true,
  licenseModelWeightReviewApproved: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidence: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  costControlsApproved: true,
  incidentRunbookApproved: true,
  observabilityApproved: true,
  legalApproval: true,
  checklist: [],
})
assert.equal(paidProductionAllowed.paidProductionAllowed, true, 'paid production should become allowed only when every production gate is supplied')

const paidProductionReport = buildBetaReadinessReport({
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  approvedPlanSnapshotGatePresent: true,
  creditEstimateGatePresent: true,
  creditReservationGatePresent: true,
  idempotencyGatePresent: true,
  rawPromptStorageBlocked: true,
  secretScrubbingEnabled: true,
  signedUrlSourceTruthBlocked: true,
  licenseModelWeightReviewApproved: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidence: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  costControlsApproved: true,
  incidentRunbookApproved: true,
  observabilityApproved: true,
  legalApproval: true,
  checklist: passingChecklist,
})
assert.equal(paidProductionReport.productionReady, true, 'readiness report should become production-ready when every report gate passes')
assert.equal(paidProductionReport.overallStatus, 'paid_production_ready', 'readiness report should expose the highest passed launch stage')
assert.ok(paidProductionReport.scenarioMatrix.every((scenario) => scenario.productionReady), 'scenario matrix should reflect report-level production readiness')

const missingSafetyInvariant = evaluateBetaGoNoGo({
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  approvedPlanSnapshotGatePresent: false,
  creditEstimateGatePresent: true,
  creditReservationGatePresent: true,
  idempotencyGatePresent: true,
  rawPromptStorageBlocked: true,
  secretScrubbingEnabled: true,
  signedUrlSourceTruthBlocked: true,
  licenseModelWeightReviewApproved: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  checklist: [],
})
assert.equal(missingSafetyInvariant.externalBetaAllowed, false, 'missing approved snapshot gate must hard-fail external beta')
assert.ok(missingSafetyInvariant.blockers.some((blocker) => /Approved plan snapshot/i.test(blocker)), 'approved snapshot blocker must be explicit')

const source = await import('node:fs/promises').then((fs) => Promise.all([
  fs.readFile(new URL('../beta-readiness/beta-go-no-go-policy.ts', import.meta.url), 'utf8'),
  fs.readFile(new URL('../beta-readiness/beta-readiness-report-builder.ts', import.meta.url), 'utf8'),
]))
assert.equal(source.join('\n').includes('externalBetaAllowed: false'), false, 'external beta must not be hardcoded false')
assert.equal(source.join('\n').includes('paidProductionAllowed: false'), false, 'paid production must not be hardcoded false')
assert.equal(source.join('\n').includes('productionReadinessBlocked: true'), false, 'production readiness blocked must not be hardcoded true in report construction')

console.log('beta-readiness-smoke passed')
