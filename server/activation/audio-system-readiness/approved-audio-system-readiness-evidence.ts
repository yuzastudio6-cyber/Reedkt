import { audioSystemReadinessConfig } from './audio-system-readiness-policy'
import type { ApprovedAudioSystemReadinessEvidence } from './audio-system-readiness-types'

export const approvedAudioSystemReadinessEvidence: ApprovedAudioSystemReadinessEvidence = {
  phase: '36F',
  status: 'completed',
  runId: 'phase36f-20260530T161352',
  phase36ERunId: audioSystemReadinessConfig.phase36ERunId,
  phase36EReportUri: audioSystemReadinessConfig.phase36EReportUri,
  betaScopeManifestUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36f/phase36f-20260530T161352/beta-scope/audio-system-beta-scope.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36f/phase36f-20260530T161352/reports/phase36f-report.json',
  audioSystemInternalFeatureTestingReady: true,
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: true,
    reason: 'Phase 36F verified the audio system internal testing scope; Phase 37A OCR approval workflow may start.',
  },
  blockers: [],
  warnings: [
    'Subjective listening review is recommended before broader internal audio testing.',
    'Phase 36F readiness is limited to internal audio feature testing only.',
    'External beta, paid production, broad media, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, and production remain blocked.',
  ],
}

export function getApprovedAudioSystemReadinessEvidence(): ApprovedAudioSystemReadinessEvidence {
  return {
    ...approvedAudioSystemReadinessEvidence,
    phase37AReadiness: { ...approvedAudioSystemReadinessEvidence.phase37AReadiness },
    blockers: [...approvedAudioSystemReadinessEvidence.blockers],
    warnings: [...approvedAudioSystemReadinessEvidence.warnings],
  }
}
