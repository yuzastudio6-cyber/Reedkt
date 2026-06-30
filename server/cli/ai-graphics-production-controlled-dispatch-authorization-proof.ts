import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionControlledDispatchAuthorizationProof,
  type AiGraphicsProductionControlledDispatchAuthorizationProofInput,
} from '../tool-registry/ai-graphics-production-controlled-dispatch-authorization-proof'
import type {
  AiGraphicsProductionServiceRoleQueueTransactionDryProof,
} from '../tool-registry/ai-graphics-production-service-role-queue-transaction-dry-proof'

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

const input: AiGraphicsProductionControlledDispatchAuthorizationProofInput = {
  sourceProductionServiceRoleQueueTransactionDryProofPacket:
    readJsonFile<AiGraphicsProductionServiceRoleQueueTransactionDryProof>(
      '--source-production-service-role-queue-transaction-dry-proof-packet',
    ),
  executionRequested: hasFlag('--execution-requested'),
  productionControlledDispatchAuthorizationGranted:
    hasFlag('--production-controlled-dispatch-authorization-granted'),
  productionControlledDispatchAuthorizationRef:
    stringFlag('--production-controlled-dispatch-authorization-ref'),
  productionControlledDispatchOperatorRole:
    stringFlag('--production-controlled-dispatch-operator-role'),
  productionWorkerLeaseApprovalRef:
    stringFlag('--production-worker-lease-approval-ref'),
  productionWorkerDispatchApprovalRef:
    stringFlag('--production-worker-dispatch-approval-ref'),
  productionToolRouteExecutionBlockRef:
    stringFlag('--production-tool-route-execution-block-ref'),
  productionPrivateArtifactRuntimeBindingRef:
    stringFlag('--production-private-artifact-runtime-binding-ref'),
  productionCostGuardrailRuntimeRef:
    stringFlag('--production-cost-guardrail-runtime-ref'),
  productionTelemetryRuntimeRef:
    stringFlag('--production-telemetry-runtime-ref'),
  productionRollbackRuntimeRef:
    stringFlag('--production-rollback-runtime-ref'),
  productionPostDispatchReviewRef:
    stringFlag('--production-post-dispatch-review-ref'),
}

const report =
  evaluateAiGraphicsProductionControlledDispatchAuthorizationProof(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceProductionServiceRoleQueueTransactionDryProofPacketRead:
      Boolean(stringFlag('--source-production-service-role-queue-transaction-dry-proof-packet')),
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
