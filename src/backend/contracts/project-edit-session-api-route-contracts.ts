import type {
  ProjectEditSessionCardModel,
  ProjectEditSessionEventRecord,
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceRecord,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../../types/project-edit-session-repository'
import type {
  ProjectEditSessionApiRouteId,
  ReeditProApiRouteValidationResult,
} from '../../types/api-routes'
import type {
  AppendProjectEditSessionEventRepositoryInput,
  AppendProjectEditSessionMessageRepositoryInput,
  CreateProjectEditSessionRepositoryInput,
  DuplicateProjectEditSessionRepositoryInput,
  SaveProjectEditSessionPreviewRepositoryInput,
  SaveProjectEditSessionRevisionRepositoryInput,
  SaveProjectEditSessionSnapshotRepositoryInput,
  SaveProjectEditSessionSourceRepositoryInput,
  SaveProjectEditSessionSourcesRepositoryInput,
  SaveProjectEditSessionVersionRepositoryInput,
  UpdateProjectEditSessionRepositoryInput,
  UpsertProjectEditSessionMemoryRepositoryInput,
} from '../repositories/project-edit-session-repository'
import type { createProjectEditSessionRouteSafetyFlags } from '../api/project-edit-session-mock-route-handlers'

export type ProjectEditSessionRouteSafetyFlags = ReturnType<typeof createProjectEditSessionRouteSafetyFlags>

export interface ProjectEditSessionRouteResponseBase {
  mockOnly: true
  safety: ProjectEditSessionRouteSafetyFlags
  warnings: string[]
}

export interface ListProjectEditSessionsRouteRequest {
  projectId: string
  includeArchived?: boolean
  status?: string
}

export interface ListProjectEditSessionsRouteResponse extends ProjectEditSessionRouteResponseBase {
  sessions: ProjectEditSessionRecord[]
}

export interface GetProjectEditSessionRouteRequest {
  editSessionId: string
}

export interface GetProjectEditSessionRouteResponse extends ProjectEditSessionRouteResponseBase {
  session?: ProjectEditSessionRecord
}

export type CreateProjectEditSessionRouteRequest = CreateProjectEditSessionRepositoryInput

export interface CreateProjectEditSessionRouteResponse extends ProjectEditSessionRouteResponseBase {
  session: ProjectEditSessionRecord
}

export type UpdateProjectEditSessionRouteRequest = UpdateProjectEditSessionRepositoryInput

export interface UpdateProjectEditSessionRouteResponse extends ProjectEditSessionRouteResponseBase {
  session: ProjectEditSessionRecord
}

export interface ArchiveProjectEditSessionRouteRequest {
  editSessionId: string
}

export interface ArchiveProjectEditSessionRouteResponse extends ProjectEditSessionRouteResponseBase {
  session: ProjectEditSessionRecord
}

export type DuplicateProjectEditSessionRouteRequest = DuplicateProjectEditSessionRepositoryInput

export interface DuplicateProjectEditSessionRouteResponse extends ProjectEditSessionRouteResponseBase {
  session: ProjectEditSessionRecord
}

export interface ListProjectEditSessionMessagesRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionMessagesRouteResponse extends ProjectEditSessionRouteResponseBase {
  messages: ProjectEditSessionMessageRecord[]
}

export type AppendProjectEditSessionMessageRouteRequest = AppendProjectEditSessionMessageRepositoryInput

export interface AppendProjectEditSessionMessageRouteResponse extends ProjectEditSessionRouteResponseBase {
  message: ProjectEditSessionMessageRecord
}

export interface ListProjectEditSessionSourcesRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionSourcesRouteResponse extends ProjectEditSessionRouteResponseBase {
  sources: ProjectEditSessionSourceRecord[]
}

export type SaveProjectEditSessionSourceRouteRequest = SaveProjectEditSessionSourceRepositoryInput

export interface SaveProjectEditSessionSourceRouteResponse extends ProjectEditSessionRouteResponseBase {
  source: ProjectEditSessionSourceRecord
}

export type SaveProjectEditSessionSourcesRouteRequest = SaveProjectEditSessionSourcesRepositoryInput

export interface SaveProjectEditSessionSourcesRouteResponse extends ProjectEditSessionRouteResponseBase {
  sources: ProjectEditSessionSourceRecord[]
}

export interface ListProjectEditSessionMemoryRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionMemoryRouteResponse extends ProjectEditSessionRouteResponseBase {
  memories: ProjectEditSessionMemoryRecord[]
}

export interface GetProjectEditSessionMemoryLayerRouteRequest {
  editSessionId: string
  layer: ProjectEditSessionMemoryLayer
}

export interface GetProjectEditSessionMemoryLayerRouteResponse extends ProjectEditSessionRouteResponseBase {
  memory?: ProjectEditSessionMemoryRecord
}

export type UpsertProjectEditSessionMemoryRouteRequest = UpsertProjectEditSessionMemoryRepositoryInput

export interface UpsertProjectEditSessionMemoryRouteResponse extends ProjectEditSessionRouteResponseBase {
  memory: ProjectEditSessionMemoryRecord
}

export type SaveProjectEditSessionSnapshotRouteRequest = SaveProjectEditSessionSnapshotRepositoryInput

export interface SaveProjectEditSessionSnapshotRouteResponse extends ProjectEditSessionRouteResponseBase {
  snapshot: ProjectEditSessionSnapshotRecord
}

export interface ListProjectEditSessionSnapshotsRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionSnapshotsRouteResponse extends ProjectEditSessionRouteResponseBase {
  snapshots: ProjectEditSessionSnapshotRecord[]
}

export type SaveProjectEditSessionVersionRouteRequest = SaveProjectEditSessionVersionRepositoryInput

export interface SaveProjectEditSessionVersionRouteResponse extends ProjectEditSessionRouteResponseBase {
  version: ProjectEditSessionVersionRecord
}

export interface ListProjectEditSessionVersionsRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionVersionsRouteResponse extends ProjectEditSessionRouteResponseBase {
  versions: ProjectEditSessionVersionRecord[]
}

export type SaveProjectEditSessionPreviewRouteRequest = SaveProjectEditSessionPreviewRepositoryInput

export interface SaveProjectEditSessionPreviewRouteResponse extends ProjectEditSessionRouteResponseBase {
  preview: ProjectEditSessionPreviewRecord
}

export interface ListProjectEditSessionPreviewsRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionPreviewsRouteResponse extends ProjectEditSessionRouteResponseBase {
  previews: ProjectEditSessionPreviewRecord[]
}

export type SaveProjectEditSessionRevisionRouteRequest = SaveProjectEditSessionRevisionRepositoryInput

export interface SaveProjectEditSessionRevisionRouteResponse extends ProjectEditSessionRouteResponseBase {
  revision: ProjectEditSessionRevisionRecord
}

export interface ListProjectEditSessionRevisionsRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionRevisionsRouteResponse extends ProjectEditSessionRouteResponseBase {
  revisions: ProjectEditSessionRevisionRecord[]
}

export type AppendProjectEditSessionEventRouteRequest = AppendProjectEditSessionEventRepositoryInput

export interface AppendProjectEditSessionEventRouteResponse extends ProjectEditSessionRouteResponseBase {
  event: ProjectEditSessionEventRecord
}

export interface ListProjectEditSessionEventsRouteRequest {
  editSessionId: string
}

export interface ListProjectEditSessionEventsRouteResponse extends ProjectEditSessionRouteResponseBase {
  events: ProjectEditSessionEventRecord[]
}

export interface GetProjectEditSessionBundleRouteRequest {
  editSessionId: string
}

export interface GetProjectEditSessionBundleRouteResponse extends ProjectEditSessionRouteResponseBase {
  bundle: ProjectEditSessionBundleRecord
}

export interface CreateProjectEditSessionCardModelsRouteRequest {
  projectId: string
}

export interface CreateProjectEditSessionCardModelsRouteResponse extends ProjectEditSessionRouteResponseBase {
  cardModels: ProjectEditSessionCardModel[]
}

export interface GetProjectEditSessionCardModelRouteRequest {
  editSessionId: string
}

export interface GetProjectEditSessionCardModelRouteResponse extends ProjectEditSessionRouteResponseBase {
  cardModel: ProjectEditSessionCardModel
}

export interface GetProjectEditSessionSummaryRouteRequest {
  editSessionId: string
}

export interface GetProjectEditSessionSummaryRouteResponse extends ProjectEditSessionRouteResponseBase {
  editSessionId: string
  summary: string[]
  bundle?: ProjectEditSessionBundleRecord
}

export interface ValidateProjectEditSessionRouteRequest {
  routeId: ProjectEditSessionApiRouteId | string
}

export interface ValidateProjectEditSessionRouteResponse {
  routeId: string
  validation: ReeditProApiRouteValidationResult
}
