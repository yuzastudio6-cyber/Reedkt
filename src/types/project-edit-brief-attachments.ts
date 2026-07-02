import type {
  ProjectEditBriefAttachmentKind,
  ProjectEditBriefAttachmentStatus,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerIntentStatus,
} from './project-edit-brief'

export type ProjectEditBriefAttachmentInputMode =
  | 'metadata_label'
  | 'metadata_reference_url'
  | 'future_upload_placeholder'

export type ProjectEditBriefAttachmentPreviewMode =
  | 'chip_only'
  | 'metadata_detail'
  | 'future_media_preview_blocked'

export type ProjectEditBriefAttachmentSafetyStatus =
  | 'safe_metadata_only'
  | 'blocked_file_bytes'
  | 'blocked_external_fetch'
  | 'blocked_media_processing'
  | 'blocked_upload_gate'
  | 'failed_validation'

export interface ProjectEditBriefAttachmentSafetyFlags {
  providerCallMade: false
  modelCallMade: false
  soundRuntimeStarted: false
  dockerCommandRun: false
  supabaseReadMade: false
  supabaseWriteMade: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
}

export interface ProjectEditBriefAttachmentKindDefinition {
  kind: ProjectEditBriefAttachmentKind
  displayName: string
  iconLabel: string
  acceptedMetadataLabels: string[]
  futureUploadAllowed: boolean
  mockOnly: boolean
  notes: string[]
}

export interface ProjectEditBriefAttachmentDraft extends ProjectEditBriefAttachmentSafetyFlags {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  attachmentKind: ProjectEditBriefAttachmentKind
  inputMode: ProjectEditBriefAttachmentInputMode
  label: string
  referenceUrl?: string
  referenceLabel?: string
  notes: string[]
  status: ProjectEditBriefAttachmentStatus
  safetyStatus: ProjectEditBriefAttachmentSafetyStatus
  mockOnly: true
}

export interface ProjectEditBriefAttachmentChipModel extends ProjectEditBriefAttachmentSafetyFlags {
  id: string
  markerId: string
  label: string
  kindLabel: string
  iconLabel: string
  statusLabel: string
  previewMode: ProjectEditBriefAttachmentPreviewMode
  previewLabel?: string
  referenceUrlLabel?: string
  notes: string[]
  mockOnly: true
  warnings: string[]
}

export interface ProjectEditBriefAttachmentPanelModel extends ProjectEditBriefAttachmentSafetyFlags {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  title: string
  attachments: ProjectEditBriefAttachmentChipModel[]
  selectedAttachment?: ProjectEditBriefAttachmentChipModel
  canAddMetadataAttachment: boolean
  canUploadRealFile: false
  boundarySummary: string
  mockOnly: true
  warnings: string[]
}

export interface ProjectEditBriefAttachmentIntentBridgeResult extends ProjectEditBriefAttachmentSafetyFlags {
  markerId: string
  intentId?: string
  providedAssetIds: string[]
  updatedBlockingNeeds: string[]
  updatedPlannerHints: string[]
  statusSuggestion?: ProjectEditBriefMarkerIntentStatus
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefAttachmentValidationResult extends ProjectEditBriefAttachmentSafetyFlags {
  ok: boolean
  blocked: boolean
  safetyStatus: ProjectEditBriefAttachmentSafetyStatus
  blockedReasons: string[]
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefAttachmentScenario {
  id: string
  title: string
  input: string
  expectedOk: boolean
  expectedSafetyStatus: ProjectEditBriefAttachmentSafetyStatus
  expectedSideEffectsFalse: true
  mockOnly: true
}

export interface ProjectEditBriefAttachmentOrchestratorResult extends ProjectEditBriefAttachmentSafetyFlags {
  kindRegistry: ProjectEditBriefAttachmentKindDefinition[]
  draft?: ProjectEditBriefAttachmentDraft
  attachment?: ProjectEditBriefMarkerAttachmentRecord
  chipModel?: ProjectEditBriefAttachmentChipModel
  panelModel?: ProjectEditBriefAttachmentPanelModel
  intent?: ProjectEditBriefMarkerIntentRecord
  intentBridge?: ProjectEditBriefAttachmentIntentBridgeResult
  validation: ProjectEditBriefAttachmentValidationResult
  summary: string
  warnings: string[]
  nextStep: 'RP-EDITBRIEF-09 — Export Settings Auto-Recommendation + Brief Access'
  mockOnly: true
}

export const REEDITPRO_PROJECT_EDIT_BRIEF_ATTACHMENT_RULE =
  'Project Edit Brief marker attachments are marker-scoped metadata records used to clarify intent; they are not real uploads in this milestone.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_ATTACHMENT_NO_FILE_RULE =
  'RP-EDITBRIEF-08 must not read file bytes, upload files, fetch external URLs, process media, run sound runtime, render, or spend credits.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_ATTACHMENT_SOUND_GATE_RULE =
  'Music, soundtrack, and SFX attachments are metadata-only until audio/sound worker runtime, provider, storage, render, and credit gates are explicitly approved.'
