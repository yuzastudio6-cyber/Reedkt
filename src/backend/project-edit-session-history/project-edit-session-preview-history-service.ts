import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionPreviewRecord,
} from '../../types/project-edit-session'
import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

function nowIso(): string {
  return new Date().toISOString()
}

export function createMockPreviewPlaceholder(input: {
  id?: string
  projectId: string
  editSessionId: string
  versionId?: string
  aspectRatio: ProjectEditSessionAspectRatio
}): ProjectEditSessionPreviewRecord {
  const id = input.id ?? `preview-${input.editSessionId}-${Date.now()}`
  return {
    id,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    versionId: input.versionId,
    status: 'placeholder_mock',
    thumbnailUrl: `mock://project-edit-session/${input.editSessionId}/thumbnail/${id}`,
    previewUrl: `mock://project-edit-session/${input.editSessionId}/preview/${id}`,
    aspectRatio: input.aspectRatio,
    durationSeconds: 30,
    createdAt: nowIso(),
    mockOnly: true,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-09',
      placeholderOnly: true,
      noFileCreated: true,
      noRenderStarted: true,
    },
  }
}

export function createPreviewHistoryItems(previews: ProjectEditSessionPreviewRecord[]): ProjectEditSessionHistoryTimelineItem[] {
  return previews.map((preview) => ({
    id: preview.id,
    kind: 'preview',
    title: preview.status.replace(/_/g, ' '),
    summary: preview.previewUrl ? `Mock preview placeholder available for ${preview.aspectRatio}.` : `Mock preview metadata for ${preview.aspectRatio}.`,
    createdAt: preview.createdAt,
    statusLabel: preview.status.replace(/_/g, ' '),
    mockOnly: true,
  }))
}

export function createLatestPreviewCardModel(previews: ProjectEditSessionPreviewRecord[]): {
  title: string
  body: string
  preview?: ProjectEditSessionPreviewRecord
  mockOnly: true
} {
  const preview = previews.at(-1)
  return {
    title: preview ? 'Latest preview placeholder' : 'No preview placeholder yet',
    body: preview
      ? `${preview.status.replace(/_/g, ' ')} for ${preview.aspectRatio}. No render or media file was created.`
      : 'Create a mock preview placeholder to test history UI without rendering.',
    preview,
    mockOnly: true,
  }
}

export function createPreviewHistorySummary(previews: ProjectEditSessionPreviewRecord[]): string {
  if (previews.length === 0) return 'No mock preview placeholders have been saved.'
  return `${previews.length} mock preview placeholder${previews.length === 1 ? '' : 's'} saved; no render jobs were created.`
}
