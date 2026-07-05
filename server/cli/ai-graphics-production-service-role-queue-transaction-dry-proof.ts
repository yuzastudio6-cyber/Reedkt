import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionServiceRoleQueueTransactionDryProof,
  type AiGraphicsProductionServiceRoleQueueTransactionDryProofInput,
} from '../tool-registry/ai-graphics-production-service-role-queue-transaction-dry-proof'
import type {
  AiGraphicsProductionWorkerQueueAdmission,
} from '../tool-registry/ai-graphics-production-worker-queue-admission'

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

const input: AiGraphicsProductionServiceRoleQueueTransactionDryProofInput = {
  sourceProductionWorkerQueueAdmissionPacket:
    readJsonFile<AiGraphicsProductionWorkerQueueAdmission>(
      '--source-production-worker-queue-admission-packet',
    ),
  executionRequested: hasFlag('--execution-requested'),
  productionServiceRoleQueueTransactionRef:
    stringFlag('--production-service-role-queue-transaction-ref'),
  productionServiceRoleRpcSchemaRef:
    stringFlag('--production-service-role-rpc-schema-ref'),
  productionJobBatchTableRef: stringFlag('--production-job-batch-table-ref'),
  productionJobTableRef: stringFlag('--production-job-table-ref'),
  productionWorkerClaimTableRef:
    stringFlag('--production-worker-claim-table-ref'),
  productionWorkerEventTableRef:
    stringFlag('--production-worker-event-table-ref'),
  productionAuditEventTableRef:
    stringFlag('--production-audit-event-table-ref'),
  productionServiceRoleRollbackRef:
    stringFlag('--production-service-role-rollback-ref'),
  productionDispatchDryProofRef:
    stringFlag('--production-dispatch-dry-proof-ref'),
  productionWorkerInstanceRef: stringFlag('--production-worker-instance-ref'),
  productionWorkerLeasePolicyRef:
    stringFlag('--production-worker-lease-policy-ref'),
  productionWorkerDispatchPolicyRef:
    stringFlag('--production-worker-dispatch-policy-ref'),
}

const report =
  evaluateAiGraphicsProductionServiceRoleQueueTransactionDryProof(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceProductionWorkerQueueAdmissionPacketRead:
      Boolean(stringFlag('--source-production-worker-queue-admission-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
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
