import type { PreferenceApplicationRecord } from '../types/edit-reference'
import {
  PREFERENCE_APPLICATION_DOWNSTREAM_CONTEXT_VERSION,
  PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  type PreferenceApplicationDownstreamContext,
  type PreferenceApplicationDownstreamInvalidationReceipt,
  type PreferenceApplicationInvalidationReason,
  type PreferenceApplicationIntegrationStatus,
  type PreferenceApplicationPlanGuidanceItem,
  type PreferenceApplicationQAContextSummary,
  type PreferenceApplicationTargetSessionReceipt,
  type ProjectEditSessionPreferenceIntegrationState,
} from '../types/edit-reference-integration'
import type {
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerType,
} from '../types/project-edit-brief'
import type { ProjectEditSessionRecord } from '../types/project-edit-session'
import type { PreferenceDNALayerId } from '../types/preference-dna-builder'
import { createReeditproDeterministicHash } from './source-video-understanding-rules'

const SESSION_METADATA_KEY = 'editReferencePreferenceIntegration'

export function createPreferenceApplicationDownstreamContext(
  application: PreferenceApplicationRecord,
  integrationStatus: PreferenceApplicationIntegrationStatus = 'connected_mock',
): PreferenceApplicationDownstreamContext {
  const groups = new Map(application.hintGroups.map((group) => [group.layerId, group]))
  const guidance = application.decisions
    .filter((decision) => decision.decision === 'adapted')
    .map((decision) => ({
      id: `downstream-guidance-${decision.id}`,
      layerId: decision.layerId,
      title: groups.get(decision.layerId)?.title ?? titleCase(decision.layerId),
      instruction: decision.targetInstruction,
      decision: 'adapted' as const,
      precedence: decision.precedence,
      sourceDecisionId: decision.id,
    }))
  const heldBack = application.decisions
    .filter((decision) => decision.decision !== 'adapted')
    .map((decision) => ({
      id: `downstream-held-back-${decision.id}`,
      layerId: decision.layerId,
      title: groups.get(decision.layerId)?.title ?? titleCase(decision.layerId),
      reason: decision.reason,
      sourceDecisionId: decision.id,
    }))
  const immutablePackage = {
    packageVersion: PREFERENCE_APPLICATION_DOWNSTREAM_CONTEXT_VERSION,
    applicationId: application.id,
    applicationContentDigest: application.contentDigest,
    editReferenceId: application.editReferenceId,
    editReferenceName: application.editReferenceName,
    dnaVersionId: application.dnaVersionId,
    dnaVersionNumber: application.dnaVersionNumber,
    targetContextDigest: application.targetContextDigest,
    projectId: application.projectId,
    editSessionId: application.editSessionId,
    currentUserInstruction: application.targetContext.currentUserInstruction,
    approvedConstraints: application.targetContext.approvedConstraints,
    guidance,
    heldBack,
    doNotCopyRules: application.doNotCopyRules,
    precedencePolicy: application.precedencePolicy,
    summary: application.summary,
  }
  return {
    ...immutablePackage,
    packageHash: createReeditproDeterministicHash(immutablePackage),
    integrationStatus,
    mockOnly: true,
    safety: PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  }
}

export function validatePreferenceApplicationTargetSession(input: {
  application: PreferenceApplicationRecord
  session: ProjectEditSessionRecord
  outputFrameConfirmed: boolean
}): string[] {
  const { application, session } = input
  const errors: string[] = []
  if (application.status !== 'prepared') errors.push('Only a prepared Preference Application can connect to an Edit Chat.')
  if (application.projectId !== session.projectId) errors.push('The application project does not match this Edit Chat.')
  if (application.editSessionId !== session.id) errors.push('The application target does not match this Edit Chat.')
  if (session.aspectRatio === 'custom') errors.push('Custom output frames are not supported by this Gate 6 mock integration.')
  else if (application.targetContext.aspectRatio !== session.aspectRatio) errors.push('The prepared output frame no longer matches this Edit Chat.')
  if (application.targetContext.platformTarget !== session.platformTarget) errors.push('The prepared delivery platform no longer matches this Edit Chat.')
  if (application.targetContext.selectedEditLevel !== session.selectedEditLevel) errors.push('The prepared edit level no longer matches this Edit Chat.')
  if (!input.outputFrameConfirmed) errors.push('Confirm this Edit Chat’s output frame before connecting Preference DNA.')
  if (application.targetContext.outputFrameConfirmed !== true) errors.push('The prepared target snapshot does not contain a confirmed output frame.')
  return errors
}

