import fs from 'node:fs'
import {
  buildAiGraphicsExternalBetaApiRouteBoundary,
  type AiGraphicsExternalBetaApiRouteBoundaryInput,
} from '../tool-registry/ai-graphics-external-beta-api-route-boundary'
import type {
  AiGraphicsExternalBetaCallableRequestAdmission,
} from '../tool-registry/ai-graphics-external-beta-callable-request-admission'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = valueAfterFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as T
}

const input: AiGraphicsExternalBetaApiRouteBoundaryInput = {
  sourceExternalBetaCallableRequestAdmissionPacket:
    readJsonFile<AiGraphicsExternalBetaCallableRequestAdmission>(
      '--external-beta-callable-request-admission-packet',
    ),
  externalBetaApiRoutePolicyRef: valueAfterFlag('--external-beta-api-route-policy-ref'),
  externalBetaApiRouteSchemaRef: valueAfterFlag('--external-beta-api-route-schema-ref'),
  externalBetaApiRouteAuthzRef: valueAfterFlag('--external-beta-api-route-authz-ref'),
  externalBetaApiRouteRequestValidationRef:
    valueAfterFlag('--external-beta-api-route-request-validation-ref'),
  externalBetaApprovedSnapshotResolverRef:
    valueAfterFlag('--external-beta-approved-snapshot-resolver-ref'),
  externalBetaCreditReservationResolverRef:
    valueAfterFlag('--external-beta-credit-reservation-resolver-ref'),
  externalBetaApiRouteRateLimitRef:
    valueAfterFlag('--external-beta-api-route-rate-limit-ref'),
  externalBetaApiRouteCostGuardrailRef:
    valueAfterFlag('--external-beta-api-route-cost-guardrail-ref'),
  externalBetaApiRouteIdempotencyStoreRef:
    valueAfterFlag('--external-beta-api-route-idempotency-store-ref'),
  externalBetaApiRouteAuditLogRef:
    valueAfterFlag('--external-beta-api-route-audit-log-ref'),
  externalBetaApiRoutePrivateNetworkRef:
    valueAfterFlag('--external-beta-api-route-private-network-ref'),
  externalBetaApiRouteRollbackRef:
    valueAfterFlag('--external-beta-api-route-rollback-ref'),
  externalBetaApiRouteIncidentResponseRef:
    valueAfterFlag('--external-beta-api-route-incident-response-ref'),
}

const routeBoundary = buildAiGraphicsExternalBetaApiRouteBoundary(input)

console.log(JSON.stringify({
  ...routeBoundary,
  input: {
    evaluatorOnly: true,
    callableRequestAdmissionPacketRead:
      Boolean(valueAfterFlag('--external-beta-callable-request-admission-packet')),
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
    supabaseMutationPerformed: false,
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
