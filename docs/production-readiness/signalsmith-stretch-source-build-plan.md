# Signalsmith Stretch Source Build Plan

## Decision

`signalsmith_stretch_source_build_plan_passed_ready_for_bounded_source_build_execution`

## Scope

This packet approves only the next source-build execution gate for Signalsmith Stretch. It does not install or run Signalsmith Stretch, does not process audio, does not run Docker, does not dispatch workers, and does not enable external beta or production.

## Source Evidence

- Official upstream repository: `https://github.com/Signalsmith-Audio/signalsmith-stretch`
- Upstream HEAD recorded for this review: `57b93f4e9206a089a45387eaa39bdc9f310d3308`
- License file: `LICENSE.txt`
- License classification for the source code: `MIT`
- Command-line source path: `cmd/main.cpp`
- Makefile path: `cmd/Makefile`
- CMake file path: `cmd/CMakeLists.txt`

The upstream README describes Signalsmith Stretch as a C++ pitch/time library and points to command/example material. The repository exposes a `cmd` tree with `main.cpp`, `Makefile`, and `CMakeLists.txt`. The CMake file also declares example input fetching, so the next execution gate must avoid or explicitly block that fixture fetch path.

## Approved Future Build Lane

The next gate may perform a bounded source checkout at the exact recorded or newly reviewed upstream commit, record source/license hashes, build the command target from `cmd/main.cpp`, and install the resulting binary as `signalsmith-stretch` only inside a local readiness image or approved temp build root.

The preferred build path is command-source-only and must not download example WAV files. If CMake is used, the execution gate must prove `FetchContent` example inputs are disabled or unreachable. The safer first attempt is the `cmd/Makefile` command target with repository-owned source files only.

## Blocked Scope

- No audio/media input or output processing.
- No example input download or generated audio fixture.
- No user/private/real media.
- No FFmpeg/FFprobe fallback as proof for Signalsmith Stretch.
- No SoundTouch or Rubber Band substitution as proof for Signalsmith Stretch.
- No Docker build in this metadata phase.
- No runtime worker dispatch, provider call, Supabase/GCS mutation, external beta, paid production, public artifact, signed URL, or product-ready claim.

## Readiness Meaning

This plan fixes the next step for the remaining `signalsmith_stretch` blocker. It does not count the tool as installed or product-ready. Product-ready local OSS tools remain `0`.

## Next Prompt

`SIGNALSMITH_STRETCH_BOUNDED_SOURCE_BUILD_EXECUTION`
