import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefRecord,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'

export interface ProjectEditBriefContractResponseMeta {
  mockOnly: true
  contractOnly: true
  repositoryImplemented: false
  apiHandlerImplemented: false
  uiBehaviorChanged: false
  supabaseCommandRun: false
  migrationCreated: false
  warnings: string[]
}

export interface ProjectEditBriefValidationResult {
  ok: boolean
  mockOnly: true
  errors: string[]
  warnings: string[]
  repositoryRequired: false
  apiHandlerRequired: false
  uiRequired: false
  supabaseCommandRun: false
  migrationCreated: false
}

export interface GetProjectEditBriefRequest {
  projectId: string
  editSessionId: string
  briefId: string
  mockOnly: true
}

export interface GetProjectEditBriefResponse {
  brief?: ProjectEditBriefRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface CreateProjectEditBriefRequest {
  projectId: string
  editSessionId: string
  title: string
  summary?: string
  mockOnly: true
}

export interface CreateProjectEditBriefResponse {
  brief: ProjectEditBriefRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface UpdateProjectEditBriefRequest {
  projectId: string
  editSessionId: string
  briefId: string
  patch: Partial<Pick<ProjectEditBriefRecord, 'title' | 'summary' | 'status' | 'availability' | 'metadata'>>
  mockOnly: true
}

export interface UpdateProjectEditBriefResponse {
  brief: ProjectEditBriefRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface GetProjectEditBriefBundleRequest {
  projectId: string
  editSessionId: string
  briefId: string
  mockOnly: true
}

export interface GetProjectEditBriefBundleResponse {
  bundle?: ProjectEditBriefBundleRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface ListProjectEditBriefMarkersRequest {
  projectId: string
  editSessionId: string
  briefId: string
  mockOnly: true
}

export interface ListProjectEditBriefMarkersResponse {
  markers: ProjectEditBriefMarkerRecord[]
  timelineMarkers?: ProjectEditBriefTimelineMarkerModel[]
  meta: ProjectEditBriefContractResponseMeta
}

export interface GetProjectEditBriefMarkerRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  mockOnly: true
}

export interface GetProjectEditBriefMarkerResponse {
  marker?: ProjectEditBriefMarkerRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface CreateProjectEditBriefMarkerRequest {
  projectId: string
  editSessionId: string
  briefId: string
  marker: Omit<ProjectEditBriefMarkerRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'createdAt' | 'updatedAt' | 'mockOnly'> & {
    id?: string
    createdAt?: string
    updatedAt?: string
  }
  mockOnly: true
}

export interface CreateProjectEditBriefMarkerResponse {
  marker: ProjectEditBriefMarkerRecord
  timelineMarker: ProjectEditBriefTimelineMarkerModel
  meta: ProjectEditBriefContractResponseMeta
}

export interface UpdateProjectEditBriefMarkerRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  patch: Partial<ProjectEditBriefMarkerRecord>
  mockOnly: true
}

export interface UpdateProjectEditBriefMarkerResponse {
  marker: ProjectEditBriefMarkerRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface DeleteProjectEditBriefMarkerRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  mockOnly: true
}

export interface DeleteProjectEditBriefMarkerResponse {
  deleted: boolean
  markerId: string
  meta: ProjectEditBriefContractResponseMeta
}

export interface ConfirmProjectEditBriefMarkerRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  intentId: string
  summary: string
  mockOnly: true
}

export interface ConfirmProjectEditBriefMarkerResponse {
  confirmation: ProjectEditBriefMarkerConfirmationRecord
  marker: ProjectEditBriefMarkerRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface ListProjectEditBriefMarkerAttachmentsRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  mockOnly: true
}

export interface ListProjectEditBriefMarkerAttachmentsResponse {
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  meta: ProjectEditBriefContractResponseMeta
}

export interface AddProjectEditBriefMarkerAttachmentRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  attachment: Omit<ProjectEditBriefMarkerAttachmentRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'updatedAt' | 'mockOnly'> & {
    id?: string
    createdAt?: string
    updatedAt?: string
  }
  mockOnly: true
}

export interface AddProjectEditBriefMarkerAttachmentResponse {
  attachment: ProjectEditBriefMarkerAttachmentRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface RemoveProjectEditBriefMarkerAttachmentRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  attachmentId: string
  mockOnly: true
}

export interface RemoveProjectEditBriefMarkerAttachmentResponse {
  removed: boolean
  attachmentId: string
  meta: ProjectEditBriefContractResponseMeta
}

export interface ListProjectEditBriefMarkerMessagesRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  mockOnly: true
}

