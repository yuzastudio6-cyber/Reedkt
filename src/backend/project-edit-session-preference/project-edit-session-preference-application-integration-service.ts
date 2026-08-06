import type { PreferenceApplicationRecord } from '../../types/edit-reference'
import type {
  PreferenceApplicationDownstreamContext,
  PreferenceApplicationInvalidationReason,
  ProjectEditSessionPreferenceIntegrationPlan,
} from '../../types/edit-reference-integration'
import type { ProjectEditSessionRecord } from '../../types/project-edit-session'
import {
  PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
} from '../../types/edit-reference-integration'
import {
  createProjectEditSessionPreferenceIntegrationState,
  readPreferenceApplicationIntegrationState,
  validatePreferenceApplicationTargetSession,
  writePreferenceApplicationIntegrationState,
} from '../../lib/edit-reference-downstream-context'

function shouldResetApproval(session: ProjectEditSessionRecord): boolean {
  return session.approvalStatus === 'approved' || session.approvalStatus === 'requested'
}

function hasVerifiedApplicationTargetAuthority(application: PreferenceApplicationRecord): boolean {
  if (application.applicationVersion === 'edit-reference-target-application-v1') {
    return application.targetIdentityStatus === 'verified_mock_project_edit_session'
  }
  return Boolean(
    application.targetIdentityStatus === 'verified_target_video_understanding'
    && application.targetUnderstanding
    && application.targetUnderstanding.everyRequiredOutputVerified === true
    && application.targetUnderstanding.everySemanticRuntimeAuthoritative === true
    && application.targetUnderstanding.everyRequiredOutputCostAuthoritySatisfied === true
    && application.targetUnderstanding.coverageQaPassed === true
    && application.targetUnderstanding.callerSourceSummaryUsedAsStudyEvidence === false,
  )
}
export function createStagePreferenceApplicationPlan(input: {
  application: PreferenceApplicationRecord
  context: PreferenceApplicationDownstreamContext
  currentSession: ProjectEditSessionRecord
  outputFrameConfirmed: boolean
  stagedAt?: string
}): ProjectEditSessionPreferenceIntegrationPlan {
  const errors = validatePreferenceApplicationTargetSession({
    application: input.application,
    session: input.currentSession,
    outputFrameConfirmed: input.outputFrameConfirmed,
  })
  if (errors.length) throw new Error(errors.join(' '))
  const stagedAt = input.stagedAt ?? new Date().toISOString()
  const resetApproval = shouldResetApproval(input.currentSession)
  const state = createProjectEditSessionPreferenceIntegrationState({
    application: input.application,
    context: input.context,
    status: 'staged_unconfirmed',
    stagedAt,
  })
  return {
    id: `${input.application.id}-stage-${input.context.packageHash}`,
    action: 'stage_exact_application',
    projectId: input.currentSession.projectId,
    editSessionId: input.currentSession.id,
    applicationId: input.application.id,
    context: { ...input.context, integrationStatus: 'staged_unconfirmed' },
    sessionUpdates: {
      selectedEditPreferenceId: input.application.editReferenceId,
      selectedPreferenceVersionId: input.application.dnaVersionId,
      selectedEditPreferenceHandle: undefined,
      preferenceDNAApplicationId: input.application.id,
      dnaStatusLabel: 'Target-adapted Preference DNA staged',
      dnaQAStatusLabel: 'Approved DNA QA • connection pending',
      doNotCopyRulesActive: true,
      approvalStatus: resetApproval ? 'reset_after_revision' : input.currentSession.approvalStatus,
      metadata: writePreferenceApplicationIntegrationState({
        ...(input.currentSession.metadata ?? {}),
        selectedEditPreferenceName: input.application.editReferenceName,
        preferenceStatus: 'target_application_staged',
        preferenceRequiresUserReview: false,
        preferenceBlockedByDNAQA: false,
        preferenceBlockedReasons: [],
        preferenceWarnings: ['Exact target-adapted guidance is staged until the backend-local application connection is confirmed.'],
        doNotCopyRules: input.application.doNotCopyRules,
        exactPreferenceApplicationId: input.application.id,
        exactPreferenceApplicationContentDigest: input.application.contentDigest,
        exactPreferenceTargetContextDigest: input.application.targetContextDigest,
        preferenceApplicationDeferred: true,
      }, state),
    },
    memoryUpdates: [{
      layer: 'dna_application_memory',
      summary: `${input.application.editReferenceName} is staged for this Edit Chat pending backend-local confirmation.`,
      facts: [
        `Target-adapted guidance: ${input.context.guidance.length} item(s)`,
        `Held back: ${input.context.heldBack.length} item(s)`,
      ],
      preferences: ['Current instructions and confirmed Edit Brief markers outrank reusable Preference DNA.'],
      warnings: ['Staged context is not active until the exact application connection is confirmed.'],
    }],
    historyEvents: [`Staged ${input.application.editReferenceName} for exact target-aware connection.`],
    snapshotSummary: `Staged target-adapted Preference DNA from ${input.application.editReferenceName}; production remains unchanged.`,
    shouldResetApproval: resetApproval,
    mockOnly: true,
    safety: PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  }
}

