import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaControlledOnDemandStatusBridge,
  type AiGraphicsStatusSourcePacket,
} from '../tool-registry/ai-graphics-external-beta-controlled-on-demand-status-bridge'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile(flag: string): AiGraphicsStatusSourcePacket | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as AiGraphicsStatusSourcePacket
}

const report = evaluateAiGraphicsExternalBetaControlledOnDemandStatusBridge({
  sourceExternalBetaEndToEndReadinessPacket:
    readJsonFile('--external-beta-end-to-end-readiness-packet'),
  sourceBetaProductionReadinessRollupPacket:
    readJsonFile('--beta-production-readiness-rollup-packet'),
  sourceExternalBetaActivatedLaunchReadinessPacket:
    readJsonFile('--external-beta-activated-launch-readiness-packet'),
})

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceExternalBetaEndToEndReadinessPacketRead:
      Boolean(valueAfterFlag('--external-beta-end-to-end-readiness-packet')),
    sourceBetaProductionReadinessRollupPacketRead:
      Boolean(valueAfterFlag('--beta-production-readiness-rollup-packet')),
    sourceExternalBetaActivatedLaunchReadinessPacketRead:
      Boolean(valueAfterFlag('--external-beta-activated-launch-readiness-packet')),
    statusBridgeOnly: true,
    controlledOnDemandExternalBetaReadinessClarified: report.booleans.externalBetaReadyNow,
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
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformedByThisCommand: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    supabaseMutationPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
