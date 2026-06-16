# TRACKA-CAPTION-QUALITY-2 Future FFmpeg And FFprobe Validation Planning

Status: `future_only_blocked`

## Purpose

Plan future metadata and review-file validation for corrected-caption burn-in samples. This packet does not run FFmpeg, FFprobe, libass, Remotion, media processing, storage transfer, or render/export.

## Future Validation Inputs

- approved corrected caption source
- future burn-in preview manifest
- future Remotion preview manifest, if applicable
- private artifact refs and checksums from a future approved execution packet
- QA report template with source caption id and no transcript accuracy claim

## Future Validation Gates

| Gate | Future Check |
| --- | --- |
| file metadata | confirm file duration, stream metadata, and expected review-safe container only after approved execution |
| decode sanity | confirm no black-frame/corrupt export only after approved execution |
| caption presence | confirm corrected captions are visually present through human or approved QA review |
| caption text | confirm old awkward text is absent |
| provenance | bind validation to checksums and private manifests |
| privacy | no public artifact, no signed URL source-of-truth, no broad storage transfer |

## Current Status

FFmpeg/FFprobe validation planning is recorded. FFmpeg/FFprobe execution is not enabled, approved, completed, or ready in this phase.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
