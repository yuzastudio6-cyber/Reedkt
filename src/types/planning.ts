import type {
  ApprovalStatus,
  CreditImpact,
  ID,
  ISODateString,
  JSONObject,
  ProcessingStatus,
  TargetPlatform,
  TimeRange,
} from './shared'
import type { SignatureSystem, SignatureWorkerTarget } from './signature-systems'

export type EditComplexity =
  | 'basic_edit'
  | 'pro_edit'
  | 'signature_edit'
  | 'premium_signature_edit'

export type EditPlanStatus =
  | 'draft'
  | 'planning'
  | 'awaiting_user_input'
  | 'awaiting_approval'
  | 'approved'
  | 'generating'
  | 'preview_ready'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type HookPolicy = 'required' | 'recommended' | 'optional' | 'not_needed' | 'avoid'

export type VideoWorkflowContext =
  | 'simple_clean_edit'
  | 'social_short_viral_clip'
  | 'talking_head_personal_brand'
  | 'podcast_clip'
  | 'vlog_lifestyle'
  | 'product_demo'
  | 'real_estate_property_tour'
  | 'education_explainer'
  | 'marketing_ad'
  | 'testimonial_case_study'
  | 'custom_let_ai_decide'

export type UserIntentConfidence = 'low' | 'medium' | 'high' | 'needs_user_confirmation'

export type StoryBeatType =
  | 'hook'
  | 'setup'
  | 'problem'
  | 'explanation'
  | 'example'
  | 'solution'
  | 'transformation'
  | 'result'
  | 'cta'
  | 'proof'
  | 'transition'
  | 'context'
  | 'custom'

export type StoryBeatStatus = 'planned' | 'active' | 'optional' | 'skipped' | 'needs_review'

export type SignatureRouteRequirement =
  | 'required'
  | 'recommended'
  | 'optional'
  | 'not_recommended'
  | 'blocked_by_user'

export type EditInstructionType =
  | 'cutting'
  | 'caption'
  | 'audio'
  | 'transition'
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'soundsync'
  | 'render'
  | 'quality_check'
  | 'credit'
  | 'user_instruction'
  | 'worker_note'

export type UserInstructionPriority =
  | 'must_follow'
  | 'strong_preference'
  | 'soft_preference'
  | 'avoid'
  | 'unknown'

export type PlanningWorkerTarget =
  | 'chat_intent_agent'
  | 'media_analysis_agent'
  | 'source_sequence_agent'
  | 'edit_quality_agent'
  | 'pacing_agent'
  | 'transition_agent'
  | 'audio_environment_agent'
  | 'music_supervisor_agent'
  | 'sfx_agent'
  | 'signature_investigation_agent'
  | 'stroke_motion_story_agent'
  | 'credit_estimation_agent'
  | 'generation_orchestrator'
  | 'stroke_motion_generation_worker'
  | 'graphic_design_worker'
  | 'real_motion_worker'
  | 'soundsync_worker'
  | 'render_worker'
  | 'quality_check_agent'
  | 'human_editor'
  | 'none'

