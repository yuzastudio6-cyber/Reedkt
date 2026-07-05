import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof,
  type AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeResult,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof'
import type {
  AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const proof = evaluateAiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof({
  sourceWorkerRuntimeSmokeAuthorizationPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization>(
      '--external-beta-worker-runtime-smoke-authorization-packet',
    ),
  workerRuntimeSmokeResult:
    readJsonFile<AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeResult>(
      '--external-beta-worker-runtime-smoke-result',
    ),
  workerRuntimeSmokeEvidenceRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-evidence-ref'),
  workerRuntimeSmokeTelemetryRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-telemetry-ref'),
  workerRuntimeSmokeCleanupProofRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-cleanup-proof-ref'),
  workerRuntimeSmokeQaProofRef:
    valueAfterFlag('--external-beta-worker-runtime-smoke-qa-proof-ref'),
})

console.log(JSON.stringify({
  ...proof,
  input: {
    validatorOnly: true,
    workerRuntimeSmokeAuthorizationPacketRead:
      Boolean(valueAfterFlag('--external-beta-worker-runtime-smoke-authorization-packet')),
    workerRuntimeSmokeResultPacketRead:
      Boolean(valueAfterFlag('--external-beta-worker-runtime-smoke-result')),
    liveWorkerRuntimeSmokeExecutedByThisCommand: false,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    apiRouteMountedNow: false,
    apiRouteExecutionPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    supabaseMutationPerformed: false,
    liveQueueWritePerformed: false,
    workerLeaseCreatedByThisCommand: false,
    workerDispatchPerformedByThisCommand: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformedByThisCommand: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