export function createPreferenceApplicationTargetSessionReceipt(input: {
  application: PreferenceApplicationRecord
  sessionBefore: ProjectEditSessionRecord
  sessionAfter: ProjectEditSessionRecord
  context: PreferenceApplicationDownstreamContext
  outputFrameConfirmed: true
  stagedAt?: string
}): PreferenceApplicationTargetSessionReceipt {
  if (input.sessionAfter.aspectRatio === 'custom') {
    throw new Error('A confirmed non-custom output frame is required for the mock integration receipt.')
  }
  const resetRequired = input.sessionBefore.approvalStatus === 'approved' || input.sessionBefore.approvalStatus === 'requested'
  return {
    receiptVersion: 'edit-reference-project-session-receipt-v1',
    projectId: input.sessionAfter.projectId,
    editSessionId: input.sessionAfter.id,
    sessionName: input.sessionAfter.name,
    sessionUpdatedAt: input.sessionAfter.updatedAt,
    aspectRatio: input.sessionAfter.aspectRatio,
    platformTarget: input.sessionAfter.platformTarget,
    selectedEditLevel: input.sessionAfter.selectedEditLevel ?? 'premium',
    outputFrameConfirmed: input.outputFrameConfirmed,
    approvalStatusBefore: input.sessionBefore.approvalStatus,
    approvalStatusAfter: input.sessionAfter.approvalStatus,
    approvalResetRequired: resetRequired,
    stagedContextHash: input.context.packageHash,
    stagedApplicationContentDigest: input.application.contentDigest,
    stagedAt: input.stagedAt ?? new Date().toISOString(),
    mockOnly: true,
  }
}

export function createPreferenceApplicationDownstreamInvalidationReceipt(input: {
  application: PreferenceApplicationRecord
  context: PreferenceApplicationDownstreamContext
  reason: PreferenceApplicationInvalidationReason
  sessionBefore: ProjectEditSessionRecord
  sessionAfter: ProjectEditSessionRecord
  invalidatedAt: string
  approvalStatusBefore?: ProjectEditSessionRecord['approvalStatus']
  approvalStatusAfter?: ProjectEditSessionRecord['approvalStatus']
  approvalResetRequired?: boolean
}): PreferenceApplicationDownstreamInvalidationReceipt {
  const approvalStatusBefore = input.approvalStatusBefore ?? input.sessionBefore.approvalStatus
  const approvalStatusAfter = input.approvalStatusAfter ?? input.sessionAfter.approvalStatus
  const resetRequired = input.approvalResetRequired ?? (
    approvalStatusBefore === 'approved' || approvalStatusBefore === 'requested'
  )
  return {
    receiptVersion: 'edit-reference-downstream-invalidation-receipt-v1',
    applicationId: input.application.id,
    applicationContentDigest: input.application.contentDigest,
    contextHash: input.context.packageHash,
    projectId: input.sessionAfter.projectId,
    editSessionId: input.sessionAfter.id,
    reason: input.reason,
    sessionUpdatedAt: input.sessionAfter.updatedAt,
    approvalStatusBefore,
    approvalStatusAfter,
    approvalResetRequired: resetRequired,
    sessionContextInvalidated: true,
    approvedPlanMutationMade: false,
    invalidatedAt: input.invalidatedAt,
    mockOnly: true,
    safety: PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  }
}

export function createProjectEditSessionPreferenceIntegrationState(input: {
  application: PreferenceApplicationRecord
  context: PreferenceApplicationDownstreamContext
  status: PreferenceApplicationIntegrationStatus
  stagedAt?: string
  connectedAt?: string
  invalidatedAt?: string
  invalidationReason?: PreferenceApplicationInvalidationReason
  invalidationApprovalStatusBefore?: ProjectEditSessionRecord['approvalStatus']
  invalidationApprovalStatusAfter?: ProjectEditSessionRecord['approvalStatus']
  invalidationApprovalResetRequired?: boolean
}): ProjectEditSessionPreferenceIntegrationState {
  return {
    status: input.status,
    applicationId: input.application.id,
    editReferenceId: input.application.editReferenceId,
    editReferenceName: input.application.editReferenceName,
    dnaVersionId: input.application.dnaVersionId,
    dnaVersionNumber: input.application.dnaVersionNumber,
    context: { ...input.context, integrationStatus: input.status },
    stagedAt: input.stagedAt ?? new Date().toISOString(),
    connectedAt: input.connectedAt,
    invalidatedAt: input.invalidatedAt,
    invalidationReason: input.invalidationReason,
    invalidationApprovalStatusBefore: input.invalidationApprovalStatusBefore,
    invalidationApprovalStatusAfter: input.invalidationApprovalStatusAfter,
    invalidationApprovalResetRequired: input.invalidationApprovalResetRequired,
    mockOnly: true,
  }
}

