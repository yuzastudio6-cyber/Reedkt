import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'
import type { TranscriptSegment, TranscriptWord } from '../speech'

export type CaptionFoundationRunMode = 'dry_run' | 'local_dev' | 'production_blocked'

export type CaptionFileFormat = 'srt' | 'webvtt' | 'ass'

export type CaptionPlacement =
  | 'bottom_safe'
  | 'middle_safe'
  | 'top_safe'
  | 'lower_third'
  | 'side_panel'
  | 'custom'

export type CaptionStylePresetId =
  | 'clean_subtitle'
  | 'small_premium_subtitle'
  | 'bold_social_captions'
  | 'keyword_emphasis_captions'
  | 'karaoke_word_by_word'
  | 'sentence_block_captions'
  | 'documentary_lower_third'
  | 'education_label_captions'
  | 'minimal_accessibility_captions'

export interface CaptionSegment {
  captionId: string
  startSeconds: number
  endSeconds: number
  text: string
  lines: string[]
  words: TranscriptWord[]
  styleHints: {
    presetId: CaptionStylePresetId
    placement: CaptionPlacement
    emphasisWords: string[]
  }
}

export interface CaptionSegmentBuilderOptions {
  maxWordsPerCaption?: number
  maxCharactersPerLine?: number
  maxLines?: number
  minDurationSeconds?: number
  maxDurationSeconds?: number
  presetId?: CaptionStylePresetId
  placement?: CaptionPlacement
}

export interface CaptionStylePreset {
  presetId: CaptionStylePresetId
  fontFamilyFallback: string
  fontSizePolicy: string
  lineHeight: number
  maxLines: number
  positionPolicy: CaptionPlacement
  backgroundPolicy: string
  outlinePolicy: string
  shadowPolicy: string
  platformSuitability: string[]
  qaNotes: string[]
}

export interface CaptionPolicyIssue {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'blocking'
}

export interface CaptionPolicyScore {
  score: number
  threshold: number
  issues: CaptionPolicyIssue[]
  recommendations: string[]
}

export interface CaptionFoundationSkipReason {
  code: string
  message: string
  tool?: 'ffmpeg' | 'libass'
}

export interface CaptionFileBuildResult {
  format: CaptionFileFormat
  text: string
  artifact?: ToolArtifact
  localFilePath?: string
}

export interface CaptionFoundationRunnerInput {
  mode: CaptionFoundationRunMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  approvedSnapshotId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  transcriptSegments?: TranscriptSegment[]
  wordTimestamps?: TranscriptWord[]
  outputRoot?: string
  sourceVideoLocalPath?: string
  ffmpegBin?: string
  timeoutMs?: number
  stylePresetId?: CaptionStylePresetId
  formats?: CaptionFileFormat[]
}

export interface CaptionFoundationResult {
  mode: CaptionFoundationRunMode
  status: 'dry_run' | 'completed' | 'partial' | 'skipped' | 'blocked' | 'failed'
  captionSegments: CaptionSegment[]
  captionFiles: CaptionFileBuildResult[]
  artifacts: ToolArtifact[]
  qualityGateResults: QualityGateResult[]
  skipReasons: CaptionFoundationSkipReason[]
  warnings: string[]
}
