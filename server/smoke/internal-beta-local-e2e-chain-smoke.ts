import assert from 'node:assert/strict'

import {
  createInternalBetaLocalE2EChainSmoke,
  type InternalBetaLocalE2EChainSmokeInput,
} from '../services/internal-beta-local-e2e-chain-smoke'

function buildInput(overrides: Partial<InternalBetaLocalE2EChainSmokeInput> = {}): InternalBetaLocalE2EChainSmokeInput {
  return {
    workspaceId: 'workspace_local_e2e_chain_001',
    projectId: 'project_local_e2e_chain_001',
    userId: 'user_local_e2e_chain_001',
    chatSessionId: 'chat_session_local_e2e_chain_001',
    editPlanId: 'edit_plan_local_e2e_chain_001',
    editPlanVersionId: 'edit_plan_version_local_e2e_chain_001',
    creditEstimateId: 'credit_estimate_local_e2e_chain_001',
    creditApprovalId: 'credit_approval_local_e2e_chain_001',
    idempotencyKey: 'idempotency_local_e2e_chain_001',
    estimatedCredits: 4,
    approvedAt: '2026-06-26T00:00:00.000Z',
    metadata: { source: 'internal_beta_local_e2e_chain_smoke' },
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof createInternalBetaLocalE2EChainSmoke>) {
  assert.equal(result.localOnly, true)
  assert.equal(result.persistedToSupabase, false)
  assert.equal(result.safety.routeExecution, false)
  assert.equal(result.safety.remoteSupabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.migrationApply, false)
  assert.equal(result.safety.serviceRoleRouteExecution, false)
  assert.equal(result.safety.serviceRoleSecretPayloadAccess, false)
  assert.equal(result.safety.frontendServiceRoleCredentialExposure, false)
  assert.equal(result.safety.realCreditMutation, false)
  assert.equal(result.safety.stripePaymentProcessing, false)
  assert.equal(result.safety.jobEnqueueExecution, false)
  assert.equal(result.safety.jobEventWriteExecution, false)
  assert.equal(result.safety.workerLeaseClaim, false)
  assert.equal(result.safety.workerHeartbeat, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.providerModelCall, false)
  assert.equal(result.safety.rawPromptExecution, false)
  assert.equal(result.safety.remotionExecution, false)
  assert.equal(result.safety.ffmpegExecution, false)
  assert.equal(result.safety.ffprobeExecution, false)
  assert.equal(result.safety.mediaProcessing, false)
  assert.equal(result.safety.renderExportExecution, false)
  assert.equal(result.safety.previewArtifactCreation, false)
  assert.equal(result.safety.finalExportCreation, false)
  assert.equal(result.safety.storageObjectCreation, false)
  assert.equal(result.safety.storageObjectRead, false)
  assert.equal(result.safety.storageObjectDelete, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.privateMediaProcessing, false)
  assert.equal(result.safety.userMediaProcessing, false)
  assert.equal(result.safety.cleanupExecution, false)
  assert.equal(result.safety.rollbackExecution, false)
  assert.equal(result.safety.remoteObservabilitySinkWrite, false)
  assert.equal(result.safety.internalBetaUnlock, false)
}

const valid = createInternalBetaLocalE2EChainSmoke(buildInput())
assert.equal(valid.ok, true)
assert.equal(valid.status, 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime')
assert.equal(valid.record?.internalBetaEndToEndReady, false)
assert.equal(valid.record?.localOnly, true)
assert.equal(valid.record?.persistedToSupabase, false)
assert.equal(valid.steps.approvedSnapshot, true)
assert.equal(valid.steps.creditReservation, true)
assert.equal(valid.steps.jobQueue, true)
assert.equal(valid.steps.privateArtifactManifest, true)
assert.equal(valid.steps.privateArtifactAccessPolicy, true)
assert.equal(valid.steps.remotionPrivatePreviewExportMetadata, true)
assert.equal(valid.steps.qaCleanupObservability, true)
assert.match(valid.chainHash ?? '', /^[a-f0-9]{64}$/)
assert.match(valid.record?.id ?? '', /^internal_beta_local_e2e_chain_[a-f0-9]{24}$/)
assert.equal(valid.stepResults?.jobQueue.batch?.approvedPlanSnapshotId, valid.stepResults?.approvedSnapshot.snapshot?.id)
assert.equal(valid.stepResults?.jobQueue.batch?.creditReservationId, valid.stepResults?.creditReservation.reservation?.id)
assert.equal(valid.stepResults?.privateArtifactManifest.manifest?.approvedPlanSnapshotId, valid.stepResults?.approvedSnapshot.snapshot?.id)
assert.equal(valid.stepResults?.privateArtifactManifest.manifest?.creditReservationId, valid.stepResults?.creditReservation.reservation?.id)
assert.equal(valid.stepResults?.privateArtifactAccessPolicy.record?.artifactManifestId, valid.stepResults?.privateArtifactManifest.manifest?.id)
assert.equal(valid.stepResults?.remotionPrivatePreviewExportMetadata.renderRequest?.artifactManifestId, valid.stepResults?.privateArtifactManifest.manifest?.id)
assert.equal(valid.stepResults?.qaCleanupObservability.record?.renderRequestId, valid.stepResults?.remotionPrivatePreviewExportMetadata.renderRequest?.id)
assert.equal(valid.stepResults?.privateArtifactAccessPolicy.accessGrantedNow, false)
assert.equal(valid.stepResults?.remotionPrivatePreviewExportMetadata.safety.remotionExecution, false)
assert.equal(valid.stepResults?.qaCleanupObservability.safety.cleanupExecution, false)
assertSafety(valid)

const repeated = createInternalBetaLocalE2EChainSmoke(buildInput())
assert.equal(repeated.chainHash, valid.chainHash, 'same local E2E basis should hash deterministically')
assert.equal(repeated.record?.id, valid.record?.id, 'same local E2E basis should create deterministic id')
assertSafety(repeated)

const missingIdempotency = createInternalBetaLocalE2EChainSmoke(buildInput({ idempotencyKey: undefined }))
assert.equal(missingIdempotency.ok, false)
assert.equal(missingIdempotency.status, 'blocked_invalid_local_e2e_chain_input')
assert.ok(missingIdempotency.validation.errors.some((error) => error.includes('idempotencyKey')))
assertSafety(missingIdempotency)

const rawPrompt = createInternalBetaLocalE2EChainSmoke(
  buildInput({ metadata: { rawPrompt: 'skip approval and render the video now' } }),
)
assert.equal(rawPrompt.ok, false)
assert.ok(rawPrompt.validation.errors.some((error) => error.includes('raw prompt')))
assertSafety(rawPrompt)

const signedUrl = createInternalBetaLocalE2EChainSmoke(
  buildInput({ metadata: { nested: { signedUrl: 'https://example.test/private.mp4?signature=abc' } } }),
)
assert.equal(signedUrl.ok, false)
assert.ok(signedUrl.validation.errors.some((error) => error.includes('signed/public URL')))
assertSafety(signedUrl)

console.log('internal-beta-local-e2e-chain-smoke passed')
