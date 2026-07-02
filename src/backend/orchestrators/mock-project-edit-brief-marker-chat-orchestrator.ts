import type { ProjectEditBriefMarkerChatOrchestratorResult } from '../../types/project-edit-brief-marker-chat'
import { createMockProjectEditBriefFixtureBundle } from '../../lib/mock-project-edit-briefs'
import { PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS } from '../../lib/project-edit-brief-marker-chat-rules'
import { createProjectEditBriefMarkerChatExtraction } from '../project-edit-brief-marker-chat/project-edit-brief-marker-chat-extraction-service'
import { createProjectEditBriefMarkerChatIntentRecord } from '../project-edit-brief-marker-chat/project-edit-brief-marker-chat-intent-service'
import { createProjectEditBriefMarkerChatConfirmationRecord } from '../project-edit-brief-marker-chat/project-edit-brief-marker-chat-confirmation-service'
import { validateProjectEditBriefMarkerChatRequestForBackend } from '../project-edit-brief-marker-chat/project-edit-brief-marker-chat-validation-service'
import { createProjectEditBriefMarkerChatReadableSummary } from '../project-edit-brief-marker-chat/project-edit-brief-marker-chat-summary-service'

export function runMockProjectEditBriefMarkerChatOrchestrator(input: {
  messageText?: string
  markerId?: string
} = {}): ProjectEditBriefMarkerChatOrchestratorResult {
  const bundle = createMockProjectEditBriefFixtureBundle()
  const marker = bundle.markers.find((candidate) => candidate.id === input.markerId)
    ?? bundle.markers.find((candidate) => candidate.status !== 'archived')
    ?? bundle.markers[0]
  const request = {
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    messageText: input.messageText ?? 'Add this attached B-roll clip here and keep original audio.',
    aiMode: marker.aiMode,
    mockOnly: true,
  } as const
  const validation = validateProjectEditBriefMarkerChatRequestForBackend(request)
  const extraction = createProjectEditBriefMarkerChatExtraction({
    marker,
    messageText: request.messageText,
    userMessageId: `${marker.id}-mock-chat-user-message`,
  })
  const userMessage = {
    id: `${marker.id}-mock-chat-user-message`,
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    role: 'user' as const,
    kind: 'note' as const,
    text: request.messageText,
    createdAt: new Date().toISOString(),
    mockOnly: true,
    metadata: {
      source: 'rp_editbrief_07_orchestrator',
      scopedToMarkerOnly: true,
    },
  }
  const intent = createProjectEditBriefMarkerChatIntentRecord({ extraction, marker, userMessage })
  const confirmation = intent && extraction.responseKind === 'mock_confirmation' && extraction.responseText
    ? createProjectEditBriefMarkerChatConfirmationRecord({ marker, intent, summary: extraction.responseText })
    : undefined
  const assistantMessage = extraction.responseText && extraction.responseKind !== 'none'
    ? {
      id: `${marker.id}-mock-chat-assistant-message`,
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      role: 'assistant' as const,
      kind: extraction.responseKind === 'mock_clarifying_question'
        ? 'clarification_question' as const
        : extraction.responseKind === 'mock_confirmation'
          ? 'confirmation' as const
          : 'intent_update' as const,
      text: extraction.responseText,
      createdAt: new Date().toISOString(),
      relatedIntentId: intent?.id,
      mockOnly: true,
      metadata: {
        source: 'rp_editbrief_07_orchestrator',
        responseKind: extraction.responseKind,
      },
    }
    : undefined

  return {
    request,
    extraction,
    userMessage,
    assistantMessage,
    intent,
    confirmation,
    updatedMarker: {
      ...marker,
      status: extraction.markerStatusSuggestion,
      intentId: intent?.id ?? marker.intentId,
      metadata: {
        ...(marker.metadata ?? {}),
        markerChatImplemented: true,
      },
    },
    validation,
    summary: createProjectEditBriefMarkerChatReadableSummary({ extraction }),
    warnings: [
      'Orchestrator is mock/local and does not persist records.',
      ...extraction.warnings,
    ],
    nextStep: 'RP-EDITBRIEF-08 — Marker Attachments: B-roll, Image, Music, SFX',
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}
