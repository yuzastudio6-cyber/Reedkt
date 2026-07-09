import {
  NEW_EDIT_SESSION_PREFERENCE_OPTIONS,
  type NewEditSessionFormState,
  type NewEditSessionPreferenceChoiceId,
} from './project-edit-session-create-flow-ui-adapter'

export const PROJECT_EDIT_DEFAULT_PREFERENCES_STORAGE_KEY = 'reeditpro:clean-edit-default-preferences:v1'

export interface ProjectEditDefaultPreferenceSettings {
  preferenceChoiceId: NewEditSessionPreferenceChoiceId
  preferenceNote: string
  source: 'preferences_page' | 'default'
  updatedAt?: string
}

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>

function browserStorage(): PreferenceStorage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function supportedPreferenceChoice(value: unknown): NewEditSessionPreferenceChoiceId {
  return NEW_EDIT_SESSION_PREFERENCE_OPTIONS.some((option) => option.id === value)
    ? value as NewEditSessionPreferenceChoiceId
    : 'none'
}

function cleanPreferenceNote(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, 240)
    : ''
}

export function createDefaultProjectEditPreferenceSettings(): ProjectEditDefaultPreferenceSettings {
  return {
    preferenceChoiceId: 'none',
    preferenceNote: 'Clean pacing, readable captions, natural sound, and no flashy transitions unless the edit asks for it.',
    source: 'default',
  }
}

export function readProjectEditDefaultPreferenceSettings(
  storage: PreferenceStorage | undefined = browserStorage(),
): ProjectEditDefaultPreferenceSettings {
  const fallback = createDefaultProjectEditPreferenceSettings()
  if (!storage) return fallback

  try {
    const raw = storage.getItem(PROJECT_EDIT_DEFAULT_PREFERENCES_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<ProjectEditDefaultPreferenceSettings>
    return {
      preferenceChoiceId: supportedPreferenceChoice(parsed.preferenceChoiceId),
      preferenceNote: cleanPreferenceNote(parsed.preferenceNote) || fallback.preferenceNote,
      source: parsed.source === 'preferences_page' ? 'preferences_page' : 'default',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
    }
  } catch {
    return fallback
  }
}

export function saveProjectEditDefaultPreferenceSettings(input: {
  preferenceChoiceId: NewEditSessionPreferenceChoiceId
  preferenceNote: string
  storage?: PreferenceStorage
  now?: string
}): ProjectEditDefaultPreferenceSettings {
  const settings: ProjectEditDefaultPreferenceSettings = {
    preferenceChoiceId: supportedPreferenceChoice(input.preferenceChoiceId),
    preferenceNote: cleanPreferenceNote(input.preferenceNote),
    source: 'preferences_page',
    updatedAt: input.now ?? new Date().toISOString(),
  }
  const storage = input.storage ?? browserStorage()
  if (storage) {
    storage.setItem(PROJECT_EDIT_DEFAULT_PREFERENCES_STORAGE_KEY, JSON.stringify(settings))
  }
  return settings
}

export function applyProjectEditDefaultPreferenceToNewEditForm(
  form: NewEditSessionFormState,
  settings: ProjectEditDefaultPreferenceSettings = readProjectEditDefaultPreferenceSettings(),
): NewEditSessionFormState {
  return {
    ...form,
    preferenceChoiceId: settings.preferenceChoiceId,
    preferenceNote: settings.preferenceNote,
  }
}
