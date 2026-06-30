import assert from 'node:assert/strict'
import {
  buildGstreamerMkvtoolnixGuardedWorkerRouteRequest,
  createGstreamerMkvtoolnixGuardedWorkerRouteResponse,
  summarizeGstreamerMkvtoolnixGuardedWorkerRouteBoundary,
  validateGstreamerMkvtoolnixGuardedWorkerRouteRequest,
} from '../../src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-route-contracts'

const createdAt = new Date('2026-06-30T15:10:00.000Z').toISOString()
const baseline = buildGstreamerMkvtoolnixGuardedWorkerRouteRequest({ createdAt })
const baselineResult = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest(baseline)

assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.routeStatus, 'registered_disabled_backend_service_role_route_contract')
assert.equal(baselineResult.blockers.length, 0)
assert.equal(baselineResult.workerBlockers.length, 0)
assert.equal(
  baselineResult.nextRequiredGate,
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1',
)
assert.equal(baseline.routeRegistered, true)
assert.equal(baseline.routeEnabled, false)
assert.equal(baseline.routeExecution, false)
assert.equal(baseline.workerDispatch, false)
assert.equal(baseline.workerExecution, false)
assert.equal(baseline.gstreamerExecution, false)
assert.equal(baseline.mkvtoolnixExecution, false)
assert.equal(baseline.mediaProcessing, false)
assert.equal(baseline.signedUrlCreation, false)
assert.equal(baseline.publicArtifactCreation, false)
assert.equal(baseline.finalRenderExport, false)
assert.equal(baseline.routeIdempotencyKey, baseline.workerEnvelope.idempotencyRef.id)

const response = createGstreamerMkvtoolnixGuardedWorkerRouteResponse(baseline)
assert.equal(response.routeStatus, 'registered_disabled_backend_service_role_route_contract')
assert.equal(response.routeExecution, false)
assert.equal(response.workerDispatch, false)
assert.equal(response.workerExecution, false)
assert.equal(response.gstreamerExecution, false)
assert.equal(response.mkvtoolnixExecution, false)
assert.equal(response.mediaProcessing, false)
assert.equal(response.publicArtifactCreation, false)
assert.equal(response.signedUrlCreation, false)
assert.equal(response.finalRenderExport, false)

for (const commandTemplateId of [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const) {
  const result = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest(
    buildGstreamerMkvtoolnixGuardedWorkerRouteRequest({ createdAt, commandTemplateId }),
  )
  assert.equal(result.ok, true, `${commandTemplateId} should be accepted as route contract metadata`)
}

const badServiceRole = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  serviceRoleContextRef: {
    ...baseline.serviceRoleContextRef,
    frontendCredentialExposure: true,
  },
} as unknown as typeof baseline)
assert.equal(badServiceRole.ok, false)
assert.ok(badServiceRole.blockers.includes('blocked_missing_backend_service_role_context'))

const missingSnapshot = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  workerEnvelope: {
    ...baseline.workerEnvelope,
    approvedPlanSnapshotRef: {
      ...baseline.workerEnvelope.approvedPlanSnapshotRef,
      id: '',
    },
  },
})
assert.equal(missingSnapshot.ok, false)
assert.ok(missingSnapshot.blockers.includes('blocked_missing_approved_plan_snapshot'))
assert.ok(missingSnapshot.blockers.includes('blocked_worker_contract_validation_failed'))

const missingApproval = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  workerEnvelope: {
    ...baseline.workerEnvelope,
    approvalRecordRef: {
      ...baseline.workerEnvelope.approvalRecordRef,
      status: 'planned',
    },
  },
} as unknown as typeof baseline)
assert.equal(missingApproval.ok, false)
assert.ok(missingApproval.blockers.includes('blocked_missing_approval_record'))

