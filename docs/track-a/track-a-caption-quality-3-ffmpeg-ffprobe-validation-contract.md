# TRACKA-CAPTION-QUALITY-3 FFmpeg And FFprobe Validation Contract

Status: `contract_only_execution_blocked`

## Contract

Future FFmpeg/FFprobe validation requires `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` and private preview artifacts created by a separately approved guarded execution. This packet does not run FFmpeg or FFprobe.

## Future Validation Scope

- validate private preview/export metadata only.
- record codec, container, duration, resolution, and stream metadata where relevant.
- check checksum and provenance fields.
- support caption visibility review but not replace human visual review.
- no public output, final delivery, production claim, or external beta claim.

## Current Result

ffmpegValidationExecuted: false

ffprobeValidationExecuted: false

execution: blocked_pending_caption_burnin_execution_confirmation

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
