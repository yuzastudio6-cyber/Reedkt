# INTERNAL-BETA-READINESS-ROLLUP-1

## Goal

Create the internal beta readiness rollup only after TRACKA-PRIVATE-E2E-REVALIDATION-1 has completed for the restricted Track A scope approved by INTERNAL-BETA-TRACKA-SCOPE-DECISION-1.

## Required Source Evidence

- INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 decision: `trackARestrictedInternalBetaScopeDecision: approved_for_private_e2e_revalidation_planning`.
- INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 status: `trackAInternalBetaUnlocked: false`.
- TRACKA-PRIVATE-E2E-REVALIDATION-1 result for included restricted scope.
- #492 caption layout policy: `user_configurable_default_one_line` with default preset `one_line_bottom_safe_area`.

## Scope Boundary

The rollup may evaluate readiness after private E2E revalidation. It must not include excluded/deferred Track A scope unless a separate expansion packet explicitly approved that scope.

Excluded by default:

- `birefnet_text_behind_subject_masking`
- `sam2_segmentation_runtime`
- `real_esrgan_enhancement`
- `film_interpolation_runtime`
- `opencolorio_openimageio_production_color_management`
- public artifacts
- signed URL source-of-truth
- final delivery/export
- broad/arbitrary user media
- external beta
- paid production
- production

## Required Readiness Inputs

- private manifest/checksum/QA evidence.
- caption policy evidence.
- FFprobe/private validation evidence when execution evidence is in scope.
- human/AI visual review record.
- compliance/privacy notes.
- observability/cost notes.
- explicit blocked status for final delivery, external beta, production, paid production, public artifacts, and signed URLs unless separate gates have approved them.

## Blocked Claims

This prompt must not assume internal beta is unlocked. It must perform a rollup from completed evidence and keep production, external beta, final delivery, public artifacts, signed URLs, broad media, and paid production blocked unless separately approved.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
