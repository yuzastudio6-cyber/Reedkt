import assert from 'node:assert/strict'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
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
import {
  createEditReferenceProductionPlannerBindingAdapterReceipt,
  createEditReferenceProductionPlannerPreferenceApplicationBinding,
  validateEditReferenceProductionPlannerBindingAdapterReceipt,
} from '../edit-references/edit-reference-production-planner-binding-adapter'
import {
  EDIT_REFERENCE_PRODUCTION_RPC_ADAPTER_VERSION,
  EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY,
  assertEditReferenceProductionRpcAdapterIsNotProduction,
  createEditReferenceProductionRpcContractFixtureAdapter,
  createEditReferenceProductionRpcContractFixtureCapability,
  type EditReferenceProductionRpcClient,
} from '../edit-references/edit-reference-production-rpc-adapter'

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
assert.equal(planningContext.editReferenceName, application.editReferenceName)
assert.equal(planningContext.applicationVersionNumber, application.version)
assert.equal(planningContext.dnaApprovalId, application.dnaApprovalId)
assert.equal(planningContext.dnaQaResultId, application.dnaQaResultId)
assert.equal(planningContext.targetUnderstandingConfidence, targetUnderstanding.confidence)
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
  currentState: 'connected' as const,
  stateRecordCount: 1,
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
  reader: { readExactApplicationState: () => Promise.resolve(authorityRead) },
  scope: authorityScope,
  selection: {
    applicationId: application.id,
    expectedApplicationContentDigestSha256: application.contentDigest,
    expectedApplicationContextHashSha256: planningContext.applicationContextHashSha256,
    expectedLifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
  },
})
if (authorityResolution.status !== 'applied') throw new Error('Expected one applied production authority.')
assert.equal(authorityResolution.sourceAuthority, 'canonical_edit_reference_production_repository')
assert.equal(authorityResolution.planningContext.contextDigestSha256, planningContext.contextDigestSha256)

const plannerBindingReceipt = createEditReferenceProductionPlannerBindingAdapterReceipt(authorityResolution)
validateEditReferenceProductionPlannerBindingAdapterReceipt(plannerBindingReceipt)
assert.deepEqual(
  createEditReferenceProductionPlannerPreferenceApplicationBinding(authorityResolution),
  plannerBindingReceipt.preferenceApplication,
)
assert.equal(plannerBindingReceipt.noLegacyPreferenceIntelligenceStoreRead, true)
assert.equal(plannerBindingReceipt.sharedPlannerMutationMade, false)
assert.equal(plannerBindingReceipt.preferenceApplication.status, 'applied')
assert.equal(plannerBindingReceipt.preferenceApplication.preferenceId, application.editReferenceId)
assert.equal(plannerBindingReceipt.preferenceApplication.applicationVersion, application.version)
assert.equal(plannerBindingReceipt.preferenceApplication.applicationHash, planningContext.contextDigestSha256)
assert.equal(plannerBindingReceipt.preferenceApplication.plannerContext.preferenceName, application.editReferenceName)
assert.equal(plannerBindingReceipt.preferenceApplication.plannerContext.qaStatus, 'passed')
assert.equal(plannerBindingReceipt.preferenceApplication.plannerContext.confidence, 0.91)
assert.deepEqual(
  plannerBindingReceipt.preferenceApplication.plannerContext.relevantRules.pacing_timing,
  ['Use measured pacing and hold verified evidence long enough to read.'],
)
assert.deepEqual(
  plannerBindingReceipt.preferenceApplication.plannerContext.relevantRules.approved_constraints,
  targetContext.approvedConstraints,
)
assert.deepEqual(
  plannerBindingReceipt.preferenceApplication.plannerContext.nonTransferableElements,
  ['Do not transfer the reference music treatment.'],
)
assert.deepEqual(
  plannerBindingReceipt.preferenceApplication.plannerContext.qaWarnings,
  ['Reference-specific music is not transferable.'],
)
assert.throws(() => validateEditReferenceProductionPlannerBindingAdapterReceipt({
  ...plannerBindingReceipt,
  preferenceApplication: {
    ...plannerBindingReceipt.preferenceApplication,
    applicationHash: hash('f'),
  },
}), /cannot be bound safely to the canonical planner/i)

