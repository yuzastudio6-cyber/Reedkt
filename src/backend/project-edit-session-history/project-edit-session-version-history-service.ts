import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionVersionRecord,
  ProjectEditSessionVersionStatus,
} from '../../types/project-edit-session'
import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

function nowIso(): string {
  return new Date().toISOString()
}

export function createMockEditSessionVersion(input: {
  id?: string
  projectId: string
  editSessionId: string
  versionNumber: number
  name?: string
  summary?: string
  status?: ProjectEditSessionVersionStatus
  approvalStatus?: ProjectEditSessionApprovalStatus
  createdFromSnapshotId?: string
  createdFromMessageId?: string
  previewId?: string
}): ProjectEditSessionVersionRecord {
  return {
    id: input.id ?? `version-${input.editSessionId}-${input.versionNumber}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    versionNumber: input.versionNumber,
    status: input.status ?? 'draft',
    name: input.name ?? `Mock Version ${input.versionNumber}`,
    summary: input.summary ?? 'Mock Edit Chat version saved without render or worker execution.',
    createdFromSnapshotId: input.createdFromSnapshotId,
    createdFromMessageId: input.createdFromMessageId,
    previewId: input.previewId,
    approvalStatus: input.approvalStatus ?? 'not_requested',
    createdAt: nowIso(),
    mockOnly: true,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-09',
      noRenderStarted: true,
      noCreditReservedOrSpent: true,
    },
  }
}

export function approveMockEditSessionVersion(version: ProjectEditSessionVersionRecord): ProjectEditSessionVersionRecord {
  return {
    ...version,
    status: 'approved',
    approvalStatus: 'approved',
    metadata: {
      ...(version.metadata ?? {}),
      approvedStateOnly: true,
      noProgressStarted: true,
      noRenderStarted: true,
    },
  }
}

export function rejectMockEditSessionVersion(version: ProjectEditSessionVersionRecord): ProjectEditSessionVersionRecord {
  return {
    ...version,
    status: 'rejected',
    approvalStatus: 'rejected',
    metadata: {
      ...(version.metadata ?? {}),
      rejectedStateOnly: true,
      noProgressStarted: true,
      noRenderStarted: true,
    },
  }
}

export function supersedeProjectEditSessionVersion(version: ProjectEditSessionVersionRecord): ProjectEditSessionVersionRecord {
  return {
    ...version,
    status: 'superseded',
    metadata: {
      ...(version.metadata ?? {}),
      supersededByMockHistory: true,
    },
  }
}

export function createVersionHistoryItems(versions: ProjectEditSessionVersionRecord[]): ProjectEditSessionHistoryTimelineItem[] {
  return versions.map((version) => ({
    id: version.id,
    kind: 'version',
    title: `Version ${version.versionNumber}`,
    summary: version.summary,
    createdAt: version.createdAt,
    statusLabel: version.status.replace(/_/g, ' '),
    mockOnly: true,
  }))
}

export function createVersionHistorySummary(versions: ProjectEditSessionVersionRecord[]): string {
  if (versions.length === 0) return 'No mock versions have been saved for this Edit Chat yet.'
  const latest = versions.at(-1)
  return `${versions.length} mock version${versions.length === 1 ? '' : 's'} saved; latest is ${latest?.status.replace(/_/g, ' ')}.`
}
