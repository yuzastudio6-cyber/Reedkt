import type {
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefExportSettingsFormState,
  ProjectEditBriefExportSettingsPanelModel,
  ProjectEditBriefExportSettingsPresetId,
  ProjectEditBriefExportSettingsValidationResult,
} from '../types/project-edit-brief-export-settings'
import type {
  ProfessionalExportAspectRatio,
  ProfessionalExportProfileId,
} from '../types/professional-export'
import type { ProjectEditBriefApiClient } from './project-edit-brief-api-client'
import {
  getProjectEditSessionExportSettingsViaApi,
  recommendProjectEditSessionExportSettingsViaApi,
  updateProjectEditSessionExportSettingsViaApi,
} from './project-edit-brief-api-client-adapter'
import {
  PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS,
  PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  getProjectEditBriefExportPresetDefinition,
  inferProjectEditBriefExportResolutionProfile,
  recommendProjectEditBriefExportSettings,
  validateProjectEditBriefExportSettings,
} from './project-edit-brief-export-settings-rules'
import { resolveProfessionalExportFrame } from './professional-export-policy'

export const PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BOUNDARY =
  'Export settings are session-level mock/local metadata. The initial edit estimate uses the 4K ceiling, so covered 1080p, 2K, and 4K selections do not create a second export estimate or charge. No render/export started, no media probing, no file bytes, no URL fetch, no Supabase command, no worker, no provider, and no credits.'

function createFallbackSettings(input: {
  projectId: string
  editSessionId: string
  presetId?: ProjectEditBriefExportSettingsPresetId
}): ProjectEditSessionExportSettingsRecord {
  return recommendProjectEditBriefExportSettings({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    presetId: input.presetId,
    source: 'session_platform_metadata',
  }).exportSettings
}

export function createProjectEditBriefExportSettingsFormState(
  settings: ProjectEditSessionExportSettingsRecord,
): ProjectEditBriefExportSettingsFormState {
  return {
    exportSettingsId: settings.id,
    projectId: settings.projectId,
    editSessionId: settings.editSessionId,
    presetId: settings.deliveryPreset,
    platformTarget: settings.platformTarget,
    aspectRatio: settings.aspectRatio,
    customAspectRatio: settings.customAspectRatio,
    resolutionWidth: settings.resolution.width,
    resolutionHeight: settings.resolution.height,
    resolutionProfileId: settings.resolutionProfileId
      ?? inferProjectEditBriefExportResolutionProfile(settings),
    frameRate: settings.frameRate,
    format: settings.format,
    codec: settings.codec,
    audioCodec: settings.audioCodec,
    audioLoudnessTarget: settings.audioLoudnessTarget ?? '-14 LUFS mock target',
    captionSafeArea: settings.captionSafeArea,
    safeZonePreset: settings.safeZonePreset ?? 'mock-safe-zone-standard',
    deliveryPreset: settings.deliveryPreset,
    summary: settings.summary,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  }
}

export function applyProjectEditBriefExportPresetToForm(
  form: ProjectEditBriefExportSettingsFormState,
  presetId: ProjectEditBriefExportSettingsPresetId,
): ProjectEditBriefExportSettingsFormState {
  const preset = getProjectEditBriefExportPresetDefinition(presetId)
  const resolutionProfileId = form.resolutionProfileId === 'custom'
    ? 'uhd_2160'
    : form.resolutionProfileId
  const frame = preset.aspectRatio === 'custom'
    ? undefined
    : resolveProfessionalExportFrame(preset.aspectRatio as ProfessionalExportAspectRatio, resolutionProfileId)
  return {
    ...form,
    presetId,
    platformTarget: preset.platformTargets[0] ?? form.platformTarget,
    aspectRatio: preset.aspectRatio,
    customAspectRatio: preset.aspectRatio === 'custom'
      ? form.customAspectRatio ?? { width: preset.resolution.width, height: preset.resolution.height }
      : undefined,
    resolutionWidth: frame?.width ?? preset.resolution.width,
    resolutionHeight: frame?.height ?? preset.resolution.height,
    resolutionProfileId: frame ? resolutionProfileId : 'custom',
    frameRate: preset.frameRate,
    format: preset.format,
    codec: preset.codec,
    audioCodec: preset.audioCodec,
    captionSafeArea: preset.captionSafeArea,
    safeZonePreset: preset.safeZonePreset,
    deliveryPreset: preset.deliveryPreset,
    summary: `${preset.displayName} selected as mock export metadata. No render/export or additional credit charge started.`,
  }
}

export function applyProjectEditBriefExportResolutionProfileToForm(
  form: ProjectEditBriefExportSettingsFormState,
  resolutionProfileId: ProfessionalExportProfileId,
): ProjectEditBriefExportSettingsFormState {
  if (form.aspectRatio === 'custom') return form
  const frame = resolveProfessionalExportFrame(
    form.aspectRatio as ProfessionalExportAspectRatio,
    resolutionProfileId,
  )
  return {
    ...form,
    resolutionWidth: frame.width,
    resolutionHeight: frame.height,
    resolutionProfileId,
    summary: `${frame.label} selected within the initial 4K edit-estimate ceiling. No second export estimate or charge started.`,
  }
}

