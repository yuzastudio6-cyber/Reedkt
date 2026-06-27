import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaLocalQueueStorage,
  type AiGraphicsExternalBetaLocalQueueStorageInput,
} from '../tool-registry/ai-graphics-external-beta-local-queue-storage'
import type { AiGraphicsExternalBetaServiceRoleQueueTransaction } from '../tool-registry/ai-graphics-external-beta-service-role-queue-transaction'

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
  const input: AiGraphicsExternalBetaLocalQueueStorageInput = {
    sourceExternalBetaServiceRoleQueueTransactionPacket:
      readJsonFile<AiGraphicsExternalBetaServiceRoleQueueTransaction>(
        '--external-beta-service-role-queue-transaction-packet',
      ),
    capabilityId: stringFlag('--capability-id') ?? 'background_removal',
    requestedToolId: stringFlag('--requested-tool-id'),
    executionRequested: hasFlag('--execution-requested'),
    externalBetaLocalQueueStorageRef:
      stringFlag('--external-beta-local-queue-storage-ref'),
    externalBetaMockJobServiceRef: stringFlag('--external-beta-mock-job-service-ref'),
    externalBetaLocalQueueStorageSchemaRef:
      stringFlag('--external-beta-local-queue-storage-schema-ref'),
    externalBetaLocalQueueStorageIsolationRef:
      stringFlag('--external-beta-local-queue-storage-isolation-ref'),
  }

  const report = await evaluateAiGraphicsExternalBetaLocalQueueStorage(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceServiceRoleQueueTransactionPacketRead:
        Boolean(stringFlag('--external-beta-service-role-queue-transaction-packet')),
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
