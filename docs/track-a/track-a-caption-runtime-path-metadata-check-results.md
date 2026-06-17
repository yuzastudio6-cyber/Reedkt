# Track A Caption Runtime Path Metadata Check Results

Status: `blocked`

Run ID: `tracka-caption-runtime-path-1-20260617T193055`

Confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true`

confirmationProvided: true

metadataCheckExecuted: true

## Command Results

| check | command | status | exitCode |
| --- | --- | --- | --- |
| `command_v_ffmpeg` | `command -v ffmpeg` | `missing` | `not_run` |
| `command_v_ffprobe` | `command -v ffprobe` | `missing` | `not_run` |
| `ffmpeg_version` | `ffmpeg -hide_banner -version` | `not_run` | `not_run` |
| `ffprobe_version` | `ffprobe -hide_banner -version` | `not_run` | `not_run` |
| `ffmpeg_filters` | `ffmpeg -hide_banner -filters` | `not_run` | `not_run` |

## Parsed Metadata

| field | value |
| --- | --- |
| execution | `blocked_missing_approved_caption_burnin_runtime_path` |
| runtimePathStatus | `blocked_missing_local_ffmpeg_libass_runtime` |
| approvedRuntimePath | `none` |
| metadataCheck | `blocked` |
| blocker | `blocked_missing_local_ffmpeg_libass_runtime` |
| confirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true` |
| ffmpegPath | `not_found` |
| ffprobePath | `not_found` |
| ffmpegVersion | `not_reported` |
| ffprobeVersion | `not_reported` |
| assFilterPresent | `false` |
| subtitlesFilterPresent | `false` |
| libassIndicated | `false` |
| mediaInputUsed | `false` |
| mediaOutputCreated | `false` |
| gcsAccess | `false` |
| signedUrlsCreated | `false` |
| publicArtifactsCreated | `false` |
| internalBetaReady | `false` |
| productionReady | `false` |
| externalBetaReady | `false` |
| finalDeliveryReady | `false` |

## Safety Result

- mediaInputUsed: false
- mediaOutputCreated: false
- frameExtraction: false
- captionBurnInExecuted: false
- libassMediaProcessing: false
- ffmpegMediaProcessing: false
- ffprobeMediaProcessing: false
- remotionRender: false
- gcsAccess: false
- signedUrlsCreated: false
- publicArtifactsCreated: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks were allowed when REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true; no media input or output was used.
