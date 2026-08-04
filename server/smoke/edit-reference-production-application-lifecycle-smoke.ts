import assert from 'node:assert/strict'
import {
  createEditReferenceProductionApplicationLifecycleReceipt,
  createEditReferenceProductionApplicationLifecycleRequest,
  validateEditReferenceProductionApplicationLifecycleReceipt,
  type EditReferenceProductionApplicationLifecycleReceipt,
} from '../edit-references/edit-reference-production-application-lifecycle'
import {
  createEditReferenceProductionOutputFrameAuthority,
  validateEditReferenceProductionOutputFrameAuthority,
} from '../edit-references/edit-reference-production-output-frame-authority'
import {
  editReferenceProductionPersistenceContract,
  validateEditReferenceProductionPersistenceContract,
} from '../edit-references/edit-reference-production-persistence-contract'

const hash = (character: string): string => character.repeat(64)

const outputFrameConfirmation = createEditReferenceProductionOutputFrameAuthority({
  repositoryAuthority: 'supabase_rls_transactional',
  workspaceId: 'workspace-a',
  projectId: 'project-a',
  editSessionId: 'edit-a',
  exactEditPreferenceRecordRevision: 9,
  planningInputRevision: 4,
  confirmationId: 'frame-confirmation-a',
  aspectRatio: '16:9',
  confirmedAt: '2026-07-21T00:59:00.000Z',
})
validateEditReferenceProductionOutputFrameAuthority(outputFrameConfirmation)

const applyInput = {
  mutation: 'apply',
  actorUserId: 'user-owner-a',
  workspaceId: 'workspace-a',
  projectId: 'project-a',
  editSessionId: 'edit-a',
  editReferenceId: 'preference-a',
  studySessionId: 'study-a',
  dnaVersionId: 'dna-a-v3',
  applicationId: 'application-a-v1',
  expectedCurrentApplicationId: null,
  expectedReferenceRevision: 7,
  expectedPlanningInputRevision: 4,
  applicationContentDigestSha256: hash('a'),
  applicationContextHashSha256: hash('b'),
  targetUnderstandingPackageDigestSha256: hash('c'),
  outputFrameConfirmation,
  idempotencyKeyHashSha256: hash('d'),
  requestedAt: '2026-07-21T01:00:00.000Z',
} as const

const applyRequest = createEditReferenceProductionApplicationLifecycleRequest(applyInput)
const reorderedApplyRequest = createEditReferenceProductionApplicationLifecycleRequest(
  Object.fromEntries(Object.entries(applyInput).reverse()) as unknown as typeof applyInput,
)
assert.equal(reorderedApplyRequest.requestDigestSha256, applyRequest.requestDigestSha256)

const applyReceipt = createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'application-transaction-a',
  request: applyRequest,
  committedReferenceRevision: 8,
  committedPlanningInputRevision: 5,
  applicationStatusAfter: 'connected',
  preferenceContextStatusAfter: 'connected',
  priorDraftPlanDisposition: 'invalidated',
  priorDraftEstimateDisposition: 'invalidated',
  approvalStatusAfter: 'reset_after_revision',
  executionAuthorizationDisposition: 'revoked',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'application-plan-invalidation-a',
  auditEventIds: ['audit-apply-a', 'audit-plan-invalidated-a'],
  idempotencyReceiptId: 'idempotency-receipt-a',
  idempotencyResponseDigestSha256: hash('e'),
  committedAt: '2026-07-21T01:00:01.000Z',
})

validateEditReferenceProductionApplicationLifecycleReceipt({
  request: applyRequest,
  receipt: applyReceipt,
})

const persistenceSummary = validateEditReferenceProductionPersistenceContract()
assert.equal(persistenceSummary.version, 'edit-reference-production-persistence-contract-v6')
assert.equal(persistenceSummary.planningAuthorityStateCount, 3)
assert.equal(persistenceSummary.longFormStudyTableCount, 6)
assert.equal(persistenceSummary.longFormStudyOperationCount, 9)
assert.equal(persistenceSummary.longFormStudyRuntimeEnabled, false)
assert.deepEqual(
  editReferenceProductionPersistenceContract.applicationLifecycleTransaction.supportedMutations,
  ['apply', 'replace', 'remove'],
)
assert.equal(
  editReferenceProductionPersistenceContract.applicationLifecycleTransaction
    .planningInvalidation.firstApplyInvalidatesExistingDraftPlanAndEstimate,
  true,
)

assert.throws(() => createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  expectedCurrentApplicationId: 'already-connected-application',
}), /production Preference Application lifecycle authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  mutation: 'replace',
  expectedCurrentApplicationId: null,
}), /production Preference Application lifecycle authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  mutation: 'replace',
  applicationId: 'application-a-v1',
  expectedCurrentApplicationId: 'application-a-v1',
}), /production Preference Application lifecycle authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  mutation: 'remove',
  expectedCurrentApplicationId: 'application-a-v1',
}), /production Preference Application lifecycle authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  unexpectedAuthority: true,
} as typeof applyInput), /production Preference Application lifecycle authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  outputFrameConfirmation: null,
}), /production Preference Application lifecycle authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  outputFrameConfirmation: {
    ...outputFrameConfirmation,
    planningInputRevision: outputFrameConfirmation.planningInputRevision + 1,
  },
}), /production (Preference Application lifecycle|output-frame) authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'bad-revision-transaction',
  request: applyRequest,
  committedReferenceRevision: applyRequest.expectedReferenceRevision,
  committedPlanningInputRevision: applyRequest.expectedPlanningInputRevision + 1,
  applicationStatusAfter: 'connected',
  preferenceContextStatusAfter: 'connected',
  priorDraftPlanDisposition: 'absent',
  priorDraftEstimateDisposition: 'absent',
  approvalStatusAfter: 'not_approved',
  executionAuthorizationDisposition: 'not_active',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'invalid-revision-receipt',
  auditEventIds: ['audit-invalid-revision'],
  idempotencyReceiptId: 'idempotency-invalid-revision',
  idempotencyResponseDigestSha256: hash('f'),
  committedAt: '2026-07-21T01:00:01.000Z',
}), /production Preference Application lifecycle authority/i)

