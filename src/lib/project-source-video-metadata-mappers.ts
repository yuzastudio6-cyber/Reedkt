import type { ProjectEditSessionExportSettingsRecord } from '../types/project-edit-brief'
import type { ProjectEditBriefExportSettingsRecommendationInput } from '../types/project-edit-brief-export-settings'
import {
  REEDITPRO_PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_RULE,
  type ProjectSourceVideoExportRecommendationMetadata,
  type ProjectSourceVideoInferredAspectRatio,
  type ProjectSourceVideoLocalPreview,
  type ProjectSourceVideoMetadataSummary,
} from '../types/project-source-video'
import { formatProjectEditBriefTime } from './project-edit-brief-ui-adapter'

const RATIO_TOLERANCE = 0.075

function closeTo(value: number, target: number): boolean {
  if (!Number.isFinite(value) || value <= 0) return false
  return Math.abs(value - target) / target <= RATIO_TOLERANCE
}

export function inferProjectSourceVideoAspectRatio(input: {
  videoWidth?: number
  videoHeight?: number
}): ProjectSourceVideoInferredAspectRatio | undefined {
  const width = input.videoWidth
  const height = input.videoHeight
  if (!width || !height || width <= 0 || height <= 0) return undefined
  const ratio = width / height
  if (closeTo(ratio, 9 / 16)) return '9:16'
  if (closeTo(ratio, 16 / 9)) return '16:9'
  if (closeTo(ratio, 1)) return '1:1'
  if (closeTo(ratio, 4 / 5)) return '4:5'
  if (closeTo(ratio, 4 / 3)) return '4:3'
  return 'custom'
}

export function formatProjectSourceVideoDuration(durationSeconds: number | undefined): string {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 'Metadata pending'
  }
  return formatProjectEditBriefTime(durationSeconds)
}

export function formatProjectSourceVideoDimensions(input: {
  videoWidth?: number
  videoHeight?: number
}): string {
  if (!input.videoWidth || !input.videoHeight) return 'Metadata pending'
  return `${Math.round(input.videoWidth)}x${Math.round(input.videoHeight)}`
}

export function createProjectSourceVideoMetadataSummary(
  preview: ProjectSourceVideoLocalPreview | undefined,
): ProjectSourceVideoMetadataSummary {
  if (!preview) {
    return {
      label: 'No local source video selected',
      durationLabel: 'Mock timeline',
      dimensionLabel: 'Mock frame',
      aspectRatioLabel: 'Mock export settings',
      boundarySummary: REEDITPRO_PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_RULE,
    }
  }

  return {
    label: preview.fileName,
    durationLabel: formatProjectSourceVideoDuration(preview.durationSeconds),
    dimensionLabel: formatProjectSourceVideoDimensions(preview),
    aspectRatioLabel: preview.inferredAspectRatio ?? 'Metadata pending',
    boundarySummary: REEDITPRO_PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_RULE,
  }
}

export function createProjectSourceVideoExportRecommendationInput(input: {
  projectId: string
  editSessionId: string
  preview: ProjectSourceVideoLocalPreview
  existingSettings?: ProjectEditSessionExportSettingsRecord
}): ProjectEditBriefExportSettingsRecommendationInput | undefined {
  const aspectRatio = input.preview.inferredAspectRatio ?? inferProjectSourceVideoAspectRatio(input.preview)
  if (!aspectRatio) return undefined

  const metadata: ProjectSourceVideoExportRecommendationMetadata = {
    sourceVideoFileName: input.preview.fileName,
    sourceVideoDurationSeconds: input.preview.durationSeconds,
    sourceVideoWidth: input.preview.videoWidth,
    sourceVideoHeight: input.preview.videoHeight,
    sourceVideoAspectRatio: aspectRatio,
    sourceVideoLocalOnly: true,
    sourceVideoUploaded: false,
    sourceVideoFileBytesReadByBackend: false,
    sourceVideoMediaProcessingStarted: false,
    sourceVideoFrameRateDefaultedTo30: true,
  }

  return {
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    aspectRatio,
    customAspectRatio: aspectRatio === 'custom' && input.preview.videoWidth && input.preview.videoHeight
      ? { width: input.preview.videoWidth, height: input.preview.videoHeight }
      : undefined,
    sourceResolution: input.preview.videoWidth && input.preview.videoHeight
      ? { width: input.preview.videoWidth, height: input.preview.videoHeight }
      : undefined,
    existingSettings: input.existingSettings,
    source: 'browser_source_video_metadata',
    metadata,
  }
}
