import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaControlledTrafficRuntimeSoakResult,
} from '../tool-registry/ai-graphics-external-beta-controlled-traffic-runtime-soak-result'
import type {
  AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization,
} from '../tool-registry/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const gate = evaluateAiGraphicsExternalBetaControlledTrafficRuntimeSoakResult({
  sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket:
    readJsonFile<AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization>(
      '--external-beta-operator-traffic-switch-runtime-soak-authorization-packet',
    ),
  externalBetaControlledTrafficRunResultRef:
    valueAfterFlag('--external-beta-controlled-traffic-run-result-ref'),
  externalBetaRuntimeSoakMetricsRef:
    valueAfterFlag('--external-beta-runtime-soak-metrics-ref'),
  externalBetaRequestSampleAuditRef:
    valueAfterFlag('--external-beta-request-sample-audit-ref'),
  externalBetaZeroCriticalIncidentRef:
    valueAfterFlag('--external-beta-zero-critical-incident-ref'),
  externalBetaCostObservationRef:
    valueAfterFlag('--external-beta-cost-observation-ref'),
  externalBetaGpuLifecycleObservationRef:
    valueAfterFlag('--external-beta-gpu-lifecycle-observation-ref'),
  externalBetaUserImpactReviewRef:
    valueAfterFlag('--external-beta-user-impact-review-ref'),
  externalBetaRollbackReadinessRef:
    valueAfterFlag('--external-beta-rollback-readiness-ref'),
  externalBetaPostSoakOwnerReviewRef:
    valueAfterFlag('--external-beta-post-soak-owner-review-ref'),
})

console.log(JSON.stringify({
  ...gate,
  input: {
    evaluatorOnly: true,
    operatorTrafficSwitchRuntimeSoakAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-beta-operator-traffic-switch-runtime-soak-authorization-packet')),
    controlledTrafficRunExecutedByThisCommand: false,
    externalBetaTrafficSwitchEnabledByThisCommand: false,
    externalBetaRuntimeSoakStartedByThisCommand: false,
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
