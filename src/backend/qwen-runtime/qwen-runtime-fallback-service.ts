import type {
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
} from '../../types'
import type { ProjectEditBriefRepository } from '../repositories/project-edit-brief-repository'
import {
  createProjectEditBriefMarkerChatExtractionSummary,
  extractProjectEditBriefMarkerIntentFromMessage,
} from '../../lib/project-edit-brief-marker-chat-rules'
import { createQwenRuntimeSafetyFlags } from './qwen-runtime-config-service'

export async function applyQwenMarkerChatDeterministicFallback(input: {
  repository: ProjectEditBriefRepository
  marker: ProjectEditBriefMarkerRecord
  userMessage: ProjectEditBriefMarkerMessageRecord
  reason: string
}): Promise<{
  intent?: ProjectEditBriefMarkerIntentRecord
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  updatedMarker?: ProjectEditBriefMarkerRecord
  warnings: string[]
}> {
  const extraction = extractProjectEditBriefMarkerIntentFromMessage({
    marker: input.marker,
    messageText: input.userMessage.text,
    userMessageId: input.userMessage.id,
  })
  const draft = extraction.intentDraft
  const intent = draft?.action && draft.status && draft.instruction
    ? (await input.repository.saveMarkerIntent({
        projectId: input.marker.projectId,
        editSessionId: input.marker.editSessionId,
        briefId: input.marker.briefId,
        markerId: input.marker.id,
        intent: {
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
          confidence: draft.confidence ?? extraction.confidence,
          blockingNeeds: draft.blockingNeeds ?? extraction.blockingNeeds,
          doNotCopyNotes: draft.doNotCopyNotes ?? ['Adapt intent; do not copy reference source.'],
          plannerHints: draft.plannerHints ?? extraction.plannerHints,
          latestUserMessageId: input.userMessage.id,
          metadata: {
            ...(draft.metadata ?? {}),
            source: 'rp_qwen_beta_01_fallback',
            fallbackReason: input.reason,
            deterministicFallbackUsed: true,
            ...createQwenRuntimeSafetyFlags(),
          },
        },
      })).data
    : undefined

  const responseText = extraction.responseText
    ?? 'I saved this marker note with deterministic fallback because Qwen beta runtime was unavailable or unsafe.'
  const assistantMessage = (await input.repository.appendMarkerMessage({
    projectId: input.marker.projectId,
    editSessionId: input.marker.editSessionId,
    briefId: input.marker.briefId,
    markerId: input.marker.id,
    message: {
      role: 'assistant',
      kind: extraction.responseKind === 'mock_clarifying_question' ? 'clarification_question' : extraction.responseKind === 'mock_confirmation' ? 'confirmation' : 'system_note',
      text: responseText,
      relatedIntentId: intent?.id,
      metadata: {
        source: 'rp_qwen_beta_01_fallback',
        fallbackStatus: 'deterministic_fallback_used',
        fallbackReason: input.reason,
        scopedToMarkerOnly: true,
        ...createQwenRuntimeSafetyFlags(),
      },
    },
  })).data

  const updatedMarker = (await input.repository.updateMarker({
    markerId: input.marker.id,
    patch: {
      status: extraction.markerStatusSuggestion,
      intentId: intent?.id ?? input.marker.intentId,
      metadata: {
        ...(input.marker.metadata ?? {}),
        qwenFallbackUsed: true,
        qwenFallbackReason: input.reason,
        markerChatLastExtraction: createProjectEditBriefMarkerChatExtractionSummary(extraction),
        noPlannerExecution: true,
      },
    },
  })).data

  return {
    intent,
    assistantMessage,
    updatedMarker,
    warnings: [
      `Qwen beta fallback used: ${input.reason}`,
      ...extraction.warnings,
    ],
  }
}
