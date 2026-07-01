import assert from 'node:assert/strict'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowNoopSourceInput,
  createGstreamerMkvtoolnixNarrowNoopSourceResponse,
  summarizeGstreamerMkvtoolnixNarrowNoopSourceBoundary,
  validateGstreamerMkvtoolnixNarrowNoopSourceInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-noop-source-implementation-1'
import { buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput } from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1'

const validInput = buildGstreamerMkvtoolnixNarrowNoopSourceInput()
const valid = validateGstreamerMkvtoolnixNarrowNoopSourceInput(validInput)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_READY_STATUS)
assert.equal(valid.dryRunConfirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV)
assert.equal(valid.dryRunConfirmationRequired, true)
assert.equal(valid.sanitizedSource.routeOwner, 'backend_service_role_only')
assert.equal(valid.sanitizedSource.routeRegistrationMode, 'source_declared_not_registered')
assert.equal(valid.sanitizedSource.routeRuntimeMode, 'disabled_noop_source_contract_only')
assert.equal(valid.sanitizedSource.workerSourceMode, 'source_declared_not_dispatched')
assert.equal(valid.sanitizedSource.boundaryAccepted, true)
assert.equal(valid.sanitizedSource.serverFeatureFlagPresent, false)
assert.equal(valid.sanitizedSource.serverFeatureFlagEnabled, false)
assert.equal(valid.sanitizedSource.routeFileCreated, false)
assert.equal(valid.sanitizedSource.routeRegistered, false)
assert.equal(valid.sanitizedSource.routeEnabled, false)
assert.equal(valid.sanitizedSource.routeExecution, false)
assert.equal(valid.sanitizedSource.workerDispatch, false)
assert.equal(valid.sanitizedSource.workerExecution, false)
assert.equal(valid.sanitizedSource.workerProcessStart, false)
assert.equal(valid.sanitizedSource.workerLeaseClaim, false)
assert.equal(valid.sanitizedSource.persistentQueueWrite, false)
assert.equal(valid.sanitizedSource.gstreamerExecution, false)
assert.equal(valid.sanitizedSource.mkvtoolnixExecution, false)
assert.equal(valid.sanitizedSource.mediaProcessing, false)
assert.equal(valid.safety.supabaseMutation, false)
assert.equal(valid.safety.sqlExecution, false)
assert.equal(valid.productReadyEndToEndLocalOssTools, 0)
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_NEXT_MILESTONE)

const response = createGstreamerMkvtoolnixNarrowNoopSourceResponse(validInput)
assert.equal(response.status, 'accepted_noop_source_contract')
assert.equal(response.runtimeEnabled, false)
assert.equal(response.routeExecution, false)
assert.equal(response.workerDispatch, false)
assert.equal(response.workerExecution, false)
assert.equal(response.toolExecution, false)

const missingSource = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ sourceImplementationId: '' }),
)
assert.equal(missingSource.ok, false)
assert.ok(missingSource.blockers.includes('blocked_missing_narrow_route_worker_noop_source_reference'))

const invalidBoundary = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({
    boundaryInput: buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ routeExecution: true }),
  }),
)
assert.equal(invalidBoundary.ok, false)
assert.ok(invalidBoundary.blockers.includes('blocked_narrow_route_worker_boundary_validation_failed'))

const frontendOwner = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ routeOwner: 'frontend' }),
)
assert.equal(frontendOwner.ok, false)
assert.ok(frontendOwner.blockers.includes('blocked_invalid_narrow_route_worker_noop_source_state'))

const registeredRoute = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ routeRegistrationMode: 'registered_route_handler' }),
)
assert.equal(registeredRoute.ok, false)
assert.ok(registeredRoute.blockers.includes('blocked_invalid_narrow_route_worker_noop_source_state'))

const enabledRuntime = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ routeRuntimeMode: 'enabled_route_runtime' }),
)
assert.equal(enabledRuntime.ok, false)
assert.ok(enabledRuntime.blockers.includes('blocked_invalid_narrow_route_worker_noop_source_state'))

const enabledFlag = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ serverFeatureFlagPresent: true }),
)
assert.equal(enabledFlag.ok, false)
assert.ok(enabledFlag.blockers.includes('blocked_narrow_route_worker_noop_source_enabled_without_future_packet'))

const idempotencyMismatch = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ sourceIdempotencyKey: 'wrong-key' }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_narrow_route_worker_noop_source_idempotency_mismatch'))

for (const runtimeOverride of [
  { routeFileCreated: true },
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
] satisfies Partial<Parameters<typeof buildGstreamerMkvtoolnixNarrowNoopSourceInput>[0]>[]) {
  const result = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
    buildGstreamerMkvtoolnixNarrowNoopSourceInput(runtimeOverride),
  )
  assert.equal(result.ok, false, JSON.stringify(runtimeOverride))
  assert.ok(result.blockers.includes('blocked_route_worker_queue_or_runtime_execution_not_enabled'), JSON.stringify(runtimeOverride))
}

const publicArtifact = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ publicArtifactCreation: true }),
)
assert.equal(publicArtifact.ok, false)
assert.ok(publicArtifact.blockers.includes('blocked_public_or_signed_artifact_attempt'))

const finalExport = validateGstreamerMkvtoolnixNarrowNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowNoopSourceInput({ finalRenderExport: true }),
)
assert.equal(finalExport.ok, false)
assert.ok(finalExport.blockers.includes('blocked_delivery_or_unlock_attempt'))

const summary = summarizeGstreamerMkvtoolnixNarrowNoopSourceBoundary()
assert.ok(summary.some((line) => line.includes('backend-source validation helpers only')))
assert.ok(summary.some((line) => line.includes('No production HTTP route file is created')))
assert.ok(summary.some((line) => line.includes('Worker dispatch')))
assert.ok(summary.some((line) => line.includes(RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV)))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_noop_source_contract_validates',
    'response_shape_remains_runtime_disabled',
    'missing_source_reference_blocks',
    'invalid_boundary_blocks',
    'frontend_owner_registered_route_and_enabled_runtime_block',
    'feature_flag_enablement_blocks',
    'idempotency_mismatch_blocks',
    'route_worker_queue_tool_media_supabase_sql_runtime_requests_block',
    'signed_public_artifact_and_delivery_unlock_requests_block',
    'safety_flags_remain_false',
  ],
  readyStatus: valid.status,
  futureDryRunConfirmationGate: valid.dryRunConfirmationGate,
  nextMilestone: valid.nextMilestone,
}, null, 2))
