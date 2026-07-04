import type {
  ProjectEditSessionPreferenceApplicationPlan,
  ProjectEditSessionPreferenceOption,
  ProjectEditSessionPreferencePanelModel,
  ProjectEditSessionPreferenceState,
  ProjectEditSessionPreferenceValidationResult,
} from '../../types/project-edit-session-preference'

export interface ListProjectEditSessionPreferenceOptionsRequest {
  projectId: string
  editSessionId?: string
}

export interface ListProjectEditSessionPreferenceOptionsResponse {
  options: ProjectEditSessionPreferenceOption[]
  summary: string[]
}

export interface GetProjectEditSessionPreferenceStateRequest {
  projectId?: string
  editSessionId: string
}

export interface GetProjectEditSessionPreferenceStateResponse {
  state: ProjectEditSessionPreferenceState
  panelModel: ProjectEditSessionPreferencePanelModel
}

export interface ApplyPreferenceToProjectEditSessionRequest {
  projectId: string
  editSessionId: string
  preferenceOptionId?: string
  preferenceHandle?: string
}

export interface ApplyPreferenceToProjectEditSessionResponse {
  state: ProjectEditSessionPreferenceState
  applicationPlan: ProjectEditSessionPreferenceApplicationPlan
  panelModel: ProjectEditSessionPreferencePanelModel
  summary: string[]
}

export interface ClearProjectEditSessionPreferenceRequest {
  projectId?: string
  editSessionId: string
}

export interface ClearProjectEditSessionPreferenceResponse {
  state: ProjectEditSessionPreferenceState
  applicationPlan: ProjectEditSessionPreferenceApplicationPlan
  panelModel: ProjectEditSessionPreferencePanelModel
  summary: string[]
}

export interface CreateProjectEditSessionPreferencePanelRequest {
  state: ProjectEditSessionPreferenceState
  applicationPlan?: ProjectEditSessionPreferenceApplicationPlan
}

export interface CreateProjectEditSessionPreferencePanelResponse {
  panelModel: ProjectEditSessionPreferencePanelModel
}

export interface ValidateProjectEditSessionPreferenceRequest {
  option?: ProjectEditSessionPreferenceOption
  state?: ProjectEditSessionPreferenceState
  applicationPlan?: ProjectEditSessionPreferenceApplicationPlan
}

export interface ValidateProjectEditSessionPreferenceResponse {
  validation: ProjectEditSessionPreferenceValidationResult
}

export interface CreateProjectEditSessionPreferenceSummaryRequest {
  state: ProjectEditSessionPreferenceState
  applicationPlan?: ProjectEditSessionPreferenceApplicationPlan
}

export interface CreateProjectEditSessionPreferenceSummaryResponse {
  summary: string[]
}
