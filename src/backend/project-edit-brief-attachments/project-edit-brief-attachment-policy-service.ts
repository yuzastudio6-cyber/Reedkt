import type {
  ProjectEditBriefAttachmentDraft,
  ProjectEditBriefAttachmentInputMode,
  ProjectEditBriefAttachmentSafetyFlags,
  ProjectEditBriefAttachmentSafetyStatus,
} from '../../types/project-edit-brief-attachments'
import type { ProjectEditBriefAttachmentKind } from '../../types/project-edit-brief'

export const PROJECT_EDIT_BRIEF_ATTACHMENT_SAFETY_FLAGS: ProjectEditBriefAttachmentSafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  soundRuntimeStarted: false,
  dockerCommandRun: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
}

export function validateProjectEditBriefAttachmentInputMode(
  mode: ProjectEditBriefAttachmentInputMode,
): ProjectEditBriefAttachmentSafetyStatus {
  if (mode === 'future_upload_placeholder') return 'blocked_upload_gate'
  return 'safe_metadata_only'
}

export function redactProjectEditBriefAttachmentReferenceUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  try {
    const url = new URL(value.trim())
    return `${url.protocol}//${url.hostname}/...`
  } catch {
    return 'invalid-url-metadata'
  }
}

export function classifyProjectEditBriefAttachmentSafety(input: {
  kind: ProjectEditBriefAttachmentKind
  inputMode: ProjectEditBriefAttachmentInputMode
  label?: string
  referenceUrl?: string
  attemptsFileBytes?: boolean
  attemptsExternalFetch?: boolean
  attemptsMediaProcessing?: boolean
}): ProjectEditBriefAttachmentSafetyStatus {
  if (input.attemptsFileBytes) return 'blocked_file_bytes'
  if (input.attemptsExternalFetch) return 'blocked_external_fetch'
  if (input.attemptsMediaProcessing) return 'blocked_media_processing'
  if (input.inputMode === 'future_upload_placeholder') return 'blocked_upload_gate'
  if (!input.label?.trim() && !input.referenceUrl?.trim()) return 'failed_validation'
  return 'safe_metadata_only'
}

export function isProjectEditBriefAttachmentAudioKind(kind: ProjectEditBriefAttachmentKind): boolean {
  return kind === 'music_track' || kind === 'soundtrack' || kind === 'sfx' || kind === 'voiceover'
}

export function createProjectEditBriefAttachmentPolicySummary(input?: Partial<ProjectEditBriefAttachmentDraft>): string {
  const urlLabel = redactProjectEditBriefAttachmentReferenceUrl(input?.referenceUrl)
  const audioBoundary = input?.attachmentKind && isProjectEditBriefAttachmentAudioKind(input.attachmentKind)
    ? ' Sound runtime, Docker, audio analysis, providers, render, and credits remain blocked.'
    : ''
  return `Attachment is metadata-only. ${urlLabel ? `Reference URL stored as ${urlLabel}; it is not fetched.` : 'No upload, file-byte read, URL fetch, or media preview is performed.'}${audioBoundary}`
}
