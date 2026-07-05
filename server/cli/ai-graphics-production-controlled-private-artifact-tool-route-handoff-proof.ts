import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof,
  type AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofInput,
} from '../tool-registry/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof'
import type {
  AiGraphicsProductionControlledWorkerRuntimeSmokeProof,
} from '../tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-proof'

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

function main() {
  const input: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofInput = {
    sourceProductionControlledWorkerRuntimeSmokeProofPacket:
      readJsonFile<AiGraphicsProductionControlledWorkerRuntimeSmokeProof>(
        '--source-production-controlled-worker-runtime-smoke-proof-packet',
      ),
    productionControlledPrivateInputManifestRef:
      stringFlag('--production-controlled-private-input-manifest-ref'),
    productionControlledPrivateOutputManifestRef:
      stringFlag('--production-controlled-private-output-manifest-ref'),
    productionControlledPrivateTelemetryRef:
      stringFlag('--production-controlled-private-telemetry-ref'),
    productionControlledPrivateLeaseAuditRef:
      stringFlag('--production-controlled-private-lease-audit-ref'),
    productionControlledPrivateRouteHandoffRef:
      stringFlag('--production-controlled-private-route-handoff-ref'),
    productionControlledPrivateArtifactPolicyRef:
      stringFlag('--production-controlled-private-artifact-policy-ref'),
    productionControlledPrivateArtifactRetentionRef:
      stringFlag('--production-controlled-private-artifact-retention-ref'),
    productionControlledToolRoutePolicyRef:
      stringFlag('--production-controlled-tool-route-policy-ref'),
    productionControlledToolRouteSchemaRef:
      stringFlag('--production-controlled-tool-route-schema-ref'),
    productionControlledToolRouteAdmissionRef:
      stringFlag('--production-controlled-tool-route-admission-ref'),
    productionControlledToolRouteAuthzRef:
      stringFlag('--production-controlled-tool-route-authz-ref'),
    productionControlledToolRouteExecutionBlockRef:
      stringFlag('--production-controlled-tool-route-execution-block-ref'),
    productionControlledToolRouteAuditRef:
      stringFlag('--production-controlled-tool-route-audit-ref'),
    productionControlledToolRouteRollbackRef:
      stringFlag('--production-controlled-tool-route-rollback-ref'),
    productionControlledGpuOnDemandPolicyRef:
      stringFlag('--production-controlled-gpu-on-demand-policy-ref'),
    productionControlledModelWeightOrCacheManifestRef:
      stringFlag('--production-controlled-model-weight-or-cache-manifest-ref'),
  }

  const report =
    evaluateAiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourceProductionControlledWorkerRuntimeSmokeProofPacketRead:
        Boolean(stringFlag('--source-production-controlled-worker-runtime-smoke-proof-packet')),
      privateArtifactToolRouteHandoffProofOnly: true,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      privateArtifactWritePerformed: false,
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

main()
