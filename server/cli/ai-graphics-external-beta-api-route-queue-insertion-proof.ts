import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaApiRouteQueueInsertionProof,
  type AiGraphicsExternalBetaApiRouteQueueInsertionProofInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-queue-insertion-proof'
import type { AiGraphicsExternalBetaApiRouteBoundary } from '../tool-registry/ai-graphics-external-beta-api-route-boundary'
import type { AiGraphicsExternalBetaBackendQueueSubmission } from '../tool-registry/ai-graphics-external-beta-backend-queue-submission'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaApiRouteQueueInsertionProofInput = {
  sourceExternalBetaApiRouteBoundaryPacket:
    readJsonFile<AiGraphicsExternalBetaApiRouteBoundary>(
      '--external-beta-api-route-boundary-packet',
    ),
  sourceExternalBetaBackendQueueSubmissionPacket:
    readJsonFile<AiGraphicsExternalBetaBackendQueueSubmission>(
      '--external-beta-backend-queue-submission-packet',
    ),
  externalBetaRouteQueueInsertionPolicyRef:
    valueAfterFlag('--external-beta-route-queue-insertion-policy-ref'),
  externalBetaRouteQueueInsertionSchemaRef:
    valueAfterFlag('--external-beta-route-queue-insertion-schema-ref'),
  externalBetaRouteQueueServiceRoleAuthorizationRef:
    valueAfterFlag('--external-beta-route-queue-service-role-authorization-ref'),
  externalBetaRouteQueueIdempotencyBindingRef:
    valueAfterFlag('--external-beta-route-queue-idempotency-binding-ref'),
  externalBetaRouteQueueApprovedSnapshotBindingRef:
    valueAfterFlag('--external-beta-route-queue-approved-snapshot-binding-ref'),
  externalBetaRouteQueueCreditReservationBindingRef:
    valueAfterFlag('--external-beta-route-queue-credit-reservation-binding-ref'),
  externalBetaRouteQueuePrivateArtifactManifestBindingRef:
    valueAfterFlag('--external-beta-route-queue-private-artifact-manifest-binding-ref'),
  externalBetaRouteQueueAuditEnvelopeRef:
    valueAfterFlag('--external-beta-route-queue-audit-envelope-ref'),
  externalBetaRouteQueueRollbackPlanRef:
    valueAfterFlag('--external-beta-route-queue-rollback-plan-ref'),
  externalBetaRouteQueuePoisonQueuePolicyRef:
    valueAfterFlag('--external-beta-route-queue-poison-queue-policy-ref'),
  externalBetaRouteQueueNonProductionEnvironmentRef:
    valueAfterFlag('--external-beta-route-queue-non-production-environment-ref'),
  externalBetaRouteQueuePrivateNetworkRef:
    valueAfterFlag('--external-beta-route-queue-private-network-ref'),
}

const proof = buildAiGraphicsExternalBetaApiRouteQueueInsertionProof(input)

console.log(JSON.stringify({
  ...proof,
  input: {
    evaluatorOnly: true,
    apiRouteBoundaryPacketRead:
      Boolean(valueAfterFlag('--external-beta-api-route-boundary-packet')),
    backendQueueSubmissionPacketRead:
      Boolean(valueAfterFlag('--external-beta-backend-queue-submission-packet')),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    apiRouteMountedNow: false,
    apiRouteExecutionPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    workerEnqueuePerformed: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueSmokePerformed: false,
    serviceRoleTransactionPerformed: false,
    liveQueueWritePerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}, null, 2))
