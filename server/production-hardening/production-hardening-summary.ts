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
    report.productionReadyAllowed
      ? 'Production is allowed only while the named owner approvals, billing/audit, privacy, and ops gates remain satisfied.'
      : 'Production/external beta remains blocked until human-run approvals pass.',
  ].join('\n')
}
