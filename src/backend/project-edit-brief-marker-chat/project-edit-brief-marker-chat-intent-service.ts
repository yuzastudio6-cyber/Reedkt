import type {
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
} from '../../types/project-edit-brief'
import type { ProjectEditBriefMarkerChatExtractionResult } from '../../types/project-edit-brief-marker-chat'
import { createProjectEditBriefMarkerChatId } from '../../lib/project-edit-brief-marker-chat-rules'

export function createProjectEditBriefMarkerChatIntentRecord(input: {
  extraction: ProjectEditBriefMarkerChatExtractionResult
  marker: ProjectEditBriefMarkerRecord
  userMessage?: ProjectEditBriefMarkerMessageRecord
}): ProjectEditBriefMarkerIntentRecord | undefined {
  const draft = input.extraction.intentDraft
  if (!draft?.action || !draft.status || !draft.instruction) return undefined
  const timestamp = new Date().toISOString()
  return {
    id: createProjectEditBriefMarkerChatId('project-edit-brief-marker-chat-intent'),
    projectId: input.marker.projectId,
    editSessionId: input.marker.editSessionId,
    briefId: input.marker.briefId,
    markerId: input.marker.id,
    action: draft.action,
    status: draft.status,
    instruction: draft.instruction,
    timeRangeLabel: draft.timeRangeLabel ?? `${input.marker.startTimeSeconds}s`,
    startTimeSeconds: draft.startTimeSeconds ?? input.marker.startTimeSeconds,
    endTimeSeconds: draft.endTimeSeconds,
    visualBehavior: draft.visualBehavior ?? 'unspecified',
    audioBehavior: draft.audioBehavior ?? 'unspecified',
    captionBehavior: draft.captionBehavior ?? 'unspecified',
    assetRequirement: draft.assetRequirement,
    providedAssetIds: draft.providedAssetIds ?? [],
    priority: draft.priority ?? input.marker.priority,
    confidence: draft.confidence ?? input.extraction.confidence,
    blockingNeeds: draft.blockingNeeds ?? [],
    doNotCopyNotes: draft.doNotCopyNotes ?? [],
    plannerHints: draft.plannerHints ?? [],
    latestUserMessageId: input.userMessage?.id ?? draft.latestUserMessageId,
    createdAt: timestamp,
    updatedAt: timestamp,
    mockOnly: true,
    metadata: {
      ...(draft.metadata ?? {}),
      source: 'rp_editbrief_07_marker_chat_backend_wrapper',
      noPlannerExecution: true,
    },
  }
}
