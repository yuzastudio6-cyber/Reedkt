# Activation Phase TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 Results

Branch: `codex/rp-tracka-caption-quality-3r2-runtime-path-1`

PR title: `[track-a] Caption burn-in runtime path resolution`

Base: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration at 1a52c5a604b175bbd95c8e96294d963636ee8db0`

Patch type: Track A caption burn-in runtime path resolution.

Run ID: `tracka-caption-runtime-path-1r-20260617T194200`

Execution: `blocked_ffmpeg_missing_ass_subtitles_filter`

Runtime path status: `blocked_ffmpeg_missing_ass_subtitles_filter`

Approved runtime path: `none`

Provisioning: `completed_host_runtime_provisioning`

## Source-Of-Truth Audit

| PR | Status | Evidence |
| --- | --- | --- |
| #443 | merged at `e268a9e8afd5360df91653e9d2c060c05e270e43` | guarded corrected-caption burn-in execution packet |
| #447 | merged at `ce4b2feac22247581ba361e71df33feb1e667507` | created corrected ASS sidecar and failed closed before source ref |
| #452 | merged at `422bbcade670646963257f5b7b2ddc6681748f0b` | approved exact private Phase 32 source ref |
| #459 | merged at `1a52c5a604b175bbd95c8e96294d963636ee8db0` | wired approved #452 source ref into guarded 3R2 and records `blocked_missing_approved_caption_burnin_runtime_path` |

## Candidate Runtime Path Matrix

- local_ffmpeg_libass_runtime_path: `blocked_ffmpeg_missing_ass_subtitles_filter`
- host_homebrew_ffmpeg_runtime_path: `completed_host_runtime_provisioning`
- existing_tracka_caption_burnin_activation_module: `available_for_future_guarded_execution_only`
- remotion_preview_runtime_path: `optional_not_required`
- docker_cloudrun_runtime_path: `blocked_no_build_no_deploy`
- missing_runtime_path: `blocked_ffmpeg_missing_ass_subtitles_filter`

## Metadata Check

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

## Approval Contract

Allowed source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

Allowed caption: #426 controlled-test caption copy only.

Future execution confirmation: `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`

## QA Gate Map

- old text absent: passed.
- corrected text present: passed.
- readable preview: not applicable; no preview created.
- ffprobe validation: metadata path only; no media probed.
- private artifact manifest: not created in this phase.
- no public artifact: passed.
- no signed URL: passed.
- package-lock unchanged: passed.

## Supabase Update Classification

- Supabase update required: docs/status only
- Supabase update status: docs_only
- Supabase environment touched: none
- SQL executed: none
- Migration deployed: no
- Evidence docs: TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 docs packet
- Blockers: `blocked_ffmpeg_missing_ass_subtitles_filter`
- Next Supabase action: none

## Cross-Chat Impact

- Workstream updated: TRACK_A_RENDER_EXPORT
- Other workstreams affected: TRACK_B_MEDIA_PROCESSING, SOUND_MUSIC_AUDIO, WORKER_RUNTIME_JOBS, TOOL_ROUTE_COORDINATION, AI_TOOLS_CREATIVE_GRAPHICS, PROVIDER_GATEWAY_MODELS, SUPABASE_RLS_STORAGE_DATABASE, OBSERVABILITY_AUDIT_COST, COMPLIANCE_SECURITY, FRONTEND_PRODUCT_UX
- Contracts changed: caption burn-in runtime path approval contract only
- Handoff needed: run TRACKA-CAPTION-QUALITY-3R3 only if runtime path is approved
- Duplicate risk: low
- Next owner/prompt: TRACKA-CAPTION-QUALITY-3R3 — Burn-in revalidation execution with approved runtime path

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level FFmpeg/FFprobe provisioning were allowed; no media input or output was used.
