import type {
  ApprovalStatus,
  AspectRatio,
  BaseRecord,
  CreditAmount,
  ID,
  ISODateString,
  JSONObject,
  Percentage,
  ProcessingStatus,
  Seconds,
  TimeRange,
} from './shared'
import type { EditQualityCheckType } from './edit-quality'

export type RenderJobStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'awaiting_credit_reservation'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

export type RenderType = 'preview' | 'final' | 'revision_preview' | 'export_variant' | 'test_render'

export type RenderQualityLevel = 'draft' | 'preview' | 'production' | 'premium'

export type RenderOutputFormat = 'mp4' | 'webm' | 'mov' | 'png_sequence' | 'image' | 'audio' | 'unknown'

export type RenderFailureCategory =
  | 'none'
  | 'source_asset_missing'
  | 'generated_asset_missing'
  | 'timeline_invalid'
  | 'caption_collision'
  | 'audio_mix_failed'
  | 'worker_error'
  | 'timeout'
  | 'credit_not_reserved'
  | 'approval_missing'
  | 'quality_failed'
  | 'unknown'

export type RenderInputType =
  | 'source_video'
  | 'source_audio'
  | 'generated_asset'
  | 'caption_plan'
  | 'music_plan'
  | 'sfx_plan'
  | 'transition_plan'
  | 'stroke_motion_asset'
  | 'graphic_design_asset'
  | 'real_motion_asset'
  | 'soundsync_asset'
  | 'timeline_spec'
  | 'other'

export type RenderStatus =
  | 'draft'
  | 'rendering'
  | 'ready'
  | 'archived'
  | 'superseded'
  | 'revision_requested'
  // Legacy prototype states kept for current mock compatibility.
  | 'queued'
  | 'quality_check'
  | 'preview_ready'
  | 'export_ready'
  | 'failed'
  | 'cancelled'

export type ExportStatus = 'draft' | 'queued' | 'exporting' | 'ready' | 'failed' | 'cancelled' | 'archived'

export type ExportFormat =
  | 'mp4'
  | 'mov'
  | 'webm'
  | 'srt'
  | 'vtt'
  | 'wav'
  | 'mp3'
  | 'zip'
  | 'other'
  // Legacy prototype variants.
  | 'gif'
  | 'audio_only'
  | 'caption_file'

export type ExportPlatform =
  | 'tiktok_reels_shorts'
  | 'youtube'
  | 'youtube_shorts'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'website'
  | 'course_training'
  | 'client_review'
  | 'custom'

export type PreviewReviewStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected' | 'cancelled' | 'open' | 'closed'

export type ReviewCommentStatus = 'open' | 'resolved' | 'dismissed' | 'archived'

export type RevisionRequestStatus =
  | 'draft'
  | 'submitted'
  | 'estimating'
  | 'awaiting_approval'
  | 'approved'
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed'
  // Legacy prototype states.
  | 'estimated'
  | 'generating'
  | 'preview_ready'

export type RevisionScope =
  | 'cutting'
  | 'caption'
  | 'audio'
  | 'music'
  | 'sfx'
  | 'transition'
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'soundsync'
  | 'render_settings'
  | 'export_settings'
  | 'entire_edit'
  | 'other'

export type RevisionCostLevel = 'free' | 'low' | 'medium' | 'high' | 'premium' | 'needs_estimate'

export type QAReportStatus = 'pending' | 'running' | 'passed' | 'warning' | 'failed' | 'requires_retry' | 'waived' | 'not_run'

export type QAReportItemStatus = 'pending' | 'passed' | 'warning' | 'failed' | 'requires_retry' | 'waived' | 'not_run'

export type QAReportItemType =
  | EditQualityCheckType
  | 'caption_collision'
  | 'stroke_motion_timing'
  | 'real_motion_face_safe'
  | 'graphic_design_readability'
  | 'render_integrity'
  | 'export_settings'
  | 'professional_standard'
  | 'other'

