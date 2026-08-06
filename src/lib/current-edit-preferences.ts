import type {
  EditPreferenceFieldKey,
  EditPreferencePersistenceSource,
} from '../types/reeditpro'
import type {
  LocalInternalEditPreferenceBaseline,
  LocalInternalEditPreferenceValues,
  LocalInternalEditSetupSnapshot,
} from './local-project-handoff'

export const CURRENT_EDIT_PREFERENCE_KEYS = [
  'editLevel',
  'workflowType',
  'cleanupPreference',
  'visualPreference',
  'moodStyle',
  'creditPreference',
  'targetPlatform',
] as const satisfies readonly EditPreferenceFieldKey[]

export const CURRENT_EDIT_PREFERENCE_LABELS: Record<EditPreferenceFieldKey, string> = {
  editLevel: 'Edit level',
  workflowType: 'Workflow',
  cleanupPreference: 'Cleanup',
  visualPreference: 'Visual direction',
  moodStyle: 'Mood',
  creditPreference: 'Credit posture',
  targetPlatform: 'Preferred destination',
}

export type CurrentEditPreferenceChangeResolution = {
  changedFields: EditPreferenceFieldKey[]
  overrideKeys: EditPreferenceFieldKey[]
  requiresNewPlan: boolean
  requiresNewEstimate: boolean
  clearsDraftPlan: boolean
  rerunFootagePrep: boolean
  reconfirmOutputFrame: boolean
}

export function readCurrentEditPreferenceValues(
  setup: LocalInternalEditSetupSnapshot | undefined,
  fallback: LocalInternalEditPreferenceValues,
): LocalInternalEditPreferenceValues {
  return {
    editLevel: setup?.editLevel ?? fallback.editLevel,
    workflowType: setup?.workflowType ?? fallback.workflowType,
    cleanupPreference: setup?.cleanupPreference ?? fallback.cleanupPreference,
    visualPreference: setup?.visualPreference ?? fallback.visualPreference,
    moodStyle: setup?.moodStyle ?? fallback.moodStyle,
    creditPreference: setup?.creditPreference ?? fallback.creditPreference,
    targetPlatform: setup?.targetPlatform ?? fallback.targetPlatform,
  }
}

export function resolveCurrentEditPreferenceBaseline(
  setup: LocalInternalEditSetupSnapshot | undefined,
  effectiveValues: LocalInternalEditPreferenceValues,
): LocalInternalEditPreferenceBaseline {
  if (setup?.preferenceBaseline) return setup.preferenceBaseline

  return {
    ...effectiveValues,
    snapshotId: setup?.preferenceSnapshotId ?? 'legacy-edit-preference-baseline',
    capturedAt: setup?.preferenceSnapshotAppliedAt ?? new Date(0).toISOString(),
    persistenceSource: setup?.preferencePersistenceSource ?? 'browser_local_edit_preferences',
    provenance: 'legacy_edit_snapshot',
  }
}

export function getCurrentEditPreferenceOverrideKeys(
  values: LocalInternalEditPreferenceValues,
  baseline: LocalInternalEditPreferenceBaseline,
): EditPreferenceFieldKey[] {
  return CURRENT_EDIT_PREFERENCE_KEYS.filter((key) => values[key] !== baseline[key])
}

export function resolveCurrentEditPreferenceChange(
  current: LocalInternalEditPreferenceValues,
  next: LocalInternalEditPreferenceValues,
  baseline: LocalInternalEditPreferenceBaseline,
): CurrentEditPreferenceChangeResolution {
  const changedFields = CURRENT_EDIT_PREFERENCE_KEYS.filter((key) => current[key] !== next[key])
  const hasChanges = changedFields.length > 0

  return {
    changedFields,
    overrideKeys: getCurrentEditPreferenceOverrideKeys(next, baseline),
    requiresNewPlan: hasChanges,
    requiresNewEstimate: hasChanges,
    clearsDraftPlan: hasChanges,
    rerunFootagePrep: changedFields.includes('cleanupPreference'),
    reconfirmOutputFrame: changedFields.includes('targetPlatform'),
  }
}

export function preferencePersistenceLabel(source: EditPreferencePersistenceSource): string {
  return source === 'authenticated_private_internal_backend'
    ? 'Saved workspace defaults'
    : 'Saved test-workspace defaults'
}
