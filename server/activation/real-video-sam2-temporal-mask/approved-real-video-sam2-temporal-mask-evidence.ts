import { realVideoSam2TemporalMaskConfig } from './real-video-sam2-temporal-mask-policy'
import type { ApprovedRealVideoSam2TemporalMaskEvidence } from './real-video-sam2-temporal-mask-types'

export const approvedRealVideoSam2TemporalMaskEvidence: ApprovedRealVideoSam2TemporalMaskEvidence = {
  phase: '35D',
  status: 'verified',
  runId: 'phase35d-20260530T004442',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:b67dbc6d7f4c0f3641363678a750caa7cad8b610dbef2f3e4cbc87375e45c591',
  runtimeImageDigest: 'sha256:b67dbc6d7f4c0f3641363678a750caa7cad8b610dbef2f3e4cbc87375e45c591',
  cloudRunJobName: realVideoSam2TemporalMaskConfig.runtimeJobName,
  cloudRunExecutionId: 'reeditpro-staging-sam2-runtime-job-grfx2',
  sourceVideo: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,
  selectedSegment: {
    startSeconds: 6.9,
    endSeconds: 8.9,
    durationSeconds: 2,
    frameCount: 10,
    width: 768,
    height: 432,
  },
  prompt: {
    source: 'phase33d_mask_bbox',
    type: 'box',
    promptFrameIndex: 4,
    scaledBoundingBox: [42, 109, 767, 431],
  },
  modelId: realVideoSam2TemporalMaskConfig.modelId,
  checkpointSha256: realVideoSam2TemporalMaskConfig.checkpointSha256,
  configSha256: realVideoSam2TemporalMaskConfig.configSha256,
  aggregateSha256: realVideoSam2TemporalMaskConfig.aggregateSha256,
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-20260530T004442/',
  masksPrefix: 'gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-20260530T004442/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35d/phase35d-20260530T004442/reports/phase35d-report.json',
  phase35EReadiness: {
    readyForControlledSegmentTextBehindSubjectPreview: true,
    reason: 'Phase 35D verified SAM2 temporal masks on one approved short real-video segment only; Phase 35E may plan a controlled segment text-behind-subject preview.',
  },
  blockers: [],
  warnings: [
    'One controlled short real-video segment only; full-video temporal QA is not claimed.',
    'Human visual review is required before any broader mask or text-behind-subject scope.',
    'Full-video masks, full-video text-behind-subject, production, beta, broad media, providers, Revideo, FILM, and slow motion remain blocked.',
  ],
}

export function getApprovedRealVideoSam2TemporalMaskEvidence(): ApprovedRealVideoSam2TemporalMaskEvidence {
  return {
    ...approvedRealVideoSam2TemporalMaskEvidence,
    selectedSegment: approvedRealVideoSam2TemporalMaskEvidence.selectedSegment ? { ...approvedRealVideoSam2TemporalMaskEvidence.selectedSegment } : undefined,
    prompt: approvedRealVideoSam2TemporalMaskEvidence.prompt
      ? { ...approvedRealVideoSam2TemporalMaskEvidence.prompt, scaledBoundingBox: [...approvedRealVideoSam2TemporalMaskEvidence.prompt.scaledBoundingBox] }
      : undefined,
    phase35EReadiness: { ...approvedRealVideoSam2TemporalMaskEvidence.phase35EReadiness },
    blockers: [...approvedRealVideoSam2TemporalMaskEvidence.blockers],
    warnings: [...approvedRealVideoSam2TemporalMaskEvidence.warnings],
  }
}
