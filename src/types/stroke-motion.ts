import type { BaseRecord, ID, ISODateString, JSONObject } from './shared'
import type { UserIntentConfidence } from './planning'

interface CreatedOnlyRecord {
  id: ID
  createdAt: ISODateString
  metadata?: JSONObject
}

export type StrokeMotionUnderstandingMode = 'spoken_story_mode' | 'source_reading_mode'

export type StrokeMotionSourceTextType =
  | 'spoken_story'
  | 'scripture'
  | 'book_passage'
  | 'quote'
  | 'script'
  | 'historical_text'
  | 'document'
  | 'lesson'
  | 'article'
  | 'unknown'

export type SourceTextType = StrokeMotionSourceTextType

export type StrokeMotionPlanStatus =
  | 'draft'
  | 'planning'
  | 'awaiting_user_input'
  | 'awaiting_approval'
  | 'approved'
  | 'ready_for_generation'
  | 'generating'
  | 'generated'
  | 'preview_ready'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type StrokeMotionStyleLevel =
  | 'minimal'
  | 'balanced'
  | 'expressive'
  | 'cinematic'
  | 'faith_respectful'
  | 'educational_clear'
  | 'playful'
  | 'premium_subtle'

export type StrokeMotionCharacterRole =
  | 'main_subject'
  | 'secondary_subject'
  | 'speaker_proxy'
  | 'symbolic_person'
  | 'group'
  | 'messenger'
  | 'object_proxy'
  | 'unknown'

export type StrokeMotionSymbolType =
  | 'question_mark'
  | 'heart'
  | 'ring'
  | 'connection_line'
  | 'broken_line'
  | 'path'
  | 'light'
  | 'glow'
  | 'star'
  | 'message'
  | 'scroll'
  | 'door'
  | 'shield'
  | 'circle'
  | 'underline'
  | 'arrow'
  | 'warning'
  | 'success'
  | 'custom'

export type StrokeMotionTransitionType =
  | 'draw_on'
  | 'morph'
  | 'path_follow'
  | 'line_to_glow'
  | 'line_to_crack'
  | 'crack_to_path'
  | 'path_to_light'
  | 'light_to_connection'
  | 'connection_to_circle'
  | 'fade_out'
  | 'wipe_out'
  | 'match_motion'
  | 'none'
  | 'custom'

export type StrokeMotionTransitionStrategy = StrokeMotionTransitionType | 'connected_story_line' | 'symbol_morph_chain'

export type StrokeMotionTimingAnchorType =
  | 'word'
  | 'phrase'
  | 'sentence'
  | 'pause'
  | 'emotional_shift'
  | 'scene_cut'
  | 'music_beat'
  | 'sfx_hit'
  | 'manual'

export type StrokeMotionGenerationStatus =
  | 'not_started'
  | 'planned'
  | 'awaiting_approval'
  | 'queued'
  | 'generating'
  | 'generated'
  | 'failed'
  | 'cancelled'
  | 'revision_requested'

export type StrokeMotionRenderStatus = StrokeMotionGenerationStatus

export type StrokeMotionOutputFormat =
  | 'svg'
  | 'lottie'
  | 'remotion'
  | 'transparent_video'
  | 'image_sequence'
  | 'json_spec'
  | 'unknown'

export type StrokeMotionSfxHint =
  | 'none'
  | 'soft_draw'
  | 'light_whoosh'
  | 'gentle_hit'
  | 'soft_rise'
  | 'subtle_crack'
  | 'message_chime'
  | 'ambient_soft'
  | 'custom'

export interface StrokeMotionPlanRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  signatureRouteId?: ID
  jobId?: ID
  agentRunId?: ID
  creditEstimateId?: ID
  status: StrokeMotionPlanStatus
  understandingMode: StrokeMotionUnderstandingMode
  sourceTextType: StrokeMotionSourceTextType
  sourceReference?: string
  sourceExcerpt?: string
  spokenTranscriptExcerpt?: string
  storySummary: string
  meaningExpansionSummary?: string
  animationGoal: string
  styleLevel: StrokeMotionStyleLevel
  transitionStrategy?: string
  timingStrategy?: string
  continuousLineStrategy: boolean
  transparentOverlayRequired: boolean
  approvalRequired: boolean
  approvedAt?: ISODateString
  approvedBy?: ID
  generationStatus: StrokeMotionGenerationStatus
  workerNotes?: string
  mustFollowRules: string[]
  avoidRules: string[]
  planPayload: JSONObject
}

export interface StrokeMotionMeaningExpansionRecord extends BaseRecord {
  strokeMotionPlanId: ID
  workspaceId: ID
  projectId: ID
  sourceTextType: StrokeMotionSourceTextType
  sourceReference?: string
  sourceExcerpt?: string
  plainLanguageSummary: string
  expandedStoryBeats: JSONObject[]
  interpretationNotes?: string
  confidence: UserIntentConfidence
  requiresUserConfirmation: boolean
  mustFollowRules: string[]
  avoidRules: string[]
  createdByAgent?: string
}

