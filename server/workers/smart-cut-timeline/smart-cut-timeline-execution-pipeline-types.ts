import type {
  SmartCutExecutionPlan,
  SmartCutFfmpegCommandPlan,
  SmartCutTimelineExecutionInput,
  SmartCutTimelineExecutionMode,
  SmartCutTimelineExecutionResult,
} from '../smart-cut/smart-cut-execution-types'

export type {
  SmartCutExecutionPlan,
  SmartCutFfmpegCommandPlan,
  SmartCutTimelineExecutionInput,
  SmartCutTimelineExecutionMode,
  SmartCutTimelineExecutionResult,
}

export interface SmartCutTimelinePipelineStatusSummary {
  mode: SmartCutTimelineExecutionMode
  executionPlanBuilt: boolean
  timelineManifestBuilt: boolean
  previewAttempted: boolean
  finalExportAttempted: false
  blocksPreview: boolean
  blocksFinalExport: boolean
}
