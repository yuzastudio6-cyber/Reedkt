import type { DeepFilterNetFeatureE2EExecutionReport, DeepFilterNetFeatureE2EQaGate } from './deepfilternet-feature-e2e-types'

export function expectedDeepFilterNetFeatureE2EQaGateIds(): DeepFilterNetFeatureE2EQaGate['gateId'][] {
  return [
    'source_integrity',
    'plan_snapshot_integrity',
    'phase36d_evidence',
    'model_artifacts',
    'audio_extraction',
    'deepfilternet_cleanup',
    'audio_safety_metrics',
    'review_preview',
    'artifact_privacy',
    'feature_readiness_evidence',
    'blocked_features',
  ]
}

export function summarizeDeepFilterNetFeatureE2EQa(report?: DeepFilterNetFeatureE2EExecutionReport): {
  status: 'passed' | 'warning' | 'blocked'
  gates: DeepFilterNetFeatureE2EQaGate[]
  blockers: string[]
  warnings: string[]
} {
  if (!report) {
    return {
      status: 'blocked',
      gates: expectedDeepFilterNetFeatureE2EQaGateIds().map((gateId) => ({
        gateId,
        status: 'blocked',
        summary: 'Phase 36E runtime execution report is missing.',
      })),
      blockers: ['Phase 36E runtime execution report is missing.'],
      warnings: [],
    }
  }
  return report.qa
}
