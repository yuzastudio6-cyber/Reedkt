import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorization,
  type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationInput,
} from '../routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile(flag: string): Record<string, unknown> | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as Record<string, unknown>
}

const input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationInput = {
  sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket:
    readJsonFile('--route-bound-service-role-queue-smoke-preflight-run-gate-packet'),
  sourceServiceRoleQueueSmokeHarnessPacket:
    readJsonFile('--service-role-queue-smoke-harness-packet'),
  routeBoundServiceRoleQueueSmokeRunbookRef:
    stringFlag('--route-bound-service-role-queue-smoke-runbook-ref'),
  routeBoundServiceRoleQueueSmokeOperatorApprovalRef:
    stringFlag('--route-bound-service-role-queue-smoke-operator-approval-ref'),
  routeBoundServiceRoleQueueSmokeEnvironmentRef:
    stringFlag('--route-bound-service-role-queue-smoke-environment-ref'),
  routeBoundServiceRoleQueueSmokeCredentialHandlingRef:
    stringFlag('--route-bound-service-role-queue-smoke-credential-handling-ref'),
  routeBoundServiceRoleQueueSmokeIdempotencyPlanRef:
    stringFlag('--route-bound-service-role-queue-smoke-idempotency-plan-ref'),
  routeBoundServiceRoleQueueSmokeResultStorageRef:
    stringFlag('--route-bound-service-role-queue-smoke-result-storage-ref'),
  routeBoundServiceRoleQueueSmokeEvidenceStorageRef:
    stringFlag('--route-bound-service-role-queue-smoke-evidence-storage-ref'),
  routeBoundServiceRoleQueueSmokeTelemetryRef:
    stringFlag('--route-bound-service-role-queue-smoke-telemetry-ref'),
  routeBoundServiceRoleQueueSmokeCleanupProofRef:
    stringFlag('--route-bound-service-role-queue-smoke-cleanup-proof-ref'),
  routeBoundServiceRoleQueueSmokeRollbackRef:
    stringFlag('--route-bound-service-role-queue-smoke-rollback-ref'),
  routeBoundServiceRoleQueueSmokeCostCeilingRef:
    stringFlag('--route-bound-service-role-queue-smoke-cost-ceiling-ref'),
  routeBoundServiceRoleQueueSmokePostRunReviewRef:
    stringFlag('--route-bound-service-role-queue-smoke-post-run-review-ref'),
}

const report =
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorization(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacketRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-preflight-run-gate-packet')),
    sourceServiceRoleQueueSmokeHarnessPacketRead:
      Boolean(stringFlag('--service-role-queue-smoke-harness-packet')),
    routeBoundServiceRoleQueueSmokeRunbookRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-runbook-ref')),
    routeBoundServiceRoleQueueSmokeOperatorApprovalRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-operator-approval-ref')),
    routeBoundServiceRoleQueueSmokeEnvironmentRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-environment-ref')),
    routeBoundServiceRoleQueueSmokeCredentialHandlingRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-credential-handling-ref')),
    routeBoundServiceRoleQueueSmokeIdempotencyPlanRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-idempotency-plan-ref')),
    routeBoundServiceRoleQueueSmokeResultStorageRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-result-storage-ref')),
    routeBoundServiceRoleQueueSmokeEvidenceStorageRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-evidence-storage-ref')),
    routeBoundServiceRoleQueueSmokeTelemetryRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-telemetry-ref')),
    routeBoundServiceRoleQueueSmokeCleanupProofRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-cleanup-proof-ref')),
    routeBoundServiceRoleQueueSmokeRollbackRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-rollback-ref')),
    routeBoundServiceRoleQueueSmokeCostCeilingRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-cost-ceiling-ref')),
    routeBoundServiceRoleQueueSmokePostRunReviewRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-post-run-review-ref')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    approvedSnapshotMutationPerformed: false,
    creditReservationMutationPerformed: false,
    privateArtifactWritePerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    supabaseMutationPerformed: false,
    liveQueueWritePerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
