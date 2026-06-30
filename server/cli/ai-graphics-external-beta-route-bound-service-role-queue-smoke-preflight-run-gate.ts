import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGate,
  type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateInput,
} from '../routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate'

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

const input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateInput = {
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket:
    readJsonFile('--route-bound-service-role-queue-smoke-authorization-bridge-packet'),
  sourceServiceRoleQueueSmokePreflightPacket:
    readJsonFile('--service-role-queue-smoke-preflight-packet'),
  routeBoundServiceRoleQueueSmokeRunGateRef:
    stringFlag('--route-bound-service-role-queue-smoke-run-gate-ref'),
  routeBoundServiceRoleQueueSmokeOperatorRef:
    stringFlag('--route-bound-service-role-queue-smoke-operator-ref'),
  routeBoundServiceRoleQueueSmokeReadinessRef:
    stringFlag('--route-bound-service-role-queue-smoke-readiness-ref'),
  routeBoundServiceRoleQueueSmokePreflightRef:
    stringFlag('--route-bound-service-role-queue-smoke-preflight-ref'),
  routeBoundServiceRoleQueueSmokeEnvironmentRef:
    stringFlag('--route-bound-service-role-queue-smoke-environment-ref'),
  routeBoundServiceRoleQueueSmokeRouteExecutionWindowRef:
    stringFlag('--route-bound-service-role-queue-smoke-route-execution-window-ref'),
  routeBoundServiceRoleQueueSmokeQueueWriteWindowRef:
    stringFlag('--route-bound-service-role-queue-smoke-queue-write-window-ref'),
  routeBoundServiceRoleQueueSmokeCleanupPlanRef:
    stringFlag('--route-bound-service-role-queue-smoke-cleanup-plan-ref'),
  routeBoundServiceRoleQueueSmokeRollbackPlanRef:
    stringFlag('--route-bound-service-role-queue-smoke-rollback-plan-ref'),
  routeBoundServiceRoleQueueSmokeTelemetryRef:
    stringFlag('--route-bound-service-role-queue-smoke-telemetry-ref'),
  routeBoundServiceRoleQueueSmokeCostCeilingRef:
    stringFlag('--route-bound-service-role-queue-smoke-cost-ceiling-ref'),
}

const report =
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGate(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacketRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-authorization-bridge-packet')),
    sourceServiceRoleQueueSmokePreflightPacketRead:
      Boolean(stringFlag('--service-role-queue-smoke-preflight-packet')),
    routeBoundServiceRoleQueueSmokeRunGateRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-run-gate-ref')),
    routeBoundServiceRoleQueueSmokeOperatorRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-operator-ref')),
    routeBoundServiceRoleQueueSmokeReadinessRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-readiness-ref')),
    routeBoundServiceRoleQueueSmokePreflightRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-preflight-ref')),
    routeBoundServiceRoleQueueSmokeEnvironmentRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-environment-ref')),
    routeBoundServiceRoleQueueSmokeRouteExecutionWindowRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-route-execution-window-ref')),
    routeBoundServiceRoleQueueSmokeQueueWriteWindowRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-queue-write-window-ref')),
    routeBoundServiceRoleQueueSmokeCleanupPlanRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-cleanup-plan-ref')),
    routeBoundServiceRoleQueueSmokeRollbackPlanRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-rollback-plan-ref')),
    routeBoundServiceRoleQueueSmokeTelemetryRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-telemetry-ref')),
    routeBoundServiceRoleQueueSmokeCostCeilingRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-cost-ceiling-ref')),
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
