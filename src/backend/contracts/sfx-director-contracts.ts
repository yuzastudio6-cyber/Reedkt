import type {
  CreditApprovalRecord,
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  EditComplexity,
  EditPlanSegmentRecord,
  GeneratedAssetRecord,
  GenerationRequestRecord,
  JobRecord,
  SFXEventPlanRecord,
  SFXAnchorType,
  SFXDecisionState,
  SFXDurationPlan,
  SFXAdjustmentDecisionRecord,
  SFXLibraryDecision,
  SFXLibraryCandidateRecord,
  SFXLibrarySearchRecord,
  SFXMixValidationResult,
  SFXMixPlanRecord,
  SFXGeneratedAssetRecord,
  SFXMockWaveformAnalysisRecord,
  SFXPromptAdapterTestRecord,
  SFXPromptPlanRecord,
  SFXProvenanceReviewRecord,
  SFXProvider,
  SFXProviderRouteRecord,
  SFXQAReportRecord,
  SFXQAIssue,
  SFXQARecommendedAction,
  SFXRegenerationDecisionRecord,
  SFXReplacementDecisionRecord,
  SFXSourceFootagePolicy,
  SFXTargetLayer,
  SFXTimingAlignmentRecord,
  SFXTimingPriority,
  SFXTimingValidationResult,
  SFXTimelinePlacement,
  SFXTransientDetectionResult,
  SFXTrimPlanRecord,
  SFXUsageLearningRecord,
  SFXUsageRecord,
  SFXUsageType,
  SFXVolumeProfile,
  SFXMixPriority,
  SignatureRouteRecord,
  StrokeMotionBeatRecord,
  TransitionPlanRecord,
} from '../../types'
import type { SfxUseCase } from '../../types/audio-music'
import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import type { CreditImpact, ID } from '../../types/shared'
import type { EditQualityLevel } from '../../types/edit-quality'
import type { SFXWorkerRunResult } from '../workers/sfx-worker-contracts'

type NewSFXRecord<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>

export type SFXPlanningNextStep = 'create_sfx_prompt_plans'

export interface SFXMusicCueReference {
  id: ID
  label?: string
  sectionType?: string
  anchorTimeSeconds?: number
}

export interface SFXPlanningContext {
  workspaceId?: ID
  projectId: ID
  editPlanId: ID
  editPlanSegments?: EditPlanSegmentRecord[]
  transitionPlans?: TransitionPlanRecord[]
  signatureRoutes?: SignatureRouteRecord[]
  strokeMotionBeats?: StrokeMotionBeatRecord[]
  musicCues?: SFXMusicCueReference[]
  userPrompt?: string
  videoType?: string
  workflowContext?: string
  editComplexity?: EditComplexity | EditQualityLevel
  transcriptSummary?: string
  sceneSummaries?: string[]
  audioEnvironmentSummary?: string
  musicPlanSummary?: string
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
}

export interface SFXPlanningOpportunity {
  id: ID
  label: string
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  decisionState: SFXDecisionState
  sourceFootagePolicy: SFXSourceFootagePolicy
  reason: string
  sceneContext: string
  videoTone: string
  anchorType: SFXAnchorType
  anchorTimeSeconds: number
  timingPriority: SFXTimingPriority
  volumeProfile: SFXVolumeProfile
  mixPriority: SFXMixPriority
  creditImpact: CreditImpact
  requiresApproval: boolean
  editPlanSegmentId?: ID
  transitionPlanId?: ID
  signatureRouteId?: ID
  strokeMotionBeatId?: ID
  musicCueId?: ID
  recommendedProvider?: SFXProvider
  warnings: string[]
}

export interface SFXSkippedMoment {
  id: ID
  label: string
  reason: string
  targetLayer: SFXTargetLayer
  decisionState: Extract<SFXDecisionState, 'not_needed' | 'avoid'>
}

export type AnalyzeSFXOpportunitiesRequest = SFXPlanningContext

export interface AnalyzeSFXOpportunitiesResponse {
  plannedSFXOpportunities: SFXPlanningOpportunity[]
  avoidSFXOpportunities: SFXPlanningOpportunity[]
  skippedMoments: SFXSkippedMoment[]
  nextStep: SFXPlanningNextStep
  warnings: string[]
}

