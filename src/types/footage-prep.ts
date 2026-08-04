import type { FootagePrepStatus } from './production-workflow'
import type {
  AssetUsageRole,
  ID,
  MediaKind,
  ProjectScopedRecord,
  TimeRange,
} from './workflow-common'

export type FootagePrepStage =
  | 'ingest'
  | 'media_analysis'
  | 'transcription'
  | 'scene_detection'
  | 'silence_detection'
  | 'retake_detection'
  | 'quality_analysis'
  | 'source_understanding'
  | 'cleanup_planning'
  | 'clean_assembly_build'

export type SourceQualityFlagType =
  | 'silence'
  | 'noise'
  | 'clipping'
  | 'low_volume'
  | 'bad_lighting'
  | 'blur'
  | 'shaky'
  | 'privacy_sensitive'
  | 'face_detected'
  | 'text_detected'
  | 'screen_detected'
  | 'possible_hook'
  | 'possible_cta'
  | 'possible_b_roll'
  | 'bad_take'
  | 'strong_take'

export type RetakeGroupResolution =
  | 'best_take_selected'
  | 'needs_user_review'
  | 'keep_all'
  | 'remove_all'
  | 'unresolved'

export interface FootagePrepSession extends ProjectScopedRecord {
  status: FootagePrepStatus
  activeStage?: FootagePrepStage
  sourceMediaIds: ID[]
  cleanAssemblyId?: ID
  sourceUnderstandingMapId?: ID
  cleanupPlanId?: ID
  progressPercent?: number
  startedAt?: string
  completedAt?: string
  failedAt?: string
  failureReason?: string
  retryCount?: number
}

export interface AssetAnalysisReport extends ProjectScopedRecord {
  mediaAssetId: ID
  mediaKind: MediaKind
  durationMs?: number
  width?: number
  height?: number
  frameRate?: number
  hasAudio?: boolean
  hasSpeech?: boolean
  hasFaces?: boolean
  hasOnScreenText?: boolean
  detectedUsageRole?: AssetUsageRole
  qualityFlags: SourceQualityFlag[]
  summary?: string
  confidence?: number
}

export interface TranscriptSegment extends ProjectScopedRecord {
  mediaAssetId: ID
  sourceRange: TimeRange
  speakerLabel?: string
  text: string
  words?: TranscriptWord[]
  confidence?: number
}

export interface TranscriptWord {
  id: ID
  text: string
  startMs: number
  endMs: number
  confidence?: number
}

export interface SceneSegment extends ProjectScopedRecord {
  mediaAssetId: ID
  sourceRange: TimeRange
  label?: string
  summary?: string
  thumbnailUrl?: string
  detectedObjects?: string[]
  detectedText?: string[]
  confidence?: number
}

export interface SilenceRegion extends ProjectScopedRecord {
  mediaAssetId: ID
  sourceRange: TimeRange
  silenceType: 'dead_air' | 'pause' | 'room_tone' | 'unknown'
  recommendedAction: 'remove' | 'tighten' | 'keep' | 'review'
  confidence?: number
}

export interface RetakeGroup extends ProjectScopedRecord {
  mediaAssetId: ID
  label?: string
  candidateRanges: TimeRange[]
  selectedBestRange?: TimeRange
  resolution: RetakeGroupResolution
  reasoning?: string
  confidence?: number
}

export interface SourceQualityFlag {
  id: ID
  type: SourceQualityFlagType
  sourceRange?: TimeRange
  severity: 'info' | 'low' | 'medium' | 'high' | 'blocking'
  message: string
  recommendedAction?: string
  confidence?: number
}

export interface SourceUnderstandingMap extends ProjectScopedRecord {
  footagePrepSessionId: ID
  mediaAssetIds: ID[]
  transcriptSegmentIds: ID[]
  sceneSegmentIds: ID[]
  silenceRegionIds: ID[]
  retakeGroupIds: ID[]
  qualityFlagIds: ID[]
  hookCandidateRanges: TimeRange[]
  ctaCandidateRanges: TimeRange[]
  bRollCandidateRanges: TimeRange[]
  summary: string
  createdFromModel?: string
  confidence?: number
}

export interface PrepSummary {
  originalDurationMs: number
  cleanAssemblyDurationMs?: number
  removedSilenceCount: number
  retakeGroupCount: number
  falseStartCount: number
  preservedMomentCount: number
  qualityIssueCount: number
  recommendedNextActions: Array<
    | 'continue_with_ai_plan'
    | 'add_edit_brief'
    | 'add_edit_cues'
    | 'review_cleanup_decisions'
  >
  summaryText: string
}
