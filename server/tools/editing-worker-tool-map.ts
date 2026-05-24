import type { EditingToolId } from './editing-tool-contracts'

export const EDITING_WORKER_TOOL_MAP = {
  'media-analysis-worker': ['ffprobe', 'ffmpeg', 'pyscenedetect', 'whisper', 'opencv'],
  'render-worker': ['remotion', 'ffmpeg', 'ffprobe', 'sharp_libvips'],
  'audio-soundsync-worker': ['ffmpeg', 'ffprobe', 'audioflux', 'signalsmith_stretch'],
  'image-asset-worker': ['sharp_libvips', 'opencv'],
  'browser-capture-worker': ['playwright'],
  'advanced-frame-worker': ['vapoursynth', 'ffmpeg'],
} as const satisfies Record<string, readonly EditingToolId[]>

export type EditingWorkerId = keyof typeof EDITING_WORKER_TOOL_MAP

export function listEditingWorkerToolMappings(): Array<{
  workerId: EditingWorkerId
  toolIds: EditingToolId[]
}> {
  return Object.entries(EDITING_WORKER_TOOL_MAP).map(([workerId, toolIds]) => ({
    workerId: workerId as EditingWorkerId,
    toolIds: [...toolIds],
  }))
}
