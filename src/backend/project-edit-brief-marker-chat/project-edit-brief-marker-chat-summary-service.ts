import type {
  ProjectEditBriefMarkerChatApplyResult,
  ProjectEditBriefMarkerChatExtractionResult,
  ProjectEditBriefMarkerChatPanelModel,
} from '../../types/project-edit-brief-marker-chat'

function label(value: string | undefined): string {
  return value ? value.replace(/_/g, ' ') : 'none'
}

export function createProjectEditBriefMarkerChatReadableSummary(input: {
  extraction?: ProjectEditBriefMarkerChatExtractionResult
  applyResult?: ProjectEditBriefMarkerChatApplyResult
  panel?: ProjectEditBriefMarkerChatPanelModel
}): string {
  if (input.applyResult) {
    return `Marker Chat ${input.applyResult.ok ? 'saved' : 'blocked'}: ${label(input.applyResult.extraction.intentDraft?.action)} / ${input.applyResult.extraction.extractionStatus}.`
  }
  if (input.panel) {
    return `Marker Chat panel: ${input.panel.messages.length} message(s), ${label(input.panel.intent?.action)}, ${input.panel.confirmations.length} confirmation(s).`
  }
  if (input.extraction) {
    return `Marker Chat extraction: ${label(input.extraction.intentDraft?.action)} / ${input.extraction.extractionStatus}.`
  }
  return 'Marker Chat mock/local boundary ready; no AI, planner, provider, Supabase, render, worker, or credit execution.'
}

export function createProjectEditBriefMarkerChatReadinessSummary(): string {
  return 'RP-EDITBRIEF-07 Marker Chat is mock/local ready for marker-scoped messages and deterministic intent capture; attachments, QA/conflict checks, export editing, and planner application remain future work.'
}
