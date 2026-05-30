import { deepFilterNetRuntimeConfig } from './deepfilternet-runtime-policy'
import type { ApprovedDeepFilterNetRuntimeEvidence } from './deepfilternet-runtime-types'

export const approvedDeepFilterNetRuntimeEvidence: ApprovedDeepFilterNetRuntimeEvidence = {
  phase: '36C',
  status: 'blocked',
  runId: 'phase36c-20260530T131522',
  runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:883df7f72317fec06b8e908ff836ff9844803c02366f0067b2f8fcda8d95cb1a',
  runtimeImageDigest: 'sha256:883df7f72317fec06b8e908ff836ff9844803c02366f0067b2f8fcda8d95cb1a',
  cloudRunJobName: deepFilterNetRuntimeConfig.runtimeJobName,
  cloudRunExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-7jm4n',
  toolId: deepFilterNetRuntimeConfig.toolId,
  toolVersion: deepFilterNetRuntimeConfig.toolVersion,
  artifactGcsPath: deepFilterNetRuntimeConfig.artifactGcsPath,
  cliSha256: deepFilterNetRuntimeConfig.cliSha256,
  modelArchiveSha256: deepFilterNetRuntimeConfig.modelArchiveSha256,
  aggregateSha256: deepFilterNetRuntimeConfig.aggregateSha256,
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36c/phase36c-20260530T131522/reports/phase36c-report.json',
  phase36DReadiness: {
    readyForControlledRealVideoAudioAiCleanupSample: false,
    reason: 'Phase 36C is blocked because the Cloud Run CPU worker service account cannot read the approved Phase 36B DeepFilterNet artifact prefix from private staging GCS.',
  },
  blockers: [
    'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com does not have storage.objects.get access to the approved Phase 36B DeepFilterNet artifact objects despite prefix-scoped, managed-folder, bucket-level exact-object, and project-level exact-object Phase 36C objectViewer bindings.',
  ],
  warnings: [
    'The Phase 36C diagnostic image was rebuilt and redeployed with a fresh run ID, but DeepFilterNet did not run and no generated audio was processed.',
    'Bucket-level conditional objectViewer, managed-folder objectViewer, bucket-level exact-object objectViewer, and project-level exact-object objectViewer were present for the CPU worker service account; artifact read access still requires GCS/IAM admin review.',
    'Policy Troubleshooter returned NOT_GRANTED with ERROR_IAM_DENY for storage.objects.get on the generated-assets bucket, while Cloud Asset analysis found the conditional objectViewer bindings; org-level deny and Principal Access Boundary inspection is not permitted for the active account.',
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
