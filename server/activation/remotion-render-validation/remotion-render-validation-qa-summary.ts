import type { RemotionRenderExecutionReport } from './remotion-render-validation-types'

export function buildRemotionRenderQaSummary(report?: RemotionRenderExecutionReport) {
  if (!report) {
    return {
      status: 'blocked' as const,
      blockers: ['Phase 45B Remotion render validation execution report is missing.'],
      warnings: ['Phase45C OpenTimelineIO timeline validation remains blocked until Phase 45B passes.'],
      reason: 'Missing Phase 45B execution evidence.',
    }
  }
  const blockers = report.qa.blockers
  return {
    status: report.qa.status,
    blockers,
    warnings: report.qa.warnings,
    reason: blockers.length === 0
      ? 'Phase 45B Remotion render validation passed for the bounded private preview sample.'
      : blockers.join('; '),
  }
}
