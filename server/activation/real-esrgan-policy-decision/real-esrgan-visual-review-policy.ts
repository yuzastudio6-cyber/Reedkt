import type { RealEsrganHumanVisualReviewPolicy } from './real-esrgan-policy-decision-types'

export const realEsrganHumanVisualReviewPolicy: RealEsrganHumanVisualReviewPolicy = {
  humanVisualReviewRequired: true,
  humanVisualReviewCompleted: false,
  humanApprovalForFullFrame: false,
  humanApprovalForFullVideo: false,
  currentStatus: 'missing_explicit_human_before_after_review_artifact',
  nextRealEsrganStep: 'human_review_or_additional_bounded_sample_planning',
  requiredChecks: [
    'before/after sample naturalness',
    'hallucinated details',
    'oversharpening or halos',
    'plastic/unnatural textures',
    'skin/hair/product distortions if applicable',
    'text/logo/detail corruption',
    'temporal risk remains unknown because only one frame/crop was tested',
    'whether another selected sample is needed',
  ],
}
