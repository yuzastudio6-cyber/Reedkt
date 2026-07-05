import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionWorkerQueueAdmission,
  type AiGraphicsProductionWorkerQueueAdmissionInput,
} from '../tool-registry/ai-graphics-production-worker-queue-admission'
import type { AiGraphicsProductionToolCallGatewayHandoff } from '../tool-registry/ai-graphics-production-tool-call-gateway-handoff'
import type { AiGraphicsProductionTrafficCutover } from '../tool-registry/ai-graphics-production-traffic-cutover'

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

const input: AiGraphicsProductionWorkerQueueAdmissionInput = {
  sourceProductionToolCallGatewayHandoffPacket:
    readJsonFile<AiGraphicsProductionToolCallGatewayHandoff>(
      '--source-production-tool-call-gateway-handoff-packet',
    ),
  sourceProductionTrafficCutoverPacket:
    readJsonFile<AiGraphicsProductionTrafficCutover>(
      '--source-production-traffic-cutover-packet',
    ),
  capabilityId: stringFlag('--capability-id'),
  requestedToolId: stringFlag('--requested-tool-id'),
  executionRequested: hasFlag('--execution-requested'),
  productionWorkspaceId: stringFlag('--production-workspace-id'),
  productionProjectId: stringFlag('--production-project-id'),
  productionRequestId: stringFlag('--production-request-id'),
  productionEditPlanId: stringFlag('--production-edit-plan-id'),
  productionToolExecutionPlanId: stringFlag('--production-tool-execution-plan-id'),
  approvedPlanSnapshotId: stringFlag('--approved-plan-snapshot-id'),
  creditReservationId: stringFlag('--credit-reservation-id'),
  productionRoutePath: stringFlag('--production-route-path'),
  productionQueueName: stringFlag('--production-queue-name'),
  productionGatewayHandoffRef: stringFlag('--production-gateway-handoff-ref'),
  productionWorkerHandoffCandidateRef:
    stringFlag('--production-worker-handoff-candidate-ref'),
  productionToolRouteApprovalRef:
    stringFlag('--production-tool-route-approval-ref'),
  productionWorkerApprovalRef: stringFlag('--production-worker-approval-ref'),
  productionRuntimeAdmissionRef: stringFlag('--production-runtime-admission-ref'),
  productionServiceRoleBoundaryRef:
    stringFlag('--production-service-role-boundary-ref'),
  productionPrivateArtifactManifestRef:
    stringFlag('--production-private-artifact-manifest-ref'),
  productionAssetManifestRef: stringFlag('--production-asset-manifest-ref'),
  productionDependencyGraphRef: stringFlag('--production-dependency-graph-ref'),
  productionCostGuardrailDecisionRef:
    stringFlag('--production-cost-guardrail-decision-ref'),
  productionQaPolicyRef: stringFlag('--production-qa-policy-ref'),
  productionFallbackPolicyRef: stringFlag('--production-fallback-policy-ref'),
  productionCheckbackPolicyRef: stringFlag('--production-checkback-policy-ref'),
  productionTraceId: stringFlag('--production-trace-id'),
  productionQueueAdmissionRef: stringFlag('--production-queue-admission-ref'),
  productionQueueSchemaRef: stringFlag('--production-queue-schema-ref'),
  productionQueueWriteAuthorizationRef:
    stringFlag('--production-queue-write-authorization-ref'),
  productionServiceRoleTransactionRef:
    stringFlag('--production-service-role-transaction-ref'),
  productionWorkerClaimPolicyRef:
    stringFlag('--production-worker-claim-policy-ref'),
  productionWorkerDispatchBlockRef:
    stringFlag('--production-worker-dispatch-block-ref'),
  productionQueueAuditRef: stringFlag('--production-queue-audit-ref'),
  productionQueueRollbackRef: stringFlag('--production-queue-rollback-ref'),
  productionQueueObservabilityRef:
    stringFlag('--production-queue-observability-ref'),
}

const report = evaluateAiGraphicsProductionWorkerQueueAdmission(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceProductionToolCallGatewayHandoffPacketRead:
      Boolean(stringFlag('--source-production-tool-call-gateway-handoff-packet')),
    sourceProductionTrafficCutoverPacketRead:
      Boolean(stringFlag('--source-production-traffic-cutover-packet')),
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
