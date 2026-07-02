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
  ProjectEditBriefMarkerRevisionRecord,
  ProjectEditBriefRecord,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefRepositoryContext,
  ProjectEditBriefRepositoryResult,
} from '../../types/project-edit-brief-repository'
import type {
  AddProjectEditBriefMarkerAttachmentRepositoryInput,
  AppendProjectEditBriefApplicationLogRepositoryInput,
  AppendProjectEditBriefMarkerMessageRepositoryInput,
  ConfirmProjectEditBriefMarkerRepositoryInput,
  CreateProjectEditBriefMarkerRepositoryInput,
  CreateProjectEditBriefRepositoryInput,
  ListProjectEditBriefMarkerConflictsRepositoryInput,
  RecommendProjectEditSessionExportSettingsRepositoryInput,
  SaveProjectEditBriefMarkerConfirmationRepositoryInput,
  SaveProjectEditBriefMarkerConflictRepositoryInput,
  SaveProjectEditBriefMarkerIntentRepositoryInput,
  SaveProjectEditBriefMarkerRevisionRepositoryInput,
  UpdateProjectEditBriefMarkerIntentRepositoryInput,
  UpdateProjectEditBriefMarkerRepositoryInput,
  UpdateProjectEditBriefRepositoryInput,
  UpdateProjectEditSessionExportSettingsRepositoryInput,
} from '../repositories/project-edit-brief-repository'

export interface ProjectEditBriefRepositoryContractMeta {
  mockOnly: true
  repositoryLayerOnly: true
  apiHandlerImplemented: false
  uiBehaviorChanged: false
  supabaseCommandRun: false
  migrationCreated: false
  warnings: string[]
}

export interface ProjectEditBriefRepositoryRequestBase {
  mockOnly: true
}

export interface GetProjectEditBriefRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  briefId: string
}

export interface GetProjectEditBriefForSessionRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  editSessionId: string
}

export interface CreateProjectEditBriefRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: CreateProjectEditBriefRepositoryInput
}

export interface UpdateProjectEditBriefRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: UpdateProjectEditBriefRepositoryInput
}

export interface ArchiveProjectEditBriefRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  briefId: string
}

export interface ProjectEditBriefRecordRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefRequiredRecordRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ListProjectEditBriefMarkersRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  briefId: string
}

export interface GetProjectEditBriefMarkerRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  markerId: string
}

export interface CreateProjectEditBriefMarkerRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: CreateProjectEditBriefMarkerRepositoryInput
}

export interface UpdateProjectEditBriefMarkerRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: UpdateProjectEditBriefMarkerRepositoryInput
}

export interface DeleteProjectEditBriefMarkerRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  markerId: string
}

export interface ConfirmProjectEditBriefMarkerRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: ConfirmProjectEditBriefMarkerRepositoryInput
}

export interface ProjectEditBriefMarkersRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefMarkerRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord | undefined>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefRequiredMarkerRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefMarkerDeleteRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<{ markerId: string; deleted: true }>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface AddProjectEditBriefMarkerAttachmentRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: AddProjectEditBriefMarkerAttachmentRepositoryInput
}

export interface ProjectEditBriefMarkerAttachmentsRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefMarkerAttachmentRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface AppendProjectEditBriefMarkerMessageRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: AppendProjectEditBriefMarkerMessageRepositoryInput
}

export interface ProjectEditBriefMarkerMessagesRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefMarkerMessageRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface SaveProjectEditBriefMarkerIntentRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: SaveProjectEditBriefMarkerIntentRepositoryInput
}

export interface UpdateProjectEditBriefMarkerIntentRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: UpdateProjectEditBriefMarkerIntentRepositoryInput
}

export interface ProjectEditBriefMarkerIntentRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord | undefined>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefRequiredMarkerIntentRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface SaveProjectEditBriefMarkerConfirmationRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: SaveProjectEditBriefMarkerConfirmationRepositoryInput
}

export interface ProjectEditBriefMarkerConfirmationsRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefMarkerConfirmationRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ListProjectEditBriefMarkerConflictsRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: ListProjectEditBriefMarkerConflictsRepositoryInput
}

export interface SaveProjectEditBriefMarkerConflictRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: SaveProjectEditBriefMarkerConflictRepositoryInput
}

export interface ProjectEditBriefMarkerConflictsRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefMarkerConflictRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface SaveProjectEditBriefMarkerRevisionRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: SaveProjectEditBriefMarkerRevisionRepositoryInput
}

export interface ProjectEditBriefMarkerRevisionsRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefMarkerRevisionRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface AppendProjectEditBriefApplicationLogRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: AppendProjectEditBriefApplicationLogRepositoryInput
}

export interface ProjectEditBriefApplicationLogsRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefApplicationLogRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface RecommendProjectEditSessionExportSettingsRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: RecommendProjectEditSessionExportSettingsRepositoryInput
}

export interface UpdateProjectEditSessionExportSettingsRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  input: UpdateProjectEditSessionExportSettingsRepositoryInput
}

export interface ProjectEditSessionExportSettingsRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord | undefined>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditSessionRequiredExportSettingsRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefTimelineRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefTimelineMarkerModel[]>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefDrawerRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerDrawerModel>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ProjectEditBriefBundleRepositoryResponse {
  result: ProjectEditBriefRepositoryResult<ProjectEditBriefBundleRecord>
  meta: ProjectEditBriefRepositoryContractMeta
}

export interface ValidateProjectEditBriefRepositoryRequest extends ProjectEditBriefRepositoryRequestBase {
  context: ProjectEditBriefRepositoryContext
  result?: ProjectEditBriefRepositoryResult<unknown>
  bundle?: ProjectEditBriefBundleRecord
}

export interface ValidateProjectEditBriefRepositoryResponse {
  ok: boolean
  summary: string[]
  meta: ProjectEditBriefRepositoryContractMeta
}
