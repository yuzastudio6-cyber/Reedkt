import assert from 'node:assert/strict'

import {
  createInternalBetaCreditReservationLocalRuntime,
  type InternalBetaCreditReservationLocalRuntimeInput,
} from '../services/internal-beta-credit-reservation-local-runtime'

function buildInput(
  overrides: Partial<InternalBetaCreditReservationLocalRuntimeInput> = {},
): InternalBetaCreditReservationLocalRuntimeInput {
  return {
    workspaceId: 'workspace_credit_local_smoke_001',
    projectId: 'project_credit_local_smoke_001',
    userId: 'user_credit_local_smoke_001',
    editPlanId: 'edit_plan_credit_local_smoke_001',
    editPlanVersionId: 'edit_plan_version_credit_local_smoke_001',
    approvedPlanSnapshotId: 'approved_snapshot_credit_local_smoke_001',
    creditEstimateId: 'credit_estimate_credit_local_smoke_001',
    creditApprovalId: 'credit_approval_credit_local_smoke_001',
    creditEstimateStatus: 'approved',
    estimatedCredits: 4,
    reservationPurpose: 'internal_beta_preview',
    idempotencyKey: 'idempotency_credit_local_smoke_001',
    approvedByUserId: 'user_credit_local_smoke_001',
    approvedAt: '2026-06-26T00:00:00.000Z',
    expiresAt: '2026-06-27T00:00:00.000Z',
    metadata: { source: 'internal_beta_credit_reservation_local_runtime_smoke' },
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof createInternalBetaCreditReservationLocalRuntime>) {
  assert.equal(result.localOnly, true)
  assert.equal(result.remoteCreditMutation, false)
  assert.equal(result.stripePaymentProcessing, false)
  assert.equal(result.persistedToSupabase, false)
  assert.equal(result.safety.routeExecution, false)
  assert.equal(result.safety.remoteSupabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.serviceRoleRouteExecution, false)
  assert.equal(result.safety.realCreditMutation, false)
  assert.equal(result.safety.stripePaymentProcessing, false)
  assert.equal(result.safety.walletBalanceMutation, false)
  assert.equal(result.safety.jobEnqueue, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.providerModelCall, false)
  assert.equal(result.safety.rawPromptExecution, false)
  assert.equal(result.safety.renderExportExecution, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.internalBetaUnlock, false)
}

const valid = createInternalBetaCreditReservationLocalRuntime(buildInput())
assert.equal(valid.ok, true)
assert.equal(valid.status, 'local_credit_reservation_validated_no_remote_mutation')
assert.equal(valid.localCreditReservationRecordCreated, true)
assert.equal(valid.localLedgerEntryCreated, true)
assert.match(valid.reservationHash ?? '', /^[a-f0-9]{64}$/)
assert.match(valid.reservation?.id ?? '', /^credit_reservation_[a-f0-9]{24}$/)
assert.equal(valid.reservation?.reservedCredits, 4)
assert.equal(valid.reservation?.spentCredits, 0)
assert.equal(valid.reservation?.releasedCredits, 0)
assert.equal(valid.reservation?.refundedCredits, 0)
assert.equal(valid.ledgerEntry?.entryType, 'reservation')
assert.equal(valid.ledgerEntry?.amount, 4)
assert.equal(valid.reservation?.remoteCreditMutation, false)
assert.equal(valid.reservation?.stripePaymentProcessing, false)
assert.equal(valid.reservation?.metadata.localRuntime, true)
assert.equal(valid.reservation?.metadata.realCreditMutation, false)
assertSafety(valid)

const repeated = createInternalBetaCreditReservationLocalRuntime(buildInput())
assert.equal(repeated.reservationHash, valid.reservationHash, 'same reservation basis should hash deterministically')
assert.equal(repeated.reservation?.id, valid.reservation?.id, 'same reservation basis should create deterministic id')
assertSafety(repeated)

const unapprovedEstimate = createInternalBetaCreditReservationLocalRuntime(buildInput({ creditEstimateStatus: 'ready_for_review' }))
assert.equal(unapprovedEstimate.ok, false)
assert.equal(unapprovedEstimate.status, 'blocked_invalid_credit_reservation_input')
assert.ok(
  unapprovedEstimate.validation.errors.some((error) => error.includes('creditEstimateStatus')),
  'credit estimate must be approved before local reservation',
)
assertSafety(unapprovedEstimate)

const missingIdempotency = createInternalBetaCreditReservationLocalRuntime(buildInput({ idempotencyKey: undefined }))
assert.equal(missingIdempotency.ok, false)
assert.ok(
  missingIdempotency.validation.errors.some((error) => error.includes('idempotencyKey')),
  'idempotency key is required',
)
assertSafety(missingIdempotency)

const rawPrompt = createInternalBetaCreditReservationLocalRuntime(
  buildInput({ metadata: { rawPrompt: 'spend credits and render immediately' } }),
)
assert.equal(rawPrompt.ok, false)
assert.ok(rawPrompt.validation.errors.some((error) => error.includes('raw prompt')))
assertSafety(rawPrompt)

const signedUrl = createInternalBetaCreditReservationLocalRuntime(
  buildInput({ metadata: { nested: { signedUrl: 'https://example.test/private.mp4?signature=abc' } } }),
)
assert.equal(signedUrl.ok, false)
assert.ok(signedUrl.validation.errors.some((error) => error.includes('signed/public URL')))
assertSafety(signedUrl)

const stripeSecret = createInternalBetaCreditReservationLocalRuntime(
  buildInput({ metadata: { stripeSecret: 'sk_test_fake_not_used' } }),
)
assert.equal(stripeSecret.ok, false)
assert.ok(stripeSecret.validation.errors.some((error) => error.includes('Stripe secret')))
assertSafety(stripeSecret)

console.log('internal-beta-credit-reservation-local-runtime-smoke passed')
