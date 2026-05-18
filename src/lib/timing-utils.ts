import type {
  AspectRatioFramePlan,
  FrameTimeRange,
  TimingCue,
  TimingCueType,
  TimingPriority,
  TimingSnapMode,
} from '../types/reeditpro'

export function roundFrame(value: number, mode: 'floor' | 'ceil' | 'round' = 'round') {
  const safeValue = Number.isFinite(value) ? value : 0

  if (mode === 'floor') return Math.floor(safeValue)
  if (mode === 'ceil') return Math.ceil(safeValue)
  return Math.round(safeValue)
}

export function secondsToFrames(seconds: number, fps: number) {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const safeFps = Math.max(1, Number.isFinite(fps) ? fps : 30)

  return Math.round(safeSeconds * safeFps)
}

export function framesToSeconds(frames: number, fps: number) {
  const safeFrames = Math.max(0, Number.isFinite(frames) ? frames : 0)
  const safeFps = Math.max(1, Number.isFinite(fps) ? fps : 30)

  return safeFrames / safeFps
}

export function createFrameTimeRange(startSeconds: number, endSeconds: number, fps: number): FrameTimeRange {
  const safeStart = Math.max(0, Number.isFinite(startSeconds) ? startSeconds : 0)
  const safeEnd = Math.max(safeStart, Number.isFinite(endSeconds) ? endSeconds : safeStart)
  const startFrame = secondsToFrames(safeStart, fps)
  const endFrame = Math.max(startFrame, secondsToFrames(safeEnd, fps))

  return {
    startSeconds: framesToSeconds(startFrame, fps),
    endSeconds: framesToSeconds(endFrame, fps),
    durationSeconds: framesToSeconds(endFrame - startFrame, fps),
    startFrame,
    endFrame,
    durationFrames: endFrame - startFrame,
    fps: Math.max(1, Number.isFinite(fps) ? fps : 30),
  }
}

export function createFrameTimeRangeFromFrames(startFrame: number, endFrame: number, fps: number): FrameTimeRange {
  const safeStart = Math.max(0, roundFrame(startFrame))
  const safeEnd = Math.max(safeStart, roundFrame(endFrame))
  const safeFps = Math.max(1, Number.isFinite(fps) ? fps : 30)

  return {
    startSeconds: framesToSeconds(safeStart, safeFps),
    endSeconds: framesToSeconds(safeEnd, safeFps),
    durationSeconds: framesToSeconds(safeEnd - safeStart, safeFps),
    startFrame: safeStart,
    endFrame: safeEnd,
    durationFrames: safeEnd - safeStart,
    fps: safeFps,
  }
}

export function clampFrameRange(range: FrameTimeRange, totalFrames: number): FrameTimeRange {
  const safeTotal = Math.max(0, roundFrame(totalFrames))
  const startFrame = Math.min(Math.max(0, range.startFrame), safeTotal)
  const endFrame = Math.min(Math.max(startFrame, range.endFrame), safeTotal)

  return createFrameTimeRangeFromFrames(startFrame, endFrame, range.fps)
}

export function getDefaultTimingFps(params?: { aspectRatioFramePlan?: AspectRatioFramePlan }) {
  const framePlan = params?.aspectRatioFramePlan

  if (framePlan?.status === 'confirmed') {
    return 30
  }

  return 30
}

export function getMinimumReadFrames(text: string, fps: number) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const safeFps = Math.max(1, Number.isFinite(fps) ? fps : 30)
  const baseFrames = Math.round(safeFps * 1.5)
  const wordFrames = Math.round(wordCount * safeFps * 0.32)

  return Math.max(baseFrames, wordFrames)
}

export function createTimingCue(params: {
  id: string
  cueType: TimingCueType
  label: string
  timeRange: FrameTimeRange
  priority?: TimingPriority
  snapMode?: TimingSnapMode
  linkedClipId?: string
  linkedSegmentId?: string
  linkedTranscriptLineId?: string
  linkedVisualAssetPlanItemId?: string
  linkedRendererLayerId?: string
  linkedBeatId?: string
  linkedSoundSyncCueId?: string
  reason: string
  qaChecks?: string[]
  notes?: string[]
}): TimingCue {
  return {
    id: params.id,
    cueType: params.cueType,
    label: params.label,
    timeRange: params.timeRange,
    priority: params.priority ?? 'story_meaning',
    snapMode: params.snapMode ?? 'none',
    linkedClipId: params.linkedClipId,
    linkedSegmentId: params.linkedSegmentId,
    linkedTranscriptLineId: params.linkedTranscriptLineId,
    linkedVisualAssetPlanItemId: params.linkedVisualAssetPlanItemId,
    linkedRendererLayerId: params.linkedRendererLayerId,
    linkedBeatId: params.linkedBeatId,
    linkedSoundSyncCueId: params.linkedSoundSyncCueId,
    reason: params.reason,
    qaChecks: params.qaChecks ?? [],
    notes: params.notes ?? [],
  }
}
