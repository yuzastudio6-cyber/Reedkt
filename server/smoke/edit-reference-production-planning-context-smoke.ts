import assert from 'node:assert/strict'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import {
  calculatePreferenceApplicationContentDigest,
  calculatePreferenceApplicationTargetContextDigest,
} from '../edit-references/edit-reference-target-adaptation'
import {
  createEditReferenceProductionApplicationLifecycleReceipt,
  createEditReferenceProductionApplicationLifecycleRequest,
} from '../edit-references/edit-reference-production-application-lifecycle'
import {
  createEditReferenceProductionOutputFrameAuthority,
} from '../edit-references/edit-reference-production-output-frame-authority'
import {
  calculateEditReferenceProductionApplicationContextHash,
  createEditReferenceProductionPlanningContext,
  validateEditReferenceProductionPlanningContext,
} from '../edit-references/edit-reference-production-planning-context'
import {
  EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
  resolveEditReferenceProductionPlanningAuthority,
} from '../edit-references/edit-reference-production-planning-authority'

const hash = (character: string): string => character.repeat(64)
const precedence = [
  'safety_platform_tier_frame_credit_or_approved_constraint',
  'current_user_instruction',
  'target_context',
  'approved_preference_dna',
] as const

const targetContext: PreferenceApplicationRecord['targetContext'] = {
  projectId: 'project-a',
  editSessionId: 'edit-a',
  projectName: 'Documentary project',
  editName: 'Episode one',
  sourceMode: 'voice_first',
  contentType: 'documentary',
  sourceSummary: 'A verified whole-source documentary study.',
  currentUserInstruction: 'Keep the reporting restrained and evidence-led.',
  selectedEditLevel: 'premium',
  aspectRatio: '16:9',
  outputFrameConfirmed: true,
  platformTarget: 'youtube_standard',
  storyRole: 'explain the verified chronology',
  budgetPreference: 'balanced',
  directives: {
    captions: 'adapt',
    music: 'avoid',
    sfx: 'adapt',
    sourceOrder: 'preserve',
  },
  approvedConstraints: ['Preserve source chronology.', 'Do not imply unverified facts.'],
}

const targetUnderstanding: NonNullable<PreferenceApplicationRecord['targetUnderstanding']> = {
  packageId: 'target-package-a',
  packageDigestSha256: hash('1'),
  sourceStorageObjectRecordId: 'storage-source-a',
  sourceMediaAssetId: 'media-source-a',
  editBriefId: 'brief-a',
  editBriefRevision: 4,
  editBriefDigestSha256: hash('2'),
  studyRunId: 'target-study-run-a',
  studyPlanDigestSha256: hash('3'),
  contextDigestSha256: hash('4'),
  evidenceIds: ['target-evidence-a', 'target-evidence-b'],
  confidence: 0.93,
  runtimeSources: ['verified_live'],
  everyRequiredOutputVerified: true,
  everySemanticRuntimeAuthoritative: true,
  everyRequiredOutputCostAuthoritySatisfied: true,
  coverageQaPassed: true,
  callerSourceSummaryUsedAsStudyEvidence: false,
}

const decisions: PreferenceApplicationRecord['decisions'] = [{
  id: 'decision-pacing-a',
  sourceRuleId: 'rule-pacing-a',
  layerId: 'pacing_timing',
  decision: 'adapted',
  precedence: 'target_context',
  targetInstruction: 'Use measured pacing and hold verified evidence long enough to read.',
  reason: 'The target is a voice-first documentary.',
  confidence: 0.91,
  targetUnderstandingPackageId: targetUnderstanding.packageId,
  targetEvidenceIds: ['target-evidence-a'],
  targetEvidenceConfidence: 0.94,
}, {
  id: 'decision-music-a',
  sourceRuleId: 'rule-music-a',
  layerId: 'music_soundsync',
  decision: 'blocked',
  precedence: 'current_user_instruction',
  targetInstruction: 'Do not transfer the reference music treatment.',
  reason: 'The current instruction requests restrained reporting.',
  heldBackReason: 'Reference-specific music is not transferable.',
  confidence: 0.97,
  targetUnderstandingPackageId: targetUnderstanding.packageId,
  targetEvidenceIds: ['target-evidence-b'],
  targetEvidenceConfidence: 0.9,
}]

