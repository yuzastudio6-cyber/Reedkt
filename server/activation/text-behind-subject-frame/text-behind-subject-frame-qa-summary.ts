import type { TextBehindSubjectFrameExecutionReport } from './text-behind-subject-frame-types'

export function summarizeTextBehindSubjectFrameQa(report?: TextBehindSubjectFrameExecutionReport) {
  if (!report) return { status: 'missing', gates: [], blockers: ['Phase 33E QA report is missing.'], warnings: [] }
  return {
    status: report.qa.status,
    gates: report.qa.gates,
    blockers: report.qa.blockers,
    warnings: report.qa.warnings,
  }
}
