import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaCallableScope,
  type AiGraphicsExternalBetaCallableScopeInput,
} from '../tool-registry/ai-graphics-external-beta-callable-scope'
import type {
  AiGraphicsExternalBetaLaunchGoNoGo,
} from '../tool-registry/ai-graphics-external-beta-launch-go-no-go'
import type {
  AiGraphicsExternalBetaLiveEnqueueAuthorization,
} from '../tool-registry/ai-graphics-external-beta-live-enqueue-authorization'
import type {
  AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaCallableScopeInput = {
  sourceExternalBetaLaunchGoNoGoPacket:
    readJsonFile<AiGraphicsExternalBetaLaunchGoNoGo>(
      '--external-beta-launch-go-no-go-packet',
    ),
  sourceExternalBetaLiveEnqueueAuthorizationPacket:
    readJsonFile<AiGraphicsExternalBetaLiveEnqueueAuthorization>(
      '--external-beta-live-enqueue-authorization-packet',
    ),
  sourceExternalBetaWorkerDispatchSmokeProofPacket:
    readJsonFile<AiGraphicsExternalBetaWorkerDispatchSmokeProof>(
      '--external-beta-worker-dispatch-smoke-proof-packet',
    ),
}

const callableScope = buildAiGraphicsExternalBetaCallableScope(input)

console.log(JSON.stringify({
  ...callableScope,
  input: {
    evaluatorOnly: true,
    launchGoNoGoPacketRead:
      Boolean(valueAfterFlag('--external-beta-launch-go-no-go-packet')),
    liveEnqueueAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-beta-live-enqueue-authorization-packet')),
    workerDispatchSmokeProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-worker-dispatch-smoke-proof-packet')),
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
