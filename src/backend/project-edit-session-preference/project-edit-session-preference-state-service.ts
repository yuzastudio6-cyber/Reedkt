import type { ProjectEditSessionRecord } from '../../types/project-edit-session'
import type {
  ProjectEditSessionPreferenceApplicationStatus,
  ProjectEditSessionPreferenceState,
} from '../../types/project-edit-session-preference'
import type {
  PreferenceApplicationDownstreamContext,
  PreferenceApplicationIntegrationStatus,
} from '../../types/edit-reference-integration'
import { readPreferenceApplicationIntegrationState } from '../../lib/edit-reference-downstream-context'

function statusFromSession(session: ProjectEditSessionRecord | undefined): ProjectEditSessionPreferenceApplicationStatus {
  if (!session?.selectedEditPreferenceHandle && !session?.selectedEditPreferenceId) return 'not_selected'
  if (session.metadata?.preferenceBlockedByDNAQA === true) return 'dna_blocked_by_qa'
  if (session.metadata?.preferenceRequiresUserReview === true) return 'dna_requires_user_review'
  if (session.preferenceDNAApplicationId && session.dnaStatusLabel?.toLowerCase().includes('warning')) return 'dna_applied_with_warnings_mock'
  if (session.preferenceDNAApplicationId || session.dnaStatusLabel) return 'dna_applied_mock'
  return 'legacy_preference_applied'
}

export function createProjectEditSessionPreferenceState(input: {
  projectId: string
  editSessionId: string
  status?: ProjectEditSessionPreferenceApplicationStatus
  selectedEditPreferenceId?: string
  selectedPreferenceVersionId?: string
  selectedEditPreferenceHandle?: string
  selectedEditPreferenceName?: string
  dnaApplicationId?: string
  dnaStatusLabel?: string
  dnaQAStatusLabel?: string
  doNotCopyRulesActive?: boolean
  requiresUserReview?: boolean
  blockedReasons?: string[]
  warnings?: string[]
  integrationStatus?: PreferenceApplicationIntegrationStatus
  applicationContext?: PreferenceApplicationDownstreamContext
}): ProjectEditSessionPreferenceState {
  return {
    id: `${input.editSessionId}-preference-state`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    selectedEditPreferenceId: input.selectedEditPreferenceId,
    selectedPreferenceVersionId: input.selectedPreferenceVersionId,
    selectedEditPreferenceHandle: input.selectedEditPreferenceHandle,
    selectedEditPreferenceName: input.selectedEditPreferenceName,
    status: input.status ?? 'not_selected',
    dnaApplicationId: input.dnaApplicationId,
    dnaStatusLabel: input.dnaStatusLabel,
    dnaQAStatusLabel: input.dnaQAStatusLabel,
    doNotCopyRulesActive: input.doNotCopyRulesActive ?? false,
    requiresUserReview: input.requiresUserReview ?? false,
    blockedReasons: input.blockedReasons ?? [],
    warnings: input.warnings ?? [],
    integrationStatus: input.integrationStatus,
    applicationContext: input.applicationContext,
    mockOnly: true,
  }
}

export function createPreferenceStateFromSession(session: ProjectEditSessionRecord): ProjectEditSessionPreferenceState {
  const integrationState = readPreferenceApplicationIntegrationState(session)
  return createProjectEditSessionPreferenceState({
    projectId: session.projectId,
    editSessionId: session.id,
    status: statusFromSession(session),
    selectedEditPreferenceId: session.selectedEditPreferenceId,
    selectedPreferenceVersionId: session.selectedPreferenceVersionId,
    selectedEditPreferenceHandle: session.selectedEditPreferenceHandle,
    selectedEditPreferenceName: typeof session.metadata?.selectedEditPreferenceName === 'string'
      ? session.metadata.selectedEditPreferenceName
      : session.selectedEditPreferenceHandle,
    dnaApplicationId: session.preferenceDNAApplicationId,
    dnaStatusLabel: session.dnaStatusLabel,
    dnaQAStatusLabel: session.dnaQAStatusLabel,
    doNotCopyRulesActive: session.doNotCopyRulesActive,
    requiresUserReview: session.metadata?.preferenceRequiresUserReview === true,
    blockedReasons: Array.isArray(session.metadata?.preferenceBlockedReasons)
      ? session.metadata.preferenceBlockedReasons.filter((item): item is string => typeof item === 'string')
      : [],
    warnings: Array.isArray(session.metadata?.preferenceWarnings)
      ? session.metadata.preferenceWarnings.filter((item): item is string => typeof item === 'string')
      : [],
    integrationStatus: integrationState?.status,
    applicationContext: integrationState?.context,
  })
}

export function createPreferenceStateAfterClear(session: ProjectEditSessionRecord): ProjectEditSessionPreferenceState {
  return createProjectEditSessionPreferenceState({
    projectId: session.projectId,
    editSessionId: session.id,
    status: 'cleared',
    warnings: ['Selected Edit Preference was cleared from this mock Edit Chat only.'],
  })
}

export function createProjectEditSessionPreferenceStateSummary(state: ProjectEditSessionPreferenceState): string[] {
  return [
    `Preference state for ${state.editSessionId}: ${state.status}.`,
    state.selectedEditPreferenceHandle ? `Selected handle: ${state.selectedEditPreferenceHandle}.` : 'No selected Edit Preference handle.',
    state.doNotCopyRulesActive ? 'Do-not-copy rules active.' : 'No DNA do-not-copy package active.',
  ]
}
