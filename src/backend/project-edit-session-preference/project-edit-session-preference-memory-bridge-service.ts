import type {
  ProjectEditSessionPreferenceApplicationPlan,
  ProjectEditSessionPreferenceMemoryUpdate,
  ProjectEditSessionPreferenceOption,
} from '../../types/project-edit-session-preference'

export function createLegacyPreferenceMemoryUpdatesForSession(
  option: ProjectEditSessionPreferenceOption,
): ProjectEditSessionPreferenceMemoryUpdate[] {
  return [{
    layer: 'preference_memory',
    summary: `Legacy Edit Preference ${option.handle ?? option.name} selected for this Edit Chat.`,
    facts: [`Selected Edit Preference: ${option.handle ?? option.name}`],
    preferences: ['Use saved preference profile/signals as mock planning metadata only.'],
    warnings: ['No Preference DNA package is active for this legacy fallback.'],
  }]
}

export function createDNAApplicationMemoryUpdatesForSession(
  option: ProjectEditSessionPreferenceOption,
  status: ProjectEditSessionPreferenceApplicationPlan['status'],
): ProjectEditSessionPreferenceMemoryUpdate[] {
  return [
    {
      layer: 'preference_memory',
      summary: `DNA-backed Edit Preference ${option.handle ?? option.name} selected.`,
      facts: [`Selected Edit Preference: ${option.handle ?? option.name}`, `DNA status: ${status}`],
      preferences: ['Use Preference DNA only as mock planning metadata after QA policy allows it.'],
      warnings: option.requiresUserReview ? ['Preference DNA requires user review.'] : [],
    },
    {
      layer: 'dna_application_memory',
      summary: `Preference DNA application status is ${status}.`,
      facts: [
        `DNA status label: ${option.dnaStatusLabel ?? 'mock ready'}`,
        `DNA QA label: ${option.dnaQAStatusLabel ?? 'approved mock'}`,
      ],
      preferences: ['Adapt editing language; never copy source/reference media.'],
      warnings: status === 'dna_blocked_by_qa' ? ['DNA QA blocks mock DNA application.'] : [],
    },
  ]
}

export function createPreferenceClearedMemoryUpdatesForSession(): ProjectEditSessionPreferenceMemoryUpdate[] {
  return [{
    layer: 'preference_memory',
    summary: 'Selected Edit Preference was cleared from this mock Edit Chat.',
    facts: ['No reusable Edit Preference is currently selected.'],
    preferences: [],
    warnings: ['Clearing the Edit Chat preference did not mutate the saved Edit Preference library.'],
  }]
}

export function createPreferenceMemoryUpdatesForSession(
  option: ProjectEditSessionPreferenceOption,
  status: ProjectEditSessionPreferenceApplicationPlan['status'],
): ProjectEditSessionPreferenceMemoryUpdate[] {
  if (option.sourceKind === 'none' || status === 'cleared') return createPreferenceClearedMemoryUpdatesForSession()
  if (option.hasDNA) return createDNAApplicationMemoryUpdatesForSession(option, status)
  return createLegacyPreferenceMemoryUpdatesForSession(option)
}

export function createProjectEditSessionPreferenceMemoryBridgeSummary(updates: ProjectEditSessionPreferenceMemoryUpdate[]): string[] {
  return [
    `${updates.length} memory update(s) prepared.`,
    ...updates.map((update) => `${update.layer}: ${update.summary}`),
  ]
}
