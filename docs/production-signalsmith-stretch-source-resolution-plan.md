# Signalsmith Stretch Source Resolution Plan

## Purpose

Signalsmith Stretch is the launch music stretch/pitch candidate. It is now declared through a pinned source/build block in the CPU and tool-readiness worker Dockerfiles, but the image has not been built in this phase and the binary has not passed container readiness proof. This record keeps the remaining blocker actionable without pretending the tool is executable or product-ready.

## Current Source Status

- Tool id: `signalsmith_stretch`
- Launch role: bounded music time-stretch and pitch adjustment for approved timing plans.
- Current readiness state: source declaration present, runtime/container readiness missing.
- Current safe behavior: adapter command planning is metadata-only; runtime execution remains skip-first and blocked unless a later image build and container readiness gate passes.

## Official Source Evidence

- Official Signalsmith page: `https://signalsmith-audio.co.uk/code/stretch/`
- GitHub mirror: `https://github.com/Signalsmith-Audio/signalsmith-stretch`
- License: MIT for Stretch; bundled DSP library is also documented as MIT by the official source page.
- Implementation shape: C++11 header/library with an example command-line target under `cmd/`.
- Signalsmith Stretch source commit: `57b93f4e9206a089a45387eaa39bdc9f310d3308`
- Signalsmith Linear source commit: `5668673560146a9cfe38c25315071e3fd68c8317`
- Example CLI output binary name upstream: `stretch`; ReEditPro installs it as `/usr/local/bin/signalsmith-stretch` to match the readiness spec and adapter command plan.

## Source Declaration Gate

The Dockerfile declaration now provides:

1. Exact pinned source revisions for Stretch and Linear.
2. Build prerequisites isolated to a builder stage.
3. Deterministic direct `g++` build command for the `cmd` CLI without downloading example inputs.
4. Compiler-side `-include cstring` compatibility for GCC/libstdc++ because the pinned Linear header uses `std::memcpy`.
5. Non-pedantic warning flags (`-Wall -Wextra`) because the pinned Linear compatibility macro emits a pedantic semicolon warning under GCC.
6. Install path `/usr/local/bin/signalsmith-stretch`.
7. Build-time `signalsmith-stretch -v` metadata check only.

## Remaining Container Readiness Gate

A later approved readiness phase must still prove:

1. The CPU worker image builds successfully.
2. The tool-readiness worker image builds successfully.
3. `/usr/local/bin/signalsmith-stretch` exists in each intended image.
4. `signalsmith-stretch --help` or an equivalent non-media metadata check passes inside the container.
5. No media processing, no user/private media, no public artifacts, no frontend execution.

## Boundary

This plan and Dockerfile declaration do not authorize Docker builds by default, media processing, beta, production, public delivery, billing, or product-ready status. They only resolve the static source declaration path for the launch-core source gap and keep runtime/container readiness blocked until the later proof gate passes.
