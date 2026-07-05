import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaApiRouteBackendAdapterContractInput,
  evaluateAiGraphicsExternalBetaApiRouteBackendAdapterContract,
  type AiGraphicsExternalBetaApiRouteBackendAdapterContractInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-backend-adapter-contract'

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

const sourceRouteMountImplementationQaPacket = readJsonFile(
  '--route-mount-implementation-qa-packet',
)

const input: AiGraphicsExternalBetaApiRouteBackendAdapterContractInput =
  sourceRouteMountImplementationQaPacket
    ? buildAiGraphicsExternalBetaApiRouteBackendAdapterContractInput(
        sourceRouteMountImplementationQaPacket,
      )
    : {}

const report = evaluateAiGraphicsExternalBetaApiRouteBackendAdapterContract(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteMountImplementationQaPacketRead:
      Boolean(stringFlag('--route-mount-implementation-qa-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
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
