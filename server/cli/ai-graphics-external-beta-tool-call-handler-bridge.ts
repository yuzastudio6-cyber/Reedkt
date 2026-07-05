import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaToolCallHandlerBridgeInput,
  evaluateAiGraphicsExternalBetaToolCallHandlerBridge,
  type AiGraphicsExternalBetaToolCallHandlerBridgeInput,
} from '../routes/ai-graphics-external-beta-tool-call-handler-bridge'

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

const sourceBackendAdapterSmokePacket = readJsonFile(
  '--backend-adapter-smoke-packet',
)

const input: AiGraphicsExternalBetaToolCallHandlerBridgeInput =
  sourceBackendAdapterSmokePacket
    ? buildAiGraphicsExternalBetaToolCallHandlerBridgeInput(
        sourceBackendAdapterSmokePacket,
      )
    : {}

const report = evaluateAiGraphicsExternalBetaToolCallHandlerBridge(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceBackendAdapterSmokePacketRead:
      Boolean(stringFlag('--backend-adapter-smoke-packet')),
    handlerBridgeRequestsBuilt: input.handlerBridgeRequests?.length ?? 0,
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
