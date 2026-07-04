import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionCardModel,
  ProjectEditSessionEventRecord,
  ProjectEditSessionFixtureBundle,
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageKind,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceRecord,
  ProjectEditSessionStatus,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'

export interface ProjectEditSessionContractResponseMeta {
  mockOnly: true
  contractOnly: true
  repositoryImplemented: false
  apiHandlerImplemented: false
  uiBehaviorChanged: false
  supabaseCommandRun: false
  migrationCreated: false
  warnings: string[]
}

export interface ListProjectEditSessionsRequest {
  projectId: string
  workspaceId?: string
  status?: ProjectEditSessionStatus
  includeArchived?: boolean
  mockOnly: true
}

export interface ListProjectEditSessionsResponse {
  sessions: ProjectEditSessionRecord[]
  cardModels?: ProjectEditSessionCardModel[]
  meta: ProjectEditSessionContractResponseMeta
}

export interface GetProjectEditSessionRequest {
  projectId: string
  editSessionId: string
  includeBundle?: boolean
  mockOnly: true
}

export interface GetProjectEditSessionResponse {
  session?: ProjectEditSessionRecord
  bundle?: ProjectEditSessionFixtureBundle
  meta: ProjectEditSessionContractResponseMeta
}

export interface CreateProjectEditSessionRequest {
  projectId: string
  name: string
  sourceMediaAssetIds?: string[]
  selectedEditPreferenceId?: string
  selectedPreferenceVersionId?: string
  mockOnly: true
}

export interface CreateProjectEditSessionResponse {
  session: ProjectEditSessionRecord
  sources: ProjectEditSessionSourceRecord[]
  messages: ProjectEditSessionMessageRecord[]
  meta: ProjectEditSessionContractResponseMeta
}

export interface UpdateProjectEditSessionRequest {
  projectId: string
  editSessionId: string
  patch: Partial<Pick<
    ProjectEditSessionRecord,
    | 'name'
    | 'description'
    | 'status'
    | 'aspectRatio'
    | 'customAspectRatio'
    | 'platformTarget'
    | 'selectedEditLevel'
    | 'selectedEditPreferenceId'
    | 'selectedPreferenceVersionId'
    | 'selectedEditPreferenceHandle'
    | 'approvalStatus'
    | 'metadata'
  >>
  mockOnly: true
}

export interface UpdateProjectEditSessionResponse {
  session: ProjectEditSessionRecord
  snapshot?: ProjectEditSessionSnapshotRecord
  event?: ProjectEditSessionEventRecord
  meta: ProjectEditSessionContractResponseMeta
}

export interface ArchiveProjectEditSessionRequest {
  projectId: string
  editSessionId: string
  mockOnly: true
}

export interface ArchiveProjectEditSessionResponse {
  session: ProjectEditSessionRecord
  archived: boolean
  meta: ProjectEditSessionContractResponseMeta
}

export interface ListProjectEditSessionMessagesRequest {
  projectId: string
  editSessionId: string
  kind?: ProjectEditSessionMessageKind
  mockOnly: true
}

export interface ListProjectEditSessionMessagesResponse {
  messages: ProjectEditSessionMessageRecord[]
  meta: ProjectEditSessionContractResponseMeta
}

export interface AppendProjectEditSessionMessageRequest {
  projectId: string
  editSessionId: string
  message: Omit<ProjectEditSessionMessageRecord, 'id' | 'projectId' | 'editSessionId' | 'createdAt' | 'mockOnly'> & {
    id?: string
    createdAt?: string
  }
  mockOnly: true
}

export interface AppendProjectEditSessionMessageResponse {
  message: ProjectEditSessionMessageRecord
  session: ProjectEditSessionRecord
  meta: ProjectEditSessionContractResponseMeta
}

export interface GetProjectEditSessionMemoryRequest {
  projectId: string
  editSessionId: string
  layer?: ProjectEditSessionMemoryLayer
  mockOnly: true
}

export interface GetProjectEditSessionMemoryResponse {
  memories: ProjectEditSessionMemoryRecord[]
  meta: ProjectEditSessionContractResponseMeta
}

export interface UpdateProjectEditSessionMemoryRequest {
  projectId: string
  editSessionId: string
  layer: ProjectEditSessionMemoryLayer
  summary: string
  facts?: string[]
  preferences?: string[]
  warnings?: string[]
  mockOnly: true
}

export interface UpdateProjectEditSessionMemoryResponse {
  memory: ProjectEditSessionMemoryRecord
  session: ProjectEditSessionRecord
  meta: ProjectEditSessionContractResponseMeta
}

export interface ListProjectEditSessionVersionsRequest {
  projectId: string
  editSessionId: string
  approvalStatus?: ProjectEditSessionApprovalStatus
  mockOnly: true
}

export interface ListProjectEditSessionVersionsResponse {
  versions: ProjectEditSessionVersionRecord[]
  meta: ProjectEditSessionContractResponseMeta
}

export interface CreateProjectEditSessionVersionRequest {
  projectId: string
  editSessionId: string
  name: string
  summary: string
  createdFromSnapshotId?: string
  createdFromMessageId?: string
  mockOnly: true
}

export interface CreateProjectEditSessionVersionResponse {
  version: ProjectEditSessionVersionRecord
  session: ProjectEditSessionRecord
  meta: ProjectEditSessionContractResponseMeta
}

export interface ListProjectEditSessionPreviewsRequest {
  projectId: string
  editSessionId: string
  versionId?: string
  mockOnly: true
}

export interface ListProjectEditSessionPreviewsResponse {
  previews: ProjectEditSessionPreviewRecord[]
  meta: ProjectEditSessionContractResponseMeta
}

export interface SaveProjectEditSessionPreviewRequest {
  projectId: string
  editSessionId: string
  versionId?: string
  preview: Omit<ProjectEditSessionPreviewRecord, 'id' | 'projectId' | 'editSessionId' | 'createdAt' | 'mockOnly'> & {
    id?: string
    createdAt?: string
  }
  mockOnly: true
}

export interface SaveProjectEditSessionPreviewResponse {
  preview: ProjectEditSessionPreviewRecord
  session: ProjectEditSessionRecord
  meta: ProjectEditSessionContractResponseMeta
}

export interface CreateProjectEditSessionCardModelsRequest {
  projectId: string
  sessions?: ProjectEditSessionRecord[]
  mockOnly: true
}

export interface CreateProjectEditSessionCardModelsResponse {
  cardModels: ProjectEditSessionCardModel[]
  meta: ProjectEditSessionContractResponseMeta
}
