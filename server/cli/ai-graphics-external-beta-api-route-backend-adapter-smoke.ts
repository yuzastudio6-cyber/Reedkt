import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput,
  evaluateAiGraphicsExternalBetaApiRouteBackendAdapterSmoke,
  type AiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-backend-adapter-smoke'
import type {
  AiGraphicsExternalBetaApiRouteBackendAdapter,
} from '../tool-registry/ai-graphics-external-beta-api-route-backend-adapter'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const sourceBackendAdapterPacket =
  readJsonFile<AiGraphicsExternalBetaApiRouteBackendAdapter>(
    '--backend-adapter-packet',
  )

const input: AiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput =
  sourceBackendAdapterPacket
    ? buildAiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput(
        sourceBackendAdapterPacket,
      )
    : {}

const report = evaluateAiGraphicsExternalBetaApiRouteBackendAdapterSmoke(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceBackendAdapterPacketRead:
      Boolean(stringFlag('--backend-adapter-packet')),
    routeSmokeRequestsBuilt: input.routeSmokeRequests?.length ?? 0,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    approvedSnapshotMutationPerformed: false,
    creditReservationMutationPerformed: false,
    privateArtifactWritePerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
