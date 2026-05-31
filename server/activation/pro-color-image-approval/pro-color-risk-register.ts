import type { ProColorImageRiskRegisterItem } from './pro-color-image-approval-types'

export const proColorImageRiskRegister: ProColorImageRiskRegisterItem[] = [
  blocker('license-provenance-records', 'Official permissive license evidence is recorded for planning, but each runtime dependency/package artifact must be rechecked before installation.', 'Carry source/license evidence into Phase 40B runtime dependency records.', 'Phase 40B dependency/license manifest.'),
  blocker('runtime-install-not-approved', 'Phase 40A cannot install OpenColorIO, OpenImageIO, Kornia, Python wheels, system packages, or native libraries.', 'Keep this phase static/report-only and require a later generated-fixture runtime phase.', 'Phase 40B runtime approval and validation logs.'),
  blocker('dependency-license-risk', 'Native and Python dependency transitive licenses are not reviewed for a dedicated runtime image yet.', 'Pin and review runtime dependencies before any image build or execution.', 'Dependency license bill of materials.'),
  blocker('ocio-config-provenance', 'OCIO configs and LUTs can carry their own provenance and licensing requirements.', 'Use only reviewed configs/LUTs and record checksums/provenance before runtime use.', 'OCIO config/LUT manifest and checksum evidence.'),
  blocker('lut-look-transform-risk', 'Incorrect LUT/look selection can shift exposure, contrast, saturation, or skin tones.', 'Start with generated fixtures and explicit before/after metrics.', 'Generated color chart and skin-tone proxy QA.'),
  blocker('oiio-format-metadata-risk', 'Image metadata, bit depth, alpha, orientation, color profile, or EXR attributes may be misread or dropped.', 'Use OpenImageIO only after generated metadata fixtures pass.', 'Phase 40B metadata round-trip QA.'),
  blocker('kornia-model-provider-boundary', 'Kornia includes model-adjacent areas that are not approved for Phase 40A planning.', 'Limit Kornia to local helper/metric operations; block model downloads and provider-style execution.', 'Phase 40B scoped runtime allowlist.'),
  blocker('color-shift-skin-tone-risk', 'Professional color transforms can produce unacceptable skin-tone or brand-color shifts.', 'Require generated color/skin-tone proxy QA before controlled real-video samples.', 'Color error metrics and human review notes.'),
  blocker('metadata-color-space-mismatch', 'Input/output color-space metadata mismatches can corrupt downstream previews or exports.', 'Validate metadata and explicit color-space labels in generated fixtures.', 'Frame metadata manifest with expected/actual fields.'),
  blocker('frame-sequence-mismatch', 'Frame sequence validation can fail on missing, duplicated, or incorrectly ordered frames.', 'Require generated sequence tests before real-video-derived frames.', 'Sequence continuity QA report.'),
  blocker('generated-fixture-qa-missing', 'No generated-fixture runtime QA exists for the pro color/image stack yet.', 'Run Phase 40B before any controlled real-video pro color/image sample.', 'Phase 40B generated fixture QA report.'),
  blocker('real-video-qa-missing', 'No controlled real-video pro color/image sample exists for these tools yet.', 'Run Phase 40C only after Phase 40B passes.', 'Phase 40C controlled sample QA.'),
  blocker('final-delivery-color-risk', 'Final delivery color management can alter customer-facing output if not separately validated.', 'Keep final delivery blocked until private feature E2E and export QA pass.', 'Phase 40D or later final-delivery readiness evidence.'),
  blocker('provider-public-output-risk', 'Provider calls, public outputs, and signed/public URLs are outside Phase 40A scope.', 'Keep all command plans text-only and private-by-default.', 'Smoke checks for blocked gates and command plans.'),
  blocker('revideo-path-risk', 'Revideo must not become a production path through color/image approval work.', 'Keep Revideo explicitly blocked in reports, docs, and readiness state.', 'Readiness summary with Revideo blocked.'),
  blocker('broad-media-safety-risk', 'Arbitrary real-user media is not approved for pro color/image runtime work.', 'Limit future real-video work to the approved controlled chain until later approval.', 'Controlled-media approval and QA evidence.'),
  warning('tool-overlap-confusion', 'OpenColorIO, OpenImageIO, Kornia, and FFmpeg have overlapping image/color concepts.', 'Document ownership boundaries and keep scope mapping in smoke tests.', 'Tool scope ownership report.'),
  warning('runtime-performance-unknown', 'Native image/color tooling may have unexpected CPU/memory behavior in staging.', 'Use generated bounded fixtures before any real-video path.', 'Phase 40B timing and memory observations.'),
  warning('human-visual-review-needed', 'Metrics cannot fully prove color/look quality.', 'Require human visual review before controlled real-video expansion.', 'Reviewer checklist and visual notes.'),
]

function blocker(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): ProColorImageRiskRegisterItem {
  return { riskId, severity: 'blocker', currentStatus, mitigation, evidenceRequiredToClear }
}

function warning(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): ProColorImageRiskRegisterItem {
  return { riskId, severity: 'warning', currentStatus, mitigation, evidenceRequiredToClear }
}
