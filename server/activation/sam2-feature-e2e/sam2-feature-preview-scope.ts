import { sam2FeatureE2EConfig } from './sam2-feature-e2e-policy'
import type { Sam2FeaturePreviewScope } from './sam2-feature-e2e-types'

export function buildSam2FeaturePreviewScope(input: {
  sourceDurationSeconds?: number
  forceFallback?: boolean
  fallbackReason?: string
} = {}): Sam2FeaturePreviewScope {
  const sourceDurationSeconds = input.sourceDurationSeconds ?? sam2FeatureE2EConfig.controlledPreviewDurationSeconds
  const fullFrameCount = Math.max(1, Math.floor(sourceDurationSeconds * sam2FeatureE2EConfig.preferredFps))
  const fullClipAllowed = !input.forceFallback && fullFrameCount <= sam2FeatureE2EConfig.maxFrames

  if (fullClipAllowed) {
    return {
      mode: 'full_controlled_clip_preview',
      startSeconds: 0,
      endSeconds: sourceDurationSeconds,
      durationSeconds: sourceDurationSeconds,
      fps: sam2FeatureE2EConfig.preferredFps,
      frameCount: fullFrameCount,
      width: sam2FeatureE2EConfig.previewWidth,
      height: sam2FeatureE2EConfig.previewHeight,
      maxFrames: sam2FeatureE2EConfig.maxFrames,
      fullControlledClip: true,
      blockers: [],
      warnings: [
        'Full controlled clip preview means bounded private preview resolution/FPS only, not production full-video mask export.',
      ],
    }
  }

  return {
    mode: 'approved_segment_fallback',
    startSeconds: sam2FeatureE2EConfig.fallbackSegmentStartSeconds,
    endSeconds: sam2FeatureE2EConfig.fallbackSegmentEndSeconds,
    durationSeconds: sam2FeatureE2EConfig.fallbackSegmentDurationSeconds,
    fps: sam2FeatureE2EConfig.fallbackFrameCount / sam2FeatureE2EConfig.fallbackSegmentDurationSeconds,
    frameCount: sam2FeatureE2EConfig.fallbackFrameCount,
    width: sam2FeatureE2EConfig.previewWidth,
    height: sam2FeatureE2EConfig.previewHeight,
    maxFrames: sam2FeatureE2EConfig.maxFrames,
    fullControlledClip: false,
    fallbackReason: input.fallbackReason ?? `Full controlled clip at ${fullFrameCount} frames exceeded the Phase 35F cap or was explicitly disabled.`,
    blockers: [],
    warnings: [
      'Fallback scope is segment-level internal testing only, not full-feature beta candidate evidence.',
    ],
  }
}
