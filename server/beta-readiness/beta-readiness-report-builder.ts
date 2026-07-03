import { betaReadinessChecklist } from './beta-readiness-checklist'
import { evaluateBetaGoNoGo, type EvaluateBetaGoNoGoOptions } from './beta-go-no-go-policy'
import { buildBetaScenarioReadinessMatrix } from './beta-scenario-readiness-matrix'
import type { BetaReadinessChecklistItem, BetaReadinessReport, BetaReadinessStatus } from './beta-readiness-types'

export interface BuildBetaReadinessReportOptions extends EvaluateBetaGoNoGoOptions {}

function resolvedChecklistStatus(item: BetaReadinessChecklistItem, options: BuildBetaReadinessReportOptions): BetaReadinessStatus {
  if (item.id === 'readiness_validation_complete' && options.productionReadinessBlocked === false) return 'passed'
  if (item.id === 'model_weights_not_approved' && options.modelLicensesApproved === true) return 'passed'
  if (item.id === 'gcp_deployment_not_done' && options.deploymentApproved === true) return 'passed'
  if (item.id === 'security_review_pending' && options.securityApproved === true) return 'passed'
  if (item.id === 'cost_controls_pending' && options.costControlsApproved === true) return 'passed'
  if (item.id === 'retention_deletion_policy_pending' && options.storageApproved === true) return 'passed'
  if (item.id === 'observability_plan_pending' && options.observabilityAlertsApproved === true) return 'passed'
  if (item.id === 'incident_runbook_pending' && options.finalOwnerSignoffApproved === true) return 'passed'
  return item.status
}

export function buildBetaReadinessReport(options: BuildBetaReadinessReportOptions = {}): BetaReadinessReport {
  const checklist = betaReadinessChecklist.map((item) => ({
    ...item,
    status: resolvedChecklistStatus(item, options),
  }))
  const goNoGo = evaluateBetaGoNoGo({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: options.safetyDocsExist ?? true,
    costDocsExist: options.costDocsExist ?? true,
    productionReadinessBlocked: options.productionReadinessBlocked ?? true,
    deploymentApproved: options.deploymentApproved,
    securityApproved: options.securityApproved,
    storageApproved: options.storageApproved,
    modelLicensesApproved: options.modelLicensesApproved,
    privateMediaApproval: options.privateMediaApproval,
    artifactPrivacyEvidenceApproved: options.artifactPrivacyEvidenceApproved,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    walletLifecycleApproved: options.walletLifecycleApproved,
    stripeBoundaryConfirmed: options.stripeBoundaryConfirmed,
    costControlsApproved: options.costControlsApproved,
    observabilityAlertsApproved: options.observabilityAlertsApproved,
    rollbackKillSwitchesApproved: options.rollbackKillSwitchesApproved,
    rateConcurrencyLimitsApproved: options.rateConcurrencyLimitsApproved,
    finalOwnerSignoffApproved: options.finalOwnerSignoffApproved,
    approvedPlanSnapshotGateConfirmed: options.approvedPlanSnapshotGateConfirmed,
    creditReservationGateConfirmed: options.creditReservationGateConfirmed,
    idempotencyGateConfirmed: options.idempotencyGateConfirmed,
    rawPromptBlocked: options.rawPromptBlocked,
    secretsBlocked: options.secretsBlocked,
    signedUrlSourceTruthBlocked: options.signedUrlSourceTruthBlocked,
    checklist,
  })
  const scenarioMatrix = buildBetaScenarioReadinessMatrix({ productionReadyAllowed: goNoGo.paidProductionAllowed })
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
    overallStatus: goNoGo.internalDryRunTestingAllowed ? 'internal_testing_ready' : 'blocked',
    productionReady: goNoGo.paidProductionAllowed,
    checklist,
    scenarioMatrix,
    goNoGo,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextActions: [
      'Run M16B dry-run E2E and M17 hardening smokes before any internal demo.',
      'Complete human security, cost, storage, deployment, model, and legal reviews before external beta.',
      'Keep real user media beta and paid production blocked until readiness is explicitly approved.',
    ],
  }
}
