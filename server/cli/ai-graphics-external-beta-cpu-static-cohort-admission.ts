import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaCpuStaticCohortAdmission,
  type AiGraphicsExternalBetaCpuStaticCohortAdmissionInput,
} from '../tool-registry/ai-graphics-external-beta-cpu-static-cohort-admission'
import type {
  AiGraphicsExternalBetaPerToolRuntimeProof,
} from '../tool-registry/ai-graphics-external-beta-per-tool-runtime-proof'

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

const input: AiGraphicsExternalBetaCpuStaticCohortAdmissionInput = {
  sourcePerToolRuntimeProofPacket:
    readJsonFile<AiGraphicsExternalBetaPerToolRuntimeProof>(
      '--external-beta-per-tool-runtime-proof-packet',
    ),
  externalBetaCpuStaticCohortPolicyRef:
    stringFlag('--external-beta-cpu-static-cohort-policy-ref'),
  externalBetaCpuStaticCohortRolloutRef:
    stringFlag('--external-beta-cpu-static-cohort-rollout-ref'),
  externalBetaCpuStaticCohortTelemetryRef:
    stringFlag('--external-beta-cpu-static-cohort-telemetry-ref'),
  externalBetaCpuStaticCohortRollbackRef:
    stringFlag('--external-beta-cpu-static-cohort-rollback-ref'),
  externalBetaCpuStaticCohortSupportRef:
    stringFlag('--external-beta-cpu-static-cohort-support-ref'),
}

const admission = buildAiGraphicsExternalBetaCpuStaticCohortAdmission(input)

console.log(JSON.stringify({
  ...admission,
  input: {
    evaluatorOnly: true,
    cohortAdmissionOnlyNoToolExecution: true,
    sourcePerToolRuntimeProofPacketRead:
      Boolean(stringFlag('--external-beta-per-tool-runtime-proof-packet')),
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
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
