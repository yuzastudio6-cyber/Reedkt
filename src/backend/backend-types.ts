import type {
  ChatMessageRecord,
  ChatSessionRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  EditPlanRecord,
  EditQualityProfileRecord,
  GeneratedAssetRecord,
  GenerationRequestRecord,
  ID,
  IntentAnalysisRecord,
  MediaAssetRecord,
  ProjectRecord,
  QAReportRecord,
  RenderJobRecord,
  RenderRecord,
  SourceClipSequenceRecord,
  StrokeMotionPlanRecord,
} from '../types'

export interface BackendActorContext {
  workspaceId: ID
  userId: ID
  displayName?: string
}

export interface MockClipInput {
  fileName: string
  mimeType: string
  durationSeconds?: number
  userNotes?: string
  uploadedOrder?: number
}

export interface ChatNativePlanningInput {
  workspaceId?: ID
  userId?: ID
  projectTitle?: string
  prompt?: string
  clips?: MockClipInput[]
  requestedStrokeMotion?: boolean
  strokeMotionMode?: 'spoken_story_mode' | 'source_reading_mode'
}

export interface ChatNativePlanningState {
  project: ProjectRecord
  chatSession: ChatSessionRecord
  messages: ChatMessageRecord[]
  sourceAssets: MediaAssetRecord[]
  sourceSequence: SourceClipSequenceRecord
  intentAnalysis: IntentAnalysisRecord
  editPlan: EditPlanRecord
  qualityProfile: EditQualityProfileRecord
  strokeMotionPlan?: StrokeMotionPlanRecord
  creditEstimate: CreditEstimateRecord
  nextRequiredAction: 'approve_plan_and_credits'
}

export interface ApprovedGenerationState extends ChatNativePlanningState {
  creditReservation: CreditReservationRecord
  generationRequest: GenerationRequestRecord
  generatedAsset: GeneratedAssetRecord
  renderJob: RenderJobRecord
  previewRender: RenderRecord
  qaReport: QAReportRecord
  previewReady: boolean
}

export interface ReeditProMockE2ESummary {
  projectId: ID
  chatSessionId: ID
  sourceClipCount: number
  editPlanStatus: string
  editComplexity: string
  strokeMotionMode?: string
  creditEstimateTotal: number
  creditsReserved: number
  jobCount: number
  generationRequestCount: number
  renderStatus: string
  qaStatus: string
  previewReady: boolean
}
