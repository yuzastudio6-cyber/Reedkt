import type { MediaAnalysisReport, RepeatedTakeCandidate, SceneBoundary, SilenceSegment, SpeechFillerSegment } from '../../../src/backend/contracts/media-analysis-report'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionTimeRange } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'
import type { CaptionSegment } from '../captions'
import type { TranscriptSegment, TranscriptWord } from '../speech'

export type SmartCutFoundationRunMode = 'dry_run' | 'local_dev' | 'production_blocked'

export type SmartCutIntent =
  | 'remove_dead_space'
  | 'remove_fillers'
  | 'remove_repeated_takes'
  | 'tighten_pacing'
  | 'preserve_story'
  | 'social_fast_cut'
  | 'podcast_clean_cut'
  | 'talking_head_clean_cut'
  | 'custom'

export type SmartCutAggressiveness = 'gentle' | 'balanced' | 'tight' | 'aggressive'

export type CutRisk =
  | 'mid_word'
  | 'mid_sentence'
  | 'emotional_pause'
  | 'visual_jump'
  | 'scene_boundary_conflict'
  | 'speaker_cutoff'
  | 'meaning_loss'
  | 'audio_pop_risk'
  | 'none'

export type SegmentCandidateType =
  | 'transcript'
  | 'silence'
  | 'scene'
  | 'caption'
  | 'semantic_merge'
  | 'fallback'

export type PacingProfileName =
  | 'natural_clean'
  | 'social_fast'
  | 'podcast_clean'
  | 'talking_head_tight'
  | 'documentary_measured'
  | 'education_structured'
  | 'custom'

export interface PacingProfile {
  profileId: PacingProfileName
  maxSilenceSeconds: number
  minSegmentDurationSeconds: number
  targetCutsPerMinuteMin: number
  targetCutsPerMinuteMax: number
  emotionalPausePolicy: 'protect' | 'warn' | 'allow_when_aggressive'
  notes: string[]
}

export interface SegmentCandidate extends ProductionTimeRange {
  candidateId: string
  candidateType: SegmentCandidateType
  source: 'transcript' | 'word_timestamps' | 'filler' | 'repeated_take' | 'silence' | 'scene' | 'caption' | 'fallback'
  text?: string
  transcriptSegmentIds: string[]
  captionIds: string[]
  wordCount: number
  evidence: {
    hasTranscript: boolean
    hasWordTimestamps: boolean
    hasSilence: boolean
    hasSceneBoundary: boolean
    hasCaption: boolean
    fillerLabels: string[]
    repeatedTakeCandidateIds: string[]
  }
  risks: CutRisk[]
  protected: boolean
  reason: string
}

export interface SegmentScore {
  candidateId: string
  speechDensityScore: number
  silencePenalty: number
  fillerPenalty: number
  repeatedTakePenalty: number
  hookScore: number
  pacingScore: number
  visualRiskScore: number
  meaningRiskScore: number
  keepScore: number
  removeScore: number
  confidence: number
  warnings: string[]
}

export interface SegmentKeepDecision extends ProductionTimeRange {
  decisionId: string
  candidateId: string
  score: number
  confidence: number
  reason: string
  protected: boolean
}

export interface SegmentRemoveDecision extends ProductionTimeRange {
  decisionId: string
  candidateId: string
  score: number
  confidence: number
  reason: string
  risks: CutRisk[]
  futureOnly?: boolean
}

export interface CutBoundary {
  boundaryId: string
  sourceTimeSeconds: number
  adjustedTimeSeconds: number
  paddingBeforeSeconds: number
  paddingAfterSeconds: number
  risks: CutRisk[]
  safe: boolean
  reason: string
}

export interface MeaningPreservationFinding {
  findingId: string
  severity: 'info' | 'warning' | 'blocking'
  range: ProductionTimeRange
  code: string
  message: string
}

export interface SmartCutPlan {
  id: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceDurationSeconds: number
  targetDurationSeconds?: number
  intent: SmartCutIntent[]
  aggressiveness: SmartCutAggressiveness
  pacingProfile: PacingProfile
  segmentCandidates: SegmentCandidate[]
  segmentScores: SegmentScore[]
  keepSegments: SegmentKeepDecision[]
  removeSegments: SegmentRemoveDecision[]
  cutBoundaries: CutBoundary[]
  protectedSegments: SegmentKeepDecision[]
  rejectedCandidates: SegmentRemoveDecision[]
  meaningFindings: MeaningPreservationFinding[]
  warnings: string[]
  confidence: number
  qaChecks: string[]
  requiredQualityGates: Array<'cut_smoothness' | 'transcript_alignment' | 'audio_sync' | 'render_timeline_integrity'>
}

export interface SmartCutFoundationInput {
  mode: SmartCutFoundationRunMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  mediaAnalysisReport?: MediaAnalysisReport
  mediaDurationSeconds?: number
  transcriptSegments?: TranscriptSegment[]
  wordTimestamps?: TranscriptWord[]
  fillerSegments?: SpeechFillerSegment[]
  repeatedTakeCandidates?: RepeatedTakeCandidate[]
  silenceSegments?: SilenceSegment[]
  sceneBoundaries?: SceneBoundary[]
  captionSegments?: CaptionSegment[]
  intent?: SmartCutIntent[]
  aggressiveness?: SmartCutAggressiveness
  pacingProfileId?: PacingProfileName
  customPacingProfile?: Partial<PacingProfile>
  localDevPreview?: boolean
  outputRoot?: string
}

export interface SmartCutFoundationResult {
  mode: SmartCutFoundationRunMode
  status: 'dry_run' | 'partial' | 'blocked' | 'failed'
  smartCutPlan?: SmartCutPlan
  qualityGateResults: QualityGateResult[]
  cutListPreview?: Record<string, unknown>
  warnings: string[]
  skipReasons: string[]
}

export interface SmartCutQAResult {
  qualityGateResults: QualityGateResult[]
  issues: string[]
}
