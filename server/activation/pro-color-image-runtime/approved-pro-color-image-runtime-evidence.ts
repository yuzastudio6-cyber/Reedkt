import type { ApprovedProColorImageRuntimeEvidence } from './pro-color-image-runtime-types'

export const approvedProColorImageRuntimeEvidence: ApprovedProColorImageRuntimeEvidence = {
  phase: '40B',
  status: 'verified',
  runId: 'phase40b-20260531T10390',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:5d3c22e1136d043a80e687d5f344dfc30c82180b7b5cc1e69b916b7a2d2a73cf',
  runtimeImageDigest: 'sha256:5d3c22e1136d043a80e687d5f344dfc30c82180b7b5cc1e69b916b7a2d2a73cf',
  cloudRunJobName: 'reeditpro-staging-pro-color-image-runtime-job',
  cloudRunExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-s25z7',
  computeMode: 'cpu',
  fixture: {
    width: 256,
    height: 256,
    frameCount: 3,
  },
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-20260531T10390/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T10390/reports/phase40b-report.json',
  toolResults: {
    opencolorio: 'passed',
    openimageio: 'passed',
    kornia: 'passed',
  },
  phase40CReadiness: {
    readyForControlledRealVideoProColorImageSample: true,
    reason: 'Phase 40B verified OpenColorIO, OpenImageIO, and Kornia on generated fixtures only; Phase 40C may plan one controlled real-video pro color/image sample.',
  },
  blockers: [],
  warnings: [
    'Generated fixture runtime only; no real media loaded.',
    'Generated image fixtures only; no real-video pro color/image QA yet.',
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
