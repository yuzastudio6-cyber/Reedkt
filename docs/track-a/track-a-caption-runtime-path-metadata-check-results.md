# Track A Caption Runtime Path Metadata Check Results

Status: `blocked`

Run ID: `tracka-caption-runtime-path-1r2-20260617T201136`

Runtime path check confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true`

Runtime provisioning confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PROVISIONING=true`

FFmpeg libass repair confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_FFMPEG_LIBASS_REPAIR=true`

confirmationProvided: true

provisioningConfirmationProvided: true

libassRepairConfirmationProvided: true

metadataCheckExecuted: true

provisioningStatus: `not_needed`

provisioningFailureSummary: `none`

libassRepairStatus: `completed_homebrew_ffmpeg_libass_repair`

libassRepairFailureSummary: `none`

## Command Results

| check | command | status | exitCode | detail |
| --- | --- | --- | --- | --- |
| `command_v_ffmpeg` | `command -v ffmpeg || true` | `passed` | `0` | `/opt/homebrew/bin/ffmpeg` |
| `command_v_ffprobe` | `command -v ffprobe || true` | `passed` | `0` | `/opt/homebrew/bin/ffprobe` |
| `which_ffmpeg` | `which ffmpeg || true` | `passed` | `0` | `/opt/homebrew/bin/ffmpeg` |
| `which_ffprobe` | `which ffprobe || true` | `passed` | `0` | `/opt/homebrew/bin/ffprobe` |
| `standard_path_search` | `ls -l /opt/homebrew/bin/ffmpeg /opt/homebrew/bin/ffprobe /usr/local/bin/ffmpeg /usr/local/bin/ffprobe /usr/bin/ffmpeg /usr/bin/ffprobe 2>/dev/null || true` | `passed` | `0` | `lrwxr-xr-x@ 1 macuser admin 33 Jun 17 15:48 /opt/homebrew/bin/ffmpeg -> ../Cellar/ffmpeg/8.1.1/bin/ffmpeg lrwxr-xr-x@ 1 macuser admin 34 Jun 17 15:48 /opt/homebrew/bin/ffprobe -> .` |
| `uname` | `uname -a` | `passed` | `0` | `Darwin Mac-mini.local 25.5.0 Darwin Kernel Version 25.5.0: Mon Apr 27 20:41:26 PDT 2026; root:xnu-12377.121.6~2/RELEASE_ARM64_T8132 arm64` |
| `brew_version` | `HOMEBREW_NO_AUTO_UPDATE=1 brew --version` | `passed` | `0` | `Homebrew 6.0.2` |
| `brew_info_ffmpeg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew info ffmpeg || true` | `passed` | `0` | `==> ffmpeg: stable 8.1.1 (bottled), HEAD Play, record, convert, and stream select audio and video codecs https://ffmpeg.org/ Aliases: ffmpeg@8 Installed (on request) From: https://` |
| `brew_info_libass` | `HOMEBREW_NO_AUTO_UPDATE=1 brew info libass || true` | `passed` | `0` | `==> libass: stable 0.17.4 (bottled), HEAD Subtitle renderer for the ASS/SSA subtitle format https://github.com/libass/libass Not installed From: https://github.com/Homebrew/homebre` |
| `brew_list_versions_ffmpeg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions ffmpeg || true` | `passed` | `0` | `ffmpeg 8.1.1` |
| `brew_list_versions_libass` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions libass || true` | `passed` | `0` | `none` |
| `brew_deps_installed_ffmpeg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew deps --installed ffmpeg || true` | `passed` | `0` | `ca-certificates dav1d lame libvmaf libvpx openssl@3 opus sdl2 svt-av1 x264 x265` |
| `initial_ffmpeg_version` | `/opt/homebrew/bin/ffmpeg -hide_banner -version` | `passed` | `0` | `ffmpeg version 8.1.1 Copyright (c) 2000-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/` |
| `initial_ffmpeg_buildconf` | `/opt/homebrew/bin/ffmpeg -hide_banner -buildconf` | `passed` | `0` | `configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/8.1.1 --enable-shared --enable-pthreads --enable-version3 --cc=clang --host-cflags= --host-ldflags= --enable-ffplay --enable-gpl` |
| `initial_ffprobe_version` | `/opt/homebrew/bin/ffprobe -hide_banner -version` | `passed` | `0` | `ffprobe version 8.1.1 Copyright (c) 2007-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg` |
| `initial_ffmpeg_filters` | `/opt/homebrew/bin/ffmpeg -hide_banner -filters` | `passed` | `0` | `Filters: T.. = Timeline support .S. = Slice threading A = Audio input/output V = Video input/output N = Dynamic number and/or type of input/output | = Source or sink filter ------ ` |
| `repair_uname` | `uname -a` | `passed` | `0` | `Darwin Mac-mini.local 25.5.0 Darwin Kernel Version 25.5.0: Mon Apr 27 20:41:26 PDT 2026; root:xnu-12377.121.6~2/RELEASE_ARM64_T8132 arm64` |
| `repair_brew_version` | `HOMEBREW_NO_AUTO_UPDATE=1 brew --version` | `passed` | `0` | `Homebrew 6.0.2` |
| `repair_brew_info_ffmpeg_before` | `HOMEBREW_NO_AUTO_UPDATE=1 brew info ffmpeg || true` | `passed` | `0` | `==> ffmpeg: stable 8.1.1 (bottled), HEAD Play, record, convert, and stream select audio and video codecs https://ffmpeg.org/ Aliases: ffmpeg@8 Installed (on request) From: https://` |
| `repair_brew_info_libass_before` | `HOMEBREW_NO_AUTO_UPDATE=1 brew info libass || true` | `passed` | `0` | `==> libass: stable 0.17.4 (bottled), HEAD Subtitle renderer for the ASS/SSA subtitle format https://github.com/libass/libass Not installed From: https://github.com/Homebrew/homebre` |
| `repair_brew_list_versions_ffmpeg_before` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions ffmpeg || true` | `passed` | `0` | `ffmpeg 8.1.1` |
| `repair_brew_list_versions_libass_before` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions libass || true` | `passed` | `0` | `none` |
| `repair_brew_install_libass` | `HOMEBREW_NO_AUTO_UPDATE=1 brew install libass` | `passed` | `0` | `==> Would install 1 formula: libass ==> Downloading https://ghcr.io/v2/homebrew/core/libass/manifests/0.17.4_1 ==> Would install 21 dependencies for libass: libpng freetype fribidi` |
| `repair_brew_reinstall_ffmpeg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew reinstall ffmpeg` | `passed` | `0` | `==> Would reinstall 1 formula: ffmpeg ==> Downloading https://ghcr.io/v2/homebrew/core/ffmpeg/manifests/8.1.1-1 Already downloaded: /Users/macuser/Library/Caches/Homebrew/downloads` |
| `repair_refresh_shell_hash` | `hash -r || true` | `passed` | `0` | `none` |
| `repair_brew_list_versions_ffmpeg_after` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions ffmpeg || true` | `passed` | `0` | `ffmpeg 8.1.1` |
| `repair_brew_list_versions_libass_after` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions libass || true` | `passed` | `0` | `libass 0.17.4_1` |
| `command_v_ffmpeg` | `command -v ffmpeg || true` | `passed` | `0` | `/opt/homebrew/bin/ffmpeg` |
| `command_v_ffprobe` | `command -v ffprobe || true` | `passed` | `0` | `/opt/homebrew/bin/ffprobe` |
| `which_ffmpeg` | `which ffmpeg || true` | `passed` | `0` | `/opt/homebrew/bin/ffmpeg` |
| `which_ffprobe` | `which ffprobe || true` | `passed` | `0` | `/opt/homebrew/bin/ffprobe` |
| `standard_path_search` | `ls -l /opt/homebrew/bin/ffmpeg /opt/homebrew/bin/ffprobe /usr/local/bin/ffmpeg /usr/local/bin/ffprobe /usr/bin/ffmpeg /usr/bin/ffprobe 2>/dev/null || true` | `passed` | `0` | `lrwxr-xr-x@ 1 macuser admin 33 Jun 17 16:12 /opt/homebrew/bin/ffmpeg -> ../Cellar/ffmpeg/8.1.1/bin/ffmpeg lrwxr-xr-x@ 1 macuser admin 34 Jun 17 16:12 /opt/homebrew/bin/ffprobe -> .` |
| `uname` | `uname -a` | `passed` | `0` | `Darwin Mac-mini.local 25.5.0 Darwin Kernel Version 25.5.0: Mon Apr 27 20:41:26 PDT 2026; root:xnu-12377.121.6~2/RELEASE_ARM64_T8132 arm64` |
| `brew_version` | `HOMEBREW_NO_AUTO_UPDATE=1 brew --version` | `passed` | `0` | `Homebrew 6.0.2` |
| `brew_info_ffmpeg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew info ffmpeg || true` | `passed` | `0` | `==> ffmpeg: stable 8.1.1 (bottled), HEAD Play, record, convert, and stream select audio and video codecs https://ffmpeg.org/ Aliases: ffmpeg@8 Installed (on request) From: https://` |
| `brew_info_libass` | `HOMEBREW_NO_AUTO_UPDATE=1 brew info libass || true` | `passed` | `0` | `==> libass: stable 0.17.4 (bottled), HEAD Subtitle renderer for the ASS/SSA subtitle format https://github.com/libass/libass Installed (on request) From: https://github.com/Homebre` |
| `brew_list_versions_ffmpeg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions ffmpeg || true` | `passed` | `0` | `ffmpeg 8.1.1` |
| `brew_list_versions_libass` | `HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions libass || true` | `passed` | `0` | `libass 0.17.4_1` |
| `brew_deps_installed_ffmpeg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew deps --installed ffmpeg || true` | `passed` | `0` | `ca-certificates dav1d lame libvmaf libvpx openssl@3 opus sdl2 svt-av1 x264 x265` |
| `post_repair_ffmpeg_version` | `/opt/homebrew/bin/ffmpeg -hide_banner -version` | `passed` | `0` | `ffmpeg version 8.1.1 Copyright (c) 2000-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/` |
| `post_repair_ffmpeg_buildconf` | `/opt/homebrew/bin/ffmpeg -hide_banner -buildconf` | `passed` | `0` | `configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/8.1.1 --enable-shared --enable-pthreads --enable-version3 --cc=clang --host-cflags= --host-ldflags= --enable-ffplay --enable-gpl` |
| `post_repair_ffprobe_version` | `/opt/homebrew/bin/ffprobe -hide_banner -version` | `passed` | `0` | `ffprobe version 8.1.1 Copyright (c) 2007-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg` |
| `post_repair_ffmpeg_filters` | `/opt/homebrew/bin/ffmpeg -hide_banner -filters` | `passed` | `0` | `Filters: T.. = Timeline support .S. = Slice threading A = Audio input/output V = Video input/output N = Dynamic number and/or type of input/output | = Source or sink filter ------ ` |

## Parsed Metadata

| field | value |
| --- | --- |
| execution | `blocked_homebrew_ffmpeg_lacks_libass_filter_support` |
| runtimePathStatus | `blocked_homebrew_ffmpeg_lacks_libass_filter_support` |
| approvedRuntimePath | `none` |
| metadataCheck | `blocked` |
| blocker | `blocked_homebrew_ffmpeg_lacks_libass_filter_support` |
| runtimePathConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true` |
| provisioningConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PROVISIONING=true` |
| provisioningStatus | `not_needed` |
| provisioningAttempted | `false` |
| provisioningPackageManager | `none` |
| provisioningFailureSummary | `none` |
| libassRepairConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_FFMPEG_LIBASS_REPAIR=true` |
| libassRepairStatus | `completed_homebrew_ffmpeg_libass_repair` |
| libassRepairAttempted | `true` |
| libassRepairPackageManager | `homebrew` |
| libassRepairFailureSummary | `none` |
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

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level Homebrew FFmpeg/FFprobe/libass provisioning were allowed; no media input or output was used.
