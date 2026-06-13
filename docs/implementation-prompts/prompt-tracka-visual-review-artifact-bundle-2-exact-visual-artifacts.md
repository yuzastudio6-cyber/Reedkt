# TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-2 Exact Visual Artifacts Or Representative Frame Bundle

## Goal

Collect exact review-safe visual artifacts for Track A visual review after TRACKA-VISUAL-REVIEW-2B recorded `metadata_only` and `blocked_missing_visual_artifacts`.

## Required Inputs

- #393 visual review rubric and pass/fail schema
- #403 metadata bundle checksums
- TRACKA-VISUAL-REVIEW-2B metadata-only outcome
- representative frames/videos/contact sheets uploaded directly, or exact private object refs for review-safe visual artifacts

## Allowed Scope

- classify uploaded visual artifacts
- verify filenames/checksums when supplied
- prepare upload-to-review instructions
- record missing capability coverage

## Blocked Scope

- no broad GCS access
- no signed URL source-of-truth
- no public artifacts
- no Track A runtime execution
- no FFmpeg/FFprobe, Remotion, libass, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, or FILM execution
- no frame extraction or contact sheet generation
- no Supabase mutation or SQL
- no beta, production, final delivery, or broad media unlock

## Completion Criteria

Return a bundle or upload manifest that lets a later visual outcome phase inspect actual visual evidence. JSON metadata alone is not enough.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
