# TRACKA-CAPTION-QUALITY-4 Layout Failure Report

## Decision

overallDecision: `fail_caption_layout_quality`

captionVisualBurnInPassed: false

captionLayoutQualityPassed: false

internalBetaReady: false

## Failure Details

- The corrected caption copy appears in the reviewed preview.
- The old awkward #419 caption text is not present.
- The caption is far too large for the 2160x3840 portrait frame.
- The caption is cropped off-screen at the left/top edges in sampled frames.
- The caption covers the subject's face/body and obstructs the visual.
- Placement does not follow normal subtitle/burn-in safe-area behavior.
- Safe margins are not respected.
- The technical render exists, but the visual layout and polish fail internal beta expectations.

## Required Fix Areas

- Reduce font size and scale it proportionally to frame height.
- Enforce line wrapping with max two caption lines.
- Enforce left/right safe margins of at least 8% frame width.
- Enforce bottom safe margin of at least 6% frame height.
- Prefer lower safe-area subtitle placement unless a later owner explicitly approves another layout.
- Avoid covering subject face and torso where possible.
- Use readable white text with dark outline/shadow.
- Keep caption style consistent across the reviewed sample.
- Preserve the corrected #426 controlled-test caption copy.
- Keep `transcriptAccuracyClaim: false`.

## Blocked Scope

TRACKA-PRIVATE-E2E-REVALIDATION-1 remains `blocked_pending_caption_layout_fix`.

Internal beta remains `blocked_pending_caption_layout_fix`.

Production, external beta, broad media, and final delivery remain `blocked`.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
