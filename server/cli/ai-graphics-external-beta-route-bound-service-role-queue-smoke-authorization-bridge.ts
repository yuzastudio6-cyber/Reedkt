import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridge,
  type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgeInput,
} from '../routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-authorization-bridge'

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

const input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgeInput = {
  sourceRouteToLiveEnqueueAuthorizationBridgePacket:
    readJsonFile('--route-to-live-enqueue-authorization-bridge-packet'),
  sourceServiceRoleQueueSmokeAuthorizationPacket:
    readJsonFile('--service-role-queue-smoke-authorization-packet'),
}

const report =
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridge(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteToLiveEnqueueAuthorizationBridgePacketRead:
      Boolean(stringFlag('--route-to-live-enqueue-authorization-bridge-packet')),
    sourceServiceRoleQueueSmokeAuthorizationPacketRead:
      Boolean(stringFlag('--service-role-queue-smoke-authorization-packet')),
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
