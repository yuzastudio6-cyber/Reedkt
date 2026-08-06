import type { ID } from './workflow-common'

export type RevisionRequestStatus =
  | 'draft'
  | 'ready'
  | 'needs_approval'
  | 'approved'
  | 'queued'
  | 'running'
  | 'preview_ready'
  | 'rejected'
  | 'failed'
  | 'cancelled'
  | 'superseded'

export type RevisionExecutionMode =
  | 'local_only'
  | 'metadata_only'
  | 'preview_rerender'
  | 'ai_regeneration'
  | 'premium_generation'

export type RevisionCostPolicy =
  | 'free'
  | 'mock_credits_required'
  | 'approval_required'
  | 'premium_approval_required'

export type RevisionOperationImpact =
  | 'visibility'
  | 'style'
  | 'timing'
  | 'asset_replacement'
  | 'ai_regeneration'
  | 'audio'
  | 'caption'
  | 'motion'
  | 'layout'
  | 'metadata'
  | 'unknown'

export type RevisionApprovalStatus =
  | 'not_required'
  | 'required'
  | 'approved'
  | 'rejected'

export type MockRevisionJobStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'needs_attention'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type MockRevisionJobStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'warning'
  | 'failed'

export type MockRevisionJobStepKey =
  | 'read_edit_operations'
  | 'classify_revision'
  | 'validate_revision_scope'
  | 'reserve_mock_revision_credits'
  | 'apply_edit_map_operations'
  | 'rerender_preview_segments'
  | 'run_revision_qa'
  | 'create_preview_version'
  | 'create_edit_map_version'

export interface RevisionAffectedTarget {
  systemId?: ID
  groupId?: ID
  elementId?: ID
  systemKind?: string
  label?: string
}

export interface RevisionOperationClassification {
  editOperationId: ID
  operationType: string
  impact: RevisionOperationImpact
  executionMode: RevisionExecutionMode
  costPolicy: RevisionCostPolicy
  affectedTargets: RevisionAffectedTarget[]
  explanation: string
}

export interface RevisionCreditLineItem {
  id: ID
  label: string
  quantity: number
  credits: number
  explanation: string
}

export interface RevisionCreditEstimate {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: 'draft' | 'ready' | 'approved' | 'superseded'
  lineItems: RevisionCreditLineItem[]
  totalCredits: number
  explanation: string
  createdAt: string
  updatedAt: string
}

export interface RevisionApproval {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  revisionRequestId: ID
  creditEstimateId?: ID
  status: RevisionApprovalStatus
  acknowledgement: {
    acceptsMockCredits: boolean
    understandsPreviewIsMock: boolean
    understandsRevisionIsLocal: boolean
  }
  approvedAt?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
}

export interface RevisionRequest {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: RevisionRequestStatus
  sourcePreviewId?: ID
  sourcePreviewVersion?: number
  sourceEditDocumentId?: ID
  sourceEditVersion?: number
  targetPreviewId?: ID
  targetPreviewVersion?: number
  targetEditDocumentId?: ID
  targetEditVersion?: number
  editOperationIds: ID[]
  classifications: RevisionOperationClassification[]
  executionMode: RevisionExecutionMode
  costPolicy: RevisionCostPolicy
  creditEstimateId?: ID
  approvalId?: ID
  jobId?: ID
  summary: string
  createdAt: string
  updatedAt: string
}

export interface MockRevisionJobStep {
  id: ID
  key: MockRevisionJobStepKey
  label: string
  status: MockRevisionJobStepStatus
  progressPercent: number
  message: string
}

export interface MockRevisionJob {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  revisionRequestId: ID
  status: MockRevisionJobStatus
  steps: MockRevisionJobStep[]
  progressPercent: number
  previewId?: ID
  previewVersion?: number
  editDocumentId?: ID
  editVersion?: number
  previewLabel?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface RevisionVersionRecord {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  revisionRequestId: ID
  sourcePreviewId?: ID
  sourcePreviewVersion?: number
  targetPreviewId: ID
  targetPreviewVersion: number
  sourceEditDocumentId?: ID
  sourceEditVersion?: number
  targetEditDocumentId: ID
  targetEditVersion: number
  summary: string
  createdAt: string
  updatedAt: string
}

export interface RevisionWorkflowState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  activeRevisionRequest: RevisionRequest | null
  revisionRequests: RevisionRequest[]
  creditEstimates: RevisionCreditEstimate[]
  approvals: RevisionApproval[]
  jobs: MockRevisionJob[]
  versions: RevisionVersionRecord[]
  latestPreviewId?: ID
  latestPreviewVersion?: number
  latestEditDocumentId?: ID
  latestEditVersion?: number
  summary: {
    totalRevisions: number
    pendingRevisions: number
    completedRevisions: number
    failedRevisions: number
    mockCreditsEstimated: number
  }
  updatedAt: string
}
