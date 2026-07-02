import type {
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerRecord,
} from '../../types/project-edit-brief'
import { createProjectEditBriefMarkerChatId } from '../../lib/project-edit-brief-marker-chat-rules'

export function createProjectEditBriefMarkerChatConfirmationRecord(input: {
  marker: ProjectEditBriefMarkerRecord
  intent: ProjectEditBriefMarkerIntentRecord
  summary: string
}): ProjectEditBriefMarkerConfirmationRecord {
  return {
    id: createProjectEditBriefMarkerChatId('project-edit-brief-marker-chat-confirmation'),
    projectId: input.marker.projectId,
    editSessionId: input.marker.editSessionId,
    briefId: input.marker.briefId,
    markerId: input.marker.id,
    intentId: input.intent.id,
    summary: input.summary,
    confirmedByUser: true,
    aiMode: input.marker.aiMode,
    createdAt: new Date().toISOString(),
    mockOnly: true,
    metadata: {
      source: 'rp_editbrief_07_marker_chat_backend_wrapper',
      markerScopedOnly: true,
    },
  }
}
