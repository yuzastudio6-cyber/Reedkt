import type { RealEsrganRiskRegisterItem } from './real-esrgan-policy-decision-types'

export const realEsrganPolicyRiskRegister: RealEsrganRiskRegisterItem[] = [
  blocker('one-crop-only-evidence', 'Only one 512x512 crop has been enhanced.', 'Keep Real-ESRGAN limited to bounded samples.', 'Additional reviewed samples or a separately approved broader-scope experiment.'),
  blocker('no-full-frame-qa', 'No full-frame enhancement QA exists.', 'Block full-frame enhancement.', 'Private full-frame experiment plan, explicit approval, and visual QA.'),
  blocker('no-full-video-temporal-qa', 'No temporal QA exists for enhanced video frames.', 'Block full-video enhancement.', 'Approved frame-sequence/segment test with temporal QA.'),
  blocker('hallucinated-detail-risk', 'Real-ESRGAN can invent or intensify details.', 'Require human before/after review.', 'Reviewer signoff that enhanced details are not misleading.'),
  blocker('oversharpening-risk', 'Sharper output can create halos or harsh edges.', 'Require visual QA for halos and edge integrity.', 'Human review artifact and QA thresholds for broader scope.'),
  blocker('texture-artifact-risk', 'Textures can become plastic, noisy, or unnatural.', 'Require sample review before expansion.', 'Reviewer signoff on representative textures.'),
  blocker('text-logo-corruption-risk', 'Small text, logos, and product marks can distort.', 'Require text/logo integrity checks.', 'Targeted review where text or logos appear.'),
  blocker('face-skin-artifact-risk', 'Skin, hair, and faces can be distorted by upscaling.', 'Keep GFPGAN/face enhancement disabled and require human review.', 'Human review of relevant people/product regions.'),
  blocker('compute-cost-risk', 'Large frames or video sequences have materially higher GPU cost.', 'Do not run larger scope without explicit cost approval.', 'Bounded execution budget and reviewed runtime plan.'),
  blocker('storage-cost-risk', 'Enhanced video outputs can multiply storage footprint.', 'Keep artifacts private and bounded.', 'Private artifact retention and storage budget plan.'),
  blocker('misleading-enhancement-risk', 'Generated detail may be interpreted as source truth.', 'Require disclosure and review policy before broader use.', 'Approved user-facing disclosure policy for enhancement.'),
  blocker('no-human-visual-approval-yet', 'No explicit human review artifact is present.', 'Keep full-frame and full-video blocked.', 'Human visual review record approving next step.'),
  blocker('production-beta-safety-risk', 'Production, beta, and broad-media claims need broader evidence.', 'Keep all launch gates false.', 'Later go/no-go review after controlled QA evidence.'),
  warning('aesthetic-preference', 'Some users may prefer the original or a softer enhancement.', 'Capture reviewer preference notes.', 'Human review comparing before/after preference.'),
  warning('clip-specific-variability', 'Some footage may benefit while other footage degrades.', 'Require diverse bounded samples before broader scope.', 'Multiple selected samples with recorded outcomes.'),
  warning('future-sample-selection-bias', 'Cherry-picked samples can overstate readiness.', 'Document sample selection rationale.', 'Approved sample selection policy and rationale.'),
]

function blocker(riskId: string, currentStatus: string, mitigation: string, evidenceRequiredToClear: string): RealEsrganRiskRegisterItem {
  return {
    riskId,
    severity: 'blocker',
    currentStatus,
    mitigation,
    evidenceRequiredToClear,
  }
}

function warning(riskId: string, currentStatus: string, mitigation: string, evidenceRequiredToClear: string): RealEsrganRiskRegisterItem {
  return {
    riskId,
    severity: 'warning',
    currentStatus,
    mitigation,
    evidenceRequiredToClear,
  }
}
