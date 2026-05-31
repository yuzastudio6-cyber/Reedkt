import type { OpenTimelineIoExecutionReport, OpenTimelineIoQaSummary } from './opentimelineio-validation-types'

export function buildOpenTimelineIoQaSummary(executionReport?: OpenTimelineIoExecutionReport): OpenTimelineIoQaSummary {
  if (!executionReport) {
    return {
      status: 'blocked',
      gates: [],
      blockers: ['Phase 45C OpenTimelineIO validation execution report is missing.'],
      warnings: ['Phase45D FFmpeg/FFprobe final render/export hardening remains blocked until Phase 45C passes.'],
    }
  }
  return executionReport.qa
}
