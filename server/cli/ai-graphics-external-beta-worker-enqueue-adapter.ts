import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaWorkerEnqueueAdapter,
  type AiGraphicsExternalBetaWorkerEnqueueAdapterInput,
} from '../tool-registry/ai-graphics-external-beta-worker-enqueue-adapter'
import type { AiGraphicsExternalBetaToolCallGateway } from '../tool-registry/ai-graphics-external-beta-tool-call-gateway'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

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

const input: AiGraphicsExternalBetaWorkerEnqueueAdapterInput = {
  sourceExternalBetaToolCallGatewayPacket:
    readJsonFile<AiGraphicsExternalBetaToolCallGateway>('--external-beta-tool-call-gateway-packet'),
  capabilityId: stringFlag('--capability-id') ?? 'background_removal',
  requestedToolId: stringFlag('--requested-tool-id'),
  executionRequested: hasFlag('--execution-requested'),
  externalBetaProjectId: stringFlag('--external-beta-project-id'),
  externalBetaEditPlanId: stringFlag('--external-beta-edit-plan-id'),
  externalBetaToolExecutionPlanId: stringFlag('--external-beta-tool-execution-plan-id'),
  externalBetaBackendQueueAdapterRef: stringFlag('--external-beta-backend-queue-adapter-ref'),
  externalBetaQueueName: stringFlag('--external-beta-queue-name'),
  externalBetaServiceRoleBoundaryRef: stringFlag('--external-beta-service-role-boundary-ref'),
  externalBetaWorkerPayloadSchemaRef: stringFlag('--external-beta-worker-payload-schema-ref'),
  externalBetaPrivateStoragePolicyRef: stringFlag('--external-beta-private-storage-policy-ref'),
  externalBetaRetryPolicyRef: stringFlag('--external-beta-retry-policy-ref'),
  externalBetaDeadLetterPolicyRef: stringFlag('--external-beta-dead-letter-policy-ref'),
}

const report = evaluateAiGraphicsExternalBetaWorkerEnqueueAdapter(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceToolCallGatewayPacketRead:
      Boolean(stringFlag('--external-beta-tool-call-gateway-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
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
