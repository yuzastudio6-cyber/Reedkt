import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildBetaReadinessReport, evaluateBetaGoNoGo } from '../beta-readiness'
import { buildProductionWorkflowReadinessSummary } from '../e2e/production-workflow'
import { buildProductionHardeningReport } from '../production-hardening'
import {
  evaluateProfessionalToolAdapterProductReadiness,
  resolveProfessionalToolAdapterContract,
} from '../tool-registry'
import { buildProductionReadinessReport } from '../workers/readiness-validation'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const completeLaunchEvidence = {
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
}

const defaultGoNoGo = evaluateBetaGoNoGo()
assert.equal(defaultGoNoGo.externalBetaAllowed, false, 'external beta must stay closed without explicit launch evidence')
assert.equal(defaultGoNoGo.realUserMediaBetaAllowed, false, 'real-user-media beta must stay closed without explicit launch evidence')
assert.equal(defaultGoNoGo.paidProductionAllowed, false, 'paid production must stay closed without explicit launch evidence')

const missingSnapshotGoNoGo = evaluateBetaGoNoGo({
  ...completeLaunchEvidence,
  approvedPlanSnapshotGatePresent: false,
})
assert.equal(missingSnapshotGoNoGo.externalBetaAllowed, false, 'approved snapshot evidence must remain a hard launch invariant')
assert.ok(
  missingSnapshotGoNoGo.blockers.some((blocker) => /approved plan snapshot/i.test(blocker)),
  'missing approved snapshot evidence must be named in launch blockers',
)

const completeGoNoGo = evaluateBetaGoNoGo(completeLaunchEvidence)
assert.equal(completeGoNoGo.externalBetaAllowed, true, 'external beta should become allowed when all external-beta gates pass')
assert.equal(completeGoNoGo.realUserMediaBetaAllowed, true, 'real-user-media beta should become allowed when private-media gates also pass')
assert.equal(completeGoNoGo.paidProductionAllowed, true, 'paid production should become allowed when billing/deployment/legal gates also pass')

const completeBetaReport = buildBetaReadinessReport(completeLaunchEvidence)
assert.equal(completeBetaReport.productionReady, true, 'beta readiness report must graduate when every evidence gate passes')
assert.equal(completeBetaReport.overallStatus, 'paid_production_ready', 'beta readiness report should expose the highest passed stage')

const passingChecklist = completeBetaReport.checklist.map((item) => ({
  ...item,
  status: 'passed' as const,
  notes: [...item.notes, 'Evidence-gated readiness smoke supplied approval evidence.'],
}))
const cleanReadinessReport = {
  ...buildProductionReadinessReport({ includeCommandPlans: false }),
  overallStatus: 'passed' as const,
  blockerSummaries: [],
  warnings: [],
}
const hardeningReport = buildProductionHardeningReport({
  readinessReport: cleanReadinessReport,
  securityReviewOptions: {
    modelWeightStatuses: ['approved'],
    storagePrivate: true,
  },
  e2eDryRunPassed: true,
  incidentRunbookExists: true,
  productionReadinessBlocked: false,
  modelWeightsApproved: true,
  launchCoreToolsReady: true,
  ffmpegLgplReviewed: true,
  renderReadinessApproved: true,
  revideoRequested: false,
  idempotencyGatesPresent: true,
  approvedSnapshotGatesPresent: true,
  costControlsApproved: true,
  concurrencyLimitsPresent: true,
  retentionDeletionPolicyPresent: true,
  auditLoggingPolicyPresent: true,
  blockingQAFailuresPresent: false,
  productionDeploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  licenseModelWeightReviewApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidence: true,
  billingLedgerPersistenceApproved: true,
  observabilityApproved: true,
  legalApproval: true,
  betaChecklist: passingChecklist,
})
assert.equal(hardeningReport.productionReadyAllowed, true, 'production hardening must graduate when every evidence gate passes')
assert.equal(hardeningReport.limitedBetaAllowed, true, 'limited beta must graduate when every external-beta gate passes')

const workflowReadiness = buildProductionWorkflowReadinessSummary({
  mode: 'production_ready',
  report: cleanReadinessReport,
  revideoRequested: false,
  signedUrlDetected: false,
  rawPromptDetected: false,
  upstreamBlockingQa: false,
})
assert.equal(workflowReadiness.productionReadyAllowed, true, 'production workflow readiness must have a clean positive path')

