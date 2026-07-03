import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildBetaReadinessReport, evaluateBetaGoNoGo } from '../beta-readiness'
import {
  buildProductionHardeningReport,
  classifyProductionLaunchBlockers,
  productionHardeningCategories,
} from '../production-hardening'
import { buildProductionReadinessReport } from '../workers/readiness-validation'

const report = buildProductionHardeningReport()
assert.equal(report.overallStatus, 'blocked', 'production hardening should default to blocked')
assert.equal(report.productionReadyAllowed, false, 'productionReadyAllowed must remain false by default')
assert.ok(report.blockers.length > 0, 'hardening report should include blockers')
assert.deepEqual(report.categories, productionHardeningCategories, 'hardening report should include all required categories')

for (const category of productionHardeningCategories) {
  assert.ok(category in report.scorecard.categoryScores, `scorecard missing category ${category}`)
}

const readinessBlocked = classifyProductionLaunchBlockers({
  readinessReport: buildProductionReadinessReport({ includeCommandPlans: false }),
})
assert.ok(readinessBlocked.hardBlockers.some((blocker) => blocker.includes('readiness')), 'readiness blocker should block launch')

const modelBlocked = classifyProductionLaunchBlockers({ modelWeightsApproved: false })
assert.ok(modelBlocked.hardBlockers.some((blocker) => blocker.includes('Model weights')), 'model weights should block launch')

const revideoBlocked = classifyProductionLaunchBlockers({ revideoRequested: true })
assert.ok(revideoBlocked.hardBlockers.some((blocker) => blocker.includes('Revideo')), 'Revideo production request should block launch')

const ffmpegReview = classifyProductionLaunchBlockers({ ffmpegLgplReviewed: false })
assert.ok(ffmpegReview.manualReviewItems.some((item) => item.includes('FFmpeg LGPL')), 'FFmpeg LGPL review should be manual blocker')

const missingIncident = classifyProductionLaunchBlockers({ incidentRunbookExists: false })
assert.ok(missingIncident.hardBlockers.some((blocker) => blocker.includes('Incident response runbook')), 'missing incident runbook should block until docs exist')

const betaReport = buildBetaReadinessReport({ e2eDryRunPassed: true, safetyDocsExist: true, costDocsExist: true })
assert.equal(betaReport.goNoGo.internalDryRunTestingAllowed, true, 'internal dry-run testing can be allowed after E2E and safety docs')
assert.equal(betaReport.goNoGo.externalBetaAllowed, false, 'external beta must remain blocked')

const betaNoGo = evaluateBetaGoNoGo({ e2eDryRunPassed: false, safetyDocsExist: true, costDocsExist: true })
assert.equal(betaNoGo.internalDryRunTestingAllowed, false, 'internal dry-run testing should require E2E dry-run pass')

const passedReadinessReport = {
  ...buildProductionReadinessReport({ includeCommandPlans: false }),
  overallStatus: 'passed' as const,
  blockerSummaries: [],
  warnings: [],
}
const productionReadyReport = buildProductionHardeningReport({
  readinessReport: passedReadinessReport,
  e2eDryRunPassed: true,
  incidentRunbookExists: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  launchCoreToolsReady: true,
  ffmpegLgplReviewed: true,
  renderReadinessApproved: true,
  productionDeploymentApproved: true,
  supabaseProductionPersistenceApproved: true,
  toolCostLedgerWritesApproved: true,
  billingLedgerPersistenceApproved: true,
  walletLifecycleApproved: true,
  stripeBoundaryConfirmed: true,
  costControlsApproved: true,
  observabilityAlertsApproved: true,
  rollbackKillSwitchesApproved: true,
  rateConcurrencyLimitsApproved: true,
  finalOwnerSignoffApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidenceApproved: true,
  approvedPlanSnapshotGateConfirmed: true,
  creditReservationGateConfirmed: true,
  idempotencyGateConfirmed: true,
  rawPromptBlocked: true,
  secretsBlocked: true,
  signedUrlSourceTruthBlocked: true,
})
assert.equal(productionReadyReport.productionReadyAllowed, true, 'production readiness should pass only when all evidence and owner approvals are supplied')
assert.equal(productionReadyReport.overallStatus, 'ready_for_paid_production', 'fully evidenced production hardening should report paid-production readiness')
assert.equal(productionReadyReport.blockers.length, 0, 'fully evidenced production hardening should have no blockers')

const scorecardSource = readFileSync(new URL('../production-hardening/production-readiness-scorecard.ts', import.meta.url), 'utf8')
const reportBuilderSource = readFileSync(new URL('../production-hardening/production-beta-readiness-report.ts', import.meta.url), 'utf8')
assert.ok(!scorecardSource.includes('productionReadyAllowed: false,'), 'production scorecard must not hardcode productionReadyAllowed false')
assert.ok(!reportBuilderSource.includes('productionReadyAllowed: false,'), 'production hardening report must not hardcode productionReadyAllowed false')

console.log('production-hardening-smoke passed')
