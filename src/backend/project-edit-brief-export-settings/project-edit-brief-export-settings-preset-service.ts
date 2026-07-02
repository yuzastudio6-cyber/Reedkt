import {
  PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS,
  getProjectEditBriefExportPresetDefinition,
} from '../../lib/project-edit-brief-export-settings-rules'
import type {
  ProjectEditBriefExportSettingsPresetDefinition,
  ProjectEditBriefExportSettingsPresetId,
} from '../../types/project-edit-brief-export-settings'

export function listProjectEditBriefExportSettingPresets(): ProjectEditBriefExportSettingsPresetDefinition[] {
  return PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS.map((preset) => ({ ...preset }))
}

export function getProjectEditBriefExportSettingPreset(
  presetId: ProjectEditBriefExportSettingsPresetId,
): ProjectEditBriefExportSettingsPresetDefinition {
  return { ...getProjectEditBriefExportPresetDefinition(presetId) }
}
