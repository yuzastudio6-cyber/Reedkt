import type {
  ProjectEditBriefMarkerChatApplyResult,
  ProjectEditBriefMarkerChatExtractionResult,
  ProjectEditBriefMarkerChatPanelModel,
  ProjectEditBriefMarkerChatRequest,
  ProjectEditBriefMarkerChatSafetyFlags,
  ProjectEditBriefMarkerChatValidationResult,
} from '../../types/project-edit-brief-marker-chat'

export type ProjectEditBriefMarkerChatSendRequest = ProjectEditBriefMarkerChatRequest

export interface ProjectEditBriefMarkerChatSendResponse extends ProjectEditBriefMarkerChatSafetyFlags {
  result?: ProjectEditBriefMarkerChatApplyResult
  panel?: ProjectEditBriefMarkerChatPanelModel
  mockOnly: true
}

export type ProjectEditBriefMarkerChatExtractRequest = ProjectEditBriefMarkerChatRequest

export interface ProjectEditBriefMarkerChatExtractResponse extends ProjectEditBriefMarkerChatSafetyFlags {
  extraction: ProjectEditBriefMarkerChatExtractionResult
  mockOnly: true
}

export interface ProjectEditBriefMarkerChatPanelRequest {
  markerId: string
}

export interface ProjectEditBriefMarkerChatPanelResponse extends ProjectEditBriefMarkerChatSafetyFlags {
  panel?: ProjectEditBriefMarkerChatPanelModel
  mockOnly: true
}

export type ProjectEditBriefMarkerChatValidationRequest = ProjectEditBriefMarkerChatRequest

export interface ProjectEditBriefMarkerChatValidationResponse extends ProjectEditBriefMarkerChatSafetyFlags {
  validation: ProjectEditBriefMarkerChatValidationResult
  mockOnly: true
}

export interface ProjectEditBriefMarkerChatSummaryResponse extends ProjectEditBriefMarkerChatSafetyFlags {
  readableSummary: string
  readinessSummary: string
  mockOnly: true
}
