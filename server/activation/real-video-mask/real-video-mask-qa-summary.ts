import type { RealVideoBiRefNetFrameMaskReport, RealVideoMaskQaGate } from './real-video-mask-types'

export function buildRealVideoMaskQaSummary(report: RealVideoBiRefNetFrameMaskReport | undefined): {
  status: 'passed' | 'warning' | 'blocked' | 'missing'
  gates: RealVideoMaskQaGate[]
  blockers: string[]
  warnings: string[]
} {
  if (!report) return { status: 'missing', gates: [], blockers: ['BiRefNet frame-mask QA report is missing.'], warnings: [] }
  return {
    status: report.qa.status,
    gates: report.qa.gates,
    blockers: report.qa.blockers,
    warnings: report.qa.warnings,
  }
}