export function createActivatePreferenceApplicationPlan(input: {
  application: PreferenceApplicationRecord
  currentSession: ProjectEditSessionRecord
}): ProjectEditSessionPreferenceIntegrationPlan {
  if (
    input.application.targetIntegrationStatus !== 'connected'
    || !hasVerifiedApplicationTargetAuthority(input.application)
    || !input.application.downstreamContext
    || !input.application.connectedAt
  ) throw new Error('The exact Preference Application is not connected with verified target authority.')
  if (input.application.projectId !== input.currentSession.projectId || input.application.editSessionId !== input.currentSession.id) {
    throw new Error('The connected Preference Application does not belong to this Edit Chat.')
  }
  const previousState = createProjectEditSessionPreferenceIntegrationState({
    application: input.application,
    context: input.application.downstreamContext,
    status: 'connected_mock',
    stagedAt: input.application.targetSessionReceipt?.stagedAt,
    connectedAt: input.application.connectedAt,
  })
  return {
    id: `${input.application.id}-activate-${input.application.downstreamContext.packageHash}`,
    action: 'activate_connected_application',
    projectId: input.currentSession.projectId,
    editSessionId: input.currentSession.id,
    applicationId: input.application.id,
    context: input.application.downstreamContext,
    sessionUpdates: {
      selectedEditPreferenceId: input.application.editReferenceId,
      selectedPreferenceVersionId: input.application.dnaVersionId,
      selectedEditPreferenceHandle: undefined,
      preferenceDNAApplicationId: input.application.id,
      dnaStatusLabel: 'Target-adapted Preference DNA connected',
      dnaQAStatusLabel: 'Approved DNA quality review • target context verified',
      doNotCopyRulesActive: true,
      metadata: writePreferenceApplicationIntegrationState({
        ...(input.currentSession.metadata ?? {}),
        selectedEditPreferenceName: input.application.editReferenceName,
        preferenceStatus: 'target_application_connected_mock',
        preferenceWarnings: [],
        doNotCopyRules: input.application.doNotCopyRules,
        preferenceApplicationDeferred: false,
      }, previousState),
    },
    memoryUpdates: [{
      layer: 'dna_application_memory',
      summary: `${input.application.editReferenceName} target-adapted guidance is connected mock-locally.`,
      facts: [
        `${input.application.downstreamContext.guidance.length} target-specific guidance item(s) active as lower-priority planning context.`,
        `${input.application.downstreamContext.heldBack.length} reference-specific item(s) held back.`,
      ],
      preferences: input.application.downstreamContext.guidance.slice(0, 8).map((item) => item.instruction),
      warnings: ['This is planning context only; no approved plan, media, provider, worker, render, or credits changed.'],
    }],
    historyEvents: [`Connected ${input.application.editReferenceName} target-adapted guidance to this mock Edit Chat.`],
    snapshotSummary: `Connected exact Preference Application ${input.application.editReferenceName}; approved plan and production remain unchanged.`,
    shouldResetApproval: false,
    mockOnly: true,
    safety: PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  }
}