export type CreateSFXDirectorPlanRequest = SFXPlanningContext

export interface CreateSFXDirectorPlanResponse {
  sfxEventPlans: SFXEventPlanRecord[]
  providerRoutes: SFXProviderRouteRecord[]
  skippedMoments: SFXSkippedMoment[]
  avoidedMoments: SFXPlanningOpportunity[]
  nextStep: SFXPlanningNextStep
  warnings: string[]
}

export type SFXPromptNextStep = 'create_sfx_timing_trim_alignment_plan'

export interface SFXPromptPlanCreationResult {
  promptPlan?: SFXPromptPlanRecord
  skippedReason?: string
  warnings: string[]
}

export interface CreateSFXPromptPlansForEventsRequest {
  sfxEventPlans: SFXEventPlanRecord[]
  providerRoutes: SFXProviderRouteRecord[]
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
}

export interface CreateSFXPromptPlansForEventsResponse {
  sfxPromptPlans: SFXPromptPlanRecord[]
  skippedPromptPlans: SFXPromptPlanCreationResult[]
  validationWarnings: string[]
  nextStep: SFXPromptNextStep
  warnings: string[]
}

export type SFXTimingNextStep = 'create_sfx_mix_plan'

export interface CreateSFXDurationPlanRequest {
  sfxEventPlan: SFXEventPlanRecord
  sfxPromptPlan?: SFXPromptPlanRecord
}

export interface CreateSFXDurationPlanResponse {
  durationPlan: SFXDurationPlan
}

export interface AnalyzeMockSFXWaveformRequest {
  sfxEventPlan: SFXEventPlanRecord
  sfxPromptPlan: SFXPromptPlanRecord
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
}

export interface AnalyzeMockSFXWaveformResponse {
  waveformAnalysis: SFXMockWaveformAnalysisRecord
}

export interface DetectSFXTransientRequest {
  sfxEventPlan: SFXEventPlanRecord
  waveformAnalysis: SFXMockWaveformAnalysisRecord
}

export interface DetectSFXTransientResponse {
  transientDetection: SFXTransientDetectionResult
}

export interface CreateFinalSFXTimelinePlacementRequest {
  sfxTimingAlignment: SFXTimingAlignmentRecord
  fps?: 24 | 25 | 30 | 60
  speechPresent?: boolean
  musicBeatTimeSeconds?: number
}

export interface CreateFinalSFXTimelinePlacementResponse {
  timelinePlacement: SFXTimelinePlacement
}

export interface ValidateSFXTimingRequest {
  sfxEventPlan: SFXEventPlanRecord
  sfxTrimPlan: SFXTrimPlanRecord
  sfxTimingAlignment: SFXTimingAlignmentRecord
  timelinePlacement?: SFXTimelinePlacement
  speechPresent?: boolean
  musicBeatTimeSeconds?: number
}

export interface ValidateSFXTimingResponse {
  validation: SFXTimingValidationResult
}

export interface CreateSFXTimingFlowResponse {
  durationPlan: SFXDurationPlan
  generatedAsset: SFXGeneratedAssetRecord
  waveformAnalysis: SFXMockWaveformAnalysisRecord
  transientDetection: SFXTransientDetectionResult
  trimPlan: SFXTrimPlanRecord
  timingAlignment: SFXTimingAlignmentRecord
  timelinePlacement: SFXTimelinePlacement
  validation: SFXTimingValidationResult
  nextStep: SFXTimingNextStep
  warnings: string[]
}

export type SFXMixNextStep = 'run_sfx_qa'

export interface ValidateSFXPromptPlanRequest {
  promptPlan: SFXPromptPlanRecord
  sfxEventPlan: SFXEventPlanRecord
  providerRoute: SFXProviderRouteRecord
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
}

export interface ValidateSFXPromptPlanResponse {
  ok: boolean
  warnings: string[]
  errors: string[]
}

export type CreateSFXPromptAdapterTestRequest = NewSFXRecord<SFXPromptAdapterTestRecord>

export interface CreateSFXPromptAdapterTestResponse {
  promptAdapterTest: SFXPromptAdapterTestRecord
}

