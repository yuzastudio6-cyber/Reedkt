import type { LibassBurninExecutionReport } from './libass-burnin-validation-types'

export function buildLibassBurninQaSummary(report?: LibassBurninExecutionReport) {
  if (!report) {
    return {
      status: 'blocked' as const,
      blockers: ['Phase 45A libass caption burn-in validation execution report is missing.'],
      warnings: ['Phase45B Remotion render validation remains blocked until Phase 45A passes.'],
      reason: 'Missing Phase 45A execution evidence.',
    }
  }
  const blockers = report.qa.blockers
  return {
    status: report.qa.status,
    blockers,
    warnings: report.qa.warnings,
    reason: blockers.length === 0
      ? 'Phase 45A libass burn-in validation passed for the bounded private preview sample.'
      : blockers.join('; '),
  }
}
