import assert from 'node:assert/strict'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION,
  type EditReferenceProductionExactEditApplyCommand,
  type EditReferenceProductionExactEditPreferenceValues,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import {
  EDIT_REFERENCE_PRODUCTION_LIFECYCLE_COMMAND_VERSION,
  type EditReferenceProductionLifecycleCommand,
} from '../../src/types/edit-reference-production-lifecycle-api'
import {
  calculatePreferenceApplicationContentDigest,
  calculatePreferenceApplicationTargetContextDigest,
} from '../edit-references/edit-reference-target-adaptation'
import {
  calculateEditReferenceProductionApplicationContextHash,
} from '../edit-references/edit-reference-production-planning-context'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC,
  prepareEditReferenceProductionExactEditApply,
  type EditReferenceProductionExactEditPreferenceAuthority,
} from '../edit-references/edit-reference-production-exact-edit-apply-boundary'
import {
  createEditReferenceProductionOutputFrameAuthority,
} from '../edit-references/edit-reference-production-output-frame-authority'
import {
  exactEditPreferenceFingerprint,
} from '../services/private-exact-edit-preference-store'

const hash = (character: string): string => character.repeat(64)
const precedence = [
  'safety_platform_tier_frame_credit_or_approved_constraint',
  'current_user_instruction',
  'target_context',
  'approved_preference_dna',
] as const

const values: EditReferenceProductionExactEditPreferenceValues = {
  editLevel: 'pro',
  workflowType: 'testimonial_case_study',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'youtube',
}

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
  evidenceIds: ['target-evidence-a'],
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
  summary: 'One pacing rule is adapted from approved evidence.',
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
const connectedApplication: PreferenceApplicationRecord = {
  ...preparedApplication,
  targetIntegrationStatus: 'connected',
  targetEditMutationMade: true,
  downstreamContextWritten: true,
}

