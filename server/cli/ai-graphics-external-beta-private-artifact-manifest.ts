import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaPrivateArtifactManifest,
  type AiGraphicsExternalBetaPrivateArtifactManifestInput,
} from '../tool-registry/ai-graphics-external-beta-private-artifact-manifest'
import type {
  AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile<T>(flag: string): T | undefined {
  const path = stringFlag(flag)
  if (!path) return undefined
  return JSON.parse(fs.readFileSync(path, 'utf8')) as T
}

const input: AiGraphicsExternalBetaPrivateArtifactManifestInput = {
  sourceWorkerDispatchSmokeProofPacket:
    readJsonFile<AiGraphicsExternalBetaWorkerDispatchSmokeProof>(
      '--external-beta-worker-dispatch-smoke-proof-packet',
    ),
  externalBetaPrivateArtifactPolicyRef:
    stringFlag('--external-beta-private-artifact-policy-ref'),
  externalBetaArtifactManifestSchemaRef:
    stringFlag('--external-beta-artifact-manifest-schema-ref'),
  externalBetaStorageNamespaceRef:
    stringFlag('--external-beta-storage-namespace-ref'),
  externalBetaAccessBoundaryRef:
    stringFlag('--external-beta-access-boundary-ref'),
  externalBetaEncryptionPolicyRef:
    stringFlag('--external-beta-encryption-policy-ref'),
  externalBetaRetentionPolicyRef:
    stringFlag('--external-beta-retention-policy-ref'),
  externalBetaArtifactTelemetryRef:
    stringFlag('--external-beta-artifact-telemetry-ref'),
}

const manifest = buildAiGraphicsExternalBetaPrivateArtifactManifest(input)

console.log(JSON.stringify({
  ...manifest,
  input: {
    evaluatorOnly: true,
    manifestOnlyNoStorageMutation: true,
    sourceWorkerDispatchSmokeProofPacketRead:
      Boolean(stringFlag('--external-beta-worker-dispatch-smoke-proof-packet')),
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
