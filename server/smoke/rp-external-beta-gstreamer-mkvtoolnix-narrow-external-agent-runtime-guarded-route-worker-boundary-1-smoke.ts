import assert from 'node:assert/strict'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput,
  summarizeGstreamerMkvtoolnixNarrowRouteWorkerBoundary,
  validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1'
import { buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput } from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1'

const validInput = buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput()
const valid = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(validInput)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_READY_STATUS)
assert.equal(valid.futureDryRunConfirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV)
assert.equal(valid.futureDryRunConfirmationRequired, true)
assert.equal(valid.sanitizedBoundary.proposedRouteOwner, 'backend_service_role_only')
assert.equal(valid.sanitizedBoundary.routeBoundaryMode, 'noop_validation_only')
assert.equal(valid.sanitizedBoundary.workerBoundaryMode, 'not_dispatched_boundary_only')
assert.equal(valid.sanitizedBoundary.bridgeAccepted, true)
assert.equal(valid.sanitizedBoundary.routeRegistered, false)
assert.equal(valid.sanitizedBoundary.routeEnabled, false)
assert.equal(valid.sanitizedBoundary.routeExecution, false)
assert.equal(valid.sanitizedBoundary.workerDispatch, false)
assert.equal(valid.sanitizedBoundary.workerExecution, false)
assert.equal(valid.sanitizedBoundary.workerProcessStart, false)
assert.equal(valid.sanitizedBoundary.workerLeaseClaim, false)
assert.equal(valid.sanitizedBoundary.persistentQueueWrite, false)
assert.equal(valid.sanitizedBoundary.gstreamerExecution, false)
assert.equal(valid.sanitizedBoundary.mkvtoolnixExecution, false)
assert.equal(valid.sanitizedBoundary.mediaProcessing, false)
assert.equal(valid.sanitizedBoundary.signedUrlCreation, false)
assert.equal(valid.sanitizedBoundary.publicArtifactCreation, false)
assert.equal(valid.sanitizedBoundary.finalRenderExport, false)
assert.equal(valid.safety.serviceRoleSecretPayloadAccess, false)
assert.equal(valid.safety.frontendCredentialExposure, false)
assert.equal(valid.safety.broadServiceRoleHandler, false)
assert.equal(valid.safety.supabaseMutation, false)
assert.equal(valid.safety.sqlExecution, false)
assert.equal(valid.productReadyEndToEndLocalOssTools, 0)
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_NEXT_MILESTONE)

const missingBoundary = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ boundaryId: '' }),
)
assert.equal(missingBoundary.ok, false)
assert.ok(missingBoundary.blockers.includes('blocked_missing_narrow_route_worker_boundary_reference'))

const invalidBridge = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({
    bridgeInput: buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ rawCommand: 'mkvmerge input.mp4' }),
  }),
)
assert.equal(invalidBridge.ok, false)
assert.ok(invalidBridge.blockers.includes('blocked_narrow_bridge_validation_failed'))

const frontendOwner = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ proposedRouteOwner: 'frontend' }),
)
assert.equal(frontendOwner.ok, false)
assert.ok(frontendOwner.blockers.includes('blocked_invalid_narrow_route_worker_boundary_state'))

const liveRouteMode = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ routeBoundaryMode: 'live_route_handler' }),
)
assert.equal(liveRouteMode.ok, false)
assert.ok(liveRouteMode.blockers.includes('blocked_invalid_narrow_route_worker_boundary_state'))

const idempotencyMismatch = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ boundaryIdempotencyKey: 'wrong-key' }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_narrow_route_worker_boundary_idempotency_mismatch'))

for (const runtimeOverride of [
  { routeRegistered: true },
  { routeEnabled: true },
  { routeExecution: true },
  { workerDispatch: true },
  { workerExecution: true },
  { workerProcessStart: true },
  { workerLeaseClaim: true },
  { persistentQueueWrite: true },
  { gstreamerExecution: true },
  { mkvtoolnixExecution: true },
  { dockerExecution: true },
  { mediaProcessing: true },
  { supabaseMutation: true },
  { sqlExecution: true },
] satisfies Partial<Parameters<typeof buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput>[0]>[]) {
  const result = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
    buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(runtimeOverride),
  )
  assert.equal(result.ok, false, JSON.stringify(runtimeOverride))
  assert.ok(result.blockers.includes('blocked_route_or_worker_runtime_not_enabled'), JSON.stringify(runtimeOverride))
}

const publicArtifact = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ publicArtifactCreation: true }),
)
assert.equal(publicArtifact.ok, false)
assert.ok(publicArtifact.blockers.includes('blocked_public_or_signed_artifact_attempt'))

const finalExport = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ finalRenderExport: true }),
)
assert.equal(finalExport.ok, false)
assert.ok(finalExport.blockers.includes('blocked_delivery_or_unlock_attempt'))

const productionUnlock = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ productionUnlock: true }),
)
assert.equal(productionUnlock.ok, false)
assert.ok(productionUnlock.blockers.includes('blocked_delivery_or_unlock_attempt'))

const boundary = summarizeGstreamerMkvtoolnixNarrowRouteWorkerBoundary()
assert.ok(boundary.some((line) => line.includes('backend-service-role-only source contracts')))
assert.ok(boundary.some((line) => line.includes('No HTTP route is registered')))
assert.ok(boundary.some((line) => line.includes('idempotency mismatches')))
assert.ok(boundary.some((line) => line.includes(RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV)))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_noop_route_worker_boundary_validates',
    'missing_boundary_reference_blocks',
    'invalid_bridge_blocks',
    'frontend_owner_and_live_modes_block',
    'idempotency_mismatch_blocks',
    'route_worker_queue_tool_media_supabase_sql_runtime_requests_block',
    'signed_public_artifact_and_delivery_unlock_requests_block',
    'safety_flags_remain_false',
  ],
  readyStatus: valid.status,
  futureDryRunConfirmationGate: valid.futureDryRunConfirmationGate,
  nextMilestone: valid.nextMilestone,
}, null, 2))
