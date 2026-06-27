import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaServiceRoleQueueTransaction,
  type AiGraphicsExternalBetaServiceRoleQueueTransactionInput,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-transaction'
import type { AiGraphicsExternalBetaBackendQueueSubmission } from '../tool-registry/ai-graphics-external-beta-backend-queue-submission'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

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

const input: AiGraphicsExternalBetaServiceRoleQueueTransactionInput = {
  sourceExternalBetaBackendQueueSubmissionPacket:
    readJsonFile<AiGraphicsExternalBetaBackendQueueSubmission>(
      '--external-beta-backend-queue-submission-packet',
    ),
  capabilityId: stringFlag('--capability-id') ?? 'background_removal',
  requestedToolId: stringFlag('--requested-tool-id'),
  executionRequested: hasFlag('--execution-requested'),
  externalBetaServiceRoleQueueTransactionRef:
    stringFlag('--external-beta-service-role-queue-transaction-ref'),
  externalBetaServiceRoleRpcSchemaRef:
    stringFlag('--external-beta-service-role-rpc-schema-ref'),
  externalBetaQueueWriteAuthorizationRef:
    stringFlag('--external-beta-queue-write-authorization-ref'),
  externalBetaJobBatchTableRef: stringFlag('--external-beta-job-batch-table-ref'),
  externalBetaJobTableRef: stringFlag('--external-beta-job-table-ref'),
  externalBetaWorkerClaimTableRef:
    stringFlag('--external-beta-worker-claim-table-ref'),
  externalBetaWorkerEventTableRef:
    stringFlag('--external-beta-worker-event-table-ref'),
  externalBetaAuditEventTableRef: stringFlag('--external-beta-audit-event-table-ref'),
  externalBetaServiceRoleRollbackRef:
    stringFlag('--external-beta-service-role-rollback-ref'),
}

const report = evaluateAiGraphicsExternalBetaServiceRoleQueueTransaction(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceBackendQueueSubmissionPacketRead:
      Boolean(stringFlag('--external-beta-backend-queue-submission-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
