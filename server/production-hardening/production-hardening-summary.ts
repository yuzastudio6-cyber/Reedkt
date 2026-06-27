import { buildProductionHardeningReport } from './production-beta-readiness-report'

export function buildProductionHardeningSummary(): string {
  const report = buildProductionHardeningReport()
  return [
    `Production hardening report: ${report.overallStatus}`,
    `Readiness score: ${report.scorecard.readinessScore}`,
    `Blockers: ${report.blockers.length}`,
    `Warnings: ${report.warnings.length}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `Limited beta allowed: ${report.limitedBetaAllowed}`,
    `Safe blocker reduction allowed: ${report.safeBlockerReductionAllowed}`,
    `Blocked action scope: ${report.blockedActionScope.join(', ') || 'none'}`,
    `Allowed forward progress: ${report.allowedForwardProgressScopes.join(', ') || 'none'}`,
    'Production/external beta remains blocked for named unsafe actions until human-run approvals pass; safe source review, local proof, diagnostics, QA, deployment preflight, owner approval, and rollback/monitoring planning can continue.',
  ].join('\n')
}
