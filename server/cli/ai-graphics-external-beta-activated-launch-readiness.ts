import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaActivatedLaunchReadiness,
} from '../tool-registry/ai-graphics-external-beta-activated-launch-readiness'
import type {
  AiGraphicsExternalBetaAll21ActivationRollup,
} from '../tool-registry/ai-graphics-external-beta-all-21-activation-rollup'
import type {
  AiGraphicsExternalBetaLaunchGoNoGo,
} from '../tool-registry/ai-graphics-external-beta-launch-go-no-go'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const report = evaluateAiGraphicsExternalBetaActivatedLaunchReadiness({
  sourceExternalBetaLaunchGoNoGoPacket:
    readJsonFile<AiGraphicsExternalBetaLaunchGoNoGo>(
      '--external-beta-launch-go-no-go-packet',
    ),
  sourceExternalBetaAll21ActivationRollupPacket:
    readJsonFile<AiGraphicsExternalBetaAll21ActivationRollup>(
      '--external-beta-all-21-activation-rollup-packet',
    ),
})

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceLaunchGoNoGoPacketRead:
      Boolean(valueAfterFlag('--external-beta-launch-go-no-go-packet')),
    sourceAll21ActivationRollupPacketRead:
      Boolean(valueAfterFlag('--external-beta-all-21-activation-rollup-packet')),
    activationMetadataConsumerOnly: true,
    controlledTrafficRunExecutedByThisCommand: false,
    externalBetaTrafficSwitchEnabledByThisCommand: false,
    externalBetaRuntimeSoakStartedByThisCommand: false,
    directAgentToolExecutionPerformed: false,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    apiRouteExecutionPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    privateArtifactWritePerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    supabaseMutationPerformed: false,
    liveQueueWritePerformed: false,
    workerLeaseCreatedByThisCommand: false,
    workerDispatchPerformedByThisCommand: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformedByThisCommand: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
