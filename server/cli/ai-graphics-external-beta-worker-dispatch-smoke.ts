import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaWorkerDispatchSmoke,
  type AiGraphicsExternalBetaWorkerDispatchSmokeInput,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke'
import type {
  AiGraphicsExternalBetaWorkerDispatchReadiness,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-readiness'

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

async function main() {
  const input: AiGraphicsExternalBetaWorkerDispatchSmokeInput = {
    sourceExternalBetaWorkerDispatchReadinessPacket:
      readJsonFile<AiGraphicsExternalBetaWorkerDispatchReadiness>(
        '--external-beta-worker-dispatch-readiness-packet',
      ),
    externalBetaWorkerDispatchSmokeRef:
      stringFlag('--external-beta-worker-dispatch-smoke-ref'),
    externalBetaWorkerDispatchSmokeTelemetryRef:
      stringFlag('--external-beta-worker-dispatch-smoke-telemetry-ref'),
    externalBetaWorkerDispatchSmokeLeaseAuditRef:
      stringFlag('--external-beta-worker-dispatch-smoke-lease-audit-ref'),
    externalBetaWorkerDispatchSmokeCleanupRef:
      stringFlag('--external-beta-worker-dispatch-smoke-cleanup-ref'),
    externalBetaWorkerInstancePrefix:
      stringFlag('--external-beta-worker-instance-prefix'),
  }

  const report = await evaluateAiGraphicsExternalBetaWorkerDispatchSmoke(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      mockDispatcherSmokeOnly: true,
      sourceWorkerDispatchReadinessPacketRead:
        Boolean(stringFlag('--external-beta-worker-dispatch-readiness-packet')),
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }, null, 2))
}

void main()
