import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionCardModel,
  ProjectEditSessionEventRecord,
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageKind,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionMessageRole,
  ProjectEditSessionPlatformTarget,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionPreviewStatus,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotKind,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceImportance,
  ProjectEditSessionSourceRecord,
  ProjectEditSessionStatus,
  ProjectEditSessionVersionRecord,
  ProjectEditSessionVersionStatus,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionBundleRecord,
  ProjectEditSessionRepositoryContext,
  ProjectEditSessionRepositoryResult,
} from '../../types/project-edit-session-repository'
import type { UserFacingEditLevel } from '../../types/reeditpro'

export interface ListProjectEditSessionsRepositoryInput {
  projectId: string
  status?: ProjectEditSessionStatus
  includeArchived?: boolean
}

export interface CreateProjectEditSessionRepositoryInput {
  id?: string
  projectId: string
  workspaceId?: string
  ownerUserId?: string
  name: string
  description?: string
  status?: ProjectEditSessionStatus
  aspectRatio?: ProjectEditSessionAspectRatio
  customAspectRatio?: { width: number; height: number }
  platformTarget?: ProjectEditSessionPlatformTarget
  thumbnailUrl?: string
  sourceMediaAssetIds?: string[]
  selectedEditLevel?: UserFacingEditLevel
  selectedEditPreferenceId?: string
  selectedPreferenceVersionId?: string
  selectedEditPreferenceHandle?: string
  metadata?: Record<string, unknown>
}

export interface UpdateProjectEditSessionRepositoryInput {
  editSessionId: string
  patch: Partial<Pick<
    ProjectEditSessionRecord,
    | 'name'
    | 'description'
    | 'status'
    | 'aspectRatio'
    | 'customAspectRatio'
    | 'platformTarget'
    | 'thumbnailUrl'
    | 'latestPreviewUrl'
    | 'sourceMediaAssetIds'
    | 'selectedEditLevel'
    | 'selectedEditPreferenceId'
    | 'selectedPreferenceVersionId'
    | 'selectedEditPreferenceHandle'
    | 'preferenceDNAApplicationId'
    | 'dnaStatusLabel'
    | 'dnaQAStatusLabel'
    | 'doNotCopyRulesActive'
    | 'approvalStatus'
    | 'lastOpenedAt'
    | 'metadata'
  >>
}

export interface DuplicateProjectEditSessionRepositoryInput {
  editSessionId: string
  newId?: string
  newName?: string
  projectId?: string
}

export interface AppendProjectEditSessionMessageRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  role: ProjectEditSessionMessageRole
  kind: ProjectEditSessionMessageKind
  text: string
  createdAt?: string
  relatedSnapshotId?: string
  relatedVersionId?: string
  relatedPreviewId?: string
  metadata?: Record<string, unknown>
}

export interface SaveProjectEditSessionSourceRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  mediaAssetId: string
  sourceOrderIndex: number
  label?: string
  notes?: string[]
  importance?: ProjectEditSessionSourceImportance
  thumbnailUrl?: string
  previewUrl?: string
  durationSeconds?: number
  mimeType?: string
}

export interface SaveProjectEditSessionSourcesRepositoryInput {
  editSessionId: string
  sources: SaveProjectEditSessionSourceRepositoryInput[]
}

export interface GetProjectEditSessionMemoryLayerRepositoryInput {
  editSessionId: string
  layer: ProjectEditSessionMemoryLayer
}

export interface UpsertProjectEditSessionMemoryRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  layer: ProjectEditSessionMemoryLayer
  summary: string
  facts?: string[]
  preferences?: string[]
  warnings?: string[]
  updatedFromMessageId?: string
  updatedFromRevisionId?: string
  metadata?: Record<string, unknown>
}

export interface SaveProjectEditSessionSnapshotRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  kind: ProjectEditSessionSnapshotKind
  versionNumber?: number
  messageId?: string
  summary: string
  state?: Record<string, unknown>
  createdAt?: string
}

export interface SaveProjectEditSessionVersionRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  versionNumber?: number
  status?: ProjectEditSessionVersionStatus
  name: string
  summary: string
  createdFromSnapshotId?: string
  createdFromMessageId?: string
  previewId?: string
  approvalStatus?: ProjectEditSessionApprovalStatus
  metadata?: Record<string, unknown>
}

export interface SaveProjectEditSessionPreviewRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  versionId?: string
  status?: ProjectEditSessionPreviewStatus
  thumbnailUrl?: string
  previewUrl?: string
  aspectRatio: ProjectEditSessionAspectRatio
  durationSeconds?: number
  metadata?: Record<string, unknown>
}

export interface SaveProjectEditSessionRevisionRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  requestedByMessageId: string
  summary: string
  userInstruction: string
  resetsApproval: boolean
  createdSnapshotId?: string
  createdVersionId?: string
  metadata?: Record<string, unknown>
}

export interface AppendProjectEditSessionEventRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  eventType: string
  summary: string
  createdAt?: string
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionRepository {
  readonly context: ProjectEditSessionRepositoryContext

  listProjectEditSessions(input: ListProjectEditSessionsRepositoryInput | string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord[]>>
  getProjectEditSession(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord | undefined>>
  createProjectEditSession(input: CreateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>>
  updateProjectEditSession(input: UpdateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>>
  archiveProjectEditSession(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>>
  duplicateProjectEditSession(input: DuplicateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>>

  listSessionMessages(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord[]>>
  appendSessionMessage(input: AppendProjectEditSessionMessageRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord>>

  listSessionSources(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord[]>>
  saveSessionSource(input: SaveProjectEditSessionSourceRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord>>
  saveSessionSources(input: SaveProjectEditSessionSourcesRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord[]>>

  listSessionMemory(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord[]>>
  getSessionMemoryLayer(input: GetProjectEditSessionMemoryLayerRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord | undefined>>
  upsertSessionMemory(input: UpsertProjectEditSessionMemoryRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord>>

  saveSessionSnapshot(input: SaveProjectEditSessionSnapshotRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord>>
  getLatestSessionSnapshot(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord | undefined>>
  listSessionSnapshots(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord[]>>

  saveSessionVersion(input: SaveProjectEditSessionVersionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord>>
  listSessionVersions(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord[]>>
  getLatestSessionVersion(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord | undefined>>

  saveSessionPreview(input: SaveProjectEditSessionPreviewRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord>>
  listSessionPreviews(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord[]>>
  getLatestSessionPreview(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord | undefined>>

  saveSessionRevision(input: SaveProjectEditSessionRevisionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRevisionRecord>>
  listSessionRevisions(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRevisionRecord[]>>

  appendSessionEvent(input: AppendProjectEditSessionEventRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionEventRecord>>
  listSessionEvents(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionEventRecord[]>>

  createSessionCardModel(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionCardModel>>
  listSessionCardModels(projectId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionCardModel[]>>
  createSessionBundle(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionBundleRecord>>
}
