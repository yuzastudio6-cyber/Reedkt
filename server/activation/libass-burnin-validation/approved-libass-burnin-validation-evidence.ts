import type { ApprovedLibassBurninEvidence } from './libass-burnin-validation-types'

export const approvedLibassBurninEvidence: ApprovedLibassBurninEvidence = {
  phase: '45A',
  status: 'verified',
  runId: 'phase45a-20260531T19033',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation@sha256:aaf8b0095354511bc4a77654b8291ac66c913349781a8baca243aa176aa61438',
  runtimeImageDigest: 'sha256:aaf8b0095354511bc4a77654b8291ac66c913349781a8baca243aa176aa61438',
  cloudRunJobName: 'reeditpro-staging-libass-burnin-validation-job',
  cloudRunExecutionId: 'reeditpro-staging-libass-burnin-validation-job-2g4zq',
  sourceInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  captionSource: 'gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass',
  previewUri: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json',
  toolResults: {
    ffmpeg: 'passed',
    ffprobe: 'passed',
    libass: 'passed',
  },
  phase45BReadiness: {
    readyForRemotionRenderValidation: true,
    reason: 'Phase 45A passed; Phase 45B may start Remotion render validation only.',
  },
  blockers: [],
  warnings: [
    'Phase 45A creates a bounded private caption burn-in preview only.',
    'No final delivery or production/beta unlock is implied.',
  ],
}

export function getApprovedLibassBurninEvidence(): ApprovedLibassBurninEvidence {
  return {
    ...approvedLibassBurninEvidence,
    toolResults: { ...approvedLibassBurninEvidence.toolResults },
    phase45BReadiness: { ...approvedLibassBurninEvidence.phase45BReadiness },
    blockers: [...approvedLibassBurninEvidence.blockers],
    warnings: [...approvedLibassBurninEvidence.warnings],
  }
}
