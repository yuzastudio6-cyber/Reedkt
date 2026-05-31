import { realVideoFilmSlowmotionConfig } from './real-video-film-slowmotion-policy'
import type { RealVideoFilmSlowmotionSegmentPlan } from './real-video-film-slowmotion-types'

export function buildRealVideoFilmSegmentPlan(): RealVideoFilmSlowmotionSegmentPlan {
  const blockers: string[] = []
  const warnings = [
    'Selected segment is deterministic and centered on the existing visual anchor timestamp 7.7335s.',
    'Preview MP4 is optional; source and interpolated private frame artifacts are the required evidence.',
  ]
  if (realVideoFilmSlowmotionConfig.segmentDurationSeconds > 1.5) blockers.push('Segment duration must be <= 1.5s.')
  if (realVideoFilmSlowmotionConfig.sourceFrameCount > realVideoFilmSlowmotionConfig.maxSourceFrames) blockers.push('Source frame count must be <= 12.')
  if (realVideoFilmSlowmotionConfig.outputFrameCount > realVideoFilmSlowmotionConfig.maxOutputFrames) blockers.push('Output frame count must be <= 24.')
  return {
    startSeconds: realVideoFilmSlowmotionConfig.segmentStartSeconds,
    endSeconds: realVideoFilmSlowmotionConfig.segmentEndSeconds,
    durationSeconds: realVideoFilmSlowmotionConfig.segmentDurationSeconds,
    sourceFrameFps: realVideoFilmSlowmotionConfig.sourceFrameFps,
    sourceFrameCount: realVideoFilmSlowmotionConfig.sourceFrameCount,
    maxSourceFrames: realVideoFilmSlowmotionConfig.maxSourceFrames,
    frameWidth: realVideoFilmSlowmotionConfig.frameWidth,
    frameHeight: realVideoFilmSlowmotionConfig.frameHeight,
    outputFrameCount: realVideoFilmSlowmotionConfig.outputFrameCount,
    maxOutputFrames: realVideoFilmSlowmotionConfig.maxOutputFrames,
    reason: 'Deterministic 1.5s segment centered on the approved Phase 32 visual anchor timestamp 7.7335s.',
    blockers,
    warnings,
  }
}