export function createProjectEditBriefExportSettingsRecordFromForm(
  form: ProjectEditBriefExportSettingsFormState,
  existing?: ProjectEditSessionExportSettingsRecord,
): ProjectEditSessionExportSettingsRecord {
  const timestamp = new Date().toISOString()
  const resolution = {
    width: Number(form.resolutionWidth),
    height: Number(form.resolutionHeight),
  }
  const resolutionProfileId = inferProjectEditBriefExportResolutionProfile({
    aspectRatio: form.aspectRatio,
    resolution,
  })
  return {
    id: form.exportSettingsId ?? existing?.id ?? `project-edit-session-export-settings-${form.editSessionId}`,
    projectId: form.projectId,
    editSessionId: form.editSessionId,
    source: 'user_override_mock',
    platformTarget: form.platformTarget,
    aspectRatio: form.aspectRatio,
    customAspectRatio: form.aspectRatio === 'custom'
      ? form.customAspectRatio ?? { width: form.resolutionWidth, height: form.resolutionHeight }
      : undefined,
    resolution,
    resolutionProfileId,
    frameRate: form.frameRate,
    format: form.format,
    codec: form.codec,
    audioCodec: form.audioCodec,
    audioLoudnessTarget: form.audioLoudnessTarget,
    captionSafeArea: form.captionSafeArea,
    safeZonePreset: form.safeZonePreset,
    deliveryPreset: form.deliveryPreset,
    summary: form.summary || 'Mock export settings updated from Edit Brief. No render/export started.',
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    mockOnly: true,
    metadata: {
      ...(existing?.metadata ?? {}),
      editedFromBrief: true,
      noRenderStarted: true,
      noExportJobCreated: true,
      fileBytesRead: false,
      externalUrlFetched: false,
      mediaProcessingStarted: false,
      professionalResolutionProfileId: resolutionProfileId,
      initialEstimateUses4kCeiling: true,
      exportRequiresSecondEstimate: false,
      exportAllowsAdditionalCharge: false,
    },
  }
}

export function validateProjectEditBriefExportSettingsForm(
  form: ProjectEditBriefExportSettingsFormState,
): ProjectEditBriefExportSettingsValidationResult {
  return validateProjectEditBriefExportSettings(createProjectEditBriefExportSettingsRecordFromForm(form))
}

export function createProjectEditBriefExportSettingsPanelModel(
  settings: ProjectEditSessionExportSettingsRecord,
  mode: ProjectEditBriefExportSettingsPanelModel['mode'] = settings.source === 'user_override_mock' ? 'saved_mock' : 'recommendation',
): ProjectEditBriefExportSettingsPanelModel {
  const form = createProjectEditBriefExportSettingsFormState(settings)
  return {
    title: 'Export Settings',
    mode,
    settings,
    form,
    presetOptions: PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS,
    recommendedPresetLabel: getProjectEditBriefExportPresetDefinition(settings.deliveryPreset).displayName,
    boundarySummary: PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BOUNDARY,
    canSaveMockMetadata: true,
    canStartRender: false,
    canStartExport: false,
    warnings: [
      'Export Settings are ProjectEditSession-owned and shown inside Brief for convenience.',
      '1080p, 2K, and 4K are covered by the initial 4K edit-estimate ceiling for the same approved deliverable.',
      'Saving updates mock metadata only. No render/export starts.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  }
}

export async function loadProjectEditBriefExportSettingsPanelForUI(input: {
  projectId: string
  editSessionId: string
  client?: ProjectEditBriefApiClient
}): Promise<ProjectEditBriefExportSettingsPanelModel> {
  const current = await getProjectEditSessionExportSettingsViaApi(input.editSessionId, input.client)
  if (current.exportSettings) {
    return createProjectEditBriefExportSettingsPanelModel(current.exportSettings)
  }
  const recommended = await recommendProjectEditSessionExportSettingsViaApi({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  }, input.client)
  return createProjectEditBriefExportSettingsPanelModel(
    recommended.exportSettings ?? createFallbackSettings(input),
  )
}

export async function recommendProjectEditBriefExportSettingsForUI(input: {
  projectId: string
  editSessionId: string
  presetId?: ProjectEditBriefExportSettingsPresetId
  client?: ProjectEditBriefApiClient
}): Promise<ProjectEditSessionExportSettingsRecord> {
  const response = await recommendProjectEditSessionExportSettingsViaApi({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    presetId: input.presetId,
  }, input.client)
  return response.exportSettings ?? createFallbackSettings(input)
}

export async function saveProjectEditBriefExportSettingsFormViaApi(
  form: ProjectEditBriefExportSettingsFormState,
  client?: ProjectEditBriefApiClient,
): Promise<{
  exportSettings?: ProjectEditSessionExportSettingsRecord
  validation: ProjectEditBriefExportSettingsValidationResult
  summary: string
}> {
  const exportSettings = createProjectEditBriefExportSettingsRecordFromForm(form)
  const validation = validateProjectEditBriefExportSettings(exportSettings)
  if (!validation.ok) {
    return {
      validation,
      summary: validation.blockedReasons.join(' '),
    }
  }
  const response = await updateProjectEditSessionExportSettingsViaApi({
    editSessionId: form.editSessionId,
    exportSettingsId: form.exportSettingsId,
    patch: exportSettings,
  }, client)
  return {
    exportSettings: response.exportSettings,
    validation,
    summary: response.exportSettings
      ? 'Export settings saved as mock/local metadata. No render/export started.'
      : 'Export settings save failed safely without production side effects.',
  }
}
