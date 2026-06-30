import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridge,
  type AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeInput,
} from '../routes/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge'

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

const input: AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeInput = {
  sourceRouteToQueueAuthorizationBridgePacket:
    readJsonFile('--route-to-queue-authorization-bridge-packet'),
  sourceLiveEnqueueAuthorizationPacket:
    readJsonFile('--live-enqueue-authorization-packet'),
}

const report =
  evaluateAiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridge(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteToQueueAuthorizationBridgePacketRead:
      Boolean(stringFlag('--route-to-queue-authorization-bridge-packet')),
    sourceLiveEnqueueAuthorizationPacketRead:
      Boolean(stringFlag('--live-enqueue-authorization-packet')),
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
