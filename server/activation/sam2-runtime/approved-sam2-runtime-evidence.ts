import { sam2RuntimeConfig } from './sam2-runtime-policy'
import type { ApprovedSam2RuntimeEvidence } from './sam2-runtime-types'

export const approvedSam2RuntimeEvidence: ApprovedSam2RuntimeEvidence = {
  phase: '35C',
  status: 'verified',
  runId: 'phase35c-20260529T16082',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:d40444269ba867dfae4ef09da803a67870bc03b381e41359e482eeed3ab381c9',
  runtimeImageDigest: 'sha256:d40444269ba867dfae4ef09da803a67870bc03b381e41359e482eeed3ab381c9',
  cloudRunJobName: sam2RuntimeConfig.runtimeJobName,
  cloudRunExecutionId: 'reeditpro-staging-sam2-runtime-job-5smkz',
  modelId: sam2RuntimeConfig.modelId,
  checkpointSha256: sam2RuntimeConfig.checkpointSha256,
  configSha256: sam2RuntimeConfig.configSha256,
  aggregateSha256: sam2RuntimeConfig.aggregateSha256,
  generatedFixture: {
    width: 512,
    height: 512,
    frameCount: 5,
    promptType: 'box',
  },
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-20260529T16082/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-sam2-runtime/phase35c/phase35c-20260529T16082/reports/phase35c-report.json',
  phase35DReadiness: {
    readyForControlledShortRealVideoTemporalMaskTracking: true,
    reason: 'Phase 35C verified SAM2 runtime on generated synthetic frames only; Phase 35D may plan a controlled short real-video temporal mask tracking test.',
  },
  blockers: [],
  warnings: [
    'Generated synthetic fixture only; real-video temporal QA is not claimed.',
    'Generated fixture only; this is not real-video temporal QA.',
  ],
}

export function getApprovedSam2RuntimeEvidence(): ApprovedSam2RuntimeEvidence {
  return {
    ...approvedSam2RuntimeEvidence,
    generatedFixture: approvedSam2RuntimeEvidence.generatedFixture ? { ...approvedSam2RuntimeEvidence.generatedFixture } : undefined,
    phase35DReadiness: { ...approvedSam2RuntimeEvidence.phase35DReadiness },
    blockers: [...approvedSam2RuntimeEvidence.blockers],
    warnings: [...approvedSam2RuntimeEvidence.warnings],
  }
}
