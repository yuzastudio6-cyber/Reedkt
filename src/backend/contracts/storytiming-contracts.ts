import type {
  EditComplexity,
  EditPlanRecord,
  EditPlanSegmentRecord,
  StoryBeatRecord,
  SignatureRouteRecord,
} from '../../types/planning'
import type {
  CaptionPlanRecord,
  CutDecisionRecord,
  PacingAnalysisRecord,
  TransitionPlanRecord,
} from '../../types/edit-quality'
import type {
  MusicCueSheetItemRecord,
  MusicMixPlanRecord,
} from '../../types/audio-music'
import type {
  SFXEventPlanRecord,
  SFXMixPlanRecord,
  SFXTimingAlignmentRecord,
  SFXTrimPlanRecord,
} from '../../types/sfx-director'
import type {
  StrokeMotionBeatRecord,
  StrokeMotionPlanRecord,
  StrokeMotionTimingAnchorRecord,
} from '../../types/stroke-motion'
import type {
  QAReportRecord,
  RenderJobInputRecord,
} from '../../types/review-render-export'
import type {
  ID,
  Seconds,
  TargetPlatform,
} from '../../types/shared'
import type {
  MasterTimingMapRecord,
  CaptionTimingPlanRecord,
  CutTimingPlanRecord,
  MusicBeatGridRecord,
  MusicDuckingTimingPlanRecord,
  RenderTimingAssetRequirement,
  RenderTimingManifestRecord,
  RenderTimingValidationResult,
  RenderTimingWorkerInputRecord,
  RenderTimingWorkerReadiness,
  SignatureTimingPlanRecord,
  SoundSyncTimingIntegrationRecord,
  StoryTimingAdjustmentRecommendationRecord,
  StoryTimingAuthority,
  StoryTimingQARecommendedAction,
  StoryTimingQAReportRecord,
  StoryTimingQACheckRecord,
  StoryTimingReadinessDecision,
  StoryTimingSourceRef,
  StoryTimingSourceSystem,
  StoryTimingTrackType,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'

type NewStoryTimingRecord<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>

export interface CreateMasterTimingMapRequest {
  workspaceId?: ID
  projectId: ID
  editPlanId: ID
  chatSessionId?: ID
  durationSeconds: Seconds
  frameRate: number
  primaryTimingAuthority: StoryTimingAuthority
  sourceSystemsIncluded?: StoryTimingSourceSystem[]
  summary?: string
  notes?: string[]
}

export interface CreateMasterTimingMapResponse {
  masterTimingMap: MasterTimingMapRecord
  warnings: string[]
}

export type StoryTimingPlannerNextStep =
  | 'review_timing_map'
  | 'run_timing_qa'
  | 'create_render_manifest'
  | 'resolve_timing_conflicts'
  | 'await_user_review'

export interface StoryTimingPlanningSources {
  editPlan?: EditPlanRecord
  editPlanSegments: EditPlanSegmentRecord[]
  storyBeats?: StoryBeatRecord[]
  pacingAnalysis?: PacingAnalysisRecord[]
  cutDecisions?: CutDecisionRecord[]
  transitionPlans?: TransitionPlanRecord[]
  captionPlans?: CaptionPlanRecord[]
  musicCues?: MusicCueSheetItemRecord[]
  musicMixPlans?: MusicMixPlanRecord[]
  sfxEventPlans?: SFXEventPlanRecord[]
  sfxTrimPlans?: SFXTrimPlanRecord[]
  sfxTimingAlignments?: SFXTimingAlignmentRecord[]
  sfxMixPlans?: SFXMixPlanRecord[]
  strokeMotionPlans?: StrokeMotionPlanRecord[]
  strokeMotionBeats?: StrokeMotionBeatRecord[]
  strokeMotionTimingAnchors?: StrokeMotionTimingAnchorRecord[]
  signatureRoutes?: SignatureRouteRecord[]
  renderJobInputs?: RenderJobInputRecord[]
  qaReports?: QAReportRecord[]
}

export interface StoryTimingPlannerOutput {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  captionTimingPlans: CaptionTimingPlanRecord[]
  captionEvents: TimingEventRecord[]
  cutTimingPlans: CutTimingPlanRecord[]
  cutEvents: TimingEventRecord[]
  pauseAnchors: TimingAnchorRecord[]
  musicAnchors: TimingAnchorRecord[]
  musicEvents: TimingEventRecord[]
  beatGrids: MusicBeatGridRecord[]
  duckingPlans: MusicDuckingTimingPlanRecord[]
  duckingEvents: TimingEventRecord[]
  sfxAnchors: TimingAnchorRecord[]
  sfxEvents: TimingEventRecord[]
  soundSyncTimingIntegration?: SoundSyncTimingIntegrationRecord
  signatureTimingPlans: SignatureTimingPlanRecord[]
  signatureAnchors: TimingAnchorRecord[]
  signatureEvents: TimingEventRecord[]
  signatureDependencies: TimingDependencyRecord[]
  signatureConflicts: TimingConflictRecord[]
  signatureQAChecks: StoryTimingQACheckRecord[]
  timingQAReport?: StoryTimingQAReportRecord
  timingAdjustmentRecommendations?: StoryTimingAdjustmentRecommendationRecord[]
  timingReadinessDecision?: StoryTimingReadinessDecision
  timingQAChatSummary?: string[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  conflictResolutions: TimingConflictResolutionRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  renderTimingManifest: RenderTimingManifestRecord
  renderTimingWorkerInput?: RenderTimingWorkerInputRecord
  renderTimingValidation?: RenderTimingValidationResult
  renderTimingChatSummary?: string[]
  chatSummary: string[]
  nextStep: StoryTimingPlannerNextStep
  warnings: string[]
}

export interface CreateStoryTimingPlanRequest {
  workspaceId?: ID
  projectId: ID
  editPlanId: ID
  chatSessionId?: ID
  targetPlatform?: TargetPlatform
  editComplexity?: EditComplexity
  userTimingInstructions?: string[]
  avoidTimingInstructions?: string[]
  sources: StoryTimingPlanningSources
}

export type CreateStoryTimingPlanResponse = StoryTimingPlannerOutput

export interface CreateTimingSegmentsRequest {
  masterTimingMap: MasterTimingMapRecord
  editPlanSegments: EditPlanSegmentRecord[]
  storyBeats?: StoryBeatRecord[]
  pacingAnalysis?: PacingAnalysisRecord[]
  captionPlans?: CaptionPlanRecord[]
  musicCues?: MusicCueSheetItemRecord[]
  sfxEventPlans?: SFXEventPlanRecord[]
  signatureRoutes?: SignatureRouteRecord[]
}

export interface CreateTimingSegmentsResponse {
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  warnings: string[]
}

export interface CreateTimingAnchorsRequest {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  sourceRefs?: StoryTimingSourceRef[]
  anchors: NewStoryTimingRecord<TimingAnchorRecord>[]
}

export interface CreateTimingAnchorsResponse {
  timingAnchors: TimingAnchorRecord[]
  warnings: string[]
}

export interface CreateTimingEventsRequest {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  sourceRefs?: StoryTimingSourceRef[]
  events: NewStoryTimingRecord<TimingEventRecord>[]
  dependencies?: NewStoryTimingRecord<TimingDependencyRecord>[]
}

export interface CreateTimingEventsResponse {
  timingEvents: TimingEventRecord[]
  timingDependencies: TimingDependencyRecord[]
  warnings: string[]
}

export interface DetectTimingConflictsRequest {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  timingEventIds?: ID[]
  timingAnchorIds?: ID[]
  sourceSystems?: StoryTimingSourceSystem[]
}

export interface DetectTimingConflictsResponse {
  timingConflicts: TimingConflictRecord[]
  warnings: string[]
}

export interface CreateTimingQARequest {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  segmentIds?: ID[]
  checks: NewStoryTimingRecord<StoryTimingQACheckRecord>[]
}

export interface CreateTimingQAResponse {
  qaChecks: StoryTimingQACheckRecord[]
  blockingCheckIds: ID[]
  warnings: string[]
}

export interface RunStoryTimingQARequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  conflictResolutions?: TimingConflictResolutionRecord[]
}

export interface RunStoryTimingQAResponse {
  qaChecks: StoryTimingQACheckRecord[]
  blockingCheckIds: ID[]
  warnings: string[]
}

export interface CreateTranscriptAnchorsRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  editPlanSegments: EditPlanSegmentRecord[]
  pacingAnalysis?: PacingAnalysisRecord[]
  userTimingInstructions?: string[]
}

