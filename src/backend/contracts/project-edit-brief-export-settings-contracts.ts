import type { ProjectEditSessionExportSettingsRecord } from '../../types/project-edit-brief'
import type {
  ProjectEditBriefExportSettingsFormState,
  ProjectEditBriefExportSettingsPanelModel,
  ProjectEditBriefExportSettingsPresetDefinition,
  ProjectEditBriefExportSettingsPresetId,
  ProjectEditBriefExportSettingsRecommendationInput,
  ProjectEditBriefExportSettingsRecommendationResult,
  ProjectEditBriefExportSettingsSafetyFlags,
  ProjectEditBriefExportSettingsValidationResult,
} from '../../types/project-edit-brief-export-settings'

export interface ListProjectEditBriefExportSettingsPresetsRequest {
  mockOnly: true
}

export interface ListProjectEditBriefExportSettingsPresetsResponse extends ProjectEditBriefExportSettingsSafetyFlags {
  presets: ProjectEditBriefExportSettingsPresetDefinition[]
  mockOnly: true
}

export type RecommendProjectEditBriefExportSettingsRequest = ProjectEditBriefExportSettingsRecommendationInput

export interface RecommendProjectEditBriefExportSettingsResponse extends ProjectEditBriefExportSettingsSafetyFlags {
  recommendation: ProjectEditBriefExportSettingsRecommendationResult
  exportSettings: ProjectEditSessionExportSettingsRecord
  mockOnly: true
}

export interface ValidateProjectEditBriefExportSettingsRequest {
  exportSettings: ProjectEditSessionExportSettingsRecord
}

export interface ValidateProjectEditBriefExportSettingsResponse extends ProjectEditBriefExportSettingsSafetyFlags {
  validation: ProjectEditBriefExportSettingsValidationResult
  mockOnly: true
}

export interface BuildProjectEditBriefExportSettingsPanelRequest {
  editSessionId: string
  projectId: string
  presetId?: ProjectEditBriefExportSettingsPresetId
}

export interface BuildProjectEditBriefExportSettingsPanelResponse extends ProjectEditBriefExportSettingsSafetyFlags {
  panel: ProjectEditBriefExportSettingsPanelModel
  mockOnly: true
}

export interface SaveProjectEditBriefExportSettingsFormRequest {
  form: ProjectEditBriefExportSettingsFormState
}

export interface SaveProjectEditBriefExportSettingsFormResponse extends ProjectEditBriefExportSettingsSafetyFlags {
  exportSettings?: ProjectEditSessionExportSettingsRecord
  validation: ProjectEditBriefExportSettingsValidationResult
  mockOnly: true
}

export interface CreateProjectEditBriefExportSettingsSummaryRequest {
  exportSettings: ProjectEditSessionExportSettingsRecord
}

export interface CreateProjectEditBriefExportSettingsSummaryResponse extends ProjectEditBriefExportSettingsSafetyFlags {
  readableSummary: string
  readinessSummary: string
  mockOnly: true
}