export type CreateSFXEventPlanRequest = NewSFXRecord<SFXEventPlanRecord>

export interface CreateSFXEventPlanResponse {
  sfxEventPlan: SFXEventPlanRecord
}

export type CreateSFXProviderRouteRequest = NewSFXRecord<SFXProviderRouteRecord>

export interface CreateSFXProviderRouteResponse {
  sfxProviderRoute: SFXProviderRouteRecord
}

export type CreateSFXPromptPlanRequest = NewSFXRecord<SFXPromptPlanRecord>

export interface CreateSFXPromptPlanResponse {
  sfxPromptPlan: SFXPromptPlanRecord
}

export interface CreateSFXTrimPlanRequest {
  sfxEventPlan: SFXEventPlanRecord
  sfxPromptPlan: SFXPromptPlanRecord
  sfxGeneratedAsset: SFXGeneratedAssetRecord
  waveformAnalysis: SFXMockWaveformAnalysisRecord
  transientDetection: SFXTransientDetectionResult
}

export interface CreateSFXTrimPlanResponse {
  sfxTrimPlan: SFXTrimPlanRecord
}

export interface CreateSFXTimingAlignmentRequest {
  sfxEventPlan: SFXEventPlanRecord
  sfxTrimPlan: SFXTrimPlanRecord
  waveformAnalysis?: SFXMockWaveformAnalysisRecord
}

export interface CreateSFXTimingAlignmentResponse {
  sfxTimingAlignment: SFXTimingAlignmentRecord
}

export interface CreateSFXVolumeProfileRequest {
  sfxEventPlan: SFXEventPlanRecord
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  videoTone?: string
  editLevel?: EditQualityLevel
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
}

export interface CreateSFXVolumeProfileResponse {
  volumeProfile: SFXVolumeProfile
  targetGainDb: number
  warnings: string[]
}

export interface CreateSFXMixPlanRequest {
  sfxEventPlan: SFXEventPlanRecord
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
  sfxTrimPlan?: SFXTrimPlanRecord
  sfxTimingAlignment?: SFXTimingAlignmentRecord
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  videoTone?: string
  editLevel?: EditQualityLevel
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
}

export interface CreateSFXMixPlanResponse {
  sfxMixPlan: SFXMixPlanRecord
}

export interface ValidateSFXMixPlanRequest {
  sfxMixPlan: SFXMixPlanRecord
  sfxEventPlan?: SFXEventPlanRecord
  sfxTimingAlignment?: SFXTimingAlignmentRecord
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
}

export interface ValidateSFXMixPlanResponse {
  validation: SFXMixValidationResult
}

export interface CreateSFXMixFlowResponse {
  mixPlan: SFXMixPlanRecord
  validation: SFXMixValidationResult
  chatSummary: string[]
  nextStep: SFXMixNextStep
  warnings: string[]
}

export type SFXQANextStep = 'use_sfx' | 'adjust_sfx' | 'regenerate_sfx' | 'remove_sfx' | 'ask_user'

export interface RunSFXQARequest {
  sfxEventPlan: SFXEventPlanRecord
  sfxProviderRoute?: SFXProviderRouteRecord
  sfxPromptPlan?: SFXPromptPlanRecord
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
  sfxTrimPlan?: SFXTrimPlanRecord
  sfxTimingAlignment?: SFXTimingAlignmentRecord
  sfxMixPlan?: SFXMixPlanRecord
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  videoTone?: string
  editLevel?: EditQualityLevel
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
  mockOutputSummary?: string
}

export interface RunSFXQAResponse {
  qaReport: SFXQAReportRecord
  qaIssues: SFXQAIssue[]
  recommendedAction: SFXQARecommendedAction
  regenerationDecision: SFXRegenerationDecisionRecord
  adjustmentDecision: SFXAdjustmentDecisionRecord
  replacementDecision: SFXReplacementDecisionRecord
  chatSummary: string[]
  nextStep: SFXQANextStep
  warnings: string[]
}

export type CreateSFXQAReportRequest = RunSFXQARequest

export interface CreateSFXQAReportResponse {
  sfxQAReport: SFXQAReportRecord
}

