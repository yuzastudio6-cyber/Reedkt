import { realVideoEnhancementSampleConfig } from './real-video-enhancement-sample-policy'
import type { RealVideoEnhancementSampleCropPlan } from './real-video-enhancement-sample-types'

export function buildRealVideoEnhancementSampleCropPlan(): RealVideoEnhancementSampleCropPlan {
  return {
    sourceFrameGcsUri: realVideoEnhancementSampleConfig.sourceFrameGcsUri,
    preferredCrop: {
      width: 512,
      height: 512,
      anchor: 'center',
    },
    fallbackCrop: {
      minWidth: 256,
      minHeight: 256,
      rule: 'largest_centered_square_if_source_smaller_than_512',
    },
    expectedScale: 4,
    fullFrameEnhancementAllowed: false,
    fullVideoEnhancementAllowed: false,
    exactlyOneSample: true,
    warnings: ['Phase 34D validates one bounded real-video-derived crop only; it does not approve full-frame or full-video enhancement.'],
  }
}