const outputFrameAuthority = createEditReferenceProductionOutputFrameAuthority({
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

const authenticated = {
  actorUserId: 'user-owner-a',
  workspaceId: preparedApplication.workspaceId,
  projectId: preparedApplication.projectId,
  editSessionId: preparedApplication.editSessionId,
  authenticatedUserVerified: true as const,
  workspaceMembershipVerified: true as const,
  workspaceProjectCompositeBindingVerified: true as const,
  projectEditSessionCompositeBindingVerified: true as const,
  accessCheckReceiptId: 'access-check-a',
}
const preferenceFingerprint = exactEditPreferenceFingerprint(values)
const baseAuthority: EditReferenceProductionExactEditPreferenceAuthority = {
  sourceAuthority: 'canonical_exact_edit_preference_repository',
  runtimeSource: 'verified_live',
  authorityReadReceiptId: 'exact-edit-read-a',
  workspaceId: preparedApplication.workspaceId,
  projectId: preparedApplication.projectId,
  editSessionId: preparedApplication.editSessionId,
  recordRevision: 9,
  preferenceRevision: 3,
  planningInputRevision: 4,
  preferenceFingerprintSha256: preferenceFingerprint,
  values,
  lifecyclePhase: 'planning',
  locked: false,
  currentApplicationState: 'not_selected',
  currentApplicationId: null,
}

const baseCommand: EditReferenceProductionExactEditApplyCommand = {
  schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION,
  workspaceId: preparedApplication.workspaceId,
  projectId: preparedApplication.projectId,
  editSessionId: preparedApplication.editSessionId,
  expectedPreferenceRecordRevision: baseAuthority.recordRevision,
  expectedPreferenceRevision: baseAuthority.preferenceRevision,
  expectedPlanningInputRevision: baseAuthority.planningInputRevision,
  expectedPreferenceFingerprintSha256: preferenceFingerprint,
  preferencePatch: { cleanupPreference: 'light_cleanup' },
  editReferenceLifecycle: null,
}

const genericOnly = prepareEditReferenceProductionExactEditApply({
  command: baseCommand,
  authenticated,
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication: null,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('6'),
  serverRequestedAt: '2026-07-21T02:01:00.000Z',
})
assert.equal(genericOnly.request.rpcName, EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC)
assert.deepEqual(genericOnly.request.changedPreferenceFields, ['cleanupPreference'])
assert.equal(genericOnly.request.referenceLifecycleRequest, null)
assert.equal(genericOnly.request.sourcePreparationDisposition, 'requires_repreparation')
assert.equal(genericOnly.request.outputFrameDisposition, 'unchanged')
assert.equal(genericOnly.request.planningInputRevisionIncrement, 1)
assert.equal(genericOnly.request.freshPlanAndEstimateRequired, true)
assert.equal(genericOnly.request.customerPriceCalculated, false)
assert.equal(genericOnly.request.customerCreditsMutated, false)
assert.equal(genericOnly.request.providerOrWorkerExecutionStarted, false)
assert.equal(genericOnly.remoteMutationMade, false)
assert.equal(genericOnly.productionReady, false)

const lifecycleCommand = (
  mutation: EditReferenceProductionLifecycleCommand['mutation'],
  application: PreferenceApplicationRecord,
  currentApplicationId: string | null,
): EditReferenceProductionLifecycleCommand => ({
  schemaVersion: EDIT_REFERENCE_PRODUCTION_LIFECYCLE_COMMAND_VERSION,
  mutation,
  workspaceId: application.workspaceId,
  projectId: application.projectId,
  editSessionId: application.editSessionId,
  applicationId: application.id,
  expectedCurrentApplicationId: currentApplicationId,
  expectedReferenceRevision: 6,
  expectedPlanningInputRevision: 4,
  expectedApplicationContentDigestSha256: application.contentDigest,
  expectedApplicationContextHashSha256:
    calculateEditReferenceProductionApplicationContextHash(application),
  expectedTargetUnderstandingPackageDigestSha256:
    mutation === 'remove' ? null : targetUnderstanding.packageDigestSha256,
  expectedOutputFrameAuthorityDigestSha256:
    mutation === 'remove' ? null : outputFrameAuthority.authorityDigestSha256,
})

const applyCommand: EditReferenceProductionExactEditApplyCommand = {
  ...baseCommand,
  preferencePatch: { visualPreference: 'keep_visuals_minimal' },
  editReferenceLifecycle: lifecycleCommand('apply', preparedApplication, null),
}
const combinedApply = prepareEditReferenceProductionExactEditApply({
  command: applyCommand,
  authenticated,
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication,
  outputFrameAuthority,
  idempotencyKeyHashSha256: hash('7'),
  serverRequestedAt: '2026-07-21T02:02:00.000Z',
})
assert.deepEqual(combinedApply.request.changedPreferenceFields, ['visualPreference'])
assert.equal(combinedApply.request.referenceLifecycleRequest?.mutation, 'apply')
assert.equal(
  combinedApply.request.referenceLifecycleExecutionPolicy,
  'nested_same_transaction_never_called_separately',
)
assert.equal(
  combinedApply.request.referenceLifecycleRequest?.idempotencyKeyHashSha256,
  combinedApply.request.idempotencyKeyHashSha256,
)
assert.equal(
  combinedApply.request.referenceLifecycleRequest?.expectedPlanningInputRevision,
  combinedApply.request.expectedPlanningInputRevision,
)
assert.equal(combinedApply.referenceLifecycleNestedOnly, true)

assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: {
    ...applyCommand,
    preferencePatch: { editLevel: 'premium' },
  },
  authenticated,
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication,
  outputFrameAuthority,
  idempotencyKeyHashSha256: hash('8'),
  serverRequestedAt: '2026-07-21T02:03:00.000Z',
}), /could not be bound to one verified exact-edit transaction/i)
assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: applyCommand,
  authenticated,
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication,
  outputFrameAuthority: createEditReferenceProductionOutputFrameAuthority({
    repositoryAuthority: 'supabase_rls_transactional',
    workspaceId: preparedApplication.workspaceId,
    projectId: preparedApplication.projectId,
    editSessionId: preparedApplication.editSessionId,
    exactEditPreferenceRecordRevision: 8,
    planningInputRevision: 4,
    confirmationId: 'stale-frame-confirmation',
    aspectRatio: '16:9',
    confirmedAt: '2026-07-21T01:58:00.000Z',
  }),
  idempotencyKeyHashSha256: hash('8'),
  serverRequestedAt: '2026-07-21T02:03:30.000Z',
}), /could not be bound to one verified exact-edit transaction/i)

