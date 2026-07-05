import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeProof,
  type AiGraphicsProductionControlledWorkerRuntimeSmokeProofInput,
} from '../tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-proof'
import type {
  AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization,
} from '../tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-authorization'

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
  const input: AiGraphicsProductionControlledWorkerRuntimeSmokeProofInput = {
    sourceProductionControlledWorkerRuntimeSmokeAuthorizationPacket:
      readJsonFile<AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization>(
        '--source-production-controlled-worker-runtime-smoke-authorization-packet',
      ),
    productionControlledWorkerRuntimeSmokeProofRef:
      stringFlag('--production-controlled-worker-runtime-smoke-proof-ref'),
    productionControlledWorkerRuntimeSmokeTelemetryRef:
      stringFlag('--production-controlled-worker-runtime-smoke-telemetry-ref'),
    productionControlledWorkerRuntimeSmokeLeaseLifecycleAuditRef:
      stringFlag('--production-controlled-worker-runtime-smoke-lease-lifecycle-audit-ref'),
    productionControlledWorkerRuntimeSmokeRouteOutputAuditRef:
      stringFlag('--production-controlled-worker-runtime-smoke-route-output-audit-ref'),
    productionControlledWorkerRuntimeSmokePrivateArtifactWriteBlockRef:
      stringFlag('--production-controlled-worker-runtime-smoke-private-artifact-write-block-ref'),
    productionControlledWorkerRuntimeSmokeGpuLifecycleAuditRef:
      stringFlag('--production-controlled-worker-runtime-smoke-gpu-lifecycle-audit-ref'),
    productionControlledWorkerRuntimeSmokeCleanupRef:
      stringFlag('--production-controlled-worker-runtime-smoke-cleanup-ref'),
    productionControlledWorkerRuntimeSmokeWorkerInstanceRef:
      stringFlag('--production-controlled-worker-runtime-smoke-worker-instance-ref'),
  }

  const report =
    await evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeProof(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceProductionControlledWorkerRuntimeSmokeAuthorizationPacketRead:
        Boolean(stringFlag('--source-production-controlled-worker-runtime-smoke-authorization-packet')),
      nonProductionDryRunSmokeProofOnly: true,
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
}

void main()
