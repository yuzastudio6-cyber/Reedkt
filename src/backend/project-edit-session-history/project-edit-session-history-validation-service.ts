import type {
  ProjectEditSessionHistoryActionPlan,
  ProjectEditSessionHistoryPackage,
  ProjectEditSessionHistoryValidationResult,
} from '../../types/project-edit-session-history'

export const PROJECT_EDIT_SESSION_HISTORY_NO_SIDE_EFFECTS = {
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

function validation(blockedReasons: string[], warnings: string[] = []): ProjectEditSessionHistoryValidationResult {
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    warnings,
    ...PROJECT_EDIT_SESSION_HISTORY_NO_SIDE_EFFECTS,
  }
}

export function validateProjectEditSessionHistoryActionPlan(
  plan: ProjectEditSessionHistoryActionPlan,
): ProjectEditSessionHistoryValidationResult {
  const blockedReasons = [
    plan.projectId ? undefined : 'Missing projectId.',
    plan.editSessionId ? undefined : 'Missing editSessionId.',
    plan.mockOnly ? undefined : 'History action plan must be mockOnly.',
    plan.safetyStatus.startsWith('blocked') ? `History action is ${plan.safetyStatus}.` : undefined,
    plan.safetyStatus === 'failed_validation' ? 'History action failed validation.' : undefined,
    plan.shouldPersist && plan.expectedWrites.length === 0 ? 'Persisted history action needs expected writes.' : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return validation(blockedReasons, plan.warnings)
}

export function validateProjectEditSessionHistoryPackage(
  historyPackage: ProjectEditSessionHistoryPackage,
): ProjectEditSessionHistoryValidationResult {
  const allRecords = [
    ...historyPackage.snapshots,
    ...historyPackage.versions,
    ...historyPackage.previews,
    ...historyPackage.revisions,
    ...historyPackage.events,
  ]
  const blockedReasons = [
    historyPackage.projectId ? undefined : 'Missing projectId.',
    historyPackage.editSessionId ? undefined : 'Missing editSessionId.',
    historyPackage.mockOnly ? undefined : 'History package must be mockOnly.',
    allRecords.some((record) => !record.mockOnly) ? 'All history records must be mockOnly.' : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return validation(blockedReasons, historyPackage.warnings)
}

export function validateNoProjectEditSessionHistorySideEffects(
  flags: Partial<Record<keyof typeof PROJECT_EDIT_SESSION_HISTORY_NO_SIDE_EFFECTS, boolean>>,
): ProjectEditSessionHistoryValidationResult {
  const blockedReasons = Object.entries(PROJECT_EDIT_SESSION_HISTORY_NO_SIDE_EFFECTS)
    .filter(([key]) => flags[key as keyof typeof PROJECT_EDIT_SESSION_HISTORY_NO_SIDE_EFFECTS] === true)
    .map(([key]) => `${key} must remain false.`)
  return validation(blockedReasons)
}

export function createProjectEditSessionHistoryValidationSummary(
  result: ProjectEditSessionHistoryValidationResult,
): string {
  return result.ok
    ? 'Project Edit Session history validation passed with all production-effect flags false.'
    : `Project Edit Session history validation blocked: ${result.blockedReasons.join('; ')}`
}
