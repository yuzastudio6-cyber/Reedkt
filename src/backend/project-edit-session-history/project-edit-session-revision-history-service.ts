import type {
  ProjectEditSessionRevisionRecord,
} from '../../types/project-edit-session'
import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

function nowIso(): string {
  return new Date().toISOString()
}

export function createRevisionRecordFromMessage(input: {
  id?: string
  projectId: string
  editSessionId: string
  messageId: string
  messageText: string
  snapshotId?: string
  versionId?: string
}): ProjectEditSessionRevisionRecord {
  return {
    id: input.id ?? `revision-${input.editSessionId}-${Date.now()}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    requestedByMessageId: input.messageId,
    summary: `Mock revision requested: ${input.messageText.slice(0, 96)}`,
    userInstruction: input.messageText,
    resetsApproval: true,
    createdSnapshotId: input.snapshotId,
    createdVersionId: input.versionId,
    createdAt: nowIso(),
    mockOnly: true,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-09',
      noPlanningStarted: true,
      noRenderStarted: true,
    },
  }
}

export function createRevisionHistoryItems(revisions: ProjectEditSessionRevisionRecord[]): ProjectEditSessionHistoryTimelineItem[] {
  return revisions.map((revision) => ({
    id: revision.id,
    kind: 'revision',
    title: 'Revision requested',
    summary: revision.summary,
    createdAt: revision.createdAt,
    statusLabel: revision.resetsApproval ? 'approval reset' : 'approval unchanged',
    mockOnly: true,
  }))
}

export function createRevisionApprovalResetSummary(revisions: ProjectEditSessionRevisionRecord[]): string {
  const resetCount = revisions.filter((revision) => revision.resetsApproval).length
  return resetCount
    ? `${resetCount} revision request${resetCount === 1 ? '' : 's'} reset approval for safety.`
    : 'No revision has reset approval yet.'
}

export function createRevisionHistorySummary(revisions: ProjectEditSessionRevisionRecord[]): string {
  if (revisions.length === 0) return 'No revision requests yet.'
  return `${revisions.length} mock revision request${revisions.length === 1 ? '' : 's'} captured. ${createRevisionApprovalResetSummary(revisions)}`
}
