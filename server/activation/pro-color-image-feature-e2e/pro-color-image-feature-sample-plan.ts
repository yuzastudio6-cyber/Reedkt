import { proColorImageFeatureE2EConfig } from './pro-color-image-feature-e2e-policy'
import type { ProColorImageFeatureE2ESamplePlan } from './pro-color-image-feature-e2e-types'

export function buildProColorImageFeatureSamplePlan(): ProColorImageFeatureE2ESamplePlan {
  return {
    runtimeMode: proColorImageFeatureE2EConfig.runtimeMode,
    timestampsSeconds: [...proColorImageFeatureE2EConfig.timestampsSeconds],
    frameCount: proColorImageFeatureE2EConfig.preferredFrameCount,
    maxFrameCount: proColorImageFeatureE2EConfig.maxFrameCount,
    frameWidth: proColorImageFeatureE2EConfig.maxFrameWidth,
    frameHeight: proColorImageFeatureE2EConfig.maxFrameHeight,
    maxFrameWidth: proColorImageFeatureE2EConfig.maxFrameWidth,
    maxFrameHeight: proColorImageFeatureE2EConfig.maxFrameHeight,
    reason: 'Feature E2E review sample uses beginning, anchor/midpoint, and late frames from the controlled Phase 32 export while avoiding full-video processing.',
    fullVideoExtractionAllowed: false,
    full4KProcessingAllowed: false,
  }
}
