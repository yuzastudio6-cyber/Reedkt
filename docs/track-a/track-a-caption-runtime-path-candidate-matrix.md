# Track A Caption Runtime Path Candidate Matrix

Status: `approved_repo_owned_ffmpeg_libass_metadata_only`

| candidateId | classification | metadata/provisioning result | decision | notes |
| --- | --- | --- | --- | --- |
| `local_ffmpeg_libass_runtime_path` | preferred minimal local runtime path | ffmpeg=`docker://docker/prod/render-worker/Dockerfile#ffmpeg`; ffprobe=`docker://docker/prod/render-worker/Dockerfile#ffprobe`; ass=`true`; subtitles=`true`; libass=`true` | `approved_repo_owned_ffmpeg_libass_metadata_only` | approval is metadata-only; no media input or output was used |
| `host_homebrew_ffmpeg_runtime_path` | explicitly confirmed host provisioning path | provisioningStatus=`not_needed`; packageManager=`none`; failure=`none` | `not_needed` | no repo dependency or package-lock change |
| `homebrew_core_ffmpeg_libass_repair_path` | explicitly confirmed Homebrew core libass repair path | libassRepairStatus=`not_needed`; packageManager=`none`; failure=`none` | `not_needed` | no third-party taps, random binaries, source compilation, repo dependency, or package-lock change |
| `repo_owned_tracka_libass_runtime_path` | approved repo-owned local Docker metadata path | dockerfile=`docker/prod/render-worker/Dockerfile`; imageTag=`reeditpro-tracka-caption-runtime-path-check:local`; daemon=`docker_daemon_ready`; status=`approved_repo_owned_ffmpeg_libass_metadata_only`; build=`passed` | `approved_metadata_only` | uses `docker/prod/render-worker/Dockerfile`; local metadata-only Docker build/run; no media mounts, no image push, no deploy |
| `repo_owned_tool_readiness_metadata_path` | supporting repo-owned metadata path only | dockerfile=`docker/prod/tool-readiness-worker/Dockerfile` | `supporting_metadata_only_not_burnin_approval` | `docker/prod/tool-readiness-worker/Dockerfile` cannot approve corrected-caption burn-in by itself |
| `existing_tracka_caption_burnin_activation_module` | guarded activation packet | existing #459 module remains source-of-truth | `available_for_future_guarded_execution_only` | must stay behind `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` |
| `remotion_preview_runtime_path` | optional preview path | package metadata only | `not_required_for_runtime_path_approval` | no Remotion render was run |
| `docker_cloudrun_runtime_path` | deployment/runtime path | not used | `blocked_no_push_no_deploy` | Cloud Run build/push/deploy remains out of scope; the local render-worker Docker metadata image is separate |
| `missing_runtime_path` | fallback blocker | `approved_repo_owned_ffmpeg_libass_metadata_only` | `none` | used when local FFmpeg/FFprobe/filter support is not metadata-approved |

## Approved Inputs For Future Execution

- source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- caption copy: #426 controlled-test caption copy only.
- future execution confirmation: `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local Docker daemon readiness checks and explicitly confirmed repo-owned Docker FFmpeg/ffprobe/libass runtime inspection were allowed; no media input or output was used.
