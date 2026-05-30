import { deepFilterNetRuntimeConfig } from './deepfilternet-runtime-policy'
import type { ApprovedDeepFilterNetRuntimeEvidence } from './deepfilternet-runtime-types'

export const approvedDeepFilterNetRuntimeEvidence: ApprovedDeepFilterNetRuntimeEvidence = {
  phase: '36C',
  status: 'verified',
  runId: 'phase36c-20260530T133009',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:363d436bbd958a38ddb18cfb028ce2d3eb379317c28cef81dda502567a0aafce',
  runtimeImageDigest: 'sha256:363d436bbd958a38ddb18cfb028ce2d3eb379317c28cef81dda502567a0aafce',
  cloudRunJobName: deepFilterNetRuntimeConfig.runtimeJobName,
  cloudRunExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-pxjbq',
  toolId: deepFilterNetRuntimeConfig.toolId,
  toolVersion: deepFilterNetRuntimeConfig.toolVersion,
  artifactGcsPath: deepFilterNetRuntimeConfig.artifactGcsPath,
  cliSha256: deepFilterNetRuntimeConfig.cliSha256,
  modelArchiveSha256: deepFilterNetRuntimeConfig.modelArchiveSha256,
  aggregateSha256: deepFilterNetRuntimeConfig.aggregateSha256,
  generatedFixture: {
    sampleRate: 48000,
    channels: 1,
    durationSeconds: 10,
  },
  enhancedAudioUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/enhanced/deepfilternet-enhanced.wav',
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36c/phase36c-20260530T133009/reports/phase36c-report.json',
  phase36DReadiness: {
    readyForControlledRealVideoAudioAiCleanupSample: true,
    reason: 'Phase 36C verified DeepFilterNet runtime on generated audio only; Phase 36D may plan one controlled real-video audio AI cleanup sample.',
  },
  blockers: [],
  warnings: [
    'Phase 36C uses generated synthetic audio only; no real-video audio cleanup is approved until Phase 36D.',
    'Metrics are deterministic runtime sanity checks, not subjective audio quality approval.',
  ],
}

export function getApprovedDeepFilterNetRuntimeEvidence(): ApprovedDeepFilterNetRuntimeEvidence {
  return {
    ...approvedDeepFilterNetRuntimeEvidence,
    generatedFixture: approvedDeepFilterNetRuntimeEvidence.generatedFixture ? { ...approvedDeepFilterNetRuntimeEvidence.generatedFixture } : undefined,
    phase36DReadiness: { ...approvedDeepFilterNetRuntimeEvidence.phase36DReadiness },
    blockers: [...approvedDeepFilterNetRuntimeEvidence.blockers],
    warnings: [...approvedDeepFilterNetRuntimeEvidence.warnings],
  }
}