const noApplicationRead = {
  schemaVersion: EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
  repositoryAuthority: 'supabase_rls_transactional' as const,
  currentState: 'not_selected' as const,
  stateRecordCount: 0,
  tenantIsolation: authorityRead.tenantIsolation,
  readRevision: 13,
  readAt: '2026-07-21T02:00:05.000Z',
}
const notSelectedResolution = await resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactApplicationState: () => Promise.resolve(noApplicationRead) },
  scope: authorityScope,
})
assert.equal(notSelectedResolution.status, 'not_selected')
assert.equal(
  createEditReferenceProductionPlannerPreferenceApplicationBinding(notSelectedResolution).status,
  'not_selected',
)
await assert.rejects(() => resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactApplicationState: () => Promise.resolve(noApplicationRead) },
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
    readExactApplicationState: () => Promise.resolve({ ...authorityRead, stateRecordCount: 2 }),
  },
  scope: authorityScope,
}), /production Edit Reference planning authority/i)
await assert.rejects(() => resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactApplicationState: () => Promise.resolve(authorityRead) },
  scope: authorityScope,
  selection: {
    applicationId: application.id,
    expectedApplicationContentDigestSha256: application.contentDigest,
    expectedApplicationContextHashSha256: hash('b'),
    expectedLifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
  },
}), /production Edit Reference planning authority/i)
await assert.rejects(() => resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactApplicationState: () => Promise.resolve(authorityRead) },
  scope: { ...authorityScope, actorUserId: 'different-user' },
}), /production Edit Reference planning authority/i)

const removeRequest = createEditReferenceProductionApplicationLifecycleRequest({
  ...requestInput,
  mutation: 'remove',
  expectedCurrentApplicationId: application.id,
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
  applicationPlanInvalidationReceiptId: 'plan-invalidation-remove-a',
  auditEventIds: ['audit-remove-a'],
  idempotencyReceiptId: 'idempotency-receipt-remove-a',
  idempotencyResponseDigestSha256: hash('d'),
  committedAt: '2026-07-21T02:00:06.000Z',
})
const clearedRead = {
  ...noApplicationRead,
  currentState: 'cleared' as const,
  stateRecordCount: 1,
  readRevision: 14,
  readAt: '2026-07-21T02:00:07.000Z',
  lifecycleRequest: removeRequest,
  lifecycleReceipt: removeReceipt,
}
const clearedResolution = await resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactApplicationState: () => Promise.resolve(clearedRead) },
  scope: authorityScope,
})
assert.equal(clearedResolution.status, 'cleared')
const clearedBinding = createEditReferenceProductionPlannerPreferenceApplicationBinding(clearedResolution)
assert.equal(clearedBinding.status, 'cleared')
if (clearedBinding.status !== 'cleared') throw new Error('Expected one cleared planner binding.')
assert.equal(clearedBinding.applicationId, application.id)
assert.equal(clearedBinding.applicationHash, removeReceipt.receiptDigestSha256)
await assert.rejects(() => resolveEditReferenceProductionPlanningAuthority({
  reader: { readExactApplicationState: () => Promise.resolve(clearedRead) },
  scope: authorityScope,
  selection: {
    applicationId: application.id,
    expectedApplicationContentDigestSha256: application.contentDigest,
    expectedApplicationContextHashSha256: planningContext.applicationContextHashSha256,
    expectedLifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
  },
}), /production Edit Reference planning authority/i)

const rpcCalls: Array<{
  readonly functionName: string
  readonly parameters: Readonly<Record<string, unknown>>
}> = []
const rpcClient: EditReferenceProductionRpcClient = {
  rpc: (functionName, parameters) => {
    rpcCalls.push({ functionName, parameters })
    if (functionName === EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.functions.mutateApplicationLifecycle) {
      return Promise.resolve({ data: [receipt], error: null })
    }
    if (functionName === EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.functions.readExactApplicationState) {
      return Promise.resolve({ data: [authorityRead], error: null })
    }
    return Promise.resolve({ data: null, error: { code: 'RPC_NOT_ALLOWED' } })
  },
}
const rpcCapability = createEditReferenceProductionRpcContractFixtureCapability(rpcClient)
const rpcAdapter = createEditReferenceProductionRpcContractFixtureAdapter({
  client: rpcClient,
  capability: rpcCapability,
})
assert.equal(rpcAdapter.schemaVersion, EDIT_REFERENCE_PRODUCTION_RPC_ADAPTER_VERSION)
assert.equal(rpcAdapter.liveSupabaseOrPostgresCallAllowed, false)
assert.equal(rpcAdapter.remoteDatabaseMutationAllowed, false)
assert.equal(rpcAdapter.productionAuthority, false)
assert.equal(EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.oneRpcCallPerOperation, true)
assert.equal(EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.responseShape, 'single_row_array')
assert.equal(EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.automaticTransportRetryAllowed, false)
assert.deepEqual(await rpcAdapter.mutateApplicationLifecycle(request), receipt)
const rpcAuthorityResolution = await resolveEditReferenceProductionPlanningAuthority({
  reader: rpcAdapter.planningAuthorityReader,
  scope: authorityScope,
  selection: {
    applicationId: application.id,
    expectedApplicationContentDigestSha256: application.contentDigest,
    expectedApplicationContextHashSha256: planningContext.applicationContextHashSha256,
    expectedLifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
  },
})
assert.equal(rpcAuthorityResolution.status, 'applied')
assert.equal(rpcCalls.length, 2)
assert.deepEqual(
  rpcCalls.map((call) => call.functionName),
  [
    EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.functions.mutateApplicationLifecycle,
    EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.functions.readExactApplicationState,
  ],
)
assert.equal(
  rpcCalls[0]?.parameters.p_contract_version,
  'edit-reference-production-persistence-contract-v4',
)
assert.deepEqual(rpcCalls[0]?.parameters.p_request, request)
assert.equal(
  rpcCalls[1]?.parameters.p_read_version,
  EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
)
assert.deepEqual(rpcCalls[1]?.parameters.p_scope, authorityScope)
assert.throws(
  () => assertEditReferenceProductionRpcAdapterIsNotProduction(rpcAdapter),
  /cannot authorize production persistence/i,
)

