import type { ApprovedRealVideoFilmSlowmotionEvidence } from './real-video-film-slowmotion-types'

export const approvedRealVideoFilmSlowmotionEvidence: ApprovedRealVideoFilmSlowmotionEvidence = {
  phase: '38D',
  status: 'verified',
  runId: 'phase38d-20260531T00471',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:50f94ec6289fbbdbba21ab11e89aed3a846015b6f26180c43da14cee7732f6ac',
  runtimeImageDigest: 'sha256:50f94ec6289fbbdbba21ab11e89aed3a846015b6f26180c43da14cee7732f6ac',
  cloudRunJobName: 'reeditpro-staging-film-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-film-runtime-job-pmxs7',
  sourceVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  selectedSegment: {
    startSeconds: 6.9835,
    endSeconds: 8.4835,
    durationSeconds: 1.5,
    sourceFrameCount: 9,
    width: 512,
    height: 288,
    outputFrameCount: 17,
  },
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-20260531T00471/',
  previewPrefix: 'gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-20260531T00471/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38d/phase38d-20260531T00471/reports/phase38d-report.json',
  phase38EReadiness: {
    readyForFilmPrivateFeatureE2EReadinessGate: true,
    reason: 'Phase 38D verified one controlled selected real-video FILM slow-motion sample only; Phase 38E may plan a private FILM feature E2E readiness gate.',
  },
  blockers: [],
  warnings: [
    'Selected real-video segment only; no full-video interpolation or audio stretch executed.',
    'Very short selected segment only; human visual review is required before broader use.',
    'Full-video interpolation, final delivery, audio stretch, production, beta, and broad media remain blocked.',
  ],
}

export function getApprovedRealVideoFilmSlowmotionEvidence(): ApprovedRealVideoFilmSlowmotionEvidence {
  return {
    ...approvedRealVideoFilmSlowmotionEvidence,
    selectedSegment: approvedRealVideoFilmSlowmotionEvidence.selectedSegment ? { ...approvedRealVideoFilmSlowmotionEvidence.selectedSegment } : undefined,
    phase38EReadiness: { ...approvedRealVideoFilmSlowmotionEvidence.phase38EReadiness },
    blockers: [...approvedRealVideoFilmSlowmotionEvidence.blockers],
    warnings: [...approvedRealVideoFilmSlowmotionEvidence.warnings],
  }
}
