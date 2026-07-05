import fs from 'node:fs'
import {
  buildAiGraphicsProductionLaunchReadinessGap,
} from '../tool-registry/ai-graphics-production-launch-readiness-gap'
import type {
  AiGraphicsBetaProductionReadinessRollup,
} from '../tool-registry/ai-graphics-beta-production-readiness-rollup'
import type {
  AiGraphicsExternalBetaActivatedLaunchReadiness,
} from '../tool-registry/ai-graphics-external-beta-activated-launch-readiness'
import type {
  AiGraphicsProductionLaunchControls,
} from '../tool-registry/ai-graphics-production-launch-controls'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const report = buildAiGraphicsProductionLaunchReadinessGap({
  sourceExternalBetaActivatedLaunchReadinessPacket:
    readJsonFile<AiGraphicsExternalBetaActivatedLaunchReadiness>(
      '--external-beta-activated-launch-readiness-packet',
    ),
  sourceBetaProductionReadinessRollupPacket:
    readJsonFile<AiGraphicsBetaProductionReadinessRollup>(
      '--beta-production-readiness-rollup-packet',
    ),
  sourceProductionLaunchControlsPacket:
    readJsonFile<AiGraphicsProductionLaunchControls>(
      '--production-launch-controls-packet',
    ),
})

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceExternalBetaActivatedLaunchReadinessPacketRead:
      Boolean(valueAfterFlag('--external-beta-activated-launch-readiness-packet')),
    sourceBetaProductionReadinessRollupPacketRead:
      Boolean(valueAfterFlag('--beta-production-readiness-rollup-packet')),
    sourceProductionLaunchControlsPacketRead:
      Boolean(valueAfterFlag('--production-launch-controls-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    supabaseMutationPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
