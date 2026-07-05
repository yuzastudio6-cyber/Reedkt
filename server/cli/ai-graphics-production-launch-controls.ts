import {
  buildAiGraphicsProductionLaunchControls,
  type AiGraphicsProductionLaunchControlsInput,
} from '../tool-registry/ai-graphics-production-launch-controls'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const input: AiGraphicsProductionLaunchControlsInput = {
  productionOwnerApprovalRef: stringFlag('--production-owner-approval-ref'),
  productionSupportRunbookRef: stringFlag('--production-support-runbook-ref'),
  productionIncidentResponseRef: stringFlag('--production-incident-response-ref'),
  productionRollbackKillSwitchRef: stringFlag('--production-rollback-kill-switch-ref'),
  productionCostConcurrencyCeilingRef:
    stringFlag('--production-cost-concurrency-ceiling-ref'),
  productionMonitoringAlertingRef: stringFlag('--production-monitoring-alerting-ref'),
  productionPostLaunchReviewRef: stringFlag('--production-post-launch-review-ref'),
  productionCreditLedgerApprovalSnapshotRef:
    stringFlag('--production-credit-ledger-approval-snapshot-ref'),
  productionToolRouteDeploymentRef:
    stringFlag('--production-tool-route-deployment-ref'),
  productionWorkerDeploymentRef: stringFlag('--production-worker-deployment-ref'),
  productionPrivacyRetentionRef: stringFlag('--production-privacy-retention-ref'),
  productionPrivateArtifactControlsRef:
    stringFlag('--production-private-artifact-controls-ref'),
  productionCanaryCohortRef: stringFlag('--production-canary-cohort-ref'),
  productionLaunchApproverRole:
    stringFlag('--production-launch-approver-role') ??
    'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
}

const controls = buildAiGraphicsProductionLaunchControls(input)

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
