import type {
  ProjectEditBriefMarkerChatRequest,
  ProjectEditBriefMarkerChatValidationResult,
} from '../../types/project-edit-brief-marker-chat'
import { PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS } from '../../lib/project-edit-brief-marker-chat-rules'

export function validateProjectEditBriefMarkerChatRequestForBackend(
  request: ProjectEditBriefMarkerChatRequest,
): ProjectEditBriefMarkerChatValidationResult {
  const errors: string[] = []
  if (!request.projectId) errors.push('Project ID is required.')
  if (!request.editSessionId) errors.push('Edit Session ID is required.')
  if (!request.briefId) errors.push('Edit Brief ID is required.')
  if (!request.markerId) errors.push('Marker ID is required.')
  if (!request.messageText.trim()) errors.push('Marker Chat message is required.')
  return {
    ok: errors.length === 0,
    errors,
    warnings: [
      'Backend Marker Chat validation is deterministic and mock/local only.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}

export function validateProjectEditBriefMarkerChatSafetyFlags(flags: Record<string, unknown>): ProjectEditBriefMarkerChatValidationResult {
  const unsafe = Object.entries(flags).filter(([, value]) => value === true).map(([key]) => key)
  return {
    ok: unsafe.length === 0,
    errors: unsafe.map((key) => `${key} must remain false for RP-EDITBRIEF-07.`),
    warnings: unsafe.length ? ['Unsafe side-effect flag detected.'] : ['All Marker Chat side-effect flags remain false.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}
