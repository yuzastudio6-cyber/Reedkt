import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayBinding,
  type AiGraphicsExternalBetaApiRouteHandlerGatewayBindingInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-handler-gateway-binding'

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

const input: AiGraphicsExternalBetaApiRouteHandlerGatewayBindingInput = {
  sourceExternalBetaApiRouteHandlerContractPacket:
    readJsonFile('--external-beta-api-route-handler-contract-packet'),
  sourceExternalBetaToolCallGatewayPacket:
    readJsonFile('--external-beta-tool-call-gateway-packet'),
  routeHandlerGatewayBindingRef:
    stringFlag('--route-handler-gateway-binding-ref'),
  routeHandlerGatewaySchemaRef:
    stringFlag('--route-handler-gateway-schema-ref'),
  routeHandlerGatewayPolicyRef:
    stringFlag('--route-handler-gateway-policy-ref'),
  routeHandlerGatewayAuditRef:
    stringFlag('--route-handler-gateway-audit-ref'),
  routeHandlerGatewayRollbackRef:
    stringFlag('--route-handler-gateway-rollback-ref'),
}

const report = evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayBinding(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteHandlerContractPacketRead:
      Boolean(stringFlag('--external-beta-api-route-handler-contract-packet')),
    sourceToolCallGatewayPacketRead:
      Boolean(stringFlag('--external-beta-tool-call-gateway-packet')),
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
