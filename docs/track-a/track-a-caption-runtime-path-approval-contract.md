# Track A Caption Runtime Path Approval Contract

Status: `blocked_runtime_image_build_failed`

## Contract

| gate | required value | current result |
| --- | --- | --- |
| approvedRuntimePathId | `local_ffmpeg_libass_runtime_path` or `repo_owned_ffmpeg_libass_runtime_path` | `none` |
| required binary | `ffmpeg` | `/opt/homebrew/bin/ffmpeg` |
| required binary | `ffprobe` | `/opt/homebrew/bin/ffprobe` |
| required filters | `ass` or `subtitles` | ass=`false`; subtitles=`false` |
| host provisioning | explicit confirmation only | `not_needed` |
| Homebrew core libass repair | explicit confirmation only | `not_needed` |
| repo-owned render-worker Dockerfile | `docker/prod/render-worker/Dockerfile` | `docker/prod/render-worker/Dockerfile` |
| repo-owned local Docker metadata image | reuse/build explicit confirmation only | status=`blocked_runtime_image_build_failed`; imageTag=`reeditpro-tracka-caption-runtime-path-1r3:local`; build=`blocked_runtime_image_build_failed` |
| supporting tool-readiness Dockerfile | metadata support only, not burn-in approval | `docker/prod/tool-readiness-worker/Dockerfile` |
| allowed input | #452 approved source ref only | `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4` |
| allowed caption | #426 approved controlled-test caption copy only | preserved |
| future execution confirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` | required for 3R3 |
| media processing in this phase | none | passed |
| media output in this phase | none | passed |
| Docker media mounts | none | passed |
| Docker image push/deploy | none | passed |
| signed/public output | none | passed |
| package-lock mutation | none | passed |

## Disallowed

- arbitrary media.
- old caption samples.
- public output.
- signed URL.
- final delivery.
- beta/production unlock.
- non-Track-A source.
- GCS read/copy/download/upload.
- bucket/IAM/object mutation.
- committed binaries.
- npm dependency or package-lock mutation.

## Future Output Contract

The future 3R3 execution may create private review artifacts only if this runtime path is approved and `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` is explicitly supplied.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed repo-owned Docker FFmpeg/ffprobe/libass runtime inspection were allowed; no media input or output was used.
