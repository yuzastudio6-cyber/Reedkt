import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaPerToolTrafficEnablementGate,
} from '../tool-registry/ai-graphics-external-beta-per-tool-traffic-enablement-gate'
import type {
  AiGraphicsExternalBetaLaunchGoNoGo,
} from '../tool-registry/ai-graphics-external-beta-launch-go-no-go'
import type {
  AiGraphicsExternalBetaPerToolCallableResultGate,
} from '../tool-registry/ai-graphics-external-beta-per-tool-callable-result-gate'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const gate = evaluateAiGraphicsExternalBetaPerToolTrafficEnablementGate({
  sourcePerToolCallableResultGatePacket:
    readJsonFile<AiGraphicsExternalBetaPerToolCallableResultGate>(
      '--external-beta-per-tool-callable-result-gate-packet',
    ),
  sourceExternalBetaLaunchGoNoGoPacket:
    readJsonFile<AiGraphicsExternalBetaLaunchGoNoGo>(
      '--external-beta-launch-go-no-go-packet',
    ),
  externalBetaTrafficEnablementOwnerApprovalRef:
    valueAfterFlag('--external-beta-traffic-owner-approval-ref'),
  externalBetaTrafficEnablementFeatureFlagRef:
    valueAfterFlag('--external-beta-traffic-feature-flag-ref'),
  externalBetaTrafficEnablementRolloutCohortRef:
    valueAfterFlag('--external-beta-traffic-rollout-cohort-ref'),
  externalBetaTrafficEnablementKillSwitchRef:
    valueAfterFlag('--external-beta-traffic-kill-switch-ref'),
  externalBetaTrafficEnablementRateLimitRef:
    valueAfterFlag('--external-beta-traffic-rate-limit-ref'),
  externalBetaTrafficEnablementCostCeilingRef:
    valueAfterFlag('--external-beta-traffic-cost-ceiling-ref'),
  externalBetaTrafficEnablementSupportRunbookRef:
    valueAfterFlag('--external-beta-traffic-support-runbook-ref'),
  externalBetaTrafficEnablementTelemetryRef:
    valueAfterFlag('--external-beta-traffic-telemetry-ref'),
  externalBetaTrafficEnablementRollbackRef:
    valueAfterFlag('--external-beta-traffic-rollback-ref'),
})

console.log(JSON.stringify({
  ...gate,
  input: {
    evaluatorOnly: true,
    callableResultGatePacketRead:
      Boolean(valueAfterFlag('--external-beta-per-tool-callable-result-gate-packet')),
    launchGoNoGoPacketRead:
      Boolean(valueAfterFlag('--external-beta-launch-go-no-go-packet')),
    externalBetaTrafficEnabledByThisCommand: false,
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
