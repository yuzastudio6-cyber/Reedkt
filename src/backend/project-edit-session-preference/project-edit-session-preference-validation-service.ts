import type {
  ProjectEditSessionPreferenceApplicationPlan,
  ProjectEditSessionPreferenceOption,
  ProjectEditSessionPreferenceState,
  ProjectEditSessionPreferenceValidationResult,
} from '../../types/project-edit-session-preference'

export const PROJECT_EDIT_SESSION_PREFERENCE_SAFE_FLAGS = {
  providerCallMade: false,
  supabaseWriteMade: false,
  storageWriteMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
} as const

function result(blockedReasons: string[] = [], warnings: string[] = []): ProjectEditSessionPreferenceValidationResult {
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    warnings,
    ...PROJECT_EDIT_SESSION_PREFERENCE_SAFE_FLAGS,
  }
}

export function validateProjectEditSessionPreferenceOption(option: ProjectEditSessionPreferenceOption | undefined): ProjectEditSessionPreferenceValidationResult {
  const blocked: string[] = []
  if (!option) blocked.push('Preference option is missing.')
  if (option && !option.id) blocked.push('Preference option id is required.')
  if (option && option.mockOnly !== true) blocked.push('Preference option must be mockOnly.')
  return result(blocked)
}

export function validateProjectEditSessionPreferenceState(state: ProjectEditSessionPreferenceState | undefined): ProjectEditSessionPreferenceValidationResult {
  const blocked: string[] = []
  if (!state) blocked.push('Preference state is missing.')
  if (state && !state.projectId) blocked.push('Preference state projectId is required.')
  if (state && !state.editSessionId) blocked.push('Preference state editSessionId is required.')
  if (state && state.mockOnly !== true) blocked.push('Preference state must be mockOnly.')
  return result(blocked, state?.warnings ?? [])
}

export function validateProjectEditSessionPreferenceApplicationPlan(plan: ProjectEditSessionPreferenceApplicationPlan | undefined): ProjectEditSessionPreferenceValidationResult {
  const blocked: string[] = []
  if (!plan) blocked.push('Preference application plan is missing.')
  if (plan && !plan.projectId) blocked.push('Preference application projectId is required.')
  if (plan && !plan.editSessionId) blocked.push('Preference application editSessionId is required.')
  if (plan && plan.mockOnly !== true) blocked.push('Preference application plan must be mockOnly.')
  if (plan && plan.status === 'dna_blocked_by_qa' && plan.sessionUpdates.preferenceDNAApplicationId) {
    blocked.push('Blocked DNA QA plan must not set a DNA application id.')
  }
  return result(blocked, plan?.warnings ?? [])
}

export function validateNoProjectEditSessionPreferenceSideEffects(flags: Partial<Record<keyof typeof PROJECT_EDIT_SESSION_PREFERENCE_SAFE_FLAGS, boolean>> = {}): ProjectEditSessionPreferenceValidationResult {
  const blocked = Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => `${key} must remain false.`)
  return result(blocked)
}

export function createProjectEditSessionPreferenceValidationSummary(validation: ProjectEditSessionPreferenceValidationResult): string[] {
  return [
    validation.ok ? 'Project Edit Session preference validation passed.' : 'Project Edit Session preference validation blocked.',
    validation.blockedReasons.length ? validation.blockedReasons.join(' ') : 'No preference validation blockers.',
    'All production-effect flags are false.',
  ]
}
