import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type {
  SmartCutExecutionPlan,
  SmartCutFfmpegCommandPlan,
  SmartCutTimelineExecutionInput,
  SmartCutTimelineExecutionMode,
} from '../smart-cut/smart-cut-execution-types'
import type { OpenTimelineIOStyleManifest, HyperframeTimelineBridge, RemotionCompositionManifest } from './timeline-worker-types'

export type TimelineExecutionMode = SmartCutTimelineExecutionMode

export interface TimelineExecutionInput extends SmartCutTimelineExecutionInput {
  executionPlan: SmartCutExecutionPlan
  ffmpegCommandPlan?: SmartCutFfmpegCommandPlan
}

export interface TimelinePreviewCommandPlan {
  mode: TimelineExecutionMode
  previewOnly: true
  finalExportAllowed: false
  ffmpegCommandPlan?: SmartCutFfmpegCommandPlan
  notes: string[]
}

export interface TimelineExecutionResult {
  mode: TimelineExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  timelineManifest?: TimelineManifest
  otioManifest?: OpenTimelineIOStyleManifest
  hyperframeBridge?: HyperframeTimelineBridge
  remotionManifest?: RemotionCompositionManifest
  previewCommandPlan?: TimelinePreviewCommandPlan
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  warnings: string[]
  skippedReasons: string[]
}
