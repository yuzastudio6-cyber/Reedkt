import type { ProjectEditSessionRecord } from '../../types/project-edit-session'
import type {
  ProjectEditSessionPreferenceApplicationPlan,
  ProjectEditSessionPreferenceOption,
} from '../../types/project-edit-session-preference'
import {
  createProjectEditSessionPreferenceDNABridge,
} from './project-edit-session-preference-dna-bridge-service'
import { createPreferenceMemoryUpdatesForSession } from './project-edit-session-preference-memory-bridge-service'
import {
  createPreferenceAppliedHistoryEvent,
  createPreferenceAppliedSnapshotSummary,
  createPreferenceClearedHistoryEvent,
  createPreferenceReplacedHistoryEvent,
} from './project-edit-session-preference-history-bridge-service'
import { createNoPreferenceOption } from './project-edit-session-preference-option-service'

function shouldResetApproval(session: ProjectEditSessionRecord | undefined): boolean {
  return session?.approvalStatus === 'approved' || session?.approvalStatus === 'requested'
}

function sessionUpdatesFor(
  session: ProjectEditSessionRecord | undefined,
  option: ProjectEditSessionPreferenceOption,
): ProjectEditSessionPreferenceApplicationPlan['sessionUpdates'] {
  if (option.sourceKind === 'none') {
    return {
      selectedEditPreferenceId: undefined,
      selectedPreferenceVersionId: undefined,
      selectedEditPreferenceHandle: undefined,
      preferenceDNAApplicationId: undefined,
      dnaStatusLabel: undefined,
      dnaQAStatusLabel: undefined,
      doNotCopyRulesActive: false,
      approvalStatus: shouldResetApproval(session) ? 'reset_after_revision' : session?.approvalStatus,
      metadata: {
        ...(session?.metadata ?? {}),
        selectedEditPreferenceName: undefined,
        preferenceStatus: 'cleared',
        preferenceRequiresUserReview: false,
        preferenceBlockedByDNAQA: false,
        preferenceBlockedReasons: [],
        preferenceWarnings: [],
      },
    }
  }
  const bridge = createProjectEditSessionPreferenceDNABridge(option)
  const blocked = bridge.status === 'dna_blocked_by_qa' || bridge.status === 'failed_validation'
  return {
    selectedEditPreferenceId: option.id,
    selectedPreferenceVersionId: option.hasDNA ? `${option.id}-current-version` : undefined,
    selectedEditPreferenceHandle: option.handle,
    preferenceDNAApplicationId: blocked ? undefined : bridge.dnaApplicationId,
    dnaStatusLabel: option.hasDNA ? bridge.dnaStatusLabel : undefined,
    dnaQAStatusLabel: option.hasDNA ? bridge.dnaQAStatusLabel : undefined,
    doNotCopyRulesActive: option.hasDNA && !blocked ? bridge.doNotCopyRules.length > 0 : false,
    approvalStatus: shouldResetApproval(session) ? 'reset_after_revision' : session?.approvalStatus,
    metadata: {
      ...(session?.metadata ?? {}),
      selectedEditPreferenceName: option.name,
      preferenceStatus: bridge.status,
      preferenceRequiresUserReview: bridge.requiresUserReview,
      preferenceBlockedByDNAQA: blocked,
      preferenceBlockedReasons: bridge.blockedReasons,
      preferenceWarnings: bridge.warnings,
      doNotCopyRules: bridge.doNotCopyRules,
      preferenceApplicationDeferred: false,
    },
  }
}

export function createProjectEditSessionPreferenceApplicationPlan(input: {
  projectId: string
  editSessionId: string
  option: ProjectEditSessionPreferenceOption
  currentSession?: ProjectEditSessionRecord
  previousPreferenceHandle?: string
}): ProjectEditSessionPreferenceApplicationPlan {
  const bridge = createProjectEditSessionPreferenceDNABridge(input.option)
  const replacing = Boolean(input.previousPreferenceHandle && input.previousPreferenceHandle !== input.option.handle)
  const clearing = input.option.sourceKind === 'none'
  const status = clearing ? 'cleared' : bridge.status
  const memoryUpdates = clearing ? createPreferenceMemoryUpdatesForSession(createNoPreferenceOption(), status) : createPreferenceMemoryUpdatesForSession(input.option, status)
  const historyEvents = clearing
    ? [createPreferenceClearedHistoryEvent()]
    : replacing
      ? [createPreferenceReplacedHistoryEvent(input.previousPreferenceHandle, input.option)]
      : [createPreferenceAppliedHistoryEvent(input.option)]
  const plan: ProjectEditSessionPreferenceApplicationPlan = {
    id: `${input.editSessionId}-preference-plan-${input.option.id}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    option: input.option,
    status,
    actions: [
      clearing ? 'clear_preference' : 'apply_preference',
      ...(replacing ? ['replace_preference' as const] : []),
      ...(input.option.hasDNA ? ['apply_dna' as const] : clearing ? [] : ['apply_legacy_fallback' as const]),
      'create_memory_update',
      'create_history_event',
      'create_snapshot',
    ],
    sessionUpdates: sessionUpdatesFor(input.currentSession, input.option),
    memoryUpdates,
    historyEvents,
    shouldResetApproval: shouldResetApproval(input.currentSession),
    mockOnly: true,
    warnings: bridge.warnings,
  }
  return {
    ...plan,
    snapshotSummary: createPreferenceAppliedSnapshotSummary(plan),
  }
}

export function applyPreferenceToProjectEditSessionMock(input: {
  projectId: string
  editSessionId: string
  option: ProjectEditSessionPreferenceOption
  currentSession?: ProjectEditSessionRecord
}): ProjectEditSessionPreferenceApplicationPlan {
  return createProjectEditSessionPreferenceApplicationPlan({
    ...input,
    previousPreferenceHandle: input.currentSession?.selectedEditPreferenceHandle,
  })
}

export function clearPreferenceFromProjectEditSessionMock(input: {
  projectId: string
  editSessionId: string
  currentSession?: ProjectEditSessionRecord
}): ProjectEditSessionPreferenceApplicationPlan {
  return createProjectEditSessionPreferenceApplicationPlan({
    ...input,
    option: createNoPreferenceOption(),
    previousPreferenceHandle: input.currentSession?.selectedEditPreferenceHandle,
  })
}

export function replaceProjectEditSessionPreferenceMock(input: {
  projectId: string
  editSessionId: string
  option: ProjectEditSessionPreferenceOption
  previousPreferenceHandle?: string
  currentSession?: ProjectEditSessionRecord
}): ProjectEditSessionPreferenceApplicationPlan {
  return createProjectEditSessionPreferenceApplicationPlan(input)
}

export function createProjectEditSessionPreferenceApplicationSummary(plan: ProjectEditSessionPreferenceApplicationPlan): string[] {
  return [
    `${plan.option.handle ?? plan.option.name}: ${plan.status}.`,
    plan.shouldResetApproval ? 'Approval reset because preference changed after approval/request.' : 'Approval state remains in safe mock state.',
    plan.snapshotSummary ?? 'No snapshot summary.',
    'No provider, worker, render, media processing, Supabase, or credit side effect is permitted.',
  ]
}
