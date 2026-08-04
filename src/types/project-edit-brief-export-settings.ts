import type {
  ProjectEditSessionExportAspectRatio,
  ProjectEditSessionExportFormat,
  ProjectEditSessionExportPreset,
  ProjectEditSessionExportSettingsRecord,
} from './project-edit-brief'
import type { ProjectEditSessionPlatformTarget } from './project-edit-session'
import type { ProfessionalExportProfileId } from './professional-export'

export type ProjectEditBriefExportSettingsPresetId = ProjectEditSessionExportPreset

export type ProjectEditBriefExportSettingsRecommendationSource =
  | 'session_platform_metadata'
  | 'session_aspect_metadata'
  | 'existing_export_settings'
  | 'manual_preset_override'
  | 'custom_mock_metadata'
  | 'browser_source_video_metadata'

export type ProjectEditBriefExportSettingsRecommendationStatus =
  | 'recommended_mock'
  | 'user_override_mock'
  | 'custom_preserved_mock'
  | 'blocked_invalid_settings'
  | 'failed_validation'

export type ProjectEditBriefExportSettingsPanelMode =
  | 'recommendation'
  | 'editing'
  | 'saved_mock'
  | 'validation_error'

export interface ProjectEditBriefExportSettingsSafetyFlags {
  providerCallMade: false
  modelCallMade: false
  supabaseReadMade: false
  supabaseWriteMade: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  exportJobCreated: false
  creditReservedOrSpent: false
}

export interface ProjectEditBriefExportSettingsPresetDefinition extends ProjectEditBriefExportSettingsSafetyFlags {
  presetId: ProjectEditBriefExportSettingsPresetId
  displayName: string
  platformTargets: ProjectEditSessionPlatformTarget[]
  aspectRatio: ProjectEditSessionExportAspectRatio
  resolution: { width: number; height: number }
  legacyResolutionProfileId: ProfessionalExportProfileId
  frameRate: ProjectEditSessionExportSettingsRecord['frameRate']
  format: ProjectEditSessionExportFormat
  codec: ProjectEditSessionExportSettingsRecord['codec']
  audioCodec: ProjectEditSessionExportSettingsRecord['audioCodec']
  captionSafeArea: boolean
  safeZonePreset: string
  deliveryPreset: ProjectEditSessionExportPreset
  notes: string[]
  mockOnly: true
}

export interface ProjectEditBriefExportSettingsRecommendationInput {
  projectId: string
  editSessionId: string
  platformTarget?: ProjectEditSessionPlatformTarget
  aspectRatio?: ProjectEditSessionExportAspectRatio
  customAspectRatio?: ProjectEditSessionExportSettingsRecord['customAspectRatio']
  resolutionProfileId?: ProfessionalExportProfileId | 'custom'
  sourceResolution?: ProjectEditSessionExportSettingsRecord['resolution']
  presetId?: ProjectEditBriefExportSettingsPresetId
  existingSettings?: ProjectEditSessionExportSettingsRecord
  source?: ProjectEditBriefExportSettingsRecommendationSource
  createdAt?: string
  id?: string
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefExportSettingsRecommendationResult extends ProjectEditBriefExportSettingsSafetyFlags {
  status: ProjectEditBriefExportSettingsRecommendationStatus
  preset: ProjectEditBriefExportSettingsPresetDefinition
  exportSettings: ProjectEditSessionExportSettingsRecord
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefExportSettingsFormState extends ProjectEditBriefExportSettingsSafetyFlags {
  exportSettingsId?: string
  projectId: string
  editSessionId: string
  presetId: ProjectEditBriefExportSettingsPresetId
  platformTarget: ProjectEditSessionPlatformTarget
  aspectRatio: ProjectEditSessionExportAspectRatio
  customAspectRatio?: ProjectEditSessionExportSettingsRecord['customAspectRatio']
  resolutionWidth: number
  resolutionHeight: number
  resolutionProfileId: ProfessionalExportProfileId | 'custom'
  frameRate: ProjectEditSessionExportSettingsRecord['frameRate']
  format: ProjectEditSessionExportFormat
  codec: ProjectEditSessionExportSettingsRecord['codec']
  audioCodec: ProjectEditSessionExportSettingsRecord['audioCodec']
  audioLoudnessTarget: string
  captionSafeArea: boolean
  safeZonePreset: string
  deliveryPreset: ProjectEditSessionExportPreset
  summary: string
  mockOnly: true
}

export interface ProjectEditBriefExportSettingsPanelModel extends ProjectEditBriefExportSettingsSafetyFlags {
  title: string
  mode: ProjectEditBriefExportSettingsPanelMode
  settings?: ProjectEditSessionExportSettingsRecord
  form: ProjectEditBriefExportSettingsFormState
  presetOptions: ProjectEditBriefExportSettingsPresetDefinition[]
  recommendedPresetLabel: string
  boundarySummary: string
  canSaveMockMetadata: boolean
  canStartRender: false
  canStartExport: false
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefExportSettingsValidationResult extends ProjectEditBriefExportSettingsSafetyFlags {
  ok: boolean
  blocked: boolean
  status: ProjectEditBriefExportSettingsRecommendationStatus
  blockedReasons: string[]
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefExportSettingsScenario extends ProjectEditBriefExportSettingsSafetyFlags {
  id: string
  title: string
  expectedPreset: ProjectEditBriefExportSettingsPresetId
  source: ProjectEditBriefExportSettingsRecommendationSource
  status: ProjectEditBriefExportSettingsRecommendationStatus
  mockOnly: true
}

export interface ProjectEditBriefExportSettingsOrchestratorResult extends ProjectEditBriefExportSettingsSafetyFlags {
  ok: boolean
  scenarioCount: number
  recommendation?: ProjectEditBriefExportSettingsRecommendationResult
  validation?: ProjectEditBriefExportSettingsValidationResult
  readableSummary: string
  readinessSummary: string
  nextStep: 'RP-EDITBRIEF-10 — Marker QA + Conflict Detection'
  mockOnly: true
}

export const REEDITPRO_PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_RULE =
  'Project Edit Brief Export Settings are ProjectEditSession-owned mock metadata exposed inside Brief for planning only.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_NO_RENDER_RULE =
  'Export Settings recommendation and editing must not start render, export, progress, worker, provider, media, storage, Supabase, or credit activity.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SESSION_OWNED_RULE =
  'Edit Brief may display and update ProjectEditSession export settings, but it does not own durable export execution state.'
