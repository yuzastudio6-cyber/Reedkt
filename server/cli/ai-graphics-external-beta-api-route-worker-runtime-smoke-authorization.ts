import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization,
  type AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization'
import type {
  AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof,
} from '../tool-registry/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof'
import type {
  AiGraphicsExternalBetaLiveEnqueueAuthorization,
} from '../tool-registry/ai-graphics-external-beta-live-enqueue-authorization'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationInput = {
  sourceControlledWorkerRuntimeProofPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof>(
      '--external-beta-controlled-worker-runtime-proof-packet',
    ),
  sourceLiveEnqueueAuthorizationPacket:
    readJsonFile<AiGraphicsExternalBetaLiveEnqueueAuthorization>(
      '--external-beta-live-enqueue-authorization-packet',
    ),
  externalBetaWorkerRuntimeSmokeOperatorConfirmationRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-operator-confirmation-ref'),
  externalBetaWorkerRuntimeSmokeEnvironmentRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-environment-ref'),
  externalBetaWorkerRuntimeSmokeRunbookRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-runbook-ref'),
  externalBetaWorkerRuntimeSmokeLeaseTtlPolicyRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-lease-ttl-policy-ref'),
  externalBetaWorkerRuntimeSmokeClaimIsolationRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-claim-isolation-ref'),
  externalBetaWorkerRuntimeSmokePrivateArtifactSandboxRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-private-artifact-sandbox-ref'),
  externalBetaWorkerRuntimeSmokeResultCaptureRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-result-capture-ref'),
  externalBetaWorkerRuntimeSmokeGpuOnDemandPolicyRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-gpu-on-demand-policy-ref'),
  externalBetaWorkerRuntimeSmokeCostGuardrailRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-cost-guardrail-ref'),
  externalBetaWorkerRuntimeSmokeQaGateRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-qa-gate-ref'),
  externalBetaWorkerRuntimeSmokeTelemetryRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-telemetry-ref'),
  externalBetaWorkerRuntimeSmokeRollbackPlanRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-rollback-plan-ref'),
}

const authorization =
  evaluateAiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization(input)

console.log(JSON.stringify({
  ...authorization,
  input: {
    validatorOnly: true,
    validatesSavedProofPacketsOnly: true,
    controlledWorkerRuntimeProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-controlled-worker-runtime-proof-packet')),
    liveEnqueueAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-beta-live-enqueue-authorization-packet')),
    liveWorkerRuntimeSmokeAuthorizedByThisCommand: false,
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
