import type { FinalRenderHardeningExecutionReport, FinalRenderHardeningQaSummary } from './final-render-hardening-types'

export function buildFinalRenderHardeningQaSummary(executionReport?: FinalRenderHardeningExecutionReport): FinalRenderHardeningQaSummary {
  if (!executionReport) {
    return {
      status: 'blocked',
      gates: [],
      blockers: ['Phase 45D FFmpeg/FFprobe hardening execution report is missing.'],
      warnings: ['Phase45E full visual-video private E2E remains blocked until Phase 45D passes.'],
    }
  }
  return executionReport.qa
}
