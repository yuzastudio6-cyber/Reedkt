import type {
  ApprovalStatus,
  BaseRecord,
  CreditAmount,
  ID,
  ISODateString,
  JSONObject,
  ProcessingStatus,
  TimeRange,
} from './shared'
import type { EditQualityCheckType } from './edit-quality'

export type RenderType = 'preview' | 'final'

export type RenderStatus =
  | 'draft'
  | 'queued'
  | 'rendering'
  | 'quality_check'
  | 'preview_ready'
  | 'export_ready'
  | 'failed'
  | 'cancelled'

export type ExportFormat = 'mp4' | 'mov' | 'webm' | 'gif' | 'audio_only' | 'caption_file'

export type RevisionRequestStatus =
  | 'draft'
  | 'estimated'
  | 'awaiting_approval'
  | 'approved'
  | 'generating'
  | 'preview_ready'
  | 'completed'
  | 'cancelled'
  | 'failed'

export interface RenderJobRecord extends BaseRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  jobId?: ID
  renderType: RenderType
  status: RenderStatus
  inputAssetIds: ID[]
  outputRenderId?: ID
  approvalRecordId?: ID
  renderSettings: JSONObject
  startedAt?: ISODateString
  completedAt?: ISODateString
}

export interface RenderRecord extends BaseRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  renderJobId: ID
  renderType: RenderType
  status: RenderStatus
  mediaAssetId?: ID
  safePreviewUrl?: string
  durationSeconds?: number
  width?: number
  height?: number
  qaReportId?: ID
  creditsSpent: CreditAmount
}

export interface ExportRecord extends BaseRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  renderId: ID
  exportFormat: ExportFormat
  targetPlatform?: string
  status: ProcessingStatus
  mediaAssetId?: ID
  requestedByUserId: ID
  requestedAt: ISODateString
  completedAt?: ISODateString
}

export interface PreviewReviewRecord extends BaseRecord {
  id: ID
  projectId: ID
  renderId: ID
  reviewerUserId: ID
  status: 'open' | 'approved' | 'changes_requested' | 'closed'
  summary: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ReviewCommentRecord extends BaseRecord {
  id: ID
  previewReviewId: ID
  renderId: ID
  chatMessageId?: ID
  authorUserId: ID
  timeRange?: TimeRange
  comment: string
  resolved: boolean
  createdAt: ISODateString
}

export interface RevisionRequestRecord extends BaseRecord {
  id: ID
  projectId: ID
  chatMessageId: ID
  requestedChange: string
  affectedSegmentIds: ID[]
  requiresNewGeneration: boolean
  estimatedExtraCredits: CreditAmount
  status: RevisionRequestStatus
  linkedEditPlanVersion: number
  linkedRenderId?: ID
  creditEstimateId?: ID
  approvalStatus: ApprovalStatus
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface ApprovalRecord extends BaseRecord {
  id: ID
  projectId: ID
  chatSessionId?: ID
  approvedByUserId: ID
  approvalType: 'edit_plan' | 'credit_estimate' | 'generation_start' | 'revision' | 'export'
  approvalStatus: ApprovalStatus
  approvedRecordId: ID
  approvalSummary: string
  approvedAt?: ISODateString
  revokedAt?: ISODateString
}

export interface QAReportItem {
  id: ID
  checkType: EditQualityCheckType
  status: 'passed' | 'warning' | 'failed' | 'not_run'
  score?: number
  summary: string
  blocker: boolean
  recommendedFix?: string
}

export interface QAReportRecord extends BaseRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  renderId?: ID
  status: 'passed' | 'warning' | 'failed' | 'not_run'
  speechClarity: QAReportItem
  cutSmoothness: QAReportItem
  captionReadability: QAReportItem
  musicBalance: QAReportItem
  sfxBalance: QAReportItem
  transitionQuality: QAReportItem
  ambientConsistency: QAReportItem
  storyFlow: QAReportItem
  signatureTiming: QAReportItem
  creditCompliance: QAReportItem
  userInstructionCompliance: QAReportItem
  overallSummary: string
  createdAt: ISODateString
}
