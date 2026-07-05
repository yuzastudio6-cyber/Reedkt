import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaCandidateEvidenceAssembly,
  type AiGraphicsExternalBetaCandidateEvidenceAssemblyInput,
} from '../tool-registry/ai-graphics-external-beta-candidate-evidence-assembly'
import type {
  AiGraphicsExternalBetaEndToEndReadiness,
} from '../tool-registry/ai-graphics-external-beta-end-to-end-readiness'
import type {
  AiGraphicsExternalBetaPrivateArtifactManifest,
} from '../tool-registry/ai-graphics-external-beta-private-artifact-manifest'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaCandidateEvidenceAssemblyInput = {
  sourceExternalBetaEndToEndReadinessPacket:
    readJsonFile<AiGraphicsExternalBetaEndToEndReadiness>(
      '--external-beta-end-to-end-readiness-packet',
    ),
  sourceExternalBetaPrivateArtifactManifestPacket:
    readJsonFile<AiGraphicsExternalBetaPrivateArtifactManifest>(
      '--external-beta-private-artifact-manifest-packet',
    ),
  candidateEvidenceAssemblyRef:
    valueAfterFlag('--external-beta-candidate-evidence-assembly-ref'),
}

const assembly = buildAiGraphicsExternalBetaCandidateEvidenceAssembly(input)

console.log(JSON.stringify({
  ...assembly,
  input: {
    reportOnly: true,
    externalBetaEndToEndReadinessPacketRead:
      Boolean(valueAfterFlag('--external-beta-end-to-end-readiness-packet')),
    externalBetaPrivateArtifactManifestPacketRead:
      Boolean(valueAfterFlag('--external-beta-private-artifact-manifest-packet')),
    candidateEvidenceAssemblyRefProvided:
      Boolean(valueAfterFlag('--external-beta-candidate-evidence-assembly-ref')),
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
