import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof,
  type AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof'
import type {
  AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission'
import type {
  AiGraphicsExternalBetaPerToolRuntimeProof,
} from '../tool-registry/ai-graphics-external-beta-per-tool-runtime-proof'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofInput = {
  sourceArtifactToolRouteAdmissionPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission>(
      '--external-beta-artifact-tool-route-admission-packet',
    ),
  sourcePerToolRuntimeProofPacket:
    readJsonFile<AiGraphicsExternalBetaPerToolRuntimeProof>(
      '--external-beta-per-tool-runtime-proof-packet',
    ),
  externalBetaControlledWorkerRuntimeProofPolicyRef:
    valueAfterFlag('--external-beta-controlled-worker-runtime-proof-policy-ref'),
  externalBetaWorkerLeasePolicyRef:
    valueAfterFlag('--external-beta-worker-lease-policy-ref'),
  externalBetaWorkerDispatchBlockPolicyRef:
    valueAfterFlag('--external-beta-worker-dispatch-block-policy-ref'),
  externalBetaPrivateArtifactWriteBlockPolicyRef:
    valueAfterFlag('--external-beta-private-artifact-write-block-policy-ref'),
  externalBetaRuntimeResultCapturePolicyRef:
    valueAfterFlag('--external-beta-runtime-result-capture-policy-ref'),
  externalBetaToolExecutionBlockPolicyRef:
    valueAfterFlag('--external-beta-tool-execution-block-policy-ref'),
  externalBetaGpuOnDemandPolicyRef:
    valueAfterFlag('--external-beta-gpu-on-demand-policy-ref'),
  externalBetaCostGuardrailRef:
    valueAfterFlag('--external-beta-cost-guardrail-ref'),
  externalBetaQaGatePolicyRef:
    valueAfterFlag('--external-beta-qa-gate-policy-ref'),
  externalBetaTelemetryRef:
    valueAfterFlag('--external-beta-telemetry-ref'),
  externalBetaRollbackPlanRef:
    valueAfterFlag('--external-beta-rollback-plan-ref'),
}

const proof =
  evaluateAiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof(input)

console.log(JSON.stringify({
  ...proof,
  input: {
    validatorOnly: true,
    validatesSavedProofPacketsOnly: true,
    artifactToolRouteAdmissionPacketRead:
      Boolean(valueAfterFlag('--external-beta-artifact-tool-route-admission-packet')),
    perToolRuntimeProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-per-tool-runtime-proof-packet')),
    liveWorkerLeaseCreatedByThisCommand: false,
    liveProductionWorkerDispatchPerformedByThisCommand: false,
    liveToolExecutionPerformedByThisCommand: false,
    privateArtifactWritePerformedByThisCommand: false,
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
