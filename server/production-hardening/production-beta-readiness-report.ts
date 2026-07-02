import { buildBetaReadinessReport } from '../beta-readiness'
import {
  SCOPED_BLOCKER_FORWARD_PROGRESS_POLICY,
  defaultAllowedForwardProgressScopes,
} from '../beta-readiness/scoped-blocker-forward-progress-policy'
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
  const securityReport = buildSecurityReviewReport()
  const costSummary = buildCostControlSummary()
  const betaReport = buildBetaReadinessReport({ e2eDryRunPassed: options.e2eDryRunPassed ?? true })
  const launchBlockers = classifyProductionLaunchBlockers({
    readinessReport,
    modelWeightsApproved: false,
    launchCoreToolsReady: false,
    ffmpegLgplReviewed: false,
    renderReadinessApproved: false,
    revideoRequested: false,
    idempotencyGatesPresent: true,
    approvedSnapshotGatesPresent: true,
    costControlsPresent: Boolean(costSummary),
    concurrencyLimitsPresent: true,
    retentionDeletionPolicyPresent: true,
    auditLoggingPolicyPresent: true,
    incidentRunbookExists: options.incidentRunbookExists ?? true,
    finalE2EDryRunPassed: options.e2eDryRunPassed ?? true,
    productionDeploymentApproved: false,
  })
  const blockers = [...launchBlockers.hardBlockers, ...securityReport.blockers, ...betaReport.blockers]
  const warnings = [...launchBlockers.warnings, ...securityReport.warnings, ...betaReport.warnings]
  const checks = buildChecks([...new Set(blockers)], [...new Set(warnings)])
  const scorecard = computeProductionReadinessScorecard(checks)
  const blockedActionScope = buildBlockedActionScope(scorecard.limitedBetaAllowed)

  return {
    reportId: `production-hardening-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    overallStatus: 'blocked',
    categories: productionHardeningCategories,
    scorecard,
    blockerForwardProgressPolicy: SCOPED_BLOCKER_FORWARD_PROGRESS_POLICY,
    safeBlockerReductionAllowed: true,
    blockedActionScope,
    allowedForwardProgressScopes: [
      ...defaultAllowedForwardProgressScopes(),
      'security_privacy_review',
    ],
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
      'Keep production_ready and external beta blocked only for their named unsafe launch/runtime actions until human-run deployment, readiness, model/license, security, cost, and legal approvals pass.',
      'Continue safe blocker-reduction lanes: source review, local dependency proof, bounded command/import/container proof, diagnostics, QA packets, deployment preflights, owner approvals, and rollback/monitoring/support planning.',
      'Run the M16B E2E dry-run suite and M17 static smokes before internal testing.',
      'Do not process real user media or create public delivery links until storage/privacy/share policy is approved.',
    ],
    productionReadyAllowed: false,
    limitedBetaAllowed: scorecard.limitedBetaAllowed,
  }
}

function buildBlockedActionScope(limitedBetaAllowed: boolean): string[] {
  const blockedActions = new Set<string>()
  if (!limitedBetaAllowed) blockedActions.add('external_beta_launch')
  blockedActions.add('real_user_media_beta')
  blockedActions.add('paid_production_launch')
  blockedActions.add('production_deployment')
  blockedActions.add('production_runtime_execution')
  blockedActions.add('public_artifact_delivery')
  return [...blockedActions]
}
