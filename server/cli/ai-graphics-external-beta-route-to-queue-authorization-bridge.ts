import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput,
  evaluateAiGraphicsExternalBetaRouteToQueueAuthorizationBridge,
  type AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput,
} from '../routes/ai-graphics-external-beta-route-to-queue-authorization-bridge'

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

const sourceHandlerBridgePacket = readJsonFile('--handler-bridge-packet')
const sourceBackendQueueSubmissionPacket = readJsonFile(
  '--backend-queue-submission-packet',
)

const input: AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput =
  sourceHandlerBridgePacket && sourceBackendQueueSubmissionPacket
    ? buildAiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput(
        sourceHandlerBridgePacket,
        sourceBackendQueueSubmissionPacket,
      )
    : {}

const report = evaluateAiGraphicsExternalBetaRouteToQueueAuthorizationBridge(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceHandlerBridgePacketRead: Boolean(stringFlag('--handler-bridge-packet')),
    sourceBackendQueueSubmissionPacketRead:
      Boolean(stringFlag('--backend-queue-submission-packet')),
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
    liveQueueWritePerformed: false,
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
