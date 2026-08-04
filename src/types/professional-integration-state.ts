import type {
  AssetTreatmentPlan,
  BrollIntegrationPlan,
  CueComplianceCheck,
  OverlayCompositionPlan,
  ProfessionalIntegrationPlan,
} from './professional-integration'
import type { ID } from './workflow-common'

export type ProfessionalIntegrationOperationType =
  | 'create_integration_plan'
  | 'regenerate_integration_plan'
  | 'accept_integration_plan'
  | 'accept_asset_treatment'
  | 'accept_broll_treatment'
  | 'accept_overlay_treatment'
  | 'accept_cue_compliance'
  | 'mark_needs_review'
  | 'reset_integration_plan'

export type ProfessionalIntegrationOperationStatus =
  | 'pending'
  | 'applied'
  | 'reverted'

export type ProfessionalIntegrationReadinessStatus =
  | 'draft'
  | 'ready'
  | 'needs_review'
  | 'blocked'
  | 'accepted'

export type ProfessionalIntegrationIssueSeverity =
  | 'info'
  | 'warning'
  | 'blocking'

export type ProfessionalIntegrationIssueType =
  | 'missing_planning_context'
  | 'planning_context_blocked'
  | 'unresolved_cue_conflicts'
  | 'untreated_must_follow_cue'
  | 'untreated_must_use_asset'
  | 'privacy_blur_required'
  | 'caption_collision_risk'
  | 'face_collision_risk'
  | 'audio_conflict_risk'
  | 'low_resolution_risk'
  | 'raw_edge_treatment_risk'
  | 'missing_overlay_treatment'
  | 'missing_broll_treatment'
  | 'other'

export interface ProfessionalIntegrationOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  professionalIntegrationPlanId?: ID
  type: ProfessionalIntegrationOperationType
  status: ProfessionalIntegrationOperationStatus
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  patch?: Record<string, unknown>
  explanation?: string
}

export interface ProfessionalIntegrationIssue {
  id: ID
  projectId: ID
  severity: ProfessionalIntegrationIssueSeverity
  type: ProfessionalIntegrationIssueType
  message: string
  suggestedAction?: string
  relatedEditCueId?: ID
  relatedMediaAssetId?: ID
  relatedTreatmentPlanId?: ID
}

export interface ProfessionalIntegrationSummary {
  status: ProfessionalIntegrationReadinessStatus
  assetTreatmentCount: number
  brollTreatmentCount: number
  overlayTreatmentCount: number
  cueComplianceCheckCount: number
  passedCueComplianceCount: number
  warningCueComplianceCount: number
  failedCueComplianceCount: number
  qaRiskCount: number
  blockingIssueCount: number
  warningIssueCount: number
  accepted: boolean
  nextRecommendedActions: string[]
}

export interface ProfessionalIntegrationState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  planningContextId?: ID
  professionalIntegrationPlan: ProfessionalIntegrationPlan | null
  assetTreatmentPlans: AssetTreatmentPlan[]
  brollIntegrationPlans: BrollIntegrationPlan[]
  overlayCompositionPlans: OverlayCompositionPlan[]
  cueComplianceChecks: CueComplianceCheck[]
  issues: ProfessionalIntegrationIssue[]
  operations: ProfessionalIntegrationOperation[]
  summary: ProfessionalIntegrationSummary
  updatedAt: string
}
