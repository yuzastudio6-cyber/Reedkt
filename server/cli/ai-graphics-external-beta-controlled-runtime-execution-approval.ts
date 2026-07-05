import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaControlledRuntimeExecutionApproval,
  type AiGraphicsExternalBetaControlledRuntimeExecutionApprovalInput,
} from '../tool-registry/ai-graphics-external-beta-controlled-runtime-execution-approval'
import type {
  AiGraphicsExternalBetaCandidateEvidenceAssembly,
} from '../tool-registry/ai-graphics-external-beta-candidate-evidence-assembly'
import type {
  AiGraphicsExternalBetaRuntimeAdmission,
} from '../tool-registry/ai-graphics-external-beta-runtime-admission'
import type {
  AiGraphicsExternalBetaCpuStaticRuntimeAdmission,
} from '../tool-registry/ai-graphics-external-beta-cpu-static-runtime-admission'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaControlledRuntimeExecutionApprovalInput = {
  sourceCandidateEvidenceAssemblyPacket:
    readJsonFile<AiGraphicsExternalBetaCandidateEvidenceAssembly>(
      '--external-beta-candidate-evidence-assembly-packet',
    ),
  sourceExternalBetaRuntimeAdmissionPacket:
    readJsonFile<AiGraphicsExternalBetaRuntimeAdmission>(
      '--external-beta-runtime-admission-packet',
    ),
  sourceExternalBetaCpuStaticRuntimeAdmissionPacket:
    readJsonFile<AiGraphicsExternalBetaCpuStaticRuntimeAdmission>(
      '--external-beta-cpu-static-runtime-admission-packet',
    ),
  externalBetaControlledRuntimeExecutionApprovalGranted:
    hasFlag('--external-beta-controlled-runtime-execution-approval-granted'),
  externalBetaControlledRuntimeExecutionApprovalRef:
    valueAfterFlag('--external-beta-controlled-runtime-execution-approval-ref'),
  externalBetaControlledRuntimeExecutionApproverRole:
    valueAfterFlag('--external-beta-controlled-runtime-execution-approver-role'),
}

const approval = buildAiGraphicsExternalBetaControlledRuntimeExecutionApproval(input)

console.log(JSON.stringify({
  ...approval,
  input: {
    evaluatorOnly: true,
    candidateEvidenceAssemblyPacketRead:
      Boolean(valueAfterFlag('--external-beta-candidate-evidence-assembly-packet')),
    runtimeAdmissionPacketRead:
      Boolean(valueAfterFlag('--external-beta-runtime-admission-packet')),
    cpuStaticRuntimeAdmissionPacketRead:
      Boolean(valueAfterFlag('--external-beta-cpu-static-runtime-admission-packet')),
    controlledRuntimeExecutionApprovalGranted:
      hasFlag('--external-beta-controlled-runtime-execution-approval-granted'),
    controlledRuntimeExecutionApprovalRefProvided:
      Boolean(valueAfterFlag('--external-beta-controlled-runtime-execution-approval-ref')),
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
