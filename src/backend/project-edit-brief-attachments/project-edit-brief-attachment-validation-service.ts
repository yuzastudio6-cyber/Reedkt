import type {
  ProjectEditBriefMarkerAttachmentRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefAttachmentDraft,
  ProjectEditBriefAttachmentPanelModel,
  ProjectEditBriefAttachmentValidationResult,
} from '../../types/project-edit-brief-attachments'
import {
  PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  classifyProjectEditBriefAttachmentSafety,
} from './project-edit-brief-attachment-policy-service'

function result(input: {
  ok: boolean
  blockedReasons?: string[]
  warnings?: string[]
  safetyStatus?: ProjectEditBriefAttachmentValidationResult['safetyStatus']
}): ProjectEditBriefAttachmentValidationResult {
  const blockedReasons = input.blockedReasons ?? []
  return {
    ok: input.ok,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    warnings: input.warnings ?? [],
    safetyStatus: input.safetyStatus ?? (input.ok ? 'safe_metadata_only' : 'failed_validation'),
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS,
  }
}

export function validateProjectEditBriefAttachmentDraft(
  draft: ProjectEditBriefAttachmentDraft,
): ProjectEditBriefAttachmentValidationResult {
  const safetyStatus = classifyProjectEditBriefAttachmentSafety({
    kind: draft.attachmentKind,
    inputMode: draft.inputMode,
    label: draft.label,
    referenceUrl: draft.referenceUrl,
  })
  const blockedReasons: string[] = []
  if (!draft.markerId) blockedReasons.push('Marker ID is required.')
  if (!draft.label.trim() && !draft.referenceUrl?.trim()) blockedReasons.push('Attachment label or reference URL metadata is required.')
  if (safetyStatus !== 'safe_metadata_only') blockedReasons.push(`Attachment safety blocked: ${safetyStatus}.`)
  return result({
    ok: blockedReasons.length === 0,
    blockedReasons,
    safetyStatus,
    warnings: ['Attachment draft validation is mock/local and does not read files or fetch URLs.'],
  })
}

export function validateProjectEditBriefAttachmentRecord(
  attachment: ProjectEditBriefMarkerAttachmentRecord,
): ProjectEditBriefAttachmentValidationResult {
  const blockedReasons: string[] = []
  if (!attachment.mockOnly) blockedReasons.push('Attachment must remain mockOnly.')
  if (!attachment.label.trim()) blockedReasons.push('Attachment label is required.')
  if (attachment.status === 'blocked') blockedReasons.push('Attachment record is blocked.')
  return result({
    ok: blockedReasons.length === 0,
    blockedReasons,
    warnings: ['Attachment record remains metadata-only.'],
  })
}

export function validateProjectEditBriefAttachmentPanelModel(
  panel: ProjectEditBriefAttachmentPanelModel,
): ProjectEditBriefAttachmentValidationResult {
  return result({
    ok: panel.mockOnly && panel.canUploadRealFile === false,
    blockedReasons: panel.canUploadRealFile ? ['Real uploads must remain disabled.'] : [],
    warnings: ['Attachment panel does not expose active upload controls.'],
  })
}

export function validateNoProjectEditBriefAttachmentSideEffects(
  flags: Record<string, unknown>,
): ProjectEditBriefAttachmentValidationResult {
  const unsafe = Object.entries(flags).filter(([, value]) => value === true).map(([key]) => key)
  return result({
    ok: unsafe.length === 0,
    blockedReasons: unsafe.map((key) => `${key} must remain false.`),
    warnings: unsafe.length ? ['Unsafe side-effect flag detected.'] : ['All attachment side-effect flags remain false.'],
  })
}

export function createProjectEditBriefAttachmentValidationSummary(
  validation: ProjectEditBriefAttachmentValidationResult,
): string {
  return validation.ok
    ? 'Attachment validation passed with metadata-only safety flags false.'
    : `Attachment validation blocked: ${validation.blockedReasons.join(' ')}`
}
