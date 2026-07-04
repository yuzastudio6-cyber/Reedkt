import type { ProjectEditSessionEventRecord } from '../../types/project-edit-session'
import type { ProjectEditSessionHistoryTimelineItem } from '../../types/project-edit-session-history'

function nowIso(): string {
  return new Date().toISOString()
}

export function createHistoryEvent(input: {
  id?: string
  projectId: string
  editSessionId: string
  eventType: string
  summary: string
  metadata?: Record<string, unknown>
}): ProjectEditSessionEventRecord {
  return {
    id: input.id ?? `event-${input.editSessionId}-${input.eventType}-${Date.now()}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    eventType: input.eventType,
    summary: input.summary,
    createdAt: nowIso(),
    mockOnly: true,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-09',
      ...(input.metadata ?? {}),
    },
  }
}

export function createVersionSavedEvent(input: { projectId: string; editSessionId: string; versionId?: string }): ProjectEditSessionEventRecord {
  return createHistoryEvent({
    ...input,
    eventType: 'mock_version_saved',
    summary: 'Mock version saved without render, worker, provider, or credit side effects.',
  })
}

export function createPreviewPlaceholderEvent(input: { projectId: string; editSessionId: string; previewId?: string }): ProjectEditSessionEventRecord {
  return createHistoryEvent({
    ...input,
    eventType: 'mock_preview_placeholder_created',
    summary: 'Mock preview placeholder created without rendering or media file output.',
  })
}

export function createRevisionCapturedEvent(input: { projectId: string; editSessionId: string; revisionId?: string }): ProjectEditSessionEventRecord {
  return createHistoryEvent({
    ...input,
    eventType: 'mock_revision_captured',
    summary: 'Mock revision captured and approval reset for safety.',
  })
}

export function createApprovalStateChangedEvent(input: {
  projectId: string
  editSessionId: string
  approvalStatus: string
}): ProjectEditSessionEventRecord {
  return createHistoryEvent({
    ...input,
    eventType: 'mock_approval_state_changed',
    summary: `Mock approval state changed to ${input.approvalStatus.replace(/_/g, ' ')} without starting execution.`,
  })
}

export function createHistoryEventItems(events: ProjectEditSessionEventRecord[]): ProjectEditSessionHistoryTimelineItem[] {
  return events.map((event) => ({
    id: event.id,
    kind: 'event',
    title: event.eventType.replace(/_/g, ' '),
    summary: event.summary,
    createdAt: event.createdAt,
    mockOnly: true,
  }))
}

export function createHistoryEventSummary(events: ProjectEditSessionEventRecord[]): string {
  if (events.length === 0) return 'No history events have been recorded yet.'
  return `${events.length} mock history event${events.length === 1 ? '' : 's'} recorded.`
}
