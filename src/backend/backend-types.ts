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
  MusicContextAnalysisRecord,
  MusicCueCountDecision,
  MusicCueRecord,
  MusicCueSheetRecord,
  MusicGenreFamily,
  MusicLanguageContextRecord,
  MusicMixPlanRecord,
  MusicNeedDecision,
  MusicSceneType,
  MusicSpeechPresence,
  MusicCultureRegion,
  VocalPolicy,
  ProjectRecord,
  QAReportRecord,
  ReferenceMusicDNARecord,
  RenderJobRecord,
  RenderRecord,
  SourceClipSequenceRecord,
  StrokeMotionPlanRecord,
  TargetPlatform,
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
  includeMusicDirectorPlanning?: boolean
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
  musicDirectorPlan?: MusicDirectorPlanningResult
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
  musicNeedDecision?: MusicNeedDecision
  musicCueCountDecision?: MusicCueCountDecision
  musicCueCount?: number
  lyricsAllowedSomewhere?: boolean
  musicNextStep?: MusicDirectorPlanningResult['nextStep']
}

export interface MusicDirectorSceneInput {
  id?: ID
  sceneType?: MusicSceneType
  label?: string
  summary: string
  startTimeSeconds?: number
  endTimeSeconds?: number
  hasSpeech?: boolean
  isMontage?: boolean
  locationHint?: string
}

export interface MusicDirectorPlanningInput {
  workspaceId?: ID
  projectId: ID
  editPlanId: ID
  chatSessionId?: ID
  referenceAssetId?: ID
  userPrompt: string
  transcriptSummary?: string
  videoType?: string
  targetPlatform?: TargetPlatform
  sceneDescriptions?: MusicDirectorSceneInput[]
  sourceClipSummaries?: string[]
  referenceSummary?: string
  audioEnvironmentSummary?: string
  editQualitySummary?: string
  userMusicInstructions?: string[]
  avoidMusicInstructions?: string[]
  spokenLanguages?: string[]
  audience?: string
  settingSummary?: string
}

export interface MusicDirectorPlanningResult {
  musicContextAnalysis: MusicContextAnalysisRecord
  languageContexts: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  cueSheet: MusicCueSheetRecord
  cues: MusicCueRecord[]
  mixPlans: MusicMixPlanRecord[]
  nextStep: 'create_lyria_prompt_plan'
  warnings: string[]
}

export interface MockMusicDirectorScenario {
  id: string
  title: string
  userPrompt: string
  videoType: string
  transcriptSummary: string
  settingSummary: string
  speechPresence: MusicSpeechPresence
  montagePresent: boolean
  referenceSummary?: string
  sceneDescriptions: MusicDirectorSceneInput[]
  expectedMusicNeedDecision: MusicNeedDecision
  expectedCueCountDecision: MusicCueCountDecision
  expectedVocalPolicy: VocalPolicy
  expectedCultureRegion: MusicCultureRegion
  expectedGenreDirection: MusicGenreFamily[]
}
