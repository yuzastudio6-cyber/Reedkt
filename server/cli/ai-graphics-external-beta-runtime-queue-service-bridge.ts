import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaRuntimeQueueServiceBridge,
  type AiGraphicsExternalBetaRuntimeQueueServiceBridgeInput,
} from '../tool-registry/ai-graphics-external-beta-runtime-queue-service-bridge'
import type { AiGraphicsExternalBetaLocalQueueStorage } from '../tool-registry/ai-graphics-external-beta-local-queue-storage'

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
  const input: AiGraphicsExternalBetaRuntimeQueueServiceBridgeInput = {
    sourceExternalBetaLocalQueueStoragePacket:
      readJsonFile<AiGraphicsExternalBetaLocalQueueStorage>(
        '--external-beta-local-queue-storage-packet',
      ),
    capabilityId: stringFlag('--capability-id') ?? 'background_removal',
    requestedToolId: stringFlag('--requested-tool-id'),
    executionRequested: hasFlag('--execution-requested'),
    externalBetaRuntimeQueueServiceRef:
      stringFlag('--external-beta-runtime-queue-service-ref'),
    externalBetaRuntimeQueueRpcSchemaRef:
      stringFlag('--external-beta-runtime-queue-rpc-schema-ref'),
    externalBetaWorkerClaimReadinessRef:
      stringFlag('--external-beta-worker-claim-readiness-ref'),
    externalBetaQueueTelemetryRef:
      stringFlag('--external-beta-queue-telemetry-ref'),
  }

  const report = await evaluateAiGraphicsExternalBetaRuntimeQueueServiceBridge(
    input,
  )

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceLocalQueueStoragePacketRead:
        Boolean(stringFlag('--external-beta-local-queue-storage-packet')),
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
