import type { ApprovedProColorImageFeatureE2EEvidence } from './pro-color-image-feature-e2e-types'

export const approvedProColorImageFeatureE2EEvidence: ApprovedProColorImageFeatureE2EEvidence = {
  phase: '40D',
  status: 'verified',
  runId: 'phase40d-20260531T12493',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:4be2d97fc6e4dcad94aeaad4421408532ca1e5075fc3fb2bf430b380ac7e869d',
  runtimeImageDigest: 'sha256:4be2d97fc6e4dcad94aeaad4421408532ca1e5075fc3fb2bf430b380ac7e869d',
  cloudRunJobName: 'reeditpro-staging-pro-color-image-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-th6pr',
  sourceInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  planSnapshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40d/phase40d-20260531T12493/plan/approved-plan-snapshot.json',
  reviewManifestUri: 'gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-20260531T12493/review/private-review-manifest.json',
  contactSheetUri: 'gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-20260531T12493/contact-sheet/pro-color-image-feature-contact-sheet.png',
  sample: {
    timestampsSeconds: [0.5, 7.7335, 14.5],
    width: 768,
    height: 432,
    frameCount: 3,
  },
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40d/phase40d-20260531T12493/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40d/phase40d-20260531T12493/reports/phase40d-report.json',
  toolResults: {
    ffprobe: 'passed',
    ffmpeg: 'passed',
    opencolorio: 'passed',
    openimageio: 'passed',
    kornia: 'passed',
  },
  featureReadiness: {
    readyForInternalProColorImageFeatureTesting: true,
    reason: 'Phase 40D private pro color/image feature E2E QA passed for bounded approved real-video-derived frames.',
  },
  phase45AReadiness: {
    readyForLibassCaptionBurnInValidation: true,
    reason: 'Phase 40D passed; Phase 45A may start libass caption burn-in validation only.',
  },
  blockers: [],
  warnings: [
    'Phase 40D processed bounded real-video-derived frames only.',
    'No final delivery or full-video color processing was created.',
    'Private feature E2E sample only; no full-video color QA or final delivery.',
    'Subjective visual review is recommended before broader internal use.',
  ],
}

export function getApprovedProColorImageFeatureE2EEvidence(): ApprovedProColorImageFeatureE2EEvidence {
  return {
    ...approvedProColorImageFeatureE2EEvidence,
    sample: approvedProColorImageFeatureE2EEvidence.sample ? { ...approvedProColorImageFeatureE2EEvidence.sample, timestampsSeconds: [...approvedProColorImageFeatureE2EEvidence.sample.timestampsSeconds] } : undefined,
    toolResults: { ...approvedProColorImageFeatureE2EEvidence.toolResults },
    featureReadiness: { ...approvedProColorImageFeatureE2EEvidence.featureReadiness },
    phase45AReadiness: { ...approvedProColorImageFeatureE2EEvidence.phase45AReadiness },
    blockers: [...approvedProColorImageFeatureE2EEvidence.blockers],
    warnings: [...approvedProColorImageFeatureE2EEvidence.warnings],
  }
}
