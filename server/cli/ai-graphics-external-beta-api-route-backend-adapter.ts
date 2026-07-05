import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaApiRouteBackendAdapterInput,
  evaluateAiGraphicsExternalBetaApiRouteBackendAdapter,
  type AiGraphicsExternalBetaApiRouteBackendAdapterInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-backend-adapter'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile(flag: string): Record<string, unknown> | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as Record<string, unknown>
}

const sourceBackendAdapterContractPacket = readJsonFile(
  '--backend-adapter-contract-packet',
)
const sourceApiRouteHandlerContractPacket = readJsonFile(
  '--api-route-handler-contract-packet',
)

const input: AiGraphicsExternalBetaApiRouteBackendAdapterInput =
  sourceBackendAdapterContractPacket && sourceApiRouteHandlerContractPacket
    ? buildAiGraphicsExternalBetaApiRouteBackendAdapterInput(
        sourceBackendAdapterContractPacket,
        sourceApiRouteHandlerContractPacket,
      )
    : {}

const report = evaluateAiGraphicsExternalBetaApiRouteBackendAdapter(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceBackendAdapterContractPacketRead:
      Boolean(stringFlag('--backend-adapter-contract-packet')),
    sourceApiRouteHandlerContractPacketRead:
      Boolean(stringFlag('--api-route-handler-contract-packet')),
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
