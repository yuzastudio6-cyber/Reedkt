import type { ApprovedRealVideoFilmSlowmotionEvidence } from './real-video-film-slowmotion-types'

export const approvedRealVideoFilmSlowmotionEvidence: ApprovedRealVideoFilmSlowmotionEvidence = {
  phase: '38D',
  status: 'blocked',
  runId: 'phase38d-20260531T00414',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:50f94ec6289fbbdbba21ab11e89aed3a846015b6f26180c43da14cee7732f6ac',
  runtimeImageDigest: 'sha256:50f94ec6289fbbdbba21ab11e89aed3a846015b6f26180c43da14cee7732f6ac',
  cloudRunJobName: 'reeditpro-staging-film-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-film-runtime-job-kvrbc',
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
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-20260531T00414/',
  previewPrefix: 'gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-20260531T00414/',
  phase38EReadiness: {
    readyForFilmPrivateFeatureE2EReadinessGate: false,
    reason: 'Phase 38D remains blocked because Cloud Run execution could not complete after a targeted IAM correction; gcloud reauthentication is required before the bounded retry can run.',
  },
  blockers: [
    'Initial Cloud Run execution reeditpro-staging-film-runtime-job-kvrbc failed because the CPU worker lacked storage.objects.get on the approved Phase 38D plan snapshot.',
    'A narrow phase38d-plan-read objectViewer IAM plan was added for the approved Phase 38D generated-assets prefix, but the guarded retry was blocked by gcloud token reauthentication: cannot prompt during non-interactive execution.',
    'No Phase 38D runtime QA report exists yet.',
  ],
  warnings: [
    'Full-video interpolation, final delivery, audio stretch, production, beta, and broad media remain blocked.',
    'The first runtime image was built and pushed, but Phase 38D did not pass QA.',
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
