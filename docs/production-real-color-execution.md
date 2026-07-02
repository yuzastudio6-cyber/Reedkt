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
