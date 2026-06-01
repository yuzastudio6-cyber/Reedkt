import { realVideoDeepFilterNetConfig } from './real-video-deepfilternet-audio-cleanup-policy'
import type { ApprovedRealVideoDeepFilterNetEvidence } from './real-video-deepfilternet-audio-cleanup-types'

export const approvedRealVideoDeepFilterNetEvidence: ApprovedRealVideoDeepFilterNetEvidence = {
  phase: '36D',
  status: 'completed',
  runId: 'phase36d-20260530T141724',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:053a35cdbe3cac2d73be83fa19696b65b5d492b526d57e00c87d4e48506b09c4',
  runtimeImageDigest: 'sha256:053a35cdbe3cac2d73be83fa19696b65b5d492b526d57e00c87d4e48506b09c4',
  cloudRunJobName: 'reeditpro-staging-deepfilternet-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-gqbkz',
  sourceInputVideo: realVideoDeepFilterNetConfig.approvedInputVideo,
  referencePhase31Audio: realVideoDeepFilterNetConfig.referencePhase31Audio,
  planSnapshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36d/phase36d-20260530T141724/plan/approved-plan-snapshot.json',
  cleanedAudioUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36d/phase36d-20260530T141724/audio/deepfilternet-cleaned.wav',
  privateReviewPreviewUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-audio-ai/phase36d/phase36d-20260530T141724/review/deepfilternet-audio-cleaned-preview.mp4',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36d/phase36d-20260530T141724/reports/phase36d-report.json',
  toolId: 'deepfilternet',
  toolVersion: 'v0.5.6',
  artifactGcsPath: realVideoDeepFilterNetConfig.artifactGcsPath,
  cliSha256: realVideoDeepFilterNetConfig.cliSha256,
  modelArchiveSha256: realVideoDeepFilterNetConfig.modelArchiveSha256,
  aggregateSha256: realVideoDeepFilterNetConfig.aggregateSha256,
  realMediaAudioAiCleanupCompleted: true,
  phase36EReadiness: {
    readyForDeepFilterNetPrivateAudioFeatureE2E: true,
    reason: 'Phase 36D completed one controlled real-video DeepFilterNet audio cleanup sample; Phase 36E may plan private audio feature E2E only.',
  },
  blockers: [],
  warnings: [
    'Phase 36D used one controlled Phase 32 private export only.',
    'Subjective listening review is recommended before broader internal audio review.',
    'Production, external beta, broad media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, and final delivery remain blocked.',
  ],
}

export function getApprovedRealVideoDeepFilterNetEvidence(): ApprovedRealVideoDeepFilterNetEvidence {
  return {
    ...approvedRealVideoDeepFilterNetEvidence,
    phase36EReadiness: { ...approvedRealVideoDeepFilterNetEvidence.phase36EReadiness },
    blockers: [...approvedRealVideoDeepFilterNetEvidence.blockers],
    warnings: [...approvedRealVideoDeepFilterNetEvidence.warnings],
  }
}
