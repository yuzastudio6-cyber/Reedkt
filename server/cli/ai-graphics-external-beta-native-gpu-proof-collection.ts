import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaNativeGpuProofCollection,
  type AiGraphicsExternalBetaNativeGpuProofCollectionInput,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-collection'
import type {
  AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector'
import type {
  AiGraphicsExternalBetaPerToolRuntimeProof,
} from '../tool-registry/ai-graphics-external-beta-per-tool-runtime-proof'
import type {
  AiGraphicsGpuRuntimeProofCommandPlan,
} from '../tool-registry/ai-graphics-gpu-runtime-proof-command-plan'
import type {
  AiGraphicsGpuRuntimeProofResultPacket,
} from '../tool-registry/ai-graphics-gpu-runtime-proof-result'
import type {
  AiGraphicsModelWeightChecksumEvidencePacket,
} from '../tool-registry/ai-graphics-model-weight-checksum-evidence'
import type {
  AiGraphicsModelWeightManifestReviewPacket,
} from '../tool-registry/ai-graphics-model-weight-manifest-readiness'
import type {
  AiGraphicsModelWeightPrivateEvidenceIntakePacket,
} from '../tool-registry/ai-graphics-model-weight-private-evidence-intake'

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

const input: AiGraphicsExternalBetaNativeGpuProofCollectionInput = {
  sourcePerToolRuntimeProofPacket:
    readJsonFile<AiGraphicsExternalBetaPerToolRuntimeProof>(
      '--external-beta-per-tool-runtime-proof-packet',
    ),
  gpuRuntimeProofCommandPlanPacket:
    readJsonFile<AiGraphicsGpuRuntimeProofCommandPlan>(
      '--gpu-runtime-proof-command-plan-packet',
    ),
  modelWeightChecksumEvidencePacket:
    readJsonFile<AiGraphicsModelWeightChecksumEvidencePacket>(
      '--model-weight-checksum-evidence-packet',
    ),
  modelWeightManifestReviewPacket:
    readJsonFile<AiGraphicsModelWeightManifestReviewPacket>(
      '--model-weight-manifest-review-packet',
    ),
  modelWeightPrivateEvidenceIntakePacket:
    readJsonFile<AiGraphicsModelWeightPrivateEvidenceIntakePacket>(
      '--model-weight-private-evidence-intake-packet',
    ),
  gpuRuntimeProofResultPacket:
    readJsonFile<AiGraphicsGpuRuntimeProofResultPacket>(
      '--gpu-runtime-proof-result-packet',
    ),
  cloudRunResultCollectorPacket:
    readJsonFile<AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket>(
      '--cloud-run-result-collector-packet',
    ),
  externalBetaNativeGpuProofCollectionPolicyRef:
    stringFlag('--external-beta-native-gpu-proof-collection-policy-ref'),
  externalBetaNativeGpuProofCollectionSchemaRef:
    stringFlag('--external-beta-native-gpu-proof-collection-schema-ref'),
  externalBetaNativeGpuProofCollectionHostPoolRef:
    stringFlag('--external-beta-native-gpu-proof-collection-host-pool-ref'),
  externalBetaNativeGpuProofCollectionPrivateArtifactNamespaceRef:
    stringFlag('--external-beta-native-gpu-proof-collection-private-artifact-namespace-ref'),
  externalBetaNativeGpuProofCollectionTelemetryRef:
    stringFlag('--external-beta-native-gpu-proof-collection-telemetry-ref'),
  externalBetaNativeGpuProofCollectionRollbackRef:
    stringFlag('--external-beta-native-gpu-proof-collection-rollback-ref'),
}

const collection = buildAiGraphicsExternalBetaNativeGpuProofCollection(input)

console.log(JSON.stringify({
  ...collection,
  input: {
    evaluatorOnly: true,
    sourcePerToolRuntimeProofPacketRead:
      Boolean(stringFlag('--external-beta-per-tool-runtime-proof-packet')),
    gpuRuntimeProofCommandPlanPacketRead:
      Boolean(stringFlag('--gpu-runtime-proof-command-plan-packet')),
    modelWeightChecksumEvidencePacketRead:
      Boolean(stringFlag('--model-weight-checksum-evidence-packet')),
    modelWeightManifestReviewPacketRead:
      Boolean(stringFlag('--model-weight-manifest-review-packet')),
    modelWeightPrivateEvidenceIntakePacketRead:
      Boolean(stringFlag('--model-weight-private-evidence-intake-packet')),
    gpuRuntimeProofResultPacketRead:
      Boolean(stringFlag('--gpu-runtime-proof-result-packet')),
    cloudRunResultCollectorPacketRead:
      Boolean(stringFlag('--cloud-run-result-collector-packet')),
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
