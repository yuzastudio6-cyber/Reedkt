import {
  buildAiGraphicsExternalBetaServiceRoleQueueSmokePreflight,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-preflight'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const preflight = buildAiGraphicsExternalBetaServiceRoleQueueSmokePreflight({
  env: process.env,
  workspaceId: valueAfterFlag('--workspace-id'),
  projectId: valueAfterFlag('--project-id'),
  approvedPlanSnapshotId: valueAfterFlag('--approved-plan-snapshot-id'),
  creditReservationId: valueAfterFlag('--credit-reservation-id'),
  idempotencyPrefix: valueAfterFlag('--idempotency-prefix'),
  serviceRoleQueueSmokeReadinessRef:
    valueAfterFlag('--service-role-queue-smoke-readiness-ref'),
  runtimeQueueServiceProofBridgeRef:
    valueAfterFlag('--runtime-queue-service-proof-bridge-ref'),
  sourceRuntimeQueueServiceProofBridgeAccepted:
    hasFlag('--source-runtime-queue-service-proof-bridge-accepted'),
})

console.log(JSON.stringify({
  ...preflight,
  input: {
    envValuesRedacted: true,
    secretValuesLogged: false,
    liveServiceRoleQueueSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
  },
}, null, 2))

if (
  hasFlag('--require-ready-to-execute') &&
  !preflight.readyToExecuteLiveNonProductionSmoke
) {
  process.exitCode = 2
}
