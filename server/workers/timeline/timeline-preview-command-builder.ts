import type { SmartCutFfmpegCommandPlan } from '../smart-cut/smart-cut-execution-types'
import type { TimelinePreviewCommandPlan, TimelineExecutionMode } from './timeline-execution-types'

export function buildTimelinePreviewCommandPlan(input: {
  mode: TimelineExecutionMode
  ffmpegCommandPlan?: SmartCutFfmpegCommandPlan
}): TimelinePreviewCommandPlan {
  return {
    mode: input.mode,
    previewOnly: true,
    finalExportAllowed: false,
    ffmpegCommandPlan: input.ffmpegCommandPlan,
    notes: [
      'Timeline preview command planning is FFmpeg metadata only.',
      'No Remotion render, final export, or Revideo runtime is invoked in M14.',
    ],
  }
}
