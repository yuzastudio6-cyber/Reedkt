import type {
  ProductionReadinessReport,
  ReadinessValidationStatus,
} from './readiness-validation-types'

const statusOrder: ReadinessValidationStatus[] = [
  'passed',
  'warning',
  'missing',
  'blocked',
  'not_checked',
  'not_installed',
  'future_only',
  'evaluation_only',
  'needs_license_review',
  'needs_model_weight_review',
  'model_weight_missing',
  'model_weight_blocked',
  'pending_manual_review',
  'source_install_review_required',
]

export function summarizeProductionReadinessReport(report: ProductionReadinessReport): string {
  const toolStatusCounts = Object.fromEntries(statusOrder.map((status) => [status, 0])) as Record<ReadinessValidationStatus, number>
  for (const tool of report.toolSummaries) {
    toolStatusCounts[tool.status] += 1
  }

  const workerLines = report.workerSummaries.map((worker) => (
    `- ${worker.workerType}: score=${worker.readinessScore}, productionAllowed=${worker.productionAllowed}, required=${worker.requiredTools.length}, blocked=${worker.blockedTools.length}, modelWeightBlocked=${worker.modelWeightBlockedTools.length}`
  ))

  const blockerLines = report.blockerSummaries
    .slice(0, 12)
    .map((blocker) => `- [${blocker.severity}] ${blocker.message}`)

  return [
    `Production readiness report: ${report.id}`,
    `Mode: ${report.mode}`,
    `Overall status: ${report.overallStatus}`,
    `Workers: ${report.workerSummaries.length}`,
    `Tools: ${report.toolSummaries.length}`,
    `Images: ${report.imageSummaries.length}`,
    `Model-weight blockers: ${report.modelWeightSummaries.filter((summary) => summary.blocksProduction).length}`,
    `Hard blockers: ${report.blockerSummaries.filter((blocker) => blocker.severity === 'hard_blocker').length}`,
    `Warnings: ${report.warnings.length}`,
    '',
    'Tool statuses:',
    ...statusOrder
      .filter((status) => toolStatusCounts[status] > 0)
      .map((status) => `- ${status}: ${toolStatusCounts[status]}`),
    '',
    'Worker summaries:',
    ...workerLines,
    '',
    'Top blockers:',
    ...(blockerLines.length > 0 ? blockerLines : ['- none']),
    '',
    'Next actions:',
    ...report.nextActions.map((action) => `- ${action}`),
  ].join('\n')
}
