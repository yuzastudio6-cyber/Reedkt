# Track A Caption Runtime Path Metadata Check Results

Status: `completed`

Run ID: `tracka-caption-runtime-path-1r4-20260617T205616`

Runtime path check confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true`

Runtime provisioning confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PROVISIONING=true`

FFmpeg libass repair confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_FFMPEG_LIBASS_REPAIR=true`

Repo-owned Docker runtime image reuse confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_IMAGE_REUSE=true`

Repo-owned Docker runtime image build confirmation required: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_IMAGE_BUILD=true`

Local Docker daemon start confirmation required: `REEDITPRO_CONFIRM_TRACKA_LOCAL_DOCKER_DAEMON_START=true`

confirmationProvided: true

provisioningConfirmationProvided: false

libassRepairConfirmationProvided: false

imageReuseConfirmationProvided: true

imageBuildConfirmationProvided: true

dockerDaemonStartConfirmationProvided: true

metadataCheckExecuted: true

provisioningStatus: `not_needed`

provisioningFailureSummary: `none`

libassRepairStatus: `not_needed`

libassRepairFailureSummary: `none`

dockerRuntimeStatus: `approved_repo_owned_ffmpeg_libass_metadata_only`

dockerRuntimeBlocker: `none`

dockerRuntimeDockerfile: `docker/prod/render-worker/Dockerfile`

dockerRuntimeSupportingDockerfile: `docker/prod/tool-readiness-worker/Dockerfile`

dockerRuntimeImageTag: `reeditpro-tracka-caption-runtime-path-check:local`

dockerRuntimeBuildStatus: `passed`

dockerRuntimeBuildArtifactsStatus: `passed`

dockerDaemonStatus: `docker_daemon_ready`

dockerDaemonReady: true

dockerDaemonStartAttempted: false

dockerDaemonFailureSummary: `none`

## Command Results

| check | command | status | exitCode | detail |
| --- | --- | --- | --- | --- |
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
| `initial_ffmpeg_version` | `/opt/homebrew/bin/ffmpeg -hide_banner -version` | `passed` | `0` | `ffmpeg version 8.1.1 Copyright (c) 2000-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/` |
| `initial_ffmpeg_buildconf` | `/opt/homebrew/bin/ffmpeg -hide_banner -buildconf` | `passed` | `0` | `configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/8.1.1 --enable-shared --enable-pthreads --enable-version3 --cc=clang --host-cflags= --host-ldflags= --enable-ffplay --enable-gpl` |
| `initial_ffprobe_version` | `/opt/homebrew/bin/ffprobe -hide_banner -version` | `passed` | `0` | `ffprobe version 8.1.1 Copyright (c) 2007-2026 the FFmpeg developers built with Apple clang version 21.0.0 (clang-2100.0.123.102) configuration: --prefix=/opt/homebrew/Cellar/ffmpeg` |
| `initial_ffmpeg_filters` | `/opt/homebrew/bin/ffmpeg -hide_banner -filters` | `passed` | `0` | `Filters: T.. = Timeline support .S. = Slice threading A = Audio input/output V = Video input/output N = Dynamic number and/or type of input/output | = Source or sink filter ------ ` |
| `docker_version` | `docker --version` | `passed` | `0` | `Docker version 29.5.2, build 79eb04c` |
| `docker_info_initial` | `docker info --format "{{.ServerVersion}}"` | `passed` | `0` | `29.5.2` |
| `docker_image_inspect_before` | `docker image inspect reeditpro-tracka-caption-runtime-path-check:local >/dev/null 2>&1` | `failed` | `1` | `none` |
| `build_artifact_dist-server` | `npm run build:server` | `passed` | `not_run` | `dist-server already exists` |
| `build_artifact_dist-remotion-worker` | `npm run build:remotion-worker:mock` | `passed` | `not_run` | `dist-remotion-worker already exists` |
| `build_artifact_dist-staging-fixture-worker` | `npm run build:staging-fixture-worker` | `passed` | `not_run` | `dist-staging-fixture-worker already exists` |
| `build_artifact_dist-staging-real-video-export-worker` | `npm run build:staging-real-video-export-worker` | `passed` | `not_run` | `dist-staging-real-video-export-worker already exists` |
| `docker_build_render_worker_metadata_image` | `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-tracka-caption-runtime-path-check:local .` | `passed` | `0` | `#0 building with "desktop-linux" instance using docker driver #1 [internal] load build definition from Dockerfile #1 transferring dockerfile: 1.55kB done #1 DONE 0.0s #2 resolve im` |
| `docker_image_inspect_after` | `docker image inspect reeditpro-tracka-caption-runtime-path-check:local >/dev/null 2>&1` | `passed` | `0` | `none` |
| `docker_ffmpeg_version` | `docker run --rm reeditpro-tracka-caption-runtime-path-check:local ffmpeg -hide_banner -version` | `passed` | `0` | `ffmpeg version 5.1.9-0+deb12u1 Copyright (c) 2000-2026 the FFmpeg developers built with gcc 12 (Debian 12.2.0-14+deb12u1) configuration: --prefix=/usr --extra-version=0+deb12u1 --t` |
| `docker_ffmpeg_buildconf` | `docker run --rm reeditpro-tracka-caption-runtime-path-check:local ffmpeg -hide_banner -buildconf` | `passed` | `0` | `configuration: --prefix=/usr --extra-version=0+deb12u1 --toolchain=hardened --libdir=/usr/lib/aarch64-linux-gnu --incdir=/usr/include/aarch64-linux-gnu --arch=arm64 --enable-gpl --` |
| `docker_ffprobe_version` | `docker run --rm reeditpro-tracka-caption-runtime-path-check:local ffprobe -hide_banner -version` | `passed` | `0` | `ffprobe version 5.1.9-0+deb12u1 Copyright (c) 2007-2026 the FFmpeg developers built with gcc 12 (Debian 12.2.0-14+deb12u1) configuration: --prefix=/usr --extra-version=0+deb12u1 --` |
| `docker_ffmpeg_filters` | `docker run --rm reeditpro-tracka-caption-runtime-path-check:local ffmpeg -hide_banner -filters` | `passed` | `0` | `Filters: T.. = Timeline support .S. = Slice threading ..C = Command support A = Audio input/output V = Video input/output N = Dynamic number and/or type of input/output | = Source ` |

