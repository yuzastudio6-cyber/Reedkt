import type { FilmSlowMotionRisk } from './film-slowmotion-review-types'

export const FILM_SLOWMOTION_RISK_REGISTER: FilmSlowMotionRisk[] = [
  {
    riskId: 'film_model_license_provenance_unknown',
    severity: 'blocker',
    mitigation: 'Require human review of exact upstream source, model card, license, and redistribution/commercial-use terms.',
    requiredEvidence: 'Approved source URL, license text, provenance notes, and approval record for the selected checkpoint.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_checkpoint_checksum_unavailable',
    severity: 'blocker',
    mitigation: 'Require a pinned checkpoint artifact with a recorded checksum before storage or runtime use.',
    requiredEvidence: 'Checksum and immutable private storage reference for the exact checkpoint.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_runtime_model_download_risk',
    severity: 'blocker',
    mitigation: 'Runtime images and jobs must use pre-approved private model storage and forbid external model download.',
    requiredEvidence: 'Runtime command plan and image policy showing no external model fetch path.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_gpu_cost_quota_risk',
    severity: 'blocker',
    mitigation: 'Require explicit L4/GPU quota, budget, timeout, and kill-switch limits before any runtime test.',
    requiredEvidence: 'Approved GPU budget, quota check, timeout, and per-run cost guard.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_hallucinated_interpolated_motion_frames',
    severity: 'blocker',
    mitigation: 'Limit tests to a human-approved short clip and require review for misleading synthetic motion.',
    requiredEvidence: 'Before/after frame review and disclosure decision for generated intermediate frames.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_hand_face_body_warping',
    severity: 'blocker',
    mitigation: 'Require subject deformation QA and reject clips with face, hand, product, or body warping.',
    requiredEvidence: 'Human visual QA results across subject regions and motion boundaries.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_ghosting_double_exposure',
    severity: 'blocker',
    mitigation: 'Require ghosting and duplicated-object QA before any broader interpolation use.',
    requiredEvidence: 'Clip-specific QA notes covering ghost trails, doubled objects, and exposure artifacts.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_flicker_temporal_inconsistency',
    severity: 'blocker',
    mitigation: 'Require temporal consistency review and reject flicker-prone sequences.',
    requiredEvidence: 'Frame-sequence review for luminance, texture, and edge stability.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_audio_video_sync_drift',
    severity: 'blocker',
    mitigation: 'Forbid audio rewrite in the first bounded test unless separately planned and reviewed.',
    requiredEvidence: 'A/V sync QA and explicit audio handoff plan for any test with audio.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_motion_boundary_artifacts',
    severity: 'blocker',
    mitigation: 'Require review of high-motion edges, occlusion boundaries, contact objects, and products.',
    requiredEvidence: 'Motion-boundary QA results for the selected test segment.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_misleading_synthetic_frame_disclosure',
    severity: 'blocker',
    mitigation: 'Require product/legal review on whether interpolated frames need internal or user-facing disclosure.',
    requiredEvidence: 'Disclosure decision for synthetic intermediate frames in the selected use case.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_broad_media_safety_risk',
    severity: 'blocker',
    mitigation: 'Block full-video, arbitrary user media, public artifacts, and broad beta until bounded tests pass.',
    requiredEvidence: 'Human-approved narrow test result and updated safety policy before any expanded scope.',
    currentStatus: 'blocked_until_human_approval',
  },
  {
    riskId: 'film_subjective_smoothness',
    severity: 'warning',
    mitigation: 'After runtime proof, compare smoothness against source intent and editor preference.',
    requiredEvidence: 'Human side-by-side review after a future approved runtime proof.',
    currentStatus: 'warning_after_future_runtime_proof',
  },
  {
    riskId: 'film_aesthetic_preference',
    severity: 'warning',
    mitigation: 'Treat slow-motion look as an editorial preference after safety and runtime proof pass.',
    requiredEvidence: 'Human review notes for whether interpolation improves the approved edit intent.',
    currentStatus: 'warning_after_future_runtime_proof',
  },
  {
    riskId: 'film_clip_specific_motion_quality',
    severity: 'warning',
    mitigation: 'Judge clip quality only on the bounded test clip; do not generalize to broad media.',
    requiredEvidence: 'Clip-specific QA score and rejection criteria after a future approved runtime proof.',
    currentStatus: 'warning_after_future_runtime_proof',
  },
]

export function listFilmSlowMotionRisks(): FilmSlowMotionRisk[] {
  return FILM_SLOWMOTION_RISK_REGISTER.map((risk) => ({ ...risk }))
}
