# Track A Caption Runtime Path Candidate Matrix

Status: `blocked_missing_local_ffmpeg_libass_runtime`

| candidateId | classification | metadata result | decision | notes |
| --- | --- | --- | --- | --- |
| `local_ffmpeg_libass_runtime_path` | preferred minimal local runtime path | ffmpeg=`not_found`; ffprobe=`not_found`; ass=`false`; subtitles=`false`; libass=`false` | `blocked_missing_local_ffmpeg_libass_runtime` | approval is metadata-only; no media input or output was used |
| `existing_tracka_caption_burnin_activation_module` | guarded activation packet | existing #459 module remains source-of-truth | `available_for_future_guarded_execution_only` | must stay behind `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` |
| `remotion_preview_runtime_path` | optional preview path | package metadata only | `not_required_for_runtime_path_approval` | no Remotion render was run |
| `docker_cloudrun_runtime_path` | deployment/runtime path | not inspected beyond docs | `blocked_no_build_no_deploy` | Docker/Cloud Run build/deploy remains out of scope |
| `missing_runtime_path` | fallback blocker | `blocked_missing_local_ffmpeg_libass_runtime` | `blocked_missing_local_ffmpeg_libass_runtime` | used when local FFmpeg/FFprobe/filter support is not metadata-approved |

## Approved Inputs For Future Execution

- source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- caption copy: #426 controlled-test caption copy only.
- future execution confirmation: `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks were allowed when REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true; no media input or output was used.
