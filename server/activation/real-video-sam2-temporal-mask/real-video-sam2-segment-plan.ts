import { realVideoSam2TemporalMaskConfig } from './real-video-sam2-temporal-mask-policy'
import type { RealVideoSam2SegmentPlan } from './real-video-sam2-temporal-mask-types'

export function buildRealVideoSam2SegmentPlan(): RealVideoSam2SegmentPlan {
  const durationSeconds = Number((realVideoSam2TemporalMaskConfig.segmentEndSeconds - realVideoSam2TemporalMaskConfig.segmentStartSeconds).toFixed(4))
  const blockers: string[] = []
  const warnings = ['This selected segment is intentionally short and does not prove full-video temporal QA.']
  if (durationSeconds > realVideoSam2TemporalMaskConfig.maxSegmentDurationSeconds) blockers.push('Selected segment exceeds the Phase 35D max duration.')
  if (realVideoSam2TemporalMaskConfig.preferredFrameCount > realVideoSam2TemporalMaskConfig.maxFrames) blockers.push('Selected frame count exceeds the Phase 35D max frame count.')
  if (realVideoSam2TemporalMaskConfig.anchorTimestampSeconds < realVideoSam2TemporalMaskConfig.segmentStartSeconds || realVideoSam2TemporalMaskConfig.anchorTimestampSeconds > realVideoSam2TemporalMaskConfig.segmentEndSeconds) blockers.push('Anchor timestamp must fall inside the selected segment.')
  return {
    inputVideoGcsUri: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,
    anchorTimestampSeconds: realVideoSam2TemporalMaskConfig.anchorTimestampSeconds,
    startSeconds: realVideoSam2TemporalMaskConfig.segmentStartSeconds,
    endSeconds: realVideoSam2TemporalMaskConfig.segmentEndSeconds,
    durationSeconds,
    frameCount: realVideoSam2TemporalMaskConfig.preferredFrameCount,
    maxFrames: realVideoSam2TemporalMaskConfig.maxFrames,
    frameWidth: realVideoSam2TemporalMaskConfig.frameWidth,
    frameHeight: realVideoSam2TemporalMaskConfig.frameHeight,
    extractionMode: 'bounded_short_segment_only',
    reason: 'Bounded two-second segment centered around the Phase 33D representative frame timestamp.',
    blockers,
    warnings,
  }
}
