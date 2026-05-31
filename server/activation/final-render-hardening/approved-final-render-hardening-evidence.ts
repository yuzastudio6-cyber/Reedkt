import type { ApprovedFinalRenderHardeningEvidence } from './final-render-hardening-types'

export const approvedFinalRenderHardeningEvidence: ApprovedFinalRenderHardeningEvidence = {
  phase: '45D',
  status: 'verified',
  runId: 'phase45d-20260531T22235',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-final-render-hardening@sha256:f2b63b0da0889b56539ddbc417643a82d05f3f3054d40f6b01f3def8a252435f',
  runtimeImageDigest: 'sha256:f2b63b0da0889b56539ddbc417643a82d05f3f3054d40f6b01f3def8a252435f',
  cloudRunJobName: 'reeditpro-staging-final-render-hardening-job',
  cloudRunExecutionId: 'reeditpro-staging-final-render-hardening-job-9m9tl',
  sourceInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  phase45APreview: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  phase45BPreview: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4',
  phase45COtio: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json',
  hardenedReviewExportUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4',
  ffprobeValidationUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45d/phase45d-20260531T22235/export/ffprobe-export-validation.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45d/phase45d-20260531T22235/reports/phase45d-report.json',
  toolResults: {
    ffmpeg: 'passed',
    ffprobe: 'passed',
  },
  phase45EReadiness: {
    readyForFullVisualVideoPrivateE2E: true,
    reason: 'Phase 45D passed; Phase 45E may start full visual-video private E2E only.',
  },
  blockers: [],
  warnings: [
    'Phase 45D creates one bounded private hardened review export only.',
    'Final delivery, production, external beta, paid production, broad real media, providers, Revideo, and Track B remain blocked.',
  ],
}

export function getApprovedFinalRenderHardeningEvidence(): ApprovedFinalRenderHardeningEvidence {
  return {
    ...approvedFinalRenderHardeningEvidence,
    toolResults: { ...approvedFinalRenderHardeningEvidence.toolResults },
    phase45EReadiness: { ...approvedFinalRenderHardeningEvidence.phase45EReadiness },
    blockers: [...approvedFinalRenderHardeningEvidence.blockers],
    warnings: [...approvedFinalRenderHardeningEvidence.warnings],
  }
}
