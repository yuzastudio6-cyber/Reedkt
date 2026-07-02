import type { ProjectEditSessionExportSettingsRecord } from '../../types/project-edit-brief'
import type {
  ProjectEditBriefExportSettingsRecommendationResult,
  ProjectEditBriefExportSettingsValidationResult,
} from '../../types/project-edit-brief-export-settings'

export function createProjectEditBriefExportSettingsReadableSummary(
  settings: ProjectEditSessionExportSettingsRecord,
): string {
  return [
    `${settings.deliveryPreset} for ${settings.platformTarget}`,
    `${settings.aspectRatio} ${settings.resolution.width}x${settings.resolution.height}`,
    `${settings.frameRate}fps ${settings.format}/${settings.codec}/${settings.audioCodec}`,
    settings.captionSafeArea ? 'caption safe area on' : 'caption safe area off',
    'mock/local metadata only; no render/export started',
  ].join(' | ')
}

export function createProjectEditBriefExportSettingsReadinessSummary(
  validation: ProjectEditBriefExportSettingsValidationResult,
): string {
  if (validation.ok) {
    return 'RP-EDITBRIEF-09 export settings are mock/local ready for Brief UI editing; production export remains blocked.'
  }
  return `RP-EDITBRIEF-09 export settings are blocked: ${validation.blockedReasons.join('; ')}`
}

export function createProjectEditBriefExportSettingsDebugSummary(
  recommendation: ProjectEditBriefExportSettingsRecommendationResult,
): string {
  return [
    `status=${recommendation.status}`,
    `preset=${recommendation.preset.presetId}`,
    `render=${recommendation.renderJobCreated}`,
    `export=${recommendation.exportJobCreated}`,
    `fileBytes=${recommendation.fileBytesRead}`,
    `mediaProcessing=${recommendation.mediaProcessingStarted}`,
  ].join(' ')
}
