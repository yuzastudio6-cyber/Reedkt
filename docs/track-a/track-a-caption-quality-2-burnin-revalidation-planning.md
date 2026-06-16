# TRACKA-CAPTION-QUALITY-2 Burn-In Revalidation Planning

Status: `docs_only_planning`

Branch: `codex/rp-tracka-caption-quality-2-burnin-revalidation-planning`

PR title: `[track-a] Caption burn-in revalidation planning`

Base: `2bb01b188aeb636c4234ecd4a9bf6a12ad87eee3`

## Source-Of-Truth Audit

| Source | Status | Role |
| --- | --- | --- |
| #419 TRACKA-VISUAL-REVIEW-2C | merged at `01e19cf6bd975b6ac9168c2d226638d211849886` | sample-level visual review outcome, `pass_with_warnings_sample_level` |
| #422 TRACKA-VISUAL-GAP-CLOSURE-1 | merged at `cc49487f56e2c30f8f77af84b856da0453a07e1d` | caption quality and OTIO/full E2E are non-deferrable internal beta blockers |
| #426 TRACKA-CAPTION-QUALITY-1 | merged at `58a3f87a6fc07e3afc6fb699c40c8b744cc75eab` | closes controlled-test caption text quality and defines the approved corrected caption source |
| #429 TRACKA-MISSING-VISUAL-EVIDENCE-1 | merged at `e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f` | provides the merged missing-evidence bundle source, with five copied visual artifacts and no blockers closed by #429 alone |
| #434 TRACKA-MISSING-VISUAL-EVIDENCE-2 | merged at `2bb01b188aeb636c4234ecd4a9bf6a12ad87eee3` | records `partial_pass_with_warnings`, keeps full closure false, and keeps caption burn-in revalidation blocked |

## Approved Caption Source

captionSourceType: controlled_test_caption_copy

transcriptAccuracyClaim: false

captionTextQualityForControlledTest: pass

visualBurnInRevalidationRequired: true

Corrected controlled-test caption copy:

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

The old awkward #419 preview caption sample is rejected and must not be reused: "Hey guys, I saw how you guys doing today is going to do going to be the first".

## Planning Objective

This packet defines the future execution packet requirements for corrected-caption visual burn-in revalidation. It does not run libass, Remotion, FFmpeg, FFprobe, OpenTimelineIO, private E2E rendering, media processing, artifact access, or final delivery.

## Current Missing-Evidence Outcome

#434 remains authoritative:

- missing visual evidence: `partial_pass_with_warnings`
- BiRefNet: `blocked_insufficient_visual_evidence` unless excluded from first restricted internal beta
- Real-ESRGAN: `blocked_missing_visual_evidence` unless excluded from first restricted internal beta
- OpenColorIO/OpenImageIO: `provisional_pass_sample_level`
- OTIO/full private E2E: `technical_pass_with_caption_revalidation_warning`
- caption visual burn-in revalidation: `blocked_pending_caption_burnin_revalidation`
- full Track A visual closure: `false`
- internal beta: `false`

## Readiness Decisions

TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision

INTERNAL-BETA readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision

TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: optional_scope_expansion_only

Caption text quality is closed by #426, but corrected-caption visual burn-in has not run.

## Blocked Scope

- libass execution: blocked
- Remotion execution: blocked
- FFmpeg/FFprobe execution: blocked
- private E2E execution: blocked
- Track A runtime execution: blocked
- media processing: blocked
- GCS access: blocked
- signed URL creation: blocked
- public artifact creation: blocked
- internal beta: blocked
- production/external beta/final delivery: blocked

## Supabase Classification

- Supabase update required: docs/status only
- Supabase update status: docs_only
- Supabase environment touched: none
- SQL executed: none
- Migration deployed: no
- Next Supabase action: none

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
