import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionControlledWorkerDispatchSmokeProof,
  type AiGraphicsProductionControlledWorkerDispatchSmokeProofInput,
} from '../tool-registry/ai-graphics-production-controlled-worker-dispatch-smoke-proof'
import type {
  AiGraphicsProductionControlledDispatchAuthorizationProof,
} from '../tool-registry/ai-graphics-production-controlled-dispatch-authorization-proof'

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

async function main() {
  const input: AiGraphicsProductionControlledWorkerDispatchSmokeProofInput = {
    sourceProductionControlledDispatchAuthorizationProofPacket:
      readJsonFile<AiGraphicsProductionControlledDispatchAuthorizationProof>(
        '--source-production-controlled-dispatch-authorization-proof-packet',
      ),
    executionRequested: hasFlag('--execution-requested'),
    productionControlledWorkerDispatchSmokeRef:
      stringFlag('--production-controlled-worker-dispatch-smoke-ref'),
    productionControlledWorkerDispatchSmokeTelemetryRef:
      stringFlag('--production-controlled-worker-dispatch-smoke-telemetry-ref'),
    productionControlledWorkerDispatchSmokeLeaseAuditRef:
      stringFlag('--production-controlled-worker-dispatch-smoke-lease-audit-ref'),
    productionControlledWorkerDispatchSmokeBlockedDispatchAuditRef:
      stringFlag('--production-controlled-worker-dispatch-smoke-blocked-dispatch-audit-ref'),
    productionControlledWorkerDispatchSmokeCleanupRef:
      stringFlag('--production-controlled-worker-dispatch-smoke-cleanup-ref'),
    productionControlledWorkerDispatchSmokeWorkerInstanceRef:
      stringFlag('--production-controlled-worker-dispatch-smoke-worker-instance-ref'),
  }

  const report =
    await evaluateAiGraphicsProductionControlledWorkerDispatchSmokeProof(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceProductionControlledDispatchAuthorizationProofPacketRead:
        Boolean(stringFlag('--source-production-controlled-dispatch-authorization-proof-packet')),
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
