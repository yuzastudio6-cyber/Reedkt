# TRACKA-SCOPE-EXPANSION-BIREFNET-REALESRGAN-1

## Goal

Prepare an optional Track A scope-expansion evidence packet if the owner wants to include BiRefNet/text-behind-subject or Real-ESRGAN/enhancement before restricted internal beta.

## Current Decision

INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 excludes these capabilities from first restricted internal beta:

- `birefnet_text_behind_subject_masking`
- `real_esrgan_enhancement`

## Required Evidence To Re-Enter Scope

For BiRefNet/text-behind-subject:

- stronger visual proof for subject-aware masks.
- before/after private review artifacts or contact sheets.
- face/body obstruction safety evidence.
- manifest, checksum, and QA report.
- human/AI visual review outcome.

For Real-ESRGAN/enhancement:

- before/after enhancement proof.
- artifact provenance and checksum evidence.
- detail-preservation and artifact-risk review.
- human/AI visual review outcome.

## Still Excluded Unless This Packet Passes

- SAM2 segmentation/runtime.
- FILM interpolation runtime.
- production color management.
- broad/arbitrary user media.
- public artifacts.
- signed URL source-of-truth.
- final delivery/export.
- external beta.
- paid production.
- production.

## Safety

This prompt must not run BiRefNet, SAM2, Real-ESRGAN, FILM, FFmpeg, Remotion, libass, OpenColorIO, OpenImageIO, provider/model calls, workers, routes, Supabase mutation, SQL, GCS mutation, signed URLs, public artifacts, beta unlock, production unlock, or final delivery.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