export interface CreateTranscriptAnchorsResponse {
  transcriptAnchors: TimingAnchorRecord[]
  warnings: string[]
}

export interface CreateCaptionTimingPlansRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  captionPlans?: CaptionPlanRecord[]
  userTimingInstructions?: string[]
  targetPlatform?: TargetPlatform
  editComplexity?: EditComplexity
}

export interface CreateCaptionTimingPlansResponse {
  captionTimingPlans: CaptionTimingPlanRecord[]
  captionEvents: TimingEventRecord[]
  warnings: string[]
}

export interface CreateCutTimingPlansRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  cutDecisions?: CutDecisionRecord[]
  pacingAnalysis?: PacingAnalysisRecord[]
  storyBeats?: StoryBeatRecord[]
  targetPlatform?: TargetPlatform
  editComplexity?: EditComplexity
}

export interface CreateCutTimingPlansResponse {
  cutTimingPlans: CutTimingPlanRecord[]
  cutEvents: TimingEventRecord[]
  cutAnchors: TimingAnchorRecord[]
  warnings: string[]
}

export interface RunCaptionCutTimingQARequest {
  masterTimingMap: MasterTimingMapRecord
  transcriptAnchors: TimingAnchorRecord[]
  captionTimingPlans: CaptionTimingPlanRecord[]
  captionEvents: TimingEventRecord[]
  cutTimingPlans: CutTimingPlanRecord[]
  cutEvents: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
}

