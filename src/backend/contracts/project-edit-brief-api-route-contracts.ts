import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefRecord,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import type { ProjectEditBriefApiRouteId } from '../../types/api-routes'
import type { ProjectEditBriefRepositoryContext } from '../../types/project-edit-brief-repository'

export interface ProjectEditBriefApiRouteSafety {
  mockOnly: true
  providerCallMade: false
  modelCallMade: false
  supabaseReadMade: false
  supabaseWriteMade: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  generationRequestCreated: false
  renderJobCreated: false
  workerJobCreated: false
  creditReservedOrSpent: false
}

export interface ProjectEditBriefApiRouteContractMeta {
  routeId: ProjectEditBriefApiRouteId
  mockOnly: true
  repositoryBacked: true
  uiRouteImplemented: false
  productionHttpImplemented: false
  safety: ProjectEditBriefApiRouteSafety
  warnings: string[]
}

export interface ProjectEditBriefRouteContextRequest {
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  briefId?: string
  markerId?: string
  userId?: string
  mockOnly: true
}

export interface ProjectEditBriefRouteContextResponse {
  context: ProjectEditBriefRepositoryContext
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface GetProjectEditBriefApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  briefId: string
}

export interface GetProjectEditBriefForSessionApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  editSessionId: string
}

export interface CreateProjectEditBriefApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  projectId: string
  editSessionId: string
  title: string
  summary?: string
}

export interface UpdateProjectEditBriefApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  briefId: string
  patch: Partial<ProjectEditBriefRecord>
}

export interface ProjectEditBriefApiRouteBriefResponse {
  brief?: ProjectEditBriefRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteSummaryResponse {
  summary: string
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteBundleResponse {
  bundle?: ProjectEditBriefBundleRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ListProjectEditBriefMarkersApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  briefId: string
}

export interface GetProjectEditBriefMarkerApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  markerId: string
}

export interface CreateProjectEditBriefMarkerApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  briefId: string
  marker: Partial<ProjectEditBriefMarkerRecord>
}

export interface UpdateProjectEditBriefMarkerApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  markerId: string
  patch: Partial<ProjectEditBriefMarkerRecord>
}

export interface ProjectEditBriefApiRouteMarkerResponse {
  marker?: ProjectEditBriefMarkerRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteMarkersResponse {
  markers: ProjectEditBriefMarkerRecord[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteDeleteMarkerResponse {
  markerId: string
  deleted: boolean
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefMarkerAttachmentApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  markerId: string
  attachment?: Partial<ProjectEditBriefMarkerAttachmentRecord>
  attachmentId?: string
}

export interface ProjectEditBriefApiRouteAttachmentsResponse {
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteAttachmentResponse {
  attachment?: ProjectEditBriefMarkerAttachmentRecord
  attachmentId?: string
  removed?: boolean
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefMarkerMessageApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  markerId: string
  message?: Partial<ProjectEditBriefMarkerMessageRecord>
}

export interface ProjectEditBriefApiRouteMarkerMessagesResponse {
  messages: ProjectEditBriefMarkerMessageRecord[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteMarkerMessageResponse {
  message: ProjectEditBriefMarkerMessageRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefMarkerIntentApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  markerId: string
  intent?: Partial<ProjectEditBriefMarkerIntentRecord>
  intentId?: string
  patch?: Partial<ProjectEditBriefMarkerIntentRecord>
}

export interface ProjectEditBriefApiRouteMarkerIntentResponse {
  intent?: ProjectEditBriefMarkerIntentRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefMarkerConfirmationApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  markerId: string
  intentId?: string
  summary?: string
}

export interface ProjectEditBriefApiRouteMarkerConfirmationsResponse {
  confirmations: ProjectEditBriefMarkerConfirmationRecord[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteMarkerConfirmationResponse {
  confirmation: ProjectEditBriefMarkerConfirmationRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefMarkerConflictApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  briefId?: string
  markerId?: string
  conflict?: Partial<ProjectEditBriefMarkerConflictRecord>
}

export interface ProjectEditBriefApiRouteMarkerConflictsResponse {
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteMarkerConflictResponse {
  conflict: ProjectEditBriefMarkerConflictRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefMarkerRevisionApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  markerId: string
  revision?: Partial<import('../../types/project-edit-brief').ProjectEditBriefMarkerRevisionRecord>
}

export interface ProjectEditBriefApiRouteMarkerRevisionsResponse {
  revisions: import('../../types/project-edit-brief').ProjectEditBriefMarkerRevisionRecord[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteMarkerRevisionResponse {
  revision: import('../../types/project-edit-brief').ProjectEditBriefMarkerRevisionRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApplicationLogApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  briefId: string
  markerId?: string
  summary?: string
}

export interface ProjectEditBriefApiRouteApplicationLogsResponse {
  applicationLogs: ProjectEditBriefApplicationLogRecord[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteApplicationLogResponse {
  applicationLog: ProjectEditBriefApplicationLogRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefExportSettingsApiRouteRequest extends ProjectEditBriefRouteContextRequest {
  editSessionId: string
  exportSettingsId?: string
  patch?: Partial<ProjectEditSessionExportSettingsRecord>
}

export interface ProjectEditBriefApiRouteExportSettingsResponse {
  exportSettings?: ProjectEditSessionExportSettingsRecord
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteTimelineModelsResponse {
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[]
  meta: ProjectEditBriefApiRouteContractMeta
}

export interface ProjectEditBriefApiRouteMarkerDrawerResponse {
  drawer?: ProjectEditBriefMarkerDrawerModel
  meta: ProjectEditBriefApiRouteContractMeta
}
