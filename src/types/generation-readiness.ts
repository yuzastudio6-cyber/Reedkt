import type { ID } from './workflow-common'

export type GenerationReadinessStatus =
  | 'not_ready'
  | 'ready'
  | 'ready_with_warnings'
  | 'needs_review'
  | 'blocked'
  | 'approved'
  | 'generating'
  | 'preview_ready'
  | 'failed'

export type GenerationReadinessIssueSeverity =
  | 'info'
  | 'warning'
  | 'blocking'

export type GenerationReadinessIssueType =
  | 'missing_planning_context'
  | 'planning_context_blocked'
  | 'missing_context_aware_plan'
  | 'missing_professional_integration'
  | 'professional_integration_blocked'
  | 'professional_integration_not_accepted'
  | 'missing_professional_qa'
  | 'professional_qa_not_run'
  | 'professional_qa_blocked'
  | 'professional_qa_needs_review'
  | 'qa_warnings_not_accepted'
  | 'credit_estimate_missing'
  | 'approval_required'
  | 'other'

export type MockCreditEstimateLineItemType =
  | 'base_preview'
  | 'clean_assembly'
  | 'captions'
  | 'b_roll'
  | 'overlay'
  | 'professional_integration'
  | 'qa'
  | 'audio'
  | 'graphics'
  | 'real_motion'
  | 'stroke_motion'
  | 'export'
  | 'other'

export type MockPreviewJobStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'needs_attention'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type MockPreviewJobStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'warning'
  | 'failed'

export type MockPreviewJobStepKey =
  | 'read_planning_context'
  | 'validate_qa_readiness'
  | 'reserve_mock_credits'
  | 'prepare_render_inputs'
  | 'apply_professional_treatments'
  | 'build_preview_timeline'
  | 'run_final_preview_qa'
  | 'preview_ready'

export type GenerationApprovalStatus =
  | 'not_required'
  | 'required'
  | 'approved'
  | 'rejected'
  | 'expired'

export interface GenerationReadinessIssue {
  id: ID
  projectId: ID
  severity: GenerationReadinessIssueSeverity
  type: GenerationReadinessIssueType
  message: string
  suggestedAction?: string
  relatedPlanningContextId?: ID
  relatedProfessionalIntegrationPlanId?: ID
  relatedQaReportId?: ID
}

export interface MockCreditEstimateLineItem {
  id: ID
  type: MockCreditEstimateLineItemType
  label: string
  quantity: number
  credits: number
  explanation: string
}

export interface MockCreditEstimate {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: 'draft' | 'ready' | 'approved' | 'superseded'
  lineItems: MockCreditEstimateLineItem[]
  totalCredits: number
  freePreview?: boolean
  explanation: string
  createdAt: string
  updatedAt: string
}

export interface GenerationApproval {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  creditEstimateId?: ID
  status: GenerationApprovalStatus
  approvedAt?: string
  rejectedAt?: string
  acknowledgement: {
    acceptsMockCredits: boolean
    acceptsQaWarnings: boolean
    understandsPreviewIsMock: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface MockPreviewJobStep {
  id: ID
  key: MockPreviewJobStepKey
  label: string
  status: MockPreviewJobStepStatus
  progressPercent: number
  message: string
}

export interface MockPreviewJob {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: MockPreviewJobStatus
  planningContextId?: ID
  professionalIntegrationPlanId?: ID
  qaReportId?: ID
  creditEstimateId?: ID
  approvalId?: ID
  steps: MockPreviewJobStep[]
  progressPercent: number
  previewId?: ID
  previewLabel?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface GenerationReadinessState {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: GenerationReadinessStatus
  planningContextId?: ID
  professionalIntegrationPlanId?: ID
  qaReportId?: ID
  issues: GenerationReadinessIssue[]
  creditEstimate: MockCreditEstimate | null
  approval: GenerationApproval | null
  previewJob: MockPreviewJob | null
  canApprove: boolean
  canGenerate: boolean
  canPreviewProceed: boolean
  summary: string
  nextRecommendedActions: string[]
  createdAt: string
  updatedAt: string
}
