import type { ApprovedProColorImageRuntimeEvidence } from './pro-color-image-runtime-types'

export const approvedProColorImageRuntimeEvidence: ApprovedProColorImageRuntimeEvidence = {
  phase: '40B',
  status: 'blocked',
  runId: 'phase40b-20260531T03304',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:e72e453d22d6d5c416b3e9f853d72d93b52928c45ce2e5d42a16730694c1a747',
  runtimeImageDigest: 'sha256:e72e453d22d6d5c416b3e9f853d72d93b52928c45ce2e5d42a16730694c1a747',
  cloudRunJobName: 'reeditpro-staging-pro-color-image-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-b6dfs',
  computeMode: 'cpu',
  fixture: {
    width: 256,
    height: 256,
    frameCount: 3,
  },
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-20260531T03304/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T03304/reports/phase40b-report.json',
  toolResults: {
    opencolorio: 'passed',
    openimageio: 'passed',
    kornia: 'blocked',
  },
  phase40CReadiness: {
    readyForControlledRealVideoProColorImageSample: false,
    reason: 'Phase 40C remains blocked because Kornia did not import in the Phase 40B runtime container; OpenColorIO and OpenImageIO generated-fixture checks passed.',
  },
  blockers: [
    'Kornia runtime blocked: ModuleNotFoundError: No module named torch.',
    'Phase 40B mandatory tool_runtime_integrity and kornia_result QA gates did not pass.',
  ],
  warnings: [
    'Phase 40B is generated image fixtures only.',
    'Real-video pro color/image runtime remains blocked until Phase 40C.',
    'Initial execution reeditpro-staging-pro-color-image-runtime-job-rr5gd failed closed because GCP_REGION was missing from the job environment; the env plan was fixed before the final recorded run.',
  ],
}

export function getApprovedProColorImageRuntimeEvidence(): ApprovedProColorImageRuntimeEvidence {
  return {
    ...approvedProColorImageRuntimeEvidence,
    fixture: approvedProColorImageRuntimeEvidence.fixture ? { ...approvedProColorImageRuntimeEvidence.fixture } : undefined,
    toolResults: { ...approvedProColorImageRuntimeEvidence.toolResults },
    phase40CReadiness: { ...approvedProColorImageRuntimeEvidence.phase40CReadiness },
    blockers: [...approvedProColorImageRuntimeEvidence.blockers],
    warnings: [...approvedProColorImageRuntimeEvidence.warnings],
  }
}
