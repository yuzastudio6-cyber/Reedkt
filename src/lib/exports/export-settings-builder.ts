import type {
  ExportSettings,
  ExportTarget,
  ExportTargetPlatform,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type BuildDefaultExportSettingsInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  sourcePreviewId?: string
  sourcePreviewVersion?: number
  sourceEditDocumentId?: string
  sourceEditVersion?: number
  targetPlatforms?: ExportTargetPlatform[]
}

const targetDefaults: Array<Omit<ExportTarget, 'id'>> = [
  {
    platform: 'tiktok',
    label: 'TikTok',
    enabled: true,
    aspectRatio: '9:16',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'high',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'instagram_reels',
    label: 'Instagram Reels',
    enabled: true,
    aspectRatio: '9:16',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'high',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'youtube_shorts',
    label: 'YouTube Shorts',
    enabled: false,
    aspectRatio: '9:16',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'high',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    enabled: false,
    aspectRatio: '16:9',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'high',
    captionMode: 'sidecar',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    enabled: false,
    aspectRatio: '4:5',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'standard',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    enabled: false,
    aspectRatio: '1:1',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'standard',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'x',
    label: 'X',
    enabled: false,
    aspectRatio: '16:9',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'standard',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'website',
    label: 'Website',
    enabled: false,
    aspectRatio: '16:9',
    resolution: '1080p',
    fileFormat: 'mp4',
    quality: 'high',
    captionMode: 'sidecar',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  },
  {
    platform: 'custom',
    label: 'Custom',
    enabled: false,
    aspectRatio: 'custom',
    resolution: 'custom',
    fileFormat: 'mp4',
    quality: 'high',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
    notes: 'Custom internal export target. Public delivery files are not created in rehearsal.',
  },
]

function targetId(projectId: string, platform: ExportTargetPlatform) {
  return `${projectId}-export-target-${platform}`
}

export function buildDefaultExportSettings({
  projectId,
  sourceEditDocumentId,
  sourceEditVersion,
  sourcePreviewId,
  sourcePreviewVersion,
  targetPlatforms,
  userId,
  workspaceId,
}: BuildDefaultExportSettingsInput): ExportSettings {
  const allowedPlatforms = targetPlatforms ? new Set(targetPlatforms) : null
  const targets = targetDefaults
    .filter((target) => !allowedPlatforms || allowedPlatforms.has(target.platform))
    .map((target) => ({
      ...target,
      id: targetId(projectId, target.platform),
    }))

  return {
    id: `${projectId}-export-settings`,
    projectId,
    workspaceId,
    userId,
    sourcePreviewId,
    sourcePreviewVersion,
    sourceEditDocumentId,
    sourceEditVersion,
    targets,
    defaultQuality: 'high',
    defaultFileFormat: 'mp4',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function updateExportTarget(settings: ExportSettings, targetIdValue: string, patch: Partial<ExportTarget>): ExportSettings {
  return {
    ...settings,
    targets: settings.targets.map((target) =>
      target.id === targetIdValue
        ? { ...target, ...patch, id: target.id, platform: target.platform }
        : target,
    ),
    updatedAt: MOCK_CREATED_AT,
  }
}

export function toggleExportTarget(settings: ExportSettings, targetIdValue: string, enabled: boolean): ExportSettings {
  return updateExportTarget(settings, targetIdValue, { enabled })
}

export function getEnabledExportTargets(settings: ExportSettings): ExportTarget[] {
  return settings.targets.filter((target) => target.enabled)
}

export function summarizeExportTargets(settings: ExportSettings) {
  const enabledTargets = getEnabledExportTargets(settings)
  if (!enabledTargets.length) return 'No export targets enabled.'
  return `${enabledTargets.length} target${enabledTargets.length === 1 ? '' : 's'} enabled: ${enabledTargets.map((target) => target.label).join(', ')}.`
}
