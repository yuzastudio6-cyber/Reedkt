import {
  recommendProjectEditBriefExportSettings,
  resolveProjectEditBriefExportPresetId,
} from '../../lib/project-edit-brief-export-settings-rules'
import type {
  ProjectEditBriefExportSettingsRecommendationInput,
  ProjectEditBriefExportSettingsRecommendationResult,
  ProjectEditBriefExportSettingsPresetId,
} from '../../types/project-edit-brief-export-settings'

export function createProjectEditBriefExportSettingsRecommendation(
  input: ProjectEditBriefExportSettingsRecommendationInput,
): ProjectEditBriefExportSettingsRecommendationResult {
  return recommendProjectEditBriefExportSettings(input)
}

export function chooseProjectEditBriefExportSettingsPreset(
  input: Pick<ProjectEditBriefExportSettingsRecommendationInput, 'platformTarget' | 'aspectRatio' | 'presetId'>,
): ProjectEditBriefExportSettingsPresetId {
  return resolveProjectEditBriefExportPresetId(input)
}
