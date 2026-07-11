import type {
  ProjectEditSessionPreferenceApplicationPlan,
  ProjectEditSessionPreferencePanelModel,
  ProjectEditSessionPreferenceState,
} from '../../types/project-edit-session-preference'

function label(value: string | undefined): string {
  if (!value) return 'None'
  return value.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function doNotCopyRules(state: ProjectEditSessionPreferenceState, plan?: ProjectEditSessionPreferenceApplicationPlan): string[] {
  const metadataRules = plan?.sessionUpdates.metadata?.doNotCopyRules
  if (Array.isArray(metadataRules)) return metadataRules.filter((item): item is string => typeof item === 'string')
  return state.doNotCopyRulesActive
    ? [
        'Do not copy reference videos shot-for-shot.',
        'Do not copy exact timing, exact music, exact SFX, exact graphic layout, creator identity, or person identity.',
        'Do not use reference visuals as project footage.',
      ]
    : []
}

export function createProjectEditSessionPreferencePanelModel(
  state: ProjectEditSessionPreferenceState,
  plan?: ProjectEditSessionPreferenceApplicationPlan,
): ProjectEditSessionPreferencePanelModel {
  const blockedReasons = plan?.status === 'dna_blocked_by_qa'
    ? [...state.blockedReasons, ...((plan.sessionUpdates.metadata?.preferenceBlockedReasons as string[] | undefined) ?? [])]
    : state.blockedReasons
  const rules = doNotCopyRules(state, plan)
  return {
    editSessionId: state.editSessionId,
    title: 'Selected Edit Preference',
    statusLabel: label(plan?.status ?? state.status),
    selectedPreferenceName: plan?.option.sourceKind === 'none' ? undefined : plan?.option.name ?? state.selectedEditPreferenceName,
    selectedPreferenceHandle: plan?.option.sourceKind === 'none' ? undefined : plan?.option.handle ?? state.selectedEditPreferenceHandle,
    dnaStatusLabel: plan?.sessionUpdates.dnaStatusLabel ?? state.dnaStatusLabel,
    dnaQAStatusLabel: plan?.sessionUpdates.dnaQAStatusLabel ?? state.dnaQAStatusLabel,
    doNotCopyRules: rules,
    badges: [
      label(plan?.status ?? state.status),
      rules.length ? 'Do-not-copy active' : 'Legacy no-DNA',
      'Mock only',
    ],
    canApplyPreference: true,
    canClearPreference: Boolean(state.selectedEditPreferenceHandle || state.selectedEditPreferenceId || plan?.option.sourceKind !== 'none'),
    requiresUserReview: plan?.status === 'dna_requires_user_review' || state.requiresUserReview,
    blockedReasons: Array.from(new Set(blockedReasons)),
    warnings: Array.from(new Set([...(state.warnings ?? []), ...(plan?.warnings ?? [])])),
    integrationStatus: state.integrationStatus,
    applicationContext: state.applicationContext,
    mockOnly: true,
  }
}

export function createProjectEditSessionPreferenceReadableSummary(state: ProjectEditSessionPreferenceState): string[] {
  return [
    `${state.selectedEditPreferenceHandle ?? 'No Edit Preference'} is ${state.status}.`,
    state.doNotCopyRulesActive ? 'Do-not-copy rules are active.' : 'Legacy/no-DNA fallback or no preference is active.',
  ]
}

export function createProjectEditSessionPreferenceDebugSummary(state: ProjectEditSessionPreferenceState): string[] {
  return [
    `projectId=${state.projectId}`,
    `editSessionId=${state.editSessionId}`,
    `status=${state.status}`,
    `handle=${state.selectedEditPreferenceHandle ?? 'none'}`,
    `dnaApplicationId=${state.dnaApplicationId ?? 'none'}`,
    'providerCallMade=false',
    'supabaseWriteMade=false',
  ]
}

export function createProjectEditSessionPreferenceBoundarySummary(): string[] {
  return [
    'ProjectEditSession uses exact target-adapted Edit Reference guidance as mock/local planning context only.',
    'No Qwen, DeepSeek, provider, worker, render, media processing, Supabase write, or credit action is enabled.',
    'Edit Preference library records are never mutated when applying or clearing a preference from an Edit Chat.',
  ]
}
