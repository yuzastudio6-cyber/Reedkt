import type {
  ProjectEditSessionExportAspectRatio,
  ProjectEditSessionExportPreset,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import type { ProjectEditSessionPlatformTarget } from '../types/project-edit-session'
import type {
  ProjectEditBriefExportSettingsPresetDefinition,
  ProjectEditBriefExportSettingsPresetId,
  ProjectEditBriefExportSettingsRecommendationInput,
  ProjectEditBriefExportSettingsRecommendationResult,
  ProjectEditBriefExportSettingsSafetyFlags,
  ProjectEditBriefExportSettingsValidationResult,
} from '../types/project-edit-brief-export-settings'
import {
  PROFESSIONAL_EXPORT_ASPECT_RATIOS,
  PROFESSIONAL_EXPORT_PROFILE_IDS,
  type ProfessionalExportAspectRatio,
  type ProfessionalExportProfileId,
} from '../types/professional-export'
import { resolveProfessionalExportFrame } from './professional-export-policy'

export const PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS: ProjectEditBriefExportSettingsSafetyFlags = {
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

const DEFAULT_AUDIO_LOUDNESS = '-14 LUFS mock target'

export const PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS: ProjectEditBriefExportSettingsPresetDefinition[] = [
  {
    presetId: 'instagram_reel_1080x1920',
    displayName: 'Instagram Reel 1080x1920',
    platformTargets: ['instagram_reel'],
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-short-form',
    deliveryPreset: 'instagram_reel_1080x1920',
    notes: ['Short-form vertical recommendation.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
  {
    presetId: 'tiktok_1080x1920',
    displayName: 'TikTok 1080x1920',
    platformTargets: ['tiktok_reel'],
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-short-form',
    deliveryPreset: 'tiktok_1080x1920',
    notes: ['Vertical TikTok mock preset.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
  {
    presetId: 'youtube_shorts_1080x1920',
    displayName: 'YouTube Shorts 1080x1920',
    platformTargets: ['youtube_shorts'],
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-short-form',
    deliveryPreset: 'youtube_shorts_1080x1920',
    notes: ['Vertical Shorts recommendation.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
  {
    presetId: 'youtube_standard_1920x1080',
    displayName: 'YouTube Standard 1920x1080',
    platformTargets: ['youtube_standard'],
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-standard',
    deliveryPreset: 'youtube_standard_1920x1080',
    notes: ['Standard landscape recommendation.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
  {
    presetId: 'instagram_feed_square_1080x1080',
    displayName: 'Square Feed 1080x1080',
    platformTargets: ['instagram_feed', 'ad_creative'],
    aspectRatio: '1:1',
    resolution: { width: 1080, height: 1080 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-square',
    deliveryPreset: 'instagram_feed_square_1080x1080',
    notes: ['Square social feed mock preset.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
  {
    presetId: 'instagram_feed_4x5_1080x1350',
    displayName: 'Social Feed 4x5 1080x1350',
    platformTargets: ['instagram_feed', 'ad_creative'],
    aspectRatio: '4:5',
    resolution: { width: 1080, height: 1350 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-4x5',
    deliveryPreset: 'instagram_feed_4x5_1080x1350',
    notes: ['Tall social feed mock preset.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
  {
    presetId: 'website_1920x1080',
    displayName: 'Website/Internal Review 1920x1080',
    platformTargets: ['website', 'internal_review', 'linkedin', 'podcast_clip'],
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-standard',
    deliveryPreset: 'website_1920x1080',
    notes: ['Landscape web and internal review mock preset.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
  {
    presetId: 'custom',
    displayName: 'Custom Mock Metadata',
    platformTargets: ['custom'],
    aspectRatio: 'custom',
    resolution: { width: 1080, height: 1080 },
    legacyResolutionProfileId: 'hd_1080',
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-custom',
    deliveryPreset: 'custom',
    notes: ['Custom ratio is preserved as metadata only.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  },
]

export function getProjectEditBriefExportPresetDefinition(
  presetId: ProjectEditBriefExportSettingsPresetId | undefined,
): ProjectEditBriefExportSettingsPresetDefinition {
  return PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS.find((preset) => preset.presetId === presetId)
    ?? PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS[0]
}

function defaultPlatformForPreset(preset: ProjectEditBriefExportSettingsPresetDefinition): ProjectEditSessionPlatformTarget {
  return preset.platformTargets[0] ?? 'custom'
}

export function resolveProjectEditBriefExportPresetId(input: {
  platformTarget?: ProjectEditSessionPlatformTarget
  aspectRatio?: ProjectEditSessionExportAspectRatio
  presetId?: ProjectEditBriefExportSettingsPresetId
}): ProjectEditBriefExportSettingsPresetId {
  if (input.presetId) return input.presetId
  if (input.platformTarget === 'tiktok_reel') return 'tiktok_1080x1920'
  if (input.platformTarget === 'youtube_shorts') return 'youtube_shorts_1080x1920'
  if (input.platformTarget === 'instagram_reel') return 'instagram_reel_1080x1920'
  if (input.platformTarget === 'youtube_standard') return 'youtube_standard_1920x1080'
  if (input.platformTarget === 'website' || input.platformTarget === 'internal_review' || input.platformTarget === 'linkedin' || input.platformTarget === 'podcast_clip') return 'website_1920x1080'
  if (input.platformTarget === 'ad_creative' && input.aspectRatio === '4:5') return 'instagram_feed_4x5_1080x1350'
  if (input.platformTarget === 'ad_creative' && input.aspectRatio === '1:1') return 'instagram_feed_square_1080x1080'
  if (input.aspectRatio === '9:16') return 'instagram_reel_1080x1920'
  if (input.aspectRatio === '16:9') return 'youtube_standard_1920x1080'
  if (input.aspectRatio === '1:1') return 'instagram_feed_square_1080x1080'
  if (input.aspectRatio === '4:5') return 'instagram_feed_4x5_1080x1350'
  return 'custom'
}

function isProfessionalAspectRatio(
  aspectRatio: ProjectEditSessionExportAspectRatio,
): aspectRatio is ProfessionalExportAspectRatio {
  return PROFESSIONAL_EXPORT_ASPECT_RATIOS.includes(aspectRatio as ProfessionalExportAspectRatio)
}

export function inferProjectEditBriefExportResolutionProfile(input: {
  aspectRatio: ProjectEditSessionExportAspectRatio
  resolution: ProjectEditSessionExportSettingsRecord['resolution']
}): ProfessionalExportProfileId | 'custom' {
  if (!isProfessionalAspectRatio(input.aspectRatio)) return 'custom'
  for (const profileId of PROFESSIONAL_EXPORT_PROFILE_IDS) {
    const frame = resolveProfessionalExportFrame(input.aspectRatio, profileId)
    if (frame.width === input.resolution.width && frame.height === input.resolution.height) return profileId
  }
  return 'custom'
}

function resolveRecommendationResolution(input: {
  recommendation: ProjectEditBriefExportSettingsRecommendationInput
  aspectRatio: ProjectEditSessionExportAspectRatio
  preset: ProjectEditBriefExportSettingsPresetDefinition
}): {
  resolution: ProjectEditSessionExportSettingsRecord['resolution']
  resolutionProfileId: ProfessionalExportProfileId | 'custom'
} {
  const { recommendation, aspectRatio, preset } = input
  if (recommendation.sourceResolution) {
    return {
      resolution: recommendation.sourceResolution,
      resolutionProfileId: isProfessionalAspectRatio(aspectRatio)
        ? recommendation.resolutionProfileId
          ?? inferProjectEditBriefExportResolutionProfile({ aspectRatio, resolution: recommendation.sourceResolution })
        : 'custom',
    }
  }
  if (!isProfessionalAspectRatio(aspectRatio)) {
    return {
      resolution: recommendation.existingSettings?.resolution ?? preset.resolution,
      resolutionProfileId: 'custom',
    }
  }
  const existingProfile = recommendation.existingSettings
    ? recommendation.existingSettings.resolutionProfileId
      ?? inferProjectEditBriefExportResolutionProfile(recommendation.existingSettings)
    : undefined
  const resolutionProfileId = recommendation.resolutionProfileId
    ?? (existingProfile === 'custom' ? undefined : existingProfile)
    ?? 'uhd_2160'
  if (resolutionProfileId === 'custom') {
    return {
      resolution: recommendation.existingSettings?.resolution ?? preset.resolution,
      resolutionProfileId,
    }
  }
  const frame = resolveProfessionalExportFrame(aspectRatio, resolutionProfileId)
  return {
    resolution: { width: frame.width, height: frame.height },
    resolutionProfileId,
  }
}

export function recommendProjectEditBriefExportSettings(
  input: ProjectEditBriefExportSettingsRecommendationInput,
): ProjectEditBriefExportSettingsRecommendationResult {
  const timestamp = input.createdAt ?? new Date().toISOString()
  const preset = getProjectEditBriefExportPresetDefinition(resolveProjectEditBriefExportPresetId(input))
  const platformTarget = input.platformTarget ?? input.existingSettings?.platformTarget ?? defaultPlatformForPreset(preset)
  const aspectRatio = input.aspectRatio ?? input.existingSettings?.aspectRatio ?? preset.aspectRatio
  const { resolution, resolutionProfileId } = resolveRecommendationResolution({
    recommendation: input,
    aspectRatio,
    preset,
  })
  const deliveryPreset: ProjectEditSessionExportPreset = preset.deliveryPreset
  const exportSettings: ProjectEditSessionExportSettingsRecord = {
    id: input.id ?? input.existingSettings?.id ?? `project-edit-session-export-settings-${input.editSessionId}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: input.source === 'manual_preset_override' ? 'user_override_mock' : 'auto_recommended_mock',
    platformTarget,
    aspectRatio,
    customAspectRatio: aspectRatio === 'custom'
      ? input.customAspectRatio ?? input.existingSettings?.customAspectRatio ?? resolution
      : undefined,
    resolution,
    resolutionProfileId,
    frameRate: preset.frameRate,
    format: preset.format,
    codec: preset.codec,
    audioCodec: preset.audioCodec,
    audioLoudnessTarget: input.existingSettings?.audioLoudnessTarget ?? DEFAULT_AUDIO_LOUDNESS,
    captionSafeArea: preset.captionSafeArea,
    safeZonePreset: preset.safeZonePreset,
    deliveryPreset,
    summary: `${preset.displayName} with ${resolutionProfileId === 'custom' ? 'custom dimensions' : resolveProfessionalExportFrame(aspectRatio as ProfessionalExportAspectRatio, resolutionProfileId).label} recommended from mock session metadata. No render/export or additional credit charge started.`,
    createdAt: input.existingSettings?.createdAt ?? timestamp,
    updatedAt: timestamp,
    mockOnly: true,
    metadata: {
      ...input.metadata,
      ...(input.existingSettings?.metadata ?? {}),
      recommendationSource: input.source ?? 'session_platform_metadata',
      recommendedPresetId: preset.presetId,
      professionalResolutionProfileId: resolutionProfileId,
      initialEstimateUses4kCeiling: true,
      exportRequiresSecondEstimate: false,
      exportAllowsAdditionalCharge: false,
      noRenderStarted: true,
      noExportJobCreated: true,
      fileBytesRead: false,
      externalUrlFetched: false,
      mediaProcessingStarted: false,
    },
  }
  return {
    status: preset.presetId === 'custom' ? 'custom_preserved_mock' : 'recommended_mock',
    preset,
    exportSettings,
    warnings: [
      'Recommendation uses deterministic mock metadata only.',
      'The initial edit estimate uses the 4K UHD ceiling; selecting a covered 1080p, 2K, or 4K profile does not create a second export estimate or charge.',
      'No media file, source URL, probe, render, export, worker, provider, Supabase, or credit action starts.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  }
}

export function validateProjectEditBriefExportSettings(
  settings: ProjectEditSessionExportSettingsRecord,
): ProjectEditBriefExportSettingsValidationResult {
  const blockedReasons: string[] = []
  const allowedFrameRates = [24, 25, 30, 50, 60]
  const width = settings.resolution.width
  const height = settings.resolution.height
  const resolutionProfileId = settings.resolutionProfileId
    ?? inferProjectEditBriefExportResolutionProfile(settings)
  if (!settings.mockOnly) blockedReasons.push('Export settings must remain mockOnly.')
  if (!Number.isFinite(width) || width < 1 || width > 16_384) blockedReasons.push('Resolution width must be within the supported range.')
  if (!Number.isFinite(height) || height < 1 || height > 16_384) blockedReasons.push('Resolution height must be within the supported range.')
  if (Number.isFinite(width) && width % 2 !== 0) blockedReasons.push('Resolution width must be even for professional video encoding.')
  if (Number.isFinite(height) && height % 2 !== 0) blockedReasons.push('Resolution height must be even for professional video encoding.')
  if (isProfessionalAspectRatio(settings.aspectRatio) && resolutionProfileId !== 'custom') {
    const expectedFrame = resolveProfessionalExportFrame(settings.aspectRatio, resolutionProfileId)
    if (width !== expectedFrame.width || height !== expectedFrame.height) {
      blockedReasons.push(`${expectedFrame.label} must use the registered ${expectedFrame.width}x${expectedFrame.height} frame for ${settings.aspectRatio}.`)
    }
  }
  const declaredRatio = settings.aspectRatio === 'custom'
    ? settings.customAspectRatio && settings.customAspectRatio.width / settings.customAspectRatio.height
    : isProfessionalAspectRatio(settings.aspectRatio)
      ? resolveProfessionalExportFrame(settings.aspectRatio, 'uhd_2160').width / resolveProfessionalExportFrame(settings.aspectRatio, 'uhd_2160').height
      : undefined
  if (!declaredRatio || !Number.isFinite(declaredRatio)) {
    blockedReasons.push('A usable output aspect ratio is required.')
  } else if (Number.isFinite(width) && Number.isFinite(height) && Math.abs((width / height) - declaredRatio) > 0.01) {
    blockedReasons.push('Resolution dimensions must match the selected output aspect ratio.')
  }
  if (!allowedFrameRates.includes(settings.frameRate)) blockedReasons.push('Frame rate must use an approved mock value.')
  if (settings.format !== 'mp4') blockedReasons.push('Only mp4 metadata is editable in RP-EDITBRIEF-09.')
  if (settings.codec !== 'h264') blockedReasons.push('Only h264 metadata is editable in RP-EDITBRIEF-09.')
  if (settings.audioCodec !== 'aac') blockedReasons.push('Only aac metadata is editable in RP-EDITBRIEF-09.')
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    status: blockedReasons.length ? 'blocked_invalid_settings' : settings.source === 'user_override_mock' ? 'user_override_mock' : 'recommended_mock',
    blockedReasons,
    warnings: ['Validation is local and does not probe media or start export.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  }
}
