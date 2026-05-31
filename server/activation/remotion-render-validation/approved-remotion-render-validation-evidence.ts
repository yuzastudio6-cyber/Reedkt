import type { ApprovedRemotionRenderEvidence } from './remotion-render-validation-types'

export const approvedRemotionRenderEvidence: ApprovedRemotionRenderEvidence = {
  phase: '45B',
  status: 'verified',
  runId: 'phase45b-20260531T19552',
  runtimeImage:
    'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-remotion-render-validation@sha256:27fbb6a509002334b827a7067d65af044cdbb58b4bada84fb3ad85b20e821baa',
  runtimeImageDigest: 'sha256:27fbb6a509002334b827a7067d65af044cdbb58b4bada84fb3ad85b20e821baa',
  cloudRunJobName: 'reeditpro-staging-remotion-render-validation-job',
  cloudRunExecutionId: 'reeditpro-staging-remotion-render-validation-job-l7tpj',
  sourceInputVideo:
    'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  phase45APreview:
    'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  remotionPreviewUri:
    'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4',
  qaReportUri:
    'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/reports/phase45b-report.json',
  toolResults: {
    remotion: 'passed',
    ffprobe: 'passed',
  },
  phase45CReadiness: {
    readyForOpenTimelineIoValidation: true,
    reason: 'Phase 45B passed; Phase 45C may start OpenTimelineIO timeline validation only.',
  },
  blockers: [],
  warnings: [
    'Phase 45B creates a bounded private Remotion render preview only.',
    'No final delivery or production/beta unlock is implied.',
  ],
}

export function getApprovedRemotionRenderEvidence(): ApprovedRemotionRenderEvidence {
  return {
    ...approvedRemotionRenderEvidence,
    toolResults: { ...approvedRemotionRenderEvidence.toolResults },
    phase45CReadiness: { ...approvedRemotionRenderEvidence.phase45CReadiness },
    blockers: [...approvedRemotionRenderEvidence.blockers],
    warnings: [...approvedRemotionRenderEvidence.warnings],
  }
}
