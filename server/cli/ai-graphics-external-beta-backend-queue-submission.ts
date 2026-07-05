import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaBackendQueueSubmission,
  type AiGraphicsExternalBetaBackendQueueSubmissionInput,
} from '../tool-registry/ai-graphics-external-beta-backend-queue-submission'
import type { AiGraphicsExternalBetaWorkerEnqueueAdapter } from '../tool-registry/ai-graphics-external-beta-worker-enqueue-adapter'

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

const input: AiGraphicsExternalBetaBackendQueueSubmissionInput = {
  sourceExternalBetaWorkerEnqueueAdapterPacket:
    readJsonFile<AiGraphicsExternalBetaWorkerEnqueueAdapter>(
      '--external-beta-worker-enqueue-adapter-packet',
    ),
  capabilityId: stringFlag('--capability-id') ?? 'background_removal',
  requestedToolId: stringFlag('--requested-tool-id'),
  executionRequested: hasFlag('--execution-requested'),
  externalBetaQueueSubmissionRef: stringFlag('--external-beta-queue-submission-ref'),
  externalBetaQueueSubmissionSchemaRef:
    stringFlag('--external-beta-queue-submission-schema-ref'),
  externalBetaServiceRoleTransactionEnvelopeRef:
    stringFlag('--external-beta-service-role-transaction-envelope-ref'),
  externalBetaQueueWriteAuthorizationRef:
    stringFlag('--external-beta-queue-write-authorization-ref'),
  externalBetaApprovedSnapshotPersistenceRef:
    stringFlag('--external-beta-approved-snapshot-persistence-ref'),
  externalBetaCreditReservationPersistenceRef:
    stringFlag('--external-beta-credit-reservation-persistence-ref'),
  externalBetaPrivateArtifactPersistenceRef:
    stringFlag('--external-beta-private-artifact-persistence-ref'),
  externalBetaAuditEnvelopeRef: stringFlag('--external-beta-audit-envelope-ref'),
  externalBetaRollbackPlanRef: stringFlag('--external-beta-rollback-plan-ref'),
}

const report = evaluateAiGraphicsExternalBetaBackendQueueSubmission(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceWorkerEnqueueAdapterPacketRead:
      Boolean(stringFlag('--external-beta-worker-enqueue-adapter-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
