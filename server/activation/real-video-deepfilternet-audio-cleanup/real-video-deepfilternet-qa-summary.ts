import type { RealVideoDeepFilterNetExecutionReport, RealVideoDeepFilterNetQaGate } from './real-video-deepfilternet-audio-cleanup-types'

export function expectedRealVideoDeepFilterNetQaGateIds(): RealVideoDeepFilterNetQaGate['gateId'][] {
  return [
    'source_integrity',
    'plan_snapshot_integrity',
    'model_artifacts',
    'audio_extraction',
    'deepfilternet_cleanup',
    'audio_safety_metrics',
    'review_preview',
    'artifact_privacy',
    'blocked_features',
  ]
}

export function summarizeRealVideoDeepFilterNetQa(report?: RealVideoDeepFilterNetExecutionReport): {
  status: 'passed' | 'warning' | 'blocked'
  gates: RealVideoDeepFilterNetQaGate[]
  blockers: string[]
  warnings: string[]
} {
  if (!report) {
    return {
      status: 'blocked',
      gates: expectedRealVideoDeepFilterNetQaGateIds().map((gateId) => ({
        gateId,
        status: 'blocked',
        summary: 'Phase 36D runtime execution report is missing.',
      })),
      blockers: ['Phase 36D runtime execution report is missing.'],
      warnings: [],
    }
  }
  return report.qa
}
