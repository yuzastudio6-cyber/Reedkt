# Track A Caption Runtime Path Candidate Matrix

Status: `blocked_homebrew_ffmpeg_lacks_libass_filter_support`

| candidateId | classification | metadata/provisioning result | decision | notes |
| --- | --- | --- | --- | --- |
| `local_ffmpeg_libass_runtime_path` | preferred minimal local runtime path | ffmpeg=`/opt/homebrew/bin/ffmpeg`; ffprobe=`/opt/homebrew/bin/ffprobe`; ass=`false`; subtitles=`false`; libass=`false` | `blocked_homebrew_ffmpeg_lacks_libass_filter_support` | approval is metadata-only; no media input or output was used |
| `host_homebrew_ffmpeg_runtime_path` | explicitly confirmed host provisioning path | provisioningStatus=`not_needed`; packageManager=`none`; failure=`none` | `not_needed` | no repo dependency or package-lock change |
| `homebrew_core_ffmpeg_libass_repair_path` | explicitly confirmed Homebrew core libass repair path | libassRepairStatus=`completed_homebrew_ffmpeg_libass_repair`; packageManager=`homebrew`; failure=`none` | `completed_homebrew_ffmpeg_libass_repair` | no third-party taps, random binaries, source compilation, repo dependency, or package-lock change |
| `existing_tracka_caption_burnin_activation_module` | guarded activation packet | existing #459 module remains source-of-truth | `available_for_future_guarded_execution_only` | must stay behind `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` |
| `remotion_preview_runtime_path` | optional preview path | package metadata only | `not_required_for_runtime_path_approval` | no Remotion render was run |
| `docker_cloudrun_runtime_path` | deployment/runtime path | not inspected beyond docs | `blocked_no_build_no_deploy` | Docker/Cloud Run build/deploy remains out of scope |
| `missing_runtime_path` | fallback blocker | `blocked_homebrew_ffmpeg_lacks_libass_filter_support` | `blocked_homebrew_ffmpeg_lacks_libass_filter_support` | used when local FFmpeg/FFprobe/filter support is not metadata-approved |

## Approved Inputs For Future Execution

- source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- caption copy: #426 controlled-test caption copy only.
- future execution confirmation: `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level Homebrew FFmpeg/FFprobe/libass provisioning were allowed; no media input or output was used.