export interface ListProjectEditBriefMarkerMessagesResponse {
  messages: ProjectEditBriefMarkerMessageRecord[]
  meta: ProjectEditBriefContractResponseMeta
}

export interface AppendProjectEditBriefMarkerMessageRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  message: Omit<ProjectEditBriefMarkerMessageRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'mockOnly'> & {
    id?: string
    createdAt?: string
  }
  mockOnly: true
}

export interface AppendProjectEditBriefMarkerMessageResponse {
  message: ProjectEditBriefMarkerMessageRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface GetProjectEditBriefMarkerIntentRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  intentId?: string
  mockOnly: true
}

export interface GetProjectEditBriefMarkerIntentResponse {
  intent?: ProjectEditBriefMarkerIntentRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface SaveProjectEditBriefMarkerIntentRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  intent: Omit<ProjectEditBriefMarkerIntentRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'updatedAt' | 'mockOnly'> & {
    id?: string
    createdAt?: string
    updatedAt?: string
  }
  mockOnly: true
}

export interface SaveProjectEditBriefMarkerIntentResponse {
  intent: ProjectEditBriefMarkerIntentRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface ListProjectEditBriefConflictsRequest {
  projectId: string
  editSessionId: string
  briefId: string
  mockOnly: true
}

export interface ListProjectEditBriefConflictsResponse {
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  meta: ProjectEditBriefContractResponseMeta
}

export interface GetProjectEditSessionExportSettingsRequest {
  projectId: string
  editSessionId: string
  exportSettingsId?: string
  mockOnly: true
}

export interface GetProjectEditSessionExportSettingsResponse {
  exportSettings?: ProjectEditSessionExportSettingsRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface RecommendProjectEditSessionExportSettingsRequest {
  projectId: string
  editSessionId: string
  platformTarget?: ProjectEditSessionExportSettingsRecord['platformTarget']
  mockOnly: true
}

export interface RecommendProjectEditSessionExportSettingsResponse {
  exportSettings: ProjectEditSessionExportSettingsRecord
  reason: string
  meta: ProjectEditBriefContractResponseMeta
}

export interface UpdateProjectEditSessionExportSettingsRequest {
  projectId: string
  editSessionId: string
  exportSettingsId: string
  patch: Partial<ProjectEditSessionExportSettingsRecord>
  mockOnly: true
}

export interface UpdateProjectEditSessionExportSettingsResponse {
  exportSettings: ProjectEditSessionExportSettingsRecord
  meta: ProjectEditBriefContractResponseMeta
}

export interface CreateProjectEditBriefTimelineModelsRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markers: ProjectEditBriefMarkerRecord[]
  mockOnly: true
}

export interface CreateProjectEditBriefTimelineModelsResponse {
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[]
  meta: ProjectEditBriefContractResponseMeta
}

export interface ValidateProjectEditBriefRequest {
  projectId: string
  editSessionId: string
  brief?: ProjectEditBriefRecord
  bundle?: ProjectEditBriefBundleRecord
  mockOnly: true
}

export interface ValidateProjectEditBriefResponse {
  validation: ProjectEditBriefValidationResult
  meta: ProjectEditBriefContractResponseMeta
}