export interface CreateSFXRegenerationDecisionRequest {
  qaReport: SFXQAReportRecord
  sfxEventPlan: SFXEventPlanRecord
  sfxProviderRoute?: SFXProviderRouteRecord
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
  sfxMixPlan?: SFXMixPlanRecord
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
}

export interface CreateSFXRegenerationDecisionResponse {
  regenerationDecision: SFXRegenerationDecisionRecord
}

export interface CreateSFXAdjustmentDecisionRequest {
  qaReport: SFXQAReportRecord
  sfxEventPlan: SFXEventPlanRecord
  sfxTrimPlan?: SFXTrimPlanRecord
  sfxTimingAlignment?: SFXTimingAlignmentRecord
  sfxMixPlan?: SFXMixPlanRecord
}

export interface CreateSFXAdjustmentDecisionResponse {
  adjustmentDecision: SFXAdjustmentDecisionRecord
}

export interface CreateSFXReplacementDecisionRequest {
  qaReport: SFXQAReportRecord
  sfxEventPlan: SFXEventPlanRecord
  sfxProviderRoute?: SFXProviderRouteRecord
  sfxPromptPlan?: SFXPromptPlanRecord
}

export interface CreateSFXReplacementDecisionResponse {
  replacementDecision: SFXReplacementDecisionRecord
}

export type SFXLibraryGrowthNextStep = 'show_chat_native_sfx_ui' | 'prepare_sfx_worker_skeleton'

export interface SearchSFXLibraryRequest {
  projectId: ID
  workspaceId?: ID
  sfxEventPlan: SFXEventPlanRecord
  desiredDurationSeconds?: number
  desiredTone?: string[]
  approvedLibraryAssetIds?: ID[]
  simulateApprovedMatch?: boolean
}

export interface SearchSFXLibraryResponse {
  librarySearchRecord: SFXLibrarySearchRecord
  matchStrength: SFXLibrarySearchRecord['matchStrength']
  matchedLibraryAssetId?: ID
  fallbackReason?: string
  warnings: string[]
}

export interface ReviewSFXProvenanceRequest {
  projectId: ID
  workspaceId?: ID
  sfxGeneratedAsset: SFXGeneratedAssetRecord
  providerTermsKnown?: boolean
  commercialAllowed?: boolean
  adsAllowed?: boolean
  clientWorkAllowed?: boolean
  reuseAcrossUsersAllowed?: boolean
  requiresAttribution?: boolean
  licenseProvenanceId?: ID
}

export interface ReviewSFXProvenanceResponse {
  provenanceReview: SFXProvenanceReviewRecord
  warnings: string[]
}

export interface CreateSFXUsageRecordRequest {
  projectId: ID
  editPlanId?: ID
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
  sfxEventPlan: SFXEventPlanRecord
  sfxTimingAlignment?: SFXTimingAlignmentRecord
  sfxMixPlan?: SFXMixPlanRecord
  usageType?: SFXUsageType
  userKept?: boolean
  userRemoved?: boolean
  qaPassed?: boolean
}

export interface CreateSFXUsageRecordResponse {
  usageRecord: SFXUsageRecord
}

export interface CreateSFXUsageLearningRequest {
  projectId: ID
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
  sfxEventPlan: SFXEventPlanRecord
  usageRecord?: SFXUsageRecord
  qaReport?: SFXQAReportRecord
  regenerationRequested?: boolean
  replacementRequested?: boolean
}

export interface CreateSFXUsageLearningResponse {
  usageLearning: SFXUsageLearningRecord
}

export interface ProcessGeneratedSFXForLibraryGrowthRequest {
  workspaceId?: ID
  projectId: ID
  sfxEventPlan: SFXEventPlanRecord
  sfxProviderRoute?: SFXProviderRouteRecord
  sfxPromptPlan?: SFXPromptPlanRecord
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
  sfxTrimPlan?: SFXTrimPlanRecord
  sfxTimingAlignment?: SFXTimingAlignmentRecord
  sfxMixPlan?: SFXMixPlanRecord
  sfxQAReport?: SFXQAReportRecord
  sfxQAIssues?: SFXQAIssue[]
  usageType?: SFXUsageType
  userKept?: boolean
  userRemoved?: boolean
  providerTermsKnown?: boolean
  commercialAllowed?: boolean
  adsAllowed?: boolean
  clientWorkAllowed?: boolean
  reuseAcrossUsersAllowed?: boolean
  requiresAttribution?: boolean
  privacyContext?: string[]
  provenanceNotes?: string[]
  simulateApprovedLibraryMatch?: boolean
  simulateMockApproval?: boolean
}

