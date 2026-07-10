# Production Core Tool Install Plan

Milestone 10 is the first install-definition milestone for ReeditPro's production tool runtime. It upgrades CPU, render, QA, and tool-readiness container definitions for core non-GPU tools only.

## What M10 Adds

- CPU worker image declarations for FFmpeg, ffprobe, Python, PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, OpenTimelineIO, and Sharp/libvips system support.
- Render worker image declarations for Remotion runtime support, FFmpeg, ffprobe, libass, Sharp/libvips, and OpenTimelineIO handoff.
- QA worker image declarations for FFmpeg/ffprobe, OpenCV headless, Sharp/libvips, and basic Python QA imports.
- Tool-readiness worker declarations for safe command/version and import checks.
- Optional real readiness checks for CPU/render tools only.

## What M10 Does Not Add

M10 does not build Docker images, install packages on the host, deploy Cloud Run jobs, run `gcloud`, download model weights, run GPU tools, call providers, render/export user media, or make Revideo core.

GPU/model package installation moves to Milestone 11. Full container/tool validation moves to Milestone 12.
## Milestone 12 Validation

M12 validates the M10 CPU/render install definitions through the unified readiness report before any real execution milestone. FFmpeg/FFprobe, Python imports, Node package metadata, libass, and LGPL review status remain static/dry-run safe unless a human explicitly runs optional checks later.

## Milestone 15B Color Readiness

M15B uses the M10 FFmpeg readiness path for preview-only color correction and the OpenColorIO/OpenImageIO import-readiness declarations for color-management and frame transform scaffolds. OpenColorIO/OpenImageIO may be proven by safe import checks in the tool-readiness lane, but runtime media operations and production use remain manual-review gated until a later execution/legal/readiness step approves them.
