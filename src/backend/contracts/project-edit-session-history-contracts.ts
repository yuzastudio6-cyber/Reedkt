import type {
  ProjectEditSessionHistoryActionPlan,
  ProjectEditSessionHistoryPackage,
  ProjectEditSessionHistoryValidationResult,
} from '../../types/project-edit-session-history'
import type {
  ProjectEditSessionEventRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'

export interface CreateProjectEditSessionHistoryActionPlanRequest {
  projectId: string
  editSessionId: string
  action: ProjectEditSessionHistoryActionPlan['action']
}

export interface CreateProjectEditSessionHistoryActionPlanResponse {
  actionPlan: ProjectEditSessionHistoryActionPlan
  validation: ProjectEditSessionHistoryValidationResult
}

export interface CreateProjectEditSessionSnapshotHistoryRequest {
  projectId: string
  editSessionId: string
  summary?: string
}

export interface CreateProjectEditSessionSnapshotHistoryResponse {
  snapshots: ProjectEditSessionSnapshotRecord[]
  validation: ProjectEditSessionHistoryValidationResult
}

export interface CreateProjectEditSessionVersionHistoryRequest {
  projectId: string
  editSessionId: string
  versionId?: string
}

export interface CreateProjectEditSessionVersionHistoryResponse {
  versions: ProjectEditSessionVersionRecord[]
  validation: ProjectEditSessionHistoryValidationResult
}

export interface CreateProjectEditSessionPreviewHistoryRequest {
  projectId: string
  editSessionId: string
  versionId?: string
}

export interface CreateProjectEditSessionPreviewHistoryResponse {
  previews: ProjectEditSessionPreviewRecord[]
  validation: ProjectEditSessionHistoryValidationResult
}

export interface CreateProjectEditSessionRevisionHistoryRequest {
  projectId: string
  editSessionId: string
  messageId: string
  messageText: string
}

export interface CreateProjectEditSessionRevisionHistoryResponse {
  revisions: ProjectEditSessionRevisionRecord[]
  validation: ProjectEditSessionHistoryValidationResult
}

export interface CreateProjectEditSessionHistoryPackageRequest {
  editSessionId: string
}

export interface CreateProjectEditSessionHistoryPackageResponse {
  historyPackage: ProjectEditSessionHistoryPackage
  validation: ProjectEditSessionHistoryValidationResult
}

export interface ValidateProjectEditSessionHistoryRequest {
  actionPlan?: ProjectEditSessionHistoryActionPlan
  historyPackage?: ProjectEditSessionHistoryPackage
}

export interface ValidateProjectEditSessionHistoryResponse {
  validation: ProjectEditSessionHistoryValidationResult
}

export interface CreateProjectEditSessionHistorySummaryRequest {
  historyPackage: ProjectEditSessionHistoryPackage
}

export interface CreateProjectEditSessionHistorySummaryResponse {
  readableSummary: string
  debugSummary: {
    counts: Record<string, number>
    latestIds: Record<string, string | undefined>
    mockOnly: true
    warnings: string[]
  }
}

export interface AppendProjectEditSessionHistoryEventRequest {
  projectId: string
  editSessionId: string
  eventType: string
  summary: string
}

export interface AppendProjectEditSessionHistoryEventResponse {
  event: ProjectEditSessionEventRecord
  validation: ProjectEditSessionHistoryValidationResult
}
