import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaPerToolCallableResultGate,
  type AiGraphicsExternalBetaPerToolCallableResult,
} from '../tool-registry/ai-graphics-external-beta-per-tool-callable-result-gate'
import type {
  AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof,
} from '../tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const gate = evaluateAiGraphicsExternalBetaPerToolCallableResultGate({
  sourceWorkerRuntimeSmokeProofPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof>(
      '--external-beta-worker-runtime-smoke-proof-packet',
    ),
  perToolCallableResult:
    readJsonFile<AiGraphicsExternalBetaPerToolCallableResult>(
      '--external-beta-per-tool-callable-result',
    ),
  perToolCallableResultEvidenceRef:
    valueAfterFlag('--external-beta-per-tool-callable-result-evidence-ref'),
  perToolCallableResultQaRef:
    valueAfterFlag('--external-beta-per-tool-callable-result-qa-ref'),
  perToolCallableResultCostRef:
    valueAfterFlag('--external-beta-per-tool-callable-result-cost-ref'),
  perToolCallableResultRollbackRef:
    valueAfterFlag('--external-beta-per-tool-callable-result-rollback-ref'),
})

console.log(JSON.stringify({
  ...gate,
  input: {
    validatorOnly: true,
    sourceWorkerRuntimeSmokeProofPacketRead:
      Boolean(valueAfterFlag('--external-beta-worker-runtime-smoke-proof-packet')),
    perToolCallableResultPacketRead:
      Boolean(valueAfterFlag('--external-beta-per-tool-callable-result')),
    liveApiRouteExecutionPerformedByThisCommand: false,
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