const missingCredit = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  workerEnvelope: {
    ...baseline.workerEnvelope,
    creditPolicyRef: {
      ...baseline.workerEnvelope.creditPolicyRef,
      id: '',
    },
  },
})
assert.equal(missingCredit.ok, false)
assert.ok(missingCredit.blockers.includes('blocked_missing_credit_or_no_spend_policy'))

const missingLease = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  workerEnvelope: {
    ...baseline.workerEnvelope,
    workerLeaseRef: {
      ...baseline.workerEnvelope.workerLeaseRef,
      status: 'approved',
    },
  },
} as unknown as typeof baseline)
assert.equal(missingLease.ok, false)
assert.ok(missingLease.blockers.includes('blocked_missing_worker_lease'))

const missingIdempotency = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  routeIdempotencyKey: '',
})
assert.equal(missingIdempotency.ok, false)
assert.ok(missingIdempotency.blockers.includes('blocked_missing_idempotency_key'))
assert.ok(missingIdempotency.blockers.includes('blocked_idempotency_mismatch'))

const idempotencyMismatch = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  routeIdempotencyKey: 'wrong-idempotency-key',
})
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_idempotency_mismatch'))

const unapprovedTemplate = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  workerEnvelope: {
    ...baseline.workerEnvelope,
    commandTemplateRef: {
      ...baseline.workerEnvelope.commandTemplateRef,
      templateId: 'arbitrary_shell_command',
    },
  },
} as unknown as typeof baseline)
assert.equal(unapprovedTemplate.ok, false)
assert.ok(unapprovedTemplate.blockers.includes('blocked_unapproved_command_template'))

const runtimeAttempt = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  workerDispatch: true,
} as unknown as typeof baseline)
assert.equal(runtimeAttempt.ok, false)
assert.ok(runtimeAttempt.blockers.includes('blocked_runtime_execution_not_enabled'))

const workerRuntimeAttempt = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  workerEnvelope: {
    ...baseline.workerEnvelope,
    safety: {
      ...baseline.workerEnvelope.safety,
      gstreamerExecution: true,
    },
  },
} as unknown as typeof baseline)
assert.equal(workerRuntimeAttempt.ok, false)
assert.ok(workerRuntimeAttempt.blockers.includes('blocked_runtime_execution_not_enabled'))
assert.ok(workerRuntimeAttempt.blockers.includes('blocked_worker_contract_validation_failed'))

const publicArtifactAttempt = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  publicArtifactCreation: true,
} as unknown as typeof baseline)
assert.equal(publicArtifactAttempt.ok, false)
assert.ok(publicArtifactAttempt.blockers.includes('blocked_public_or_signed_artifact_attempt'))

const deliveryAttempt = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...baseline,
  finalRenderExport: true,
} as unknown as typeof baseline)
assert.equal(deliveryAttempt.ok, false)
assert.ok(deliveryAttempt.blockers.includes('blocked_delivery_or_unlock_attempt'))

const boundary = summarizeGstreamerMkvtoolnixGuardedWorkerRouteBoundary()
assert.ok(boundary.some((line) => line.includes('Backend-service-role-only route contract metadata')))
assert.ok(boundary.some((line) => line.includes('worker enqueue implementation')))
assert.ok(boundary.some((line) => line.includes('runtime execution remains blocked')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'baseline_guarded_worker_route_contract_validates',
    'response_is_sanitized_and_all_runtime_flags_false',
    'all_allowed_command_templates_validate_as_route_metadata',
    'backend_service_role_context_required',
    'approved_snapshot_approval_credit_worker_lease_required',
    'idempotency_required_and_must_match_route_basis',
    'unapproved_command_template_blocks',
    'route_and_worker_runtime_attempts_block',
    'signed_public_artifact_and_delivery_attempts_block',
    'no_route_worker_gstreamer_mkvtoolnix_media_supabase_sql_or_unlock_execution_enabled',
  ],
  routeStatus: baselineResult.routeStatus,
  nextRequiredGate: baselineResult.nextRequiredGate,
}, null, 2))
