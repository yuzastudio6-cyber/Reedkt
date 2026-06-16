# TRACKA-CAPTION-QUALITY-3R Burn-In Revalidation Execution

## Goal

Run the future guarded corrected-caption burn-in revalidation only after explicit confirmation is provided.

## Required Confirmation

`REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`

If confirmation is absent, stop before runtime, GCS, libass, Remotion, FFmpeg/FFprobe, media processing, private E2E, or artifact creation and record `blocked_pending_caption_burnin_execution_confirmation`.

## Required Sources

- #426 approved controlled-test caption source.
- #440 TRACKA-CAPTION-QUALITY-2 planning.
- TRACKA-CAPTION-QUALITY-3 execution packet docs.

## Required Caption Input

captionSourceType: controlled_test_caption_copy

transcriptAccuracyClaim: false

Use only:

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

Reject old awkward #419 preview caption text: "Hey guys, I saw how you guys doing today is going to do going to be the first".

## Required Result

Record whether execution completed or remained blocked, private artifact refs if any, checksums if any, QA results, and the carried-forward private E2E/internal beta blockers. Never mark internal beta, production, external beta, final delivery, public artifact delivery, or signed URL delivery ready in this phase.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
