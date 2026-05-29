import type { RealEsrganNextSampleScope } from './real-esrgan-policy-decision-types'

export const realEsrganNextSampleScope: RealEsrganNextSampleScope = {
  futurePlanningOptions: [
    {
      optionId: 'human_visual_review_only',
      allowedForPlanning: true,
      requiresSeparateHumanApproval: true,
      description: 'Review the existing Phase 34D before/after sample and record whether it is natural enough to plan another controlled step.',
    },
    {
      optionId: 'one_additional_bounded_crop_sample',
      allowedForPlanning: true,
      requiresSeparateHumanApproval: true,
      description: 'Plan one additional private bounded crop from the existing approved real-video chain only.',
    },
    {
      optionId: 'selected_short_segment_frame_sample_sequence',
      allowedForPlanning: true,
      requiresSeparateHumanApproval: true,
      description: 'Plan a selected short frame-sample sequence only after separate approval and temporal QA definition.',
    },
    {
      optionId: 'blind_full_video_enhancement',
      allowedForPlanning: false,
      requiresSeparateHumanApproval: true,
      description: 'Never allowed as a blind/default next step.',
    },
  ],
  realEsrganAdditionalBoundedSamplePlanningAllowed: true,
  realEsrganFullFrameAllowed: false,
  realEsrganFullVideoAllowed: false,
  blindFullVideoEnhancementAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
  slowMotionAllowed: false,
  filmAllowed: false,
  providerAllowed: false,
  publicAccessAllowed: false,
  revideoAllowed: false,
  constraints: [
    'Use the existing approved controlled real-video chain only.',
    'Keep artifacts private.',
    'Do not enable public access.',
    'Do not call providers.',
    'Do not use GFPGAN or facexlib.',
    'Do not enhance full video without a later explicit phase.',
    'Do not unlock production, external beta, or broad real media.',
    'Do not run heavy processing from the frontend.',
  ],
}
