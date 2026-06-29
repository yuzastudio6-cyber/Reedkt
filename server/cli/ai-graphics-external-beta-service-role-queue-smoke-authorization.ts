import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization,
  type AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationInput,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-authorization'
import type {
  AiGraphicsExternalBetaLiveEnqueueAuthorization,
} from '../tool-registry/ai-graphics-external-beta-live-enqueue-authorization'
import type {
  AiGraphicsExternalBetaServiceRoleQueueSmokePreflight,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-preflight'
import type {
  AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-readiness'

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

const input: AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorizationInput = {
  sourceExternalBetaLiveEnqueueAuthorizationPacket:
    readJsonFile<AiGraphicsExternalBetaLiveEnqueueAuthorization>(
      '--external-beta-live-enqueue-authorization-packet',
    ),
  sourceExternalBetaServiceRoleQueueSmokeReadinessPacket:
    readJsonFile<AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness>(
      '--external-beta-service-role-queue-smoke-readiness-packet',
    ),
  sourceExternalBetaServiceRoleQueueSmokePreflightPacket:
    readJsonFile<AiGraphicsExternalBetaServiceRoleQueueSmokePreflight>(
      '--external-beta-service-role-queue-smoke-preflight-packet',
    ),
  externalBetaServiceRoleQueueSmokeAuthorizationGranted:
    hasFlag('--external-beta-service-role-queue-smoke-authorization-granted'),
  externalBetaServiceRoleQueueSmokeAuthorizationRef:
    valueAfterFlag('--external-beta-service-role-queue-smoke-authorization-ref'),
  externalBetaServiceRoleQueueSmokeOperatorRole:
    valueAfterFlag('--external-beta-service-role-queue-smoke-operator-role'),
  externalBetaServiceRoleQueueSmokeReadinessRef:
    valueAfterFlag('--external-beta-service-role-queue-smoke-readiness-ref'),
  externalBetaServiceRoleQueueSmokePreflightRef:
    valueAfterFlag('--external-beta-service-role-queue-smoke-preflight-ref'),
  externalBetaNonProductionEnvironmentRef:
    valueAfterFlag('--external-beta-non-production-environment-ref'),
  externalBetaQueueWriteWindowRef:
    valueAfterFlag('--external-beta-queue-write-window-ref'),
  externalBetaCleanupPlanRef:
    valueAfterFlag('--external-beta-cleanup-plan-ref'),
  externalBetaRollbackPlanRef:
    valueAfterFlag('--external-beta-rollback-plan-ref'),
  externalBetaTelemetryRef:
    valueAfterFlag('--external-beta-telemetry-ref'),
  externalBetaCostCeilingRef:
    valueAfterFlag('--external-beta-cost-ceiling-ref'),
}

const authorization =
  buildAiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization(input)

console.log(JSON.stringify({
  ...authorization,
  input: {
    evaluatorOnly: true,
    liveEnqueueAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-beta-live-enqueue-authorization-packet')),
    serviceRoleQueueSmokeReadinessPacketRead:
      Boolean(valueAfterFlag('--external-beta-service-role-queue-smoke-readiness-packet')),
    serviceRoleQueueSmokePreflightPacketRead:
      Boolean(valueAfterFlag('--external-beta-service-role-queue-smoke-preflight-packet')),
    serviceRoleQueueSmokeAuthorizationGranted:
      hasFlag('--external-beta-service-role-queue-smoke-authorization-granted'),
    serviceRoleQueueSmokeAuthorizationRefProvided:
      Boolean(valueAfterFlag('--external-beta-service-role-queue-smoke-authorization-ref')),
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
