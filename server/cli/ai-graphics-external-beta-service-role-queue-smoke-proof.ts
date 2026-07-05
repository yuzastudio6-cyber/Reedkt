import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaServiceRoleQueueSmokeProof,
  type AiGraphicsExternalBetaServiceRoleQueueSmokeResult,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-proof'
import type {
  AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-readiness'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile<T>(flag: string): T | undefined {
  const path = stringFlag(flag)
  if (!path) return undefined
  return JSON.parse(fs.readFileSync(path, 'utf8')) as T
}

const proof = evaluateAiGraphicsExternalBetaServiceRoleQueueSmokeProof({
  sourceExternalBetaServiceRoleQueueSmokeReadinessPacket:
    readJsonFile<AiGraphicsExternalBetaServiceRoleQueueSmokeReadiness>(
      '--external-beta-service-role-queue-smoke-readiness-packet',
    ),
  serviceRoleQueueSmokeResult:
    readJsonFile<AiGraphicsExternalBetaServiceRoleQueueSmokeResult>(
      '--external-beta-service-role-queue-smoke-result',
    ),
  serviceRoleQueueSmokeEvidenceRef:
    stringFlag('--external-beta-service-role-queue-smoke-evidence-ref'),
  serviceRoleQueueSmokeTelemetryRef:
    stringFlag('--external-beta-service-role-queue-smoke-telemetry-ref'),
  serviceRoleQueueSmokeCleanupProofRef:
    stringFlag('--external-beta-service-role-queue-smoke-cleanup-proof-ref'),
})

console.log(JSON.stringify({
  ...proof,
  input: {
    validatorOnly: true,
    liveServiceRoleQueueSmokeExecutedByThisCommand: false,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
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
