import type {
  ProjectEditSessionPreferenceOption,
} from '../../types/project-edit-session-preference'
import type { MockDatabase } from '../mock/mock-database'

export const NO_EDIT_PREFERENCE_OPTION_ID = 'none'
export const LEGACY_EDIT_PREFERENCE_HANDLE = '@legacy-clean-edit'
export const DNA_EDIT_PREFERENCE_HANDLE = '@lifestyle-travel-vlog'

export function createDNABackedMockPreferenceOption(): ProjectEditSessionPreferenceOption {
  return {
    id: 'pref_lifestyle_travel_vlog',
    handle: DNA_EDIT_PREFERENCE_HANDLE,
    name: 'Lifestyle Travel Vlog',
    sourceKind: 'saved_edit_preference',
    description: 'Mock saved preference with safe Preference DNA-style hints for Edit Chat context only.',
    hasDNA: true,
    dnaStatusLabel: 'Preference DNA applied',
    dnaQAStatusLabel: 'approved mock',
    doNotCopyRulesActive: true,
    requiresUserReview: false,
    mockOnly: true,
  }
}

export function createLegacyNoDNAPreferenceOption(): ProjectEditSessionPreferenceOption {
  return {
    id: 'pref_legacy_saved',
    handle: LEGACY_EDIT_PREFERENCE_HANDLE,
    name: 'Legacy Clean Edit',
    sourceKind: 'legacy_no_dna',
    description: 'Legacy mock saved preference without Preference DNA metadata.',
    hasDNA: false,
    doNotCopyRulesActive: false,
    requiresUserReview: false,
    mockOnly: true,
  }
}

export function createNoPreferenceOption(): ProjectEditSessionPreferenceOption {
  return {
    id: NO_EDIT_PREFERENCE_OPTION_ID,
    name: 'No Edit Preference',
    sourceKind: 'none',
    description: 'Use this Edit Chat without reusable Edit Preference guidance.',
    hasDNA: false,
    doNotCopyRulesActive: false,
    requiresUserReview: false,
    mockOnly: true,
  }
}

export function listProjectEditSessionPreferenceOptions(_db: MockDatabase): ProjectEditSessionPreferenceOption[] {
  const byHandle = new Map<string, ProjectEditSessionPreferenceOption>()
  for (const option of [createNoPreferenceOption(), createDNABackedMockPreferenceOption(), createLegacyNoDNAPreferenceOption()]) {
    byHandle.set(option.handle ?? option.id, option)
  }
  return Array.from(byHandle.values())
}

export function findProjectEditSessionPreferenceOption(
  db: MockDatabase,
  optionIdOrHandle: string | undefined,
): ProjectEditSessionPreferenceOption {
  const options = listProjectEditSessionPreferenceOptions(db)
  if (!optionIdOrHandle || optionIdOrHandle === NO_EDIT_PREFERENCE_OPTION_ID) return createNoPreferenceOption()
  return options.find((option) => option.id === optionIdOrHandle || option.handle === optionIdOrHandle)
    ?? (optionIdOrHandle === LEGACY_EDIT_PREFERENCE_HANDLE ? createLegacyNoDNAPreferenceOption() : createNoPreferenceOption())
}

export function createProjectEditSessionPreferenceOptionSummary(option: ProjectEditSessionPreferenceOption): string[] {
  return [
    `${option.handle ?? option.name}: ${option.hasDNA ? 'Preference DNA metadata available.' : 'No Preference DNA metadata.'}`,
    option.doNotCopyRulesActive ? 'Do-not-copy rules active.' : 'Do-not-copy rules inactive or not present.',
    option.requiresUserReview ? 'Manual review warning required.' : 'No manual review warning required.',
  ]
}
