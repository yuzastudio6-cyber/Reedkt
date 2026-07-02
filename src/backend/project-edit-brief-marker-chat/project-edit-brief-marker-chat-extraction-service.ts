import type { ProjectEditBriefMarkerRecord } from '../../types/project-edit-brief'
import type { ProjectEditBriefMarkerChatExtractionResult } from '../../types/project-edit-brief-marker-chat'
import {
  createProjectEditBriefMarkerChatExtractionSummary,
  extractProjectEditBriefMarkerIntentFromMessage,
} from '../../lib/project-edit-brief-marker-chat-rules'

export function createProjectEditBriefMarkerChatExtraction(input: {
  marker: ProjectEditBriefMarkerRecord
  messageText: string
  userMessageId?: string
}): ProjectEditBriefMarkerChatExtractionResult {
  return extractProjectEditBriefMarkerIntentFromMessage(input)
}

export function summarizeProjectEditBriefMarkerChatExtraction(
  extraction: ProjectEditBriefMarkerChatExtractionResult,
): string {
  return createProjectEditBriefMarkerChatExtractionSummary(extraction)
}
