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

export type ReeditProChatMessageType =
  | 'user_message'
  | 'assistant_message'
  | 'assistant_question'
  | 'assistant_plan_review'
  | 'assistant_credit_approval'
  | 'assistant_progress_update'
  | 'assistant_preview_ready'
  | 'assistant_revision_response'
  | 'assistant_error'
  | 'system_status'
  | 'attachment_event'
  | 'reference_event'

export type ReeditProChatMessageStatus =
  | 'idle'
  | 'pending'
  | 'loading'
  | 'success'
  | 'warning'
  | 'error'
  | 'approved'
  | 'generating'
  | 'preview_ready'

export type ReeditProChatMessageCardType =
  | 'demo_scenario'
  | 'planning_progress'
  | 'source_sequence'
  | 'footage_prep'
  | 'aspect_ratio_gate'
  | 'source_cleanup'
  | 'trim_review'
  | 'edit_level'
  | 'edit_preference_choice'
  | 'edit_preference_summary'
  | 'preference_setup_summary'
  | 'preference_snapshot'
  | 'preference_contract'
  | 'preference_applied_plan'
  | 'preference_creative_readiness'
  | 'preference_approval_readiness'
  | 'preference_credit_influence'
  | 'preference_source_dna_note'
  | 'preference_dna_applied'
  | 'preference_dna_review'
  | 'preference_qa_compliance'
  | 'preference_revision_learning'
  | 'preference_revision_applied'
  | 'preference_save_learning'
  | 'visual_preference'
  | 'planning_context'
  | 'reference_dna'
  | 'video_understanding'
  | 'adaptive_strategy'
  | 'timing_plan'
  | 'compiled_intent'
  | 'plan_review'
  | 'advanced_details'
  | 'progress'
  | 'preview_ready'
  | 'revision'
  | 'export'
  | 'music_plan'
  | 'sfx_plan'

export type ReeditProChatCardType =
  | ReeditProChatMessageCardType
  | 'demo_scenario_selector'
  | 'workflow_choice'
  | 'plan_review_approval'
  | 'generation_progress'
  | 'revision_options'
  | 'error_details'
  | 'timeline_link'
  | 'sfx_director_plan'
  | 'sfx_event_list'
  | 'sfx_credit_estimate'
  | 'sfx_mix_plan'
  | 'sfx_provider_route'
  | 'sfx_timing_trim'
  | 'sfx_library_candidates'
  | 'sfx_generation_progress'
  | 'sfx_qa'
  | 'sfx_revision_options'
  | 'sfx_prompt_preview'
  | 'sfx_advanced_details'
  | 'music_context'
  | 'music_cue'
  | 'music_cue_sheet'
  | 'music_credit_estimate'
  | 'music_mix_plan'
  | 'music_generation_progress'
  | 'music_qa'
  | 'music_revision_options'
  | 'music_prompt_preview'
  | 'music_advanced_details'

export type ReeditProChatActionId =
  | 'attach_clips'
  | 'confirm_source_order'
  | 'confirm_frame'
  | 'confirm_cleanup'
  | 'confirm_edit_level'
  | 'confirm_visual_preference'
  | 'attach_reference'
  | 'approve_plan'
  | 'lower_cost'
  | 'remove_real_motion'
  | 'ask_question'
  | 'open_timeline'
  | 'open_preview_review'
  | 'request_revision'
  | 'export_video'

export interface ReeditProChatCard {
  id: ID
  type: ReeditProChatCardType
  priority?: 'required' | 'summary' | 'advanced' | 'developer'
  defaultOpen?: boolean
  requiredBeforeApproval?: boolean
  status?: ReeditProChatMessageStatus
}

export interface ReeditProChatAction {
  id: ReeditProChatActionId | ID
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  ariaLabel?: string
}

export interface ReeditProChatMessage {
  id: ID
  role: ChatMessageRole
  type: ReeditProChatMessageType
  content?: string
  status?: ReeditProChatMessageStatus
  cardType?: ReeditProChatMessageCardType
  cards?: ReeditProChatCard[]
  actionIds?: ReeditProChatActionId[]
  actions?: ReeditProChatAction[]
  createdAt?: ISODateString
  order?: number
  ariaLive?: 'off' | 'polite' | 'assertive'
  label?: string
  accessibilityLabel?: string
  metadata?: JSONObject
}

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