export interface RenderJobRecord extends BaseRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  editPlanId: ID
  jobId?: ID
  jobBatchId?: ID
  creditEstimateId?: ID
  creditReservationId?: ID
  renderType: RenderType
  status: RenderJobStatus | RenderStatus
  qualityLevel?: RenderQualityLevel
  outputFormat?: RenderOutputFormat
  renderName?: string
  renderDescription?: string
  inputAssetIds: ID[]
  outputRenderId?: ID
  approvalRecordId?: ID
  renderSettings: JSONObject
  timelineSpec?: JSONObject
  width?: number
  height?: number
  frameRate?: number
  durationSeconds?: Seconds
  estimatedCredits?: CreditAmount
  actualCredits?: CreditAmount
  failureCategory?: RenderFailureCategory
  failureMessage?: string
  idempotencyKey?: string
  workerRuntime?: string
  workerNotes?: string
  progressPercent?: Percentage
  progressMessage?: string
  queuedAt?: ISODateString
  startedAt?: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
  cancelledAt?: ISODateString
}

export interface RenderJobInputRecord {
  id: ID
  renderJobId: ID
  workspaceId: ID
  projectId: ID
  inputType: RenderInputType
  mediaAssetId?: ID
  generatedAssetId?: ID
  editPlanSegmentId?: ID
  signatureRouteId?: ID
  strokeMotionPlanId?: ID
  sourceStartSeconds?: Seconds
  sourceEndSeconds?: Seconds
  timelineStartSeconds?: Seconds
  timelineEndSeconds?: Seconds
  layerName?: string
  zIndex?: number
  inputPayload?: JSONObject
  createdAt: ISODateString
}

export interface RenderRecord extends BaseRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  editPlanId: ID
  renderJobId?: ID
  jobId?: ID
  renderType: RenderType
  status: RenderStatus
  qualityLevel?: RenderQualityLevel
  outputFormat?: RenderOutputFormat
  mediaAssetId?: ID
  generatedAssetId?: ID
  displayName?: string
  storageProvider?: string
  storageBucket?: string
  storagePath?: string
  publicUrl?: string
  signedUrlExpiresAt?: ISODateString
  safePreviewUrl?: string
  fileSizeBytes?: number
  durationSeconds?: number
  width?: number
  height?: number
  frameRate?: number
  thumbnailMediaAssetId?: ID
  previewChatMessageId?: ID
  previewInlineChatCardId?: ID
  supersedesRenderId?: ID
  qaReportId?: ID
  creditsSpent: CreditAmount
  renderPayload?: JSONObject
  archivedAt?: ISODateString
}

export interface RenderEventRecord {
  id: ID
  renderJobId?: ID
  renderId?: ID
  workspaceId: ID
  projectId: ID
  eventType: string
  message?: string
  status?: RenderJobStatus
  progressPercent?: Percentage
  payload?: JSONObject
  createdAt: ISODateString
}

export interface ExportRecord extends BaseRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  renderId?: ID
  editPlanId?: ID
  jobId?: ID
  status: ExportStatus | ProcessingStatus
  exportPlatform?: ExportPlatform | string
  exportFormat: ExportFormat
  displayName?: string
  exportSettings?: JSONObject
  mediaAssetId?: ID
  storageProvider?: string
  storageBucket?: string
  storagePath?: string
  publicUrl?: string
  signedUrlExpiresAt?: ISODateString
  fileSizeBytes?: number
  durationSeconds?: Seconds
  width?: number
  height?: number
  frameRate?: number
  targetPlatform?: string
  requestedByUserId: ID
  requestedAt: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
  failureMessage?: string
}

export interface ExportVariantRecord extends BaseRecord {
  exportId: ID
  workspaceId: ID
  projectId: ID
  variantName: string
  exportPlatform: ExportPlatform
  exportFormat: ExportFormat
  aspectRatio?: AspectRatio
  width?: number
  height?: number
  frameRate?: number
  mediaAssetId?: ID
  storagePath?: string
  variantPayload?: JSONObject
}

