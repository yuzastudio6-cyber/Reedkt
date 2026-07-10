import type { CreativeSkillKey } from './creative-skills-core'

export type AutonomousEditPlanStatus =
  | 'ready_for_approval'
  | 'needs_clarification'
  | 'blocked'

export type AutonomousEditSegmentRole =
  | 'hook'
  | 'setup'
  | 'context'
  | 'main_body'
  | 'proof'
  | 'transition'
  | 'ending'

export type AutonomousEditOperationId =
  | 'timeline.select'
  | 'timeline.trim'
  | 'timeline.smart_cut'
  | 'caption.generate'
  | 'caption.align'
  | 'caption.style'
  | 'graphics.compose'
  | 'graphics.animate'
  | 'broll.select'
  | 'broll.generate'
  | 'audio.cleanup'
  | 'audio.loudness.normalize'
  | 'audio.music.plan'
  | 'audio.sfx.plan'
  | 'color.correct'
  | 'color.grade'
  | 'transition.apply'
  | 'render.compose'
  | 'qa.validate'

export interface AutonomousEditOutputFrame {
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'custom'
  platformTarget:
    | 'tiktok_reel'
    | 'instagram_reel'
    | 'instagram_feed'
    | 'youtube_shorts'
    | 'youtube_standard'
    | 'linkedin'
    | 'website'
    | 'podcast_clip'
    | 'ad_creative'
    | 'internal_review'
    | 'custom'
  width: number
  height: number
  confirmed: true
}

export interface AutonomousEditSourceReference {
  storageObjectRecordId: string
  mediaAssetId: string
  bucketName: string
  objectPath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  checksumSha256?: string
}

export interface AutonomousEditPreferenceSnapshot {
  pacing?: string
  captionStyle?: string
  visualStyle?: string
  audioStyle?: string
  colorStyle?: string
  cleanupPreference?: string
  notes?: string[]
}

export interface AutonomousEditReferenceDnaSnapshot {
  summary: string
  pacingTraits: string[]
  captionTraits: string[]
  visualTraits: string[]
  audioTraits: string[]
  doNotCopy: string[]
  sourceStorageObjectRecordId: string
  sourceChecksumSha256?: string
  evidenceArtifactIds: string[]
  derivedBy: 'qwen_live_with_deterministic_measurements'
}

export interface CreateAutonomousEditPlanRequest {
  workspaceId: string
  prompt: string
  source: AutonomousEditSourceReference
  outputFrame: AutonomousEditOutputFrame
  editBrief?: {
    briefId: string
    revisionNumber: number
    briefFingerprint: string
    summary: string
  }
  preferences?: AutonomousEditPreferenceSnapshot
  referenceSource?: AutonomousEditSourceReference
  analysisMode: 'local_internal'
}

export interface AutonomousEditAudioEvidence {
  status: 'completed' | 'not_required' | 'blocked'
  integratedLufs?: number
  truePeakDb?: number
  peakDb?: number
  rmsDb?: number
  noiseFloorDb?: number
  clippingDetected: boolean
  noiseCondition: 'not_measured' | 'low' | 'moderate' | 'high'
  silenceRanges: Array<{ startSeconds: number; endSeconds: number }>
  analysisMethods: string[]
  blockers: string[]
}

export interface AutonomousEditVisualRhythmEvidence {
  status: 'completed' | 'blocked'
  detectedCutTimesSeconds: number[]
  detectedCutCount: number
  averageShotDurationSeconds?: number
  pacingClass: 'unknown' | 'slow' | 'measured' | 'quick' | 'rapid'
  threshold: number
  analysisMethods: string[]
  blockers: string[]
}

export interface AutonomousEditColorEvidence {
  status: 'completed' | 'blocked'
  sampledFrameCount: number
  averageLuma?: number
  minimumLuma?: number
  maximumLuma?: number
  averageSaturation?: number
  exposureCondition: 'not_measured' | 'dark' | 'balanced' | 'bright'
  contrastCondition: 'not_measured' | 'low' | 'balanced' | 'high'
  analysisMethods: string[]
  blockers: string[]
}

