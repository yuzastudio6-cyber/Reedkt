import { deepFilterNetRuntimeConfig } from './deepfilternet-runtime-policy'
import type { ApprovedDeepFilterNetRuntimeEvidence } from './deepfilternet-runtime-types'

export const approvedDeepFilterNetRuntimeEvidence: ApprovedDeepFilterNetRuntimeEvidence = {
  phase: '36C',
  status: 'blocked',
  runId: 'phase36c-20260530T125233',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:2c709d298628a5189ec0f4ddc0f11ac78554af328a81f647414837c9388402bc',
  runtimeImageDigest: 'sha256:2c709d298628a5189ec0f4ddc0f11ac78554af328a81f647414837c9388402bc',
  cloudRunJobName: deepFilterNetRuntimeConfig.runtimeJobName,
  cloudRunExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-b6mmw',
  toolId: deepFilterNetRuntimeConfig.toolId,
  toolVersion: deepFilterNetRuntimeConfig.toolVersion,
  artifactGcsPath: deepFilterNetRuntimeConfig.artifactGcsPath,
  cliSha256: deepFilterNetRuntimeConfig.cliSha256,
  modelArchiveSha256: deepFilterNetRuntimeConfig.modelArchiveSha256,
  aggregateSha256: deepFilterNetRuntimeConfig.aggregateSha256,
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36c/phase36c-20260530T125233/reports/phase36c-report.json',
  phase36DReadiness: {
    readyForControlledRealVideoAudioAiCleanupSample: false,
    reason: 'Phase 36C is blocked because the Cloud Run CPU worker service account cannot read the approved Phase 36B DeepFilterNet artifact prefix from private staging GCS.',
  },
  blockers: [
    'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com does not have storage.objects.get access to the approved Phase 36B DeepFilterNet artifact objects despite prefix-scoped Phase 36C objectViewer bindings.',
  ],
  warnings: [
    'The Phase 36C diagnostic image was rebuilt and redeployed with a fresh run ID, but DeepFilterNet did not run and no generated audio was processed.',
    'Bucket-level conditional objectViewer and managed-folder objectViewer were both present for the CPU worker service account; artifact read access still requires GCS/IAM admin review.',
    'Policy Troubleshooter, Cloud Asset analysis, and Access Context Manager diagnostics could not be run because the APIs are disabled; org-level deny and Principal Access Boundary inspection is not permitted for the active account.',
    'Phase 36C remains generated-audio-only and must not process real video/audio.',
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
