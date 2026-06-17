# Track A Caption Runtime Path Metadata Check Results

Status: `blocked`

Run ID: `tracka-caption-runtime-path-1r-20260617T194200`

Runtime path check confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true`

Runtime provisioning confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PROVISIONING=true`

confirmationProvided: true

provisioningConfirmationProvided: true

metadataCheckExecuted: true

provisioningStatus: `completed_host_runtime_provisioning`

provisioningFailureSummary: `none`

## Command Results

| check | command | status | exitCode | detail |
| --- | --- | --- | --- | --- |
| `command_v_ffmpeg` | `command -v ffmpeg || true` | `passed` | `0` | `none` |
| `command_v_ffprobe` | `command -v ffprobe || true` | `passed` | `0` | `none` |
| `which_ffmpeg` | `which ffmpeg || true` | `passed` | `0` | `none` |
| `which_ffprobe` | `which ffprobe || true` | `passed` | `0` | `none` |
| `standard_path_search` | `ls -l /opt/homebrew/bin/ffmpeg /opt/homebrew/bin/ffprobe /usr/local/bin/ffmpeg /usr/local/bin/ffprobe /usr/bin/ffmpeg /usr/bin/ffprobe 2>/dev/null || true` | `passed` | `0` | `none` |
| `uname` | `uname -a` | `passed` | `0` | `Darwin Mac-mini.local 25.5.0 Darwin Kernel Version 25.5.0: Mon Apr 27 20:41:26 PDT 2026; root:xnu-12377.121.6~2/RELEASE_ARM64_T8132 arm64` |
| `brew_version` | `brew --version` | `passed` | `0` | `Homebrew 5.1.15` |
| `brew_list_ffmpeg` | `brew list ffmpeg || true` | `passed` | `0` | `Error: No such keg: /opt/homebrew/Cellar/ffmpeg` |
| `brew_install_ffmpeg` | `brew install ffmpeg` | `passed` | `0` | `==> Would install 1 formula: ffmpeg ==> Downloading https://ghcr.io/v2/homebrew/core/ffmpeg/manifests/8.1.1-1 ==> Would install 9 dependencies for ffmpeg: dav1d lame libvmaf libvpx` |
| `ffmpeg_version` | `ffmpeg -hide_banner -version` | `passed` | `0` | `ffmpeg version 8.1.1 Copyright (c) 2000-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/` |
| `ffprobe_version` | `ffprobe -hide_banner -version` | `passed` | `0` | `ffprobe version 8.1.1 Copyright (c) 2007-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg` |
| `ffmpeg_filters` | `ffmpeg -hide_banner -filters` | `passed` | `0` | `Filters: T.. = Timeline support .S. = Slice threading A = Audio input/output V = Video input/output N = Dynamic number and/or type of input/output | = Source or sink filter ------ ` |

## Parsed Metadata

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
- packageLockChanged: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level FFmpeg/FFprobe provisioning were allowed; no media input or output was used.
