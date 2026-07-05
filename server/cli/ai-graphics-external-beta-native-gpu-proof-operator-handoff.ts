import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaNativeGpuProofOperatorHandoff,
  type AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-operator-handoff'
import type {
  AiGraphicsExternalBetaNativeGpuProofCollection,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-collection'

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

const input: AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput = {
  sourceNativeGpuProofCollectionPacket:
    readJsonFile<AiGraphicsExternalBetaNativeGpuProofCollection>(
      '--external-beta-native-gpu-proof-collection-packet',
    ),
  operatorRunbookPolicyRef:
    stringFlag('--operator-runbook-policy-ref'),
  operatorAccessControlRef:
    stringFlag('--operator-access-control-ref'),
  nativeGpuHostPoolRef:
    stringFlag('--native-gpu-host-pool-ref'),
  privateModelWeightRootRef:
    stringFlag('--private-model-weight-root-ref'),
  privateTelemetryRef:
    stringFlag('--private-telemetry-ref'),
  rollbackRef:
    stringFlag('--rollback-ref'),
}

const handoff = buildAiGraphicsExternalBetaNativeGpuProofOperatorHandoff(input)

console.log(JSON.stringify({
  ...handoff,
  input: {
    evaluatorOnly: true,
    sourceNativeGpuProofCollectionPacketRead:
      Boolean(stringFlag('--external-beta-native-gpu-proof-collection-packet')),
    operatorRunbookPolicyRefProvided:
      Boolean(stringFlag('--operator-runbook-policy-ref')),
    operatorAccessControlRefProvided:
      Boolean(stringFlag('--operator-access-control-ref')),
    nativeGpuHostPoolRefProvided:
      Boolean(stringFlag('--native-gpu-host-pool-ref')),
    privateModelWeightRootRefProvided:
      Boolean(stringFlag('--private-model-weight-root-ref')),
    privateTelemetryRefProvided:
      Boolean(stringFlag('--private-telemetry-ref')),
    rollbackRefProvided:
      Boolean(stringFlag('--rollback-ref')),
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
    modelInferencePerformed: false,
    mediaProcessingPerformed: false,
    supabaseMutationPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
