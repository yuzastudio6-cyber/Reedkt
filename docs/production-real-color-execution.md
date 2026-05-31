# Production Real Color Execution

Milestone 15B turns color planning into a controlled server-only execution path.

The flow is:

1. validate approved snapshot, execution plan, idempotency, and private media/frame refs;
2. build honest color analysis summaries from representative frame/proxy evidence;
3. build clean-first correction, shot-match, and look transform plans;
4. prepare allowlisted FFmpeg preview command plans;
5. optionally run local-dev FFmpeg preview against safe generated/local media;
6. keep OpenColorIO/OpenImageIO readiness-gated and skip-safe;
7. write private color artifacts and emit color QA gates.

M15B does not final export, full render, call providers, deploy, run GPU jobs, run masks/background removal, run enhancement/upscaling, overwrite source/proxy media, or use Revideo.

M16A final render/export consumes private color recipe/metadata artifacts and re-checks output color-space delivery risk before final delivery.

## Activation Phase 40A Boundary

Phase 40A is a non-mutating Track A approval workflow for OpenColorIO,
OpenImageIO, and Kornia. It records official source/license evidence, ownership
scope, and risks for future generated-fixture planning only.

OpenColorIO is scoped to color management, LUT/look transforms, OCIO config
validation, color-space transforms, and ACES/config-aware validation.
OpenImageIO is scoped to image/frame I/O, metadata inspection, frame
decode/write validation, image sequence validation, and image/color format
compatibility checks. Kornia is scoped to local helper operations, image
metrics, frame-difference/quality helpers, and generated-fixture visual QA.
FFmpeg/FFprobe keeps existing video stream probe/decode, signalstats/media
validation, approved frame extraction, and export integrity scope.

Phase 40A does not install these runtimes, process images/video, build Docker
images, mutate GCP, call providers, use Revideo, create public output, or unlock
final delivery, production, external beta, paid production, or broad media.
