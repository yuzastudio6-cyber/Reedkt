import type { FilmRiskRegisterItem } from './film-slowmotion-approval-types'

export const filmRiskRegister: FilmRiskRegisterItem[] = [
  blocker('license-provenance-incomplete', 'Cleared for Phase 38A staging planning from official Apache-2.0 source/license evidence; must be rechecked with exact downloaded artifact checksums in Phase 38B.', 'Carry official source/license/provenance into the Phase 38B manifest.', 'Phase 38B source_evidence.json and checksum manifest.'),
  blocker('checkpoint-checksum-unavailable', 'No FILM checkpoint checksum exists before Phase 38B.', 'Download only the approved official artifact tree in Phase 38B and compute checksums before upload.', 'SHA-256 checksums and aggregate manifest for the selected FILM artifact tree.'),
  blocker('runtime-model-download-risk', 'FILM runtime examples assume a local model_path and must not auto-download artifacts.', 'Require private GCS model copy and fail closed if runtime attempts external download.', 'Phase 38C runtime logs proving no external download.'),
  blocker('dependency-license-risk', 'TensorFlow/CUDA/FFmpeg/Python dependency shape is not approved for a dedicated FILM runtime yet.', 'Review and pin runtime dependencies in Phase 38C before execution.', 'Dedicated runtime dependency/license report.'),
  blocker('motion-hallucination', 'Interpolated frames can invent plausible but inaccurate motion.', 'Limit early tests to generated fixtures and selected controlled clips with visual QA.', 'Generated and controlled visual QA evidence.'),
  blocker('hand-face-body-warping', 'People, hands, faces, and limbs may warp during interpolation.', 'Require face/body/hand artifact checks before real-video sample expansion.', 'Frame-by-frame artifact QA.'),
  blocker('ghosting-double-exposure', 'Large motion can create ghost trails or duplicate objects.', 'Reject clips with blocking ghosting and provide FFmpeg speed-change fallback.', 'Ghosting QA with no blocking findings.'),
  blocker('flicker-temporal-inconsistency', 'Interpolated frames may flicker or pulse across time.', 'Measure temporal consistency on generated frames before real video.', 'Temporal consistency QA report.'),
  blocker('text-logo-distortion', 'Text, logos, UI, and product markings may deform.', 'Run generated text/logo fixtures before any branded real-video sample.', 'Text/logo interpolation QA.'),
  blocker('motion-boundary-artifacts', 'Object boundaries may smear or tear at fast motion edges.', 'Use bounded resolution/FPS and reject high-risk motion until proven.', 'Motion-boundary artifact QA.'),
  blocker('audio-video-sync-drift', 'Slow-motion samples can drift from source audio/timing.', 'Keep audio handling out of Phase 38A and require sync QA before previews.', 'A/V duration and sync QA from a later phase.'),
  blocker('frame-count-duration-mismatch', 'Interpolation count can change frame totals and export duration unexpectedly.', 'Record expected frame count formulas and validate outputs in Phase 38C.', 'Frame-count/duration manifest.'),
  blocker('compute-gpu-cost-risk', 'FILM may require GPU and high memory for useful resolution.', 'Use bounded generated tests and explicit L4 cost controls later.', 'Runtime timing/cost metrics.'),
  blocker('synthetic-frame-disclosure-risk', 'AI-created intermediate frames can misrepresent action or product detail.', 'Keep outputs private and document synthetic-frame status in review manifests.', 'Private review disclosure policy.'),
  blocker('no-generated-frame-runtime-qa', 'No generated-frame FILM runtime QA exists yet.', 'Run generated fixture verification in Phase 38C before real video.', 'Phase 38C QA report.'),
  blocker('no-controlled-real-video-slowmotion-qa', 'No controlled real-video FILM slow-motion QA exists yet.', 'Run one selected controlled sample only after Phase 38C passes.', 'Phase 38D QA report.'),
  blocker('broad-real-media-safety-risk', 'Arbitrary real-user media is not approved for FILM interpolation.', 'Limit future tests to the approved controlled chain until later approval.', 'Controlled-media approval and QA evidence.'),
  warning('subjective-smoothness-preference', 'Users may disagree about whether FILM smoothness looks natural.', 'Require visual review notes before broader testing.', 'Human visual review.'),
  warning('clip-specific-quality-variability', 'FILM quality may vary sharply by motion, blur, camera movement, and scene content.', 'Keep early samples short and representative.', 'Sample selection rationale.'),
  warning('sample-selection-bias', 'One selected sample may overstate quality.', 'Require multiple generated fixtures before any broader phase.', 'Expanded generated fixture matrix.'),
  warning('human-visual-review-burden', 'Frame interpolation QA requires careful frame-level review.', 'Use compact QA checklists and reject uncertain cases.', 'Reviewer checklist evidence.'),
]

function blocker(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): FilmRiskRegisterItem {
  return { riskId, severity: 'blocker', currentStatus, mitigation, evidenceRequiredToClear }
}

function warning(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): FilmRiskRegisterItem {
  return { riskId, severity: 'warning', currentStatus, mitigation, evidenceRequiredToClear }
}
