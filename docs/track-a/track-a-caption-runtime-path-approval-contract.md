# Track A Caption Runtime Path Approval Contract

Status: `blocked_missing_local_ffmpeg_libass_runtime`

## Contract

| gate | required value | current result |
| --- | --- | --- |
| approvedRuntimePathId | `local_ffmpeg_libass_runtime_path` | `none` |
| required binary | `ffmpeg` | `not_found` |
| required binary | `ffprobe` | `not_found` |
| required filters | `ass` or `subtitles` | ass=`false`; subtitles=`false` |
| allowed input | #452 approved source ref only | `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4` |
| allowed caption | #426 approved controlled-test caption copy only | preserved |
| future execution confirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` | required for 3R3 |
| media processing in this phase | none | passed |
| media output in this phase | none | passed |
| signed/public output | none | passed |

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

## Future Output Contract

The future 3R3 execution may create private review artifacts only if this runtime path is approved and `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` is explicitly supplied.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks were allowed when REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true; no media input or output was used.
