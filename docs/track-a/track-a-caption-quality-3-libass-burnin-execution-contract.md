# TRACKA-CAPTION-QUALITY-3 Libass Burn-In Execution Contract

Status: `contract_only_execution_blocked`

## Contract

Future libass burn-in execution requires `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`, an approved caption manifest, a checksummed private ASS sidecar, approved private sample refs, and owner review. This packet does not run libass.

## Required Inputs

- approved caption input manifest.
- private ASS sidecar with checksum.
- private controlled-test source/sample ref from current-source evidence.
- private output prefix scoped to Track A review artifacts.
- QA gate map from this packet.

## Future Output Contract

- private preview artifact only.
- no public artifact.
- no signed URL.
- no final delivery.
- no production or external beta output.
- no internal beta unlock.
- checksum and provenance required.

## QA Gates

- corrected caption text visible.
- old awkward caption text absent.
- readable size, contrast, and line breaks.
- safe margins and no clipping.
- timing acceptable for controlled sample.
- private artifact policy satisfied.

## Current Result

libassBurninExecuted: false

privateArtifactsCreated: false

execution: blocked_pending_caption_burnin_execution_confirmation

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
