import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { OpenTimelineIOStyleManifest, HyperframeTimelineBridge, RemotionCompositionManifest } from '../timeline'
import type {
  SmartCutExecutionPlan,
  SmartCutFfmpegCommandPlan,
  SmartCutTimelineExecutionInput,
  SmartCutTimelineExecutionResult,
} from '../smart-cut/smart-cut-execution-types'

export function buildSmartCutTimelineExecutionResult(input: {
  executionInput: SmartCutTimelineExecutionInput
  status: SmartCutTimelineExecutionResult['status']
  executionPlan?: SmartCutExecutionPlan
  ffmpegCommandPlan?: SmartCutFfmpegCommandPlan
  timelineManifest?: TimelineManifest
  otioManifest?: OpenTimelineIOStyleManifest
  hyperframeBridge?: HyperframeTimelineBridge
  remotionManifest?: RemotionCompositionManifest
  previewArtifact?: ToolArtifact
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  skippedReasons: string[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport?: boolean
}): SmartCutTimelineExecutionResult {
  return {
    mode: input.executionInput.mode,
    status: input.status,
    executionPlan: input.executionPlan,
    ffmpegCommandPlan: input.ffmpegCommandPlan,
    timelineManifest: input.timelineManifest,
    otioManifest: input.otioManifest,
    hyperframeBridge: input.hyperframeBridge,
    remotionManifest: input.remotionManifest,
    previewArtifact: input.previewArtifact,
    artifacts: input.artifacts,
    qaResults: input.qaResults,
    skippedReasons: input.skippedReasons,
    warnings: input.warnings,
    blocksPreview: input.blocksPreview,
    blocksFinalExport: input.blocksFinalExport ?? true,
  }
}
