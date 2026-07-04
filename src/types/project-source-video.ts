import type { ProjectEditSessionExportAspectRatio } from './project-edit-brief'

export type ProjectSourceVideoInferredAspectRatio = ProjectEditSessionExportAspectRatio

export interface ProjectSourceVideoSafetyFlags {
  localOnly: true
  uploaded: false
  fileBytesReadByBackend: false
  mediaProcessingStarted: false
  workerJobCreated: false
  providerCallMade: false
  renderJobCreated: false
  exportJobCreated: false
  creditReservedOrSpent: false
  supabaseCommandRun: false
  storageWriteMade: false
  mockOnly: true
}

export interface ProjectSourceVideoLocalPreview extends ProjectSourceVideoSafetyFlags {
  id: string
  fileName: string
  objectUrl: string
  mimeType: string
  sizeBytes: number
  durationSeconds?: number
  videoWidth?: number
  videoHeight?: number
  inferredAspectRatio?: ProjectSourceVideoInferredAspectRatio
  metadataLoaded: boolean
  createdAt: string
}

export interface ProjectSourceVideoMetadataSummary {
  label: string
  durationLabel: string
  dimensionLabel: string
  aspectRatioLabel: string
  boundarySummary: string
}

export interface ProjectSourceVideoMetadataUpdate {
  durationSeconds?: number
  videoWidth?: number
  videoHeight?: number
}

export interface ProjectSourceVideoExportRecommendationMetadata extends Record<string, unknown> {
  sourceVideoFileName: string
  sourceVideoDurationSeconds?: number
  sourceVideoWidth?: number
  sourceVideoHeight?: number
  sourceVideoAspectRatio?: ProjectSourceVideoInferredAspectRatio
  sourceVideoLocalOnly: true
  sourceVideoUploaded: false
  sourceVideoFileBytesReadByBackend: false
  sourceVideoMediaProcessingStarted: false
  sourceVideoFrameRateDefaultedTo30: true
}

export const PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_SAFETY_FLAGS: ProjectSourceVideoSafetyFlags = {
  localOnly: true,
  uploaded: false,
  fileBytesReadByBackend: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  providerCallMade: false,
  renderJobCreated: false,
  exportJobCreated: false,
  creditReservedOrSpent: false,
  supabaseCommandRun: false,
  storageWriteMade: false,
  mockOnly: true,
}

export const REEDITPRO_PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_RULE =
  'Project source video preview is browser-local in RP-MEDIA-01; the file is not uploaded, processed, or persisted.'

export const REEDITPRO_PROJECT_SOURCE_VIDEO_NO_BACKEND_BYTES_RULE =
  'RP-MEDIA-01 must not read uploaded video bytes in backend/server code and must not run media workers, FFmpeg, FFprobe, render, or credits.'
