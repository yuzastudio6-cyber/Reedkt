import { betaReadinessChecklist } from './beta-readiness-checklist'
import { evaluateBetaGoNoGo } from './beta-go-no-go-policy'
import { buildBetaScenarioReadinessMatrix } from './beta-scenario-readiness-matrix'
import type { BetaReadinessReport } from './beta-readiness-types'

export interface BuildBetaReadinessReportOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  productionReadinessBlocked?: boolean
  deploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  privateMediaApproved?: boolean
  artifactPrivacyEvidenceApproved?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  incidentRunbookApproved?: boolean
  observabilityApproved?: boolean
  noHardLaunchBlockers?: boolean
  rawPromptSafetyPassed?: boolean
  secretSafetyPassed?: boolean
  signedUrlSourceTruthBlocked?: boolean
  approvedSnapshotPolicyApproved?: boolean
  creditReservationPolicyApproved?: boolean
}

export function buildBetaReadinessReport(options: BuildBetaReadinessReportOptions = {}): BetaReadinessReport {
  const checklist = betaReadinessChecklist
  const scenarioMatrix = buildBetaScenarioReadinessMatrix()
  const goNoGo = evaluateBetaGoNoGo({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: options.safetyDocsExist ?? true,
    costDocsExist: options.costDocsExist ?? true,
    productionReadinessBlocked: options.productionReadinessBlocked ?? true,
    deploymentApproved: options.deploymentApproved,
    securityApproved: options.securityApproved,
    storageApproved: options.storageApproved,
    modelLicensesApproved: options.modelLicensesApproved,
    privateMediaApproved: options.privateMediaApproved,
    artifactPrivacyEvidenceApproved: options.artifactPrivacyEvidenceApproved,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    costControlsApproved: options.costControlsApproved,
    incidentRunbookApproved: options.incidentRunbookApproved,
    observabilityApproved: options.observabilityApproved,
    noHardLaunchBlockers: options.noHardLaunchBlockers,
    rawPromptSafetyPassed: options.rawPromptSafetyPassed,
    secretSafetyPassed: options.secretSafetyPassed,
    signedUrlSourceTruthBlocked: options.signedUrlSourceTruthBlocked,
    approvedSnapshotPolicyApproved: options.approvedSnapshotPolicyApproved,
    creditReservationPolicyApproved: options.creditReservationPolicyApproved,
    checklist,
  })
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
    checklist,
    scenarioMatrix,
    goNoGo,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextActions: [
      goNoGo.internalDryRunTestingAllowed
        ? 'Internal dry-run evidence is present; continue monitoring for regressions.'
        : 'Run M16B dry-run E2E and safety/cost checks before any internal demo.',
      goNoGo.externalBetaAllowed
        ? 'External beta gate is allowed by supplied evidence; keep rollout owner-scoped and monitored.'
        : 'Complete human security, cost, storage, deployment, model/license, and readiness reviews before external beta.',
      goNoGo.realUserMediaBetaAllowed
        ? 'Real-user-media beta gate is allowed by supplied evidence; preserve artifact privacy and retention controls.'
        : 'Keep real user media blocked until private-media approval and artifact privacy evidence pass.',
      goNoGo.paidProductionAllowed
        ? 'Paid production gate is allowed by supplied evidence; preserve billing ledger, incident, and observability controls.'
        : 'Keep paid production blocked until deployment, billing ledger, cost controls, incident, observability, and hard launch gates pass.',
    ],
  }
}
