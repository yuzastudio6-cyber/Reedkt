import { buildBetaReadinessReport } from '../beta-readiness'
import { buildCostControlSummary } from '../cost-controls'
import { buildSecurityReviewReport } from '../security-review'
import { buildProductionReadinessReport, type ProductionReadinessReport } from '../workers/readiness-validation'
import { classifyProductionLaunchBlockers } from './production-launch-blocker-policy'
import { productionHardeningCategories } from './production-hardening-policy'
import { computeProductionReadinessScorecard } from './production-readiness-scorecard'
import { productionRiskRegister } from './production-risk-register'
import type { ProductionHardeningCheck, ProductionHardeningReport } from './production-hardening-types'

export interface BuildProductionHardeningReportOptions {
  readinessReport?: ProductionReadinessReport
  e2eDryRunPassed?: boolean
  incidentRunbookExists?: boolean
  deploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  launchCoreToolsReady?: boolean
  ffmpegLgplReviewed?: boolean
  renderReadinessApproved?: boolean
  productionDeploymentApproved?: boolean
  supabaseProductionPersistenceApproved?: boolean
  toolCostLedgerWritesApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  walletLifecycleApproved?: boolean
  stripeBoundaryConfirmed?: boolean
  costControlsApproved?: boolean
  observabilityAlertsApproved?: boolean
  rollbackKillSwitchesApproved?: boolean
  rateConcurrencyLimitsApproved?: boolean
  finalOwnerSignoffApproved?: boolean
  privateMediaApproval?: boolean
  artifactPrivacyEvidenceApproved?: boolean
  approvedPlanSnapshotGateConfirmed?: boolean
  creditReservationGateConfirmed?: boolean
  idempotencyGateConfirmed?: boolean
  rawPromptBlocked?: boolean
  secretsBlocked?: boolean
  signedUrlSourceTruthBlocked?: boolean
}

function buildChecks(blockers: string[], warnings: string[], manualApprovalsComplete: boolean): ProductionHardeningCheck[] {
  const baseChecks: ProductionHardeningCheck[] = productionHardeningCategories.map((category) => ({
    id: `${category}_static_policy_present`,
    category,
    status: 'passed',
    message: `${category} static policy/report artifact exists.`,
    manualReviewRequired: manualApprovalsComplete ? false : category !== 'observability' && category !== 'logging_sanitization',
  }))
  return [
    ...baseChecks,
    ...blockers.map((message, index) => ({
      id: `hard_blocker_${index + 1}`,
      category: 'readiness_validation' as const,
      status: 'blocked' as const,
      message,
      manualReviewRequired: true,
    })),
    ...warnings.map((message, index) => ({
      id: `warning_${index + 1}`,
      category: 'beta_readiness' as const,
      status: 'warning' as const,
      message,
      manualReviewRequired: false,
    })),
  ]
}

