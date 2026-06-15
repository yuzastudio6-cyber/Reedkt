# TRACKA-CAPTION-QUALITY-1 Approved Caption Source And Caption Text QA

## Goal

Create the approved caption source and caption text QA packet required before Track A internal beta readiness can advance.

## Source Evidence

- #419 TRACKA-VISUAL-REVIEW-2C.
- #422 TRACKA-VISUAL-GAP-CLOSURE-1.
- `track-a-caption-quality-closure-plan.md`.
- `track-a-visual-review-2c-artifact-review-results.md`.

## Required Work

- define the approved caption or transcript source.
- record `captionSourceType: controlled_test_caption_copy`.
- record `transcriptAccuracyClaim: false` unless a separately verified audio transcript source exists.
- reject the malformed #419 sample: "Hey guys, I saw how you guys doing today is going to do going to be the first".
- correct malformed caption text from the reviewed sample with this controlled-test copy:
  1. "Hey everyone — welcome to this ReEditPro visual review."
  2. "Today we are testing captions, overlays, and private render quality."
  3. "The goal is a clean, professional edit with readable text."
  4. "Review this sample for timing, polish, and visual clarity."
- record caption text QA against readability, phrase boundary, and speech-first rules.
- produce replacement caption sample evidence for future review.
- keep Track A runtime, Remotion, libass, FFmpeg, media processing, and render/export blocked.
- keep visual burn-in revalidation required.

## Acceptance Criteria

- TRACKA-CAPTION-QUALITY-1 records caption copy as approved for the relevant sample.
- the awkward sample caption is replaced or explicitly rejected.
- `captionTextQualityForControlledTest: pass`.
- `captionVisualBurnInRevalidationRequired: true`.
- `TRACKA-CAPTION-QUALITY-2 readiness: ready_for_future_burnin_revalidation_planning`.
- `TRACKA-MISSING-VISUAL-EVIDENCE-1 readiness: ready`.
- internal beta remains blocked until missing visual evidence and caption burn-in revalidation are closed.

## Supabase Classification

- Supabase update required: docs/status only
- Supabase update status: docs_only
- Supabase environment touched: none
- SQL executed: none
- Migration deployed: no
- Next Supabase action: none

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
