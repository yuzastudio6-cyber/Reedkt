import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'
import type { ProjectEditSessionHistoryPackage } from '../../types/project-edit-session-history'
import { createApprovalHistorySummary } from './project-edit-session-approval-history-service'

export function createProjectEditSessionSnapshotReadableSummary(snapshot: ProjectEditSessionSnapshotRecord): string {
  return `${snapshot.kind.replace(/_/g, ' ')} snapshot: ${snapshot.summary}`
}

export function createProjectEditSessionVersionReadableSummary(version: ProjectEditSessionVersionRecord): string {
  return `Version ${version.versionNumber} ${version.status.replace(/_/g, ' ')}: ${version.summary}`
}

export function createProjectEditSessionPreviewReadableSummary(preview: ProjectEditSessionPreviewRecord): string {
  return `${preview.status.replace(/_/g, ' ')} preview placeholder for ${preview.aspectRatio}; no render job exists.`
}

export function createProjectEditSessionRevisionReadableSummary(revision: ProjectEditSessionRevisionRecord): string {
  return `${revision.summary} Approval reset: ${revision.resetsApproval ? 'yes' : 'no'}.`
}

export function createProjectEditSessionApprovalReadableSummary(status: ProjectEditSessionApprovalStatus): string {
  return createApprovalHistorySummary(status)
}

export function createProjectEditSessionHistoryReadableSummary(historyPackage: ProjectEditSessionHistoryPackage): string {
  return [
    `${historyPackage.snapshots.length} snapshots`,
    `${historyPackage.versions.length} versions`,
    `${historyPackage.previews.length} preview placeholders`,
    `${historyPackage.revisions.length} revisions`,
    `${historyPackage.events.length} events`,
    createApprovalHistorySummary(historyPackage.approvalStatus),
  ].join(' | ')
}

export function createProjectEditSessionHistoryDebugSummary(historyPackage: ProjectEditSessionHistoryPackage): {
  counts: Record<string, number>
  latestIds: Record<string, string | undefined>
  mockOnly: true
  warnings: string[]
} {
  return {
    counts: {
      snapshots: historyPackage.snapshots.length,
      versions: historyPackage.versions.length,
      previews: historyPackage.previews.length,
      revisions: historyPackage.revisions.length,
      events: historyPackage.events.length,
      timelineItems: historyPackage.timelineItems.length,
    },
    latestIds: {
      latestSnapshotId: historyPackage.latestSnapshot?.id,
      latestVersionId: historyPackage.latestVersion?.id,
      latestPreviewId: historyPackage.latestPreview?.id,
    },
    mockOnly: true,
    warnings: historyPackage.warnings,
  }
}