export interface ProcessGeneratedSFXForLibraryGrowthResponse {
  libraryDecision: SFXLibraryDecision
  provenanceReview?: SFXProvenanceReviewRecord
  usageRecord?: SFXUsageRecord
  librarySearchRecord?: SFXLibrarySearchRecord
  libraryCandidate?: SFXLibraryCandidateRecord
  usageLearning?: SFXUsageLearningRecord
  chatSummary: string[]
  nextStep: SFXLibraryGrowthNextStep
  warnings: string[]
}

export type CreateSFXLibraryCandidateRequest = NewSFXRecord<SFXLibraryCandidateRecord>

export interface CreateSFXLibraryCandidateResponse {
  sfxLibraryCandidate: SFXLibraryCandidateRecord
}

export type EditProjectSFXStatus =
  | 'not_planned'
  | 'planned'
  | 'awaiting_credit_approval'
  | 'approved'
  | 'queued'
  | 'mock_generating'
  | 'generated'
  | 'timed'
  | 'mixed'
  | 'qa_passed'
  | 'qa_failed'
  | 'used_in_preview'
  | 'project_only'
  | 'library_candidate'
  | 'skipped_no_sfx'
  | 'blocked'

export type EditProjectSFXNextStep =
  | 'await_sfx_credit_approval'
  | 'queue_mock_sfx_generation'
  | 'run_mock_sfx_worker'
  | 'no_sfx_needed'

export interface CreateEditProjectSFXIntegrationRequest {
  workspaceId?: ID
  projectId: ID
  editPlanId: ID
  chatSessionId?: ID
  editComplexity: EditComplexity
  videoTone?: string
  userInstructions?: string[]
  avoidInstructions?: string[]
  mockOnly: true
  editPlanApproved?: boolean
  creditApproved?: boolean
  creditReserved?: boolean
  runMockWorker?: boolean
  simulateApprovedLibraryMatch?: boolean
  simulateMockApproval?: boolean
  simulateQAFailure?: boolean
  providerUnavailable?: boolean
}

export interface EditProjectSFXIntegrationResult {
  sfxEventPlans: SFXEventPlanRecord[]
  providerRoutes: SFXProviderRouteRecord[]
  promptPlans: SFXPromptPlanRecord[]
  skippedPromptPlans: SFXPromptPlanCreationResult[]
  creditEstimate?: CreditEstimateRecord
  creditEstimateLines: CreditEstimateLineItemRecord[]
  creditApproval?: CreditApprovalRecord
  creditReservation?: CreditReservationRecord
  generationRequests: GenerationRequestRecord[]
  jobs: JobRecord[]
  jobQueueItems: JobRuntimeQueueItem[]
  providerRouteSummary: string[]
  creditGateSummary: string[]
  nextStep: EditProjectSFXNextStep
  warnings: string[]
}

export type CreateEditProjectSFXIntegrationResponse = EditProjectSFXIntegrationResult

export interface EditProjectSFXProjectAssetDecision {
  sfxEventPlanId: ID
  status: Extract<
    EditProjectSFXStatus,
    'project_only' | 'library_candidate' | 'qa_failed' | 'skipped_no_sfx' | 'blocked'
  >
  generatedAssetId?: ID
  sfxGeneratedAssetId?: ID
  libraryCandidateId?: ID
  reason: string
}

export interface EditProjectSFXFlowResult {
  sfxIntegration: EditProjectSFXIntegrationResult
  workerOutputs: SFXWorkerRunResult[]
  generatedAssets: GeneratedAssetRecord[]
  timingPlans: SFXTimingAlignmentRecord[]
  mixPlans: SFXMixPlanRecord[]
  qaReports: SFXQAReportRecord[]
  projectAssetDecisions: EditProjectSFXProjectAssetDecision[]
  chatSummary: string[]
  statusSummary: string[]
  warnings: string[]
}
