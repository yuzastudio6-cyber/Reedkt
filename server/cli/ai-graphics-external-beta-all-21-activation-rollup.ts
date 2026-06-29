import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaAll21ActivationRollup,
} from '../tool-registry/ai-graphics-external-beta-all-21-activation-rollup'
import type {
  AiGraphicsExternalBetaActivationGoNoGo,
} from '../tool-registry/ai-graphics-external-beta-activation-go-no-go'

function valuesAfterRepeatedFlag(flag: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag && process.argv[index + 1]) {
      values.push(process.argv[index + 1])
    }
  }
  return values
}

function readPackets(flag: string): AiGraphicsExternalBetaActivationGoNoGo[] {
  return valuesAfterRepeatedFlag(flag).map((packetPath) =>
    JSON.parse(fs.readFileSync(packetPath, 'utf8')) as
      AiGraphicsExternalBetaActivationGoNoGo,
  )
}

const rollup = evaluateAiGraphicsExternalBetaAll21ActivationRollup({
  activationGoNoGoPackets:
    readPackets('--external-beta-activation-go-no-go-packet'),
})

console.log(JSON.stringify({
  ...rollup,
  input: {
    evaluatorOnly: true,
    activationPacketCount:
      valuesAfterRepeatedFlag('--external-beta-activation-go-no-go-packet').length,
    activationMetadataRollupOnly: true,
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