export interface RunCaptionCutTimingQAResponse {
  qaChecks: StoryTimingQACheckRecord[]
  warnings: string[]
}

export interface CreateMusicTimingEventsRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  musicCues?: MusicCueSheetItemRecord[]
}

export interface CreateMusicTimingEventsResponse {
  musicAnchors: TimingAnchorRecord[]
  musicEvents: TimingEventRecord[]
  warnings: string[]
}

export interface CreateMusicBeatGridRequest {
  masterTimingMap: MasterTimingMapRecord
  musicCue: MusicCueSheetItemRecord
  bpm?: number
}

export interface CreateMusicBeatGridResponse {
  beatGrid: MusicBeatGridRecord
  beatAnchors: TimingAnchorRecord[]
  warnings: string[]
}

export interface CreateMusicDuckingTimingRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  musicCues?: MusicCueSheetItemRecord[]
  musicMixPlans?: MusicMixPlanRecord[]
}

export interface CreateMusicDuckingTimingResponse {
  duckingPlans: MusicDuckingTimingPlanRecord[]
  duckingEvents: TimingEventRecord[]
  warnings: string[]
}

export interface CreateSFXTimingEventsRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  sfxEventPlans?: SFXEventPlanRecord[]
  sfxTrimPlans?: SFXTrimPlanRecord[]
  sfxTimingAlignments?: SFXTimingAlignmentRecord[]
  sfxMixPlans?: SFXMixPlanRecord[]
}

export interface CreateSFXTimingEventsResponse {
  sfxAnchors: TimingAnchorRecord[]
  sfxEvents: TimingEventRecord[]
  warnings: string[]
}

