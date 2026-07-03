import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildBetaReadinessReport, buildBetaScenarioReadinessMatrix, evaluateBetaGoNoGo } from '../beta-readiness'

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

const externalBetaReady = evaluateBetaGoNoGo({
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedPlanSnapshotGateConfirmed: true,
  creditReservationGateConfirmed: true,
  idempotencyGateConfirmed: true,
  rawPromptBlocked: true,
  secretsBlocked: true,
  signedUrlSourceTruthBlocked: true,
})
assert.equal(externalBetaReady.externalBetaAllowed, true, 'external beta should pass when all external-beta evidence is supplied')
assert.equal(externalBetaReady.realUserMediaBetaAllowed, false, 'real-user-media beta must not pass before private media approval')
assert.equal(externalBetaReady.paidProductionAllowed, false, 'paid production must not pass before real-user-media and billing/ops gates')

const paidProductionReadyOptions = {
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidenceApproved: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  walletLifecycleApproved: true,
  stripeBoundaryConfirmed: true,
  costControlsApproved: true,
  observabilityAlertsApproved: true,
  rollbackKillSwitchesApproved: true,
  rateConcurrencyLimitsApproved: true,
  finalOwnerSignoffApproved: true,
  approvedPlanSnapshotGateConfirmed: true,
  creditReservationGateConfirmed: true,
  idempotencyGateConfirmed: true,
  rawPromptBlocked: true,
  secretsBlocked: true,
  signedUrlSourceTruthBlocked: true,
}
const paidProductionReady = evaluateBetaGoNoGo(paidProductionReadyOptions)
assert.equal(paidProductionReady.externalBetaAllowed, true, 'external beta should stay passed for paid-production-ready evidence')
assert.equal(paidProductionReady.realUserMediaBetaAllowed, true, 'real-user-media beta should pass only after private media/artifact evidence')
assert.equal(paidProductionReady.paidProductionAllowed, true, 'paid production should pass when every billing, ops, and owner gate is supplied')

const unsafeProduction = evaluateBetaGoNoGo({
  ...paidProductionReadyOptions,
  rawPromptBlocked: false,
})
assert.equal(unsafeProduction.paidProductionAllowed, false, 'paid production must hard-fail if raw prompt blocking is missing')
assert.ok(unsafeProduction.paidProductionBlockers.some((blocker) => blocker.includes('Raw prompt')), 'raw prompt blocker should be explicit')

const missingSafetyEvidence = evaluateBetaGoNoGo({
  ...paidProductionReadyOptions,
  rawPromptBlocked: undefined,
})
assert.equal(missingSafetyEvidence.paidProductionAllowed, false, 'paid production must hard-fail when raw prompt blocking evidence is absent')
assert.ok(missingSafetyEvidence.paidProductionBlockers.some((blocker) => blocker.includes('Raw prompt')), 'absent raw prompt evidence should be explicit')

const productionMatrix = buildBetaScenarioReadinessMatrix({ productionReadyAllowed: true })
assert.ok(productionMatrix.every((scenario) => scenario.productionReady === true), 'scenario matrix should become production-ready only when paid production gate passes')

const betaPolicySource = readFileSync(new URL('../beta-readiness/beta-go-no-go-policy.ts', import.meta.url), 'utf8')
assert.ok(!betaPolicySource.includes('externalBetaAllowed: false,'), 'beta policy must not hardcode externalBetaAllowed false')
assert.ok(!betaPolicySource.includes('paidProductionAllowed: false,'), 'beta policy must not hardcode paidProductionAllowed false')

console.log('beta-readiness-smoke passed')
