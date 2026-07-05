import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof,
  type AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof'
import type {
  AiGraphicsExternalBetaApiRouteQueueSmokeProof,
} from '../tool-registry/ai-graphics-external-beta-api-route-queue-smoke-proof'
import type {
  AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofInput = {
  sourceExternalBetaApiRouteQueueSmokeProofPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteQueueSmokeProof>(
      '--external-beta-api-route-queue-smoke-proof-packet',
    ),
  sourceExternalBetaWorkerDispatchSmokeProofPacket:
    readJsonFile<AiGraphicsExternalBetaWorkerDispatchSmokeProof>(
      '--external-beta-worker-dispatch-smoke-proof-packet',
    ),
  externalBetaRouteWorkerDispatchHandoffPolicyRef:
    valueAfterFlag('--external-beta-route-worker-dispatch-handoff-policy-ref'),
  externalBetaWorkerLeasePolicyRef:
    valueAfterFlag('--external-beta-worker-lease-policy-ref'),
  externalBetaWorkerDispatchPolicyRef:
    valueAfterFlag('--external-beta-worker-dispatch-policy-ref'),
  externalBetaWorkerIdempotencyPolicyRef:
    valueAfterFlag('--external-beta-worker-idempotency-policy-ref'),
  externalBetaGpuOnDemandPolicyRef:
    valueAfterFlag('--external-beta-gpu-on-demand-policy-ref'),
  externalBetaPrivateArtifactPolicyRef:
    valueAfterFlag('--external-beta-private-artifact-policy-ref'),
  externalBetaTelemetryRef:
    valueAfterFlag('--external-beta-telemetry-ref'),
  externalBetaRollbackPlanRef:
    valueAfterFlag('--external-beta-rollback-plan-ref'),
}

const proof =
  evaluateAiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof(input)

console.log(JSON.stringify({
  ...proof,
  input: {
    validatorOnly: true,
    validatesSavedProofPacketsOnly: true,
    apiRouteQueueSmokeProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-api-route-queue-smoke-proof-packet')),
    workerDispatchSmokeProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-worker-dispatch-smoke-proof-packet')),
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
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
