import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaServiceRoleQueueSmokeReadiness,
  type AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessInput,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-readiness'
import type { AiGraphicsExternalBetaRuntimeQueueServiceBridge } from '../tool-registry/ai-graphics-external-beta-runtime-queue-service-bridge'

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

async function main(): Promise<void> {
  const input: AiGraphicsExternalBetaServiceRoleQueueSmokeReadinessInput = {
    sourceExternalBetaRuntimeQueueServiceBridgePacket:
      readJsonFile<AiGraphicsExternalBetaRuntimeQueueServiceBridge>(
        '--external-beta-runtime-queue-service-bridge-packet',
      ),
    capabilityId: stringFlag('--capability-id') ?? 'background_removal',
    requestedToolId: stringFlag('--requested-tool-id'),
    executionRequested: hasFlag('--execution-requested'),
    externalBetaServiceRoleQueueSmokeRef:
      stringFlag('--external-beta-service-role-queue-smoke-ref'),
    externalBetaServiceRoleQueueSmokeEnvironmentRef:
      stringFlag('--external-beta-service-role-queue-smoke-environment-ref'),
    externalBetaServiceRoleQueueSmokeOwnerApprovalRef:
      stringFlag('--external-beta-service-role-queue-smoke-owner-approval-ref'),
    externalBetaServiceRoleQueueSmokeRollbackRef:
      stringFlag('--external-beta-service-role-queue-smoke-rollback-ref'),
    externalBetaServiceRoleQueueSmokeCleanupRef:
      stringFlag('--external-beta-service-role-queue-smoke-cleanup-ref'),
    externalBetaServiceRoleQueueSmokeTelemetryRef:
      stringFlag('--external-beta-service-role-queue-smoke-telemetry-ref'),
  }

  const report =
    await evaluateAiGraphicsExternalBetaServiceRoleQueueSmokeReadiness(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceRuntimeQueueServiceBridgePacketRead:
        Boolean(stringFlag('--external-beta-runtime-queue-service-bridge-packet')),
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
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
