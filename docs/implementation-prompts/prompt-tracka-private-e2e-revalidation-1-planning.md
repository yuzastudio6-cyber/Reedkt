# TRACKA-PRIVATE-E2E-REVALIDATION-1 Planning

## Goal

Plan a future private Track A E2E revalidation packet after the caption-quality and missing-evidence chain has produced corrected-caption visual proof and INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 has approved the restricted Track A private E2E planning scope.

## Current Blocker

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `ready`

#419 recorded `pass_with_warnings_sample_level` for uploaded samples and `fullTrackAVisualClosurePassed: false`.

#426 closed controlled-test caption text quality, but caption visual burn-in revalidation remains required.

#429 is merged and provides the missing visual evidence artifact bundle. #434 records `overallDecision: partial_pass_with_warnings`, keeps `fullMissingVisualEvidenceClosurePassed: false`, and keeps `fullTrackAVisualClosurePassed: false`.

#440 and #443 record the corrected-caption burn-in planning and guarded execution packet. #447 failed closed before burn-in because the approved source ref was missing. #452 approves the exact private Phase 32 controlled-test source ref. #459 wires the approved #452 source ref into the guarded burn-in activation and records `blocked_missing_approved_caption_burnin_runtime_path`.

#463 TRACKA-CAPTION-RUNTIME-PATH-1R4 records runtime path status: `approved_repo_owned_ffmpeg_libass_metadata_only` and approved runtime path `repo_owned_render_worker_ffmpeg_libass_runtime_path`. #475 completes the guarded corrected-caption burn-in execution and #484 records `overallDecision: fail_caption_layout_quality`, with caption text quality passed but caption visual layout failed. #488 applies the caption layout fix profile `tracka_caption_layout_fix_v1`. #492 records `overallDecision: accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy`, `caption_layout_policy: user_configurable_default_one_line`, and keeps internal beta blocked pending scope decision and private E2E revalidation.

INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 records `trackARestrictedInternalBetaScopeDecision: approved_for_private_e2e_revalidation_planning`, keeps `trackAInternalBetaUnlocked: false`, and makes private E2E revalidation planning ready for the included restricted scope only.

## Required Precondition

- approved source ref: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`.
- approved runtime path: `repo_owned_render_worker_ffmpeg_libass_runtime_path`.
- layout-fixed corrected-caption private visual proof from #488 plus TRACKA-CAPTION-QUALITY-6 visual outcome.
- one clean private E2E review clip or contact sheet.
- timeline consistency proof.
- final composition polish checklist.
- INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 included/excluded scope matrix.
- caption layout preset policy from #492 and the scope decision packet.

## Included Scope

- `tracka_private_render_export_review_path`
- `corrected_caption_burnin`
- `caption_layout_policy`
- `libass_caption_burnin_runtime`
- `ffmpeg_ffprobe_private_validation`
- `remotion_private_preview_path` only if current-source evidence is sufficient
- `private_artifact_manifest_checksums_qa`

## Excluded Scope

- `birefnet_text_behind_subject_masking`
- `sam2_segmentation_runtime`
- `real_esrgan_enhancement`
- `film_interpolation_runtime`
- `opencolorio_openimageio_production_color_management` for production use
- broad real-user media and arbitrary user media
- final delivery/export
- public artifacts
- signed URLs as source-of-truth
- external beta
- paid production
- production

## Blocked Scope

No Track A runtime execution, FFmpeg/FFprobe media processing, Remotion, libass media processing, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, FILM execution, media processing, GCS upload, signed URL creation, Supabase mutation, SQL, beta, production, final delivery, or broad media unlock is approved by TRACKA-CAPTION-QUALITY-6.

No Track A runtime execution, FFmpeg/FFprobe media processing, Remotion, libass media processing, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, FILM execution, media processing, GCS upload, signed URL creation, Supabase mutation, SQL, beta, production, final delivery, or broad media unlock is approved by INTERNAL-BETA-TRACKA-SCOPE-DECISION-1.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
