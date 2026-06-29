import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteQueueSmokeProof,
  type AiGraphicsExternalBetaApiRouteQueueSmokeResult,
} from '../tool-registry/ai-graphics-external-beta-api-route-queue-smoke-proof'
import type {
  AiGraphicsExternalBetaApiRouteQueueSmokeAuthorization,
} from '../tool-registry/ai-graphics-external-beta-api-route-queue-smoke-authorization'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const proof = evaluateAiGraphicsExternalBetaApiRouteQueueSmokeProof({
  sourceExternalBetaApiRouteQueueSmokeAuthorizationPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteQueueSmokeAuthorization>(
      '--external-beta-api-route-queue-smoke-authorization-packet',
    ),
  apiRouteQueueSmokeResult:
    readJsonFile<AiGraphicsExternalBetaApiRouteQueueSmokeResult>(
      '--external-beta-api-route-queue-smoke-result',
    ),
  apiRouteQueueSmokeEvidenceRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-evidence-ref'),
  apiRouteQueueSmokeTelemetryRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-telemetry-ref'),
  apiRouteQueueSmokeCleanupProofRef:
    valueAfterFlag('--external-beta-api-route-queue-smoke-cleanup-proof-ref'),
})

console.log(JSON.stringify({
  ...proof,
  input: {
    validatorOnly: true,
    apiRouteQueueSmokeAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-beta-api-route-queue-smoke-authorization-packet')),
    apiRouteQueueSmokeResultPacketRead:
      Boolean(valueAfterFlag('--external-beta-api-route-queue-smoke-result')),
    liveApiRouteQueueSmokeExecutedByThisCommand: false,
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
