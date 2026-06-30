import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaApiRouteHandlerContract,
  type AiGraphicsExternalBetaApiRouteHandlerContractInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-handler-contract'
import type { AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof } from '../tool-registry/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof'
import type { AiGraphicsExternalBetaControlledOnDemandStatusBridge } from '../tool-registry/ai-graphics-external-beta-controlled-on-demand-status-bridge'

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

async function main(): Promise<void> {
  const toolId = stringFlag('--requested-tool-id') ?? 'sam2'
  const capabilityId = stringFlag('--capability-id') ?? 'subject_segmentation'
  const workspaceId = stringFlag('--workspace-id') ?? 'workspace-fixture'
  const projectId = stringFlag('--project-id') ?? 'project-fixture'
  const requestId = stringFlag('--request-id') ??
    `ai-graphics-external-beta-route-handler-${toolId}`
  const traceId = stringFlag('--trace-id') ??
    `trace-ai-graphics-external-beta-route-handler-${toolId}`
  const idempotencyKey = stringFlag('--idempotency-key') ??
    `ai-graphics:external-beta:route-handler:${workspaceId}:${projectId}:${toolId}`
  const privateArtifactManifestRef =
    stringFlag('--private-artifact-manifest-ref') ??
    `private://ai-graphics/external-beta/${toolId}/artifact-manifest.json`

  const input: AiGraphicsExternalBetaApiRouteHandlerContractInput = {
    sourceExternalBetaControlledOnDemandStatusBridgePacket:
      readJsonFile<AiGraphicsExternalBetaControlledOnDemandStatusBridge>(
        '--controlled-on-demand-status-bridge-packet',
      ),
    sourceExternalBetaApiRouteWorkerDispatchHandoffProofPacket:
      readJsonFile<AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof>(
        '--api-route-worker-dispatch-handoff-proof-packet',
      ),
    request: {
      routeId: 'ai_graphics_external_beta_tool_call',
      method: 'POST',
      routePath: '/api/ai-graphics/external-beta/tool-call',
      requestId,
      workspaceId,
      projectId,
      approvedPlanSnapshotId:
        stringFlag('--approved-plan-snapshot-id') ??
        'approved_snapshot_external_beta_fixture',
      creditReservationId:
        stringFlag('--credit-reservation-id') ??
        'credit_reservation_external_beta_fixture',
      toolId,
      capabilityId,
      privateArtifactManifestRef,
      traceId,
      idempotencyKey,
    },
    externalBetaApiRouteHandlerRef:
      stringFlag('--route-handler-ref') ??
      'backend://ai-graphics/external-beta/tool-call-handler',
    externalBetaApiRouteHandlerSchemaRef:
      stringFlag('--route-handler-schema-ref') ??
      'backend://ai-graphics/external-beta/tool-call-handler-schema',
    externalBetaApiRouteHandlerAuthzRef:
      stringFlag('--route-handler-authz-ref') ??
      'backend://ai-graphics/external-beta/tool-call-handler-authz',
    externalBetaApiRouteHandlerApprovedSnapshotResolverRef:
      stringFlag('--approved-snapshot-resolver-ref') ??
      'backend://ai-graphics/external-beta/approved-snapshot-resolver',
    externalBetaApiRouteHandlerCreditReservationResolverRef:
      stringFlag('--credit-reservation-resolver-ref') ??
      'backend://ai-graphics/external-beta/credit-reservation-resolver',
    externalBetaApiRouteHandlerRateLimitRef:
      stringFlag('--rate-limit-ref') ??
      'backend://ai-graphics/external-beta/tool-call-rate-limit',
    externalBetaApiRouteHandlerCostGuardrailRef:
      stringFlag('--cost-guardrail-ref') ??
      'backend://ai-graphics/external-beta/tool-call-cost-guardrail',
    externalBetaApiRouteHandlerIdempotencyRef:
      stringFlag('--idempotency-ref') ??
      'backend://ai-graphics/external-beta/tool-call-idempotency',
    externalBetaApiRouteHandlerAuditRef:
      stringFlag('--audit-ref') ??
      'backend://ai-graphics/external-beta/tool-call-audit',
    externalBetaApiRouteHandlerPrivateArtifactPolicyRef:
      stringFlag('--private-artifact-policy-ref') ??
      'backend://ai-graphics/external-beta/private-artifact-policy',
    externalBetaApiRouteHandlerKillSwitchRef:
      stringFlag('--kill-switch-ref') ??
      'backend://ai-graphics/external-beta/tool-call-kill-switch',
  }

  const report = evaluateAiGraphicsExternalBetaApiRouteHandlerContract(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceControlledOnDemandStatusBridgePacketRead:
        Boolean(stringFlag('--controlled-on-demand-status-bridge-packet')),
      sourceApiRouteWorkerDispatchHandoffProofPacketRead:
        Boolean(stringFlag('--api-route-worker-dispatch-handoff-proof-packet')),
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
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
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
