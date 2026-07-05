import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission,
  type AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission'
import type {
  AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof'
import type {
  AiGraphicsExternalBetaPrivateArtifactManifest,
} from '../tool-registry/ai-graphics-external-beta-private-artifact-manifest'
import type {
  AiGraphicsExternalBetaToolRouteRuntimeProof,
} from '../tool-registry/ai-graphics-external-beta-tool-route-runtime-proof'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionInput = {
  sourceApiRouteWorkerDispatchHandoffProofPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof>(
      '--external-beta-api-route-worker-dispatch-handoff-proof-packet',
    ),
  sourcePrivateArtifactManifestPacket:
    readJsonFile<AiGraphicsExternalBetaPrivateArtifactManifest>(
      '--external-beta-private-artifact-manifest-packet',
    ),
  sourceToolRouteRuntimeProofPacket:
    readJsonFile<AiGraphicsExternalBetaToolRouteRuntimeProof>(
      '--external-beta-tool-route-runtime-proof-packet',
    ),
  externalBetaArtifactToolRouteAdmissionPolicyRef:
    valueAfterFlag('--external-beta-artifact-tool-route-admission-policy-ref'),
  externalBetaPrivateArtifactWritePolicyRef:
    valueAfterFlag('--external-beta-private-artifact-write-policy-ref'),
  externalBetaPrivateArtifactRetentionPolicyRef:
    valueAfterFlag('--external-beta-private-artifact-retention-policy-ref'),
  externalBetaToolRouteAdmissionPolicyRef:
    valueAfterFlag('--external-beta-tool-route-admission-policy-ref'),
  externalBetaToolRouteExecutionBlockPolicyRef:
    valueAfterFlag('--external-beta-tool-route-execution-block-policy-ref'),
  externalBetaApprovedSnapshotBindingRef:
    valueAfterFlag('--external-beta-approved-snapshot-binding-ref'),
  externalBetaCreditReservationBindingRef:
    valueAfterFlag('--external-beta-credit-reservation-binding-ref'),
  externalBetaGpuOnDemandPolicyRef:
    valueAfterFlag('--external-beta-gpu-on-demand-policy-ref'),
  externalBetaTelemetryRef:
    valueAfterFlag('--external-beta-telemetry-ref'),
  externalBetaRollbackPlanRef:
    valueAfterFlag('--external-beta-rollback-plan-ref'),
}

const admission =
  evaluateAiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission(input)

console.log(JSON.stringify({
  ...admission,
  input: {
    validatorOnly: true,
    validatesSavedProofPacketsOnly: true,
    apiRouteWorkerDispatchHandoffProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-api-route-worker-dispatch-handoff-proof-packet')),
    privateArtifactManifestPacketRead:
      Boolean(valueAfterFlag('--external-beta-private-artifact-manifest-packet')),
    toolRouteRuntimeProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-tool-route-runtime-proof-packet')),
    privateArtifactWritePerformedByThisCommand: false,
    liveToolRouteExecutionPerformedByThisCommand: false,
    liveWorkerLeaseCreatedByThisCommand: false,
    liveProductionWorkerDispatchPerformedByThisCommand: false,
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
