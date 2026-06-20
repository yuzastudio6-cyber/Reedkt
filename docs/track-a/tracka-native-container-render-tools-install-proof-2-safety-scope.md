# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2 Safety Scope

Safety scan status: `required_before_pr`

## Allowed Changes

- `docker/prod/render-worker/Dockerfile` package declarations for GStreamer base/good/tools and MKVToolNix.
- Track A docs/status packet.
- Handoff prompts.
- Diagnostics script.
- `package.json` diagnostics script.

## Blocked Changes

- `package-lock.json` mutation.
- npm package install.
- tool-readiness worker Dockerfile changes.
- Docker build or apt command execution.
- GStreamer, MKVToolNix, MP4Box, VapourSynth, Revideo, Remotion, FFmpeg, or FFprobe execution.
- Media processing or private artifact access.
- Supabase mutation, SQL execution, migration deployment, signed/public artifact creation, beta/production/final delivery unlock, worker/route/provider/model execution, browser capture, raw prompt execution, or broad service-role handler.

Exact scoped-install-source statement:

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, tool execution, media processing, Docker build, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Install-source changes, if present, were limited to Atlas Track A native/container render tool Dockerfile package declarations and were not executed.