const signedUrlWorkflowReadiness = buildProductionWorkflowReadinessSummary({
  mode: 'production_ready',
  report: cleanReadinessReport,
  signedUrlDetected: true,
})
assert.equal(signedUrlWorkflowReadiness.productionReadyAllowed, false, 'signed URL source truth must keep production workflow blocked')

const visualContract = resolveProfessionalToolAdapterContract('d3')
assert.ok(visualContract, 'visual adapter contract should resolve')
assert.equal(visualContract.productReady, false, 'adapter contracts must default to not product-ready without evidence')
assert.equal(
  evaluateProfessionalToolAdapterProductReadiness(visualContract, {
    approvedPlanSnapshotContractReady: true,
    packageRuntimeReady: true,
    privateArtifactPolicyReady: true,
    qaGatePolicyReady: true,
    backendWorkerRunnerReady: true,
    costGateReady: true,
    modelWeightApprovalReady: true,
    profilePromotionApproved: true,
    productionDeploymentReady: true,
  }).productReady,
  true,
  'adapter contracts should become product-ready only when their evidence gates pass',
)
assert.equal(visualContract.frontendExecutionAllowed, false, 'adapter product readiness must not allow frontend execution')

await assertNoStaleBlanketBlockers([
  'server/beta-readiness/beta-go-no-go-policy.ts',
  'server/beta-readiness/beta-readiness-report-builder.ts',
  'server/production-hardening/production-beta-readiness-report.ts',
  'server/production-hardening/production-launch-blocker-policy.ts',
  'server/production-hardening/production-risk-register.ts',
  'server/tool-registry/professional-tool-adapter-contracts.ts',
  'server/activation/private-searxng-service/private-searxng-service-policy.ts',
  'server/services/approved-edit-execution-package-service.ts',
  'server/services/internal-edit-state-service.ts',
  'docs/production-beta-readiness-scorecard.md',
  'docs/production-beta-readiness-runbook.md',
  'docs/production-full-e2e-workflow-test-suite.md',
])

console.log(JSON.stringify({
  ok: true,
  scenario: 'synthetic_complete_evidence_positive_path',
  currentRepositoryReadinessClaim: false,
  defaultWithoutExplicitEvidence: {
    externalBetaAllowed: defaultGoNoGo.externalBetaAllowed,
    realUserMediaBetaAllowed: defaultGoNoGo.realUserMediaBetaAllowed,
    paidProductionAllowed: defaultGoNoGo.paidProductionAllowed,
  },
  syntheticCompleteEvidenceResult: {
    externalBetaAllowed: completeGoNoGo.externalBetaAllowed,
    realUserMediaBetaAllowed: completeGoNoGo.realUserMediaBetaAllowed,
    paidProductionAllowed: completeGoNoGo.paidProductionAllowed,
    hardeningProductionReadyAllowed: hardeningReport.productionReadyAllowed,
    workflowProductionReadyAllowed: workflowReadiness.productionReadyAllowed,
  },
}, null, 2))

async function assertNoStaleBlanketBlockers(relativeFiles: string[]): Promise<void> {
  const stalePatterns = [
    'externalBetaAllowed: false',
    'paidProductionAllowed: false',
    'productionReadinessBlocked: true',
    'production execution remains blocked',
    'external beta, production, and billing remain blocked',
    'External beta and paid production remain blocked',
    'paid production remain blocked',
    'Production readiness must remain false',
    'External beta readiness must remain false',
    'Paid production readiness must remain false',
    'Broad media readiness must remain false',
    'Keep productionReadyAllowed false',
    'Runtime execution remains local-dev/static only',
  ]
  const failures: string[] = []

  for (const relativeFile of relativeFiles) {
    const absoluteFile = path.join(repoRoot, relativeFile)
    const source = await readFile(absoluteFile, 'utf8')
    for (const pattern of stalePatterns) {
      if (source.includes(pattern)) failures.push(`${relativeFile}: ${pattern}`)
    }
  }

  assert.deepEqual(failures, [], 'stale blanket blocker wording must stay out of launch/readiness source truth files')
}
