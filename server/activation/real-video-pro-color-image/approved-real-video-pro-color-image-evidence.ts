import type { ApprovedRealVideoProColorImageEvidence } from './real-video-pro-color-image-types'

export const approvedRealVideoProColorImageEvidence: ApprovedRealVideoProColorImageEvidence = {
  phase: '40C',
  status: 'verified',
  runId: 'phase40c-20260531T11504',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:74f00af895620be65be764cfbdc459c7bc0b92c50340d704c9480a5bdf1d48fe',
  runtimeImageDigest: 'sha256:74f00af895620be65be764cfbdc459c7bc0b92c50340d704c9480a5bdf1d48fe',
  cloudRunJobName: 'reeditpro-staging-pro-color-image-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-xzz4f',
  sourceInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sample: {
    timestampsSeconds: [0.5, 7.7335, 14.5],
    width: 768,
    height: 432,
    frameCount: 3,
  },
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40c/phase40c-20260531T11504/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40c/phase40c-20260531T11504/reports/phase40c-report.json',
  toolResults: {
    ffprobe: 'passed',
    ffmpeg: 'passed',
    opencolorio: 'passed',
    openimageio: 'passed',
    kornia: 'passed',
  },
  phase40DReadiness: {
    readyForProColorImagePrivateFeatureE2EReadinessGate: true,
    reason: 'Phase 40C verified FFprobe, FFmpeg, OpenColorIO, OpenImageIO, and Kornia on bounded real-video-derived frames only; Phase 40D may plan the private feature E2E readiness gate.',
  },
  blockers: [],
  warnings: [
    'Phase 40C processed bounded real-video-derived frames only.',
    'No final delivery or full-video color processing was created.',
    'Subjective visual review is recommended before broader use.',
  ],
}

export function getApprovedRealVideoProColorImageEvidence(): ApprovedRealVideoProColorImageEvidence {
  return {
    ...approvedRealVideoProColorImageEvidence,
    sample: approvedRealVideoProColorImageEvidence.sample ? { ...approvedRealVideoProColorImageEvidence.sample, timestampsSeconds: [...approvedRealVideoProColorImageEvidence.sample.timestampsSeconds] } : undefined,
    toolResults: { ...approvedRealVideoProColorImageEvidence.toolResults },
    phase40DReadiness: { ...approvedRealVideoProColorImageEvidence.phase40DReadiness },
    blockers: [...approvedRealVideoProColorImageEvidence.blockers],
    warnings: [...approvedRealVideoProColorImageEvidence.warnings],
  }
}
