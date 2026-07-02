import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefBundleRecord,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefMarkerEligibilityResult,
  ProjectEditBriefMarkerPlanInstruction,
  ProjectEditBriefPlanApplicationResult,
  ProjectEditBriefPlanPanelModel,
  ProjectEditBriefPlanValidationResult,
  ProjectEditBriefPlannerInputPackage,
} from '../../types/project-edit-brief-plan'

export interface CreateProjectEditBriefPlanPolicyRequest {
  briefId?: string
}

export interface CreateProjectEditBriefPlanPolicyResponse {
  priorityPolicy: string[]
  summary: string
  mockOnly: true
}

export interface ClassifyProjectEditBriefMarkerEligibilityRequest {
  bundle: ProjectEditBriefBundleRecord
  markerId: string
}

export interface ClassifyProjectEditBriefMarkerEligibilityResponse {
  eligibility: ProjectEditBriefMarkerEligibilityResult
  mockOnly: true
}

export interface CreateProjectEditBriefPlanInstructionsRequest {
  bundle: ProjectEditBriefBundleRecord
}

export interface CreateProjectEditBriefPlanInstructionsResponse {
  instructions: ProjectEditBriefMarkerPlanInstruction[]
  mockOnly: true
}

export interface CreateProjectEditBriefPlannerInputPackageRequest {
  bundle: ProjectEditBriefBundleRecord
  exportSettings?: ProjectEditSessionExportSettingsRecord
  applicationLogSummary?: string
}

export interface CreateProjectEditBriefPlannerInputPackageResponse {
  package: ProjectEditBriefPlannerInputPackage
  mockOnly: true
}

export interface PrepareProjectEditBriefPlanHintsRequest {
  bundle: ProjectEditBriefBundleRecord
  exportSettings?: ProjectEditSessionExportSettingsRecord
  applicationLog?: ProjectEditBriefApplicationLogRecord
}

export interface PrepareProjectEditBriefPlanHintsResponse {
  result: ProjectEditBriefPlanApplicationResult
  mockOnly: true
}

export interface CreateProjectEditBriefPlanApplicationLogRequest {
  package: ProjectEditBriefPlannerInputPackage
}

export interface CreateProjectEditBriefPlanApplicationLogResponse {
  applicationLog: ProjectEditBriefApplicationLogRecord
  mockOnly: true
}

export interface CreateProjectEditBriefPlanPanelRequest {
  package: ProjectEditBriefPlannerInputPackage
}

export interface CreateProjectEditBriefPlanPanelResponse {
  panelModel: ProjectEditBriefPlanPanelModel
  mockOnly: true
}

export interface ValidateProjectEditBriefPlanRequest {
  package: ProjectEditBriefPlannerInputPackage
}

export interface ValidateProjectEditBriefPlanResponse {
  validation: ProjectEditBriefPlanValidationResult
  mockOnly: true
}

export interface CreateProjectEditBriefPlanSummaryRequest {
  package: ProjectEditBriefPlannerInputPackage
}

export interface CreateProjectEditBriefPlanSummaryResponse {
  summary: string
  mockOnly: true
}
