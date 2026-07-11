import type { ID } from './workflow-common'

export type ProfessionalQaStatus =
  | 'not_run'
  | 'running'
  | 'passed'
  | 'needs_review'
  | 'blocked'
  | 'accepted_with_warnings'
  | 'failed'

export type ProfessionalQaItemStatus =
  | 'passed'
  | 'warning'
  | 'blocking'
  | 'info'
  | 'accepted_warning'

export type ProfessionalQaCategory =
  | 'planning_readiness'
  | 'cue_compliance'
  | 'professional_integration'
  | 'asset_treatment'
  | 'broll_treatment'
  | 'overlay_composition'
  | 'caption_safety'
  | 'face_safety'
  | 'privacy'
  | 'audio'
  | 'readability'
  | 'safe_zone'
  | 'timing'
  | 'style_consistency'
  | 'source_integrity'
  | 'other'

export type ProfessionalQaIssueType =
  | 'planning_context_blocked'
  | 'professional_integration_missing'
  | 'professional_integration_blocked'
  | 'unresolved_cue_conflict'
  | 'cue_compliance_failed'
  | 'untreated_cue'
  | 'untreated_asset'
  | 'raw_edge_overlay_risk'
  | 'caption_collision_risk'
  | 'face_collision_risk'
  | 'unsafe_zone_risk'
  | 'unreadable_text_risk'
  | 'privacy_blur_missing'
  | 'broll_audio_conflict'
  | 'hard_audio_cut_risk'
  | 'bad_crop_risk'
  | 'low_resolution_risk'
  | 'stabilization_needed'
  | 'color_match_missing'
  | 'timing_too_short'
  | 'timing_too_long'
  | 'source_mapping_missing'
  | 'do_not_use_asset_in_plan'
  | 'style_consistency_warning'
  | 'passed_check'
  | 'other'

export type ProfessionalQaOperationType =
  | 'run_qa'
  | 'rerun_qa'
  | 'accept_warning'
  | 'accept_all_warnings'
  | 'mark_reviewed'
  | 'reset_qa'

export type ProfessionalQaOperationStatus =
  | 'pending'
  | 'applied'
  | 'reverted'

export interface ProfessionalQaReportItem {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  reportId: ID
  category: ProfessionalQaCategory
  type: ProfessionalQaIssueType
  status: ProfessionalQaItemStatus
  title: string
  message: string
  suggestedAction?: string
  relatedEditCueId?: ID
  relatedMediaAssetId?: ID
  relatedConflictId?: ID
  relatedTreatmentPlanId?: ID
  relatedComplianceCheckId?: ID
  acceptedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ProfessionalQaReport {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  planningContextId?: ID
  professionalIntegrationPlanId?: ID
  status: ProfessionalQaStatus
  itemIds: ID[]
  summary: string
  blockingCount: number
  warningCount: number
  passedCount: number
  acceptedWarningCount: number
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ProfessionalQaOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  reportId?: ID
  itemId?: ID
  type: ProfessionalQaOperationType
  status: ProfessionalQaOperationStatus
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  patch?: Record<string, unknown>
  explanation?: string
}

export interface ProfessionalQaSummary {
  status: ProfessionalQaStatus
  totalItems: number
  blockingCount: number
  warningCount: number
  infoCount: number
  passedCount: number
  acceptedWarningCount: number
  categories: Array<{
    category: ProfessionalQaCategory
    total: number
    blocking: number
    warning: number
    passed: number
    info: number
  }>
  previewReadiness:
    | 'ready'
    | 'ready_with_warnings'
    | 'needs_review'
    | 'blocked'
    | 'not_run'
  nextRecommendedActions: string[]
}

export interface ProfessionalQaState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  report: ProfessionalQaReport | null
  items: ProfessionalQaReportItem[]
  operations: ProfessionalQaOperation[]
  summary: ProfessionalQaSummary
  updatedAt: string
}
