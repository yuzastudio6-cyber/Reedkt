import fs from 'node:fs'
import {
  evaluateAiGraphicsProductionControlledPerToolCallableResultProof,
  type AiGraphicsProductionControlledPerToolCallableResult,
  type AiGraphicsProductionControlledPerToolCallableResultProofInput,
} from '../tool-registry/ai-graphics-production-controlled-per-tool-callable-result-proof'
import type {
  AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof,
} from '../tool-registry/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof'

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
  const input: AiGraphicsProductionControlledPerToolCallableResultProofInput = {
    sourcePrivateArtifactToolRouteHandoffProofPacket:
      readJsonFile<AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof>(
        '--source-private-artifact-tool-route-handoff-proof-packet',
      ),
    perToolCallableResult:
      readJsonFile<AiGraphicsProductionControlledPerToolCallableResult>(
        '--per-tool-callable-result',
      ),
    perToolCallableResultEvidenceRef:
      stringFlag('--per-tool-callable-result-evidence-ref'),
    perToolCallableResultQaRef:
      stringFlag('--per-tool-callable-result-qa-ref'),
    perToolCallableResultCostRef:
      stringFlag('--per-tool-callable-result-cost-ref'),
    perToolCallableResultRollbackRef:
      stringFlag('--per-tool-callable-result-rollback-ref'),
    perToolCallableResultOperatorReviewRef:
      stringFlag('--per-tool-callable-result-operator-review-ref'),
  }

  const report =
    evaluateAiGraphicsProductionControlledPerToolCallableResultProof(input)

  console.log(JSON.stringify({
    ...report,
    input: {
      evaluatorOnly: true,
      sourcePrivateArtifactToolRouteHandoffProofPacketRead:
        Boolean(stringFlag('--source-private-artifact-tool-route-handoff-proof-packet')),
      perToolCallableResultRead:
        Boolean(stringFlag('--per-tool-callable-result')),
      savedCallableResultOnly: true,
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
