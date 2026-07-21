import type {
  AutonomousEditPreferenceApplicationSelection,
  AutonomousEditPreferenceApplicationSnapshot,
} from '../../src/types/autonomous-edit-planning'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import {
  createPreferenceApplicationDownstreamContext,
  isPreferenceApplicationDownstreamContextValid,
} from '../../src/lib/edit-reference-downstream-context'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createEditReferenceService } from '../services/edit-reference-service'
import {
  calculatePreferenceApplicationContentDigest,
  calculatePreferenceApplicationTargetContextDigest,
} from './edit-reference-target-adaptation'

const COPY_SAFE_DECISIONS = new Set(['applied', 'adapted', 'ignored', 'blocked'])

export async function resolveAutonomousEditPreferenceApplication(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  editSessionId: string
  selection: AutonomousEditPreferenceApplicationSelection
}): Promise<AutonomousEditPreferenceApplicationSnapshot> {
  const result = await createEditReferenceService(input.context).listApplications(input.workspaceId)
  const application = result.data.applications.find((candidate) => candidate.id === input.selection.applicationId)
  if (!application) {
    throw new ApiError(
      'PREFERENCE_APPLICATION_NOT_FOUND',
      'The selected Edit Reference application is unavailable in this workspace.',
      404,
    )
  }
  return createAutonomousEditPreferenceApplicationSnapshot({
    application,
    selection: input.selection,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  })
}

export async function resolveConnectedAutonomousEditPreferenceApplication(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  editSessionId: string
  selection?: AutonomousEditPreferenceApplicationSelection
}): Promise<AutonomousEditPreferenceApplicationSnapshot | undefined> {
  if (input.selection) {
    return resolveAutonomousEditPreferenceApplication({
      ...input,
      selection: input.selection,
    })
  }
  const result = await createEditReferenceService(input.context).listApplications(input.workspaceId)
  const connected = result.data.applications.filter((candidate) => (
    candidate.workspaceId === input.workspaceId
    && candidate.projectId === input.projectId
    && candidate.editSessionId === input.editSessionId
    && candidate.status === 'prepared'
    && candidate.targetIntegrationStatus === 'connected'
  ))
  if (connected.length === 0) return undefined
  if (connected.length !== 1) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'More than one connected Edit Reference application claims this named edit. Resolve the application history before planning.',
      409,
    )
  }
  const application = connected[0]!
  if (!application.downstreamContext) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The connected Edit Reference application is missing its exact downstream context.',
      409,
    )
  }
  return createAutonomousEditPreferenceApplicationSnapshot({
    application,
    selection: {
      applicationId: application.id,
      expectedApplicationContentDigest: application.contentDigest,
      expectedContextHash: application.downstreamContext.packageHash,
    },
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  })
}