export function writePreferenceApplicationIntegrationState(
  metadata: Record<string, unknown> | undefined,
  state: ProjectEditSessionPreferenceIntegrationState,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    [SESSION_METADATA_KEY]: state,
  }
}

export function readPreferenceApplicationIntegrationState(
  session: Pick<ProjectEditSessionRecord, 'id' | 'projectId' | 'metadata'> | undefined,
): ProjectEditSessionPreferenceIntegrationState | undefined {
  const value = session?.metadata?.[SESSION_METADATA_KEY]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const candidate = value as Partial<ProjectEditSessionPreferenceIntegrationState>
  const context = candidate.context as PreferenceApplicationDownstreamContext | undefined
  if (
    candidate.mockOnly !== true
    || !candidate.applicationId
    || !candidate.editReferenceId
    || !candidate.editReferenceName
    || !candidate.dnaVersionId
    || !candidate.status
    || !context
    || context.applicationId !== candidate.applicationId
    || context.integrationStatus !== candidate.status
    || !isPreferenceApplicationDownstreamContextValid(context, {
      projectId: session?.projectId,
      editSessionId: session?.id,
    })
    || (candidate.status === 'connected_mock' && !candidate.connectedAt)
    || (candidate.status === 'invalidated' && (
      !candidate.connectedAt
      || !candidate.invalidatedAt
      || !candidate.invalidationReason
      || !candidate.invalidationApprovalStatusBefore
      || !candidate.invalidationApprovalStatusAfter
      || candidate.invalidationApprovalResetRequired === undefined
    ))
    || (candidate.status !== 'invalidated' && (
      candidate.invalidatedAt
      || candidate.invalidationReason
      || candidate.invalidationApprovalStatusBefore
      || candidate.invalidationApprovalStatusAfter
      || candidate.invalidationApprovalResetRequired !== undefined
    ))
  ) return undefined
  return candidate as ProjectEditSessionPreferenceIntegrationState
}

export function isPreferenceApplicationDownstreamContextValid(
  context: PreferenceApplicationDownstreamContext | undefined,
  target?: { projectId?: string; editSessionId?: string },
): context is PreferenceApplicationDownstreamContext {
  return Boolean(
    context
    && context.mockOnly === true
    && context.packageVersion === PREFERENCE_APPLICATION_DOWNSTREAM_CONTEXT_VERSION
    && ['staged_unconfirmed', 'connected_mock', 'invalidated'].includes(context.integrationStatus)
    && Array.isArray(context.guidance)
    && Array.isArray(context.heldBack)
    && Array.isArray(context.doNotCopyRules)
    && Array.isArray(context.approvedConstraints)
    && (!target?.projectId || context.projectId === target.projectId)
    && (!target?.editSessionId || context.editSessionId === target.editSessionId)
    && hasSafePreferenceApplicationIntegrationFlags(context)
    && context.packageHash === createPreferenceApplicationDownstreamContextFromContext(context).packageHash,
  )
}

export function readConnectedPreferenceApplicationContext(
  session: Pick<ProjectEditSessionRecord, 'id' | 'projectId' | 'metadata'> | undefined,
): PreferenceApplicationDownstreamContext | undefined {
  const state = readPreferenceApplicationIntegrationState(session)
  return state?.status === 'connected_mock' ? state.context : undefined
}

function hasSafePreferenceApplicationIntegrationFlags(
  context: PreferenceApplicationDownstreamContext,
): boolean {
  return Object.entries(PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS).every(
    ([key, value]) => context.safety?.[key as keyof typeof PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS] === value,
  )
}