export interface PreviewReviewRecord extends BaseRecord {
  id: ID
  workspaceId?: ID
  projectId: ID
  chatSessionId?: ID
  renderId: ID
  editPlanId?: ID
  reviewerUserId?: ID
  reviewedBy?: ID
  status: PreviewReviewStatus
  summary?: string
  reviewNote?: string
  approvedAt?: ISODateString
  changesRequestedAt?: ISODateString
  rejectedAt?: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ReviewCommentRecord extends BaseRecord {
  id: ID
  workspaceId?: ID
  projectId?: ID
  previewReviewId?: ID
  renderId?: ID
  chatSessionId?: ID
  chatMessageId?: ID
  authorUserId?: ID
  status?: ReviewCommentStatus
  timeRange?: TimeRange
  timecodeSeconds?: Seconds
  comment: string
  commentText?: string
  assignedTo?: ID
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  resolved: boolean
  resolvedAt?: ISODateString
  resolvedBy?: ID
  createdAt: ISODateString
}

export interface RevisionRequestRecord extends BaseRecord {
  id: ID
  workspaceId?: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  chatActionId?: ID
  previewReviewId?: ID
  reviewCommentId?: ID
  renderId?: ID
  editPlanId?: ID
  newEditPlanId?: ID
  requestedChange: string
  affectedSegmentIds: ID[]
  requiresNewGeneration: boolean
  requiresNewRender?: boolean
  estimatedExtraCredits: CreditAmount
  costLevel?: RevisionCostLevel
  revisionScope?: RevisionScope
  status: RevisionRequestStatus
  linkedEditPlanVersion: number
  linkedRenderId?: ID
  creditEstimateId?: ID
  creditReservationId?: ID
  requestedBy?: ID
  workerNotes?: string
  approvalStatus: ApprovalStatus
  submittedAt?: ISODateString
  approvedAt?: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface RevisionRequestItemRecord {
  id: ID
  revisionRequestId: ID
  workspaceId: ID
  projectId: ID
  revisionScope: RevisionScope
  editPlanSegmentId?: ID
  signatureRouteId?: ID
  generatedAssetId?: ID
  strokeMotionPlanId?: ID
  renderInputId?: ID
  timecodeSeconds?: Seconds
  description?: string
  requiresNewGeneration: boolean
  requiresNewRender: boolean
  itemPayload?: JSONObject
  createdAt: ISODateString
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
  checkType: QAReportItemType
  status: QAReportItemStatus
  score?: number
  summary: string
  blocker: boolean
  recommendedFix?: string
  issue?: string
  recommendation?: string
  requiresRetry?: boolean
  timecodeSeconds?: Seconds
  relatedGeneratedAssetId?: ID
  relatedRenderInputId?: ID
  itemPayload?: JSONObject
}

export interface QAReportRecord extends BaseRecord {
  id: ID
  workspaceId?: ID
  projectId: ID
  editPlanId?: ID
  renderJobId?: ID
  renderId?: ID
  exportId?: ID
  jobId?: ID
  agentRunId?: ID
  status: QAReportStatus
  overallScore?: number
  summary?: string
  requiresRetry?: boolean
  checkedBy?: string
  qaPayload?: JSONObject
  startedAt?: ISODateString
  completedAt?: ISODateString
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

export interface NormalizedQAReportItemRecord extends BaseRecord {
  qaReportId: ID
  workspaceId: ID
  projectId: ID
  editPlanSegmentId?: ID
  checkType: QAReportItemType
  status: QAReportItemStatus
  score?: number
  issue?: string
  recommendation?: string
  requiresRetry: boolean
  timecodeSeconds?: Seconds
  relatedGeneratedAssetId?: ID
  relatedRenderInputId?: ID
  itemPayload?: JSONObject
}
