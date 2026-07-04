import type {
  ProjectEditSessionBundleRecord,
  ProjectEditSessionRepositoryContext,
  ProjectEditSessionRepositoryResult,
} from '../../types/project-edit-session-repository'
import type {
  ProjectEditSessionCardModel,
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageKind,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionRecord,
} from '../../types/project-edit-session'
import type {
  AppendProjectEditSessionMessageRepositoryInput,
  CreateProjectEditSessionRepositoryInput,
  DuplicateProjectEditSessionRepositoryInput,
  UpdateProjectEditSessionRepositoryInput,
  UpsertProjectEditSessionMemoryRepositoryInput,
} from '../repositories/project-edit-session-repository'

export interface ProjectEditSessionRepositoryContractMeta {
  mockOnly: true
  repositoryLayerOnly: true
  apiHandlerImplemented: false
  uiBehaviorChanged: false
  supabaseCommandRun: false
  migrationCreated: false
  warnings: string[]
}

export interface ListProjectEditSessionsRepositoryRequest {
  projectId: string
  status?: ProjectEditSessionRecord['status']
  includeArchived?: boolean
  mockOnly: true
}

export interface ListProjectEditSessionsRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionRecord[]>
  cardModels?: ProjectEditSessionCardModel[]
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface GetProjectEditSessionRepositoryRequest {
  editSessionId: string
  mockOnly: true
}

export interface GetProjectEditSessionRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionRecord | undefined>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface CreateProjectEditSessionRepositoryRequest {
  input: CreateProjectEditSessionRepositoryInput
  mockOnly: true
}

export interface CreateProjectEditSessionRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface UpdateProjectEditSessionRepositoryRequest {
  input: UpdateProjectEditSessionRepositoryInput
  mockOnly: true
}

export interface UpdateProjectEditSessionRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface ArchiveProjectEditSessionRepositoryRequest {
  editSessionId: string
  mockOnly: true
}

export interface ArchiveProjectEditSessionRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>
  archived: boolean
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface DuplicateProjectEditSessionRepositoryRequest {
  input: DuplicateProjectEditSessionRepositoryInput
  mockOnly: true
}

export interface DuplicateProjectEditSessionRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface ListProjectEditSessionMessagesRepositoryRequest {
  editSessionId: string
  kind?: ProjectEditSessionMessageKind
  mockOnly: true
}

export interface ListProjectEditSessionMessagesRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord[]>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface AppendProjectEditSessionMessageRepositoryRequest {
  input: AppendProjectEditSessionMessageRepositoryInput
  mockOnly: true
}

export interface AppendProjectEditSessionMessageRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface ListProjectEditSessionMemoryRepositoryRequest {
  editSessionId: string
  layer?: ProjectEditSessionMemoryLayer
  mockOnly: true
}

export interface ListProjectEditSessionMemoryRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord[]>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface UpsertProjectEditSessionMemoryRepositoryRequest {
  input: UpsertProjectEditSessionMemoryRepositoryInput
  mockOnly: true
}

export interface UpsertProjectEditSessionMemoryRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface CreateProjectEditSessionBundleRepositoryRequest {
  editSessionId: string
  mockOnly: true
}

export interface CreateProjectEditSessionBundleRepositoryResponse {
  result: ProjectEditSessionRepositoryResult<ProjectEditSessionBundleRecord>
  meta: ProjectEditSessionRepositoryContractMeta
}

export interface ValidateProjectEditSessionRepositoryRequest {
  context: ProjectEditSessionRepositoryContext
  result?: ProjectEditSessionRepositoryResult<unknown>
  bundle?: ProjectEditSessionBundleRecord
  mockOnly: true
}

export interface ValidateProjectEditSessionRepositoryResponse {
  ok: boolean
  summary: string[]
  meta: ProjectEditSessionRepositoryContractMeta
}