export function createAutonomousEditPreferenceApplicationSnapshot(input: {
  application: PreferenceApplicationRecord
  selection: AutonomousEditPreferenceApplicationSelection
  workspaceId: string
  projectId: string
  editSessionId: string
}): AutonomousEditPreferenceApplicationSnapshot {
  const { application, selection } = input
  if (application.workspaceId !== input.workspaceId || application.workspaceId.trim().length === 0) {
    throw new ApiError('VALIDATION_FAILED', 'The selected Edit Reference application has invalid workspace authority.', 409)
  }
  if (application.contentDigest !== selection.expectedApplicationContentDigest) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The selected Edit Reference application changed. Reload it before rebuilding the plan.',
      409,
    )
  }
  if (application.projectId !== input.projectId || application.editSessionId !== input.editSessionId) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The selected Edit Reference application belongs to a different named edit.',
      409,
    )
  }
  if (
    application.status !== 'prepared'
    || application.applicationVersion !== 'edit-reference-target-application-v2'
    || application.targetIdentityStatus !== 'verified_target_video_understanding'
    || application.targetIntegrationStatus !== 'connected'
    || application.downstreamInvalidationStatus !== 'not_required'
    || application.targetEditMutationMade !== true
    || application.downstreamContextWritten !== true
    || !application.downstreamContext
    || !application.targetSessionReceipt
    || !application.connectedAt
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Connect one current, target-verified Edit Reference application before rebuilding the plan.',
      409,
    )
  }
  if (
    !application.targetUnderstanding
    || !/^[a-f0-9]{64}$/i.test(application.targetUnderstanding.packageDigestSha256)
    || !/^[a-f0-9]{64}$/i.test(application.targetUnderstanding.contextDigestSha256)
    || !/^[a-f0-9]{64}$/i.test(application.targetUnderstanding.studyPlanDigestSha256)
    || !/^[a-f0-9]{64}$/i.test(application.targetUnderstanding.editBriefDigestSha256)
    || application.targetUnderstanding.everyRequiredOutputVerified !== true
    || application.targetUnderstanding.everySemanticRuntimeAuthoritative !== true
    || application.targetUnderstanding.everyRequiredOutputCostAuthoritySatisfied !== true
    || application.targetUnderstanding.coverageQaPassed !== true
    || application.targetUnderstanding.callerSourceSummaryUsedAsStudyEvidence !== false
    || !application.targetUnderstanding.runtimeSources.every((source) => source === 'verified_local' || source === 'verified_live')
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The selected Edit Reference application is missing authoritative target-video understanding.',
      409,
    )
  }
  if (application.targetContextDigest !== calculatePreferenceApplicationTargetContextDigest(application.targetContext)) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The selected Edit Reference application target context failed its digest check.',
      409,
    )
  }
  const expectedApplicationContentDigest = calculatePreferenceApplicationContentDigest({
    applicationVersion: application.applicationVersion,
    applicationSource: application.applicationSource,
    editReferenceId: application.editReferenceId,
    dnaVersionId: application.dnaVersionId,
    dnaVersionNumber: application.dnaVersionNumber,
    dnaContentDigest: application.dnaContentDigest,
    dnaApprovalId: application.dnaApprovalId,
    dnaQaResultId: application.dnaQaResultId,
    targetContext: application.targetContext,
    targetContextDigest: application.targetContextDigest,
    targetUnderstanding: application.targetUnderstanding,
    decisions: application.decisions,
    hintGroups: application.hintGroups,
    doNotCopyRules: application.doNotCopyRules,
    precedencePolicy: application.precedencePolicy,
    summary: application.summary,
  })
  if (application.contentDigest !== expectedApplicationContentDigest) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The selected Edit Reference application content failed its immutable digest check.',
      409,
    )
  }
  if (!isPreferenceApplicationDownstreamContextValid(application.downstreamContext, {
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  }) || application.downstreamContext.integrationStatus !== 'connected_mock') {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The connected Edit Reference context failed its integrity check. Reconnect it before planning.',
      409,
    )
  }
  const expectedContext = createPreferenceApplicationDownstreamContext(application, 'connected_mock')
  const receipt = application.targetSessionReceipt
  if (
    expectedContext.packageHash !== application.downstreamContext.packageHash
    || selection.expectedContextHash !== application.downstreamContext.packageHash
    || application.downstreamContext.applicationContentDigest !== application.contentDigest
    || application.downstreamContext.applicationId !== application.id
    || application.downstreamContext.targetContextDigest !== application.targetContextDigest
    || receipt.stagedContextHash !== application.downstreamContext.packageHash
    || receipt.stagedApplicationContentDigest !== application.contentDigest
    || receipt.projectId !== input.projectId
    || receipt.editSessionId !== input.editSessionId
  ) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The selected Edit Reference application no longer matches its connected target receipt.',
      409,
    )
  }
  if (
    application.doNotCopyRules.length === 0
    || application.decisions.length === 0
    || !application.decisions.some((decision) => decision.decision === 'applied' || decision.decision === 'adapted')
    || application.decisions.some((decision) => !COPY_SAFE_DECISIONS.has(decision.decision))
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Resolve clarification decisions and preserve explicit do-not-copy rules before planning.',
      409,
    )
  }

  return {
    version: 'autonomous-edit-preference-application-v1',
    applicationId: application.id,
    applicationContentDigest: application.contentDigest,
    contextHash: application.downstreamContext.packageHash,
    applicationSource: application.applicationSource,
    editReferenceId: application.editReferenceId,
    editReferenceName: application.editReferenceName,
    dnaVersionId: application.dnaVersionId,
    dnaVersionNumber: application.dnaVersionNumber,
    dnaContentDigest: application.dnaContentDigest,
    targetContextDigest: application.targetContextDigest,
    projectId: application.projectId,
    editSessionId: application.editSessionId,
    currentUserInstruction: application.targetContext.currentUserInstruction,
    approvedConstraints: [...application.targetContext.approvedConstraints],
    decisions: application.decisions.map((decision) => ({
      decisionId: decision.id,
      sourceRuleId: decision.sourceRuleId,
      layerId: decision.layerId,
      decision: decision.decision,
      precedence: decision.precedence,
      targetInstruction: decision.targetInstruction,
      reason: decision.reason,
      ...(decision.heldBackReason ? { heldBackReason: decision.heldBackReason } : {}),
      confidence: decision.confidence,
    })),
    doNotCopyRules: [...application.doNotCopyRules],
    precedencePolicy: [...application.precedencePolicy],
    summary: application.summary,
    runtimeSource: application.runtimeSource,
    resolvedFrom: 'private_edit_reference_repository',
    exactRepositoryReadVerified: true,
    rawReferenceMediaIncluded: false,
    rawProviderPayloadIncluded: false,
  }
}
