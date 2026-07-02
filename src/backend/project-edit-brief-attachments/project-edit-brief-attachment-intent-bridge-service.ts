import type {
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerIntentRecord,
} from '../../types/project-edit-brief'
import type { ProjectEditBriefAttachmentIntentBridgeResult } from '../../types/project-edit-brief-attachments'
import { PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS } from './project-edit-brief-attachment-policy-service'

function isRelevantAttachment(intent: ProjectEditBriefMarkerIntentRecord | undefined, attachment: ProjectEditBriefMarkerAttachmentRecord): boolean {
  if (!intent) return false
  if (intent.action === 'add_broll') return attachment.attachmentKind === 'broll_video' || attachment.attachmentKind === 'image' || attachment.attachmentKind === 'reference_label' || attachment.attachmentKind === 'reference_url_metadata_only'
  if (intent.action === 'add_music_or_soundtrack') return attachment.attachmentKind === 'music_track' || attachment.attachmentKind === 'soundtrack' || attachment.attachmentKind === 'reference_label'
  if (intent.action === 'add_sfx') return attachment.attachmentKind === 'sfx' || attachment.attachmentKind === 'reference_label'
  if (intent.action === 'add_voiceover') return attachment.attachmentKind === 'voiceover' || attachment.attachmentKind === 'document'
  return true
}

export function createAttachmentProvidedAssetSummary(attachment: ProjectEditBriefMarkerAttachmentRecord): string {
  return `${attachment.label} (${attachment.attachmentKind.replace(/_/g, ' ')}) metadata-only`
}

export function createAttachmentIntentBridgeResult(input: {
  markerId: string
  intent?: ProjectEditBriefMarkerIntentRecord
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
}): ProjectEditBriefAttachmentIntentBridgeResult {
  const relevant = input.attachments.filter((attachment) => isRelevantAttachment(input.intent, attachment))
  const providedAssetIds = Array.from(new Set([
    ...(input.intent?.providedAssetIds ?? []),
    ...relevant.map((attachment) => attachment.id),
  ]))
  const updatedBlockingNeeds = (input.intent?.blockingNeeds ?? []).filter((need) => {
    if (!relevant.length) return true
    return !/asset|b-roll|upload|missing/i.test(need)
  })
  const updatedPlannerHints = [
    ...(input.intent?.plannerHints ?? []),
    ...relevant.map((attachment) => `Metadata-only attachment available: ${createAttachmentProvidedAssetSummary(attachment)}.`),
  ]
  const statusSuggestion = input.intent?.status === 'needs_asset' && relevant.length
    ? 'draft_intent'
    : input.intent?.status
  return {
    markerId: input.markerId,
    intentId: input.intent?.id,
    providedAssetIds,
    updatedBlockingNeeds,
    updatedPlannerHints,
    statusSuggestion,
    warnings: [
      'Attachment intent bridge is conservative and never marks ready_for_plan.',
      'Attachments are metadata-only and have not been processed or verified.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  }
}

export function mergeAttachmentWithMarkerIntent(input: {
  intent: ProjectEditBriefMarkerIntentRecord
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
}): Partial<ProjectEditBriefMarkerIntentRecord> {
  const bridge = createAttachmentIntentBridgeResult({
    markerId: input.intent.markerId,
    intent: input.intent,
    attachments: input.attachments,
  })
  return {
    providedAssetIds: bridge.providedAssetIds,
    blockingNeeds: bridge.updatedBlockingNeeds,
    plannerHints: bridge.updatedPlannerHints,
    status: bridge.statusSuggestion,
    metadata: {
      ...(input.intent.metadata ?? {}),
      attachmentBridgeUpdated: true,
      noPlannerApplication: true,
    },
  }
}

export function createProjectEditBriefAttachmentIntentBridgeSummary(
  bridge: ProjectEditBriefAttachmentIntentBridgeResult,
): string {
  return `${bridge.providedAssetIds.length} metadata-only attachment(s) can clarify marker intent; status suggestion: ${bridge.statusSuggestion ?? 'none'}.`
}
