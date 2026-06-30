import fs from 'node:fs'
import {
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflight,
  type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightInput,
} from '../routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function readJsonFile(flag: string): Record<string, unknown> | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(fs.readFileSync(packetPath, 'utf8')) as Record<string, unknown>
}

const input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightInput = {
  sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket:
    readJsonFile('--route-bound-service-role-queue-smoke-result-capture-contract-packet'),
  environment: {
    confirmExternalBetaServiceRoleQueueSmoke:
      process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE,
    smokeEnvironment:
      process.env.REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV,
    supabaseUrlPresent:
      typeof process.env.SUPABASE_URL === 'string' &&
        process.env.SUPABASE_URL.trim().length > 0,
    supabaseServiceRoleKeyPresent:
      typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string' &&
        process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 0,
    e2eRuntimeMode:
      process.env.E2E_RUNTIME_MODE,
    workerRuntimeMode:
      process.env.WORKER_RUNTIME_MODE,
    nodeEnv:
      process.env.NODE_ENV,
    productionFlagPresent:
      hasFlag('--production'),
  },
  workspaceId: stringFlag('--workspace-id'),
  projectId: stringFlag('--project-id'),
  approvedPlanSnapshotId: stringFlag('--approved-plan-snapshot-id'),
  creditReservationId: stringFlag('--credit-reservation-id'),
  idempotencyPrefix: stringFlag('--idempotency-prefix'),
  routeBoundServiceRoleQueueSmokeResultCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-result-capture-ref'),
  routeBoundServiceRoleQueueSmokeEvidenceCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-evidence-capture-ref'),
  routeBoundServiceRoleQueueSmokeTelemetryCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-telemetry-capture-ref'),
  routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef:
    stringFlag('--route-bound-service-role-queue-smoke-cleanup-proof-capture-ref'),
  routeBoundServiceRoleQueueSmokeProofValidatorRef:
    stringFlag('--route-bound-service-role-queue-smoke-proof-validator-ref'),
  routeBoundServiceRoleQueueSmokePostRunReviewRef:
    stringFlag('--route-bound-service-role-queue-smoke-post-run-review-ref'),
  serviceRoleQueueSmokeReadinessRef:
    stringFlag('--service-role-queue-smoke-readiness-ref'),
  runtimeQueueServiceProofBridgeRef:
    stringFlag('--runtime-queue-service-proof-bridge-ref'),
  sourceRuntimeQueueServiceProofBridgeAccepted:
    hasFlag('--source-runtime-queue-service-proof-bridge-accepted'),
}

const report =
  evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflight(input)

console.log(JSON.stringify({
  ...report,
  input: {
    evaluatorOnly: true,
    sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacketRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-result-capture-contract-packet')),
    workspaceIdRead: Boolean(stringFlag('--workspace-id')),
    projectIdRead: Boolean(stringFlag('--project-id')),
    approvedPlanSnapshotIdRead: Boolean(stringFlag('--approved-plan-snapshot-id')),
    creditReservationIdRead: Boolean(stringFlag('--credit-reservation-id')),
    idempotencyPrefixRead: Boolean(stringFlag('--idempotency-prefix')),
    routeBoundServiceRoleQueueSmokeResultCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-result-capture-ref')),
    routeBoundServiceRoleQueueSmokeEvidenceCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-evidence-capture-ref')),
    routeBoundServiceRoleQueueSmokeTelemetryCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-telemetry-capture-ref')),
    routeBoundServiceRoleQueueSmokeCleanupProofCaptureRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-cleanup-proof-capture-ref')),
    routeBoundServiceRoleQueueSmokeProofValidatorRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-proof-validator-ref')),
    routeBoundServiceRoleQueueSmokePostRunReviewRefRead:
      Boolean(stringFlag('--route-bound-service-role-queue-smoke-post-run-review-ref')),
    serviceRoleQueueSmokeReadinessRefRead:
      Boolean(stringFlag('--service-role-queue-smoke-readiness-ref')),
    runtimeQueueServiceProofBridgeRefRead:
      Boolean(stringFlag('--runtime-queue-service-proof-bridge-ref')),
    sourceRuntimeQueueServiceProofBridgeAcceptedFlagRead:
      hasFlag('--source-runtime-queue-service-proof-bridge-accepted'),
    supabaseUrlValueReturned: false,
    supabaseServiceRoleKeyValueReturned: false,
    supabaseClientCreated: false,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    privateArtifactWritePerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
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
