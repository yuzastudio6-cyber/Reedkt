import type {
  ProjectEditBriefIntentConfidence,
  ProjectEditBriefMarkerIntentStatus,
  ProjectEditBriefMarkerStatus,
} from '../../types/project-edit-brief'
import { deriveProjectEditBriefMarkerStatusFromIntentStatus } from '../../lib/project-edit-brief-marker-chat-rules'

export function createProjectEditBriefMarkerChatAllowedStatus(
  status: ProjectEditBriefMarkerIntentStatus,
  confidence: ProjectEditBriefIntentConfidence,
): ProjectEditBriefMarkerStatus {
  return deriveProjectEditBriefMarkerStatusFromIntentStatus(status, confidence)
}

export function isProjectEditBriefMarkerChatSafeStatus(status: ProjectEditBriefMarkerStatus): boolean {
  return status === 'draft'
    || status === 'needs_asset'
    || status === 'needs_clarification'
    || status === 'confirmed'
}
