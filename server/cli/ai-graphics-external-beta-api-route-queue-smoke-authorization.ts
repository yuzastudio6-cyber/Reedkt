import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaApiRouteQueueSmokeAuthorization,
  type AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-queue-smoke-authorization'
import type { AiGraphicsExternalBetaApiRouteQueueInsertionProof } from '../tool-registry/ai-graphics-external-beta-api-route-queue-insertion-proof'
import type { AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization } from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-authorization'

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

const input: AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationInput = {
  sourceExternalBetaApiRouteQueueInsertionProofPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteQueueInsertionProof>(
      '--external-beta-api-route-queue-insertion-proof-packet',
    ),
  sourceExternalBetaServiceRoleQueueSmokeAuthorizationPacket:
    readJsonFile<AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization>(
      '--external-beta-service-role-queue-smoke-authorization-packet',
    ),
  externalBetaApiRouteQueueSmokeAuthorizationGranted:
    hasFlag('--external-beta-api-route-queue-smoke-authorization-granted'),
  externalBetaApiRouteQueueSmokeAuthorizationRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-authorization-ref'),
  externalBetaApiRouteQueueSmokeOperatorRole:
    valueAfterFlag('--external-beta-api-route-queue-smoke-operator-role'),
  externalBetaApiRouteQueueInsertionProofRef:
    valueAfterFlag('--external-beta-api-route-queue-insertion-proof-ref'),
  externalBetaServiceRoleQueueSmokeAuthorizationRef:
    valueAfterFlag('--external-beta-service-role-queue-smoke-authorization-ref'),
  externalBetaApiRouteQueueSmokeNonProductionEnvironmentRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-non-production-environment-ref'),
  externalBetaApiRouteQueueSmokeRouteExecutionWindowRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-route-execution-window-ref'),
  externalBetaApiRouteQueueSmokeQueueWriteWindowRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-queue-write-window-ref'),
  externalBetaApiRouteQueueSmokeCleanupPlanRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-cleanup-plan-ref'),
  externalBetaApiRouteQueueSmokeRollbackPlanRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-rollback-plan-ref'),
  externalBetaApiRouteQueueSmokeTelemetryRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-telemetry-ref'),
  externalBetaApiRouteQueueSmokeCostCeilingRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-cost-ceiling-ref'),
  externalBetaApiRouteQueueSmokePrivateNetworkRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-private-network-ref'),
  externalBetaApiRouteQueueSmokeIncidentResponseRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-incident-response-ref'),
}

const authorization =
  buildAiGraphicsExternalBetaApiRouteQueueSmokeAuthorization(input)

console.log(JSON.stringify({
  ...authorization,
  input: {
    evaluatorOnly: true,
    apiRouteQueueInsertionProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-api-route-queue-insertion-proof-packet')),
    serviceRoleQueueSmokeAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-beta-service-role-queue-smoke-authorization-packet')),
    apiRouteQueueSmokeAuthorizationGranted:
      hasFlag('--external-beta-api-route-queue-smoke-authorization-granted'),
    apiRouteQueueSmokeAuthorizationRefProvided:
      Boolean(valueAfterFlag('--external-beta-api-route-queue-smoke-authorization-ref')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    apiRouteMountedNow: false,
    apiRouteExecutionPerformed: false,
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
