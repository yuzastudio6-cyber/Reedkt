import { buildBetaReadinessReport, type BetaReadinessChecklistItem } from '../beta-readiness'
import { buildCostControlSummary } from '../cost-controls'
import { buildSecurityReviewReport, type BuildSecurityReviewReportOptions, type SecurityReviewReport } from '../security-review'
import { buildProductionReadinessReport, type ProductionReadinessReport } from '../workers/readiness-validation'
import { classifyProductionLaunchBlockers, type ClassifyProductionLaunchBlockersOptions } from './production-launch-blocker-policy'
import { productionHardeningCategories } from './production-hardening-policy'
import { computeProductionReadinessScorecard } from './production-readiness-scorecard'
import { productionRiskRegister } from './production-risk-register'
import type { ProductionHardeningCheck, ProductionHardeningReport } from './production-hardening-types'

export interface BuildProductionHardeningReportOptions {
  readinessReport?: ProductionReadinessReport
  securityReport?: SecurityReviewReport
  securityReviewOptions?: BuildSecurityReviewReportOptions
  e2eDryRunPassed?: boolean
  incidentRunbookExists?: boolean
  productionReadinessBlocked?: boolean
  modelWeightsApproved?: boolean
  launchCoreToolsReady?: boolean
  ffmpegLgplReviewed?: boolean
  renderReadinessApproved?: boolean
  revideoRequested?: boolean
  idempotencyGatesPresent?: boolean
  approvedSnapshotGatesPresent?: boolean
  costControlsApproved?: boolean
  concurrencyLimitsPresent?: boolean
  retentionDeletionPolicyPresent?: boolean
  auditLoggingPolicyPresent?: boolean
  blockingQAFailuresPresent?: boolean
  productionDeploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  licenseModelWeightReviewApproved?: boolean
  privateMediaApproval?: boolean
  artifactPrivacyEvidence?: boolean
  billingLedgerPersistenceApproved?: boolean
  observabilityApproved?: boolean
  legalApproval?: boolean
  betaChecklist?: BetaReadinessChecklistItem[]
}

function buildChecks(blockers: string[], warnings: string[]): ProductionHardeningCheck[] {
  const baseChecks: ProductionHardeningCheck[] = productionHardeningCategories.map((category) => ({
    id: `${category}_static_policy_present`,
    category,
    status: 'passed',
    message: `${category} static policy/report artifact exists.`,
    manualReviewRequired: category !== 'observability' && category !== 'logging_sanitization',
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
  const securityReport = options.securityReport ?? buildSecurityReviewReport(options.securityReviewOptions)
  const costSummary = buildCostControlSummary()
  const productionReadinessBlocked = options.productionReadinessBlocked ?? true
  const launchBlockerOptions: ClassifyProductionLaunchBlockersOptions = {
    readinessReport,
    modelWeightsApproved: options.modelWeightsApproved ?? false,
    launchCoreToolsReady: options.launchCoreToolsReady ?? false,
    ffmpegLgplReviewed: options.ffmpegLgplReviewed ?? false,
    renderReadinessApproved: options.renderReadinessApproved ?? false,
    revideoRequested: options.revideoRequested ?? false,
    idempotencyGatesPresent: options.idempotencyGatesPresent ?? true,
    approvedSnapshotGatesPresent: options.approvedSnapshotGatesPresent ?? true,
    costControlsPresent: options.costControlsApproved ?? Boolean(costSummary),
    concurrencyLimitsPresent: options.concurrencyLimitsPresent ?? true,
    retentionDeletionPolicyPresent: options.retentionDeletionPolicyPresent ?? true,
    auditLoggingPolicyPresent: options.auditLoggingPolicyPresent ?? true,
    incidentRunbookExists: options.incidentRunbookExists ?? true,
    finalE2EDryRunPassed: options.e2eDryRunPassed ?? true,
    blockingQAFailuresPresent: options.blockingQAFailuresPresent,
    productionDeploymentApproved: options.productionDeploymentApproved ?? false,
  }
  const launchBlockers = classifyProductionLaunchBlockers(launchBlockerOptions)
  const betaReport = buildBetaReadinessReport({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: true,
    costDocsExist: true,
    productionReadinessBlocked,
    approvedPlanSnapshotGatePresent: options.approvedSnapshotGatesPresent ?? true,
    creditEstimateGatePresent: true,
    creditReservationGatePresent: true,
    idempotencyGatePresent: options.idempotencyGatesPresent ?? true,
    rawPromptStorageBlocked: true,
    secretScrubbingEnabled: true,
    signedUrlSourceTruthBlocked: true,
    deploymentApproved: options.productionDeploymentApproved,
    securityApproved: options.securityApproved,
    storageApproved: options.storageApproved,
    modelLicensesApproved: options.modelLicensesApproved,
    licenseModelWeightReviewApproved: options.licenseModelWeightReviewApproved,
    privateMediaApproval: options.privateMediaApproval,
    artifactPrivacyEvidence: options.artifactPrivacyEvidence,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    costControlsApproved: options.costControlsApproved,
    incidentRunbookApproved: options.incidentRunbookExists,
    observabilityApproved: options.observabilityApproved,
    legalApproval: options.legalApproval,
    checklist: options.betaChecklist,
  })
  const blockers = [...launchBlockers.hardBlockers, ...securityReport.blockers, ...betaReport.blockers]
  const warnings = [...launchBlockers.warnings, ...securityReport.warnings, ...betaReport.warnings]
  const checks = buildChecks([...new Set(blockers)], [...new Set(warnings)])
  const scorecard = computeProductionReadinessScorecard(checks)
  const blockersUnique = [...new Set(blockers)]
  const warningsUnique = [...new Set(warnings)]
  const manualReviewItems = [
    ...new Set([
      ...launchBlockers.manualReviewItems,
      ...(scorecard.manualReviewCount > 0 ? ['Mandatory launch approvals remain incomplete.'] : []),
    ]),
  ]
  const limitedBetaAllowed = blockersUnique.length === 0 && manualReviewItems.length === 0 && betaReport.goNoGo.externalBetaAllowed
  const productionReadyAllowed = limitedBetaAllowed && betaReport.productionReady && scorecard.productionReadyAllowed
  const overallStatus = productionReadyAllowed
    ? 'production_ready'
    : limitedBetaAllowed
      ? 'ready_for_limited_beta'
      : blockersUnique.length
        ? 'blocked'
        : betaReport.goNoGo.internalDryRunTestingAllowed
          ? 'ready_for_internal_testing'
          : 'warning'

  return {
    reportId: `production-hardening-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    overallStatus,
    categories: productionHardeningCategories,
    scorecard: {
      ...scorecard,
      productionReadyAllowed,
      limitedBetaAllowed,
    },
    blockers: blockersUnique,
    warnings: warningsUnique,
    passedChecks: checks.filter((check) => check.status === 'passed'),
    failedChecks: checks.filter((check) => check.status === 'blocked'),
    manualReviewItems,
    riskRegister: productionRiskRegister,
    nextActions: [
      'Graduate production_ready and external beta only through evidence-driven deployment, readiness, model/license, security, cost, storage, billing, observability, and legal gates.',
      'Run the M16B E2E dry-run suite and M17 static smokes before internal testing.',
      'Do not process real user media or create public delivery links until storage/privacy/share policy is approved.',
    ],
    productionReadyAllowed,
    limitedBetaAllowed,
  }
}
