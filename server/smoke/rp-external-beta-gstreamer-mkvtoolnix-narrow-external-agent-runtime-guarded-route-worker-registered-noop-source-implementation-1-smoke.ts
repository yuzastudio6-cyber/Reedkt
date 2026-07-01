import assert from 'node:assert/strict'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
  createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse,
  summarizeGstreamerMkvtoolnixNarrowRegisteredNoopSourceBoundary,
  validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1'
import { buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput } from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1'

const validInput = buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput()
const valid = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(validInput)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_READY_STATUS)
assert.equal(valid.dryRunConfirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV)
assert.equal(valid.dryRunConfirmationRequired, true)
assert.equal(valid.sanitizedSource.routeOwner, 'backend_service_role_only')
assert.equal(valid.sanitizedSource.routeRegistrationMode, 'source_declared_registered_but_runtime_disabled')
assert.equal(valid.sanitizedSource.routeRuntimeMode, 'disabled_registered_noop_source_contract_only')
assert.equal(valid.sanitizedSource.workerSourceMode, 'source_declared_not_dispatched')
assert.equal(valid.sanitizedSource.boundaryAccepted, true)
assert.equal(valid.sanitizedSource.productionRouteFileCreated, false)
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
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE)

const response = createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse(validInput)
assert.equal(response.status, 'accepted_registered_noop_source_contract')
assert.equal(response.runtimeEnabled, false)
assert.equal(response.routeRegisteredAtRuntime, false)
assert.equal(response.routeExecution, false)
assert.equal(response.workerDispatch, false)
assert.equal(response.workerExecution, false)
assert.equal(response.toolExecution, false)

const missingSource = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput({ sourceImplementationId: '' }),
)
assert.equal(missingSource.ok, false)
assert.ok(missingSource.blockers.includes('blocked_missing_registered_noop_source_reference'))

const invalidBoundary = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput({
    boundaryInput: buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ routeExecution: true }),
  }),
)
assert.equal(invalidBoundary.ok, false)
assert.ok(invalidBoundary.blockers.includes('blocked_narrow_route_worker_registered_noop_boundary_validation_failed'))

for (const invalidState of [
  { routeOwner: 'frontend' },
  { routeRegistrationMode: 'source_declared_not_registered' },
  { routeRegistrationMode: 'registered_route_handler' },
  { routeRuntimeMode: 'enabled_route_runtime' },
  { workerSourceMode: 'worker_dispatch_enabled' },
  { dryRunConfirmationGate: 'WRONG_GATE' },
] satisfies Partial<Parameters<typeof buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput>[0]>[]) {
  const result = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
    buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(invalidState),
  )
  assert.equal(result.ok, false, JSON.stringify(invalidState))
  assert.ok(result.blockers.includes('blocked_invalid_registered_noop_source_state'), JSON.stringify(invalidState))
}

const idempotencyMismatch = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput({ sourceIdempotencyKey: 'wrong-key' }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_registered_noop_source_idempotency_mismatch'))

const runtimeEnabled = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput({ routeRuntimeMode: 'enabled_route_runtime' }),
)
assert.equal(runtimeEnabled.ok, false)
assert.ok(runtimeEnabled.blockers.includes('blocked_registered_noop_source_runtime_enabled_without_future_packet'))

for (const runtimeOverride of [
  { productionRouteFileCreated: true },
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
] satisfies Partial<Parameters<typeof buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput>[0]>[]) {
  const result = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
    buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(runtimeOverride),
  )
  assert.equal(result.ok, false, JSON.stringify(runtimeOverride))
  assert.ok(
    result.blockers.includes('blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled'),
    JSON.stringify(runtimeOverride),
  )
}

const publicArtifact = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput({ publicArtifactCreation: true }),
)
assert.equal(publicArtifact.ok, false)
assert.ok(publicArtifact.blockers.includes('blocked_registered_noop_public_or_signed_artifact_attempt'))

const finalExport = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput({ finalRenderExport: true }),
)
assert.equal(finalExport.ok, false)
assert.ok(finalExport.blockers.includes('blocked_registered_noop_delivery_or_unlock_attempt'))

const summary = summarizeGstreamerMkvtoolnixNarrowRegisteredNoopSourceBoundary()
assert.ok(summary.some((line) => line.includes('backend-source metadata and validation helpers only')))
assert.ok(summary.some((line) => line.includes('routeRegisteredAtRuntime remains false')))
assert.ok(summary.some((line) => line.includes('Worker dispatch')))
assert.ok(summary.some((line) => line.includes(RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV)))

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        'valid_registered_noop_source_contract_validates',
        'response_shape_remains_runtime_disabled',
        'missing_registered_source_reference_blocks',
        'invalid_boundary_blocks',
        'invalid_registered_owner_modes_or_gate_block',
        'idempotency_mismatch_blocks',
        'runtime_enablement_drift_blocks',
        'route_worker_queue_tool_media_supabase_sql_runtime_requests_block',
        'signed_public_artifact_and_delivery_unlock_requests_block',
        'safety_flags_remain_false',
      ],
      readyStatus: valid.status,
      futureDryRunConfirmationGate: valid.dryRunConfirmationGate,
      nextMilestone: valid.nextMilestone,
    },
    null,
    2,
  ),
)