export function createInvalidatePreferenceApplicationPlan(input: {
  application: PreferenceApplicationRecord
  currentSession: ProjectEditSessionRecord
  reason: PreferenceApplicationInvalidationReason
  invalidatedAt?: string
}): ProjectEditSessionPreferenceIntegrationPlan {
  if (
    input.application.targetIntegrationStatus !== 'connected'
    || !hasVerifiedApplicationTargetAuthority(input.application)
    || !input.application.downstreamContext
    || !input.application.connectedAt
  ) throw new Error('Only an exact connected Preference Application can be invalidated.')
  if (input.application.projectId !== input.currentSession.projectId || input.application.editSessionId !== input.currentSession.id) {
    throw new Error('The connected Preference Application does not belong to this Edit Chat.')
  }
  const currentState = readPreferenceApplicationIntegrationState(input.currentSession)
  if (
    !currentState
    || currentState.applicationId !== input.application.id
    || currentState.context.packageHash !== input.application.downstreamContext.packageHash
    || !['connected_mock', 'invalidated'].includes(currentState.status)
  ) throw new Error('This Edit Chat does not contain the exact connected Preference Application context.')
  if (currentState.status === 'invalidated' && currentState.invalidationReason !== input.reason) {
    throw new Error('A different invalidation action is already pending for this Edit Chat.')
  }

  const invalidatedAt = currentState.invalidatedAt ?? input.invalidatedAt ?? new Date().toISOString()
  const approvalStatusBefore = currentState.status === 'invalidated'
    ? currentState.invalidationApprovalStatusBefore ?? input.currentSession.approvalStatus
    : input.currentSession.approvalStatus
  const resetApproval = currentState.status === 'invalidated'
    ? currentState.invalidationApprovalResetRequired ?? shouldResetApproval(input.currentSession)
    : shouldResetApproval(input.currentSession)
  const approvalStatusAfter = currentState.status === 'invalidated'
    ? currentState.invalidationApprovalStatusAfter ?? (resetApproval ? 'reset_after_revision' : approvalStatusBefore)
    : resetApproval ? 'reset_after_revision' : input.currentSession.approvalStatus
  const state = createProjectEditSessionPreferenceIntegrationState({
    application: input.application,
    context: input.application.downstreamContext,
    status: 'invalidated',
    stagedAt: currentState.stagedAt,
    connectedAt: input.application.connectedAt,
    invalidatedAt,
    invalidationReason: input.reason,
    invalidationApprovalStatusBefore: approvalStatusBefore,
    invalidationApprovalStatusAfter: approvalStatusAfter,
    invalidationApprovalResetRequired: resetApproval,
  })
  const actionLabel = input.reason === 'replace' ? 'replacement' : 'removal'
  return {
    id: `${input.application.id}-invalidate-${input.reason}-${input.application.downstreamContext.packageHash}`,
    action: 'invalidate_connected_application',
    projectId: input.currentSession.projectId,
    editSessionId: input.currentSession.id,
    applicationId: input.application.id,
    context: state.context,
    sessionUpdates: {
      selectedEditPreferenceId: undefined,
      selectedPreferenceVersionId: undefined,
      selectedEditPreferenceHandle: undefined,
      preferenceDNAApplicationId: undefined,
      dnaStatusLabel: input.reason === 'replace' ? 'Preference DNA replacement pending' : 'Preference DNA removed',
      dnaQAStatusLabel: 'Prior approved DNA retained in history',
      doNotCopyRulesActive: false,
      approvalStatus: approvalStatusAfter,
      metadata: writePreferenceApplicationIntegrationState({
        ...(input.currentSession.metadata ?? {}),
        selectedEditPreferenceName: undefined,
        preferenceStatus: 'target_application_invalidated',
        preferenceWarnings: [`Exact target-adapted guidance is inactive while ${actionLabel} is completed.`],
        doNotCopyRules: [],
        preferenceApplicationDeferred: true,
      }, state),
    },
    memoryUpdates: [{
      layer: 'dna_application_memory',
      summary: `${input.application.editReferenceName} target-adapted guidance is inactive for ${actionLabel}.`,
      facts: [
        `Historical application version: ${input.application.version}`,
        `Invalidation reason: ${input.reason}`,
      ],
      preferences: [],
      warnings: ['No reusable Preference DNA context is active until replacement or removal finishes.'],
    }],
    historyEvents: [`Invalidated ${input.application.editReferenceName} target guidance for ${actionLabel}; approved history remains immutable.`],
    snapshotSummary: `Invalidated exact Preference Application ${input.application.editReferenceName} for ${actionLabel}; approved plan and production remain unchanged.`,
    shouldResetApproval: resetApproval,
    invalidationReason: input.reason,
    mockOnly: true,
    safety: PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  }
}
