import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization,
  type AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput,
} from '../tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-authorization'
import type {
  AiGraphicsProductionControlledWorkerDispatchSmokeProof,
} from '../tool-registry/ai-graphics-production-controlled-worker-dispatch-smoke-proof'

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
  const input: AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput = {
    sourceProductionControlledWorkerDispatchSmokeProofPacket:
      readJsonFile<AiGraphicsProductionControlledWorkerDispatchSmokeProof>(
        '--source-production-controlled-worker-dispatch-smoke-proof-packet',
      ),
    productionControlledWorkerRuntimeSmokeAuthorizationRef:
      stringFlag('--production-controlled-worker-runtime-smoke-authorization-ref'),
    productionControlledWorkerRuntimeSmokeRunbookRef:
      stringFlag('--production-controlled-worker-runtime-smoke-runbook-ref'),
    productionControlledWorkerRuntimeSmokeEnvironmentRef:
      stringFlag('--production-controlled-worker-runtime-smoke-environment-ref'),
    productionControlledWorkerRuntimeSmokeDryRunModeRef:
      stringFlag('--production-controlled-worker-runtime-smoke-dry-run-mode-ref'),
    productionControlledWorkerRuntimeSmokeLeasePolicyRef:
      stringFlag('--production-controlled-worker-runtime-smoke-lease-policy-ref'),
    productionControlledWorkerRuntimeSmokeDispatchPolicyRef:
      stringFlag('--production-controlled-worker-runtime-smoke-dispatch-policy-ref'),
    productionControlledWorkerRuntimeSmokeGpuOnDemandRef:
      stringFlag('--production-controlled-worker-runtime-smoke-gpu-on-demand-ref'),
    productionControlledWorkerRuntimeSmokeArtifactSandboxRef:
      stringFlag('--production-controlled-worker-runtime-smoke-artifact-sandbox-ref'),
    productionControlledWorkerRuntimeSmokeTelemetryRef:
      stringFlag('--production-controlled-worker-runtime-smoke-telemetry-ref'),
    productionControlledWorkerRuntimeSmokeCostGuardrailRef:
      stringFlag('--production-controlled-worker-runtime-smoke-cost-guardrail-ref'),
    productionControlledWorkerRuntimeSmokeRollbackRef:
      stringFlag('--production-controlled-worker-runtime-smoke-rollback-ref'),
    productionControlledWorkerRuntimeSmokeCleanupRef:
      stringFlag('--production-controlled-worker-runtime-smoke-cleanup-ref'),
    productionControlledWorkerRuntimeSmokePostReviewRef:
      stringFlag('--production-controlled-worker-runtime-smoke-post-review-ref'),
    productionControlledWorkerRuntimeSmokeOperatorRole:
      stringFlag('--production-controlled-worker-runtime-smoke-operator-role'),
  }

  const report =
    await evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceProductionControlledWorkerDispatchSmokeProofPacketRead:
        Boolean(stringFlag('--source-production-controlled-worker-dispatch-smoke-proof-packet')),
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