export interface RunSoundSyncTimingQARequest {
  masterTimingMap: MasterTimingMapRecord
  musicAnchors: TimingAnchorRecord[]
  musicEvents: TimingEventRecord[]
  beatGrids: MusicBeatGridRecord[]
  duckingPlans: MusicDuckingTimingPlanRecord[]
  duckingEvents: TimingEventRecord[]
  sfxAnchors: TimingAnchorRecord[]
  sfxEvents: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
}

export interface RunSoundSyncTimingQAResponse {
  qaChecks: StoryTimingQACheckRecord[]
  warnings: string[]
}

export interface CreateSignatureTimingPlansRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  captionEvents: TimingEventRecord[]
  musicEvents: TimingEventRecord[]
  sfxEvents: TimingEventRecord[]
  signatureRoutes?: SignatureRouteRecord[]
  strokeMotionPlans?: StrokeMotionPlanRecord[]
  strokeMotionBeats?: StrokeMotionBeatRecord[]
  strokeMotionTimingAnchors?: StrokeMotionTimingAnchorRecord[]
  editPlanSegments?: EditPlanSegmentRecord[]
  storyBeats?: StoryBeatRecord[]
  transitionPlans?: TransitionPlanRecord[]
  userTimingInstructions?: string[]
  videoTone?: string
  editComplexity?: EditComplexity
}

export interface CreateSignatureTimingPlansResponse {
  signatureTimingPlans: SignatureTimingPlanRecord[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  chatSummary: string[]
  warnings: string[]
}

export interface CreateStrokeMotionTimingEventsRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  sfxEvents?: TimingEventRecord[]
  strokeMotionBeats?: StrokeMotionBeatRecord[]
  strokeMotionTimingAnchors?: StrokeMotionTimingAnchorRecord[]
}

export interface CreateStrokeMotionTimingEventsResponse {
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  warnings: string[]
}

export interface CreateGraphicDesignTimingEventsRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  captionEvents?: TimingEventRecord[]
  signatureRoutes?: SignatureRouteRecord[]
  editComplexity?: EditComplexity
}

export interface CreateGraphicDesignTimingEventsResponse {
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  warnings: string[]
}

export interface CreateRealMotionTimingEventsRequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  captionEvents?: TimingEventRecord[]
  sfxEvents?: TimingEventRecord[]
  signatureRoutes?: SignatureRouteRecord[]
}

export interface CreateRealMotionTimingEventsResponse {
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  warnings: string[]
}

