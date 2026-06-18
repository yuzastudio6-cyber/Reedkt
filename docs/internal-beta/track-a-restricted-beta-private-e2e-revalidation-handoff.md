# Track A Restricted Beta Private E2E Revalidation Handoff

## Handoff Status

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `ready`

trackAPrivateE2ERevalidationPlanningReady: true

trackARestrictedInternalBetaScopeDecision: `approved_for_private_e2e_revalidation_planning`

trackAInternalBetaUnlocked: false

## Included Scope For Private E2E Planning

- private render/export review path.
- corrected controlled-test caption burn-in.
- configurable caption layout policy from #492.
- default caption preset `one_line_bottom_safe_area`.
- libass caption burn-in runtime path from #463.
- FFmpeg/FFprobe private validation path from #463/#475/#488.
- Remotion/private preview path only if current-source evidence is sufficient.
- private artifact manifest, checksum, and QA-report evidence.

## Excluded Scope For Private E2E Planning

- BiRefNet/text-behind-subject/masking.
- SAM2 segmentation/runtime.
- Real-ESRGAN enhancement.
- FILM interpolation runtime.
- OpenColorIO/OpenImageIO production color management.
- broad real-user media or arbitrary user media.
- final delivery/export.
- public artifacts.
- signed URLs as source-of-truth.
- external beta.
- paid production.
- production.

## Required Private E2E Evidence

- private manifest for every reviewed artifact.
- SHA-256 checksums for review artifacts and reports.
- caption policy evidence using #492 defaults and allowed presets.
- FFprobe validation evidence for private review previews when execution occurs in a future approved phase.
- human/AI visual review record.
- observability and cost notes.
- compliance and privacy notes.
- explicit confirmation that public artifacts, signed URLs, final delivery, external beta, production, and broad media remain blocked.

## Caption Policy Inputs

defaultCaptionPreset: `one_line_bottom_safe_area`

defaultMaxLines: `1`

defaultPlacement: `bottom_center_safe_area`

defaultAvoidFaceObstruction: `true`

defaultSafeMarginsRequired: `true`

defaultTranscriptAccuracyClaim: `false`

configurablePresets: `one_line_bottom_safe_area`, `two_line_subtitle`, `auto_wrap_subtitle`, `creator_large_caption`, `lower_third_caption`, `manual_position_and_size`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