## Parsed Metadata

| field | value |
| --- | --- |
| execution | `completed_runtime_path_metadata_approval` |
| runtimePathStatus | `approved_repo_owned_ffmpeg_libass_metadata_only` |
| approvedRuntimePath | `repo_owned_render_worker_ffmpeg_libass_runtime_path` |
| metadataCheck | `completed` |
| blocker | `none` |
| runtimePathConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true` |
| provisioningConfirmation | `absent_or_not_true` |
| provisioningStatus | `not_needed` |
| provisioningAttempted | `false` |
| provisioningPackageManager | `none` |
| provisioningFailureSummary | `none` |
| libassRepairConfirmation | `absent_or_not_true` |
| libassRepairStatus | `not_needed` |
| libassRepairAttempted | `false` |
| libassRepairPackageManager | `none` |
| libassRepairFailureSummary | `none` |
| imageReuseConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_IMAGE_REUSE=true` |
| imageBuildConfirmation | `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_IMAGE_BUILD=true` |
| dockerDaemonStartConfirmation | `REEDITPRO_CONFIRM_TRACKA_LOCAL_DOCKER_DAEMON_START=true` |
| dockerDaemonStatus | `docker_daemon_ready` |
| dockerDaemonReady | `true` |
| dockerDaemonStartAttempted | `false` |
| dockerDaemonFailureSummary | `none` |
| dockerRuntimeStatus | `approved_repo_owned_ffmpeg_libass_metadata_only` |
| dockerRuntimeBlocker | `none` |
| dockerRuntimeDockerfile | `docker/prod/render-worker/Dockerfile` |
| dockerRuntimeSupportingDockerfile | `docker/prod/tool-readiness-worker/Dockerfile` |
| dockerRuntimeImageTag | `reeditpro-tracka-caption-runtime-path-check:local` |
| dockerRuntimeBuildStatus | `passed` |
| dockerRuntimeBuildArtifactsStatus | `passed` |
| dockerRuntimeBuildArtifactsBlocker | `none` |
| ffmpegPath | `docker://docker/prod/render-worker/Dockerfile#ffmpeg` |
| ffprobePath | `docker://docker/prod/render-worker/Dockerfile#ffprobe` |
| ffmpegVersion | `ffmpeg version 5.1.9-0+deb12u1 Copyright (c) 2000-2026 the FFmpeg developers` |
| ffprobeVersion | `ffprobe version 5.1.9-0+deb12u1 Copyright (c) 2007-2026 the FFmpeg developers` |
| assFilterPresent | `true` |
| subtitlesFilterPresent | `true` |
| libassIndicated | `true` |
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

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local Docker daemon readiness checks and explicitly confirmed repo-owned Docker FFmpeg/ffprobe/libass runtime inspection were allowed; no media input or output was used.
