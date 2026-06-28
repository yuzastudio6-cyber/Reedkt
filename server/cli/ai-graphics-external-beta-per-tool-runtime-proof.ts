import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaPerToolRuntimeProof,
  type AiGraphicsExternalBetaPerToolRuntimeProofInput,
  type AiGraphicsRuntimeProofPacket,
} from '../tool-registry/ai-graphics-external-beta-per-tool-runtime-proof'
import type {
  AiGraphicsExternalBetaToolRouteRuntimeProof,
} from '../tool-registry/ai-graphics-external-beta-tool-route-runtime-proof'
import type {
  AiGraphicsExternalBetaNativeGpuProofCollection,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-collection'
import type {
  AiGraphicsGpuRuntimeProofResultPacket,
} from '../tool-registry/ai-graphics-gpu-runtime-proof-result'

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

const input: AiGraphicsExternalBetaPerToolRuntimeProofInput = {
  sourceToolRouteRuntimeProofPacket:
    readJsonFile<AiGraphicsExternalBetaToolRouteRuntimeProof>(
      '--external-beta-tool-route-runtime-proof-packet',
    ),
  nodeRuntimeProofPacket:
    readJsonFile<AiGraphicsRuntimeProofPacket>('--node-runtime-proof-packet'),
  browserRuntimeProofPacket:
    readJsonFile<AiGraphicsRuntimeProofPacket>('--browser-runtime-proof-packet'),
  satoriFontRuntimeProofPacket:
    readJsonFile<AiGraphicsRuntimeProofPacket>('--satori-font-runtime-proof-packet'),
  gpuRuntimeProofResultPacket:
    readJsonFile<AiGraphicsGpuRuntimeProofResultPacket>('--gpu-runtime-proof-result-packet'),
  sourceExternalBetaNativeGpuProofCollectionPacket:
    readJsonFile<AiGraphicsExternalBetaNativeGpuProofCollection>(
      '--external-beta-native-gpu-proof-collection-packet',
    ),
  externalBetaPerToolRuntimeProofPolicyRef:
    stringFlag('--external-beta-per-tool-runtime-proof-policy-ref'),
  externalBetaPerToolRuntimeProofSchemaRef:
    stringFlag('--external-beta-per-tool-runtime-proof-schema-ref'),
  externalBetaRuntimeProofEvidenceRef:
    stringFlag('--external-beta-runtime-proof-evidence-ref'),
  externalBetaRuntimeProofTelemetryRef:
    stringFlag('--external-beta-runtime-proof-telemetry-ref'),
  externalBetaRuntimeProofRollbackRef:
    stringFlag('--external-beta-runtime-proof-rollback-ref'),
}

const proof = buildAiGraphicsExternalBetaPerToolRuntimeProof(input)

console.log(JSON.stringify({
  ...proof,
  input: {
    evaluatorOnly: true,
    runtimeProofOnlyNoToolExecution: true,
    sourceToolRouteRuntimeProofPacketRead:
      Boolean(stringFlag('--external-beta-tool-route-runtime-proof-packet')),
    nodeRuntimeProofPacketRead: Boolean(stringFlag('--node-runtime-proof-packet')),
    browserRuntimeProofPacketRead: Boolean(stringFlag('--browser-runtime-proof-packet')),
    satoriFontRuntimeProofPacketRead:
      Boolean(stringFlag('--satori-font-runtime-proof-packet')),
    gpuRuntimeProofResultPacketRead:
      Boolean(stringFlag('--gpu-runtime-proof-result-packet')),
    sourceExternalBetaNativeGpuProofCollectionPacketRead:
      Boolean(stringFlag('--external-beta-native-gpu-proof-collection-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueSmokePerformed: false,
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