export interface RunSignatureTimingQARequest {
  masterTimingMap: MasterTimingMapRecord
  signatureTimingPlans: SignatureTimingPlanRecord[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
}

export interface RunSignatureTimingQAResponse {
  qaChecks: StoryTimingQACheckRecord[]
  warnings: string[]
}

export interface RunFullStoryTimingQARequest {
  masterTimingMap: MasterTimingMapRecord
  segments: import('../../types/storytiming').StoryTimingSegmentRecord[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  captionTimingPlans?: CaptionTimingPlanRecord[]
  cutTimingPlans?: CutTimingPlanRecord[]
  musicEvents?: TimingEventRecord[]
  beatGrids?: MusicBeatGridRecord[]
  duckingPlans?: MusicDuckingTimingPlanRecord[]
  sfxEvents?: TimingEventRecord[]
  signatureTimingPlans?: SignatureTimingPlanRecord[]
  renderTimingManifest?: RenderTimingManifestRecord
  qaChecks?: StoryTimingQACheckRecord[]
  userTimingInstructions?: string[]
  editComplexity?: EditComplexity
  videoTone?: string
  targetPlatform?: TargetPlatform
}

export type FullStoryTimingQANextStep =
  | 'ready_for_timing_review'
  | 'adjust_timing'
  | 'create_timing_review_ui'
  | 'create_render_manifest'

export interface RunFullStoryTimingQAResponse {
  qaReport: StoryTimingQAReportRecord
  qaChecks: StoryTimingQACheckRecord[]
  conflicts: TimingConflictRecord[]
  adjustmentRecommendations: StoryTimingAdjustmentRecommendationRecord[]
  readinessDecision: StoryTimingReadinessDecision
  chatSummary: string[]
  nextStep: FullStoryTimingQANextStep
  warnings: string[]
}

export interface CreateStoryTimingQAReportRequest extends RunFullStoryTimingQARequest {
  readinessDecision: StoryTimingReadinessDecision
  recommendedActions?: StoryTimingQARecommendedAction[]
}

export interface CreateStoryTimingQAReportResponse {
  qaReport: StoryTimingQAReportRecord
  warnings: string[]
}

export interface CreateTimingAdjustmentRecommendationsRequest {
  masterTimingMap: MasterTimingMapRecord
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  events?: TimingEventRecord[]
  anchors?: TimingAnchorRecord[]
}

export interface CreateTimingAdjustmentRecommendationsResponse {
  adjustmentRecommendations: StoryTimingAdjustmentRecommendationRecord[]
  warnings: string[]
}

export interface DetermineStoryTimingReadinessRequest {
  masterTimingMap: MasterTimingMapRecord
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  overallScore: number
  renderTimingManifest?: RenderTimingManifestRecord
}

export interface DetermineStoryTimingReadinessResponse {
  readinessDecision: StoryTimingReadinessDecision
  previewReady: boolean
  renderReady: boolean
  requiresAdjustment: boolean
  requiresUserReview: boolean
  warnings: string[]
}

export interface CreateRenderTimingManifestRequest {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  renderJobId?: ID
  manifest: NewStoryTimingRecord<RenderTimingManifestRecord>
}

export interface CreateRenderTimingManifestResponse {
  renderTimingManifest: RenderTimingManifestRecord
  readyForRender: boolean
  blockingConflictIds: ID[]
  warnings: string[]
}

export interface BuildRenderTimingManifestRequest {
  masterTimingMap: MasterTimingMapRecord
  segments?: import('../../types/storytiming').StoryTimingSegmentRecord[]
  events: TimingEventRecord[]
  dependencies?: TimingDependencyRecord[]
  conflicts?: TimingConflictRecord[]
  conflictResolutions?: TimingConflictResolutionRecord[]
  qaReport?: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
  renderJobId?: ID
  requiredTrackTypes?: StoryTimingTrackType[]
  requiredAssets?: RenderTimingAssetRequirement[]
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
}

export interface BuildRenderTimingManifestResponse {
  renderTimingManifest: RenderTimingManifestRecord
  tracks: RenderTimingManifestRecord['tracks']
  manifestEvents: RenderTimingManifestRecord['events']
  dependencyMap: unknown
  validation: RenderTimingValidationResult
  workerInput: RenderTimingWorkerInputRecord
  chatSummary: string[]
  warnings: string[]
}

export interface ValidateRenderTimingManifestRequest {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
  dependencies?: TimingDependencyRecord[]
  conflicts?: TimingConflictRecord[]
  qaReport?: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
  requiredAssets?: RenderTimingAssetRequirement[]
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
}

export interface ValidateRenderTimingManifestResponse {
  validation: RenderTimingValidationResult
  warnings: string[]
}

export interface CreateRenderTimingWorkerInputRequest {
  renderTimingManifest: RenderTimingManifestRecord
  validation: RenderTimingValidationResult
  dependencyMap: unknown
  layerOrder: unknown[]
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
}

export interface CreateRenderTimingWorkerInputResponse {
  workerInput: RenderTimingWorkerInputRecord
  warnings: string[]
}

export interface DetermineRenderTimingWorkerReadinessRequest {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
  conflicts?: TimingConflictRecord[]
  qaReport?: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
  requiredAssets?: RenderTimingAssetRequirement[]
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
}

export interface DetermineRenderTimingWorkerReadinessResponse {
  readiness: RenderTimingWorkerReadiness
  mockWorkerReady: boolean
  futureRenderWorkerReady: boolean
  warnings: string[]
}