const connectedAuthority: EditReferenceProductionExactEditPreferenceAuthority = {
  ...baseAuthority,
  currentApplicationState: 'connected',
  currentApplicationId: connectedApplication.id,
}
assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: {
    ...baseCommand,
    preferencePatch: { targetPlatform: 'website' },
  },
  authenticated,
  exactEditPreferenceAuthority: connectedAuthority,
  preparedApplication: null,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('9'),
  serverRequestedAt: '2026-07-21T02:04:00.000Z',
}), /could not be bound to one verified exact-edit transaction/i)

const removeCommand: EditReferenceProductionExactEditApplyCommand = {
  ...baseCommand,
  preferencePatch: { targetPlatform: 'website' },
  editReferenceLifecycle: lifecycleCommand(
    'remove',
    connectedApplication,
    connectedApplication.id,
  ),
}
const combinedRemove = prepareEditReferenceProductionExactEditApply({
  command: removeCommand,
  authenticated,
  exactEditPreferenceAuthority: connectedAuthority,
  preparedApplication: connectedApplication,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('a'),
  serverRequestedAt: '2026-07-21T02:05:00.000Z',
})
assert.equal(combinedRemove.request.referenceLifecycleRequest?.mutation, 'remove')
assert.equal(combinedRemove.request.outputFrameDisposition, 'requires_reconfirmation')

for (const unsafeAuthority of [
  { ...baseAuthority, runtimeSource: 'verified_local' as const },
  { ...baseAuthority, sourceAuthority: 'private_exact_edit_preference_store' as const },
  { ...baseAuthority, locked: true },
  { ...baseAuthority, recordRevision: 10 },
  { ...baseAuthority, preferenceFingerprintSha256: hash('b') },
]) {
  assert.throws(() => prepareEditReferenceProductionExactEditApply({
    command: baseCommand,
    authenticated,
    exactEditPreferenceAuthority: unsafeAuthority,
    preparedApplication: null,
    outputFrameAuthority: null,
    idempotencyKeyHashSha256: hash('c'),
    serverRequestedAt: '2026-07-21T02:06:00.000Z',
  }), /could not be bound to one verified exact-edit transaction/i)
}

assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: {
    ...baseCommand,
    actorUserId: 'browser-forged-user',
  } as EditReferenceProductionExactEditApplyCommand,
  authenticated,
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication: null,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('d'),
  serverRequestedAt: '2026-07-21T02:07:00.000Z',
}), /could not be bound to one verified exact-edit transaction/i)

assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: { ...baseCommand, preferencePatch: {} },
  authenticated,
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication: null,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('e'),
  serverRequestedAt: '2026-07-21T02:08:00.000Z',
}), /could not be bound to one verified exact-edit transaction/i)
assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: {
    ...baseCommand,
    preferencePatch: null,
  } as unknown as EditReferenceProductionExactEditApplyCommand,
  authenticated,
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication: null,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('e'),
  serverRequestedAt: '2026-07-21T02:08:30.000Z',
}), /could not be bound to one verified exact-edit transaction/i)

assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: baseCommand,
  authenticated: { ...authenticated, editSessionId: 'different-edit' },
  exactEditPreferenceAuthority: baseAuthority,
  preparedApplication: null,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('f'),
  serverRequestedAt: '2026-07-21T02:09:00.000Z',
}), /could not be bound to verified server authority/i)
assert.throws(() => prepareEditReferenceProductionExactEditApply({
  command: { ...baseCommand, workspaceId: 'workspace..escape' },
  authenticated: { ...authenticated, workspaceId: 'workspace..escape' },
  exactEditPreferenceAuthority: {
    ...baseAuthority,
    workspaceId: 'workspace..escape',
  },
  preparedApplication: null,
  outputFrameAuthority: null,
  idempotencyKeyHashSha256: hash('f'),
  serverRequestedAt: '2026-07-21T02:09:30.000Z',
}), /could not be bound to verified server authority/i)

console.log(JSON.stringify({
  status: 'passed',
  rpcName: combinedApply.request.rpcName,
  oneExactEditApplyTransaction: true,
  referenceLifecycleNestedOnly: true,
  genericPreferenceAndReferencePlanningRevisionShared: true,
  connectedReferenceContextChangeRequiresRemoval: true,
  cleanupRequiresSourceRepreparation: true,
  targetPlatformRequiresFrameReconfirmation: true,
  browserActorAccepted: false,
  privateLocalAuthorityAccepted: false,
  remoteMutationAttempted: false,
  productionReady: false,
}, null, 2))
