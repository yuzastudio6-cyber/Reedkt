import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaWorkerDispatchSmokeProof,
  type AiGraphicsExternalBetaWorkerDispatchSmokeProofInput,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof'
import type {
  AiGraphicsExternalBetaWorkerDispatchSmoke,
} from '../tool-registry/ai-graphics-external-beta-worker-dispatch-smoke'

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

const input: AiGraphicsExternalBetaWorkerDispatchSmokeProofInput = {
  workerDispatchSmokeResult:
    readJsonFile<AiGraphicsExternalBetaWorkerDispatchSmoke>(
      '--external-beta-worker-dispatch-smoke-result',
    ),
  workerDispatchSmokeEvidenceRef:
    stringFlag('--external-beta-worker-dispatch-smoke-evidence-ref'),
  workerDispatchSmokeTelemetryRef:
    stringFlag('--external-beta-worker-dispatch-smoke-telemetry-ref'),
  workerDispatchSmokeLeaseAuditRef:
    stringFlag('--external-beta-worker-dispatch-smoke-lease-audit-ref'),
  workerDispatchSmokeCleanupProofRef:
    stringFlag('--external-beta-worker-dispatch-smoke-cleanup-proof-ref'),
}

const proof = evaluateAiGraphicsExternalBetaWorkerDispatchSmokeProof(input)

console.log(JSON.stringify({
  ...proof,
  input: {
    validatorOnly: true,
    validatesSavedWorkerDispatchSmokeResultOnly: true,
    liveWorkerLeaseCreatedByThisCommand: false,
    liveProductionWorkerDispatchPerformedByThisCommand: false,
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
