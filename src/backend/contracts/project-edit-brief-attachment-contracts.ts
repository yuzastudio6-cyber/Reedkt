import type {
  ProjectEditBriefMarkerAttachmentRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefAttachmentChipModel,
  ProjectEditBriefAttachmentDraft,
  ProjectEditBriefAttachmentIntentBridgeResult,
  ProjectEditBriefAttachmentKindDefinition,
  ProjectEditBriefAttachmentPanelModel,
  ProjectEditBriefAttachmentSafetyFlags,
  ProjectEditBriefAttachmentValidationResult,
} from '../../types/project-edit-brief-attachments'

export interface ListProjectEditBriefAttachmentKindsRequest {
  mockOnly: true
}

export interface ListProjectEditBriefAttachmentKindsResponse extends ProjectEditBriefAttachmentSafetyFlags {
  kinds: ProjectEditBriefAttachmentKindDefinition[]
  mockOnly: true
}

export interface CreateProjectEditBriefAttachmentDraftRequest {
  markerId: string
  attachmentKind?: ProjectEditBriefAttachmentDraft['attachmentKind']
  inputMode?: ProjectEditBriefAttachmentDraft['inputMode']
}

export interface CreateProjectEditBriefAttachmentDraftResponse extends ProjectEditBriefAttachmentSafetyFlags {
  draft: ProjectEditBriefAttachmentDraft
  mockOnly: true
}

export interface CreateProjectEditBriefAttachmentPanelRequest {
  markerId: string
  selectedAttachmentId?: string
}

export interface CreateProjectEditBriefAttachmentPanelResponse extends ProjectEditBriefAttachmentSafetyFlags {
  panel: ProjectEditBriefAttachmentPanelModel
  mockOnly: true
}

export interface AddProjectEditBriefMetadataAttachmentRequest {
  draft: ProjectEditBriefAttachmentDraft
}

export interface AddProjectEditBriefMetadataAttachmentResponse extends ProjectEditBriefAttachmentSafetyFlags {
  attachment?: ProjectEditBriefMarkerAttachmentRecord
  validation: ProjectEditBriefAttachmentValidationResult
  mockOnly: true
}

export interface RemoveProjectEditBriefAttachmentRequest {
  attachmentId: string
}

export interface RemoveProjectEditBriefAttachmentResponse extends ProjectEditBriefAttachmentSafetyFlags {
  attachmentId: string
  removed: boolean
  mockOnly: true
}

export interface CreateProjectEditBriefAttachmentIntentBridgeRequest {
  markerId: string
  attachmentIds: string[]
}

export interface CreateProjectEditBriefAttachmentIntentBridgeResponse extends ProjectEditBriefAttachmentSafetyFlags {
  bridge: ProjectEditBriefAttachmentIntentBridgeResult
  mockOnly: true
}

export interface ValidateProjectEditBriefAttachmentRequest {
  draft?: ProjectEditBriefAttachmentDraft
  attachment?: ProjectEditBriefMarkerAttachmentRecord
}

export interface ValidateProjectEditBriefAttachmentResponse extends ProjectEditBriefAttachmentSafetyFlags {
  validation: ProjectEditBriefAttachmentValidationResult
  mockOnly: true
}

export interface CreateProjectEditBriefAttachmentSummaryRequest {
  attachment: ProjectEditBriefMarkerAttachmentRecord
}

export interface CreateProjectEditBriefAttachmentSummaryResponse extends ProjectEditBriefAttachmentSafetyFlags {
  chip: ProjectEditBriefAttachmentChipModel
  readableSummary: string
  mockOnly: true
}
