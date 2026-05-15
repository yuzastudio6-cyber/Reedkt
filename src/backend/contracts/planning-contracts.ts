import type {
  CreditEstimateRecord,
  EditPlanRecord,
  EditQualityProfileRecord,
  IntentAnalysisRecord,
  RecommendedEditStructureRecord,
  SourceSequenceMapRecord,
  StrokeMotionPlanRecord,
} from '../../types'

export interface AnalyzeIntentRequest {
  workspaceId: string
  projectId: string
  chatSessionId: string
  chatMessageId?: string
  prompt: string
}

export interface AnalyzeIntentResponse {
  intentAnalysis: IntentAnalysisRecord
}

export interface CreateEditPlanRequest {
  workspaceId: string
  projectId: string
  chatSessionId: string
  intentAnalysisId: string
  sourceClipSequenceId: string
}

export interface CreateEditPlanResponse {
  editPlan: EditPlanRecord
  sourceSequenceMap: SourceSequenceMapRecord
  recommendedStructure: RecommendedEditStructureRecord
}

export interface ReviseEditPlanRequest {
  editPlanId: string
  requestedChange: string
}

export interface ReviseEditPlanResponse {
  editPlan: EditPlanRecord
}

export interface CreateEditQualityPlanRequest {
  workspaceId: string
  projectId: string
  editPlanId: string
}

export interface CreateEditQualityPlanResponse {
  qualityProfile: EditQualityProfileRecord
}

export interface CreateStrokeMotionPlanRequest {
  workspaceId: string
  projectId: string
  editPlanId: string
  mode?: StrokeMotionPlanRecord['understandingMode']
}

export interface CreateStrokeMotionPlanResponse {
  strokeMotionPlan: StrokeMotionPlanRecord
}

export interface ReviseStrokeMotionPlanRequest {
  strokeMotionPlanId: string
  requestedChange: string
}

export interface ReviseStrokeMotionPlanResponse {
  strokeMotionPlan: StrokeMotionPlanRecord
}

export interface PlanningApprovalBundle {
  editPlan: EditPlanRecord
  creditEstimate: CreditEstimateRecord
}