export interface StrokeMotionBeatRecord extends BaseRecord {
  strokeMotionPlanId: ID
  workspaceId: ID
  projectId: ID
  editPlanSegmentId?: ID
  storyBeatId?: ID
  beatOrder: number
  storyBeatLabel: string
  meaning: string
  visualAction: string
  motionPath?: string
  transitionIn?: string
  transitionOut?: string
  startTimeSeconds?: number
  endTimeSeconds?: number
  matchedWords?: string
  timingAnchorLabel?: string
  sfxHint: StrokeMotionSfxHint
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  workerNotes?: string
  mustFollowRules: string[]
  avoidRules: string[]
  beatPayload: JSONObject
  renderStatus: StrokeMotionGenerationStatus
}

export interface StrokeMotionCharacterRecord extends BaseRecord {
  strokeMotionPlanId: ID
  workspaceId: ID
  projectId: ID
  characterKey: string
  displayName?: string
  role: StrokeMotionCharacterRole
  description?: string
  visualStyle?: string
  emotionState?: string
  isSymbolic: boolean
  characterPayload: JSONObject
}

export interface StrokeMotionSymbolRecord extends BaseRecord {
  strokeMotionPlanId: ID
  workspaceId: ID
  projectId: ID
  symbolKey: string
  symbolType: StrokeMotionSymbolType
  label?: string
  meaning: string
  visualStyle?: string
  usageNotes?: string
  symbolPayload: JSONObject
}

export interface StrokeMotionBeatCharacterRecord extends CreatedOnlyRecord {
  strokeMotionBeatId: ID
  strokeMotionCharacterId: ID
  roleInBeat?: string
  actionInBeat?: string
}

export interface StrokeMotionBeatSymbolRecord extends CreatedOnlyRecord {
  strokeMotionBeatId: ID
  strokeMotionSymbolId: ID
  roleInBeat?: string
  actionInBeat?: string
}

export interface StrokeMotionTransitionRecord extends BaseRecord {
  strokeMotionPlanId: ID
  workspaceId: ID
  projectId: ID
  fromBeatId?: ID
  toBeatId?: ID
  transitionOrder: number
  transitionType: StrokeMotionTransitionType
  transitionDescription: string
  motionPath?: string
  durationSeconds?: number
  timingNotes?: string
  sfxHint: StrokeMotionSfxHint
  workerNotes?: string
  transitionPayload: JSONObject
}

export interface StrokeMotionTimingAnchorRecord extends BaseRecord {
  strokeMotionPlanId: ID
  strokeMotionBeatId?: ID
  workspaceId: ID
  projectId: ID
  anchorType: StrokeMotionTimingAnchorType
  anchorLabel?: string
  matchedText?: string
  startTimeSeconds?: number
  endTimeSeconds?: number
  wordIndexStart?: number
  wordIndexEnd?: number
  musicBeatReference?: string
  manualNote?: string
  confidence: UserIntentConfidence
  anchorPayload: JSONObject
}

export interface StrokeMotionStoryboardFrameRecord extends BaseRecord {
  strokeMotionPlanId: ID
  strokeMotionBeatId?: ID
  workspaceId: ID
  projectId: ID
  frameOrder: number
  title: string
  description: string
  visualComposition?: string
  cameraOrOverlayPosition?: string
  expectedViewerUnderstanding?: string
  framePayload: JSONObject
}

export interface StrokeMotionGenerationSpecRecord extends BaseRecord {
  strokeMotionPlanId: ID
  workspaceId: ID
  projectId: ID
  preferredOutputFormat: StrokeMotionOutputFormat
  transparentBackgroundRequired: boolean
  wordLevelTimingRequired: boolean
  deterministicRendererPreferred: boolean
  suggestedRenderer?: string
  suggestedAiProvider?: string
  durationSeconds?: number
  width?: number
  height?: number
  frameRate?: number
  styleConstraints: JSONObject
  timingConstraints: JSONObject
  prompt?: string
  negativePrompt?: string
  workerNotes?: string
  generationRequestId?: ID
  specPayload: JSONObject
}

export interface StrokeMotionPlanExampleRecord extends BaseRecord {
  exampleKey: string
  title: string
  description?: string
  useCase?: string
  understandingMode?: StrokeMotionUnderstandingMode
  sourceTextType?: StrokeMotionSourceTextType
  storyPattern?: string
  examplePayload: JSONObject
  isActive: boolean
}

export const STROKE_MOTION_MEANING_EXPANSION_RULE =
  'source_reading_mode requires meaning_expansion before Stroke Motion animation planning.'

export const JOSEPH_MARY_MEANING_EXPANSION_EXAMPLE = [
  'Mary and Joseph were engaged.',
  'Mary was pregnant by the Holy Spirit.',
  'Joseph did not fully understand.',
  'Joseph wanted to separate quietly.',
  'An angel appeared in a dream.',
  'The angel explained the child was from God.',
  'Joseph obeyed and accepted Mary.',
] as const

export const JOSEPH_MARY_TRANSITION_CHAIN_EXAMPLE = [
  'relationship line',
  'holy glow',
  'tension/crack',
  'separation path',
  'divine message line',
  'repaired connection',
  'protective circle',
  'fade/underline transition out',
] as const

export const STROKE_MOTION_OUTPUT_FORMATS: StrokeMotionOutputFormat[] = [
  'svg',
  'lottie',
  'remotion',
  'transparent_video',
  'image_sequence',
  'json_spec',
  'unknown',
]
