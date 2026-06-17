# TRACKA-CAPTION-QUALITY-3 Remotion Preview Execution Contract

Status: `contract_only_execution_blocked`

## Contract

Future Remotion preview execution requires `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`, the approved caption source, private sample inputs, and a bounded private preview destination. This packet does not run Remotion.

## Required Inputs

- `captionSourceType: controlled_test_caption_copy`.
- exact corrected #426 caption lines.
- future ASS sidecar or caption manifest checksum.
- private controlled-test input refs.
- future Remotion preview command plan.

## Future Preview QA

- layout is readable and professional.
- captions avoid collisions with face, mouth, products, maps, charts, masks, browser labels, and evidence.
- old awkward caption text is absent.
- style is consistent with Track A controlled-test review.
- no render corruption, black frames, clipping, or unreadable caption motion.
- preview is private review evidence only.

## Current Result

remotionPreviewExecuted: false

execution: blocked_pending_caption_burnin_execution_confirmation

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