const immutableApplicationContent = {
  applicationVersion: 'edit-reference-target-application-v2' as const,
  applicationSource: 'session_panel' as const,
  editReferenceId: 'preference-a',
  dnaVersionId: 'dna-a-v3',
  dnaVersionNumber: 3,
  dnaContentDigest: hash('5'),
  dnaApprovalId: 'dna-approval-a',
  dnaQaResultId: 'dna-qa-a',
  targetContext,
  targetContextDigest: calculatePreferenceApplicationTargetContextDigest(targetContext),
  targetUnderstanding,
  decisions,
  hintGroups: [{
    id: 'hint-group-pacing-a',
    layerId: 'pacing_timing' as const,
    title: 'Pacing and timing',
    summary: 'Measured documentary pacing.',
    decisionIds: ['decision-pacing-a'],
    sourceRuleIds: ['rule-pacing-a'],
  }],
  doNotCopyRules: ['Do not copy exact footage, wording, creator identity, or music.'],
  precedencePolicy: precedence,
  summary: 'One pacing rule adapted and one reference-specific music rule held back.',
}

const preparedApplication: PreferenceApplicationRecord = {
  id: 'application-a-v1',
  workspaceId: 'workspace-a',
  editReferenceId: immutableApplicationContent.editReferenceId,
  editReferenceName: 'Restrained documentary',
  studySessionId: 'study-a',
  dnaVersionId: immutableApplicationContent.dnaVersionId,
  dnaVersionNumber: immutableApplicationContent.dnaVersionNumber,
  dnaContentDigest: immutableApplicationContent.dnaContentDigest,
  dnaApprovalId: immutableApplicationContent.dnaApprovalId,
  dnaQaResultId: immutableApplicationContent.dnaQaResultId,
  projectId: targetContext.projectId,
  editSessionId: targetContext.editSessionId,
  version: 1,
  status: 'prepared',
  applicationSource: immutableApplicationContent.applicationSource,
  applicationVersion: immutableApplicationContent.applicationVersion,
  runtimeSource: 'verified_live',
  targetContext,
  targetContextDigest: immutableApplicationContent.targetContextDigest,
  targetUnderstanding,
  decisions,
  hintGroups: immutableApplicationContent.hintGroups,
  doNotCopyRules: immutableApplicationContent.doNotCopyRules,
  precedencePolicy: precedence,
  summary: immutableApplicationContent.summary,
  targetIdentityStatus: 'verified_target_video_understanding',
  targetIntegrationStatus: 'not_connected',
  downstreamInvalidationStatus: 'not_required',
  contentDigest: calculatePreferenceApplicationContentDigest(immutableApplicationContent),
  targetEditMutationMade: false,
  approvedPlanMutationMade: false,
  downstreamContextWritten: false,
  providerCallMade: false,
  modelCallMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  createdAt: '2026-07-21T02:00:00.000Z',
  updatedAt: '2026-07-21T02:00:01.000Z',
}

const application: PreferenceApplicationRecord = {
  ...preparedApplication,
  targetIntegrationStatus: 'connected',
  targetEditMutationMade: true,
  downstreamContextWritten: true,
}

const outputFrameConfirmation = createEditReferenceProductionOutputFrameAuthority({
  repositoryAuthority: 'supabase_rls_transactional',
  workspaceId: preparedApplication.workspaceId,
  projectId: preparedApplication.projectId,
  editSessionId: preparedApplication.editSessionId,
  exactEditPreferenceRecordRevision: 9,
  planningInputRevision: 4,
  confirmationId: 'frame-confirmation-a',
  aspectRatio: '16:9',
  confirmedAt: '2026-07-21T01:59:00.000Z',
})

const requestInput = {
  mutation: 'apply',
  actorUserId: 'user-owner-a',
  workspaceId: preparedApplication.workspaceId,
  projectId: preparedApplication.projectId,
  editSessionId: preparedApplication.editSessionId,
  editReferenceId: preparedApplication.editReferenceId,
  studySessionId: preparedApplication.studySessionId,
  dnaVersionId: preparedApplication.dnaVersionId,
  applicationId: preparedApplication.id,
  expectedCurrentApplicationId: null,
  expectedReferenceRevision: 7,
  expectedPlanningInputRevision: 4,
  applicationContentDigestSha256: preparedApplication.contentDigest,
  applicationContextHashSha256: calculateEditReferenceProductionApplicationContextHash(preparedApplication),
  targetUnderstandingPackageDigestSha256: targetUnderstanding.packageDigestSha256,
  outputFrameConfirmation,
  idempotencyKeyHashSha256: hash('7'),
  requestedAt: '2026-07-21T02:00:02.000Z',
} as const
const request = createEditReferenceProductionApplicationLifecycleRequest(requestInput)

