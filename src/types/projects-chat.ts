import type { ApprovalStatus, BaseRecord, ID, ISODateString, JSONObject, OwnedRecord, ProcessingStatus } from './shared'

export type ProjectStatus =
  | 'draft'
  | 'collecting_context'
  | 'planning'
  | 'awaiting_approval'
  | 'generating'
  | 'preview_ready'
  | 'revision_requested'
  | 'exporting'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type ChatSessionStatus =
  | 'open'
  | 'waiting_user_input'
  | 'planning'
  | 'waiting_approval'
  | 'editing'
  | 'preview_ready'
  | 'closed'
  | 'archived'

export type ChatMessageRole = 'user' | 'assistant' | 'system' | 'agent' | 'worker'

export type ChatAttachmentType =
  | 'source_video_clip'
  | 'reference_video'
  | 'image'
  | 'audio'
  | 'document'
  | 'generated_preview'
  | 'final_export'

export type InlineChatCardType =
  | 'source_sequence'
  | 'workflow_choice'
  | 'ai_question'
  | 'reference_dna'
  | 'edit_plan'
  | 'credit_estimate'
  | 'approval_request'
  | 'editing_progress'
  | 'preview_ready'
  | 'revision_request'
  | 'export_ready'

export type ChatActionType =
  | 'attach_clips'
  | 'answer_question'
  | 'approve_plan'
  | 'approve_credits'
  | 'request_revision'
  | 'lower_credit_cost'
  | 'remove_real_motion'
  | 'start_generation'
  | 'open_preview'
  | 'export_video'

export interface ProjectRecord extends OwnedRecord {
  title: string
  description?: string
  status: ProjectStatus
  currentChatSessionId?: ID
  currentEditPlanId?: ID
  currentCreditEstimateId?: ID
  latestPreviewRenderId?: ID
  targetPlatform?: string
  aspectRatio?: string
  createdFromChat: boolean
}

export interface ChatSessionRecord extends BaseRecord {
  projectId: ID
  workspaceId: ID
  userId: ID
  status: ChatSessionStatus
  title: string
  startedAt: ISODateString
  closedAt?: ISODateString
  currentInlineCardId?: ID
  lastMessageAt?: ISODateString
}

export interface ChatMessageRecord extends BaseRecord {
  chatSessionId: ID
  projectId: ID
  role: ChatMessageRole
  actorId?: ID
  content: string
  inlineCardIds: ID[]
  attachmentIds: ID[]
  processingStatus?: ProcessingStatus
  visibleToUser: boolean
  parentMessageId?: ID
}

export interface ChatAttachmentRecord extends BaseRecord {
  chatSessionId: ID
  chatMessageId?: ID
  projectId: ID
  mediaAssetId?: ID
  attachmentType: ChatAttachmentType
  displayName: string
  uploadedOrder?: number
  userNotes?: string
  isImportant?: boolean
  isOptional?: boolean
  status: ProcessingStatus
  safePreviewUrl?: string
}

export interface InlineChatCardRecord extends BaseRecord {
  chatSessionId: ID
  chatMessageId: ID
  projectId: ID
  cardType: InlineChatCardType
  title: string
  summary: string
  payload: JSONObject
  status: ProcessingStatus
  approvalStatus?: ApprovalStatus
  actionIds: ID[]
}

export interface ChatActionRecord extends BaseRecord {
  chatSessionId: ID
  chatMessageId?: ID
  inlineCardId?: ID
  projectId: ID
  actionType: ChatActionType
  label: string
  payload: JSONObject
  status: 'available' | 'clicked' | 'disabled' | 'completed'
  requiresApproval: boolean
  performedByUserId?: ID
  performedAt?: ISODateString
}

export const INLINE_CHAT_CARD_TYPES: InlineChatCardType[] = [
  'source_sequence',
  'workflow_choice',
  'ai_question',
  'reference_dna',
  'edit_plan',
  'credit_estimate',
  'approval_request',
  'editing_progress',
  'preview_ready',
  'revision_request',
  'export_ready',
]