export function createPreferenceApplicationPlanGuidance(input: {
  context: PreferenceApplicationDownstreamContext
  markers: ProjectEditBriefMarkerRecord[]
}): PreferenceApplicationPlanGuidanceItem[] {
  const confirmedTypes = new Set(input.markers
    .filter((marker) => marker.status === 'confirmed' || marker.status === 'ready_for_plan' || marker.priority === 'must_follow')
    .map((marker) => marker.markerType))
  return input.context.guidance.map((item) => {
    const markerTypes = markerTypesForLayer(item.layerId)
    const heldBack = markerTypes.some((markerType) => confirmedTypes.has(markerType))
    return {
      id: `plan-${item.id}`,
      layerId: item.layerId,
      title: item.title,
      instruction: item.instruction,
      status: heldBack ? 'held_back_by_confirmed_marker' : 'active_hint',
      reason: heldBack
        ? 'A confirmed Edit Brief marker covers this creative layer and outranks reusable Preference DNA.'
        : 'No higher-priority confirmed marker overrides this target-adapted Preference DNA hint.',
      priority: 'edit_preference_dna',
    }
  })
}

export function createPreferenceApplicationQAContextSummary(input: {
  context: PreferenceApplicationDownstreamContext
  projectId: string
  editSessionId: string
  markers: ProjectEditBriefMarkerRecord[]
}): PreferenceApplicationQAContextSummary {
  const planGuidance = createPreferenceApplicationPlanGuidance({ context: input.context, markers: input.markers })
  const findings: string[] = []
  let status: PreferenceApplicationQAContextSummary['status'] = 'passed'
  if (input.context.projectId !== input.projectId || input.context.editSessionId !== input.editSessionId) {
    status = 'blocked'
    findings.push('The connected Preference Application does not match this Project Edit Session.')
  }
  if (!input.context.doNotCopyRules.length) {
    status = 'blocked'
    findings.push('Do-not-copy protection is missing from the connected Preference Application.')
  }
  if (input.context.precedencePolicy[0] !== 'safety_platform_tier_frame_credit_or_approved_constraint') {
    status = 'blocked'
    findings.push('The required safety-first precedence policy is missing.')
  }
  const heldBackCount = planGuidance.filter((item) => item.status === 'held_back_by_confirmed_marker').length
  if (status !== 'blocked' && heldBackCount > 0) {
    status = 'warning'
    findings.push(`${heldBackCount} reusable hint${heldBackCount === 1 ? '' : 's'} held back because confirmed Edit Brief markers outrank Preference DNA.`)
  }
  if (!findings.length) findings.push('Target-adapted guidance is bounded, copy-safe, and lower priority than current instructions and confirmed markers.')
  return {
    applicationId: input.context.applicationId,
    contextHash: input.context.packageHash,
    status,
    activeGuidanceCount: planGuidance.filter((item) => item.status === 'active_hint').length,
    heldBackGuidanceCount: heldBackCount,
    doNotCopyRuleCount: input.context.doNotCopyRules.length,
    findings,
    prioritySummary: 'Safety and approved constraints outrank current user instructions; confirmed Edit Brief markers then outrank target-adapted Preference DNA.',
    mockOnly: true,
  }
}

function createPreferenceApplicationDownstreamContextFromContext(
  context: PreferenceApplicationDownstreamContext,
): Pick<PreferenceApplicationDownstreamContext, 'packageHash'> {
  const immutablePackage = {
    packageVersion: context.packageVersion,
    applicationId: context.applicationId,
    applicationContentDigest: context.applicationContentDigest,
    editReferenceId: context.editReferenceId,
    editReferenceName: context.editReferenceName,
    dnaVersionId: context.dnaVersionId,
    dnaVersionNumber: context.dnaVersionNumber,
    targetContextDigest: context.targetContextDigest,
    projectId: context.projectId,
    editSessionId: context.editSessionId,
    currentUserInstruction: context.currentUserInstruction,
    approvedConstraints: context.approvedConstraints,
    guidance: context.guidance,
    heldBack: context.heldBack,
    doNotCopyRules: context.doNotCopyRules,
    precedencePolicy: context.precedencePolicy,
    summary: context.summary,
  }
  return { packageHash: createReeditproDeterministicHash(immutablePackage) }
}

function markerTypesForLayer(layerId: PreferenceDNALayerId): ProjectEditBriefMarkerType[] {
  switch (layerId) {
    case 'speech_caption_behavior': return ['caption_text']
    case 'music_soundsync': return ['music_soundtrack']
    case 'sfx_sound_design': return ['sfx_sound_design']
    case 'pacing_timing': return ['speed_pacing', 'transition']
    case 'color_tone_space': return ['color_tone']
    case 'broll_shot_language': return ['broll']
    case 'graphic_design_visualexplain':
    case 'ui_document_card_treatment': return ['graphic_card_ui']
    case 'structure_story_flow': return ['keep_emphasize', 'cut_remove']
    default: return ['general_note']
  }
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
