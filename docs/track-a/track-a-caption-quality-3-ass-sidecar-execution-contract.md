# TRACKA-CAPTION-QUALITY-3 ASS Sidecar Execution Contract

Status: `contract_only_execution_blocked`

## Contract

ASS sidecar creation is allowed only in a future guarded execution phase with `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`. This packet does not create an ASS sidecar.

## Required Inputs

- approved caption input manifest from TRACKA-CAPTION-QUALITY-3.
- exact corrected #426 caption lines.
- timing placeholders or separately approved controlled-test timing source.
- safe margin and readability policy from caption timing docs.

## Required Sidecar Rules

- include only the corrected four-line caption text.
- reject old #419 awkward caption text.
- preserve `transcriptAccuracyClaim: false`.
- set readable style, safe margins, and voice-first caption timing placeholders.
- avoid face, mouth, product, map, chart, browser, mask, and evidence collisions.
- produce a private sidecar only.
- record checksum before any future libass or Remotion handoff.
- do not create final media.

## Current Result

assSidecarCreated: false

execution: blocked_pending_caption_burnin_execution_confirmation

TRACKA-CAPTION-QUALITY-3R readiness: ready_for_guarded_execution

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
