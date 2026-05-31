import type { ApprovedOpenTimelineIoEvidence } from './opentimelineio-validation-types'

export const approvedOpenTimelineIoEvidence: ApprovedOpenTimelineIoEvidence = {
  phase: '45C',
  status: 'verified',
  runId: 'phase45c-20260531T20404',
  sourceInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  phase45APreview: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  phase45BPreview: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4',
  otioTimelineUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45c/phase45c-20260531T20404/reports/phase45c-report.json',
  toolResults: {
    opentimelineio: 'passed',
    metadataValidation: 'passed',
  },
  phase45DReadiness: {
    readyForFfmpegFfprobeFinalRenderHardening: true,
    reason: 'Phase 45C passed; Phase 45D may start FFmpeg/FFprobe final render/export hardening only.',
  },
  blockers: [],
  warnings: [
    'Phase 45C validates timeline metadata only.',
    'No media processing, final delivery, or production/beta unlock is implied.',
  ],
}

export function getApprovedOpenTimelineIoEvidence(): ApprovedOpenTimelineIoEvidence {
  return {
    ...approvedOpenTimelineIoEvidence,
    toolResults: { ...approvedOpenTimelineIoEvidence.toolResults },
    phase45DReadiness: { ...approvedOpenTimelineIoEvidence.phase45DReadiness },
    blockers: [...approvedOpenTimelineIoEvidence.blockers],
    warnings: [...approvedOpenTimelineIoEvidence.warnings],
  }
}