const receipt = createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'application-transaction-a',
  request,
  committedReferenceRevision: request.expectedReferenceRevision + 1,
  committedPlanningInputRevision: request.expectedPlanningInputRevision + 1,
  applicationStatusAfter: 'connected',
  preferenceContextStatusAfter: 'connected',
  priorDraftPlanDisposition: 'invalidated',
  priorDraftEstimateDisposition: 'invalidated',
  approvalStatusAfter: 'reset_after_revision',
  executionAuthorizationDisposition: 'revoked',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'plan-invalidation-a',
  auditEventIds: ['audit-application-a', 'audit-plan-invalidation-a'],
  idempotencyReceiptId: 'idempotency-receipt-a',
  idempotencyResponseDigestSha256: hash('8'),
  committedAt: '2026-07-21T02:00:03.000Z',
})

const planningContext = createEditReferenceProductionPlanningContext({ application, request, receipt })
validateEditReferenceProductionPlanningContext({ application, request, receipt, planningContext })
assert.equal(planningContext.guidance.length, 1)
assert.equal(planningContext.heldBack.length, 1)
assert.equal(planningContext.committedPlanningInputRevision, 5)
assert.equal(
  planningContext.outputFrameConfirmationDigestSha256,
  outputFrameConfirmation.authorityDigestSha256,
)
assert.equal(planningContext.rawReferenceMediaIncluded, false)
assert.equal(planningContext.customerCreditsMutated, false)

assert.throws(() => createEditReferenceProductionPlanningContext({
  application: { ...application, runtimeSource: 'verified_local' },
  request,
  receipt,
}), /production Edit Reference planning context/i)

const wrongFrameRequest = createEditReferenceProductionApplicationLifecycleRequest({
  ...requestInput,
  outputFrameConfirmation: createEditReferenceProductionOutputFrameAuthority({
    repositoryAuthority: outputFrameConfirmation.repositoryAuthority,
    workspaceId: outputFrameConfirmation.workspaceId,
    projectId: outputFrameConfirmation.projectId,
    editSessionId: outputFrameConfirmation.editSessionId,
    exactEditPreferenceRecordRevision: outputFrameConfirmation.exactEditPreferenceRecordRevision,
    planningInputRevision: outputFrameConfirmation.planningInputRevision,
    confirmationId: outputFrameConfirmation.confirmationId,
    aspectRatio: '9:16',
    confirmedAt: outputFrameConfirmation.confirmedAt,
  }),
})
const wrongFrameReceipt = createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'application-transaction-wrong-frame',
  request: wrongFrameRequest,
  committedReferenceRevision: wrongFrameRequest.expectedReferenceRevision + 1,
  committedPlanningInputRevision: wrongFrameRequest.expectedPlanningInputRevision + 1,
  applicationStatusAfter: 'connected',
  preferenceContextStatusAfter: 'connected',
  priorDraftPlanDisposition: 'invalidated',
  priorDraftEstimateDisposition: 'invalidated',
  approvalStatusAfter: 'reset_after_revision',
  executionAuthorizationDisposition: 'revoked',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'plan-invalidation-wrong-frame',
  auditEventIds: ['audit-wrong-frame'],
  idempotencyReceiptId: 'idempotency-receipt-wrong-frame',
  idempotencyResponseDigestSha256: hash('6'),
  committedAt: '2026-07-21T02:00:04.000Z',
})
assert.throws(() => createEditReferenceProductionPlanningContext({
  application,
  request: wrongFrameRequest,
  receipt: wrongFrameReceipt,
}), /production Edit Reference planning context/i)

const wrongContextRequest = createEditReferenceProductionApplicationLifecycleRequest({
  ...requestInput,
  applicationContextHashSha256: hash('9'),
})
const wrongContextReceipt = createEditReferenceProductionApplicationLifecycleReceipt({
  transactionId: 'application-transaction-wrong-context',
  request: wrongContextRequest,
  committedReferenceRevision: wrongContextRequest.expectedReferenceRevision + 1,
  committedPlanningInputRevision: wrongContextRequest.expectedPlanningInputRevision + 1,
  applicationStatusAfter: 'connected',
  preferenceContextStatusAfter: 'connected',
  priorDraftPlanDisposition: 'invalidated',
  priorDraftEstimateDisposition: 'invalidated',
  approvalStatusAfter: 'reset_after_revision',
  executionAuthorizationDisposition: 'revoked',
  freshPlanAndEstimateRequired: true,
  approvedSnapshotPreserved: true,
  historicalPrivatePreviewPreserved: true,
  applicationPlanInvalidationReceiptId: 'plan-invalidation-wrong-context',
  auditEventIds: ['audit-wrong-context'],
  idempotencyReceiptId: 'idempotency-receipt-wrong-context',
  idempotencyResponseDigestSha256: hash('a'),
  committedAt: '2026-07-21T02:00:04.000Z',
})
assert.throws(() => createEditReferenceProductionPlanningContext({
  application,
  request: wrongContextRequest,
  receipt: wrongContextReceipt,
}), /production Edit Reference planning context/i)

