import type { ApprovedFullVisualVideoPrivateE2eEvidence } from './full-visual-video-private-e2e-types'

export const approvedFullVisualVideoPrivateE2eEvidence: ApprovedFullVisualVideoPrivateE2eEvidence = {
  phase: '45E',
  status: 'verified',
  runId: 'phase45e-20260531T23580',
  sourceInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  canonicalPrivateReviewExportUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4',
  e2eReviewManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/e2e-review-manifest.json',
  ffprobeReviewExportValidationUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/ffprobe-review-export-validation.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45e/phase45e-20260531T23580/reports/phase45e-report.json',
  toolResults: {
    evidencePackage: 'passed',
    ffprobe: 'passed',
  },
  trackAVisualVideoReadiness: {
    readyForInternalPrivateVisualVideoTesting: true,
    reason: 'Phase 45E passed; Track A visual-video is ready for internal private visual-video testing only.',
  },
  blockers: [],
  warnings: [
    'Phase 45E assembles a private visual-video E2E evidence package only.',
    'Final delivery, production, external beta, paid production, broad real media, providers, Revideo, and Track B remain blocked.',
  ],
}

export function getApprovedFullVisualVideoPrivateE2eEvidence(): ApprovedFullVisualVideoPrivateE2eEvidence {
  return {
    ...approvedFullVisualVideoPrivateE2eEvidence,
    toolResults: { ...approvedFullVisualVideoPrivateE2eEvidence.toolResults },
    trackAVisualVideoReadiness: { ...approvedFullVisualVideoPrivateE2eEvidence.trackAVisualVideoReadiness },
    blockers: [...approvedFullVisualVideoPrivateE2eEvidence.blockers],
    warnings: [...approvedFullVisualVideoPrivateE2eEvidence.warnings],
  }
}
