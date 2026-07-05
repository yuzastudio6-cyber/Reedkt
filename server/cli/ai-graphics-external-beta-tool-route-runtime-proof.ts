import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaToolRouteRuntimeProof,
  type AiGraphicsExternalBetaToolRouteRuntimeProofInput,
} from '../tool-registry/ai-graphics-external-beta-tool-route-runtime-proof'
import type {
  AiGraphicsExternalBetaPrivateArtifactManifest,
} from '../tool-registry/ai-graphics-external-beta-private-artifact-manifest'

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

const input: AiGraphicsExternalBetaToolRouteRuntimeProofInput = {
  sourcePrivateArtifactManifestPacket:
    readJsonFile<AiGraphicsExternalBetaPrivateArtifactManifest>(
      '--external-beta-private-artifact-manifest-packet',
    ),
  externalBetaToolRoutePolicyRef:
    stringFlag('--external-beta-tool-route-policy-ref'),
  externalBetaToolRouteSchemaRef:
    stringFlag('--external-beta-tool-route-schema-ref'),
  externalBetaToolRouteAdmissionRef:
    stringFlag('--external-beta-tool-route-admission-ref'),
  externalBetaToolRouteAuthzRef:
    stringFlag('--external-beta-tool-route-authz-ref'),
  externalBetaToolRouteRateLimitRef:
    stringFlag('--external-beta-tool-route-rate-limit-ref'),
  externalBetaToolRouteAuditRef:
    stringFlag('--external-beta-tool-route-audit-ref'),
  externalBetaToolRouteRollbackRef:
    stringFlag('--external-beta-tool-route-rollback-ref'),
}

const proof = buildAiGraphicsExternalBetaToolRouteRuntimeProof(input)

console.log(JSON.stringify({
  ...proof,
  input: {
    evaluatorOnly: true,
    runtimeProofOnlyNoRouteExecution: true,
    sourcePrivateArtifactManifestPacketRead:
      Boolean(stringFlag('--external-beta-private-artifact-manifest-packet')),
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
