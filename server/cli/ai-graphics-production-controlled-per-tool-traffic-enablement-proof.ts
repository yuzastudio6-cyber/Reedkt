import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionControlledPerToolTrafficEnablementProof,
  type AiGraphicsProductionControlledPerToolTrafficEnablement,
  type AiGraphicsProductionControlledPerToolTrafficEnablementProofInput,
} from '../tool-registry/ai-graphics-production-controlled-per-tool-traffic-enablement-proof'
import type {
  AiGraphicsProductionControlledPerToolCallableResultProof,
} from '../tool-registry/ai-graphics-production-controlled-per-tool-callable-result-proof'

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
  const input: AiGraphicsProductionControlledPerToolTrafficEnablementProofInput = {
    sourcePerToolCallableResultProofPacket:
      readJsonFile<AiGraphicsProductionControlledPerToolCallableResultProof>(
        '--source-per-tool-callable-result-proof-packet',
      ),
    perToolTrafficEnablement:
      readJsonFile<AiGraphicsProductionControlledPerToolTrafficEnablement>(
        '--per-tool-traffic-enablement',
      ),
    perToolTrafficEnablementEvidenceRef:
      stringFlag('--per-tool-traffic-enablement-evidence-ref'),
    perToolTrafficEnablementQaRef:
      stringFlag('--per-tool-traffic-enablement-qa-ref'),
    perToolTrafficEnablementCostRef:
      stringFlag('--per-tool-traffic-enablement-cost-ref'),
    perToolTrafficEnablementRollbackRef:
      stringFlag('--per-tool-traffic-enablement-rollback-ref'),
    perToolTrafficEnablementOperatorReviewRef:
      stringFlag('--per-tool-traffic-enablement-operator-review-ref'),
  }

  const report =
    evaluateAiGraphicsProductionControlledPerToolTrafficEnablementProof(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourcePerToolCallableResultProofPacketRead:
        Boolean(stringFlag('--source-per-tool-callable-result-proof-packet')),
      perToolTrafficEnablementRead:
        Boolean(stringFlag('--per-tool-traffic-enablement')),
      savedTrafficEnablementOnly: true,
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
