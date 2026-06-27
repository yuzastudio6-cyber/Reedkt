import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaWorkerDispatchReadiness,
  type AiGraphicsExternalBetaWorkerDispatchReadinessInput,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-readiness'
import type {
  AiGraphicsExternalBetaServiceRoleQueueSmokeProof,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-proof'

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

const input: AiGraphicsExternalBetaWorkerDispatchReadinessInput = {
  sourceExternalBetaServiceRoleQueueSmokeProofPacket:
    readJsonFile<AiGraphicsExternalBetaServiceRoleQueueSmokeProof>(
      '--external-beta-service-role-queue-smoke-proof-packet',
    ),
  externalBetaWorkerLeasePolicyRef:
    stringFlag('--external-beta-worker-lease-policy-ref'),
  externalBetaWorkerDispatchPolicyRef:
    stringFlag('--external-beta-worker-dispatch-policy-ref'),
  externalBetaWorkerIdempotencyNamespaceRef:
    stringFlag('--external-beta-worker-idempotency-namespace-ref'),
  externalBetaWorkerTelemetryRef:
    stringFlag('--external-beta-worker-telemetry-ref'),
  externalBetaGpuOnDemandPolicyRef:
    stringFlag('--external-beta-gpu-on-demand-policy-ref'),
  externalBetaPrivateArtifactPolicyRef:
    stringFlag('--external-beta-private-artifact-policy-ref'),
}

const report = evaluateAiGraphicsExternalBetaWorkerDispatchReadiness(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceServiceRoleQueueSmokeProofPacketRead:
      Boolean(stringFlag('--external-beta-service-role-queue-smoke-proof-packet')),
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
