import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaLiveEnqueueAuthorization,
  type AiGraphicsExternalBetaLiveEnqueueAuthorizationInput,
} from '../tool-registry/ai-graphics-external-beta-live-enqueue-authorization'
import type {
  AiGraphicsExternalBetaControlledRuntimeExecutionApproval,
} from '../tool-registry/ai-graphics-external-beta-controlled-runtime-execution-approval'
import type {
  AiGraphicsExternalBetaRuntimeQueueServiceBridge,
} from '../tool-registry/ai-graphics-external-beta-runtime-queue-service-bridge'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaLiveEnqueueAuthorizationInput = {
  sourceControlledRuntimeExecutionApprovalPacket:
    readJsonFile<AiGraphicsExternalBetaControlledRuntimeExecutionApproval>(
      '--external-beta-controlled-runtime-execution-approval-packet',
    ),
  sourceRuntimeQueueServiceBridgePacket:
    readJsonFile<AiGraphicsExternalBetaRuntimeQueueServiceBridge>(
      '--external-beta-runtime-queue-service-bridge-packet',
    ),
  externalBetaLiveEnqueueAuthorizationGranted:
    hasFlag('--external-beta-live-enqueue-authorization-granted'),
  externalBetaLiveEnqueueAuthorizationRef:
    valueAfterFlag('--external-beta-live-enqueue-authorization-ref'),
  externalBetaLiveEnqueueOperatorRole:
    valueAfterFlag('--external-beta-live-enqueue-operator-role'),
  externalBetaNonProductionEnvironmentRef:
    valueAfterFlag('--external-beta-non-production-environment-ref'),
  externalBetaQueueWriteWindowRef:
    valueAfterFlag('--external-beta-queue-write-window-ref'),
  externalBetaCleanupPlanRef:
    valueAfterFlag('--external-beta-cleanup-plan-ref'),
  externalBetaRollbackPlanRef:
    valueAfterFlag('--external-beta-rollback-plan-ref'),
  externalBetaCostCeilingRef:
    valueAfterFlag('--external-beta-cost-ceiling-ref'),
}

const authorization =
  buildAiGraphicsExternalBetaLiveEnqueueAuthorization(input)

console.log(JSON.stringify({
  ...authorization,
  input: {
    evaluatorOnly: true,
    controlledRuntimeExecutionApprovalPacketRead:
      Boolean(valueAfterFlag('--external-beta-controlled-runtime-execution-approval-packet')),
    runtimeQueueServiceBridgePacketRead:
      Boolean(valueAfterFlag('--external-beta-runtime-queue-service-bridge-packet')),
    liveEnqueueAuthorizationGranted:
      hasFlag('--external-beta-live-enqueue-authorization-granted'),
    liveEnqueueAuthorizationRefProvided:
      Boolean(valueAfterFlag('--external-beta-live-enqueue-authorization-ref')),
    nonProductionEnvironmentRefProvided:
      Boolean(valueAfterFlag('--external-beta-non-production-environment-ref')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    supabaseMutationPerformed: false,
    liveQueueWritePerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
