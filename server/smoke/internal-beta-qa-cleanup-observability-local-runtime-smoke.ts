import assert from 'node:assert/strict'

import {
  createInternalBetaQaCleanupObservabilityLocalRuntime,
  type InternalBetaQaCleanupObservabilityLocalRuntimeInput,
} from '../services/internal-beta-qa-cleanup-observability-local-runtime'

function buildInput(
  overrides: Partial<InternalBetaQaCleanupObservabilityLocalRuntimeInput> = {},
): InternalBetaQaCleanupObservabilityLocalRuntimeInput {
  return {
    workspaceId: 'workspace_qa_cleanup_observability_001',
    projectId: 'project_qa_cleanup_observability_001',
    approvedPlanSnapshotId: 'approved_snapshot_qa_cleanup_observability_001',
    creditReservationId: 'credit_reservation_qa_cleanup_observability_001',
    jobId: 'job_qa_cleanup_observability_001',
    artifactManifestId: 'artifact_manifest_qa_cleanup_observability_001',
    renderRequestId: 'remotion_private_render_request_qa_cleanup_001',
    idempotencyKey: 'idempotency_qa_cleanup_observability_001',
    qaChecks: [
      {
        category: 'approved_snapshot',
        outcome: 'passed',
        summary: 'Approved snapshot reference is present for local QA metadata review.',
        linkedJobIds: ['job_qa_cleanup_observability_001'],
      },
      {
        category: 'private_preview_export',
        outcome: 'passed',
        summary: 'Generated-local Remotion preview evidence is linked by metadata only.',
        linkedArtifactIds: ['artifact_preview_001'],
      },
      {
        category: 'safety_boundary',
        outcome: 'passed',
        summary: 'No signed/public artifact, route, worker, provider, or Supabase runtime is enabled.',
      },
    ],
    cleanupPolicies: [
      {
        artifactId: 'artifact_preview_001',
        fileName: 'reeditpro-internal-beta-generated-local-preview.mp4',
        cleanupPolicy: 'qa_short_retention',
        cleanupStatus: 'recorded_only',
      },
      {
        artifactId: 'artifact_manifest_001',
        fileName: 'manifest.json',
        cleanupPolicy: 'worker_temp_delete_after_job',
        cleanupStatus: 'blocked_pending_storage_runtime',
      },
    ],
    observabilityEvents: [
      {
        eventType: 'qa_gate_recorded',
        severity: 'info',
        message: 'Local QA gate metadata recorded without remote sink write.',
      },
      {
        eventType: 'cleanup_policy_recorded',
        severity: 'info',
        message: 'Cleanup policy metadata recorded without cleanup execution.',
      },
      {
        eventType: 'rollback_gate_recorded',
        severity: 'warning',
        message: 'Rollback remains metadata-only pending remote runtime policy.',
      },
    ],
    rollbackPlan: {
      rollbackAllowed: false,
      rollbackScope: 'blocked_pending_remote_runtime',
      reason: 'Local runtime records rollback gate only; no remote rollback is authorized.',
    },
    metadata: { source: 'internal_beta_qa_cleanup_observability_local_runtime_smoke' },
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof createInternalBetaQaCleanupObservabilityLocalRuntime>) {
  assert.equal(result.localOnly, true)
  assert.equal(result.persistedToSupabase, false)
  assert.equal(result.safety.routeExecution, false)
  assert.equal(result.safety.remoteSupabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.serviceRoleRouteExecution, false)
  assert.equal(result.safety.creditMutation, false)
  assert.equal(result.safety.jobEnqueueExecution, false)
  assert.equal(result.safety.jobEventWriteExecution, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.providerModelCall, false)
  assert.equal(result.safety.rawPromptExecution, false)
  assert.equal(result.safety.remotionExecution, false)
  assert.equal(result.safety.ffmpegExecution, false)
  assert.equal(result.safety.ffprobeExecution, false)
  assert.equal(result.safety.mediaProcessing, false)
  assert.equal(result.safety.qaMediaInspection, false)
  assert.equal(result.safety.cleanupExecution, false)
  assert.equal(result.safety.rollbackExecution, false)
  assert.equal(result.safety.remoteObservabilitySinkWrite, false)
  assert.equal(result.safety.storageObjectCreation, false)
  assert.equal(result.safety.storageObjectRead, false)
  assert.equal(result.safety.storageObjectDelete, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.privateMediaProcessing, false)
  assert.equal(result.safety.userMediaProcessing, false)
  assert.equal(result.safety.internalBetaUnlock, false)
}

const valid = createInternalBetaQaCleanupObservabilityLocalRuntime(buildInput())
assert.equal(valid.ok, true)
assert.equal(valid.status, 'local_qa_cleanup_observability_validated_no_remote_execution')
assert.equal(valid.localQaGateRecorded, true)
assert.equal(valid.localCleanupPoliciesRecorded, 2)
assert.equal(valid.localObservabilityEventsRecorded, 3)
assert.equal(valid.localRollbackGateRecorded, true)
assert.match(valid.recordHash ?? '', /^[a-f0-9]{64}$/)
assert.match(valid.record?.id ?? '', /^qa_cleanup_observability_[a-f0-9]{24}$/)
assert.equal(valid.summary?.qaExecution, false)
assert.equal(valid.summary?.qaCheckCount, 3)
assert.equal(valid.summary?.passedCount, 3)
assert.equal(valid.summary?.cleanupExecuted, false)
assert.equal(valid.summary?.remoteObservabilitySinkWrite, false)
assert.equal(valid.summary?.rollbackExecuted, false)
assert.equal(valid.record?.rollbackPlan.rollbackExecuted, false)
assertSafety(valid)

const repeated = createInternalBetaQaCleanupObservabilityLocalRuntime(buildInput())
assert.equal(repeated.recordHash, valid.recordHash, 'same QA cleanup observability basis should hash deterministically')
assert.equal(repeated.record?.id, valid.record?.id, 'same QA cleanup observability basis should create deterministic id')
assertSafety(repeated)

const missingQa = createInternalBetaQaCleanupObservabilityLocalRuntime(buildInput({ qaChecks: [] }))
assert.equal(missingQa.ok, false)
assert.equal(missingQa.status, 'blocked_invalid_qa_cleanup_observability_input')
assert.ok(missingQa.validation.errors.some((error) => error.includes('qaChecks')))
assertSafety(missingQa)

const pathFileName = createInternalBetaQaCleanupObservabilityLocalRuntime(
  buildInput({
    cleanupPolicies: [
      {
        artifactId: 'artifact_preview_001',
        fileName: '../preview.mp4',
      },
    ],
  }),
)
assert.equal(pathFileName.ok, false)
assert.ok(pathFileName.validation.errors.some((error) => error.includes('file name only')))
assertSafety(pathFileName)

const signedUrl = createInternalBetaQaCleanupObservabilityLocalRuntime(
  buildInput({ metadata: { signedUrl: 'https://example.test/private-preview.mp4?signature=abc' } }),
)
assert.equal(signedUrl.ok, false)
assert.ok(signedUrl.validation.errors.some((error) => error.includes('signed/public URL')))
assertSafety(signedUrl)

const rawPrompt = createInternalBetaQaCleanupObservabilityLocalRuntime(
  buildInput({
    qaChecks: [
      {
        category: 'safety_boundary',
        outcome: 'passed',
        summary: 'Unsafe raw prompt should be rejected.',
        metadata: { rawPrompt: 'make the final export now' },
      },
    ],
  }),
)
assert.equal(rawPrompt.ok, false)
assert.ok(rawPrompt.validation.errors.some((error) => error.includes('raw prompt')))
assertSafety(rawPrompt)

console.log('internal-beta-qa-cleanup-observability-local-runtime-smoke passed')
