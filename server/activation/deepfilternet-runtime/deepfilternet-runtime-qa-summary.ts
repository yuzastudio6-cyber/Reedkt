import type { DeepFilterNetRuntimeExecutionReport, DeepFilterNetRuntimeQaGate } from './deepfilternet-runtime-types'

export function summarizeDeepFilterNetRuntimeQa(report?: DeepFilterNetRuntimeExecutionReport): {
  status: 'passed' | 'warning' | 'blocked'
  gates: DeepFilterNetRuntimeQaGate[]
  blockers: string[]
  warnings: string[]
} {
  if (!report) {
    return {
      status: 'blocked',
      gates: expectedDeepFilterNetRuntimeQaGateIds().map((gateId) => ({
        gateId,
        status: 'blocked',
        summary: 'Runtime execution report is missing.',
      })),
      blockers: ['DeepFilterNet runtime execution report is missing.'],
      warnings: [],
    }
  }
  return report.qa
}

export function expectedDeepFilterNetRuntimeQaGateIds(): DeepFilterNetRuntimeQaGate['gateId'][] {
  return [
    'model_artifacts',
    'runtime_integrity',
    'fixture_integrity',
    'enhanced_audio_artifacts',
    'audio_safety_metrics',
    'artifact_privacy',
    'blocked_features',
  ]
}
