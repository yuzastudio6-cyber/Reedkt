import type {
  ProjectEditSessionSnapshotKind,
  ProjectEditSessionSnapshotRecord,
} from '../../types/project-edit-session'
import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

function nowIso(): string {
  return new Date().toISOString()
}

export function createProjectEditSessionSnapshotRecord(input: {
  id?: string
  projectId: string
  editSessionId: string
  kind: ProjectEditSessionSnapshotKind
  summary: string
  messageId?: string
  versionNumber?: number
  state?: Record<string, unknown>
}): ProjectEditSessionSnapshotRecord {
  return {
    id: input.id ?? `snapshot-${input.editSessionId}-${input.kind}-${Date.now()}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    kind: input.kind,
    versionNumber: input.versionNumber,
    messageId: input.messageId,
    summary: input.summary,
    state: {
      mockOnly: true,
      noProgressStarted: true,
      noRenderStarted: true,
      ...(input.state ?? {}),
    },
    createdAt: nowIso(),
    mockOnly: true,
  }
}

export function createManualCheckpointSnapshot(input: {
  projectId: string
  editSessionId: string
  summary?: string
}): ProjectEditSessionSnapshotRecord {
  return createProjectEditSessionSnapshotRecord({
    ...input,
    kind: 'manual_checkpoint',
    summary: input.summary ?? 'Manual mock checkpoint saved for this Edit Chat.',
  })
}

export function createRevisionRequestedSnapshot(input: {
  projectId: string
  editSessionId: string
  messageId?: string
  summary?: string
}): ProjectEditSessionSnapshotRecord {
  return createProjectEditSessionSnapshotRecord({
    ...input,
    kind: 'revision_requested',
    summary: input.summary ?? 'Revision requested; approval reset for mock history safety.',
  })
}

export function createVersionCreatedSnapshot(input: {
  projectId: string
  editSessionId: string
  versionNumber?: number
  summary?: string
}): ProjectEditSessionSnapshotRecord {
  return createProjectEditSessionSnapshotRecord({
    ...input,
    kind: 'version_created',
    summary: input.summary ?? 'Mock version checkpoint created without render or provider work.',
  })
}

export function createPreviewCreatedSnapshot(input: {
  projectId: string
  editSessionId: string
  summary?: string
}): ProjectEditSessionSnapshotRecord {
  return createProjectEditSessionSnapshotRecord({
    ...input,
    kind: 'preview_created',
    summary: input.summary ?? 'Mock preview placeholder checkpoint created.',
  })
}

export function createSnapshotTimelineItems(snapshots: ProjectEditSessionSnapshotRecord[]): ProjectEditSessionHistoryTimelineItem[] {
  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    kind: 'snapshot',
    title: snapshot.kind.replace(/_/g, ' '),
    summary: snapshot.summary,
    createdAt: snapshot.createdAt,
    statusLabel: snapshot.versionNumber ? `v${snapshot.versionNumber}` : undefined,
    mockOnly: true,
  }))
}

export function createSnapshotHistorySummary(snapshots: ProjectEditSessionSnapshotRecord[]): string {
  if (snapshots.length === 0) return 'No mock snapshots have been saved for this Edit Chat yet.'
  return `${snapshots.length} mock snapshot${snapshots.length === 1 ? '' : 's'} saved; latest is ${snapshots.at(-1)?.kind.replace(/_/g, ' ')}.`
}
