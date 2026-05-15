import type {
  ApprovalStatus,
  CreditImpact,
  ID,
  ISODateString,
  JSONObject,
  ProcessingStatus,
  TimeRange,
} from './shared'

export type StrokeMotionUnderstandingMode = 'spoken_story_mode' | 'source_reading_mode'

export type SourceTextType =
  | 'spoken_story'
  | 'scripture'
  | 'book_passage'
  | 'quote'
  | 'script'
  | 'historical_text'
  | 'document'
  | 'unknown'

export type StrokeMotionStyleLevel = 'minimal' | 'balanced' | 'expressive' | 'premium_story'

export type StrokeMotionRenderStatus =
  | 'not_started'
  | 'planned'
  | 'queued'
  | 'generating'
  | 'rendered'
  | 'failed'
  | 'skipped'

export type StrokeMotionTransitionStrategy =
  | 'connected_story_line'
  | 'symbol_morph_chain'
  | 'path_reveal'
  | 'underline_to_symbol'
  | 'character_motion'
  | 'fade_out'

export interface StrokeMotionPlanRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  understandingMode: StrokeMotionUnderstandingMode
  sourceTextType: SourceTextType
  sourceReference?: string
  sourceExcerpt?: string
  storySummary: string
  meaningExpansionSummary?: string
  animationGoal: string
  styleLevel: StrokeMotionStyleLevel
  transitionStrategy: string
  timingStrategy: string
  approvalStatus: ApprovalStatus
  creditEstimateId?: ID
  generationStatus: ProcessingStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface StrokeMotionBeatRecord {
  id: ID
  strokeMotionPlanId: ID
  beatOrder: number
  storyBeatLabel: string
  meaning: string
  visualAction: string
  characterIds: ID[]
  symbolIds: ID[]
  motionPath: string
  transitionIn: string
  transitionOut: string
  startTimeSeconds: number
  endTimeSeconds: number
  matchedWords: string[]
  timingAnchorId?: ID
  sfxHint?: string
  workerNotes: string[]
  mustFollowRules: string[]
  avoidRules: string[]
  renderStatus: StrokeMotionRenderStatus
  metadata?: JSONObject
}

export interface StrokeMotionCharacterRecord {
  id: ID
  strokeMotionPlanId: ID
  name: string
  role: string
  visualDescription: string
  emotionalState?: string
  continuityKey: string
  mustFollowRules: string[]
  avoidRules: string[]
}

export interface StrokeMotionSymbolRecord {
  id: ID
  strokeMotionPlanId: ID
  label: string
  meaning: string
  visualDescription: string
  symbolType: 'line' | 'circle' | 'glow' | 'crack' | 'path' | 'object' | 'text' | 'other'
  creditImpact: CreditImpact
}

export interface StrokeMotionTransitionRecord {
  id: ID
  strokeMotionPlanId: ID
  fromBeatId?: ID
  toBeatId?: ID
  chainOrder: number
  strategy: StrokeMotionTransitionStrategy
  fromVisualState: string
  toVisualState: string
  description: string
  timeRange: TimeRange
  connectedTransitionChain: string[]
}

export interface StrokeMotionTimingAnchorRecord {
  id: ID
  strokeMotionPlanId: ID
  transcriptSegmentId?: ID
  beatId?: ID
  anchorType: 'word' | 'phrase' | 'pause' | 'beat' | 'music_cue' | 'manual'
  matchedText?: string
  timeRange: TimeRange
  confidence: number
  notes?: string
}

export interface StrokeMotionGenerationSpecRecord {
  id: ID
  strokeMotionPlanId: ID
  rendererPreference: 'svg' | 'lottie' | 'remotion' | 'custom_deterministic' | 'ai_video_reference'
  transparentBackgroundRequired: true
  wordLevelTimingRequired: true
  outputResolution: string
  fps: number
  stylePrompt: string
  negativePrompt?: string
  timingConstraints: string[]
  generationRequestId?: ID
  workerNotes: string[]
  status: ProcessingStatus
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
