import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayFullProof,
  type AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-handler-gateway-full-proof'

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

const input: AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofInput = {
  sourceRouteHandlerGatewayBindingPacket:
    readJsonFile('--route-handler-gateway-binding-packet'),
}

const report = evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayFullProof(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteHandlerGatewayBindingPacketRead:
      Boolean(stringFlag('--route-handler-gateway-binding-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
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