export interface AutonomousEditSourceEvidence {
  evidenceVersion: 'autonomous-edit-source-evidence-v1'
  sourceStorageObjectRecordId: string
  sourceChecksumSha256?: string
  probe: {
    durationSeconds: number
    width: number
    height: number
    frameRate?: number
    videoStreamCount: number
    audioStreamCount: number
  }
  transcript: {
    status: 'completed' | 'not_required' | 'blocked'
    language?: string
    confidence?: number
    segmentCount: number
    wordCount: number
    transcriptArtifactId?: string
    wordTimestampArtifactId?: string
  }
  audio: AutonomousEditAudioEvidence
  visualRhythm: AutonomousEditVisualRhythmEvidence
  color: AutonomousEditColorEvidence
  visualUnderstanding: {
    status: 'completed' | 'blocked'
    sampledFrameCount: number
    summary?: string
    visibleSubjects: string[]
    visibleObjects: string[]
    screenTextRegions: string[]
    compositionRisks: string[]
    brollOpportunities: string[]
    captionObservations: string[]
    styleObservations: string[]
    frameEvidence: Array<{
      frameId: string
      timeSeconds?: number
      summary: string
      safeZones: string[]
      uncertainty: string[]
    }>
    evidenceArtifactIds: string[]
  }
  privateArtifactIds: string[]
  blockers: string[]
}

export interface AutonomousEditReferenceEvidence {
  status: 'completed' | 'blocked'
  source: AutonomousEditSourceReference
  probe: AutonomousEditSourceEvidence['probe']
  audio: AutonomousEditAudioEvidence
  visualRhythm: AutonomousEditVisualRhythmEvidence
  color: AutonomousEditColorEvidence
  visualUnderstanding: AutonomousEditSourceEvidence['visualUnderstanding']
  referenceDna?: AutonomousEditReferenceDnaSnapshot
  privateArtifactIds: string[]
  blockers: string[]
}

export type AutonomousCaptionPlacement = 'auto_face_safe' | 'top_safe' | 'middle_safe' | 'bottom_safe' | 'lower_third'
export type AutonomousCaptionTypography = 'clean_bold' | 'editorial_bold' | 'minimal' | 'documentary'
export type AutonomousCaptionAnimation = 'none' | 'phrase_fade_up' | 'keyword_pop' | 'word_pop'

export interface AutonomousCaptionExecutionSpec {
  kind: 'caption'
  placement: AutonomousCaptionPlacement
  typography: AutonomousCaptionTypography
  textCase: 'sentence' | 'upper'
  emphasis: 'none' | 'keyword_color' | 'keyword_scale' | 'keyword_color_and_scale'
  animation: AutonomousCaptionAnimation
  accentColor: string
  maxWordsPerCue: number
  maxLines: 1 | 2
  emphasisTerms: string[]
}

export type AutonomousGraphicPlacement =
  | 'auto_safe'
  | 'top_left'
  | 'top_right'
  | 'middle_left'
  | 'middle_right'
  | 'bottom_left'
  | 'bottom_right'
  | 'center'

export type AutonomousGraphicType =
  | 'label'
  | 'lower_third'
  | 'callout'
  | 'process_steps'
  | 'stat_card'
  | 'evidence_card'
  | 'comparison'
  | 'timeline'

export interface AutonomousGraphicExecutionSpec {
  kind: 'graphic'
  graphicId: string
  graphicType: AutonomousGraphicType
  title: string
  bodyLines: string[]
  sourceLabel?: string
  placement: AutonomousGraphicPlacement
  visualStyle: 'clean_panel' | 'accent_label' | 'outline_card' | 'editorial_card'
  accentColor: string
  startOffsetSeconds: number
  endOffsetSeconds: number
  motion: {
    enter: 'none' | 'fade' | 'fade_up' | 'slide_left' | 'slide_right'
    exit: 'none' | 'fade' | 'fade_down'
    enterDurationSeconds: number
    exitDurationSeconds: number
  }
  contentEvidenceRefs: string[]
}

export interface AutonomousGraphicMotionExecutionSpec {
  kind: 'graphic_motion'
  targetGraphicId: string
  enter: AutonomousGraphicExecutionSpec['motion']['enter']
  exit: AutonomousGraphicExecutionSpec['motion']['exit']
  enterDurationSeconds: number
  exitDurationSeconds: number
}