export interface IntentAnalysisRecord {
  id: ID
  projectId: ID
  chatSessionId: ID
  sourceChatMessageIds: ID[]
  userGoalSummary: string
  explicitInstructions: string[]
  inferredIntent: string
  missingInformationQuestions: string[]
  selectedWorkflowContext?: VideoWorkflowContext
  workflowContextOnly: true
  targetPlatform?: TargetPlatform
  requestedEditComplexity?: EditComplexity
  confidence: UserIntentConfidence
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SourceSequenceMapRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  sourceClipSequenceId: ID
  intentAnalysisId?: ID
  summary?: string
  detectedStoryOrder?: string
  strongMoments: JSONObject[]
  weakMoments: JSONObject[]
  clipRoleSummary: JSONObject[]
  aiNotes: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SourceSequenceMapItemRecord {
  id: ID
  sourceSequenceMapId: ID
  workspaceId: ID
  projectId: ID
  sourceClipSequenceItemId: ID
  mediaAssetId: ID
  uploadedOrder: number
  detectedRole?: string
  storyFunction?: string
  strengths: string[]
  concerns: string[]
  possibleUses: string[]
  recommendedUse?: string
  shouldPreserveOrder: boolean
  aiNotes?: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface RecommendedEditStructureRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  intentAnalysisId?: ID
  sourceSequenceMapId?: ID
  structureSummary: string
  preserveSourceOrder: boolean
  restructureReason?: string
  hookPolicy: HookPolicy
  structureSteps: JSONObject[]
  userApprovalRequired: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface EditPlanRecord {
  id: ID
  projectId: ID
  chatSessionId: ID
  intentAnalysisId: ID
  sourceClipSequenceId: ID
  sourceSequenceMapId?: ID
  recommendedEditStructureId?: ID
  status: EditPlanStatus
  complexity: EditComplexity
  professionalStandardRequired: true
  goalSummary: string
  strategySummary: string
  hookPolicy: HookPolicy
  hookRecommendation: string
  creditEstimateId?: ID
  approvalStatus: ApprovalStatus
  approvedByUserId?: ID
  approvedAt?: ISODateString
  approvalRequiredBeforeGeneration: true
  version: number
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface EditPlanSegmentRecord {
  id: ID
  editPlanId: ID
  projectId: ID
  segmentOrder: number
  sourceClipId?: ID
  sourceStartSeconds?: number
  sourceEndSeconds?: number
  outputStartSeconds: number
  outputEndSeconds: number
  transcriptText?: string
  storyBeatId?: ID
  segmentPurpose: string
  recommendedAction: string
  signatureSystem: SignatureSystem
  signatureReason: string
  creditImpact: CreditImpact
  notesForEditor: string[]
  notesForWorker: string[]
  mustFollowRules: string[]
  avoidRules: string[]
  metadata?: JSONObject
}

export interface EditInstructionRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  sourceChatMessageId?: ID
  instructionType: EditInstructionType
  targetWorker?: PlanningWorkerTarget
  text: string
  appliesToSegmentIds: ID[]
  priority: UserInstructionPriority
  mustFollow: boolean
  avoid: boolean
  status: 'active' | 'completed' | 'dismissed' | 'superseded' | 'failed'
  createdAt: ISODateString
  updatedAt?: ISODateString
  metadata?: JSONObject
}

export interface SignatureRouteRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  editPlanSegmentId: ID
  signatureSystem: SignatureSystem
  requirement?: SignatureRouteRequirement
  reason: string
  timing: TimeRange
  creditImpact: CreditImpact
  optional: boolean
  approvalNeeded: boolean
  workerTarget: SignatureWorkerTarget | PlanningWorkerTarget
  generationRequestId?: ID
  status: ProcessingStatus
  metadata?: JSONObject
}

export interface StoryBeatMapRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  title: string
  summary: string
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface StoryBeatRecord {
  id: ID
  storyBeatMapId: ID
  workspaceId?: ID
  projectId?: ID
  editPlanId?: ID
  beatOrder: number
  beatType?: StoryBeatType
  status?: StoryBeatStatus
  label: string
  purpose: string
  timeRange?: TimeRange
  active: boolean
  linkedSegmentIds: ID[]
  linkedTranscriptSegmentIds: ID[]
  metadata?: JSONObject
}

export interface EditPlanChatCardRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  inlineChatCardId: ID
  cardRole:
    | 'plan_summary'
    | 'source_sequence'
    | 'signature_routes'
    | 'credit_estimate'
    | 'approval_request'
    | 'preview_ready'
  createdAt: ISODateString
  metadata?: JSONObject
}

export const EDIT_COMPLEXITY_LEVELS: EditComplexity[] = [
  'basic_edit',
  'pro_edit',
  'signature_edit',
  'premium_signature_edit',
]

export const EDIT_COMPLEXITY_RULES = {
  professionalStandard:
    'Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing.',
  levelControls: 'complexity_and_cost_not_quality',
  approvalGate: 'plan_and_credit_estimate_required_before_generation',
} as const
