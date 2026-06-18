# TRACKA-CAPTION-QUALITY-4 Next Phase Plan

## Current Status

inputClassification: `corrected_caption_preview_available`

overallDecision: `fail_caption_layout_quality`

captionTextQualityPassed: true

captionVisualBurnInPassed: false

captionLayoutQualityPassed: false

## Next Phase

Next prompt: `TRACKA-CAPTION-QUALITY-5 - Caption style/layout fix and revalidation packet`

TRACKA-CAPTION-QUALITY-5 readiness: `ready_for_caption_layout_fix_and_revalidation`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_layout_fix`

INTERNAL-BETA readiness: `blocked_pending_caption_layout_fix`

## Required TRACKA-CAPTION-QUALITY-5 Constraints

- font size proportional to frame height, starting around 4% to 6% of frame height.
- max two lines per caption.
- enforced line wrapping.
- lower safe-area subtitle-style placement unless intentionally overridden.
- at least 8% left/right safe margins.
- at least 6% bottom safe margin.
- no subject-face obstruction.
- no crop at frame edges.
- high-contrast readable white text with dark outline/shadow.
- consistent caption style across the sample.
- no old #419 caption text.
- no transcript accuracy claim.

## Still Blocked

Internal beta, external beta, production, final delivery, broad media, private E2E revalidation, and full Track A closure remain blocked until caption layout is fixed and a new corrected-caption preview is reviewed.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