export interface AutonomousAudioExecutionSpec {
  kind: 'audio'
  denoise: 'none' | 'light_fft' | 'medium_fft'
  normalize: boolean
  targetLufs: number
  truePeakDb: number
  highpassHz: 0 | 60 | 70 | 80 | 90 | 100 | 120
  lowpassHz: 0 | 12000 | 14000 | 16000 | 18000 | 20000
  voiceCompression: 'none' | 'light'
  evidenceBasis: string[]
}

export interface AutonomousColorExecutionSpec {
  kind: 'color'
  brightness: number
  contrast: number
  saturation: number
  gamma: number
  warmth: number
  preserveNaturalSkin: boolean
  evidenceBasis: string[]
}

export type AutonomousEditOperationExecutionSpec =
  | AutonomousCaptionExecutionSpec
  | AutonomousGraphicExecutionSpec
  | AutonomousGraphicMotionExecutionSpec
  | AutonomousAudioExecutionSpec
  | AutonomousColorExecutionSpec

export interface AutonomousEditPlanOperation {
  operationId: AutonomousEditOperationId
  instruction: string
  rationale: string
  skillKeys: CreativeSkillKey[]
  sourceEvidenceRefs: string[]
  requiredQaChecks: string[]
  executionSpec?: AutonomousEditOperationExecutionSpec
}

export interface AutonomousEditPlanSegment {
  id: string
  role: AutonomousEditSegmentRole
  sourceStartSeconds: number
  sourceEndSeconds: number
  objective: string
  narrativeReason: string
  transcriptEvidence: string[]
  visualEvidence: string[]
  operations: AutonomousEditPlanOperation[]
  captionDirection: string
  visualDirection: string
  audioDirection: string
  transitionDirection: string
  requiredQaChecks: string[]
}

export interface AutonomousEditSkillSelection {
  skillKey: CreativeSkillKey
  reason: string
  required: boolean
  segmentIds: string[]
  operationIds: AutonomousEditOperationId[]
}

export interface AutonomousEditPlanCandidate {
  status: AutonomousEditPlanStatus
  title: string
  summary: string
  userIntentSummary: string
  storyStrategy: string
  segments: AutonomousEditPlanSegment[]
  skillSelections: AutonomousEditSkillSelection[]
  globalQaChecks: string[]
  clarificationQuestions: string[]
  blockers: string[]
}

export interface AutonomousEditPlanDraft {
  version: 'autonomous-edit-plan-v1'
  planId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  status: AutonomousEditPlanStatus
  title: string
  summary: string
  userIntentSummary: string
  storyStrategy: string
  sourceOrderPolicy: 'preserve_unless_evidence_supports_change'
  outputFrame: AutonomousEditOutputFrame
  segments: AutonomousEditPlanSegment[]
  skillSelections: AutonomousEditSkillSelection[]
  globalQaChecks: string[]
  clarificationQuestions: string[]
  blockers: string[]
  sourceEvidence: AutonomousEditSourceEvidence
  referenceEvidence?: AutonomousEditReferenceEvidence
  runtime: {
    plannerSource: 'qwen_live' | 'blocked'
    providerCallMade: boolean
    qwenCallMade: boolean
    mediaAnalysisRun: boolean
    transcriptionRun: boolean
    visualUnderstandingRun: boolean
    deterministicCreativeFallbackUsed: false
    rawPromptStored: false
    workerExecutionStarted: false
    renderStarted: false
    creditReservedOrSpent: false
  }
  approvalRequired: true
  approved: false
  createdAt: string
  warnings: string[]
}

export interface AutonomousEditPlanningAttempt {
  attemptId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  status: 'completed' | 'blocked' | 'failed'
  sourceEvidence: AutonomousEditSourceEvidence
  referenceEvidence?: AutonomousEditReferenceEvidence
  plan?: AutonomousEditPlanDraft
  blockers: string[]
  runtime: {
    mediaAnalysisRun: boolean
    transcriptionRun: boolean
    visualUnderstandingRun: boolean
    providerCallMade: boolean
    qwenCallMade: boolean
    deterministicCreativeFallbackUsed: false
    workerExecutionStarted: false
    renderStarted: false
    creditReservedOrSpent: false
  }
  createdAt: string
  warnings: string[]
}