assert.throws(() => createEditReferenceProductionRpcContractFixtureAdapter({
  client: rpcClient,
  capability: structuredClone(rpcCapability),
}), /production RPC boundary is unavailable or unsafe/i)
const differentRpcClient: EditReferenceProductionRpcClient = {
  rpc: rpcClient.rpc.bind(rpcClient),
}
assert.throws(() => createEditReferenceProductionRpcContractFixtureAdapter({
  client: differentRpcClient,
  capability: rpcCapability,
}), /production RPC boundary is unavailable or unsafe/i)

for (const invalidData of [authorityRead, [], [authorityRead, authorityRead]]) {
  let cardinalityCallCount = 0
  const cardinalityClient: EditReferenceProductionRpcClient = {
    rpc: () => {
      cardinalityCallCount += 1
      return Promise.resolve({ data: invalidData, error: null })
    },
  }
  const cardinalityAdapter = createEditReferenceProductionRpcContractFixtureAdapter({
    client: cardinalityClient,
    capability: createEditReferenceProductionRpcContractFixtureCapability(cardinalityClient),
  })
  await assert.rejects(
    () => cardinalityAdapter.planningAuthorityReader.readExactApplicationState(authorityScope),
    /production RPC boundary is unavailable or unsafe/i,
  )
  assert.equal(cardinalityCallCount, 1)
}

const secret = 'database-password-must-never-leak'
let failedRpcCallCount = 0
const failingRpcClient: EditReferenceProductionRpcClient = {
  rpc: () => {
    failedRpcCallCount += 1
    return Promise.reject({
      code: 'DATABASE_DENIED',
      status: 503,
      message: secret,
      details: { connectionString: secret },
    })
  },
}
const failingRpcAdapter = createEditReferenceProductionRpcContractFixtureAdapter({
  client: failingRpcClient,
  capability: createEditReferenceProductionRpcContractFixtureCapability(failingRpcClient),
})
await assert.rejects(
  () => failingRpcAdapter.planningAuthorityReader.readExactApplicationState(authorityScope),
  (error: unknown) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, 'EDIT_REFERENCE_PERSISTENCE_BLOCKED')
    assert.equal(error.status, 503)
    assert.equal(JSON.stringify({ message: error.message, details: error.details }).includes(secret), false)
    assert.equal(
      (error.details as { automaticRetryStarted?: unknown }).automaticRetryStarted,
      false,
    )
    return true
  },
)
assert.equal(failedRpcCallCount, 1)

console.log(JSON.stringify({
  status: 'passed',
  planningContextVersion: planningContext.schemaVersion,
  lifecycleTransactionId: planningContext.lifecycleTransactionId,
  committedPlanningInputRevision: planningContext.committedPlanningInputRevision,
  guidanceCount: planningContext.guidance.length,
  heldBackCount: planningContext.heldBack.length,
  contextDigestSha256: planningContext.contextDigestSha256,
  productionRepositoryAuthorityResolved: true,
  canonicalPlannerBindingAdapted: true,
  rpcContractFixtureAdapterVerified: true,
  rpcAutomaticRetryStarted: false,
  legacyPreferenceIntelligenceStoreRead: false,
  remoteMutationAttempted: false,
  productionReady: false,
}, null, 2))
