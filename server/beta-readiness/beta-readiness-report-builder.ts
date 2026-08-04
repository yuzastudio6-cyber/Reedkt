import { betaReadinessChecklist } from './beta-readiness-checklist'
import { evaluateBetaGoNoGo } from './beta-go-no-go-policy'
import { buildBetaScenarioReadinessMatrix } from './beta-scenario-readiness-matrix'
import type { BetaReadinessChecklistItem, BetaReadinessReport } from './beta-readiness-types'

export interface BuildBetaReadinessReportOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  productionReadinessBlocked?: boolean
  deploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  approvedPlanSnapshotGatePresent?: boolean
  creditEstimateGatePresent?: boolean
  creditReservationGatePresent?: boolean
  idempotencyGatePresent?: boolean
  rawPromptStorageBlocked?: boolean
  secretScrubbingEnabled?: boolean
  signedUrlSourceTruthBlocked?: boolean
  licenseModelWeightReviewApproved?: boolean
  privateMediaApproval?: boolean
  artifactPrivacyEvidence?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  incidentRunbookApproved?: boolean
  observabilityApproved?: boolean
  legalApproval?: boolean
  checklist?: BetaReadinessChecklistItem[]
}

export function buildBetaReadinessReport(options: BuildBetaReadinessReportOptions = {}): BetaReadinessReport {
  const checklist = options.checklist ?? betaReadinessChecklist
  const productionReadinessBlocked = options.productionReadinessBlocked ?? true
  const goNoGo = evaluateBetaGoNoGo({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: options.safetyDocsExist ?? true,
    costDocsExist: options.costDocsExist ?? true,
    productionReadinessBlocked,
    deploymentApproved: options.deploymentApproved,
    securityApproved: options.securityApproved,
    storageApproved: options.storageApproved,
    modelLicensesApproved: options.modelLicensesApproved,
    approvedPlanSnapshotGatePresent: options.approvedPlanSnapshotGatePresent,
    creditEstimateGatePresent: options.creditEstimateGatePresent,
    creditReservationGatePresent: options.creditReservationGatePresent,
    idempotencyGatePresent: options.idempotencyGatePresent,
    rawPromptStorageBlocked: options.rawPromptStorageBlocked,
    secretScrubbingEnabled: options.secretScrubbingEnabled,
    signedUrlSourceTruthBlocked: options.signedUrlSourceTruthBlocked,
    licenseModelWeightReviewApproved: options.licenseModelWeightReviewApproved,
    privateMediaApproval: options.privateMediaApproval,
    artifactPrivacyEvidence: options.artifactPrivacyEvidence,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    costControlsApproved: options.costControlsApproved,
    incidentRunbookApproved: options.incidentRunbookApproved,
    observabilityApproved: options.observabilityApproved,
    legalApproval: options.legalApproval,
    checklist,
  })
  const scenarioMatrix = buildBetaScenarioReadinessMatrix({ productionReady: goNoGo.paidProductionAllowed })
  const blockers = [
    ...goNoGo.blockers,
    ...scenarioMatrix.flatMap((scenario) => scenario.blockers),
  ]
  const warnings = [
    ...goNoGo.warnings,
    ...checklist.filter((item) => item.status === 'warning').map((item) => item.label),
  ]

  return {
    reportId: `beta-readiness-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    overallStatus: goNoGo.paidProductionAllowed
      ? 'paid_production_ready'
      : goNoGo.realUserMediaBetaAllowed
        ? 'real_user_media_beta_ready'
        : goNoGo.externalBetaAllowed
          ? 'external_beta_ready'
          : goNoGo.internalDryRunTestingAllowed
            ? 'internal_testing_ready'
            : 'blocked',
    productionReady: goNoGo.paidProductionAllowed,
    productionReadinessBlocked,
    checklist,
    scenarioMatrix,
    goNoGo,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextActions: [
      'Run M16B dry-run E2E and M17 hardening smokes before any internal demo.',
      'Complete security, cost, storage, deployment, model/license, privacy, observability, and legal reviews before graduating launch gates.',
      'Keep real user media beta and paid production blocked unless the corresponding evidence gates pass.',
    ],
  }
}
