import type { Sam2RiskRegisterItem } from './sam2-model-approval-types'

export const sam2RiskRegister: Sam2RiskRegisterItem[] = [
  blocker('license-provenance-incomplete', 'SAM2 license/provenance needs explicit Phase 35A human review before checkpoint approval.', 'Record human legal/model approval for the exact source and checkpoint.', 'Approved legal/model review artifact.'),
  blocker('checkpoint-checksum-unavailable', 'No SAM2 checkpoint checksum is approved.', 'Select the checkpoint in a future approval step and calculate checksum only in Phase 35B.', 'Checksum record for the selected checkpoint.'),
  blocker('model-download-not-approved', 'SAM2 download is not approved in Phase 35A.', 'Keep all download commands text-only until Phase 35B is explicitly approved.', 'Phase 35B approval and private download/load evidence.'),
  blocker('runtime-image-not-verified', 'No SAM2 runtime image/job has loaded the checkpoint.', 'Verify runtime only in Phase 35C after private checkpoint storage exists.', 'Phase 35C runtime report with private artifact QA.'),
  blocker('gpu-cost-quota-risk', 'SAM2 video tracking may require GPU resources and bounded quotas.', 'Use dedicated staging L4 job limits and cost controls in a later runtime phase.', 'Reviewed job config, quota, and cost controls.'),
  blocker('temporal-mask-drift', 'Temporal masks may drift across frames.', 'Require generated fixture runtime QA before any real-video temporal tracking.', 'Temporal QA report showing stable masks over the approved sequence.'),
  blocker('identity-object-tracking-drift', 'Tracked subjects or objects may switch identity or attach to the wrong target.', 'Constrain prompts/targets and require human QA on short clips.', 'Short-clip tracking QA with identity continuity checks.'),
  blocker('occlusion-failures', 'Occlusions may break or reassign masks.', 'Test occlusion cases on generated fixtures before controlled real-video segments.', 'Occlusion QA evidence.'),
  blocker('edge-flicker', 'Mask edges can flicker frame to frame.', 'Require frame-sequence edge stability metrics and visual review.', 'Temporal edge flicker QA.'),
  blocker('hair-fine-detail-instability', 'Hair and fine-detail boundaries can be unstable.', 'Require fine-detail QA and conservative composition fallbacks.', 'Fine-detail mask QA evidence.'),
  blocker('fast-motion-instability', 'Fast motion can destabilize mask propagation.', 'Keep Phase 35D to a very short selected segment and reject fast-motion cases until proven.', 'Fast-motion mask QA or documented exclusion.'),
  blocker('mask-bleed-across-objects', 'Masks may bleed across nearby subjects or objects.', 'Require subject-boundary QA and fallback to no text-behind-subject when uncertain.', 'Boundary QA with no blocking bleed findings.'),
  blocker('full-video-mask-qa-not-proven', 'Full-video mask tracking has no QA proof.', 'Do not allow full-video masks until later explicit phase evidence exists.', 'Full-video QA evidence from a later approved phase.'),
  blocker('text-behind-subject-temporal-artifacts', 'Temporal mask issues can create text-behind-subject shimmer, clipping, or subject overlap.', 'Keep text-behind-subject blocked until temporal mask QA passes.', 'Text-behind-subject temporal preview QA.'),
  blocker('privacy-subject-extraction-risk', 'Subject masks and cutouts may expose sensitive person/object data.', 'Keep artifacts private and require privacy review before broader use.', 'Private artifact policy and privacy review.'),
  blocker('broad-real-media-safety-risk', 'Arbitrary real-user video has not been approved for SAM2 tracking.', 'Limit future tests to the approved controlled real-video chain only.', 'Controlled-media approval and QA evidence.'),
  warning('aesthetic-mask-quality-varies', 'Mask quality may vary by clip aesthetics and scene type.', 'Set expectations and require human review before expanding scope.', 'Clip-specific QA notes.'),
  warning('sample-selection-bias', 'A short sample may overstate SAM2 quality.', 'Use representative sample selection criteria before any broader phase.', 'Sample selection rationale.'),
  warning('human-review-burden', 'Temporal mask review requires frame-by-frame attention.', 'Define concise QA checklists and acceptance thresholds.', 'Human QA checklist evidence.'),
  warning('compute-cost-variability', 'SAM2 runtime cost may vary by resolution and clip complexity.', 'Measure generated fixture runtime cost before controlled real-video tests.', 'Runtime timing and cost metrics.'),
]

function blocker(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): Sam2RiskRegisterItem {
  return {
    riskId,
    severity: 'blocker',
    currentStatus,
    mitigation,
    evidenceRequiredToClear,
  }
}

function warning(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): Sam2RiskRegisterItem {
  return {
    riskId,
    severity: 'warning',
    currentStatus,
    mitigation,
    evidenceRequiredToClear,
  }
}
