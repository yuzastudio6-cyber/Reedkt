# TRACKA-CAPTION-QUALITY-3R3 — Burn-In Revalidation Execution With Approved Runtime Path

## Summary

Run only after TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 records an approved runtime path, either `runtimePathStatus: approved_local_ffmpeg_libass_metadata_only` with `approvedRuntimePath: local_ffmpeg_libass_runtime_path` or `runtimePathStatus: approved_repo_owned_ffmpeg_libass_metadata_only` with `approvedRuntimePath: repo_owned_render_worker_ffmpeg_libass_runtime_path`.

## Required Inputs

- #426 approved controlled-test caption copy.
- #452 approved private source ref: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`.
- #459 corrected ASS sidecar evidence and source-ref wiring.
- TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 metadata approval for local host FFmpeg/FFprobe ASS/subtitles support or repo-owned render-worker Docker FFmpeg/FFprobe ASS/subtitles support.
- explicit future execution confirmation: `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`.

## Current Runtime Path Status

runtimePathStatus: `approved_repo_owned_ffmpeg_libass_metadata_only`

approvedRuntimePath: `repo_owned_render_worker_ffmpeg_libass_runtime_path`

provisioningStatus: `not_needed`

libassRepairStatus: `not_needed`

dockerRuntimeStatus: `approved_repo_owned_ffmpeg_libass_metadata_only`

dockerRuntimeDockerfile: `docker/prod/render-worker/Dockerfile`

dockerDaemonStatus: `docker_daemon_ready`

## Blocked Unless

- runtime path is metadata-approved.
- source ref remains the exact #452 private object.
- captions remain the exact #426 corrected controlled-test copy.
- old #419 awkward caption text is rejected.
- output remains private review artifact only.

## Still Blocked

- public artifacts.
- signed URLs.
- internal beta.
- external beta.
- production.
- final delivery.
- arbitrary user media.
- broad media.
- Supabase mutation.
- SQL.
- provider/model calls.
- worker/route execution outside the guarded packet.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local Docker daemon readiness checks and explicitly confirmed repo-owned Docker FFmpeg/ffprobe/libass runtime inspection were allowed; no media input or output was used.
