import {
  buildAiGraphicsExternalBetaLaunchControls,
  type AiGraphicsExternalBetaLaunchControlsInput,
} from '../tool-registry/ai-graphics-external-beta-launch-controls'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const input: AiGraphicsExternalBetaLaunchControlsInput = {
  internalBetaRuntimeSoakRef: stringFlag('--internal-beta-runtime-soak-ref'),
  externalBetaQaEvidenceRef: stringFlag('--external-beta-qa-evidence-ref'),
  externalBetaCostConcurrencyPrivacyRollbackRef:
    stringFlag('--external-beta-cost-concurrency-privacy-rollback-ref'),
  externalBetaIncidentResponseRef: stringFlag('--external-beta-incident-response-ref'),
  externalBetaOwnerApprovalRef: stringFlag('--external-beta-owner-approval-ref'),
  externalBetaLaunchSwitchRef: stringFlag('--external-beta-launch-switch-ref'),
  externalBetaRolloutCohortRef: stringFlag('--external-beta-rollout-cohort-ref'),
  externalBetaCostConcurrencyCeilingRef:
    stringFlag('--external-beta-cost-concurrency-ceiling-ref'),
  externalBetaRollbackIncidentRunbookRef:
    stringFlag('--external-beta-rollback-incident-runbook-ref'),
  externalBetaPrivateArtifactRetentionSupportRef:
    stringFlag('--external-beta-private-artifact-retention-support-ref'),
  externalBetaSupportOwnershipRef: stringFlag('--external-beta-support-ownership-ref'),
  externalBetaWorkerDispatchSmokeProofRef:
    stringFlag('--external-beta-worker-dispatch-smoke-proof-ref'),
  externalBetaLaunchApproverRole:
    stringFlag('--external-beta-launch-approver-role') ??
    'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
}

const controls = buildAiGraphicsExternalBetaLaunchControls(input)

console.log(JSON.stringify({
  ...controls,
  input: {
    evaluatorOnly: true,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    supabaseMutationPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
