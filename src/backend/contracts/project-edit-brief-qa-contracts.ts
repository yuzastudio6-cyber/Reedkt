import type {
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefQAStatus,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefQAFinding,
  ProjectEditBriefQAPackage,
  ProjectEditBriefQAValidationResult,
  ProjectEditBriefMarkerQAPackage,
  ProjectEditBriefQASummaryModel,
} from '../../types/project-edit-brief-qa'

export interface RunProjectEditBriefQARequest {
  projectId: string
  editSessionId: string
  briefId: string
  mockOnly: true
}

export interface RunProjectEditBriefQAResponse {
  qaPackage: ProjectEditBriefQAPackage
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  validation: ProjectEditBriefQAValidationResult
  mockOnly: true
}

export interface RunProjectEditBriefMarkerQARequest {
  markerId: string
  mockOnly: true
}

export interface RunProjectEditBriefMarkerQAResponse {
  markerPackage: ProjectEditBriefMarkerQAPackage
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  validation: ProjectEditBriefQAValidationResult
  mockOnly: true
}

export interface CreateProjectEditBriefQAPackageRequest {
  briefId: string
  mockOnly: true
}

export interface CreateProjectEditBriefQAPackageResponse {
  qaPackage: ProjectEditBriefQAPackage
  mockOnly: true
}

export interface SaveProjectEditBriefQAConflictsRequest {
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  mockOnly: true
}

export interface SaveProjectEditBriefQAConflictsResponse {
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  mockOnly: true
}

export interface UpdateProjectEditBriefMarkerQAStatusRequest {
  markerId: string
  qaStatus: ProjectEditBriefQAStatus
  mockOnly: true
}

export interface UpdateProjectEditBriefMarkerQAStatusResponse {
  markerId: string
  qaStatus: ProjectEditBriefQAStatus
  mockOnly: true
}

export interface ValidateProjectEditBriefQARequest {
  qaPackage?: ProjectEditBriefQAPackage
  finding?: ProjectEditBriefQAFinding
  mockOnly: true
}

export interface ValidateProjectEditBriefQAResponse {
  validation: ProjectEditBriefQAValidationResult
  mockOnly: true
}

export interface CreateProjectEditBriefQASummaryRequest {
  qaPackage: ProjectEditBriefQAPackage
  mockOnly: true
}

export interface CreateProjectEditBriefQASummaryResponse {
  summary: ProjectEditBriefQASummaryModel
  mockOnly: true
}