assert.throws(() => createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'bad-timestamp-transaction',
  request: applyRequest,
  committedReferenceRevision: applyRequest.expectedReferenceRevision + 1,
  committedPlanningInputRevision: applyRequest.expectedPlanningInputRevision + 1,
  applicationStatusAfter: 'connected',
  preferenceContextStatusAfter: 'connected',
  priorDraftPlanDisposition: 'absent',
  priorDraftEstimateDisposition: 'absent',
  approvalStatusAfter: 'not_approved',
  executionAuthorizationDisposition: 'not_active',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'invalid-timestamp-receipt',
  auditEventIds: ['audit-invalid-timestamp'],
  idempotencyReceiptId: 'idempotency-invalid-timestamp',
  idempotencyResponseDigestSha256: hash('3'),
  committedAt: '2026-07-21T00:59:59.000Z',
}), /production Preference Application lifecycle authority/i)

const replaceRequest = createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  mutation: 'replace',
  applicationId: 'application-a-v2',
  expectedCurrentApplicationId: 'application-a-v1',
})
const replaceReceipt = createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'application-transaction-replace-a',
  request: replaceRequest,
  committedReferenceRevision: replaceRequest.expectedReferenceRevision + 1,
  committedPlanningInputRevision: replaceRequest.expectedPlanningInputRevision + 1,
  applicationStatusAfter: 'connected',
  preferenceContextStatusAfter: 'connected',
  priorDraftPlanDisposition: 'invalidated',
  priorDraftEstimateDisposition: 'invalidated',
  approvalStatusAfter: 'reset_after_revision',
  executionAuthorizationDisposition: 'revoked',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'application-plan-invalidation-replace-a',
  auditEventIds: ['audit-replace-a', 'audit-plan-invalidated-replace-a'],
  idempotencyReceiptId: 'idempotency-receipt-replace-a',
  idempotencyResponseDigestSha256: hash('2'),
  committedAt: '2026-07-21T01:01:01.000Z',
})
validateEditReferenceProductionApplicationLifecycleReceipt({
  request: replaceRequest,
  receipt: replaceReceipt,
})

const tamperedReceipt: EditReferenceProductionApplicationLifecycleReceipt = {
  ...applyReceipt,
  applicationStatusAfter: 'cleared',
}
assert.throws(() => validateEditReferenceProductionApplicationLifecycleReceipt({
  request: applyRequest,
  receipt: tamperedReceipt,
}), /production Preference Application lifecycle authority/i)

const removeRequest = createEditReferenceProductionApplicationLifecycleRequest({
  ...applyInput,
  mutation: 'remove',
  applicationId: 'application-a-v1',
  expectedCurrentApplicationId: 'application-a-v1',
  targetUnderstandingPackageDigestSha256: null,
  outputFrameConfirmation: null,
})
const removeReceipt = createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'application-transaction-remove-a',
  request: removeRequest,
  committedReferenceRevision: removeRequest.expectedReferenceRevision + 1,
  committedPlanningInputRevision: removeRequest.expectedPlanningInputRevision + 1,
  applicationStatusAfter: 'cleared',
  preferenceContextStatusAfter: 'invalidated',
  priorDraftPlanDisposition: 'invalidated',
  priorDraftEstimateDisposition: 'invalidated',
  approvalStatusAfter: 'reset_after_revision',
  executionAuthorizationDisposition: 'revoked',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'application-plan-invalidation-remove-a',
  auditEventIds: ['audit-remove-a', 'audit-plan-invalidated-remove-a'],
  idempotencyReceiptId: 'idempotency-receipt-remove-a',
  idempotencyResponseDigestSha256: hash('1'),
  committedAt: '2026-07-21T01:02:01.000Z',
})
validateEditReferenceProductionApplicationLifecycleReceipt({
  request: removeRequest,
  receipt: removeReceipt,
})

console.log(JSON.stringify({
  status: 'passed',
  contractVersion: persistenceSummary.version,
  lifecycleRpc: editReferenceProductionPersistenceContract.applicationLifecycleTransaction.rpcName,
  supportedMutations: editReferenceProductionPersistenceContract.applicationLifecycleTransaction.supportedMutations,
  applyReceiptDigestSha256: applyReceipt.receiptDigestSha256,
  replaceReceiptDigestSha256: replaceReceipt.receiptDigestSha256,
  removeReceiptDigestSha256: removeReceipt.receiptDigestSha256,
  remoteMutationAttempted: false,
  productionReady: false,
}, null, 2))
