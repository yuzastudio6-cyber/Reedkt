import { realVideoSam2TemporalMaskConfig } from './real-video-sam2-temporal-mask-policy'
import type { RealVideoSam2PromptPlan } from './real-video-sam2-temporal-mask-types'

export function buildRealVideoSam2PromptPlan(): RealVideoSam2PromptPlan {
  return {
    promptSource: 'phase33d_mask_bbox',
    promptType: 'box',
    anchorFrameGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri,
    anchorMaskGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri,
    anchorCutoutGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri,
    promptFrameIndex: 4,
    reason: 'The prompt box is derived from the approved Phase 33D mask and scaled into the bounded Phase 35D extracted frame dimensions.',
    blockers: [],
    warnings: ['Prompt coordinates are derived at runtime from mask pixels; raw chat and manual uncited coordinates are not allowed.'],
  }
}
