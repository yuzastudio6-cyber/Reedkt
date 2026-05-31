import { realVideoProColorImageConfig } from './real-video-pro-color-image-policy'
import type { RealVideoProColorImageSamplePlan } from './real-video-pro-color-image-types'

export function buildRealVideoProColorSamplePlan(): RealVideoProColorImageSamplePlan {
  return {
    runtimeMode: realVideoProColorImageConfig.runtimeMode,
    timestampsSeconds: [...realVideoProColorImageConfig.timestampsSeconds],
    frameCount: realVideoProColorImageConfig.preferredFrameCount,
    maxFrameCount: realVideoProColorImageConfig.maxFrameCount,
    frameWidth: realVideoProColorImageConfig.maxFrameWidth,
    frameHeight: realVideoProColorImageConfig.maxFrameHeight,
    maxFrameWidth: realVideoProColorImageConfig.maxFrameWidth,
    maxFrameHeight: realVideoProColorImageConfig.maxFrameHeight,
    reason: 'Sample beginning, anchor/midpoint, and late frame from the controlled Phase 32 export while avoiding full-video processing.',
    fullVideoExtractionAllowed: false,
    full4KProcessingAllowed: false,
  }
}

