import type {
  ProjectEditBriefApplicationLogRecord,
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
  ProjectEditBriefRepositoryBundleRecord,
  ProjectEditBriefRepositoryContext,
  ProjectEditBriefRepositoryResult,
} from '../../types/project-edit-brief-repository'

export interface CreateProjectEditBriefRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  title: string
  summary?: string
  exportSettingsId?: string
  metadata?: Record<string, unknown>
}

export interface UpdateProjectEditBriefRepositoryInput {
  briefId: string
  patch: Partial<Pick<
    ProjectEditBriefRecord,
    | 'status'
    | 'availability'
    | 'title'
    | 'summary'
    | 'exportSettingsId'
    | 'lastOpenedAt'
    | 'metadata'
  >>
}

export interface CreateProjectEditBriefMarkerRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  marker: Omit<ProjectEditBriefMarkerRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'attachmentCount' | 'messageCount' | 'createdAt' | 'updatedAt' | 'mockOnly'> & {
    createdAt?: string
    updatedAt?: string
  }
}

export interface UpdateProjectEditBriefMarkerRepositoryInput {
  markerId: string
  patch: Partial<ProjectEditBriefMarkerRecord>
}

export interface ConfirmProjectEditBriefMarkerRepositoryInput {
  markerId: string
  intentId?: string
  summary: string
}

export interface AddProjectEditBriefMarkerAttachmentRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  attachment: Omit<ProjectEditBriefMarkerAttachmentRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'updatedAt' | 'mockOnly'> & {
    createdAt?: string
    updatedAt?: string
  }
}

export interface AppendProjectEditBriefMarkerMessageRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  message: Omit<ProjectEditBriefMarkerMessageRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'mockOnly'> & {
    createdAt?: string
  }
}

export interface SaveProjectEditBriefMarkerIntentRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  intent: Omit<ProjectEditBriefMarkerIntentRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'updatedAt' | 'mockOnly'> & {
    createdAt?: string
    updatedAt?: string
  }
}

export interface UpdateProjectEditBriefMarkerIntentRepositoryInput {
  intentId: string
  patch: Partial<ProjectEditBriefMarkerIntentRecord>
}

export interface SaveProjectEditBriefMarkerConfirmationRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  intentId: string
  summary: string
  confirmedByUser?: boolean
  aiMode?: ProjectEditBriefMarkerConfirmationRecord['aiMode']
  createdAt?: string
  metadata?: Record<string, unknown>
}

export interface ListProjectEditBriefMarkerConflictsRepositoryInput {
  briefId?: string
  markerId?: string
}

export interface SaveProjectEditBriefMarkerConflictRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  conflict: Omit<ProjectEditBriefMarkerConflictRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'mockOnly'> & {
    createdAt?: string
  }
}

export interface SaveProjectEditBriefMarkerRevisionRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  revision: Omit<ProjectEditBriefMarkerRevisionRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'mockOnly'> & {
    createdAt?: string
  }
}

export interface AppendProjectEditBriefApplicationLogRepositoryInput {
  id?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId?: string
  summary: string
  appliedToPlan?: boolean
  createdAt?: string
  metadata?: Record<string, unknown>
}

export interface RecommendProjectEditSessionExportSettingsRepositoryInput {
  projectId: string
  editSessionId: string
  platformTarget?: ProjectEditSessionExportSettingsRecord['platformTarget']
  aspectRatio?: ProjectEditSessionExportSettingsRecord['aspectRatio']
  customAspectRatio?: ProjectEditSessionExportSettingsRecord['customAspectRatio']
  presetId?: ProjectEditSessionExportSettingsRecord['deliveryPreset']
}

export interface UpdateProjectEditSessionExportSettingsRepositoryInput {
  editSessionId: string
  exportSettingsId?: string
  patch: Partial<ProjectEditSessionExportSettingsRecord>
}

export interface ProjectEditBriefRepository {
  readonly context: ProjectEditBriefRepositoryContext

  getEditBrief(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>>
  getEditBriefForSession(editSessionId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>>
  createEditBrief(input: CreateProjectEditBriefRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>>
  updateEditBrief(input: UpdateProjectEditBriefRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>>
  archiveEditBrief(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>>

  listMarkers(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord[]>>
  getMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord | undefined>>
  createMarker(input: CreateProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>>
  updateMarker(input: UpdateProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>>
  deleteMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<{ markerId: string; deleted: true }>>
  confirmMarker(input: ConfirmProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>>
  archiveMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>>

  listMarkerAttachments(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord[]>>
  addMarkerAttachment(input: AddProjectEditBriefMarkerAttachmentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord>>
  removeMarkerAttachment(attachmentId: string): Promise<ProjectEditBriefRepositoryResult<{ attachmentId: string; removed: true }>>

  listMarkerMessages(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord[]>>
  appendMarkerMessage(input: AppendProjectEditBriefMarkerMessageRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord>>

  getMarkerIntent(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord | undefined>>
  saveMarkerIntent(input: SaveProjectEditBriefMarkerIntentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord>>
  updateMarkerIntent(input: UpdateProjectEditBriefMarkerIntentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord>>

  listMarkerConfirmations(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord[]>>
  saveMarkerConfirmation(input: SaveProjectEditBriefMarkerConfirmationRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord>>

  listMarkerConflicts(input: ListProjectEditBriefMarkerConflictsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord[]>>
  saveMarkerConflict(input: SaveProjectEditBriefMarkerConflictRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord>>

  listMarkerRevisions(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord[]>>
  saveMarkerRevision(input: SaveProjectEditBriefMarkerRevisionRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord>>

  listApplicationLogs(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord[]>>
  appendApplicationLog(input: AppendProjectEditBriefApplicationLogRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord>>

  getExportSettings(editSessionId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord | undefined>>
  recommendExportSettings(input: RecommendProjectEditSessionExportSettingsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>>
  updateExportSettings(input: UpdateProjectEditSessionExportSettingsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>>

  createTimelineMarkerModels(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefTimelineMarkerModel[]>>
  createMarkerDrawerModel(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerDrawerModel>>
  createBriefBundle(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRepositoryBundleRecord>>
  createBriefSummary(briefId: string): Promise<ProjectEditBriefRepositoryResult<string>>
}
