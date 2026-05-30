import type { ApprovedSam2FeatureE2EEvidence } from './sam2-feature-e2e-types'

export const approvedSam2FeatureE2EEvidence: ApprovedSam2FeatureE2EEvidence = {
  phase: '35F',
  status: 'verified',
  runId: 'phase35f-20260530T02293',
  source: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  previewScope: {
    mode: 'full_controlled_clip_preview',
    startSeconds: 0,
    endSeconds: 15.467,
    durationSeconds: 15.467,
    frameCount: 77,
    width: 768,
    height: 432,
    fps: 5,
  },
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:b2129d7a724a72729e7396f074a94c2b323bad8dc962fdc63e7751385f305d04',
  runtimeImageDigest: 'sha256:b2129d7a724a72729e7396f074a94c2b323bad8dc962fdc63e7751385f305d04',
  cloudRunJobName: 'reeditpro-staging-sam2-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-sam2-runtime-job-fprzj',
  planSnapshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35f/phase35f-20260530T02293/plan/approved-plan-snapshot.json',
  generatedAssetsPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35f/phase35f-20260530T02293/',
  masksPrefix: 'gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35f/phase35f-20260530T02293/',
  previewsPrefix: 'gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35f/phase35f-20260530T02293/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35f/phase35f-20260530T02293/reports/phase35f-report.json',
  previewFrameCount: 77,
  previewClipGenerated: false,
  featureReadiness: {
    status: 'ready_for_internal_sam2_feature_testing',
    reason: 'Full controlled private preview scope completed with SAM2 masks, text-behind-subject preview frames, private review manifest, and no blocking QA failures.',
  },
  blockers: [],
  warnings: [
    'Phase 35F is a private bounded preview feature gate only.',
    'External beta, paid production, broad real media, providers, Revideo, FILM, slow motion, Real-ESRGAN, and final export remain blocked.',
    'Human visual review is recommended before any broader SAM2 feature use.',
    'Private MP4 preview assembly was not generated; private preview frames are the source of truth.',
  ],
}

export function getApprovedSam2FeatureE2EEvidence(): ApprovedSam2FeatureE2EEvidence {
  return {
    ...approvedSam2FeatureE2EEvidence,
    previewScope: approvedSam2FeatureE2EEvidence.previewScope ? { ...approvedSam2FeatureE2EEvidence.previewScope } : undefined,
    featureReadiness: { ...approvedSam2FeatureE2EEvidence.featureReadiness },
    blockers: [...approvedSam2FeatureE2EEvidence.blockers],
    warnings: [...approvedSam2FeatureE2EEvidence.warnings],
  }
}
