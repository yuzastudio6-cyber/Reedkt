# TRACKA-PRIVATE-E2E-REVALIDATION-1 Planning

## Goal

Plan a future private Track A E2E revalidation packet after the caption-quality and missing-evidence chain has produced corrected-caption visual proof and a first internal-beta scope decision.

## Current Blocker

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

#419 recorded `pass_with_warnings_sample_level` for uploaded samples and `fullTrackAVisualClosurePassed: false`.

#426 closed controlled-test caption text quality, but caption visual burn-in revalidation remains required.

#429 is merged and provides the missing visual evidence artifact bundle. #434 records `overallDecision: partial_pass_with_warnings`, keeps `fullMissingVisualEvidenceClosurePassed: false`, and keeps `fullTrackAVisualClosurePassed: false`.

#440 and #443 record the corrected-caption burn-in planning and guarded execution packet. #447 failed closed before burn-in because the approved source ref was missing. #452 approves the exact private Phase 32 controlled-test source ref. #459 wires the approved #452 source ref into the guarded burn-in activation and records `blocked_missing_approved_caption_burnin_runtime_path`.

#463 TRACKA-CAPTION-RUNTIME-PATH-1R4 records runtime path status: `approved_repo_owned_ffmpeg_libass_metadata_only` and approved runtime path `repo_owned_render_worker_ffmpeg_libass_runtime_path`. #475 completes the guarded corrected-caption burn-in execution and #484 records `overallDecision: fail_caption_layout_quality`, with caption text quality passed but caption visual layout failed. TRACKA-CAPTION-QUALITY-5 applies the caption layout fix profile `tracka_caption_layout_fix_v1` and must produce a layout-fixed private preview before TRACKA-CAPTION-QUALITY-6 can record the visual outcome. Private E2E revalidation remains blocked until TRACKA-CAPTION-QUALITY-6 records acceptable caption layout proof and the internal-beta scope decision is explicit.

## Required Precondition

- approved source ref: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`.
- approved runtime path: `repo_owned_render_worker_ffmpeg_libass_runtime_path`.
- layout-fixed corrected-caption private visual proof from TRACKA-CAPTION-QUALITY-5 plus visual outcome from TRACKA-CAPTION-QUALITY-6.
- one clean private E2E review clip or contact sheet.
- timeline consistency proof.
- final composition polish checklist.
- first internal-beta scope decision for BiRefNet/text-behind-subject and Real-ESRGAN/enhancement.

## Blocked Scope

No Track A runtime execution, FFmpeg/FFprobe media processing, Remotion, libass media processing, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, FILM execution, media processing, GCS upload, signed URL creation, Supabase mutation, SQL, beta, production, final delivery, or broad media unlock.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A caption layout fix revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
