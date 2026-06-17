# TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 Runtime Path Resolution

Status: `blocked_ffmpeg_missing_ass_subtitles_filter`

Patch type: Track A approved caption burn-in runtime path resolution packet.

Branch: `codex/rp-tracka-caption-quality-3r2-runtime-path-1`

Base: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration at 1a52c5a604b175bbd95c8e96294d963636ee8db0`

Run ID: `tracka-caption-runtime-path-1r-20260617T194200`

## Purpose

This packet resolves the #459 blocker `blocked_missing_approved_caption_burnin_runtime_path` by checking whether the current local environment has a metadata-approved FFmpeg/FFprobe/libass runtime path for future corrected-caption burn-in revalidation.

This packet does not burn captions, render previews, inspect media inputs, create media outputs, access GCS, create signed URLs, create public artifacts, mutate Supabase, run SQL, commit binaries, mutate package-lock, or unlock beta/production/final delivery.

## Source-Of-Truth Audit

| PR | Status | Evidence |
| --- | --- | --- |
| #443 | merged at `e268a9e8afd5360df91653e9d2c060c05e270e43` | guarded corrected-caption burn-in execution packet |
| #447 | merged at `ce4b2feac22247581ba361e71df33feb1e667507` | created corrected ASS sidecar and failed closed before source ref |
| #452 | merged at `422bbcade670646963257f5b7b2ddc6681748f0b` | approved exact private Phase 32 source ref |
| #459 | merged at `1a52c5a604b175bbd95c8e96294d963636ee8db0` | wired approved #452 source ref into guarded 3R2 and records `blocked_missing_approved_caption_burnin_runtime_path` |

## Approved Inputs

approvedSourceRef: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

sourceRefApproved: true

captionSourceType: `controlled_test_caption_copy`

transcriptAccuracyClaim: false

Corrected #426 caption copy:

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

oldAwkwardCaptionRejected: true

rejectedOldCaptionText: `Hey guys, I saw how you guys doing today is going to do going to be the first`

## Runtime Path Result

| field | value |
| --- | --- |
| execution | `blocked_ffmpeg_missing_ass_subtitles_filter` |
| runtimePathStatus | `blocked_ffmpeg_missing_ass_subtitles_filter` |
| approvedRuntimePath | `none` |
| metadataCheck | `blocked` |
| blocker | `blocked_ffmpeg_missing_ass_subtitles_filter` |
| runtimePathConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true` |
| provisioningConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PROVISIONING=true` |
| provisioningStatus | `completed_host_runtime_provisioning` |
| provisioningAttempted | `true` |
| provisioningPackageManager | `homebrew` |
| provisioningFailureSummary | `none` |
| ffmpegPath | `/opt/homebrew/bin/ffmpeg` |
| ffprobePath | `/opt/homebrew/bin/ffprobe` |
| ffmpegVersion | `ffmpeg version 8.1.1 Copyright (c) 2000-2026 the FFmpeg developers` |
| ffprobeVersion | `ffprobe version 8.1.1 Copyright (c) 2007-2026 the FFmpeg developers` |
| assFilterPresent | `false` |
| subtitlesFilterPresent | `false` |
| libassIndicated | `false` |
| mediaInputUsed | `false` |
| mediaOutputCreated | `false` |
| gcsAccess | `false` |
| signedUrlsCreated | `false` |
| publicArtifactsCreated | `false` |
| packageLockChanged | `false` |
| internalBetaReady | `false` |
| productionReady | `false` |
| externalBetaReady | `false` |
| finalDeliveryReady | `false` |

## Decision

TRACKA-CAPTION-QUALITY-3R3 readiness: `blocked_ffmpeg_missing_ass_subtitles_filter`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level FFmpeg/FFprobe provisioning were allowed; no media input or output was used.
