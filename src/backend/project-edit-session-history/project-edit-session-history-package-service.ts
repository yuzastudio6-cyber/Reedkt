import type { ProjectEditSessionBundleRecord } from '../../types/project-edit-session-repository'
import type {
  ProjectEditSessionEventRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionHistoryPackage,
  ProjectEditSessionHistoryTimelineItem,
} from '../../types/project-edit-session-history'
import { createHistoryEventItems } from './project-edit-session-event-history-service'
import { createPreviewHistoryItems } from './project-edit-session-preview-history-service'
import { createRevisionHistoryItems } from './project-edit-session-revision-history-service'
import { createSnapshotTimelineItems } from './project-edit-session-snapshot-history-service'
import { createVersionHistoryItems } from './project-edit-session-version-history-service'

function byCreatedAt<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function createProjectEditSessionTimelineItems(input: {
  snapshots: ProjectEditSessionSnapshotRecord[]
  versions: ProjectEditSessionVersionRecord[]
  previews: ProjectEditSessionPreviewRecord[]
  revisions: ProjectEditSessionRevisionRecord[]
  events: ProjectEditSessionEventRecord[]
}): ProjectEditSessionHistoryTimelineItem[] {
  return byCreatedAt([
    ...createSnapshotTimelineItems(input.snapshots),
    ...createVersionHistoryItems(input.versions),
    ...createPreviewHistoryItems(input.previews),
    ...createRevisionHistoryItems(input.revisions),
    ...createHistoryEventItems(input.events),
  ])
}

export function createProjectEditSessionHistoryPackage(input: {
  projectId: string
  editSessionId: string
  approvalStatus: ProjectEditSessionHistoryPackage['approvalStatus']
  snapshots?: ProjectEditSessionSnapshotRecord[]
  versions?: ProjectEditSessionVersionRecord[]
  previews?: ProjectEditSessionPreviewRecord[]
  revisions?: ProjectEditSessionRevisionRecord[]
  events?: ProjectEditSessionEventRecord[]
  warnings?: string[]
}): ProjectEditSessionHistoryPackage {
  const snapshots = byCreatedAt(input.snapshots ?? [])
  const versions = byCreatedAt(input.versions ?? [])
  const previews = byCreatedAt(input.previews ?? [])
  const revisions = byCreatedAt(input.revisions ?? [])
  const events = byCreatedAt(input.events ?? [])
  const timelineItems = createProjectEditSessionTimelineItems({ snapshots, versions, previews, revisions, events })
  return {
    id: `history-package-${input.editSessionId}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    snapshots,
    versions,
    previews,
    revisions,
    events,
    latestSnapshot: snapshots.at(-1),
    latestVersion: versions.at(-1),
    latestPreview: previews.at(-1),
    approvalStatus: input.approvalStatus,
    readableSummary: `${versions.length} versions, ${previews.length} preview placeholders, ${revisions.length} revisions, ${snapshots.length} snapshots.`,
    timelineItems,
    mockOnly: true,
    warnings: input.warnings ?? [],
  }
}

export function createHistoryPackageFromBundle(bundle: ProjectEditSessionBundleRecord): ProjectEditSessionHistoryPackage {
  return createProjectEditSessionHistoryPackage({
    projectId: bundle.session.projectId,
    editSessionId: bundle.session.id,
    approvalStatus: bundle.session.approvalStatus,
    snapshots: bundle.snapshots,
    versions: bundle.versions,
    previews: bundle.previews,
    revisions: bundle.revisions,
    events: bundle.events,
  })
}

export function createProjectEditSessionHistoryPackageSummary(historyPackage: ProjectEditSessionHistoryPackage): string {
  return `${historyPackage.readableSummary} Approval is ${historyPackage.approvalStatus.replace(/_/g, ' ')}. Mock-only: ${historyPackage.mockOnly ? 'yes' : 'no'}.`
}
