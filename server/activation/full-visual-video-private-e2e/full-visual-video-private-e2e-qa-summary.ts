import type { FullVisualVideoPrivateE2eExecutionReport, FullVisualVideoPrivateE2eQaSummary } from './full-visual-video-private-e2e-types'

export function buildFullVisualVideoPrivateE2eQaSummary(executionReport?: FullVisualVideoPrivateE2eExecutionReport): FullVisualVideoPrivateE2eQaSummary {
  if (!executionReport) {
    return {
      status: 'blocked',
      gates: [],
      blockers: ['Phase 45E full visual-video private E2E execution report is missing.'],
      warnings: ['Track A visual-video internal private testing remains blocked until Phase 45E passes.'],
    }
  }
  return executionReport.qa
}