assert.throws(() => validateEditReferenceProductionPlanningContext({
  application,
  request,
  receipt,
  planningContext: {
    ...planningContext,
    currentUserInstruction: 'Tampered instruction',
  },
}), /production Edit Reference planning context/i)

const authorityScope = {
  actorUserId: request.actorUserId,
  workspaceId: application.workspaceId,
  projectId: application.projectId,
  editSessionId: application.editSessionId,
}
const authorityRead = {
  schemaVersion: EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
  repositoryAuthority: 'supabase_rls_transactional' as const,
  candidateCount: 1,
  tenantIsolation: {
    authenticatedUserVerified: true as const,
    workspaceMembershipVerified: true as const,
    workspaceProjectCompositeBindingVerified: true as const,
    projectEditSessionCompositeBindingVerified: true as const,
    rlsPolicyVersion: 'edit-reference-rls-v1',
    accessCheckReceiptId: 'access-check-a',
  },
  readRevision: 12,
  readAt: '2026-07-21T02:00:04.000Z',
  application,
  lifecycleRequest: request,
  lifecycleReceipt: receipt,
}
const authorityResolution = await resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactConnectedApplication: () => Promise.resolve(authorityRead) },
  scope: authorityScope,
  selection: {
    applicationId: application.id,
    expectedApplicationContentDigestSha256: application.contentDigest,
    expectedApplicationContextHashSha256: planningContext.applicationContextHashSha256,
    expectedLifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
  },
})
assert(authorityResolution)
assert.equal(authorityResolution.sourceAuthority, 'canonical_edit_reference_production_repository')
assert.equal(authorityResolution.planningContext.contextDigestSha256, planningContext.contextDigestSha256)

const noApplicationRead = {
  schemaVersion: EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
  repositoryAuthority: 'supabase_rls_transactional' as const,
  candidateCount: 0,
  tenantIsolation: authorityRead.tenantIsolation,
  readRevision: 13,
  readAt: '2026-07-21T02:00:05.000Z',
}
assert.equal(await resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactConnectedApplication: () => Promise.resolve(noApplicationRead) },
  scope: authorityScope,
}), undefined)
await assert.rejects(() => resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactConnectedApplication: () => Promise.resolve(noApplicationRead) },
  scope: authorityScope,
  selection: {
    applicationId: application.id,
    expectedApplicationContentDigestSha256: application.contentDigest,
    expectedApplicationContextHashSha256: planningContext.applicationContextHashSha256,
    expectedLifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
  },
}), /production Edit Reference planning authority/i)
await assert.rejects(() => resolveEditReferenceProductionPlanningAuthority({
  reader: {
    readExactConnectedApplication: () => Promise.resolve({ ...authorityRead, candidateCount: 2 }),
  },
  scope: authorityScope,
}), /production Edit Reference planning authority/i)
await assert.rejects(() => resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactConnectedApplication: () => Promise.resolve(authorityRead) },
  scope: authorityScope,
  selection: {
    applicationId: application.id,
    expectedApplicationContentDigestSha256: application.contentDigest,
    expectedApplicationContextHashSha256: hash('b'),
    expectedLifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
  },
}), /production Edit Reference planning authority/i)

console.log(JSON.stringify({
  status: 'passed',
  planningContextVersion: planningContext.schemaVersion,
  lifecycleTransactionId: planningContext.lifecycleTransactionId,
  committedPlanningInputRevision: planningContext.committedPlanningInputRevision,
  guidanceCount: planningContext.guidance.length,
  heldBackCount: planningContext.heldBack.length,
  contextDigestSha256: planningContext.contextDigestSha256,
  productionRepositoryAuthorityResolved: true,
  remoteMutationAttempted: false,
  productionReady: false,
}, null, 2))
