import type {
  SFXTimelinePlacement,
  SFXTimingAlignmentRecord,
} from '../../types'
import type {
  CreateFinalSFXTimelinePlacementRequest,
  CreateFinalSFXTimelinePlacementResponse,
} from '../contracts/sfx-director-contracts'

type SupportedFps = 24 | 25 | 30 | 60

function normalizeFps(fps?: number): SupportedFps {
  if (fps === 24 || fps === 25 || fps === 30 || fps === 60) return fps
  return 30
}

function roundSeconds(value: number): number {
  return Number(Math.max(0, value).toFixed(3))
}

export function convertSecondsToFrames(seconds: number, fps: SupportedFps = 30): number {
  return Math.round(seconds * fps)
}

export function convertFramesToSeconds(frames: number, fps: SupportedFps = 30): number {
  return roundSeconds(frames / fps)
}

export function snapSFXPlacementToFrame(
  seconds: number,
  fps: SupportedFps = 30,
): { seconds: number; frame: number } {
  const frame = convertSecondsToFrames(seconds, fps)
  return {
    seconds: convertFramesToSeconds(frame, fps),
    frame,
  }
}

export function createFinalSFXTimelinePlacement(
  request: CreateFinalSFXTimelinePlacementRequest,
): CreateFinalSFXTimelinePlacementResponse {
  const fps = normalizeFps(request.fps)
  const alignment = request.sfxTimingAlignment
  const shouldSnap = alignment.frameAccurateRequired || alignment.musicBeatAligned
  const start = shouldSnap
    ? snapSFXPlacementToFrame(alignment.startTimeSeconds, fps)
    : { seconds: roundSeconds(alignment.startTimeSeconds), frame: convertSecondsToFrames(alignment.startTimeSeconds, fps) }
  const hit = shouldSnap
    ? snapSFXPlacementToFrame(request.musicBeatTimeSeconds ?? alignment.hitTimeSeconds, fps)
    : { seconds: roundSeconds(alignment.hitTimeSeconds), frame: convertSecondsToFrames(alignment.hitTimeSeconds, fps) }
  const end = shouldSnap
    ? snapSFXPlacementToFrame(alignment.endTimeSeconds, fps)
    : { seconds: roundSeconds(alignment.endTimeSeconds), frame: convertSecondsToFrames(alignment.endTimeSeconds, fps) }
  const warnings: string[] = []

  if (request.speechPresent && alignment.hitOffsetInsideTrimMs < 40 && alignment.timingPriority !== 'speech_safe') {
    warnings.push('Speech is present; loud hits near words should be checked by mix planning.')
  }

  if (alignment.musicBeatAligned && request.musicBeatTimeSeconds !== undefined && Math.abs(hit.seconds - request.musicBeatTimeSeconds) > 0.04) {
    warnings.push('Frame snapping moved the hit away from the provided music beat by more than 40ms.')
  }

  return {
    timelinePlacement: {
      startTimeSeconds: start.seconds,
      hitTimeSeconds: hit.seconds,
      endTimeSeconds: end.seconds,
      startFrame: start.frame,
      hitFrame: hit.frame,
      endFrame: end.frame,
      fps,
      frameAccurate: shouldSnap,
      speechSafePlacement: alignment.speechSafePlacement,
      warnings,
    },
  }
}

export function createSFXPlacementSummary(timelinePlacement: SFXTimelinePlacement): string[] {
  return [
    `Timeline placement at ${timelinePlacement.fps}fps.`,
    `Start frame ${timelinePlacement.startFrame}, hit frame ${timelinePlacement.hitFrame}, end frame ${timelinePlacement.endFrame}.`,
    `Placed from ${timelinePlacement.startTimeSeconds}s to ${timelinePlacement.endTimeSeconds}s with hit at ${timelinePlacement.hitTimeSeconds}s.`,
    timelinePlacement.frameAccurate ? 'Placement was snapped to frames.' : 'Placement kept second-level mock timing.',
  ]
}

export type SFXTimelinePlacementInput = SFXTimingAlignmentRecord
