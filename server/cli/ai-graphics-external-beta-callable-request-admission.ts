import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaCallableRequestAdmission,
  type AiGraphicsExternalBetaCallableRequestAdmissionInput,
} from '../tool-registry/ai-graphics-external-beta-callable-request-admission'
import type {
  AiGraphicsExternalBetaCallableScope,
} from '../tool-registry/ai-graphics-external-beta-callable-scope'
import type {
  AiGraphicsExternalBetaToolCallGateway,
} from '../tool-registry/ai-graphics-external-beta-tool-call-gateway'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaCallableRequestAdmissionInput = {
  sourceExternalBetaCallableScopePacket:
    readJsonFile<AiGraphicsExternalBetaCallableScope>(
      '--external-beta-callable-scope-packet',
    ),
  sourceExternalBetaToolCallGatewayPacket:
    readJsonFile<AiGraphicsExternalBetaToolCallGateway>(
      '--external-beta-tool-call-gateway-packet',
    ),
}

const requestAdmission = buildAiGraphicsExternalBetaCallableRequestAdmission(input)

console.log(JSON.stringify({
  ...requestAdmission,
  input: {
    evaluatorOnly: true,
    callableScopePacketRead:
      Boolean(valueAfterFlag('--external-beta-callable-scope-packet')),
    toolCallGatewayPacketRead:
      Boolean(valueAfterFlag('--external-beta-tool-call-gateway-packet')),
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
