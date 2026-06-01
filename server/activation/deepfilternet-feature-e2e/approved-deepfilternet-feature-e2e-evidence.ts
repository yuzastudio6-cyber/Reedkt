import { deepFilterNetFeatureE2EConfig } from './deepfilternet-feature-e2e-policy'
import type { ApprovedDeepFilterNetFeatureE2EEvidence } from './deepfilternet-feature-e2e-types'

export const approvedDeepFilterNetFeatureE2EEvidence: ApprovedDeepFilterNetFeatureE2EEvidence = {
  phase: '36E',
  status: 'completed',
  runId: 'phase36e-20260530T152327',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:26aea2fc373322996430e9c677c5661e814777b2fe44714d508f3cdf50dd1e93',
  runtimeImageDigest: 'sha256:26aea2fc373322996430e9c677c5661e814777b2fe44714d508f3cdf50dd1e93',
  cloudRunJobName: 'reeditpro-staging-deepfilternet-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-hk6jm',
  sourceInputVideo: deepFilterNetFeatureE2EConfig.approvedInputVideo,
  referencePhase31Audio: deepFilterNetFeatureE2EConfig.referencePhase31Audio,
  planSnapshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36e/phase36e-20260530T152327/plan/approved-plan-snapshot.json',
  cleanedAudioUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36e/phase36e-20260530T152327/audio/deepfilternet-cleaned.wav',
  privateReviewPreviewUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-audio-ai/phase36e/phase36e-20260530T152327/review/deepfilternet-audio-feature-review.mp4',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36e/phase36e-20260530T152327/reports/phase36e-report.json',
  toolId: 'deepfilternet',
  toolVersion: 'v0.5.6',
  artifactGcsPath: deepFilterNetFeatureE2EConfig.artifactGcsPath,
  cliSha256: deepFilterNetFeatureE2EConfig.cliSha256,
  modelArchiveSha256: deepFilterNetFeatureE2EConfig.modelArchiveSha256,
  aggregateSha256: deepFilterNetFeatureE2EConfig.aggregateSha256,
  deepFilterNetFeatureE2ECompleted: true,
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: true,
    reason: 'Phase 36E completed the private DeepFilterNet audio feature E2E gate; Phase 37A OCR approval workflow may start.',
  },
  blockers: [],
  warnings: [
    'Phase 36E used one controlled Phase 32 private export only and did not process IMG_6024.MOV.',
    'Subjective listening review is recommended before broader internal audio review.',
    'Production, external beta, broad media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, and final delivery remain blocked.',
  ],
}

export function getApprovedDeepFilterNetFeatureE2EEvidence(): ApprovedDeepFilterNetFeatureE2EEvidence {
  return {
    ...approvedDeepFilterNetFeatureE2EEvidence,
    phase37AReadiness: { ...approvedDeepFilterNetFeatureE2EEvidence.phase37AReadiness },
    blockers: [...approvedDeepFilterNetFeatureE2EEvidence.blockers],
    warnings: [...approvedDeepFilterNetFeatureE2EEvidence.warnings],
  }
}
