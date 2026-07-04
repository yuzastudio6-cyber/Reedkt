import type {
  ProjectEditSessionPreferenceApplicationPlan,
  ProjectEditSessionPreferenceOption,
} from '../../types/project-edit-session-preference'

export function createPreferenceAppliedHistoryEvent(option: ProjectEditSessionPreferenceOption): string {
  return `Applied Edit Preference ${option.handle ?? option.name} to this mock Edit Chat.`
}

export function createPreferenceClearedHistoryEvent(): string {
  return 'Cleared selected Edit Preference from this mock Edit Chat.'
}

export function createPreferenceReplacedHistoryEvent(previousHandle: string | undefined, option: ProjectEditSessionPreferenceOption): string {
  return `Replaced ${previousHandle ?? 'previous Edit Preference'} with ${option.handle ?? option.name} in this mock Edit Chat.`
}

export function createPreferenceAppliedSnapshotSummary(plan: ProjectEditSessionPreferenceApplicationPlan): string {
  if (plan.status === 'cleared') return 'Cleared selected Edit Preference from mock Edit Chat.'
  if (plan.status === 'dna_blocked_by_qa' || plan.status === 'failed_validation') {
    return `Preference ${plan.option.handle ?? plan.option.name} selected, but DNA application is blocked by QA.`
  }
  return `Applied ${plan.option.handle ?? plan.option.name} to mock Edit Chat with status ${plan.status}.`
}

export function createProjectEditSessionPreferenceHistoryBridgeSummary(events: string[]): string[] {
  return [
    `${events.length} history event(s) prepared.`,
    ...events,
  ]
}
