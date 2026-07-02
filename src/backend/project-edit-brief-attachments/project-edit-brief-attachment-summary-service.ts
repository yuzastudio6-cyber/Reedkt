import type {
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerDrawerModel,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefAttachmentChipModel,
  ProjectEditBriefAttachmentPanelModel,
} from '../../types/project-edit-brief-attachments'
import { getProjectEditBriefAttachmentKindDefinition } from './project-edit-brief-attachment-kind-service'
import {
  PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  createProjectEditBriefAttachmentPolicySummary,
  redactProjectEditBriefAttachmentReferenceUrl,
} from './project-edit-brief-attachment-policy-service'

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function createProjectEditBriefAttachmentChipModel(
  attachment: ProjectEditBriefMarkerAttachmentRecord,
): ProjectEditBriefAttachmentChipModel {
  const definition = getProjectEditBriefAttachmentKindDefinition(attachment.attachmentKind)
  const isReferenceUrl = attachment.attachmentKind === 'reference_url_metadata_only'
  const isBlockedPreview = attachment.status === 'needs_upload_future' || attachment.status === 'blocked'
  return {
    id: attachment.id,
    markerId: attachment.markerId,
    label: attachment.label,
    kindLabel: definition.displayName,
    iconLabel: definition.iconLabel,
    statusLabel: titleCase(attachment.status),
    previewMode: isBlockedPreview ? 'future_media_preview_blocked' : isReferenceUrl ? 'metadata_detail' : 'chip_only',
    previewLabel: attachment.previewLabel,
    referenceUrlLabel: redactProjectEditBriefAttachmentReferenceUrl(attachment.referenceUrl),
    notes: attachment.notes.length ? attachment.notes : ['Metadata-only attachment. No file bytes are read.'],
    mockOnly: true,
    warnings: [
      createProjectEditBriefAttachmentPolicySummary({
        attachmentKind: attachment.attachmentKind,
        referenceUrl: attachment.referenceUrl,
      }),
    ],
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefAttachmentPanelModel(
  drawer: ProjectEditBriefMarkerDrawerModel,
  selectedAttachmentId?: string,
): ProjectEditBriefAttachmentPanelModel {
  const attachments = drawer.attachments.map(createProjectEditBriefAttachmentChipModel)
  return {
    projectId: drawer.marker.projectId,
    editSessionId: drawer.marker.editSessionId,
    briefId: drawer.marker.briefId,
    markerId: drawer.marker.id,
    title: drawer.marker.title,
    attachments,
    selectedAttachment: attachments.find((attachment) => attachment.id === selectedAttachmentId) ?? attachments[0],
    canAddMetadataAttachment: drawer.marker.status !== 'archived',
    canUploadRealFile: false,
    boundarySummary: 'Marker attachments are metadata-only. Real uploads and media preview arrive after storage/media gates.',
    mockOnly: true,
    warnings: [
      'No file input, file-byte read, external URL fetch, media processing, sound runtime, provider, worker, render, credit, or Supabase write is available.',
    ],
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefAttachmentReadableSummary(attachment: ProjectEditBriefMarkerAttachmentRecord): string {
  const definition = getProjectEditBriefAttachmentKindDefinition(attachment.attachmentKind)
  return `${definition.iconLabel}: ${attachment.label} (${attachment.status.replace(/_/g, ' ')})`
}

export function createProjectEditBriefAttachmentDebugSummary(panel: ProjectEditBriefAttachmentPanelModel): string {
  return `${panel.attachments.length} metadata-only attachment(s), upload enabled: ${panel.canUploadRealFile}.`
}
