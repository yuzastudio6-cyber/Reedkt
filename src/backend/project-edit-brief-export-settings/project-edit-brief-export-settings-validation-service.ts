import { validateProjectEditBriefExportSettings } from '../../lib/project-edit-brief-export-settings-rules'
import type { ProjectEditSessionExportSettingsRecord } from '../../types/project-edit-brief'
import type {
  ProjectEditBriefExportSettingsSafetyFlags,
  ProjectEditBriefExportSettingsValidationResult,
} from '../../types/project-edit-brief-export-settings'

export const PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BACKEND_SAFETY_FLAGS: ProjectEditBriefExportSettingsSafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  exportJobCreated: false,
  creditReservedOrSpent: false,
}

export function validateProjectEditBriefExportSettingsRecord(
  settings: ProjectEditSessionExportSettingsRecord,
): ProjectEditBriefExportSettingsValidationResult {
  return validateProjectEditBriefExportSettings(settings)
}

export function validateNoProjectEditBriefExportSettingsSideEffects(
  flags: ProjectEditBriefExportSettingsSafetyFlags,
): ProjectEditBriefExportSettingsValidationResult {
  const blockedReasons = Object.entries(flags)
    .filter(([, value]) => value !== false)
    .map(([key]) => `${key} must remain false.`)
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    status: blockedReasons.length ? 'failed_validation' : 'recommended_mock',
    blockedReasons,
    warnings: ['Side-effect validation is local and report-only.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BACKEND_SAFETY_FLAGS,
  }
}
