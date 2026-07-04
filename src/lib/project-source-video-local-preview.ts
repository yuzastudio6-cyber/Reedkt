import {
  PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_SAFETY_FLAGS,
  REEDITPRO_PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_RULE,
  REEDITPRO_PROJECT_SOURCE_VIDEO_NO_BACKEND_BYTES_RULE,
  type ProjectSourceVideoLocalPreview,
} from '../types/project-source-video'

export function isBrowserVideoMimeTypeAllowed(mimeType: string | undefined): boolean {
  return Boolean(mimeType?.toLowerCase().startsWith('video/'))
}

export function createProjectSourceVideoBoundarySummary(): string {
  return `${REEDITPRO_PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_RULE} ${REEDITPRO_PROJECT_SOURCE_VIDEO_NO_BACKEND_BYTES_RULE}`
}

export function createProjectSourceVideoLocalPreviewFromFile(file: File): ProjectSourceVideoLocalPreview {
  if (!isBrowserVideoMimeTypeAllowed(file.type)) {
    throw new Error('Select a browser-supported video file for local preview.')
  }
  return {
    id: `project-source-video-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    objectUrl: URL.createObjectURL(file),
    mimeType: file.type,
    sizeBytes: file.size,
    metadataLoaded: false,
    createdAt: new Date().toISOString(),
    ...PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_SAFETY_FLAGS,
  }
}

export function revokeProjectSourceVideoLocalPreview(preview: Pick<ProjectSourceVideoLocalPreview, 'objectUrl'> | undefined): void {
  if (!preview?.objectUrl) return
  URL.revokeObjectURL(preview.objectUrl)
}
