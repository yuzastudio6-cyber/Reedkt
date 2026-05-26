import type { MaskExecutionInput, MaskTemporalSmoothingPlan } from './mask-execution-types'

export function buildMaskTemporalSmoothingPlan(input: MaskExecutionInput): MaskTemporalSmoothingPlan {
  const videoIntent = input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject' || Boolean(input.sourceVideoArtifactId || input.sourceVideoLocalPath || input.proxyVideoLocalPath)
  const trackingRequired = videoIntent && (input.motionRequiresTracking === true || input.maskIntent === 'text_behind_subject')
  return {
    required: videoIntent,
    trackingRequired,
    maxAllowedFlickerRisk: input.maskIntent === 'text_behind_subject' ? 'low' : 'medium',
    frameConsistencyChecks: [
      'frame_to_frame_edge_delta',
      'subject_coverage_delta',
      'tracking_drift_check',
    ],
    warningIfNotRun: 'Video masks must not claim temporal smoothing or tracking unless refinement actually runs.',
  }
}