export function buildProductionHardeningReport(options: BuildProductionHardeningReportOptions = {}): ProductionHardeningReport {
  const readinessReport = options.readinessReport ?? buildProductionReadinessReport({ includeCommandPlans: false })
  const modelLicensesApproved = options.modelLicensesApproved === true
  const storageApproved = options.storageApproved === true
  const securityReport = buildSecurityReviewReport({
    modelWeightStatuses: modelLicensesApproved ? ['approved'] : undefined,
    storagePrivate: storageApproved ? true : undefined,
  })
  const costSummary = buildCostControlSummary()
  const betaReport = buildBetaReadinessReport({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    productionReadinessBlocked: readinessReport.overallStatus === 'blocked',
    deploymentApproved: options.deploymentApproved,
    securityApproved: options.securityApproved,
    storageApproved: options.storageApproved,
    modelLicensesApproved: options.modelLicensesApproved,
    privateMediaApproval: options.privateMediaApproval,
    artifactPrivacyEvidenceApproved: options.artifactPrivacyEvidenceApproved,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved ?? options.toolCostLedgerWritesApproved,
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
  })
  const launchBlockers = classifyProductionLaunchBlockers({
    readinessReport,
    modelWeightsApproved: modelLicensesApproved,
    launchCoreToolsReady: options.launchCoreToolsReady ?? false,
    ffmpegLgplReviewed: options.ffmpegLgplReviewed ?? false,
    renderReadinessApproved: options.renderReadinessApproved ?? false,
    revideoRequested: false,
    idempotencyGatesPresent: options.idempotencyGateConfirmed ?? true,
    approvedSnapshotGatesPresent: options.approvedPlanSnapshotGateConfirmed ?? true,
    costControlsPresent: Boolean(costSummary),
    concurrencyLimitsPresent: options.rateConcurrencyLimitsApproved ?? true,
    retentionDeletionPolicyPresent: true,
    auditLoggingPolicyPresent: true,
    incidentRunbookExists: options.incidentRunbookExists ?? true,
    finalE2EDryRunPassed: options.e2eDryRunPassed ?? true,
    productionDeploymentApproved: options.productionDeploymentApproved ?? false,
    supabaseProductionPersistenceApproved: options.supabaseProductionPersistenceApproved,
    toolCostLedgerWritesApproved: options.toolCostLedgerWritesApproved,
    walletLifecycleApproved: options.walletLifecycleApproved,
    stripeBoundaryConfirmed: options.stripeBoundaryConfirmed,
    observabilityAlertsApproved: options.observabilityAlertsApproved,
    rollbackKillSwitchesApproved: options.rollbackKillSwitchesApproved,
    finalOwnerSignoffApproved: options.finalOwnerSignoffApproved,
  })
  const blockers = [...launchBlockers.hardBlockers, ...securityReport.blockers, ...betaReport.blockers]
  const warnings = [...launchBlockers.warnings, ...securityReport.warnings, ...betaReport.warnings]
  const manualApprovalsComplete = options.deploymentApproved === true &&
    options.securityApproved === true &&
    options.storageApproved === true &&
    modelLicensesApproved &&
    options.finalOwnerSignoffApproved === true
  const checks = buildChecks([...new Set(blockers)], [...new Set(warnings)], manualApprovalsComplete)
  const scorecard = computeProductionReadinessScorecard(checks, {
    productionGateEvidenceApproved: options.supabaseProductionPersistenceApproved === true &&
      options.toolCostLedgerWritesApproved === true &&
      options.walletLifecycleApproved === true &&
      options.stripeBoundaryConfirmed === true &&
      options.observabilityAlertsApproved === true &&
      options.rollbackKillSwitchesApproved === true &&
      options.rateConcurrencyLimitsApproved === true &&
      options.finalOwnerSignoffApproved === true &&
      betaReport.goNoGo.paidProductionAllowed,
  })
  const overallStatus = scorecard.productionReadyAllowed
    ? 'ready_for_paid_production'
    : scorecard.limitedBetaAllowed
      ? 'ready_for_limited_beta'
      : 'blocked'

  return {
    reportId: `production-hardening-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    overallStatus,
    categories: productionHardeningCategories,
    scorecard,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    passedChecks: checks.filter((check) => check.status === 'passed'),
    failedChecks: checks.filter((check) => check.status === 'blocked'),
    manualReviewItems: [
      ...new Set([
        ...launchBlockers.manualReviewItems,
        ...(scorecard.manualReviewCount > 0 ? ['Mandatory launch approvals remain incomplete.'] : []),
      ]),
    ],
    riskRegister: productionRiskRegister,
    nextActions: [
      scorecard.productionReadyAllowed
        ? 'Maintain owner-approved production evidence, billing audit, privacy, ops, and rollback controls before every production launch.'
        : 'Keep production_ready and external beta blocked until human-run deployment, readiness, model/license, security, cost, and legal approvals pass.',
      'Run the M16B E2E dry-run suite and M17 static smokes before internal testing.',
      'Do not process real user media or create public delivery links until storage/privacy/share policy is approved.',
    ],
    productionReadyAllowed: scorecard.productionReadyAllowed,
    limitedBetaAllowed: scorecard.limitedBetaAllowed,
  }
}
