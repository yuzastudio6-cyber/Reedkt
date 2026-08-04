import type { ID } from './workflow-common'

export type ExportWorkflowStatus =
  | 'not_ready'
  | 'ready'
  | 'ready_with_warnings'
  | 'needs_review'
  | 'blocked'
  | 'approved'
  | 'exporting'
  | 'export_ready'
  | 'failed'

export type ExportReadinessIssueSeverity =
  | 'info'
  | 'warning'
  | 'blocking'

export type ExportReadinessIssueType =
  | 'missing_preview'
  | 'preview_not_ready'
  | 'generation_not_ready'
  | 'qa_blocked'
  | 'qa_not_reviewed'
  | 'pending_edit_map_operations'
  | 'active_revision_in_progress'
  | 'failed_revision_exists'
  | 'missing_export_target'
  | 'missing_export_settings'
  | 'safe_zone_warning'
  | 'caption_burn_in_warning'
  | 'watermark_warning'
  | 'approval_required'
  | 'other'

export type ExportTargetPlatform =
  | 'tiktok'
  | 'instagram_reels'
  | 'youtube_shorts'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'x'
  | 'website'
  | 'custom'

export type ExportAspectRatio =
  | '9:16'
  | '16:9'
  | '1:1'
  | '4:5'
  | 'original'
  | 'custom'

export type ExportResolution =
  | '720p'
  | '1080p'
  | '1440p'
  | '4k'
  | 'source'
  | 'custom'

export type ExportFileFormat =
  | 'mp4'
  | 'mov'
  | 'webm'

export type ExportQualityLevel =
  | 'draft'
  | 'standard'
  | 'high'
  | 'maximum'

export type CaptionExportMode =
  | 'burn_in'
  | 'sidecar'
  | 'none'

export type ExportApprovalStatus =
  | 'not_required'
  | 'required'
  | 'approved'
  | 'rejected'

export type MockExportJobStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'needs_attention'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type MockExportJobStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'warning'
  | 'failed'

export type MockExportJobStepKey =
  | 'read_preview_version'
  | 'validate_export_readiness'
  | 'prepare_platform_versions'
  | 'verify_approved_edit_credit_coverage'
  | 'apply_export_settings'
  | 'render_mock_outputs'
  | 'run_export_qa'
  | 'package_exports'
  | 'export_ready'

export interface ExportReadinessIssue {
  id: ID
  projectId: ID
  severity: ExportReadinessIssueSeverity
  type: ExportReadinessIssueType
  message: string
  suggestedAction?: string
  relatedPreviewId?: ID
  relatedEditDocumentId?: ID
  relatedRevisionRequestId?: ID
  relatedQaReportId?: ID
}

export interface ExportTarget {
  id: ID
  platform: ExportTargetPlatform
  label: string
  enabled: boolean
  aspectRatio: ExportAspectRatio
  resolution: ExportResolution
  fileFormat: ExportFileFormat
  quality: ExportQualityLevel
  captionMode: CaptionExportMode
  enforceSafeZones: boolean
  includeWatermarkPlaceholder: boolean
  notes?: string
}

export interface ExportSettings {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  sourcePreviewId?: ID
  sourcePreviewVersion?: number
  sourceEditDocumentId?: ID
  sourceEditVersion?: number
  targets: ExportTarget[]
  defaultQuality: ExportQualityLevel
  defaultFileFormat: ExportFileFormat
  createdAt: string
  updatedAt: string
}

export interface MockExportEstimateLineItem {
  id: ID
  label: string
  quantity: number
  credits: number
  explanation: string
}

export interface MockExportEstimate {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: 'draft' | 'ready' | 'approved' | 'superseded'
  lineItems: MockExportEstimateLineItem[]
  totalCredits: number
  coverageSource: 'approved_edit_4k_ceiling'
  requiresCreditPrompt: false
  allowsAdditionalExportCharge: false
  explanation: string
  createdAt: string
  updatedAt: string
}

export interface ExportApproval {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  exportEstimateId?: ID
  status: ExportApprovalStatus
  acknowledgement: {
    acceptsMockCredits: boolean
    understandsExportIsMock: boolean
    understandsNoRealFileWillBeCreated: boolean
  }
  approvedAt?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MockExportJobStep {
  id: ID
  key: MockExportJobStepKey
  label: string
  status: MockExportJobStepStatus
  progressPercent: number
  message: string
}

export interface MockExportOutput {
  id: ID
  projectId: ID
  platform: ExportTargetPlatform
  label: string
  mockFileName: string
  fileFormat: ExportFileFormat
  aspectRatio: ExportAspectRatio
  resolution: ExportResolution
  quality: ExportQualityLevel
  captionMode: CaptionExportMode
  sourcePreviewId?: ID
  sourcePreviewVersion?: number
  sourceEditDocumentId?: ID
  sourceEditVersion?: number
  createdAt: string
}

export interface MockExportJob {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: MockExportJobStatus
  sourcePreviewId?: ID
  sourcePreviewVersion?: number
  sourceEditDocumentId?: ID
  sourceEditVersion?: number
  exportSettingsId?: ID
  exportEstimateId?: ID
  approvalId?: ID
  steps: MockExportJobStep[]
  outputs: MockExportOutput[]
  progressPercent: number
  failureReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface ExportWorkflowState {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: ExportWorkflowStatus
  sourcePreviewId?: ID
  sourcePreviewVersion?: number
  sourceEditDocumentId?: ID
  sourceEditVersion?: number
  issues: ExportReadinessIssue[]
  exportSettings: ExportSettings
  exportEstimate: MockExportEstimate | null
  approval: ExportApproval | null
  activeJob: MockExportJob | null
  exportJobs: MockExportJob[]
  exportOutputs: MockExportOutput[]
  canApprove: boolean
  canExport: boolean
  summary: {
    enabledTargetCount: number
    outputCount: number
    blockingIssueCount: number
    warningIssueCount: number
    totalMockCreditsEstimated: number
  }
  nextRecommendedActions: string[]
  createdAt: string
  updatedAt: string
}
