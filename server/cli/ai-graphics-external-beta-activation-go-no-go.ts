import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaActivationGoNoGo,
} from '../tool-registry/ai-graphics-external-beta-activation-go-no-go'
import type {
  AiGraphicsExternalBetaControlledTrafficRuntimeSoakResult,
} from '../tool-registry/ai-graphics-external-beta-controlled-traffic-runtime-soak-result'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const gate = evaluateAiGraphicsExternalBetaActivationGoNoGo({
  sourceControlledTrafficRuntimeSoakResultPacket:
    readJsonFile<AiGraphicsExternalBetaControlledTrafficRuntimeSoakResult>(
      '--external-beta-controlled-traffic-runtime-soak-result-packet',
    ),
  externalBetaActivationOwnerApprovalRef:
    valueAfterFlag('--external-beta-activation-owner-approval-ref'),
  externalBetaActivationFeatureFlagRef:
    valueAfterFlag('--external-beta-activation-feature-flag-ref'),
  externalBetaActivationCohortRef:
    valueAfterFlag('--external-beta-activation-cohort-ref'),
  externalBetaActivationSupportAckRef:
    valueAfterFlag('--external-beta-activation-support-ack-ref'),
  externalBetaActivationMonitoringLiveRef:
    valueAfterFlag('--external-beta-activation-monitoring-live-ref'),
  externalBetaActivationCostBudgetFinalRef:
    valueAfterFlag('--external-beta-activation-cost-budget-final-ref'),
  externalBetaActivationRollbackArmedRef:
    valueAfterFlag('--external-beta-activation-rollback-armed-ref'),
  externalBetaActivationReleaseNotesRef:
    valueAfterFlag('--external-beta-activation-release-notes-ref'),
  externalBetaActivationUserCommsRef:
    valueAfterFlag('--external-beta-activation-user-comms-ref'),
  externalBetaActivationPostActivationReviewRef:
    valueAfterFlag('--external-beta-activation-post-activation-review-ref'),
})

console.log(JSON.stringify({
  ...gate,
  input: {
    evaluatorOnly: true,
    controlledTrafficRuntimeSoakResultPacketRead:
      Boolean(valueAfterFlag('--external-beta-controlled-traffic-runtime-soak-result-packet')),
    activationMetadataOnly: true,
    controlledTrafficRunExecutedByThisCommand: false,
    externalBetaTrafficSwitchEnabledByThisCommand: false,
    externalBetaRuntimeSoakStartedByThisCommand: false,
    directAgentToolExecutionPerformed: false,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    apiRouteExecutionPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    privateArtifactWritePerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    supabaseMutationPerformed: false,
    liveQueueWritePerformed: false,
    workerLeaseCreatedByThisCommand: false,
    workerDispatchPerformedByThisCommand: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformedByThisCommand: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
