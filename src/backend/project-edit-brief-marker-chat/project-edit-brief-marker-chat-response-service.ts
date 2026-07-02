import type {
  ProjectEditBriefMarkerIntentAction,
  ProjectEditBriefMarkerRecord,
} from '../../types/project-edit-brief'
import type { ProjectEditBriefMarkerChatResponseKind } from '../../types/project-edit-brief-marker-chat'
import {
  classifyProjectEditBriefMarkerChatProcessingMode,
  createProjectEditBriefMarkerMockResponse,
  responseKindForMode,
} from '../../lib/project-edit-brief-marker-chat-rules'

export function createProjectEditBriefMarkerChatResponse(input: {
  marker: ProjectEditBriefMarkerRecord
  action: ProjectEditBriefMarkerIntentAction
  responseKind: ProjectEditBriefMarkerChatResponseKind
}): string | undefined {
  return createProjectEditBriefMarkerMockResponse(input.marker, input.action, input.responseKind)
}

export function classifyProjectEditBriefMarkerChatResponseKind(input: Parameters<typeof classifyProjectEditBriefMarkerChatProcessingMode>): ProjectEditBriefMarkerChatResponseKind {
  return responseKindForMode(classifyProjectEditBriefMarkerChatProcessingMode(...input))
}
