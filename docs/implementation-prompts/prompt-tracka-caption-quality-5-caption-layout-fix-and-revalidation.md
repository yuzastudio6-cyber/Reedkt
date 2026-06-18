# TRACKA-CAPTION-QUALITY-5 Caption Style/Layout Fix And Revalidation Packet

## Goal

Fix the corrected-caption burn-in layout failure recorded by TRACKA-CAPTION-QUALITY-4, then prepare a new guarded revalidation packet.

## Source Status

TRACKA-CAPTION-QUALITY-4 records `overallDecision: fail_caption_layout_quality` for `tracka-caption-quality-3r3-corrected-caption-preview.mp4`.

The corrected #426 caption copy is present and the old awkward #419 caption text is absent, but caption visual layout failed.

## Required Fixes

- Reduce font size and scale it proportional to frame height.
- Start with 4% to 6% of frame height, then adjust by preview evidence.
- Enforce max two lines per caption.
- Enforce line wrapping.
- Use lower safe-area subtitle-style placement unless an owner explicitly approves another placement.
- Enforce at least 8% left/right safe margins.
- Enforce at least 6% bottom safe margin.
- Avoid covering the subject's face and torso where possible.
- Prevent crop at frame edges.
- Use readable white text with dark outline/shadow.
- Keep caption style consistent across the sample.
- Preserve the corrected #426 controlled-test caption copy.
- Do not include the old awkward #419 caption text.
- Keep `transcriptAccuracyClaim: false`.

## Required Outcome

Produce a new guarded corrected-caption preview only after approved execution confirmation. Then record a new visual review outcome before private E2E revalidation, internal beta, production, external beta, or final delivery can proceed.

## Blocked Actions

Do not unlock internal beta, external beta, production, final delivery, public artifacts, signed URLs, Supabase mutation, SQL, provider/model calls, worker execution, route execution, or broad runtime readiness from this planning prompt alone.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
